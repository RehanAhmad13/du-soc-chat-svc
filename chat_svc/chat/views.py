from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model, authenticate
from rest_framework.generics import GenericAPIView, CreateAPIView
from rest_framework import serializers, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from pprint import pprint
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
import csv
import io
from django.http import HttpResponse, JsonResponse
from .models import MessageLog



from .models import (
    Tenant, ChatThread, Message, QuestionTemplate,
    StructuredReply, Attachment, Device, ThreadTemplateResponse
)

from .serializers import (
    ChatThreadSerializer, MessageSerializer, QuestionTemplateSerializer,
    AttachmentSerializer, DeviceSerializer, LoginSerializer
)

from .jwt_utils import create_token
from . import integration, event_bus, push


class ObtainJWTView(GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"]
        )
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        token = create_token(user)
        return Response({"token": token})


class QuestionTemplateViewSet(viewsets.ModelViewSet):
    queryset = QuestionTemplate.objects.all()
    serializer_class = QuestionTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return QuestionTemplate.objects.all()
        return QuestionTemplate.objects.filter(
            Q(tenant_id=user.tenant_id) | Q(tenant__isnull=True)
        )


    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_staff:
            raise PermissionDenied("Only admins can create templates.")
        serializer.save(tenant_id=user.tenant_id)



class ChatThreadViewSet(viewsets.ModelViewSet):
    queryset = ChatThread.objects.all()
    serializer_class = ChatThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(tenant_id=self.request.user.tenant_id)

    def perform_create(self, serializer):
        tenant_id = self.request.user.tenant_id
        thread = serializer.save(tenant_id=tenant_id)
        event_bus.publish_event("chat-events", {
            "type": "thread_created",
            "thread_id": thread.id,
            "tenant_id": tenant_id,
            "incident_id": thread.incident_id,
        })
        tokens = Device.objects.filter(user__tenant_id=tenant_id).values_list("token", flat=True)
        push.send_push(tokens, "New thread", f"Incident {thread.incident_id}")

    @action(detail=False, methods=['post'], url_path='from-incident/(?P<incident_id>[^/.]+)')
    def from_incident(self, request, incident_id=None):
        tenant_id = request.user.tenant_id
        metadata = request.data.get('metadata', {})
        template_id = request.data.get('template')  # get selected template

        template = None
        if template_id:
            try:
                template = QuestionTemplate.objects.get(
                    Q(id=template_id),
                    Q(tenant_id=tenant_id) | Q(tenant__isnull=True)
                )
            except QuestionTemplate.DoesNotExist:
                return Response({"error": "Template not found."}, status=400)

        # Create thread and assign template
        thread = ChatThread.objects.create(
            tenant_id=tenant_id,
            incident_id=incident_id,
            template=template  # assign it to thread
        )

        # If template is valid, use it to render first message
        if template:
            try:
                content = template.render(metadata)
                Message.objects.create(thread=thread, sender=request.user, content=content)
            except ValueError:
                pass  # Skip if placeholders not filled

        event_bus.publish_event("chat-events", {
            "type": "thread_created",
            "thread_id": thread.id,
            "tenant_id": tenant_id,
            "incident_id": incident_id,
        })

        tokens = Device.objects.filter(user__tenant_id=tenant_id).values_list("token", flat=True)
        push.send_push(tokens, "New thread", f"Incident {incident_id}")

        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=["get"], url_path="export")
    def export(self, request, pk=None):
        thread = self.get_object()
        messages = thread.messages.order_by("created_at")
        data = MessageSerializer(messages, many=True).data
        return Response(data)

    @action(detail=True, methods=['post'], url_path='template-response')
    def template_response(self, request, pk=None):
        thread = self.get_object()
        if not thread.template:
            return Response({"detail": "No template assigned to this thread."}, status=400)

        data = request.data
        response, _ = ThreadTemplateResponse.objects.update_or_create(
            thread=thread, user=request.user,
            defaults={"response_data": data}
        )
        return Response({
            "user": request.user.username,
            "response_data": response.response_data,
            "created_at": response.created_at
        }, status=201)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return self.queryset.filter(thread__tenant_id=self.request.user.tenant_id)

    def perform_create(self, serializer):
        template = serializer.validated_data.pop('template', None)
        answer = serializer.validated_data.pop('answer', None)
        files = serializer.validated_data.pop('files', [])
        msg = serializer.save(sender=self.request.user)
        for f in files:
            Attachment.objects.create(message=msg, file=f)
        template = template or msg.thread.template
        if template and answer is not None:
            StructuredReply.objects.create(message=msg, template=template, answer=answer)
        integration.update_ticket_timeline(msg.thread.incident_id, msg.content)
        event_bus.publish_event("chat-events", {
            "type": "message_created",
            "message_id": msg.id,
            "thread_id": msg.thread_id,
            "tenant_id": msg.thread.tenant_id,
            "sender_id": msg.sender_id,
        })
        tokens = Device.objects.filter(user__tenant_id=msg.thread.tenant_id).exclude(user=msg.sender).values_list("token", flat=True)
        push.send_push(tokens, "New message", msg.content)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        q = request.query_params.get("q", "")
        msgs = self.queryset.filter(thread__tenant_id=request.user.tenant_id)
        if q:
            msgs = [m for m in msgs if q.lower() in m.content.lower()]
        serializer = self.get_serializer(msgs, many=True)
        return Response(serializer.data)


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return self.queryset.filter(message__thread__tenant_id=self.request.user.tenant_id)


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminThreadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChatThread.objects.all()
    serializer_class = ChatThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()

        qs = self.queryset
        tenant = self.request.query_params.get("tenant")
        incident = self.request.query_params.get("incident")
        sla = self.request.query_params.get("sla")

        if tenant:
            qs = qs.filter(tenant_id=tenant)
        if incident:
            qs = qs.filter(incident_id=incident)
        if sla in {"breached", "active"}:
            threshold = timezone.now() - timedelta(hours=settings.INCIDENT_SLA_HOURS)
            if sla == "breached":
                qs = qs.filter(created_at__lt=threshold)
            else:
                qs = qs.filter(created_at__gte=threshold)
        return qs


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return get_user_model().objects.create_user(
            tenant=None,        # Admin will assign tenant later
            is_active=False,    # Still requires admin approval
            **validated_data
        )



class RegisterView(CreateAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        print(" Incoming registration payload:", request.data)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {"message": "Account created. Awaiting admin approval before login."},
                status=status.HTTP_201_CREATED
            )

        print(" Registration failed with errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


User = get_user_model()



###############  ADMIN API ####################### 

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def manage_pending_users(request):
    User = get_user_model()

    if request.method == 'GET':
        # 1. Pending Users
        pending = User.objects.filter(is_active=False)
        pending_data = [{
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "tenant": u.tenant.name if u.tenant and u.is_active else None,
            "tenant_id": u.tenant_id if u.is_active else None
        } for u in pending]

        # 2. Tenants
        tenants = Tenant.objects.all()
        tenant_data = []

        # Map users to tenants
        active_users = User.objects.filter(is_active=True, tenant__isnull=False)
        users_by_tenant = {}
        for user in active_users:
            tid = user.tenant_id
            if tid not in users_by_tenant:
                users_by_tenant[tid] = []
            users_by_tenant[tid].append({
                "id": user.id,
                "username": user.username,
                "email": user.email
            })

        for t in tenants:
            tenant_data.append({
                "id": t.id,
                "name": t.name,
                "users": users_by_tenant.get(t.id, [])
            })

        # 3. Threads
        threads = ChatThread.objects.all()
        thread_data = [{
            "id": t.id,
            "incident_id": t.incident_id,
            "tenant_id": t.tenant_id,
            "created_at": t.created_at
        } for t in threads]

        # 4. Templates ( use serializer to include 'name')
        templates = QuestionTemplate.objects.all()
        template_data = QuestionTemplateSerializer(templates, many=True).data

        # Final response
        response = {
            "tenants": tenant_data,
            "pending_users": pending_data,
            "threads": thread_data,
            "templates": template_data
        }

        return Response(response)

    # POST: Approve a user
    user_id = request.data.get("user_id")
    tenant_id = request.data.get("tenant_id")

    if not user_id or not tenant_id:
        return Response(
            {"error": "Both 'user_id' and 'tenant_id' are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({"error": "Tenant not found."}, status=status.HTTP_404_NOT_FOUND)

    user.tenant = tenant
    user.is_active = True
    user.save()

    return Response({
        "message": f"User '{user.username}' approved and assigned to tenant '{tenant.name}'."
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_thread_logs(request, thread_id):
    format = request.GET.get("format", "json").lower()
    logs = MessageLog.objects.filter(thread_id=thread_id).order_by("timestamp")

    if not logs.exists():
        return Response({"detail": "No logs found for this thread."}, status=404)

    if format == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["message_id", "thread_id", "sender", "content", "structured", "timestamp", "version"])
        for log in logs:
            writer.writerow([
                log.message_id,
                log.thread_id,
                log.sender.username,
                log.content,
                json.dumps(log.structured or {}),
                log.timestamp.isoformat(),
                log.version,
            ])
        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f"attachment; filename=thread_{thread_id}_logs.csv"
        return response

    # JSON fallback
    data = [{
        "message_id": log.message_id,
        "thread_id": log.thread_id,
        "sender": log.sender.username,
        "content": log.content,
        "structured": log.structured,
        "timestamp": log.timestamp.isoformat(),
        "version": log.version,
    } for log in logs]

    return JsonResponse(data, safe=False)

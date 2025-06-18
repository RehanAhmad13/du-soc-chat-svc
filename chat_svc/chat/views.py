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
        return self.queryset.filter(tenant_id=self.request.user.tenant_id)

    def perform_create(self, serializer):
        serializer.save(tenant_id=self.request.user.tenant_id)


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
        thread = ChatThread.objects.create(tenant_id=tenant_id, incident_id=incident_id)
        templates = QuestionTemplate.objects.filter(tenant_id=tenant_id)
        for tmpl in templates:
            try:
                content = tmpl.render(metadata)
            except ValueError:
                continue
            Message.objects.create(thread=thread, sender=request.user, content=content)
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
    invite_code = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ['username', 'password', 'invite_code']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        code = validated_data.pop('invite_code')
        tenant = Tenant.objects.filter(invite_code=code).first()
        if not tenant:
            raise serializers.ValidationError({'invite_code': 'Invalid invite code'})
        return get_user_model().objects.create_user(
            tenant=tenant, is_active=False, **validated_data
        )


class RegisterView(CreateAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {"message": "Account created. Awaiting admin approval before login."}
        return response


User = get_user_model()

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def manage_pending_users(request):
    if request.method == 'GET':
        pending = User.objects.filter(is_active=False)
        data = [{"id": u.id, "username": u.username, "email": u.email} for u in pending]
        return Response(data)

    if request.method == 'POST':
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.save()
            return Response({"message": f"User '{user.username}' has been approved."})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

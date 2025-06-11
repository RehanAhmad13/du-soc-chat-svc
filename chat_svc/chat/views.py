from rest_framework import viewsets, status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from .jwt_utils import create_token
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import (
    ChatThread,
    Message,
    QuestionTemplate,
    StructuredReply,
    Attachment,
)
from .serializers import (
    ChatThreadSerializer,
    MessageSerializer,
    QuestionTemplateSerializer,
    AttachmentSerializer,
)
from . import integration, event_bus
class ObtainJWTView(APIView):
    permission_classes = []
    def post(self, request):
        user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
        if not user:
            return Response({"detail": "Invalid credentials"}, status=400)
        token = create_token(user)
        return Response({"token": token})



class QuestionTemplateViewSet(viewsets.ModelViewSet):
    queryset = QuestionTemplate.objects.all()
    serializer_class = QuestionTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = self.request.user.tenant_id
        return self.queryset.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = self.request.user.tenant_id
        serializer.save(tenant_id=tenant_id)

class ChatThreadViewSet(viewsets.ModelViewSet):
    queryset = ChatThread.objects.all()
    serializer_class = ChatThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = self.request.user.tenant_id
        return self.queryset.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = self.request.user.tenant_id
        thread = serializer.save(tenant_id=tenant_id)
        event_bus.publish_event(
            "chat-events",
            {
                "type": "thread_created",
                "thread_id": thread.id,
                "tenant_id": tenant_id,
                "incident_id": thread.incident_id,
            },
        )

    @action(detail=False, methods=['post'], url_path='from-incident/(?P<incident_id>[^/.]+)')
    def from_incident(self, request, incident_id=None):
        """Create a chat thread from an incident card."""
        tenant_id = request.user.tenant_id
        metadata = request.data.get('metadata', {})
        thread = ChatThread.objects.create(tenant_id=tenant_id, incident_id=incident_id)
        templates = QuestionTemplate.objects.filter(tenant_id=tenant_id)
        for tmpl in templates:
            try:
                content = tmpl.render(metadata)
            except ValueError:
                # Skip templates with missing placeholders
                continue
            Message.objects.create(thread=thread, sender=request.user, content=content)
        event_bus.publish_event(
            "chat-events",
            {
                "type": "thread_created",
                "thread_id": thread.id,
                "tenant_id": tenant_id,
                "incident_id": incident_id,
            },
        )
        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="export")
    def export(self, request, pk=None):
        """Export all messages for this thread."""
        thread = self.get_object()
        messages = thread.messages.order_by("created_at")
        data = MessageSerializer(messages, many=True).data
        return Response(data)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = self.request.user.tenant_id
        return self.queryset.filter(thread__tenant_id=tenant_id)

    def perform_create(self, serializer):
        template = serializer.validated_data.pop('template', None)
        answer = serializer.validated_data.pop('answer', None)
        msg = serializer.save(sender=self.request.user)
        if template and answer is not None:
            StructuredReply.objects.create(message=msg, template=template, answer=answer)
        integration.update_ticket_timeline(msg.thread.incident_id, msg.content)
        event_bus.publish_event(
            "chat-events",
            {
                "type": "message_created",
                "message_id": msg.id,
                "thread_id": msg.thread_id,
                "tenant_id": msg.thread.tenant_id,
                "sender_id": msg.sender_id,
            },
        )

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """Search messages by content for the current tenant."""
        q = request.query_params.get("q", "")
        tenant_id = request.user.tenant_id
        msgs = self.queryset.filter(thread__tenant_id=tenant_id, content__icontains=q)
        serializer = self.get_serializer(msgs, many=True)
        return Response(serializer.data)


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        tenant_id = self.request.user.tenant_id
        return self.queryset.filter(message__thread__tenant_id=tenant_id)


class AdminThreadViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin view to inspect threads across tenants with SLA filtering."""

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

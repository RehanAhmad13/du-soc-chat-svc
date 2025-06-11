from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatThread, Message, QuestionTemplate, StructuredReply
from .serializers import ChatThreadSerializer, MessageSerializer, QuestionTemplateSerializer
from .integration import update_ticket_timeline


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
        serializer.save(tenant_id=tenant_id)

    @action(detail=False, methods=['post'], url_path='from-incident/(?P<incident_id>[^/.]+)')
    def from_incident(self, request, incident_id=None):
        """Create a chat thread from an incident card."""
        tenant_id = request.user.tenant_id
        thread = ChatThread.objects.create(tenant_id=tenant_id, incident_id=incident_id)
        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        update_ticket_timeline(msg.thread.incident_id, msg.content)

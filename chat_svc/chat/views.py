from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ChatThread, Message
from .serializers import ChatThreadSerializer, MessageSerializer

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

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = self.request.user.tenant_id
        return self.queryset.filter(thread__tenant_id=tenant_id)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

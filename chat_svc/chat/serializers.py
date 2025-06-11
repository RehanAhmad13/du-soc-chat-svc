from rest_framework import serializers
from .models import ChatThread, Message, QuestionTemplate, StructuredReply

class MessageSerializer(serializers.ModelSerializer):
    structured = serializers.SerializerMethodField()
    template = serializers.PrimaryKeyRelatedField(queryset=QuestionTemplate.objects.all(), write_only=True, required=False)
    answer = serializers.CharField(write_only=True, required=False)

    def get_structured(self, obj):
        if hasattr(obj, 'structured'):
            return StructuredReplySerializer(obj.structured).data
        return None

    class Meta:
        model = Message
        fields = ['id', 'thread', 'sender', 'content', 'created_at', 'structured', 'template', 'answer']
        read_only_fields = ['sender', 'created_at']

class StructuredReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = StructuredReply
        fields = ['template', 'answer']

class QuestionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionTemplate
        fields = ['id', 'tenant', 'text']
        read_only_fields = ['tenant']

class ChatThreadSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatThread
        fields = ['id', 'tenant', 'incident_id', 'created_at', 'messages']
        read_only_fields = ['tenant', 'created_at']

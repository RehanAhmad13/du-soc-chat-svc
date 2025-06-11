from rest_framework import serializers
import json
import re
import string
from .models import (
    ChatThread,
    Message,
    QuestionTemplate,
    StructuredReply,
    Attachment,
    Device,
)

class MessageSerializer(serializers.ModelSerializer):
    structured = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    template = serializers.PrimaryKeyRelatedField(queryset=QuestionTemplate.objects.all(), write_only=True, required=False)
    answer = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        template = attrs.get('template')
        answer = attrs.get('answer')
        if template and answer is None:
            raise serializers.ValidationError({'answer': 'This field is required when template is provided.'})
        if answer is not None:
            try:
                data = json.loads(answer)
            except ValueError:
                raise serializers.ValidationError({'answer': 'Must be valid JSON.'})

            schema = getattr(template, 'schema', None) if template else None
            if schema:
                for field, spec in schema.items():
                    if field not in data:
                        raise serializers.ValidationError({'answer': f"Missing field '{field}'"})
                    if spec.get('type') == 'dropdown':
                        options = spec.get('options', [])
                        if data[field] not in options:
                            raise serializers.ValidationError({'answer': f"Invalid option for '{field}'"})
        return attrs

    def get_structured(self, obj):
        if hasattr(obj, 'structured'):
            return StructuredReplySerializer(obj.structured).data
        return None

    def get_attachments(self, obj):
        return AttachmentSerializer(obj.attachments.all(), many=True).data

    class Meta:
        model = Message
        fields = ['id', 'thread', 'sender', 'content', 'created_at', 'structured', 'attachments', 'template', 'answer']
        read_only_fields = ['sender', 'created_at']

class StructuredReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = StructuredReply
        fields = ['template', 'answer']


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'message', 'file', 'checksum']
        read_only_fields = ['checksum']

class QuestionTemplateSerializer(serializers.ModelSerializer):
    def validate_text(self, value):
        formatter = string.Formatter()
        for _, field_name, _, _ in formatter.parse(value):
            if field_name and not re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', field_name):
                raise serializers.ValidationError(f"Invalid placeholder '{field_name}'")
        return value

    def validate_schema(self, value):
        if value is None:
            return value
        if not isinstance(value, dict):
            raise serializers.ValidationError('Must be an object')
        for name, spec in value.items():
            if 'type' not in spec:
                raise serializers.ValidationError(f"Field '{name}' missing type")
            if spec['type'] not in {'text', 'dropdown'}:
                raise serializers.ValidationError(f"Unsupported type '{spec['type']}'")
            if spec['type'] == 'dropdown':
                opts = spec.get('options')
                if not isinstance(opts, list) or not opts:
                    raise serializers.ValidationError(f"Field '{name}' dropdown requires options list")
        return value
    class Meta:
        model = QuestionTemplate
        fields = ['id', 'tenant', 'text', 'schema']
        read_only_fields = ['tenant']

class ChatThreadSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    sla_status = serializers.CharField(read_only=True)

    class Meta:
        model = ChatThread
        fields = ['id', 'tenant', 'incident_id', 'created_at', 'messages', 'sla_status']
        read_only_fields = ['tenant', 'created_at']


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'user', 'token', 'created_at']
        read_only_fields = ['user', 'created_at']

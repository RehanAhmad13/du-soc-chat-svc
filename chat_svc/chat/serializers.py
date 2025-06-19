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
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    template = serializers.PrimaryKeyRelatedField(
        queryset=QuestionTemplate.objects.all(),
        required=False,
        allow_null=True
    )

    answer = serializers.CharField(write_only=True, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        initial_data = getattr(self, 'initial_data', {})

        if request and request.method == "POST":
            # Attempt to get thread
            thread = None
            thread_id = initial_data.get('thread')
            if thread_id:
                try:
                    from .models import ChatThread
                    thread = ChatThread.objects.select_related('template').get(id=thread_id)
                except ChatThread.DoesNotExist:
                    pass

                if thread and thread.template:
                    schema = thread.template.schema or {}
                    fields = ', '.join(schema.keys())
                    self.fields['answer'].help_text = f"Expected JSON with fields: {fields}"
                    self.fields['answer'].initial = json.dumps({k: "" for k in schema.keys()}, indent=2)

    def validate(self, attrs):
        thread = attrs.get('thread')
        template = attrs.get('template')
        answer = attrs.get('answer')

        # Infer thread template if not explicitly passed
        if thread and not template:
            template = thread.template
            attrs['template'] = template

        if template and answer is None:
            raise serializers.ValidationError({
                'answer': 'This field is required when template is provided.'
            })

        if answer is not None:
            try:
                data = json.loads(answer)
            except ValueError:
                raise serializers.ValidationError({'answer': 'Must be valid JSON.'})

            if thread and thread.template and template != thread.template:
                raise serializers.ValidationError({
                    'template': 'Template does not match the thread’s assigned template.'
                })

            schema = getattr(template, 'schema', None)
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
            from .serializers import StructuredReplySerializer
            return StructuredReplySerializer(obj.structured).data
        return None

    def get_attachments(self, obj):
        from .serializers import AttachmentSerializer
        return AttachmentSerializer(obj.attachments.all(), many=True).data

    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'content', 'created_at',
            'structured', 'attachments', 'template', 'answer', 'files'
        ]
        read_only_fields = ['sender', 'created_at']


class StructuredReplySerializer(serializers.ModelSerializer):
    parsed_answer = serializers.SerializerMethodField()

    def get_parsed_answer(self, obj):
        try:
            return json.loads(obj.answer)
        except Exception:
            return None  # fallback if something goes wrong

    class Meta:
        model = StructuredReply
        fields = ['template', 'answer', 'parsed_answer']


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
        fields = ['id', 'tenant', 'name', 'text', 'schema']  # include 'name'
        read_only_fields = ['tenant']



class ChatThreadSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    sla_status = serializers.CharField(read_only=True)

    # Show dropdown in DRF UI and allow None
    template_id = serializers.PrimaryKeyRelatedField(
        source='template',
        queryset=QuestionTemplate.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        default=None
    )

    template = serializers.SerializerMethodField()
    template_responses = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = [
            'id', 'tenant', 'incident_id', 'created_at',
            'messages', 'sla_status',
            'template', 'template_id',
            'template_responses'
        ]
        read_only_fields = ['tenant', 'created_at']

    def validate(self, attrs):
        request = self.context.get("request")
        tenant = request.user.tenant if request else None
        incident_id = attrs.get("incident_id")

        if tenant and incident_id:
            exists = ChatThread.objects.filter(
                tenant=tenant,
                incident_id=incident_id
            ).exists()
            if exists:
                raise serializers.ValidationError({
                    "incident_id": "A thread with this Incident ID already exists for your organization."
                })
        return attrs

    def get_template(self, obj):
        if obj.template:
            return {
                "id": obj.template.id,
                "name": obj.template.name,     
                "text": obj.template.text,     
                "schema": obj.template.schema
            }


    def get_template_responses(self, obj):
        return [
            {
                "user": r.user.username,
                "response_data": r.response_data,
                "created_at": r.created_at
            }
            for r in obj.template_responses.all()
        ]




class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'user', 'token', 'created_at']
        read_only_fields = ['user', 'created_at']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
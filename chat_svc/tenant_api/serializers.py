from rest_framework import serializers
import json
import re
import string
from chat_svc.models import (
    ChatThread,
    Message,
    QuestionTemplate,
    StructuredReply,
    Attachment,
    Device,
    User,
    ReadReceipt,
    ThreadTemplateResponse,
)


class MessageSerializer(serializers.ModelSerializer):
    structured = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    sender = serializers.CharField(source='sender.username', read_only=True)
    read_receipts = serializers.SerializerMethodField()
    read_by = serializers.SerializerMethodField()
    read_count = serializers.SerializerMethodField()
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
            return StructuredReplySerializer(obj.structured).data
        return None

    def get_attachments(self, obj):
        return AttachmentSerializer(obj.attachments.all(), many=True).data

    def get_read_receipts(self, obj):
        """Get detailed read receipt information"""
        receipts = obj.receipts.select_related('user').all()
        return [
            {
                'user': receipt.user.username,
                'timestamp': receipt.timestamp,
            }
            for receipt in receipts
        ]

    def get_read_by(self, obj):
        """Get list of usernames who have read this message"""
        return list(obj.receipts.values_list('user__username', flat=True))

    def get_read_count(self, obj):
        """Get count of users who have read this message"""
        return obj.receipts.count()

    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'content', 'created_at',
            'structured', 'attachments', 'template', 'answer', 'files',
            'read_receipts', 'read_by', 'read_count'
        ]
        read_only_fields = ['created_at']


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


class ReadReceiptSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ReadReceipt
        fields = ['message', 'user', 'timestamp']
        read_only_fields = ['timestamp']


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
    messages = serializers.SerializerMethodField()
    sla_status = serializers.CharField(read_only=True)
    unread_count = serializers.SerializerMethodField()
    total_messages = serializers.SerializerMethodField()
    last_read_at = serializers.SerializerMethodField()

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
            'template_responses',
            'unread_count', 'total_messages', 'last_read_at'
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
        return None


    def get_messages(self, obj):
        """Get messages ordered chronologically by created_at"""
        messages = obj.messages.order_by('created_at')
        return MessageSerializer(messages, many=True, context=self.context).data

    def get_template_responses(self, obj):
        return [
            {
                "user": r.user.username,
                "response_data": r.response_data,
                "created_at": r.created_at
            }
            for r in obj.template_responses.all()
        ]

    def get_unread_count(self, obj):
        """Get count of unread messages for the current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        # Count messages not read by current user
        from django.db.models import Q
        unread_messages = obj.messages.exclude(
            Q(receipts__user=request.user) | Q(sender=request.user)
        ).count()
        return unread_messages

    def get_total_messages(self, obj):
        """Get total message count in thread"""
        return obj.messages.count()

    def get_last_read_at(self, obj):
        """Get timestamp of last message read by current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        last_receipt = obj.messages.filter(
            receipts__user=request.user
        ).order_by('-receipts__timestamp').first()
        
        if last_receipt:
            receipt = last_receipt.receipts.filter(user=request.user).first()
            return receipt.timestamp if receipt else None
        return None




class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'user', 'token', 'created_at']
        read_only_fields = ['user', 'created_at']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for admin interface"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        from django.contrib.auth import get_user_model
        model = get_user_model()
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'date_joined', 'last_login',
            'tenant', 'tenant_name'
        ]
        read_only_fields = ['date_joined', 'last_login']
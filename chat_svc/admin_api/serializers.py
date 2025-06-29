from rest_framework import serializers
from django.contrib.auth import get_user_model
from chat_svc.models import Tenant, ChatThread, QuestionTemplate, MessageLog
import json

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'tenant', 'tenant_name'
        ]
        read_only_fields = ['date_joined', 'last_login']


class AdminTenantSerializer(serializers.ModelSerializer):
    """Serializer for tenant management"""
    users = AdminUserSerializer(many=True, read_only=True)
    user_count = serializers.SerializerMethodField()
    
    def get_user_count(self, obj):
        return obj.users.filter(is_active=True).count()
    
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'users', 'user_count']


class AdminThreadSerializer(serializers.ModelSerializer):
    """Serializer for admin thread management"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    message_count = serializers.SerializerMethodField()
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    class Meta:
        model = ChatThread
        fields = [
            'id', 'tenant', 'tenant_name', 'incident_id', 'created_at',
            'sla_status', 'message_count', 'template'
        ]


class AdminQuestionTemplateSerializer(serializers.ModelSerializer):
    """Serializer for admin template management"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    usage_count = serializers.SerializerMethodField()
    
    def get_usage_count(self, obj):
        return obj.threads.count()
    
    class Meta:
        model = QuestionTemplate
        fields = ['id', 'tenant', 'tenant_name', 'name', 'text', 'schema', 'usage_count']


class UserApprovalSerializer(serializers.Serializer):
    """Serializer for user approval operations"""
    user_id = serializers.IntegerField()
    tenant_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value, is_active=False)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or already active")
    
    def validate_tenant_id(self, value):
        try:
            Tenant.objects.get(id=value)
            return value
        except Tenant.DoesNotExist:
            raise serializers.ValidationError("Tenant not found")


class MessageLogSerializer(serializers.ModelSerializer):
    """Serializer for message log export"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = MessageLog
        fields = [
            'id', 'message_id', 'thread_id', 'sender_username', 'content',
            'structured', 'timestamp', 'version'
        ]
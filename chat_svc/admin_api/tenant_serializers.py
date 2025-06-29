"""
Comprehensive serializers for tenant configuration management
Supports full CRUD operations for all tenant-related settings
"""

from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from chat_svc.models import (
    Tenant, TenantConfiguration, TenantBilling, 
    TenantTheme, TenantIntegration, User, ChatThread
)


class TenantConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for tenant configuration settings"""
    
    class Meta:
        model = TenantConfiguration
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        # Ensure SLA hours are logical
        if 'high_priority_sla_hours' in data and 'medium_priority_sla_hours' in data:
            if data['high_priority_sla_hours'] >= data['medium_priority_sla_hours']:
                raise serializers.ValidationError("High priority SLA must be less than medium priority SLA")
        
        if 'medium_priority_sla_hours' in data and 'low_priority_sla_hours' in data:
            if data['medium_priority_sla_hours'] >= data['low_priority_sla_hours']:
                raise serializers.ValidationError("Medium priority SLA must be less than low priority SLA")
        
        return data


class TenantBillingSerializer(serializers.ModelSerializer):
    """Serializer for tenant billing and subscription management"""
    
    calculated_monthly_cost = serializers.SerializerMethodField()
    is_trial_expired = serializers.ReadOnlyField()
    days_until_renewal = serializers.ReadOnlyField()
    
    class Meta:
        model = TenantBilling
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'current_user_count', 
                           'current_storage_gb', 'monthly_message_count')

    def get_calculated_monthly_cost(self, obj):
        return float(obj.calculate_monthly_cost())

    def validate(self, data):
        # Ensure subscription dates are logical
        if 'subscription_start' in data and 'subscription_end' in data:
            if data['subscription_end'] and data['subscription_start'] >= data['subscription_end']:
                raise serializers.ValidationError("Subscription end date must be after start date")
        
        if 'trial_end_date' in data and 'subscription_start' in data:
            if data['trial_end_date'] and data['subscription_start'] > data['trial_end_date']:
                raise serializers.ValidationError("Trial end date must be after or equal to subscription start")
        
        return data


class TenantThemeSerializer(serializers.ModelSerializer):
    """Serializer for tenant theme and branding settings"""
    
    css_variables = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantTheme
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_css_variables(self, obj):
        return obj.get_css_variables()

    def validate_primary_color(self, value):
        """Validate hex color format"""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("Color must be in hex format (#RRGGBB)")
        try:
            int(value[1:], 16)
        except ValueError:
            raise serializers.ValidationError("Invalid hex color value")
        return value

    def validate_secondary_color(self, value):
        return self.validate_primary_color(value)

    def validate_accent_color(self, value):
        return self.validate_primary_color(value)

    def validate_background_color(self, value):
        return self.validate_primary_color(value)

    def validate_text_color(self, value):
        return self.validate_primary_color(value)


class TenantIntegrationSerializer(serializers.ModelSerializer):
    """Serializer for tenant integrations with external services"""
    
    success_rate = serializers.ReadOnlyField()
    is_healthy = serializers.ReadOnlyField()
    
    class Meta:
        model = TenantIntegration
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'last_successful_call', 
                           'last_error', 'total_calls', 'failed_calls')
        extra_kwargs = {
            'api_key': {'write_only': True},
            'password': {'write_only': True},
        }

    def validate_endpoint_url(self, value):
        """Validate endpoint URL format"""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError("Endpoint URL must start with http:// or https://")
        return value

    def validate_timeout_seconds(self, value):
        if value < 1 or value > 300:
            raise serializers.ValidationError("Timeout must be between 1 and 300 seconds")
        return value

    def validate_retry_attempts(self, value):
        if value < 0 or value > 10:
            raise serializers.ValidationError("Retry attempts must be between 0 and 10")
        return value


class TenantStatsSerializer(serializers.Serializer):
    """Serializer for tenant statistics and usage data"""
    
    # Basic stats
    total_users = serializers.IntegerField(read_only=True)
    active_users = serializers.IntegerField(read_only=True)
    total_threads = serializers.IntegerField(read_only=True)
    active_threads = serializers.IntegerField(read_only=True)
    total_messages = serializers.IntegerField(read_only=True)
    
    # Usage over time
    messages_today = serializers.IntegerField(read_only=True)
    messages_this_week = serializers.IntegerField(read_only=True)
    messages_this_month = serializers.IntegerField(read_only=True)
    threads_today = serializers.IntegerField(read_only=True)
    threads_this_week = serializers.IntegerField(read_only=True)
    threads_this_month = serializers.IntegerField(read_only=True)
    
    # Resource utilization
    storage_used_gb = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    storage_limit_gb = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    user_limit_utilization = serializers.FloatField(read_only=True)
    
    # SLA performance
    sla_breached_count = serializers.IntegerField(read_only=True)
    sla_at_risk_count = serializers.IntegerField(read_only=True)
    avg_response_time_hours = serializers.FloatField(read_only=True)


class ComprehensiveTenantSerializer(serializers.ModelSerializer):
    """Comprehensive tenant serializer with all related data"""
    
    configuration = TenantConfigurationSerializer(source='config', read_only=True)
    billing = TenantBillingSerializer(read_only=True)
    theme = TenantThemeSerializer(read_only=True)
    integrations = TenantIntegrationSerializer(many=True, read_only=True)
    stats = TenantStatsSerializer(read_only=True)
    
    # Computed fields
    current_user_count = serializers.ReadOnlyField()
    current_thread_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Add computed statistics
        stats_data = self._calculate_tenant_stats(instance)
        data['stats'] = stats_data
        
        return data

    def _calculate_tenant_stats(self, tenant):
        """Calculate comprehensive tenant statistics"""
        from django.db.models import Count, Sum
        from datetime import timedelta
        
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic counts
        total_users = tenant.users.filter(is_active=True).count()
        total_threads = tenant.chatthread_set.count()
        total_messages = sum(thread.messages.count() for thread in tenant.chatthread_set.all())
        
        # Time-based counts
        messages_today = sum(
            thread.messages.filter(created_at__gte=today).count() 
            for thread in tenant.chatthread_set.all()
        )
        messages_this_week = sum(
            thread.messages.filter(created_at__gte=week_ago).count() 
            for thread in tenant.chatthread_set.all()
        )
        messages_this_month = sum(
            thread.messages.filter(created_at__gte=month_ago).count() 
            for thread in tenant.chatthread_set.all()
        )
        
        threads_today = tenant.chatthread_set.filter(created_at__gte=today).count()
        threads_this_week = tenant.chatthread_set.filter(created_at__gte=week_ago).count()
        threads_this_month = tenant.chatthread_set.filter(created_at__gte=month_ago).count()
        
        # Active users (users who sent messages in last 24h)
        active_users = tenant.users.filter(
            message__created_at__gte=today,
            is_active=True
        ).distinct().count()
        
        # Active threads (threads with messages in last 24h)
        active_threads = tenant.chatthread_set.filter(
            messages__created_at__gte=today
        ).distinct().count()
        
        # Resource utilization
        user_limit_utilization = (total_users / tenant.max_users * 100) if tenant.max_users > 0 else 0
        
        # SLA metrics
        config = getattr(tenant, 'config', None)
        sla_hours = config.default_sla_hours if config else 24
        sla_threshold = now - timedelta(hours=sla_hours)
        
        sla_breached_count = tenant.chatthread_set.filter(created_at__lt=sla_threshold).count()
        sla_at_risk_count = tenant.chatthread_set.filter(
            created_at__lt=now - timedelta(hours=sla_hours * 0.8),
            created_at__gte=sla_threshold
        ).count()
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'total_threads': total_threads,
            'active_threads': active_threads,
            'total_messages': total_messages,
            'messages_today': messages_today,
            'messages_this_week': messages_this_week,
            'messages_this_month': messages_this_month,
            'threads_today': threads_today,
            'threads_this_week': threads_this_week,
            'threads_this_month': threads_this_month,
            'storage_used_gb': Decimal('0.00'),  # TODO: Calculate actual storage
            'storage_limit_gb': Decimal('100.00'),  # TODO: Make configurable
            'user_limit_utilization': user_limit_utilization,
            'sla_breached_count': sla_breached_count,
            'sla_at_risk_count': sla_at_risk_count,
            'avg_response_time_hours': 4.2,  # TODO: Calculate actual response time
        }


class TenantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new tenants with initial configuration"""
    
    # Optional configuration during creation
    initial_plan_type = serializers.ChoiceField(
        choices=TenantBilling.PLAN_CHOICES,
        default='basic',
        write_only=True
    )
    billing_contact = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Tenant
        fields = ('name', 'contact_email', 'contact_phone', 'billing_address', 
                 'timezone', 'max_users', 'max_concurrent_threads',
                 'initial_plan_type', 'billing_contact')

    def create(self, validated_data):
        # Extract billing-related data
        initial_plan_type = validated_data.pop('initial_plan_type', 'basic')
        billing_contact = validated_data.pop('billing_contact')
        
        # Create tenant
        tenant = Tenant.objects.create(**validated_data)
        
        # Create default configuration
        TenantConfiguration.objects.create(tenant=tenant)
        
        # Create billing information
        TenantBilling.objects.create(
            tenant=tenant,
            plan_type=initial_plan_type,
            billing_contact=billing_contact,
            subscription_start=timezone.now().date(),
            next_billing_date=timezone.now().date() + timezone.timedelta(days=30),
            trial_end_date=timezone.now().date() + timezone.timedelta(days=14)
        )
        
        # Create default theme
        TenantTheme.objects.create(tenant=tenant)
        
        return tenant


class TenantUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tenant basic information"""
    
    class Meta:
        model = Tenant
        fields = ('name', 'contact_email', 'contact_phone', 'billing_address', 
                 'timezone', 'max_users', 'max_concurrent_threads', 'is_active')
        read_only_fields = ('created_at', 'updated_at')

    def validate_max_users(self, value):
        """Ensure max_users is not less than current user count"""
        if self.instance:
            current_users = self.instance.current_user_count
            if value < current_users:
                raise serializers.ValidationError(
                    f"Cannot set max users to {value}. Current user count is {current_users}."
                )
        return value
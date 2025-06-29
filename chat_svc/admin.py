from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    User, Tenant, ChatThread, Message, QuestionTemplate, 
    ThreadTemplateResponse, StructuredReply, ReadReceipt, 
    Attachment, Device, MessageLog, TenantConfiguration,
    TenantBilling, TenantTheme, TenantIntegration
)


# Define inline classes first
class TenantConfigurationInline(admin.StackedInline):
    model = TenantConfiguration
    extra = 0
    fieldsets = [
        ('SLA Configuration', {
            'fields': ('default_sla_hours', 'high_priority_sla_hours', 'medium_priority_sla_hours', 'low_priority_sla_hours')
        }),
        ('Escalation Settings', {
            'fields': ('enable_auto_escalation', 'escalation_warning_hours', 'escalation_email')
        }),
        ('Data Retention', {
            'fields': ('message_retention_days', 'attachment_retention_days', 'log_retention_days'),
            'classes': ('collapse',)
        }),
        ('Feature Flags', {
            'fields': ('enable_file_attachments', 'enable_structured_replies', 'enable_read_receipts', 
                      'enable_push_notifications', 'enable_audit_logging'),
            'classes': ('collapse',)
        }),
        ('Resource Limits', {
            'fields': ('max_attachment_size_mb', 'max_message_length', 'rate_limit_messages_per_minute'),
            'classes': ('collapse',)
        })
    ]


class TenantBillingInline(admin.StackedInline):
    model = TenantBilling
    extra = 0
    fieldsets = [
        ('Subscription', {
            'fields': ('plan_type', 'billing_cycle', 'status')
        }),
        ('Pricing', {
            'fields': ('monthly_cost', 'per_user_cost', 'setup_fee')
        }),
        ('Billing Dates', {
            'fields': ('subscription_start', 'subscription_end', 'next_billing_date', 'trial_end_date')
        }),
        ('Payment', {
            'fields': ('payment_method', 'billing_contact', 'invoice_frequency'),
            'classes': ('collapse',)
        }),
        ('Usage Tracking', {
            'fields': ('current_user_count', 'current_storage_gb', 'monthly_message_count'),
            'classes': ('collapse',)
        })
    ]


class TenantThemeInline(admin.StackedInline):
    model = TenantTheme
    extra = 0
    fieldsets = [
        ('Branding', {
            'fields': ('company_name', 'logo_url', 'favicon_url')
        }),
        ('Colors', {
            'fields': ('primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color'),
            'classes': ('collapse',)
        }),
        ('Typography', {
            'fields': ('font_family', 'header_font_size', 'body_font_size'),
            'classes': ('collapse',)
        }),
        ('Layout', {
            'fields': ('sidebar_width', 'header_height', 'border_radius'),
            'classes': ('collapse',)
        }),
        ('Custom Styling', {
            'fields': ('custom_css',),
            'classes': ('collapse',)
        }),
        ('Email Branding', {
            'fields': ('email_header_color', 'email_footer_text'),
            'classes': ('collapse',)
        })
    ]


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'is_active', 'user_count', 'thread_count', 'billing_status', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_email']
    readonly_fields = ['user_count', 'thread_count', 'current_user_count', 'current_thread_count', 'created_at', 'updated_at']
    inlines = [TenantConfigurationInline, TenantBillingInline, TenantThemeInline]
    
    fieldsets = [
        ('Basic Information', {
            'fields': ('name', 'is_active', 'timezone')
        }),
        ('Contact Details', {
            'fields': ('contact_email', 'contact_phone', 'billing_address')
        }),
        ('Resource Limits', {
            'fields': ('max_users', 'max_concurrent_threads')
        }),
        ('Statistics', {
            'fields': ('user_count', 'thread_count', 'current_user_count', 'current_thread_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    ]
    
    def user_count(self, obj):
        return obj.users.count()
    user_count.short_description = 'Total Users'
    
    def thread_count(self, obj):
        return obj.chatthread_set.count()
    thread_count.short_description = 'Total Threads'
    
    def billing_status(self, obj):
        if hasattr(obj, 'billing'):
            status = obj.billing.status
            color = {'active': 'green', 'trial': 'orange', 'suspended': 'red', 'cancelled': 'gray'}.get(status, 'black')
            return format_html('<span style="color: {};">{}</span>', color, status.title())
        return 'No Billing'
    billing_status.short_description = 'Billing Status'


@admin.register(TenantConfiguration)
class TenantConfigurationAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'default_sla_hours', 'enable_auto_escalation', 'message_retention_days', 'updated_at']
    list_filter = ['enable_auto_escalation', 'enable_file_attachments', 'enable_push_notifications']
    search_fields = ['tenant__name']
    
    fieldsets = [
        ('SLA Configuration', {
            'fields': ('tenant', 'default_sla_hours', 'high_priority_sla_hours', 'medium_priority_sla_hours', 'low_priority_sla_hours')
        }),
        ('Escalation Settings', {
            'fields': ('enable_auto_escalation', 'escalation_warning_hours', 'escalation_email')
        }),
        ('Data Retention', {
            'fields': ('message_retention_days', 'attachment_retention_days', 'log_retention_days')
        }),
        ('Feature Flags', {
            'fields': ('enable_file_attachments', 'enable_structured_replies', 'enable_read_receipts', 
                      'enable_push_notifications', 'enable_audit_logging')
        }),
        ('Resource Limits', {
            'fields': ('max_attachment_size_mb', 'max_message_length', 'rate_limit_messages_per_minute')
        })
    ]


@admin.register(TenantBilling)
class TenantBillingAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'plan_type', 'status', 'monthly_cost_display', 'next_billing_date', 'days_until_renewal']
    list_filter = ['plan_type', 'status', 'billing_cycle']
    search_fields = ['tenant__name', 'billing_contact']
    readonly_fields = ['days_until_renewal', 'is_trial_expired', 'calculate_monthly_cost']
    
    fieldsets = [
        ('Tenant & Plan', {
            'fields': ('tenant', 'plan_type', 'billing_cycle', 'status')
        }),
        ('Pricing', {
            'fields': ('monthly_cost', 'per_user_cost', 'setup_fee', 'calculate_monthly_cost')
        }),
        ('Billing Dates', {
            'fields': ('subscription_start', 'subscription_end', 'next_billing_date', 'trial_end_date', 'days_until_renewal', 'is_trial_expired')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'billing_contact', 'invoice_frequency')
        }),
        ('Usage Tracking', {
            'fields': ('current_user_count', 'current_storage_gb', 'monthly_message_count')
        })
    ]
    
    def monthly_cost_display(self, obj):
        return f"${obj.calculate_monthly_cost():.2f}"
    monthly_cost_display.short_description = 'Monthly Cost'


@admin.register(TenantTheme)
class TenantThemeAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'company_name', 'primary_color', 'updated_at']
    search_fields = ['tenant__name', 'company_name']
    
    fieldsets = [
        ('Basic Information', {
            'fields': ('tenant', 'company_name')
        }),
        ('Branding Assets', {
            'fields': ('logo_url', 'favicon_url')
        }),
        ('Color Scheme', {
            'fields': ('primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color')
        }),
        ('Typography', {
            'fields': ('font_family', 'header_font_size', 'body_font_size')
        }),
        ('Layout Settings', {
            'fields': ('sidebar_width', 'header_height', 'border_radius')
        }),
        ('Custom Styling', {
            'fields': ('custom_css',)
        }),
        ('Email Branding', {
            'fields': ('email_header_color', 'email_footer_text')
        })
    ]


@admin.register(TenantIntegration)
class TenantIntegrationAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'integration_type', 'name', 'is_enabled', 'health_status', 'success_rate_display', 'last_successful_call']
    list_filter = ['integration_type', 'is_enabled', 'tenant']
    search_fields = ['tenant__name', 'name', 'endpoint_url']
    readonly_fields = ['success_rate', 'is_healthy', 'total_calls', 'failed_calls', 'last_successful_call']
    
    fieldsets = [
        ('Basic Information', {
            'fields': ('tenant', 'integration_type', 'name', 'is_enabled')
        }),
        ('Connection Settings', {
            'fields': ('endpoint_url', 'api_key', 'username', 'password', 'timeout_seconds', 'retry_attempts')
        }),
        ('Configuration', {
            'fields': ('config_data', 'event_filters')
        }),
        ('Statistics', {
            'fields': ('success_rate', 'is_healthy', 'total_calls', 'failed_calls', 'last_successful_call', 'last_error'),
            'classes': ('collapse',)
        })
    ]
    
    def health_status(self, obj):
        if obj.is_healthy:
            return format_html('<span style="color: green;">✓ Healthy</span>')
        else:
            return format_html('<span style="color: red;">✗ Unhealthy</span>')
    health_status.short_description = 'Health'
    
    def success_rate_display(self, obj):
        rate = obj.success_rate
        color = 'green' if rate >= 95 else 'orange' if rate >= 80 else 'red'
        return format_html('<span style="color: {};">{:.1f}%</span>', color, rate)
    success_rate_display.short_description = 'Success Rate'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'tenant_link', 'is_active', 'is_staff', 'date_joined', 'thread_count', 'message_count']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'tenant', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'tenant__name']
    readonly_fields = ['date_joined', 'last_login', 'thread_count', 'message_count']
    
    # Add tenant to the fieldsets
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Tenant Information', {'fields': ('tenant', 'thread_count', 'message_count')}),
    )
    
    def tenant_link(self, obj):
        if obj.tenant:
            url = reverse('admin:chat_svc_tenant_change', args=[obj.tenant.id])
            return format_html('<a href="{}">{}</a>', url, obj.tenant.name)
        return 'No Tenant'
    tenant_link.short_description = 'Tenant'
    tenant_link.admin_order_field = 'tenant__name'
    
    def thread_count(self, obj):
        # Count unique threads where user has sent messages
        return obj.message_set.values('thread').distinct().count()
    thread_count.short_description = 'Threads'
    
    def message_count(self, obj):
        return obj.message_set.count()
    message_count.short_description = 'Messages'


@admin.register(QuestionTemplate)
class QuestionTemplateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'tenant_link', 'usage_count', 'schema_fields', 'created_info']
    list_filter = ['tenant', 'name']
    search_fields = ['name', 'text', 'tenant__name']
    readonly_fields = ['usage_count', 'schema_fields']
    
    fieldsets = [
        ('Basic Information', {
            'fields': ('name', 'tenant', 'text')
        }),
        ('Schema Configuration', {
            'fields': ('schema',),
            'classes': ('collapse',)
        }),
        ('Usage Statistics', {
            'fields': ('usage_count', 'schema_fields'),
            'classes': ('collapse',)
        })
    ]
    
    def tenant_link(self, obj):
        if obj.tenant:
            url = reverse('admin:chat_svc_tenant_change', args=[obj.tenant.id])
            return format_html('<a href="{}">{}</a>', url, obj.tenant.name)
        return 'Global Template'
    tenant_link.short_description = 'Tenant'
    tenant_link.admin_order_field = 'tenant__name'
    
    def usage_count(self, obj):
        return obj.threads.count()
    usage_count.short_description = 'Thread Usage'
    
    def schema_fields(self, obj):
        if obj.schema and isinstance(obj.schema, dict):
            properties = obj.schema.get('properties', {})
            return len(properties)
        return 0
    schema_fields.short_description = 'Schema Fields'
    
    def created_info(self, obj):
        return f"ID: {obj.id}"
    created_info.short_description = 'Info'


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ['id', 'incident_id', 'tenant_link', 'template_link', 'message_count', 'sla_status', 'created_at']
    list_filter = ['tenant', 'template', 'created_at']
    search_fields = ['incident_id', 'tenant__name', 'template__name']
    readonly_fields = ['message_count', 'sla_status', 'created_at']
    date_hierarchy = 'created_at'
    
    def tenant_link(self, obj):
        url = reverse('admin:chat_svc_tenant_change', args=[obj.tenant.id])
        return format_html('<a href="{}">{}</a>', url, obj.tenant.name)
    tenant_link.short_description = 'Tenant'
    tenant_link.admin_order_field = 'tenant__name'
    
    def template_link(self, obj):
        if obj.template:
            url = reverse('admin:chat_svc_questiontemplate_change', args=[obj.template.id])
            return format_html('<a href="{}">{}</a>', url, obj.template.name)
        return 'No Template'
    template_link.short_description = 'Template'
    template_link.admin_order_field = 'template__name'
    
    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'
    
    def sla_status(self, obj):
        status = obj.sla_status
        color = 'red' if status == 'breached' else 'green'
        return format_html('<span style="color: {};">{}</span>', color, status.title())
    sla_status.short_description = 'SLA Status'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread_link', 'sender_link', 'content_preview', 'has_attachments', 'created_at']
    list_filter = ['thread__tenant', 'sender', 'created_at']
    search_fields = ['content', 'thread__incident_id', 'sender__username']
    readonly_fields = ['hash', 'previous_hash', 'created_at', 'attachment_count']
    date_hierarchy = 'created_at'
    
    fieldsets = [
        ('Message Details', {
            'fields': ('thread', 'sender', 'content', 'created_at')
        }),
        ('Security & Integrity', {
            'fields': ('hash', 'previous_hash'),
            'classes': ('collapse',)
        }),
        ('Attachments', {
            'fields': ('attachment_count',),
            'classes': ('collapse',)
        })
    ]
    
    def thread_link(self, obj):
        url = reverse('admin:chat_svc_chatthread_change', args=[obj.thread.id])
        return format_html('<a href="{}">{}</a>', url, f"{obj.thread.incident_id} (#{obj.thread.id})")
    thread_link.short_description = 'Thread'
    thread_link.admin_order_field = 'thread__incident_id'
    
    def sender_link(self, obj):
        url = reverse('admin:chat_svc_user_change', args=[obj.sender.id])
        return format_html('<a href="{}">{}</a>', url, obj.sender.username)
    sender_link.short_description = 'Sender'
    sender_link.admin_order_field = 'sender__username'
    
    def content_preview(self, obj):
        content = obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
        return content
    content_preview.short_description = 'Content Preview'
    
    def has_attachments(self, obj):
        count = obj.attachments.count()
        if count > 0:
            return format_html('<span style="color: green;">✓ ({})</span>', count)
        return format_html('<span style="color: gray;">✗</span>')
    has_attachments.short_description = 'Attachments'
    
    def attachment_count(self, obj):
        return obj.attachments.count()
    attachment_count.short_description = 'Attachment Count'


@admin.register(ThreadTemplateResponse)
class ThreadTemplateResponseAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread_link', 'user_link', 'response_preview', 'created_at']
    list_filter = ['thread__tenant', 'user', 'created_at']
    search_fields = ['thread__incident_id', 'user__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def thread_link(self, obj):
        url = reverse('admin:chat_svc_chatthread_change', args=[obj.thread.id])
        return format_html('<a href="{}">{}</a>', url, f"{obj.thread.incident_id} (#{obj.thread.id})")
    thread_link.short_description = 'Thread'
    
    def user_link(self, obj):
        url = reverse('admin:chat_svc_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def response_preview(self, obj):
        if isinstance(obj.response_data, dict):
            return f"{len(obj.response_data)} fields"
        return str(obj.response_data)[:50] + '...' if len(str(obj.response_data)) > 50 else str(obj.response_data)
    response_preview.short_description = 'Response Data'


@admin.register(StructuredReply)
class StructuredReplyAdmin(admin.ModelAdmin):
    list_display = ['id', 'message_link', 'template_link', 'answer_preview']
    list_filter = ['template', 'message__thread__tenant']
    search_fields = ['answer', 'template__name', 'message__thread__incident_id']
    
    def message_link(self, obj):
        url = reverse('admin:chat_svc_message_change', args=[obj.message.id])
        return format_html('<a href="{}">{}</a>', url, f"Message #{obj.message.id}")
    message_link.short_description = 'Message'
    
    def template_link(self, obj):
        url = reverse('admin:chat_svc_questiontemplate_change', args=[obj.template.id])
        return format_html('<a href="{}">{}</a>', url, obj.template.name)
    template_link.short_description = 'Template'
    
    def answer_preview(self, obj):
        return obj.answer[:100] + '...' if len(obj.answer) > 100 else obj.answer
    answer_preview.short_description = 'Answer Preview'


@admin.register(ReadReceipt)
class ReadReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'message_link', 'user_link', 'timestamp']
    list_filter = ['user', 'timestamp', 'message__thread__tenant']
    search_fields = ['user__username', 'message__thread__incident_id']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def message_link(self, obj):
        url = reverse('admin:chat_svc_message_change', args=[obj.message.id])
        return format_html('<a href="{}">{}</a>', url, f"Message #{obj.message.id}")
    message_link.short_description = 'Message'
    
    def user_link(self, obj):
        url = reverse('admin:chat_svc_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message_link', 'file_name', 'file_size', 'checksum_preview']
    list_filter = ['message__thread__tenant', 'message__created_at']
    search_fields = ['file', 'message__thread__incident_id']
    readonly_fields = ['checksum']
    
    def message_link(self, obj):
        url = reverse('admin:chat_svc_message_change', args=[obj.message.id])
        return format_html('<a href="{}">{}</a>', url, f"Message #{obj.message.id}")
    message_link.short_description = 'Message'
    
    def file_name(self, obj):
        return obj.file.name.split('/')[-1] if obj.file else 'No file'
    file_name.short_description = 'File Name'
    
    def file_size(self, obj):
        if obj.file:
            try:
                size = obj.file.size
                if size < 1024:
                    return f"{size} B"
                elif size < 1024*1024:
                    return f"{size/1024:.1f} KB"
                else:
                    return f"{size/(1024*1024):.1f} MB"
            except:
                return "Unknown"
        return "No file"
    file_size.short_description = 'File Size'
    
    def checksum_preview(self, obj):
        return obj.checksum[:16] + '...' if obj.checksum else 'No checksum'
    checksum_preview.short_description = 'Checksum'


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_link', 'token_preview', 'created_at']
    list_filter = ['user', 'created_at']
    search_fields = ['user__username', 'token']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def user_link(self, obj):
        url = reverse('admin:chat_svc_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    
    def token_preview(self, obj):
        return obj.token[:16] + '...' if len(obj.token) > 16 else obj.token
    token_preview.short_description = 'Token Preview'


@admin.register(MessageLog)
class MessageLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'message_link', 'thread_link', 'sender_link', 'version', 'timestamp']
    list_filter = ['sender', 'timestamp', 'version', 'thread__tenant']
    search_fields = ['content', 'thread__incident_id', 'sender__username']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def message_link(self, obj):
        url = reverse('admin:chat_svc_message_change', args=[obj.message.id])
        return format_html('<a href="{}">{}</a>', url, f"Message #{obj.message.id}")
    message_link.short_description = 'Message'
    
    def thread_link(self, obj):
        url = reverse('admin:chat_svc_chatthread_change', args=[obj.thread.id])
        return format_html('<a href="{}">{}</a>', url, f"{obj.thread.incident_id} (#{obj.thread.id})")
    thread_link.short_description = 'Thread'
    
    def sender_link(self, obj):
        url = reverse('admin:chat_svc_user_change', args=[obj.sender.id])
        return format_html('<a href="{}">{}</a>', url, obj.sender.username)
    sender_link.short_description = 'Sender'


# Customize the admin site header and title
admin.site.site_header = "SOC Chat Service Administration"
admin.site.site_title = "SOC Chat Admin"
admin.site.index_title = "Welcome to SOC Chat Service Administration"
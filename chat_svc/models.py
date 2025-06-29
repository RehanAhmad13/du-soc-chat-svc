from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from integrations.encryption import EncryptedTextField
from integrations.encrypted_storage import EncryptedFileSystemStorage


class Tenant(models.Model):
    class Meta:
        app_label = 'chat_svc'
    
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Contact Information
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    
    # Basic Configuration
    timezone = models.CharField(max_length=50, default='UTC')
    max_users = models.PositiveIntegerField(default=100)
    max_concurrent_threads = models.PositiveIntegerField(default=50)
    
    def __str__(self):
        return self.name
    
    @property
    def current_user_count(self):
        return self.users.filter(is_active=True).count()
    
    @property
    def current_thread_count(self):
        return self.chatthread_set.filter(
            created_at__gte=timezone.now().replace(hour=0, minute=0, second=0)
        ).count()


class TenantConfiguration(models.Model):
    """Extended configuration settings for tenants"""
    class Meta:
        app_label = 'chat_svc'
    
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='config')
    
    # SLA Settings
    default_sla_hours = models.PositiveIntegerField(default=24)
    high_priority_sla_hours = models.PositiveIntegerField(default=4)
    medium_priority_sla_hours = models.PositiveIntegerField(default=12)
    low_priority_sla_hours = models.PositiveIntegerField(default=48)
    
    # Escalation Settings
    enable_auto_escalation = models.BooleanField(default=True)
    escalation_warning_hours = models.PositiveIntegerField(default=2)
    escalation_email = models.EmailField(blank=True, null=True)
    
    # Data Retention
    message_retention_days = models.PositiveIntegerField(default=365)
    attachment_retention_days = models.PositiveIntegerField(default=90)
    log_retention_days = models.PositiveIntegerField(default=1095)  # 3 years
    
    # Feature Flags
    enable_file_attachments = models.BooleanField(default=True)
    enable_structured_replies = models.BooleanField(default=True)
    enable_read_receipts = models.BooleanField(default=True)
    enable_push_notifications = models.BooleanField(default=True)
    enable_audit_logging = models.BooleanField(default=True)
    
    # Resource Limits
    max_attachment_size_mb = models.PositiveIntegerField(default=10)
    max_message_length = models.PositiveIntegerField(default=5000)
    rate_limit_messages_per_minute = models.PositiveIntegerField(default=60)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class TenantBilling(models.Model):
    """Billing and subscription management for tenants"""
    class Meta:
        app_label = 'chat_svc'
    
    PLAN_CHOICES = [
        ('basic', 'Basic Plan'),
        ('professional', 'Professional Plan'),
        ('enterprise', 'Enterprise Plan'),
        ('custom', 'Custom Plan'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('cancelled', 'Cancelled'),
        ('trial', 'Trial'),
    ]
    
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='billing')
    
    # Subscription Details
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='basic')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='monthly')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    
    # Pricing
    monthly_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    per_user_cost = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    setup_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Billing Dates
    subscription_start = models.DateField()
    subscription_end = models.DateField(null=True, blank=True)
    next_billing_date = models.DateField()
    trial_end_date = models.DateField(null=True, blank=True)
    
    # Payment Information
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    billing_contact = models.EmailField()
    invoice_frequency = models.CharField(max_length=20, default='monthly')
    
    # Usage Tracking
    current_user_count = models.PositiveIntegerField(default=0)
    current_storage_gb = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    monthly_message_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_monthly_cost(self):
        """Calculate total monthly cost based on plan and usage"""
        base_cost = self.monthly_cost
        user_cost = self.per_user_cost * self.current_user_count
        return base_cost + user_cost
    
    @property
    def is_trial_expired(self):
        if self.trial_end_date and self.status == 'trial':
            return timezone.now().date() > self.trial_end_date
        return False
    
    @property
    def days_until_renewal(self):
        if self.next_billing_date:
            delta = self.next_billing_date - timezone.now().date()
            return max(0, delta.days)
        return 0


class TenantTheme(models.Model):
    """Custom branding and theme settings for tenants"""
    class Meta:
        app_label = 'chat_svc'
    
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='theme')
    
    # Branding
    company_name = models.CharField(max_length=255, blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    favicon_url = models.URLField(blank=True, null=True)
    
    # Color Scheme
    primary_color = models.CharField(max_length=7, default='#1976d2')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#dc004e')
    accent_color = models.CharField(max_length=7, default='#f57c00')
    background_color = models.CharField(max_length=7, default='#ffffff')
    text_color = models.CharField(max_length=7, default='#333333')
    
    # Typography
    font_family = models.CharField(max_length=100, default='Roboto, sans-serif')
    header_font_size = models.PositiveIntegerField(default=16)
    body_font_size = models.PositiveIntegerField(default=14)
    
    # Layout
    sidebar_width = models.PositiveIntegerField(default=280)
    header_height = models.PositiveIntegerField(default=64)
    border_radius = models.PositiveIntegerField(default=4)
    
    # Custom CSS
    custom_css = models.TextField(blank=True, null=True)
    
    # Email Branding
    email_header_color = models.CharField(max_length=7, default='#1976d2')
    email_footer_text = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_css_variables(self):
        """Generate CSS custom properties for the theme"""
        return {
            '--primary-color': self.primary_color,
            '--secondary-color': self.secondary_color,
            '--accent-color': self.accent_color,
            '--background-color': self.background_color,
            '--text-color': self.text_color,
            '--font-family': self.font_family,
            '--header-font-size': f'{self.header_font_size}px',
            '--body-font-size': f'{self.body_font_size}px',
            '--sidebar-width': f'{self.sidebar_width}px',
            '--header-height': f'{self.header_height}px',
            '--border-radius': f'{self.border_radius}px',
        }


class TenantIntegration(models.Model):
    """Integration settings for external services"""
    
    INTEGRATION_TYPES = [
        ('itsm', 'IT Service Management'),
        ('event_bus', 'Event Bus'),
        ('push_notifications', 'Push Notifications'),
        ('email', 'Email Service'),
        ('sms', 'SMS Service'),
        ('webhook', 'Webhook'),
        ('api', 'External API'),
        ('siem', 'SIEM Integration'),
        ('monitoring', 'Monitoring System'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='integrations')
    integration_type = models.CharField(max_length=30, choices=INTEGRATION_TYPES)
    name = models.CharField(max_length=100)
    is_enabled = models.BooleanField(default=False)
    
    # Connection Settings
    endpoint_url = models.URLField(blank=True, null=True)
    api_key = EncryptedTextField(blank=True, null=True)
    username = models.CharField(max_length=100, blank=True, null=True)
    password = EncryptedTextField(blank=True, null=True)
    
    # Configuration
    config_data = models.JSONField(default=dict)
    timeout_seconds = models.PositiveIntegerField(default=30)
    retry_attempts = models.PositiveIntegerField(default=3)
    
    # Event Filters
    event_filters = models.JSONField(default=dict, help_text="JSON filters for when to trigger this integration")
    
    # Status
    last_successful_call = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, null=True)
    total_calls = models.PositiveIntegerField(default=0)
    failed_calls = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'chat_svc'
        unique_together = ('tenant', 'integration_type', 'name')
    
    def __str__(self):
        return f"{self.tenant.name} - {self.get_integration_type_display()}: {self.name}"
    
    @property
    def success_rate(self):
        if self.total_calls == 0:
            return 0
        return ((self.total_calls - self.failed_calls) / self.total_calls) * 100
    
    @property
    def is_healthy(self):
        return self.success_rate >= 95 and (
            not self.last_error or 
            (self.last_successful_call and self.last_successful_call > timezone.now() - timezone.timedelta(hours=24))
        )


class User(AbstractUser):
    """Custom user tied to a tenant."""
    class Meta:
        app_label = 'chat_svc'
    
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="users", null=True
    )

    def __str__(self):
        return self.username


class QuestionTemplate(models.Model):
    """Reusable global template for structured questions."""
    class Meta:
        app_label = 'chat_svc'
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True)
    name = models.CharField(
        max_length=100,
        help_text="Short, human-friendly template name",
        null=False,
        blank=False,
    )
    text = models.CharField(max_length=500)
    schema = models.JSONField(blank=True, null=True, default=dict)

    def render(self, context: dict) -> str:
        """Substitute placeholders in the template using the given context."""
        import string
        formatter = string.Formatter()
        try:
            return formatter.vformat(self.text, (), context)
        except KeyError as exc:
            missing = exc.args[0]
            raise ValueError(f"Missing placeholder '{missing}' in context") from exc

    def __str__(self):
        return f"{self.name}"


class ChatThread(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    incident_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    template = models.ForeignKey(
        QuestionTemplate, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="threads"
    )

    class Meta:
        app_label = 'chat_svc'
        unique_together = ("tenant", "incident_id")  

    def __str__(self):
        if self.template:
            return f"{self.incident_id} (Thread #{self.id}, Template: {self.template.text})"
        return f"{self.incident_id} (Thread #{self.id})"

    @property
    def sla_status(self) -> str:
        from django.conf import settings
        from django.utils import timezone
        from datetime import timedelta
        hours = getattr(settings, "INCIDENT_SLA_HOURS", 24)
        due = self.created_at + timedelta(hours=hours)
        return "breached" if timezone.now() > due else "active"


class ThreadTemplateResponse(models.Model):
    class Meta:
        app_label = 'chat_svc'
        unique_together = ("thread", "user")
    
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="template_responses")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    response_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    class Meta:
        app_label = 'chat_svc'
        ordering = ['created_at']
    
    thread = models.ForeignKey(ChatThread, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = EncryptedTextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    previous_hash = models.CharField(max_length=64, blank=True)
    hash = models.CharField(max_length=64, blank=True)

    def save(self, *args, **kwargs):
        if not self.hash:
            prev = (
                Message.objects.filter(thread=self.thread)
                .order_by("-created_at")
                .first()
            )
            prev_hash = prev.hash if prev else ""
            self.previous_hash = prev_hash
            import hashlib

            sha = hashlib.sha256()
            sha.update((prev_hash + str(self.sender_id) + self.content).encode())
            self.hash = sha.hexdigest()
        super().save(*args, **kwargs)


class StructuredReply(models.Model):
    """Structured reply to a question template tied to a message."""
    class Meta:
        app_label = 'chat_svc'
    
    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='structured')
    template = models.ForeignKey(QuestionTemplate, on_delete=models.CASCADE)
    answer = EncryptedTextField()


class ReadReceipt(models.Model):
    """Track when a user has read a message."""
    message = models.ForeignKey(Message, related_name="receipts", on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'chat_svc'
        unique_together = ("message", "user")


class Attachment(models.Model):
    """File attachment linked to a message."""
    class Meta:
        app_label = 'chat_svc'
    
    message = models.ForeignKey(
        Message, related_name="attachments", on_delete=models.CASCADE
    )
    file = models.FileField(
        upload_to="attachments/",
        storage=EncryptedFileSystemStorage(),
    )
    checksum = models.CharField(max_length=64, editable=False, blank=True)

    def save(self, *args, **kwargs):
        if self.file and not self.checksum:
            import hashlib
            from django.core.files.base import ContentFile

            data = self.file.read()
            sha = hashlib.sha256()
            sha.update(data)
            self.checksum = sha.hexdigest()
            self.file = ContentFile(data, name=self.file.name)
        super().save(*args, **kwargs)


class Device(models.Model):
    """Mobile device token for push notifications."""
    user = models.ForeignKey(User, related_name="devices", on_delete=models.CASCADE)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'chat_svc'
        unique_together = ("user", "token")

    def __str__(self) -> str:
        return f"{self.user}:{self.token[:8]}"


class MessageLog(models.Model):
    class Meta:
        app_label = 'chat_svc'
        ordering = ['timestamp']
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="logs")
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = EncryptedTextField(blank=True)
    structured = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    version = models.PositiveIntegerField()
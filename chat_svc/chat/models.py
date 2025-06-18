from django.db import models
from django.contrib.auth.models import AbstractUser
from .encrypted_storage import EncryptedFileSystemStorage
from .encrypted_fields import EncryptedTextField


class Tenant(models.Model):
    name = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=64, unique=True, default='', blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.invite_code:
            import secrets
            self.invite_code = secrets.token_hex(8)
        super().save(*args, **kwargs)


class User(AbstractUser):
    """Custom user tied to a tenant."""
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="users", null=True
    )

    def __str__(self):
        return self.username

# chat/models.py

class QuestionTemplate(models.Model):
    """Reusable global template for structured questions."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True)
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
        return self.text


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


class ThreadTemplateResponse(models.Model):  # 👈 ADD THIS NEW MODEL
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="template_responses")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    response_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("thread", "user")


class Message(models.Model):
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
    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='structured')
    template = models.ForeignKey(QuestionTemplate, on_delete=models.CASCADE)
    answer = EncryptedTextField()


class ReadReceipt(models.Model):
    """Track when a user has read a message."""
    message = models.ForeignKey(Message, related_name="receipts", on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")


class Attachment(models.Model):
    """File attachment linked to a message."""
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
        unique_together = ("user", "token")

    def __str__(self) -> str:
        return f"{self.user}:{self.token[:8]}"

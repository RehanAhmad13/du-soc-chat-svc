from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Tenant(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class ChatThread(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    incident_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    thread = models.ForeignKey(ChatThread, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class QuestionTemplate(models.Model):
    """Reusable template for structured questions."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    text = models.CharField(max_length=500)

    def __str__(self):
        return self.text

class StructuredReply(models.Model):
    """Structured reply to a question template tied to a message."""
    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='structured')
    template = models.ForeignKey(QuestionTemplate, on_delete=models.CASCADE)
    answer = models.TextField()

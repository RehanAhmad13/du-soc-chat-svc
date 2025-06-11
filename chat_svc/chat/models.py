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

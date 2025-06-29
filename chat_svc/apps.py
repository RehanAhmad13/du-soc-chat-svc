from django.apps import AppConfig


class ChatSvcConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat_svc'
    verbose_name = 'Chat Service Core'
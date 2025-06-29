from django.apps import AppConfig


class ChatApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat_svc.chat_api'
    verbose_name = 'Chat API'
    
    def ready(self):
        # Import any signal handlers or startup code here
        pass
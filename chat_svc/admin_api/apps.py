from django.apps import AppConfig


class AdminApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat_svc.admin_api'
    verbose_name = 'Admin API'
    
    def ready(self):
        # Import any signal handlers or startup code here
        pass
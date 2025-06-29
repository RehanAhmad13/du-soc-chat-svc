from django.apps import AppConfig


class TenantApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat_svc.tenant_api'
    verbose_name = 'Tenant API'
    
    def ready(self):
        # Import any signal handlers or startup code here
        pass
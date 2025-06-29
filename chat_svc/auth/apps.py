from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'auth'
    label = 'chat_auth'  # Avoid conflicts with Django's built-in auth
    
    def ready(self):
        """Initialize any startup hooks when the app is ready."""
        # Import signal handlers if any
        pass
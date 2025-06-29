"""
ASGI config for Django Chat Service.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

# Set default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings.development')

# Initialize Django
django.setup()

# Import routing after Django setup
from chat_api import routing

# Import JWT authentication middleware
from auth.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": get_asgi_application(),
    
    # WebSocket routing with JWT authentication middleware
    "websocket": JWTAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(routing.websocket_urlpatterns)
        )
    ),
})

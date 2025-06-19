# chat_svc/asgi.py

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings')
django.setup()

from chat_svc import routing
from channels.auth import AuthMiddlewareStack
from chat_svc.chat.jwt_middleware import JWTAuthMiddleware  # Your custom JWT middleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  #  Wrap with your JWTAuthMiddleware
        AuthMiddlewareStack(
            URLRouter(routing.websocket_urlpatterns)
        )
    ),
})

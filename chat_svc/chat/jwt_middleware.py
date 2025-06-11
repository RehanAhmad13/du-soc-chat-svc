from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .jwt_utils import decode_token

class JWTAuthMiddleware:
    """Authenticate WebSocket connections via ?token=<jwt>."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        token = None
        if "token" in query:
            token = query["token"][0]
        user = None
        if token:
            user = await database_sync_to_async(decode_token)(token)
        scope["user"] = user if user else AnonymousUser()
        return await self.inner(scope, receive, send)

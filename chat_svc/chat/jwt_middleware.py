# jwt_middleware.py

from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .jwt_utils import decode_token
import logging

logger = logging.getLogger(__name__)

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        token = None
        if "token" in query:
            token = query["token"][0]
        logger.info(f"[JWTAuthMiddleware] Token from query: {token}")

        user = None
        if token:
            user = await database_sync_to_async(decode_token)(token)
            logger.info(f"[JWTAuthMiddleware] Decoded user: {user}")

        scope["user"] = user if user else AnonymousUser()
        return await self.inner(scope, receive, send)

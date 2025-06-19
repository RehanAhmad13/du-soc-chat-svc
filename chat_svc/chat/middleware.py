from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async

class TokenAuthMiddleware:
    """Simple token auth via query string ?token=<key>."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        token_key = None
        if "token" in query:
            token_key = query["token"][0]
        if token_key:
            try:
                token = await database_sync_to_async(Token.objects.get)(key=token_key)
                scope["user"] = token.user
            except Token.DoesNotExist:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()
        return await self.inner(scope, receive, send)

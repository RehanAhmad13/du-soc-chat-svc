"""
Authentication middleware for Django Channels WebSocket connections.
"""

import logging
from urllib.parse import parse_qs
from typing import Optional
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from .jwt_utils import get_user_from_token

logger = logging.getLogger(__name__)


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for Django Channels.
    
    Authenticates WebSocket connections using JWT tokens provided in:
    1. Query string parameter: ?token=<jwt_token>
    2. Authorization header (if supported by the client)
    """
    
    async def __call__(self, scope, receive, send):
        """Process the WebSocket connection and authenticate the user."""
        scope = dict(scope)
        
        # Extract token from various sources
        token = await self._extract_token(scope)
        
        # Authenticate user from token
        user = await self._authenticate_user(token) if token else None
        
        # Set user in scope (AnonymousUser if authentication failed)
        scope['user'] = user if user else AnonymousUser()
        
        # Log authentication result
        if user:
            logger.info(f"[WebSocket] User {user.username} authenticated successfully")
        else:
            logger.warning(f"[WebSocket] Authentication failed for token: {token[:20] if token else 'None'}...")
        
        return await super().__call__(scope, receive, send)
    
    async def _extract_token(self, scope) -> Optional[str]:
        """
        Extract JWT token from WebSocket connection.
        
        Supports multiple token sources:
        1. Query string: ?token=<jwt_token>
        2. Subprotocol: Sec-WebSocket-Protocol header
        3. Headers: Authorization header (if available)
        """
        # Method 1: Query string parameter
        query_string = scope.get("query_string", b"").decode()
        if query_string:
            query_params = parse_qs(query_string)
            if "token" in query_params:
                token = query_params["token"][0]
                logger.debug(f"[WebSocket] Token extracted from query string")
                return token
        
        # Method 2: WebSocket subprotocol (some clients support this)
        subprotocols = scope.get("subprotocols", [])
        for subprotocol in subprotocols:
            if subprotocol.startswith("jwt."):
                token = subprotocol[4:]  # Remove "jwt." prefix
                logger.debug(f"[WebSocket] Token extracted from subprotocol")
                return token
        
        # Method 3: Authorization header (if available in headers)
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization")
        if auth_header:
            auth_value = auth_header.decode()
            if auth_value.startswith("Bearer "):
                token = auth_value.split("Bearer ")[1]
                logger.debug(f"[WebSocket] Token extracted from Authorization header")
                return token
        
        logger.debug(f"[WebSocket] No token found in connection")
        return None
    
    @database_sync_to_async
    def _authenticate_user(self, token: str):
        """
        Authenticate user from JWT token (database sync to async wrapper).
        """
        if not token:
            return None
        
        try:
            user = get_user_from_token(token)
            if user and user.is_active:
                return user
        except Exception as e:
            logger.error(f"[WebSocket] Authentication error: {e}")
        
        return None


class TokenAuthMiddleware(JWTAuthMiddleware):
    """
    Alias for JWTAuthMiddleware for backward compatibility.
    """
    pass


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create a middleware stack with JWT authentication.
    
    Usage:
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddlewareStack(
                URLRouter([
                    # your websocket routes
                ])
            ),
        })
    """
    return JWTAuthMiddleware(inner)


class StrictJWTAuthMiddleware(BaseMiddleware):
    """
    Strict JWT authentication middleware that rejects unauthenticated connections.
    
    Unlike JWTAuthMiddleware, this middleware will close the connection
    if no valid authentication is provided.
    """
    
    async def __call__(self, scope, receive, send):
        """Process and authenticate WebSocket connection strictly."""
        scope = dict(scope)
        
        # Extract and validate token
        token = await self._extract_token(scope)
        user = await self._authenticate_user(token) if token else None
        
        if not user:
            logger.warning(f"[WebSocket] Rejecting unauthenticated connection")
            # Close the connection immediately
            await send({
                "type": "websocket.close",
                "code": 4001,  # Custom close code for authentication failure
            })
            return
        
        scope['user'] = user
        logger.info(f"[WebSocket] Strict authentication successful for user: {user.username}")
        
        return await super().__call__(scope, receive, send)
    
    async def _extract_token(self, scope):
        """Extract token (same logic as JWTAuthMiddleware)."""
        middleware = JWTAuthMiddleware(None)
        return await middleware._extract_token(scope)
    
    async def _authenticate_user(self, token):
        """Authenticate user (same logic as JWTAuthMiddleware)."""
        middleware = JWTAuthMiddleware(None)
        return await middleware._authenticate_user(token)


class TenantJWTAuthMiddleware(JWTAuthMiddleware):
    """
    JWT authentication middleware with tenant isolation for WebSockets.
    
    Ensures that WebSocket connections are isolated by tenant.
    """
    
    @database_sync_to_async
    def _authenticate_user(self, token: str):
        """Authenticate user and verify tenant assignment."""
        user = super()._authenticate_user(token)
        if not user:
            return None
        
        # Skip tenant check for superusers
        if user.is_superuser:
            return user
        
        # Verify user has a tenant assigned
        if not hasattr(user, 'tenant_id') or user.tenant_id is None:
            logger.warning(f"[WebSocket] User {user.username} has no tenant assigned")
            return None
        
        return user
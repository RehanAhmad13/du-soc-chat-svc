"""
Django REST Framework authentication classes for JWT-based authentication.
"""

import logging
from typing import Optional, Tuple
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user
from django.contrib.auth.models import AnonymousUser
from django.http import HttpRequest
from .jwt_utils import extract_token_from_header, get_user_from_token

logger = logging.getLogger(__name__)


class JWTAuthentication(BaseAuthentication):
    """
    JWT-based authentication for Django REST Framework.
    
    Supports:
    - Bearer token authentication via Authorization header
    - Fallback to session authentication for browsable API
    - Configurable public routes that don't require authentication
    """
    
    # Routes that don't require authentication
    PUBLIC_ROUTES = [
        '/api/auth/login/',
        '/api/auth/register/', 
        '/api/tenant/auth/login/',
        '/api/tenant/auth/register/',
        '/health/',
        '/swagger/',
        '/redoc/',
        '/api/schema/',
    ]
    
    def authenticate(self, request: HttpRequest) -> Optional[Tuple]:
        """
        Authenticate the request and return a two-tuple of (user, token).
        
        Returns None if authentication should be skipped (public route).
        Raises AuthenticationFailed if authentication fails.
        """
        # Skip authentication for public routes
        if self._is_public_route(request.path):
            return None
        
        # Try JWT authentication first
        user = self._authenticate_jwt(request)
        if user:
            return (user, None)
        
        # Fallback to session authentication for browsable API
        if self._should_allow_session_auth(request):
            session_user = self._authenticate_session(request)
            if session_user:
                return (session_user, None)
        
        # No valid authentication found
        raise AuthenticationFailed('Authentication credentials were not provided or are invalid.')
    
    def _is_public_route(self, path: str) -> bool:
        """Check if the given path is a public route."""
        return any(path.startswith(route) for route in self.PUBLIC_ROUTES)
    
    def _authenticate_jwt(self, request: HttpRequest):
        """Authenticate using JWT token from Authorization header."""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        token = extract_token_from_header(auth_header)
        if not token:
            logger.warning("Invalid Authorization header format")
            return None
        
        user = get_user_from_token(token)
        if not user:
            logger.warning("Invalid or expired JWT token")
            return None
        
        logger.debug(f"JWT authentication successful for user: {user.username}")
        return user
    
    def _authenticate_session(self, request: HttpRequest):
        """Authenticate using Django session (fallback for browsable API)."""
        try:
            session_user = get_user(request)
            if session_user and session_user.is_authenticated:
                logger.debug(f"Session authentication successful for user: {session_user.username}")
                return session_user
        except Exception as e:
            logger.warning(f"Session authentication failed: {e}")
        
        return None
    
    def _should_allow_session_auth(self, request: HttpRequest) -> bool:
        """
        Determine if session authentication should be allowed.
        
        Generally allow for browsable API and admin interfaces.
        """
        # Allow session auth for browsable API
        if 'text/html' in request.headers.get('Accept', ''):
            return True
        
        # Allow for admin interface
        if request.path.startswith('/admin/'):
            return True
        
        # Allow for API documentation
        if any(doc_path in request.path for doc_path in ['/swagger/', '/redoc/']):
            return True
        
        return False


class JWTOptionalAuthentication(JWTAuthentication):
    """
    Optional JWT authentication that doesn't raise exceptions.
    
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    
    def authenticate(self, request: HttpRequest) -> Optional[Tuple]:
        """
        Authenticate if possible, but don't raise exceptions.
        Returns None for anonymous access.
        """
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            # Allow anonymous access
            return None


class StrictJWTAuthentication(BaseAuthentication):
    """
    Strict JWT-only authentication (no session fallback).
    
    Use this for API endpoints that should only accept JWT tokens.
    """
    
    def authenticate(self, request: HttpRequest) -> Optional[Tuple]:
        """Authenticate using only JWT tokens."""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise AuthenticationFailed('Authorization header required.')
        
        token = extract_token_from_header(auth_header)
        if not token:
            raise AuthenticationFailed('Invalid Authorization header format. Use: Bearer <token>')
        
        user = get_user_from_token(token)
        if not user:
            raise AuthenticationFailed('Invalid or expired token.')
        
        return (user, None)


class TenantJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that enforces tenant isolation.
    
    Ensures that users can only access resources within their tenant.
    """
    
    def authenticate(self, request: HttpRequest) -> Optional[Tuple]:
        """Authenticate and verify tenant access."""
        result = super().authenticate(request)
        if not result:
            return result
        
        user, token = result
        
        # Skip tenant check for superusers and staff
        if user.is_superuser or (user.is_staff and request.path.startswith('/api/admin/')):
            return result
        
        # Verify user has a tenant assigned
        if not hasattr(user, 'tenant_id') or user.tenant_id is None:
            logger.warning(f"User {user.username} has no tenant assigned")
            raise AuthenticationFailed('User has no tenant assigned.')
        
        return result
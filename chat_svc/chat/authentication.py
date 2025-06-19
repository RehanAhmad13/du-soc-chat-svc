

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user
from .jwt_utils import decode_token


class JWTAuthentication(BaseAuthentication):
    """Authenticate via JWT header or fallback to session-based user (for browsable API access)."""

    def authenticate(self, request):
        # Allow unauthenticated access to public routes
        if request.path in ['/api/chat/register/', '/api/chat/token/']:
            return None

        auth = request.headers.get('Authorization')
        if auth and auth.startswith('Bearer '):
            token = auth.split('Bearer ')[1]
            user = decode_token(token)
            if user is None:
                raise AuthenticationFailed('Invalid token')
            return (user, None)

        # DO NOT CALL request.user — use safe method
        session_user = get_user(request)
        if session_user and session_user.is_authenticated:
            return (session_user, None)

        raise AuthenticationFailed('Invalid token')

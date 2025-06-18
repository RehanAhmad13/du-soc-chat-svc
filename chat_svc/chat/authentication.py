from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .jwt_utils import decode_token


class JWTAuthentication(BaseAuthentication):
    """Authenticate via Authorization: Bearer <token>."""

    def authenticate(self, request):
        # Public endpoints that should skip JWT authentication
        open_paths = [
            '/api/chat/register/',
            '/api/chat/token/',
        ]
        if request.path in open_paths:
            return None

        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            raise AuthenticationFailed('Invalid token')

        token = auth.split('Bearer ')[1]
        user = decode_token(token)
        if user is None:
            raise AuthenticationFailed('Invalid token')

        return (user, None)

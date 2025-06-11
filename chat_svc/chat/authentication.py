from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .jwt_utils import decode_token

class JWTAuthentication(BaseAuthentication):
    """Authenticate via Authorization: Bearer <token>."""

    def authenticate(self, request):
        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            return None
        token = auth.split('Bearer ')[1]
        user = decode_token(token)
        if user is None:
            raise AuthenticationFailed('Invalid token')
        return (user, None)

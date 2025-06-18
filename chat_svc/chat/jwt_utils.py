import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model


def create_token(user, expires_in=3600):
    """Return a signed JWT for the given user."""
    payload = {
        "user_id": user.id,
        "tenant_id": user.tenant_id,
        "exp": datetime.utcnow() + timedelta(seconds=expires_in),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token):
    """Decode a JWT and return the associated user."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    User = get_user_model()
    try:
        return User.objects.get(id=payload["user_id"], tenant_id=payload["tenant_id"])
    except User.DoesNotExist:
        return None

import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model


def create_token(user, expires_in=3600):
    """Return a signed JWT for the given user."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "tenant_id": getattr(user, "tenant_id", None),
        "tenant": getattr(user.tenant, "name", None),
        "is_staff": user.is_staff,
        "exp": datetime.utcnow() + timedelta(seconds=expires_in),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

    User = get_user_model()
    try:
        # Match user by ID, ignoring tenant for superusers
        user = User.objects.get(id=payload["user_id"])
        if user.is_superuser or getattr(user, "tenant_id", None) == payload.get("tenant_id"):
            return user
    except User.DoesNotExist:
        return None

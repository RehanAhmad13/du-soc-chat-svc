from django.conf import settings
from cryptography.fernet import Fernet


def get_fernet() -> Fernet:
    """Return a Fernet instance based on FILE_ENCRYPTION_KEY."""
    key = getattr(settings, "FILE_ENCRYPTION_KEY", None)
    if isinstance(key, str):
        key = key.encode()
    if not key:
        raise ValueError("FILE_ENCRYPTION_KEY not configured")
    return Fernet(key)

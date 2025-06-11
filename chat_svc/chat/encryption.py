import base64
import os
from django.conf import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key(setting: str) -> bytes:
    key = getattr(settings, setting, None)
    if isinstance(key, str):
        key = base64.urlsafe_b64decode(key)
    if not key:
        raise ValueError(f"{setting} not configured")
    if len(key) != 32:
        raise ValueError(f"{setting} must decode to 32 bytes")
    return key


def encrypt_bytes(data: bytes) -> bytes:
    aes = AESGCM(_get_key("FILE_ENCRYPTION_KEY"))
    nonce = os.urandom(12)
    return nonce + aes.encrypt(nonce, data, None)


def decrypt_bytes(data: bytes) -> bytes:
    aes = AESGCM(_get_key("FILE_ENCRYPTION_KEY"))
    nonce = data[:12]
    ct = data[12:]
    return aes.decrypt(nonce, ct, None)


DB_PREFIX = "enc:"


def encrypt_text(value: str) -> str:
    aes = AESGCM(_get_key("DB_ENCRYPTION_KEY"))
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, value.encode(), None)
    token = nonce + ct
    return DB_PREFIX + base64.urlsafe_b64encode(token).decode()


def decrypt_text(value: str) -> str:
    if value is None:
        return value
    if not value.startswith(DB_PREFIX):
        return value
    data = base64.urlsafe_b64decode(value[len(DB_PREFIX) :])
    nonce = data[:12]
    ct = data[12:]
    aes = AESGCM(_get_key("DB_ENCRYPTION_KEY"))
    return aes.decrypt(nonce, ct, None).decode()

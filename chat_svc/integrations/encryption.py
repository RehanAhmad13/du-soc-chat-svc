import base64
import os
from django.conf import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.db import models
from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile


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


class EncryptedTextField(models.TextField):
    """TextField that automatically encrypts/decrypts values."""
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_text(value)

    def to_python(self, value):
        if isinstance(value, str):
            return decrypt_text(value)
        return value

    def get_prep_value(self, value):
        if value is None:
            return value
        return encrypt_text(value)


class EncryptedFileSystemStorage(FileSystemStorage):
    """File storage that encrypts files on disk."""
    
    def _save(self, name, content):
        if hasattr(content, 'read'):
            data = content.read()
        else:
            data = content
        
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        encrypted_data = encrypt_bytes(data)
        encrypted_content = ContentFile(encrypted_data, name)
        
        return super()._save(name, encrypted_content)
    
    def _open(self, name, mode='rb'):
        file = super()._open(name, mode)
        encrypted_data = file.read()
        decrypted_data = decrypt_bytes(encrypted_data)
        file.close()
        
        return ContentFile(decrypted_data, name)
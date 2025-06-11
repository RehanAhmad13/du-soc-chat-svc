from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile
from .encryption import encrypt_bytes, decrypt_bytes


class EncryptedFileSystemStorage(FileSystemStorage):
    """File storage that transparently encrypts files using AES-256."""

    def _save(self, name, content):
        data = content.read()
        encrypted = encrypt_bytes(data)
        content = ContentFile(encrypted)
        return super()._save(name, content)

    def open(self, name, mode='rb'):
        file = super().open(name, mode)
        data = file.read()
        file.close()
        decrypted = decrypt_bytes(data)
        return ContentFile(decrypted, name)

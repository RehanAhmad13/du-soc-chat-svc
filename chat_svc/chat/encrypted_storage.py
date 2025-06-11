from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile
from .encryption import get_fernet


class EncryptedFileSystemStorage(FileSystemStorage):
    """File storage that transparently encrypts files using Fernet."""

    def _save(self, name, content):
        data = content.read()
        encrypted = get_fernet().encrypt(data)
        content = ContentFile(encrypted)
        return super()._save(name, content)

    def open(self, name, mode='rb'):
        file = super().open(name, mode)
        data = file.read()
        file.close()
        decrypted = get_fernet().decrypt(data)
        return ContentFile(decrypted, name)

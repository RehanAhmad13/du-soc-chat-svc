from django.db import models
from .encryption import encrypt_text, decrypt_text, DB_PREFIX


class EncryptedTextField(models.TextField):
    """TextField that encrypts its value using AES-256."""

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_text(value)

    def to_python(self, value):
        if value is None:
            return value
        if isinstance(value, str) and value.startswith(DB_PREFIX):
            return decrypt_text(value)
        return value

    def get_prep_value(self, value):
        if value is None:
            return value
        if isinstance(value, str) and value.startswith(DB_PREFIX):
            return value
        return encrypt_text(value)

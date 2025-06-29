"""
Development settings for Django Chat Service.
These settings are used during local development.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database
# Use SQLite for development (easy setup, no external dependencies)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Override Redis URL for development
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Channels configuration for development
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    },
}

# CORS settings for development (more permissive)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Development-friendly logging
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['chat_api']['level'] = 'DEBUG'
LOGGING['root']['level'] = 'DEBUG'

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Development-specific apps
INSTALLED_APPS += [
    'django_extensions',  # Useful development tools
]

# Optional: Use dummy encryption keys for development if not set
if not os.environ.get("DB_ENCRYPTION_KEY"):
    import base64
    DB_ENCRYPTION_KEY = base64.urlsafe_b64encode(b'development-key-32-chars-long!').decode()
    
if not os.environ.get("FILE_ENCRYPTION_KEY"):
    import base64
    FILE_ENCRYPTION_KEY = base64.urlsafe_b64encode(b'development-file-key-32-chars!').decode()

# Django Debug Toolbar (optional, install if needed)
if DEBUG and 'django_debug_toolbar' in INSTALLED_APPS:
    MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
    INTERNAL_IPS = ['127.0.0.1', 'localhost']

# Disable some production middleware in development
MIDDLEWARE = [m for m in MIDDLEWARE if 'SecurityMiddleware' not in m]
"""
Settings module for Django Chat Service

This module automatically loads the appropriate settings based on the environment.
"""

import os

# Determine which settings module to use
environment = os.environ.get('DJANGO_ENVIRONMENT', 'development')

if environment == 'production':
    from .production import *
elif environment == 'development':
    from .development import *
else:
    from .base import *
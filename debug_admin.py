#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings.development')
current_dir = os.path.dirname(os.path.abspath(__file__))
chat_svc_dir = os.path.join(current_dir, 'chat_svc')
if chat_svc_dir not in sys.path:
    sys.path.insert(0, chat_svc_dir)

django.setup()

from django.contrib import admin
from django.apps import apps
from chat_svc.models import User, Tenant, ChatThread

print("=== Django Admin Debug Information ===")
print()

# Check if models are registered
print("1. Registered models in admin:")
if admin.site._registry:
    for model, admin_class in admin.site._registry.items():
        print(f"   {model._meta.app_label}.{model._meta.model_name}: {admin_class.__class__.__name__}")
else:
    print("   No models registered!")

print()

# Check if our models exist
print("2. Our custom models:")
try:
    print(f"   User model: {User}")
    print(f"   Tenant model: {Tenant}")
    print(f"   ChatThread model: {ChatThread}")
except Exception as e:
    print(f"   Error importing models: {e}")

print()

# Check installed apps
print("3. Installed apps:")
from django.conf import settings
for app in settings.INSTALLED_APPS:
    print(f"   {app}")

print()

# Check if admin.py is being imported
print("4. Testing admin.py import:")
try:
    import chat_svc.admin
    print("   chat_svc.admin imported successfully")
except Exception as e:
    print(f"   Error importing chat_svc.admin: {e}")

print()

# Check Django apps registry
print("5. Apps in Django registry:")
for app_config in apps.get_app_configs():
    print(f"   {app_config.name} ({app_config.label})")
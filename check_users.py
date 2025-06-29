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

from chat_svc.models import User

print("=== User Status Check ===")
print()

print("1. Total users in database:")
total_users = User.objects.count()
print(f"   {total_users} users found")

print()

print("2. Superusers:")
superusers = User.objects.filter(is_superuser=True)
if superusers.exists():
    for user in superusers:
        print(f"   {user.username} - {user.email} (Staff: {user.is_staff}, Active: {user.is_active})")
else:
    print("   No superusers found!")

print()

print("3. Staff users:")
staff_users = User.objects.filter(is_staff=True)
if staff_users.exists():
    for user in staff_users:
        print(f"   {user.username} - {user.email} (Superuser: {user.is_superuser}, Active: {user.is_active})")
else:
    print("   No staff users found!")

print()

print("4. All users:")
all_users = User.objects.all()
if all_users.exists():
    for user in all_users:
        print(f"   {user.username} - {user.email} (Staff: {user.is_staff}, Super: {user.is_superuser}, Active: {user.is_active})")
else:
    print("   No users found!")
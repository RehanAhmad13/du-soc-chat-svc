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

# Reset admin password
admin_user = User.objects.get(username='admin')
new_password = 'admin123'
admin_user.set_password(new_password)
admin_user.save()

print(f"Admin password reset to: {new_password}")
print(f"Username: admin")
print(f"Email: {admin_user.email}")
print(f"Is staff: {admin_user.is_staff}")
print(f"Is superuser: {admin_user.is_superuser}")
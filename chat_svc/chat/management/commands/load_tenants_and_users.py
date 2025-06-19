import os
import csv
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chat_svc.chat.models import Tenant

class Command(BaseCommand):
    help = "Load users and tenants from CSV after clearing all non-admin users and tenants (dev only)"

    def handle(self, *args, **kwargs):
        User = get_user_model()

        # Resolve repo root and correct CSV path
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        csv_path = os.path.join(BASE_DIR, 'tenants_users.csv')

        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV not found at: {csv_path}")

        self.stdout.write(self.style.WARNING("Deleting all non-admin users and all tenants..."))

        # Only delete users who are not named 'admin'
        User.objects.exclude(username='admin').delete()
        Tenant.objects.all().delete()

        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                tenant_name = row['tenant_name'].strip()
                username = row['username'].strip()
                password = row['password'].strip()
                email = row['email'].strip()
                is_staff = row['is_staff'].strip().lower() == 'true'
                is_active = row['is_active'].strip().lower() == 'true'

                tenant = None
                if tenant_name:
                    tenant, _ = Tenant.objects.get_or_create(name=tenant_name)

                # Avoid creating another admin if it's already present
                if username == 'admin':
                    self.stdout.write(self.style.WARNING("Skipping admin user (already exists)."))
                    continue

                User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    is_active=is_active,
                    is_staff=is_staff,
                    tenant=tenant
                )

                self.stdout.write(self.style.SUCCESS(f" Created user: {username}"))

        self.stdout.write(self.style.SUCCESS(" All tenants and users loaded successfully (admin preserved)."))

import os
import csv
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chat_svc.models import Tenant


class Command(BaseCommand):
    help = "Load users and tenants from CSV file"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='tenants_users.csv',
            help='CSV file path (default: tenants_users.csv)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing non-admin users and tenants before loading'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        csv_file = options['file']
        clear_existing = options['clear']

        # Find CSV file
        if not os.path.isabs(csv_file):
            # Look for file in project root
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            csv_path = os.path.join(base_dir, csv_file)
        else:
            csv_path = csv_file

        if not os.path.exists(csv_path):
            self.stderr.write(
                self.style.ERROR(f"CSV file not found at: {csv_path}")
            )
            return

        if clear_existing:
            self.stdout.write(
                self.style.WARNING("Clearing existing non-admin users and tenants...")
            )
            # Only delete users who are not admin/superuser
            User.objects.filter(is_superuser=False).exclude(username='admin').delete()
            Tenant.objects.all().delete()

        created_users = 0
        created_tenants = 0
        errors = 0

        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=2):  # Start at 2 for header
                try:
                    tenant_name = row.get('tenant_name', '').strip()
                    username = row.get('username', '').strip()
                    password = row.get('password', '').strip()
                    email = row.get('email', '').strip()
                    is_staff = row.get('is_staff', '').strip().lower() == 'true'
                    is_active = row.get('is_active', '').strip().lower() == 'true'

                    if not username:
                        self.stderr.write(f"Row {row_num}: Missing username")
                        errors += 1
                        continue

                    # Create or get tenant
                    tenant = None
                    if tenant_name:
                        tenant, tenant_created = Tenant.objects.get_or_create(name=tenant_name)
                        if tenant_created:
                            created_tenants += 1
                            self.stdout.write(f" Created tenant: {tenant_name}")

                    # Skip if user already exists
                    if User.objects.filter(username=username).exists():
                        self.stdout.write(f"Row {row_num}: User {username} already exists, skipping")
                        continue

                    # Create user
                    User.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        is_active=is_active,
                        is_staff=is_staff,
                        tenant=tenant
                    )
                    created_users += 1
                    self.stdout.write(f" Created user: {username}")

                except Exception as e:
                    self.stderr.write(f"Row {row_num}: Error creating user - {e}")
                    errors += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"✔ Created {created_tenants} tenants and {created_users} users"
            )
        )
        if errors > 0:
            self.stdout.write(
                self.style.WARNING(f"⚠ {errors} errors occurred during import")
            )
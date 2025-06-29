from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create a superuser with specific credentials"

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='admin', help='Username for superuser')
        parser.add_argument('--email', type=str, default='admin@chatservice.com', help='Email for superuser')
        parser.add_argument('--password', type=str, default='Netsinternational', help='Password for superuser')

    def handle(self, *args, **options):
        User = get_user_model()
        
        username = options['username']
        email = options['email']
        password = options['password']

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f"User '{username}' already exists!")
            )
            return

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"✔ Superuser '{username}' created successfully!\n"
                f"  Email: {email}\n"
                f"  Password: {password}"
            )
        )

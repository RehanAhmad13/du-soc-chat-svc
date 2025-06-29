from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chat_svc.models import Tenant, QuestionTemplate, ChatThread, Message
import json


class Command(BaseCommand):
    help = "Set up development data including tenants, users, and sample threads"

    def add_arguments(self, parser):
        parser.add_argument(
            '--with-messages',
            action='store_true',
            help='Create sample messages in threads'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        create_messages = options['with_messages']

        # Create sample tenants
        tenants_data = [
            {'name': 'Acme Corporation'},
            {'name': 'TechStart Inc'},
            {'name': 'Global Security LLC'},
        ]

        tenants = []
        for tenant_data in tenants_data:
            tenant, created = Tenant.objects.get_or_create(**tenant_data)
            tenants.append(tenant)
            if created:
                self.stdout.write(f" Created tenant: {tenant.name}")

        # Create sample users
        users_data = [
            {
                'username': 'alice_admin',
                'email': 'alice@acme.corp',
                'password': 'password123',
                'is_staff': True,
                'is_active': True,
                'tenant': tenants[0]
            },
            {
                'username': 'bob_user',
                'email': 'bob@acme.corp', 
                'password': 'password123',
                'is_staff': False,
                'is_active': True,
                'tenant': tenants[0]
            },
            {
                'username': 'charlie_analyst',
                'email': 'charlie@techstart.com',
                'password': 'password123',
                'is_staff': False,
                'is_active': True,
                'tenant': tenants[1]
            },
            {
                'username': 'david_sec',
                'email': 'david@globalsec.com',
                'password': 'password123',
                'is_staff': False,
                'is_active': True,
                'tenant': tenants[2]
            },
        ]

        users = []
        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(**user_data)
                users.append(user)
                self.stdout.write(f" Created user: {user.username}")
            else:
                users.append(User.objects.get(username=user_data['username']))

        # Create sample templates (tenant-specific)
        template_data = {
            'name': 'Security Incident Report',
            'text': 'Please provide details about the security incident on {device} at {time}. Severity: {severity}',
            'schema': {
                'device': {'type': 'text'},
                'time': {'type': 'text'},
                'severity': {'type': 'dropdown', 'options': ['Low', 'Medium', 'High', 'Critical']}
            }
        }

        for tenant in tenants:
            template, created = QuestionTemplate.objects.get_or_create(
                tenant=tenant,
                name=template_data['name'],
                defaults={
                    'text': template_data['text'],
                    'schema': template_data['schema']
                }
            )
            if created:
                self.stdout.write(f" Created template for {tenant.name}")

        # Create sample threads
        threads_data = [
            {
                'tenant': tenants[0],
                'incident_id': 'INC-2024-001',
            },
            {
                'tenant': tenants[0], 
                'incident_id': 'INC-2024-002',
            },
            {
                'tenant': tenants[1],
                'incident_id': 'SEC-2024-001',
            },
        ]

        threads = []
        for thread_data in threads_data:
            thread, created = ChatThread.objects.get_or_create(
                tenant=thread_data['tenant'],
                incident_id=thread_data['incident_id']
            )
            threads.append(thread)
            if created:
                self.stdout.write(f" Created thread: {thread.incident_id}")

        # Create sample messages if requested
        if create_messages:
            sample_messages = [
                {
                    'thread': threads[0],
                    'sender': users[0],  # alice_admin
                    'content': 'Security incident detected on server-01. Investigating potential breach.'
                },
                {
                    'thread': threads[0],
                    'sender': users[1],  # bob_user
                    'content': 'I can confirm unusual network activity around 14:30 UTC. Logs attached.'
                },
                {
                    'thread': threads[1],
                    'sender': users[0],
                    'content': 'Follow-up on yesterday\'s incident. All systems appear stable.'
                },
                {
                    'thread': threads[2],
                    'sender': users[2],  # charlie_analyst
                    'content': 'Analyzing security logs for anomalies. Will report findings shortly.'
                },
            ]

            for msg_data in sample_messages:
                message, created = Message.objects.get_or_create(
                    thread=msg_data['thread'],
                    sender=msg_data['sender'],
                    content=msg_data['content']
                )
                if created:
                    self.stdout.write(f" Created message in {message.thread.incident_id}")

        self.stdout.write(
            self.style.SUCCESS(
                f"✔ Development data setup complete! "
                f"Created {len(tenants)} tenants, {len(users)} users, {len(threads)} threads"
            )
        )
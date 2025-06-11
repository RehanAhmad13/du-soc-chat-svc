from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Tenant, ChatThread, Message

User = get_user_model()

class SimpleModelTest(TestCase):
    def test_create_thread_and_message(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice')
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-1')
        msg = Message.objects.create(thread=thread, sender=user, content='hi')
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(msg.thread, thread)
        self.assertEqual(msg.sender, user)

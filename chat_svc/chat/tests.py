from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from unittest.mock import patch
from .models import Tenant, ChatThread, Message, QuestionTemplate, StructuredReply
from .views import MessageViewSet, ChatThreadViewSet, QuestionTemplateViewSet

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

    def test_create_thread_from_incident_action(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant_id=tenant.id)
        view = ChatThreadViewSet.as_view({'post': 'from_incident'})
        factory = APIRequestFactory()
        request = factory.post('/fake')
        request.user = user
        response = view(request, incident_id='INC-2')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ChatThread.objects.filter(incident_id='INC-2').count(), 1)

    @patch('chat_svc.chat.integration.update_ticket_timeline')
    def test_message_triggers_ticket_update(self, mock_update):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice')
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-3')
        serializer = MessageViewSet.serializer_class(data={'thread': thread.id, 'content': 'hi'})
        serializer.is_valid()
        viewset = MessageViewSet()
        viewset.request = type('req', (), {'user': user})
        viewset.perform_create(serializer)
        mock_update.assert_called_with('INC-3', 'hi')

    def test_question_template_and_structured_reply(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant_id=tenant.id)
        template_view = QuestionTemplateViewSet.as_view({'post': 'create'})
        factory = APIRequestFactory()
        request = factory.post('/fake', {'text': 'Device ID?'})
        request.user = user
        response = template_view(request)
        self.assertEqual(response.status_code, 201)
        template_id = response.data['id']

        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-4')
        msg_view = MessageViewSet.as_view({'post': 'create'})
        data = {'thread': thread.id, 'content': '', 'template': template_id, 'answer': 'device123'}
        request = factory.post('/fake', data)
        request.user = user
        response = msg_view(request)
        self.assertEqual(response.status_code, 201)
        msg = Message.objects.get(id=response.data['id'])
        self.assertEqual(msg.structured.template.id, template_id)
        self.assertEqual(msg.structured.answer, 'device123')

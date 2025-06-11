from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from .models import (
    Tenant,
    ChatThread,
    Message,
    QuestionTemplate,
    StructuredReply,
    Attachment,
)
from .views import (
    MessageViewSet,
    ChatThreadViewSet,
    QuestionTemplateViewSet,
    AttachmentViewSet,
)
from .serializers import MessageSerializer

User = get_user_model()

class SimpleModelTest(TestCase):
    def test_create_thread_and_message(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-1')
        msg = Message.objects.create(thread=thread, sender=user, content='hi')
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(msg.thread, thread)
        self.assertEqual(msg.sender, user)

    def test_create_thread_from_incident_action(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
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
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-3')
        serializer = MessageViewSet.serializer_class(data={'thread': thread.id, 'content': 'hi'})
        serializer.is_valid()
        viewset = MessageViewSet()
        viewset.request = type('req', (), {'user': user})
        viewset.perform_create(serializer)
        mock_update.assert_called_with('INC-3', 'hi')

    def test_question_template_and_structured_reply(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        template_view = QuestionTemplateViewSet.as_view({'post': 'create'})
        factory = APIRequestFactory()
        request = factory.post('/fake', {'text': 'Device ID?'})
        request.user = user
        response = template_view(request)
        self.assertEqual(response.status_code, 201)
        template_id = response.data['id']

        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-4')
        msg_view = MessageViewSet.as_view({'post': 'create'})
        data = {'thread': thread.id, 'content': '', 'template': template_id, 'answer': '{"device":"device123"}'}
        request = factory.post('/fake', data)
        request.user = user
        response = msg_view(request)
        self.assertEqual(response.status_code, 201)
        msg = Message.objects.get(id=response.data['id'])
        self.assertEqual(msg.structured.template.id, template_id)
        self.assertEqual(msg.structured.answer, '{"device":"device123"}')

    def test_attachment_upload(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-5')
        msg = Message.objects.create(thread=thread, sender=user, content='log')
        view = AttachmentViewSet.as_view({'post': 'create'})
        factory = APIRequestFactory()
        file = SimpleUploadedFile('log.txt', b'data')
        request = factory.post('/fake', {'message': msg.id, 'file': file}, format='multipart')
        request.user = user
        response = view(request)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(msg.attachments.count(), 1)
        att = msg.attachments.first()
        self.assertTrue(att.checksum)

    def test_search_messages(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-6')
        Message.objects.create(thread=thread, sender=user, content='hello world')
        view = MessageViewSet.as_view({'get': 'search'})
        factory = APIRequestFactory()
        request = factory.get('/fake', {'q': 'hello'})
        request.user = user
        response = view(request)
        self.assertEqual(len(response.data), 1)

    def test_export_thread(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-7')
        Message.objects.create(thread=thread, sender=user, content='hi')
        view = ChatThreadViewSet.as_view({'get': 'export'})
        factory = APIRequestFactory()
        request = factory.get('/fake')
        request.user = user
        response = view(request, pk=thread.id)
        self.assertEqual(len(response.data), 1)

    def test_message_hash_chain(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-8')
        m1 = Message.objects.create(thread=thread, sender=user, content='first')
        m2 = Message.objects.create(thread=thread, sender=user, content='second')
        self.assertEqual(m2.previous_hash, m1.hash)

    def test_placeholder_substitution_on_thread_creation(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        QuestionTemplate.objects.create(tenant=tenant, text='Device {device_id}')
        view = ChatThreadViewSet.as_view({'post': 'from_incident'})
        factory = APIRequestFactory()
        request = factory.post('/fake', {'metadata': {'device_id': 'abc'}}, format='json')
        request.user = user
        response = view(request, incident_id='INC-9')
        self.assertEqual(response.status_code, 201)
        thread = ChatThread.objects.get(id=response.data['id'])
        self.assertEqual(thread.messages.first().content, 'Device abc')

    def test_structured_reply_json_validation(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        template = QuestionTemplate.objects.create(tenant=tenant, text='Info')
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-10')
        data = {'thread': thread.id, 'template': template.id, 'answer': '{"a":1}'}
        serializer = MessageSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        bad = {'thread': thread.id, 'template': template.id, 'answer': 'oops'}
        serializer = MessageSerializer(data=bad)
        self.assertFalse(serializer.is_valid())

    def test_question_template_validation(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        view = QuestionTemplateViewSet.as_view({'post': 'create'})
        factory = APIRequestFactory()
        request = factory.post('/fake', {'text': 'Bad {device id}'})
        request.user = user
        response = view(request)
        self.assertEqual(response.status_code, 400)

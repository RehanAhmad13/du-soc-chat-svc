from django.test import TestCase
import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from unittest.mock import patch
from . import integration
from .models import (
    Tenant,
    ChatThread,
    Message,
    QuestionTemplate,
    StructuredReply,
    Attachment,
    Device,
)
from .views import (
    MessageViewSet,
    ChatThreadViewSet,
    QuestionTemplateViewSet,
    AttachmentViewSet,
    AdminThreadViewSet,
    DeviceViewSet,
)
from .jwt_utils import create_token
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

    def test_message_content_encrypted_at_rest(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='ENC-1')
        msg = Message.objects.create(thread=thread, sender=user, content='secret')
        from django.db import connection
        with connection.cursor() as cur:
            cur.execute("SELECT content FROM chat_message WHERE id=%s", [msg.id])
            raw = cur.fetchone()[0]
        self.assertTrue(raw.startswith('enc:'))
        self.assertEqual(Message.objects.get(id=msg.id).content, 'secret')

    def test_create_thread_from_incident_action(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        view = ChatThreadViewSet.as_view({'post': 'from_incident'})
        factory = APIRequestFactory()
        token = create_token(user)
        request = factory.post('/fake', HTTP_AUTHORIZATION=f'Bearer {token}')
        response = view(request, incident_id='INC-2')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ChatThread.objects.filter(incident_id='INC-2').count(), 1)

    @patch('chat_svc.chat.event_bus.publish_event')
    def test_thread_create_emits_event(self, mock_pub):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        viewset = ChatThreadViewSet()
        viewset.request = type('req', (), {'user': user})
        serializer = ChatThreadViewSet.serializer_class(data={'incident_id': 'INC-9'})
        self.assertTrue(serializer.is_valid())
        viewset.perform_create(serializer)
        mock_pub.assert_called()

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

    @patch('chat_svc.chat.event_bus.publish_event')
    def test_message_publishes_event(self, mock_pub):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-EV')
        serializer = MessageViewSet.serializer_class(data={'thread': thread.id, 'content': 'hi'})
        serializer.is_valid()
        viewset = MessageViewSet()
        viewset.request = type('req', (), {'user': user})
        viewset.perform_create(serializer)
        mock_pub.assert_called()

    def test_question_template_and_structured_reply(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        template_view = QuestionTemplateViewSet.as_view({'post': 'create'})
        factory = APIRequestFactory()
        token = create_token(user)
        request = factory.post('/fake', {'text': 'Device ID?'}, HTTP_AUTHORIZATION=f'Bearer {token}')
        response = template_view(request)
        self.assertEqual(response.status_code, 201)
        template_id = response.data['id']

        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-4')
        msg_view = MessageViewSet.as_view({'post': 'create'})
        data = {'thread': thread.id, 'content': '', 'template': template_id, 'answer': '{"device":"device123"}'}
        request = factory.post('/fake', data, HTTP_AUTHORIZATION=f'Bearer {token}')
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
        token = create_token(user)
        request = factory.post('/fake', {'message': msg.id, 'file': file}, format='multipart', HTTP_AUTHORIZATION=f'Bearer {token}')
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
        token = create_token(user)
        request = factory.get('/fake', {'q': 'hello'}, HTTP_AUTHORIZATION=f'Bearer {token}')
        response = view(request)
        self.assertEqual(len(response.data), 1)

    def test_export_thread(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-7')
        Message.objects.create(thread=thread, sender=user, content='hi')
        view = ChatThreadViewSet.as_view({'get': 'export'})
        factory = APIRequestFactory()
        token = create_token(user)
        request = factory.get('/fake', HTTP_AUTHORIZATION=f'Bearer {token}')
        response = view(request, pk=thread.id)
        self.assertEqual(len(response.data), 1)

    def test_export_returns_json_without_hashes(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-7b')
        Message.objects.create(thread=thread, sender=user, content='hi')
        view = ChatThreadViewSet.as_view({'get': 'export'})
        factory = APIRequestFactory()
        token = create_token(user)
        request = factory.get('/fake', HTTP_AUTHORIZATION=f'Bearer {token}')
        response = view(request, pk=thread.id)
        response.render()
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertIn('content', response.data[0])
        self.assertNotIn('hash', response.data[0])
        self.assertNotIn('previous_hash', response.data[0])

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
        token = create_token(user)
        request = factory.post('/fake', {'metadata': {'device_id': 'abc'}}, format='json', HTTP_AUTHORIZATION=f'Bearer {token}')
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
        token = create_token(user)
        request = factory.post('/fake', {'text': 'Bad {device id}'}, HTTP_AUTHORIZATION=f'Bearer {token}')
        response = view(request)
        self.assertEqual(response.status_code, 400)

    def test_template_schema_enforcement(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        tmpl = QuestionTemplate.objects.create(
            tenant=tenant,
            text='Severity?',
            schema={'level': {'type': 'dropdown', 'options': ['low', 'high']}}
        )
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-11')
        valid = {
            'thread': thread.id,
            'template': tmpl.id,
            'answer': json.dumps({'level': 'low'})
        }
        serializer = MessageSerializer(data=valid)
        self.assertTrue(serializer.is_valid())

        invalid = {
            'thread': thread.id,
            'template': tmpl.id,
            'answer': json.dumps({'level': 'wrong'})
        }
        serializer = MessageSerializer(data=invalid)
        self.assertFalse(serializer.is_valid())

    @patch('chat_svc.chat.integration.requests.post')
    def test_update_ticket_timeline_posts(self, mock_post):
        with self.settings(ITSM_API_URL='http://itsm/api'):
            integration.update_ticket_timeline('INC-99', 'hello')
        mock_post.assert_called_with(
            'http://itsm/api/incidents/INC-99/timeline',
            json={'message': 'hello'},
            headers=None,
            timeout=5
        )

    @patch('chat_svc.chat.integration.requests.post')
    def test_update_ticket_timeline_with_token(self, mock_post):
        with self.settings(ITSM_API_URL='http://itsm/api', ITSM_API_TOKEN='tok'):
            integration.update_ticket_timeline('INC-100', 'hi')
        mock_post.assert_called_with(
            'http://itsm/api/incidents/INC-100/timeline',
            json={'message': 'hi'},
            headers={'Authorization': 'Bearer tok'},
            timeout=5
        )

    def test_admin_thread_filtering(self):
        t1 = Tenant.objects.create(name='T1')
        t2 = Tenant.objects.create(name='T2')
        admin = User.objects.create(username='admin', tenant=t1, is_staff=True)
        u2 = User.objects.create(username='bob', tenant=t2)
        th1 = ChatThread.objects.create(tenant=t1, incident_id='INC-A')
        th2 = ChatThread.objects.create(tenant=t2, incident_id='INC-B')

        view = AdminThreadViewSet.as_view({'get': 'list'})
        factory = APIRequestFactory()

        # non-admin rejected
        req = factory.get('/fake', HTTP_AUTHORIZATION=f'Bearer {create_token(u2)}')
        resp = view(req)
        self.assertEqual(resp.status_code, 403)

        # filter by tenant
        req = factory.get('/fake', {'tenant': t2.id}, HTTP_AUTHORIZATION=f'Bearer {create_token(admin)}')
        resp = view(req)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['id'], th2.id)

        # filter by incident
        req = factory.get('/fake', {'incident': 'INC-A'}, HTTP_AUTHORIZATION=f'Bearer {create_token(admin)}')
        resp = view(req)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['id'], th1.id)

    def test_device_registration(self):
        tenant = Tenant.objects.create(name='Acme')
        user = User.objects.create(username='alice', tenant=tenant)
        view = DeviceViewSet.as_view({'post': 'create'})
        factory = APIRequestFactory()
        token = create_token(user)
        request = factory.post('/fake', {'token': 'tok123'}, HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = view(request)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Device.objects.filter(user=user).count(), 1)

    @patch('chat_svc.chat.push.send_push')
    def test_push_called_on_message(self, mock_push):
        tenant = Tenant.objects.create(name='Acme')
        alice = User.objects.create(username='alice', tenant=tenant)
        bob = User.objects.create(username='bob', tenant=tenant)
        Device.objects.create(user=bob, token='tok456')
        thread = ChatThread.objects.create(tenant=tenant, incident_id='INC-P')
        serializer = MessageViewSet.serializer_class(data={'thread': thread.id, 'content': 'hi'})
        serializer.is_valid()
        viewset = MessageViewSet()
        viewset.request = type('req', (), {'user': alice})
        viewset.perform_create(serializer)
        mock_push.assert_called()


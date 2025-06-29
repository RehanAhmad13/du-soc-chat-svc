from django.core.management.base import BaseCommand
from chat_svc.models import ChatThread, Message
from chat_svc.tenant_api.serializers import ChatThreadSerializer
from django.test import RequestFactory
from django.db import models

class Command(BaseCommand):
    help = 'Test message ordering'

    def handle(self, *args, **options):
        self.stdout.write("Testing message ordering...")
        
        # Get a sample thread with messages
        threads_with_messages = ChatThread.objects.prefetch_related('messages').annotate(
            message_count=models.Count('messages')
        ).filter(message_count__gt=0).first()
        
        if not threads_with_messages:
            self.stdout.write("No threads with messages found.")
            return
        
        thread = threads_with_messages
        self.stdout.write(f"Testing thread: {thread.id} (incident: {thread.incident_id})")
        
        # Test direct message ordering from model
        messages_direct = list(thread.messages.all())
        self.stdout.write(f"Direct query returned {len(messages_direct)} messages")
        
        for i, msg in enumerate(messages_direct):
            self.stdout.write(f"  {i+1}. [{msg.created_at}] {msg.sender.username}: {msg.content[:50]}...")
        
        # Test via serializer
        factory = RequestFactory()
        request = factory.get('/')
        request.user = thread.messages.first().sender  # Use any existing user
        
        serializer = ChatThreadSerializer(thread, context={'request': request})
        serialized_data = serializer.data
        
        self.stdout.write(f"\nSerialized data contains {len(serialized_data['messages'])} messages")
        
        for i, msg in enumerate(serialized_data['messages']):
            self.stdout.write(f"  {i+1}. [{msg['created_at']}] {msg['sender']}: {msg['content'][:50]}...")
        
        # Check if ordering is correct
        timestamps = [msg['created_at'] for msg in serialized_data['messages']]
        is_ordered = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
        
        self.stdout.write(f"\nMessages are properly ordered: {is_ordered}")
        
        if not is_ordered:
            self.stdout.write(self.style.ERROR("ERROR: Messages are not in chronological order!"))
            for i in range(len(timestamps)-1):
                if timestamps[i] > timestamps[i+1]:
                    self.stdout.write(f"  Order violation at position {i}: {timestamps[i]} > {timestamps[i+1]}")
        else:
            self.stdout.write(self.style.SUCCESS("Messages are correctly ordered!"))
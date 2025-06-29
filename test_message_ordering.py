#!/usr/bin/env python
"""
Test script to verify message ordering is working correctly
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings')
os.environ.setdefault('DJANGO_ENVIRONMENT', 'development')
django.setup()

from chat_svc.models import ChatThread, Message, User, Tenant
from chat_svc.tenant_api.serializers import ChatThreadSerializer
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from django.db import models
import json

def test_message_ordering():
    print("Testing message ordering...")
    
    # Get a sample thread with messages
    threads_with_messages = ChatThread.objects.prefetch_related('messages').annotate(
        message_count=models.Count('messages')
    ).filter(message_count__gt=0).first()
    
    if not threads_with_messages:
        print("No threads with messages found. Creating test data...")
        return
    
    thread = threads_with_messages
    print(f"Testing thread: {thread.id} (incident: {thread.incident_id})")
    
    # Test direct message ordering from model
    messages_direct = list(thread.messages.all())
    print(f"Direct query returned {len(messages_direct)} messages")
    
    for i, msg in enumerate(messages_direct):
        print(f"  {i+1}. [{msg.created_at}] {msg.sender.username}: {msg.content[:50]}...")
    
    # Test via serializer
    factory = RequestFactory()
    request = factory.get('/')
    request.user = thread.messages.first().sender  # Use any existing user
    
    serializer = ChatThreadSerializer(thread, context={'request': request})
    serialized_data = serializer.data
    
    print(f"\nSerialized data contains {len(serialized_data['messages'])} messages")
    
    for i, msg in enumerate(serialized_data['messages']):
        print(f"  {i+1}. [{msg['created_at']}] {msg['sender']}: {msg['content'][:50]}...")
    
    # Check if ordering is correct
    timestamps = [msg['created_at'] for msg in serialized_data['messages']]
    is_ordered = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
    
    print(f"\nMessages are properly ordered: {is_ordered}")
    
    if not is_ordered:
        print("ERROR: Messages are not in chronological order!")
        for i in range(len(timestamps)-1):
            if timestamps[i] > timestamps[i+1]:
                print(f"  Order violation at position {i}: {timestamps[i]} > {timestamps[i+1]}")
    
    return is_ordered

if __name__ == "__main__":
    test_message_ordering()
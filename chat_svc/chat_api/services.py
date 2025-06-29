import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from chat_svc.models import ChatThread, Message, Device, User
from integrations import event_bus, push

logger = logging.getLogger(__name__)


class ChatService:
    """Business logic for chat operations"""
    
    @staticmethod
    def notify_thread_users(thread_id, message_data, exclude_user=None):
        """Send WebSocket notification to all users in a thread"""
        channel_layer = get_channel_layer()
        group_name = f"chat_{thread_id}"
        
        # Send to WebSocket group
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.message",
                "message": message_data,
            }
        )
    
    @staticmethod
    def notify_user_presence(thread_id, username, online=True):
        """Notify users about presence changes"""
        channel_layer = get_channel_layer()
        group_name = f"chat_{thread_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.presence",
                "user": username,
                "online": online,
            }
        )
    
    @staticmethod
    def notify_typing(thread_id, username):
        """Notify users about typing indicators"""
        channel_layer = get_channel_layer()
        group_name = f"chat_{thread_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.typing",
                "user": username,
            }
        )
    
    @staticmethod
    def notify_read_receipt(thread_id, message_id, username):
        """Notify users about read receipts"""
        channel_layer = get_channel_layer()
        group_name = f"chat_{thread_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.read",
                "message_id": message_id,
                "user": username,
            }
        )
    
    @staticmethod
    def send_push_notifications(thread, message, exclude_user=None):
        """Send push notifications to relevant users"""
        try:
            # Get device tokens for tenant users (excluding sender)
            tokens_query = Device.objects.filter(
                user__tenant_id=thread.tenant_id
            )
            
            if exclude_user:
                tokens_query = tokens_query.exclude(user=exclude_user)
            
            tokens = list(tokens_query.values_list("token", flat=True))
            
            if tokens:
                title = f"New message in {thread.incident_id}"
                body = message.content[:100] + ("..." if len(message.content) > 100 else "")
                push.send_push(tokens, title, body)
                
        except Exception as e:
            logger.exception(f"Failed to send push notifications: {e}")
    
    @staticmethod
    def publish_message_event(message):
        """Publish message event to event bus"""
        try:
            event_bus.publish_event("chat-events", {
                "type": "message_created",
                "message_id": message.id,
                "thread_id": message.thread_id,
                "tenant_id": message.thread.tenant_id,
                "sender_id": message.sender_id,
                "timestamp": message.created_at.isoformat(),
            })
        except Exception as e:
            logger.exception(f"Failed to publish message event: {e}")
    
    @staticmethod
    def get_thread_participants(thread_id):
        """Get list of users participating in a thread"""
        try:
            thread = ChatThread.objects.get(id=thread_id)
            participants = Message.objects.filter(
                thread=thread
            ).values(
                'sender__id', 'sender__username'
            ).distinct()
            
            return list(participants)
        except ChatThread.DoesNotExist:
            return []
    
    @staticmethod
    def check_user_access(user, thread_id):
        """Check if user has access to a thread"""
        try:
            thread = ChatThread.objects.get(id=thread_id)
            return user.tenant_id == thread.tenant_id
        except ChatThread.DoesNotExist:
            return False


class PresenceService:
    """Service for managing user presence in threads"""
    
    def __init__(self):
        self.redis_prefix = "presence:thread"
    
    def add_user_to_thread(self, thread_id, username):
        """Add user to thread presence"""
        # This would integrate with Redis in a real implementation
        pass
    
    def remove_user_from_thread(self, thread_id, username):
        """Remove user from thread presence"""
        # This would integrate with Redis in a real implementation
        pass
    
    def get_online_users(self, thread_id):
        """Get list of users currently online in a thread"""
        # This would query Redis in a real implementation
        return []


class MessageService:
    """Service for message-related operations"""
    
    @staticmethod
    def create_message(thread, sender, content, structured_data=None):
        """Create a new message with proper validation and side effects"""
        try:
            # Create the message
            message = Message.objects.create(
                thread=thread,
                sender=sender,
                content=content
            )
            
            # Handle structured data if provided
            if structured_data and thread.template:
                from models import StructuredReply
                StructuredReply.objects.create(
                    message=message,
                    template=thread.template,
                    answer=structured_data
                )
            
            # Create message log
            from models import MessageLog
            version = MessageLog.objects.filter(message=message).count() + 1
            MessageLog.objects.create(
                message=message,
                thread=thread,
                sender=sender,
                content=content,
                structured=structured_data,
                version=version
            )
            
            # Send notifications
            ChatService.notify_thread_users(thread.id, {
                "id": message.id,
                "content": message.content,
                "sender": sender.username,
                "created_at": message.created_at.isoformat(),
                "structured": structured_data,
            })
            
            # Push notifications
            ChatService.send_push_notifications(thread, message, exclude_user=sender)
            
            # Event bus
            ChatService.publish_message_event(message)
            
            # ITSM integration
            from integrations import itsm
            itsm.update_ticket_timeline(thread.incident_id, message.content)
            
            return message
            
        except Exception as e:
            logger.exception(f"Failed to create message: {e}")
            raise
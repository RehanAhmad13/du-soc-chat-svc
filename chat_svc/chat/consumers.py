import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import ChatThread, Message, ReadReceipt

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser):
            await self.close()
            return
        try:
            self.thread = await database_sync_to_async(ChatThread.objects.get)(id=self.thread_id)
        except ChatThread.DoesNotExist:
            await self.close()
            return
        if self.thread.tenant_id != user.tenant_id:
            await self.close()
            return
        self.group_name = f"chat_{self.thread_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        data = json.loads(text_data)
        event_type = data.get("type")
        if event_type == "message":
            content = data.get("content", "")
            message = await database_sync_to_async(Message.objects.create)(
                thread=self.thread, sender=self.scope["user"], content=content
            )
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.message",
                    "message": {
                        "id": message.id,
                        "content": message.content,
                        "sender": self.scope["user"].username,
                        "created_at": message.created_at.isoformat(),
                    },
                },
            )
        elif event_type == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.typing", "user": self.scope["user"].username},
            )
        elif event_type == "read":
            msg_id = data.get("message_id")
            if msg_id:
                await database_sync_to_async(ReadReceipt.objects.get_or_create)(
                    message_id=msg_id, user=self.scope["user"]
                )
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "chat.read",
                        "message_id": msg_id,
                        "user": self.scope["user"].username,
                    },
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", **event["message"]}))

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({"type": "typing", "user": event["user"]}))

    async def chat_read(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "read",
                    "message_id": event["message_id"],
                    "user": event["user"],
                }
            )
        )

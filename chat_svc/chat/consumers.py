import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import ChatThread, Message, ReadReceipt, Device
from . import event_bus, push

# Track simple in-memory presence per thread. This is not persisted and is
# mainly for demo/testing purposes. In a real deployment you would use Redis or
# another shared store to keep presence state across workers.
_presence = {}

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        self.group_name = f"chat_{self.thread_id}"
        user = self.scope.get("user")

        if not user or isinstance(user, AnonymousUser):
            logger.warning(f"[WS] Connection rejected: unauthenticated user.")
            await self.close()
            return

        try:
            self.thread = await database_sync_to_async(ChatThread.objects.get)(id=self.thread_id)
        except ChatThread.DoesNotExist:
            logger.warning(f"[WS] Thread {self.thread_id} does not exist.")
            await self.close()
            return

        if self.thread.tenant_id != user.tenant_id:
            logger.warning(f"[WS] Thread/tenant mismatch for user {user}.")
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Mark user as online in this thread
        online = _presence.setdefault(self.thread_id, set())
        if user.username not in online:
            online.add(user.username)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.presence",
                    "user": user.username,
                    "online": True,
                },
            )

        logger.info(f"[WS] User {user} connected to thread {self.thread_id}")

    async def disconnect(self, close_code):
        user = self.scope.get("user")
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

        online = _presence.get(self.thread_id, set())
        if user and user.username in online:
            online.discard(user.username)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.presence",
                    "user": user.username,
                    "online": False,
                },
            )
        logger.info(f"[WS] Disconnected from thread {self.thread_id}")

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        data = json.loads(text_data)
        event_type = data.get("type")
        user = self.scope["user"]

        if event_type == "message":
            content = data.get("content", "")
            logger.info(f"[WS] Incoming message: {content} from {user}")

            try:
                # Manually create and save the message to ensure save() is fully run
                msg = Message(thread=self.thread, sender=user, content=content)
                await database_sync_to_async(msg.save)()
                logger.info(f"[WS] Message saved with ID {msg.id}")

                # Publish event (Kafka)
                event_bus.publish_event(
                    "chat-events",
                    {
                        "type": "message_created",
                        "message_id": msg.id,
                        "thread_id": self.thread.id,
                        "tenant_id": self.thread.tenant_id,
                        "sender_id": user.id,
                    },
                )

                # Push notification to other tenant users
                tokens = await database_sync_to_async(
                    lambda: list(
                        Device.objects.filter(
                            user__tenant_id=self.thread.tenant_id
                        )
                        .exclude(user=user)
                        .values_list("token", flat=True)
                    )
                )()
                if tokens:
                    await sync_to_async(push.send_push)(
                        tokens, "New message", msg.content
                    )

                # Send to group
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "chat.message",
                        "message": {
                            "id": msg.id,
                            "content": msg.content,
                            "sender": user.username,
                            "created_at": msg.created_at.isoformat(),
                        },
                    },
                )

                # Confirm back to sender
                await self.send(text_data=json.dumps({
                    "type": "confirmation",
                    "status": "saved",
                    "message_id": msg.id,
                }))
            except Exception as e:
                logger.exception(f"[WS] Failed to save message: {e}")
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "detail": "Failed to save message."
                }))

        elif event_type == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.typing", "user": user.username},
            )

        elif event_type == "read":
            msg_id = data.get("message_id")
            if msg_id:
                await database_sync_to_async(ReadReceipt.objects.get_or_create)(
                    message_id=msg_id, user=user
                )
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "chat.read",
                        "message_id": msg_id,
                        "user": user.username,
                    },
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", **event["message"]}))

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({"type": "typing", "user": event["user"]}))

    async def chat_read(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "read",
                "message_id": event["message_id"],
                "user": event["user"],
            })
        )

    async def chat_presence(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "presence",
                "user": event["user"],
                "online": event["online"],
            })
        )

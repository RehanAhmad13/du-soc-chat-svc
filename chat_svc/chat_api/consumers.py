import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser
from chat_svc.models import (
    ChatThread,
    Message,
    ReadReceipt,
    Device,
    StructuredReply,
    MessageLog,
)
from integrations import event_bus, push
from channels.layers import get_channel_layer
import redis.asyncio as redis

logger = logging.getLogger(__name__)
REDIS_PRESENCE_PREFIX = "presence:thread"

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        self.group_name = f"chat_{self.thread_id}"
        self.username = self.scope["user"].username
        self.user = self.scope["user"]

        if not self.user or isinstance(self.user, AnonymousUser):
            logger.warning("[WS] Rejected unauthenticated connection.")
            await self.close()
            return

        try:
            self.thread = await database_sync_to_async(ChatThread.objects.get)(id=self.thread_id)
        except ChatThread.DoesNotExist:
            logger.warning(f"[WS] Thread {self.thread_id} does not exist.")
            await self.close()
            return

        # Allow admins to access any thread, regular users only their tenant's threads
        if not (self.thread.tenant_id == self.user.tenant_id or self.user.is_staff):
            logger.warning(f"[WS] Access denied for user {self.username} to thread {self.thread_id}")
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self._add_online(self.username)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.presence",
                "user": self.username,
                "online": True,
            },
        )

        logger.info(f"[WS] {self.username} connected to thread {self.thread_id}")

        current = await self._get_online()
        for user in current:
            if user != self.username:
                await self.send(text_data=json.dumps({
                    "type": "presence",
                    "user": user,
                    "online": True
                }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self._remove_online(self.username)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.presence",
                "user": self.username,
                "online": False,
            },
        )

        logger.info(f"[WS] {self.username} disconnected from thread {self.thread_id}")

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        data = json.loads(text_data)
        user = self.user
        msg_type = data.get("type")

        if msg_type == "message":
            try:
                content = data.get("content", "")
                structured = data.get("structured")

                msg = Message(thread=self.thread, sender=user, content=content)
                await database_sync_to_async(msg.save)()

                if structured:
                    reply = StructuredReply(
                        message=msg,
                        template=self.thread.template,
                        answer=json.dumps(structured)
                    )
                    await database_sync_to_async(reply.save)()

                version = await database_sync_to_async(
                    lambda: MessageLog.objects.filter(message=msg).count() + 1
                )()

                log = MessageLog(
                    message=msg,
                    thread=self.thread,
                    sender=user,
                    content=content,
                    structured=structured or None,
                    version=version
                )
                await database_sync_to_async(log.save)()

                event_bus.publish_event("chat-events", {
                    "type": "message_created",
                    "message_id": msg.id,
                    "thread_id": self.thread.id,
                    "tenant_id": self.thread.tenant_id,
                    "sender_id": user.id,
                })

                tokens = await database_sync_to_async(
                    lambda: list(
                        Device.objects.filter(user__tenant_id=self.thread.tenant_id)
                        .exclude(user=user)
                        .values_list("token", flat=True)
                    )
                )()
                if tokens:
                    await sync_to_async(push.send_push)(tokens, "New message", msg.content)

                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "chat.message",
                        "message": {
                            "id": msg.id,
                            "content": msg.content,
                            "sender": user.username,
                            "created_at": msg.created_at.isoformat(),
                            "structured": structured or None,
                            "is_admin": user.is_staff,
                        },
                    },
                )

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

        elif msg_type == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.typing", "user": user.username},
            )

        elif msg_type == "read":
            msg_id = data.get("message_id")
            if not msg_id:
                return

            try:
                # Fetch the message
                message = await database_sync_to_async(Message.objects.get)(id=msg_id)
            except Message.DoesNotExist:
                logger.warning(f"[WS] Tried to read nonexistent message {msg_id}")
                return

            # 1) Don’t let users mark their own messages as seen
            if message.sender_id == user.id:
                logger.info(f"[WS] Skipped read receipt: {user.username} is sender of message {msg_id}")
                return

            # 2) Avoid duplicate receipts
            seen_qs = ReadReceipt.objects.filter(message=message, user=user)
            already_seen = await database_sync_to_async(seen_qs.exists)()
            if already_seen:
                return

            # 3) Create the receipt and broadcast
            receipt = await database_sync_to_async(ReadReceipt.objects.create)(
                message=message, user=user
            )
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.read",
                    "message_id": msg_id,
                    "user": user.username,
                    "timestamp": receipt.timestamp.isoformat(),
                    "read_count": await database_sync_to_async(
                        lambda: message.receipts.count()
                    )(),
                },
            )


    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", **event["message"]}))

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({"type": "typing", "user": event["user"]}))

    async def chat_read(self, event):
        await self.send(text_data=json.dumps({
            "type": "read",
            "message_id": event["message_id"],
            "user": event["user"],
            "timestamp": event.get("timestamp"),
            "read_count": event.get("read_count", 1),
        }))

    async def chat_presence(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence",
            "user": event["user"],
            "online": event["online"],
        }))

    def _redis(self):
        return redis.Redis.from_url("redis://localhost")

    async def _add_online(self, username):
        r = self._redis()
        await r.sadd(f"{REDIS_PRESENCE_PREFIX}:{self.thread_id}", username)

    async def _remove_online(self, username):
        r = self._redis()
        await r.srem(f"{REDIS_PRESENCE_PREFIX}:{self.thread_id}", username)

    async def _get_online(self):
        r = self._redis()
        users = await r.smembers(f"{REDIS_PRESENCE_PREFIX}:{self.thread_id}")
        return [u.decode("utf-8") for u in users]

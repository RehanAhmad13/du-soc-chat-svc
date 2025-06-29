import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

FCM_URL = "https://fcm.googleapis.com/fcm/send"

def send_push(tokens, title: str, body: str) -> None:
    """Send a push notification via FCM to the given device tokens."""
    key = getattr(settings, "FCM_SERVER_KEY", None)
    if not key or not tokens:
        return
    headers = {
        "Authorization": f"key={key}",
        "Content-Type": "application/json",
    }
    payload = {
        "registration_ids": list(tokens),
        "notification": {"title": title, "body": body},
    }
    try:
        resp = requests.post(FCM_URL, json=payload, headers=headers, timeout=5)
        resp.raise_for_status()
    except Exception:
        logger.exception("Failed to send push notification")
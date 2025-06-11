import logging
from django.conf import settings
import requests

logger = logging.getLogger(__name__)

def update_ticket_timeline(incident_id: str, message: str) -> None:
    """Send the chat message to the ITSM ticket timeline."""
    url_base = getattr(settings, "ITSM_API_URL", None)
    if not url_base:
        logger.info("No ITSM_API_URL configured; skipping update for %s", incident_id)
        return
    url = f"{url_base.rstrip('/')}/incidents/{incident_id}/timeline"
    try:
        resp = requests.post(url, json={"message": message}, timeout=5)
        resp.raise_for_status()
    except Exception:
        logger.exception("Failed to update ticket %s", incident_id)

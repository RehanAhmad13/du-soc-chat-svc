import json
import logging
from django.conf import settings
try:
    from kafka import KafkaProducer
except Exception:  # pragma: no cover
    KafkaProducer = None

logger = logging.getLogger(__name__)
_producer = None

def _get_producer():
    global _producer
    if _producer is not None:
        return _producer
    servers = getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "")
    if not servers or KafkaProducer is None:
        return None
    try:
        _producer = KafkaProducer(
            bootstrap_servers=[s.strip() for s in servers.split(',') if s.strip()],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        )
    except Exception:
        logger.exception("Failed to create Kafka producer")
        _producer = None
    return _producer

def publish_event(topic: str, event: dict) -> None:
    """Publish an event dict to the given Kafka topic if configured."""
    producer = _get_producer()
    if not producer:
        logger.debug("Kafka producer not configured; skipping publish")
        return
    try:
        producer.send(topic, event)
        producer.flush()
    except Exception:
        logger.exception("Failed to publish event to Kafka")
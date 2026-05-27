"""Celery worker entry point.

Long-running jobs (autopilot builds, evaluation runs, document ingestion) are
queued to this worker so the API process stays responsive. The worker reuses
the SQLAlchemy sync URL because async drivers are FastAPI-only.

Run locally:

    celery -A app.worker:celery_app worker -l info -Q default

Run in Docker (default for the `worker` service in docker-compose.yml):

    celery -A app.worker:celery_app worker -l info -Q ${CELERY_TASK_DEFAULT_QUEUE:-default}
"""

from celery import Celery

from app.config import get_settings

_settings = get_settings()

_broker = _settings.celery_broker_url or _settings.redis_url
_backend = _settings.celery_result_backend or _settings.redis_url

celery_app = Celery(
    "rag_studio",
    broker=_broker,
    backend=_backend,
    include=[],  # task modules registered below as they land
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_queue=_settings.celery_task_default_queue,
    task_always_eager=_settings.celery_task_always_eager,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)


@celery_app.task(name="rag_studio.ping")
def ping() -> str:
    """Smoke test — `celery -A app.worker:celery_app call rag_studio.ping`."""
    return "pong"

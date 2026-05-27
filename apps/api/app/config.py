"""Application settings loaded from environment variables."""

from functools import lru_cache
from typing import Literal
import uuid

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All fields have defaults so the app can start without a .env file.

    Override via environment variables or a .env file at the project root.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "production", "test"] = "development"
    secret_key: str = "change-me-in-production"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # Database — defaults to SQLite so `npm run dev:api` works without Docker.
    database_url: str = "sqlite+aiosqlite:///./ragstudio.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_task_always_eager: bool = False
    celery_broker_url: str = ""
    celery_result_backend: str = ""
    celery_task_default_queue: str = "default"

    # Vector database
    qdrant_url: str = "http://localhost:6333"

    # LLM providers
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    cohere_api_key: str = ""
    google_api_key: str = ""
    mistral_api_key: str = ""
    openai_compatible_base_url: str = ""
    openai_compatible_api_key: str = ""

    # RAGAS evaluation
    evaluation_llm_model: str = "gpt-4o-mini"
    evaluation_embedding_model: str = "text-embedding-3-small"

    # Experiment tracking
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_enabled: bool = True
    mlflow_experiment_name: str = "rag-studio-autopilot"

    # Object storage (MinIO / S3-compatible)
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "rag-studio-documents"
    autopilot_upload_max_files: int = 25
    autopilot_upload_max_bytes_per_file: int = 52_428_800  # 50 MiB

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
    ]

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    # Auth
    default_user_id: uuid.UUID = uuid.UUID("00000000-0000-4000-8000-000000000001")
    auth_required: bool = True
    auth_access_token_ttl_minutes: int = 60
    auth_email_verification_ttl_minutes: int = 60 * 24
    auth_password_reset_ttl_minutes: int = 60
    auth_dev_return_tokens: bool = True
    auth_bootstrap_users: str = (
        "admin@ragstudio.local:admin123:admin:00000000-0000-4000-8000-000000000001,"
        "user@ragstudio.local:user123:user:00000000-0000-4000-8000-000000000002"
    )
    auth_rate_limit_per_minute: int = 120

    # Catalog overrides
    pricing_catalog_path: str = ""
    templates_catalog_path: str = ""

    # Prometheus
    prometheus_metrics_enabled: bool = True

    # Guardrails policies
    guardrails_toxicity_policy_path: str = ""
    guardrails_content_filter_policy_path: str = ""
    guardrails_bias_patterns_policy_path: str = ""

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_test(self) -> bool:
        return self.app_env == "test"

    @property
    def database_url_sync(self) -> str:
        """SQLAlchemy sync URL for Celery workers (async drivers are FastAPI-only)."""
        url = self.database_url
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
        if "sqlite+aiosqlite://" in url:
            return "sqlite://" + url.split("sqlite+aiosqlite://", 1)[1]
        return url


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (one load per process).

    Tests can call ``get_settings.cache_clear()`` to force a reload.
    """
    return Settings()

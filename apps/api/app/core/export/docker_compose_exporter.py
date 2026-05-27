"""Render a DesignerState as a docker-compose.yml.

Stitched from the chosen stages — vector store, cache, generator-provider
hints become services in the compose file.
"""

from __future__ import annotations

from typing import Any


def _get(stages: dict, stage_id: str, key: str, default: Any) -> Any:
    return stages.get(stage_id, {}).get(key, default)


def export_docker_compose(stages: dict, *, project_name: str) -> str:
    vector_provider = str(
        _get(stages, "vector_store", "provider", "qdrant")
    ).lower()
    vector_collection = _get(stages, "vector_store", "collection", "default")
    generator_provider = str(
        _get(stages, "generator", "provider", "openai")
    ).lower()
    embedding_provider = str(
        _get(stages, "embedding", "provider", "openai")
    ).lower()

    services: list[str] = []

    services.append(
        """  api:
    build:
      context: ./apps/api
      target: runtime
    environment:
      - APP_ENV=production
      - DATABASE_URL=postgresql+asyncpg://ragstudio:ragstudio@postgres:5432/ragstudio
      - REDIS_URL=redis://redis:6379/0
      - QDRANT_URL=http://qdrant:6333
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
      - qdrant"""
    )

    services.append(
        """  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=ragstudio
      - POSTGRES_PASSWORD=ragstudio
      - POSTGRES_DB=ragstudio
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432" """
    )

    services.append(
        """  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data"""
    )

    if vector_provider == "qdrant":
        services.append(
            """  qdrant:
    image: qdrant/qdrant:v1.9.1
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage"""
        )
    elif vector_provider == "weaviate":
        services.append(
            """  qdrant:
    image: semitechnologies/weaviate:1.24.10
    ports:
      - "8080:8080"
    volumes:
      - qdrant_data:/var/lib/weaviate
    environment:
      - QUERY_DEFAULTS_LIMIT=20
      - AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
      - DEFAULT_VECTORIZER_MODULE=none"""
        )
    else:
        services.append(
            f"""  qdrant:
    image: qdrant/qdrant:v1.9.1
    # NOTE: configured vector_store provider was '{vector_provider}', defaulting to Qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage"""
        )

    services_block = "\n\n".join(services)

    return f"""# RAG-Studio docker-compose export
# project           : {project_name}
# vector store      : {vector_provider} (collection={vector_collection})
# embedding provider: {embedding_provider}
# generator provider: {generator_provider}

services:
{services_block}

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
"""

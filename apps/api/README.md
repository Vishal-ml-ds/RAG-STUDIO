# RAG Studio API

FastAPI backend for RAG Studio.

## Local run

```bash
cd apps/api
uv venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS / Linux
uv pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000/docs> for the interactive OpenAPI explorer (development only).

## Smoke test

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/ready
```

## Layout

```
app/
├── main.py              # FastAPI application factory + middleware
├── config.py            # Pydantic Settings
├── metadata.py          # Static API metadata (name, version)
├── observability/       # Structured logging, request context
│   ├── logging_setup.py
│   └── context.py
└── routers/             # HTTP route handlers (one module per resource)
    └── health.py
```

Future modules (added in subsequent phases): `core/` (security, guardrails, agents, RAG primitives), `models/` (SQLAlchemy), `schemas/` (Pydantic request/response), `services/` (business logic), `repositories/` (data access), `worker/` (Celery tasks).

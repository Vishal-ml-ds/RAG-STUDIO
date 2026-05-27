# Architecture

This document describes how RAG Studio is laid out and the reasoning behind the major choices.

## High-level shape

```
                 ┌─────────────────────────────────────────────┐
                 │                   nginx :80                  │
                 │   /api/* → api    /* → web    /metrics → api │
                 └────────────┬─────────────────┬───────────────┘
                              │                 │
                              ▼                 ▼
                       ┌─────────────┐   ┌───────────────┐
                       │ FastAPI api │   │ Next.js web   │
                       │  :8000      │   │  :3000        │
                       └──┬───┬───┬──┘   └───────────────┘
                          │   │   │
       ┌──────────────────┘   │   └──────────────────┐
       ▼                      ▼                      ▼
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│ Postgres 16 │        │  Redis 7    │        │  Qdrant     │
│ (durable    │        │ (cache,     │        │ (vectors)   │
│  state)     │        │  broker,    │        └─────────────┘
└─────────────┘        │  sessions)  │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐    ┌──────────────┐
                       │ Celery      │    │ MLflow       │
                       │ worker      │    │ (tracking)   │
                       └─────────────┘    └──────────────┘
```

Object storage (MinIO / S3) and observability (Prometheus + Grafana) sit alongside the stack and are wired through optional Compose overlays.

## Repository layout

```
RAG-STUDIO/
├── apps/
│   ├── api/                 Backend — FastAPI, LangGraph, Celery, Alembic
│   └── web/                 Frontend — Next.js 14 App Router, Tailwind
├── data/                    Catalogs: designer stages, templates, pricing,
│                            chunking, retrieval, vector stores, embeddings,
│                            cloud providers
├── docker/                  Compose files + nginx + Prometheus / Grafana
├── docs/
│   ├── public/              Architecture, deployment, FAQ (this folder)
│   └── internal/            Design evolution notes
├── k8s/production/          Namespace, workloads, ingress, HPA
├── scripts/                 Migration + helper scripts
├── .env.example
└── package.json             npm workspaces
```

## Backend (`apps/api/`)

Clean-architecture FastAPI service. Layers:

| Layer | Module | Responsibility |
|---|---|---|
| HTTP | `app/main.py` + `app/routers/` | Request/response shape, auth middleware, status codes |
| Schemas | `app/schemas/` | Pydantic request/response models — no business logic |
| Services | `app/services/` | Business logic — calls repositories + core, returns ORM objects |
| Repositories | (inline in services for now) | SQLAlchemy queries |
| Models | `app/models/` | SQLAlchemy 2.0 ORM with GUID column type (works on Postgres + SQLite) |
| Core | `app/core/` | Cross-cutting primitives — security (JWT, bcrypt), designer stages, export, guardrails, evaluation, autopilot |
| Observability | `app/observability/` | structlog setup, per-request context, future metrics |

### Request lifecycle

1. nginx → uvicorn → FastAPI
2. `observability_middleware` binds `request_id` + `correlation_id`, validates JWT for `/api/*` (except `/api/auth/*`)
3. Router resolves dependencies (`DbSession`, `RequestUserId`, `CurrentPrincipal`)
4. Router delegates to service in `app/services/`
5. Service uses ORM via the injected `AsyncSession`
6. Response goes back through middleware, security headers + `X-Request-ID` added

### Auth model

- `POST /api/auth/login` → HS256 JWT (`sub`, `email`, `role`, `iat`, `exp`, `jti`)
- Token TTL controlled by `AUTH_ACCESS_TOKEN_TTL_MINUTES` (default 60)
- Bootstrap users seeded at startup from `AUTH_BOOTSTRAP_USERS` (CSV `email:password:role:uuid`)
- Future: refresh tokens, token revocation via Redis JTI denylist (`get_current_principal` already checks this in `dependencies.py`)

### Designer pipeline (17 stages)

The `data/designer_stages.json` catalog defines 17 configurable stages grouped into 6 categories (infrastructure / ingestion / query / safety / quality / ops). Each project has exactly one `DesignerState` row that stores the chosen config per stage as JSON. The Designer UI in the web app renders these dynamically — adding a new stage means editing the JSON catalog, no code change required.

### Export

`POST /api/designer/{project_id}/export?format=…` reads the DesignerState and emits one of five artifacts:

- `python` — LangChain-style script that recreates the pipeline
- `yaml` — config the platform itself could reload
- `terraform` — HCL stubs for infra (Qdrant, Postgres, Redis)
- `docker-compose` — stitched Compose file
- `kubernetes` — multi-document YAML (Namespace, Deployment, Service, ConfigMap)

Exporters live in `app/core/export/` behind a small registry; adding a new format is one file + one entry in the registry.

### Guardrails

`app/core/guardrails/` contains four detectors:

- `pii` — regex catalog (emails, phone, SSN-shape, CC-shape, IPv4)
- `toxicity` — keyword blocklist (severity-aware, JSON-policy override)
- `bias` — regex catalog (JSON-policy override)
- `factuality` — Jaccard token-overlap heuristic against retrieved context (placeholder for a semantic check)

Each returns `Finding` objects; the per-project `guardrails` stage decides which are wired into input vs output checks. Operator-facing endpoint: `POST /api/guardrails/check`.

### Evaluation + Autopilot

- `app/core/evaluation/ragas_runner.py` wraps RAGAS `evaluate()` with a deterministic stub fallback so the API works in dev without OPENAI_API_KEY.
- `app/core/autopilot/builder.py` takes a natural-language brief and produces a DesignerState by mapping keywords to default stage configs. This is the seed of a real LLM-driven builder.
- Both write rows to `evaluation_runs` and `build_history` (Alembic migration 0003).

## Frontend (`apps/web/`)

Next.js 14 App Router, TypeScript strict mode, Tailwind dark theme.

Auth uses an **httpOnly `rag_session` cookie** — the JWT never reaches the browser. Server components read the cookie via `cookies()` and attach `Authorization: Bearer` to backend calls. Client components hit web-side proxy routes (e.g. `/app/api/projects/route.ts`) that forward to the FastAPI backend with the cookie's token.

| Route group | Purpose |
|---|---|
| `/` (root) | Marketing landing |
| `(auth)/login`, `(auth)/register` | Public auth forms |
| `(app)/dashboard` | Stats + recent projects (auth required) |
| `(app)/projects` | CRUD list + detail |
| `(app)/projects/[id]/designer` | 17-stage editor |
| `(app)/projects/[id]/export` | Tabbed code exporter (5 formats) |

UI primitives (Button, Input, Card, Dialog, Tabs, CodeBlock, Badge, FormField) are hand-written — no shadcn/ui dependency — so the bundle stays small and the components are readable.

## Data catalogs (`data/`)

Static JSON files consumed by both backend and frontend:

| File | Contents |
|---|---|
| `designer_stages.json` | 17 stages, default config per stage |
| `templates.json` | 8 starter RAG pipelines |
| `pricing.json` | Per-model token pricing (input + output, USD/1M tokens) |
| `embeddings.json` | Embedding models with dim + max tokens |
| `chunking_strategies.json` | 7 chunking strategies + default params |
| `retrieval_strategies.json` | 8 retrieval strategies (dense, BM25, hybrid, MMR, HyDE, multi-query, parent-doc, self-query) |
| `vector_stores.json` | 7 vector DB choices + capabilities |
| `cloud_providers.json` | 5 cloud / on-prem providers + regions |

Loaders use `lru_cache` so disk reads happen once per process.

## Deployment

Three target shapes share the same image and config:

- **Docker Compose** (`docker/`) — five overlay files (base, build, dev, prod, observability)
- **Kubernetes** (`k8s/production/`) — Kustomize-ready manifests for Postgres / Redis / Qdrant (StatefulSet), API / worker / web (Deployment), Ingress, HPA
- **Local** (`npm run dev:full`) — uvicorn + next dev directly, defaults to SQLite + local Redis/Qdrant

See [deployment.md](deployment.md) for details.

## Why these choices

- **Async-first FastAPI + SQLAlchemy 2.0** — same process can serve hundreds of RAG queries without thread starvation; the LLM call is the bottleneck and that's already I/O-bound.
- **Qdrant (default)** — simple HTTP, strong filtering, embedded mode for tests. Weaviate / pgvector / Chroma adapters live behind the same interface so swapping is one stage config change.
- **httpOnly cookies for auth** — XSS-resistant by default; localStorage tokens are a 2015 anti-pattern.
- **JSON catalogs over code** — non-engineers can extend the catalog with a PR.
- **17 stages, not 5** — every real RAG system grows guardrails, observability, eval, HITL; baking them in from day one avoids the rewrite when they're needed.

# Design decisions — internal log

Short rationale for non-obvious choices. Update this file when you change a foundational decision.

## ADR-001 — Why JSON catalogs instead of database-stored stages

**Decision**: The 17-stage pipeline catalog lives in `data/designer_stages.json`, loaded with `lru_cache`. Per-project state lives in Postgres as JSONB.

**Why**: Two reasons. (1) Catalog changes ship with code review — adding a stage requires a PR, not a database migration. (2) The catalog is the same artifact the frontend ships in `lib/constants.ts`; consistency is easier when both sides read from a static file.

**Trade-off**: Operators can't hot-add stages via an admin UI. Acceptable because new stages need code on both sides anyway (loader logic, UI rendering).

## ADR-002 — Why GUID column type instead of native UUID

**Decision**: `app/models/base.py::GUID` is a `TypeDecorator` that maps to native `UUID` on Postgres and `CHAR(36)` on SQLite.

**Why**: Tests run against SQLite (no Postgres dependency in CI). Production runs Postgres. Using native UUID on both means SQLite migrations diverge.

**Trade-off**: A tiny serialization cost on SQLite. Irrelevant in practice.

## ADR-003 — Why httpOnly cookie auth, not bearer-in-localStorage

**Decision**: JWT lives in an httpOnly `rag_session` cookie set by a Next.js Route Handler. Server components read the cookie via `cookies()` and forward as `Authorization: Bearer ...` to the backend. The JWT never enters the browser JS context.

**Why**: XSS-resistant by default. A malicious script can't read the token.

**Trade-off**: Cross-origin API calls from non-browser clients (mobile apps, CLI) need their own token flow. They hit `/api/auth/login` directly and store the token themselves.

## ADR-004 — Why FastAPI + async SQLAlchemy 2.0 instead of sync Flask / Django

**Decision**: Async-first stack.

**Why**: RAG queries are I/O-bound (LLM call + vector DB). One process serves many concurrent requests. Sync stacks would force a thread-per-request model with much worse memory/throughput.

**Trade-off**: Async ORM still has rough edges (e.g., `lazy=joined` doesn't quite work the same). We pay for that with explicit `selectinload`s where needed.

## ADR-005 — Why Qdrant as default vector DB

**Decision**: Default `vector_store.provider = "qdrant"`.

**Why**: Simple HTTP API, fast filtering on metadata, embedded mode for tests, Apache 2.0 license. Weaviate / pgvector / Chroma all work behind the same stage config but Qdrant has the best dev ergonomics.

**Trade-off**: Migrating to managed Pinecone or pgvector later needs the alternate driver in the adapter — already scaffolded in the design but not all written.

## ADR-006 — Why 5 export formats instead of one

**Decision**: Export to Python, YAML, Terraform, Docker Compose, Kubernetes.

**Why**: Each serves a different audience.
- **Python** — engineers running the pipeline locally or in a notebook
- **YAML** — the platform itself (reload state)
- **Terraform** — infra team provisioning the dependencies
- **Docker Compose** — DevOps wanting a one-file local stack
- **Kubernetes** — SRE deploying to a cluster

If only one — Python. But that excludes everyone else.

**Trade-off**: 5 exporters to maintain. Acceptable because each is small (<100 lines) and they share the same DesignerState input.

## ADR-007 — Why no shadcn/ui

**Decision**: Hand-write Button / Input / Card / Dialog / Tabs / CodeBlock / Badge / FormField primitives.

**Why**: Vishal is learning the stack — readable hand-written primitives beat an opaque dependency. The 8 components total ~400 lines of TSX, much less than the shadcn install + Radix peer deps.

**Trade-off**: When we need a popover or a date picker we'll either write it or pull just that one piece.

## ADR-008 — Why Celery instead of FastAPI BackgroundTasks

**Decision**: Celery (+ Redis broker) for long-running jobs.

**Why**: Autopilot builds, evaluation runs, and document ingestion all need durability across API restarts. `BackgroundTasks` runs in-process — a restart drops the work.

**Trade-off**: A second container to operate. Worth it.

## ADR-009 — Why 17 stages, not fewer

**Decision**: Bake guardrails, observability, evaluation, and human-in-the-loop into the catalog from day one.

**Why**: Every real RAG system grows these. Starting with a 5-stage catalog and adding them later forces a UI rewrite and a state migration. Starting with 17 and letting unused ones stay at default is cheaper.

**Trade-off**: A first-time user sees more stages than they need. The Designer UI groups by category to make this manageable.

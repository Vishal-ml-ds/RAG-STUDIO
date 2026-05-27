# RAG STUDIO

A production-grade RAG (Retrieval-Augmented Generation) platform with a 17-stage designer pipeline, autopilot builds, configurable guardrails, and multi-format export.

Build a RAG pipeline visually, ship it as Python, YAML, Terraform, Docker Compose, or Kubernetes — without rewriting the orchestration code.

## Highlights

- **Designer pipeline** — 17 configurable stages from cloud/provider through observability, guardrails, human-in-the-loop, and review.
- **Autopilot builds** — generate a working pipeline from a natural-language brief.
- **Guardrails** — input/output policies for PII, toxicity, bias, and hallucination/factuality checks.
- **Export to anything** — Python (LangChain-style), YAML, Terraform (HCL), Docker Compose, Kubernetes manifests.
- **Data catalogs** — shared JSON catalogs for models, chunking strategies, retrieval, vector stores, pricing, templates.
- **Observability** — Prometheus + Grafana overlay (optional).
- **Deploy artifacts** — Docker Compose stacks for dev/prod/build, nginx reverse proxy, Kustomize-ready K8s manifests.

## Status

Early development. The repository layout, build pipeline, and base API are wired; feature work proceeds phase-by-phase. See [docs/public/architecture.md](docs/public/architecture.md) for design notes.

## Stack

| Layer | Choice |
|---|---|
| Web | Next.js 14 (App Router), React 18, Tailwind, Vitest, Playwright |
| API | FastAPI, SQLAlchemy, Alembic, Celery |
| Database | PostgreSQL 16 |
| Cache / queue | Redis |
| Vector DB | Qdrant (Weaviate adapter available) |
| ML tracking | MLflow |
| Object store | MinIO |
| Reverse proxy | nginx |
| Observability | Prometheus + Grafana (optional) |
| Orchestration | LangGraph / LangChain |

## Quick start

Prerequisites: Docker, Node 20+, Python 3.11+, [uv](https://github.com/astral-sh/uv).

```bash
git clone https://github.com/Vishal-ml-ds/RAG-STUDIO.git
cd RAG-STUDIO
cp .env.example .env
# fill in your provider keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
```

Run the full stack with Docker Compose:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.build.yml up --build -d
```

Or run apps directly for development:

```bash
npm install
npm run dev:full
# web  → http://localhost:3000
# api  → http://localhost:8000
```

See [docs/public/deployment.md](docs/public/deployment.md) for production deployment.

## Repository layout

```
RAG-STUDIO/
├── apps/
│   ├── web/        # Next.js 14 App Router
│   └── api/        # FastAPI + LangGraph + Celery worker
├── data/           # Shared catalogs (models, pricing, templates, strategies)
├── docker/         # Compose files + nginx + Prometheus/Grafana config
├── docs/
│   ├── public/     # Architecture, deployment, FAQ
│   └── internal/   # Design evolution notes
├── k8s/production/ # Namespace, workloads, ingress, HPA
├── scripts/        # Migration + helper scripts
├── .env.example
└── package.json    # npm workspaces
```

## License

MIT — see [LICENSE](LICENSE).

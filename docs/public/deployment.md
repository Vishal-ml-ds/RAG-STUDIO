# Deployment

Three supported targets share the same image and configuration:

1. **Local dev** (`npm run dev:full`) — uvicorn + next dev with SQLite + local Redis/Qdrant
2. **Docker Compose** — single-host production-shape stack
3. **Kubernetes** — production cluster

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node 20+ (for local dev)
- Python 3.11+ and [uv](https://github.com/astral-sh/uv) (for local dev)
- gh CLI authenticated to push images (for prod)

## Local development (no Docker)

```bash
# 1. clone + env
git clone https://github.com/Vishal-ml-ds/RAG-STUDIO.git
cd RAG-STUDIO
cp .env.example .env
# fill in OPENAI_API_KEY (or set OPENAI_COMPATIBLE_BASE_URL to your provider)

# 2. install
npm install                    # root workspaces

cd apps/api
uv venv && .venv\Scripts\activate
uv pip install -r requirements.txt -r requirements-dev.txt
cd ../..

# 3. run both
npm run dev:full
# → web  http://localhost:3000
# → api  http://localhost:8000
# → docs http://localhost:8000/docs
```

Bootstrap users (created automatically on first start):

- `admin@ragstudio.local` / `admin123`  (role: admin)
- `user@ragstudio.local` / `user123`    (role: user)

## Docker Compose

### Layout

The `docker/` folder ships five Compose files; you merge whichever overlays match your environment.

| File | Purpose |
|---|---|
| `docker-compose.yml` | Base — image-only, production-shape services |
| `docker-compose.build.yml` | Adds `build:` for api / worker / web |
| `docker-compose.dev.yml` | Dev — bind-mount source, publish all ports, hot reload, debugpy on 5678 |
| `docker-compose.prod.yml` | Prod — restart policies, resource limits, tight healthchecks |
| `docker-compose.observability.yml` | Adds Prometheus + Grafana |

### Common invocations

**Build everything from source and bring it up:**

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.build.yml \
  up --build -d
```

**Development overlay (host ports + hot reload):**

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.build.yml \
  -f docker/docker-compose.dev.yml \
  up --build -d
```

**Production stack:**

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  up -d
```

**Production + observability:**

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  -f docker/docker-compose.observability.yml \
  up -d
```

### Migrations

After the stack is up, run Alembic from inside the api container:

```bash
docker compose -f docker/docker-compose.yml exec api alembic upgrade head
# or from the host:
./scripts/migrate.sh
```

### URLs

| Service | URL |
|---|---|
| App (combined nginx entry) | http://localhost |
| Web direct | http://localhost:3000 (dev overlay only) |
| API direct | http://localhost:8000 (dev overlay only) |
| Qdrant dashboard | http://localhost:6333/dashboard (dev overlay only) |
| MLflow | http://localhost:5000 (dev overlay only) |
| MinIO console | http://localhost:9001 (dev overlay only) |
| Prometheus | http://localhost:9090 (observability overlay) |
| Grafana | http://localhost:3100 (observability overlay) |

`/docs` (Swagger) and `/redoc` are exposed only when `APP_ENV=development`.

## Kubernetes

```bash
# 1. create the namespace + ConfigMap
kubectl apply -f k8s/production/namespace.yaml
kubectl apply -f k8s/production/configmap.yaml

# 2. create the Secret — DO NOT commit real values
cp k8s/production/secret.example.yaml /tmp/secret.yaml
# edit /tmp/secret.yaml — replace all REPLACE-ME with real base64-encoded values
kubectl apply -f /tmp/secret.yaml
rm /tmp/secret.yaml

# 3. stateful workloads
kubectl apply -f k8s/production/postgres.yaml
kubectl apply -f k8s/production/redis.yaml
kubectl apply -f k8s/production/qdrant.yaml

# 4. app workloads
kubectl apply -f k8s/production/api.yaml
kubectl apply -f k8s/production/worker.yaml
kubectl apply -f k8s/production/web.yaml

# 5. ingress (edit host + TLS secret name first)
kubectl apply -f k8s/production/ingress.yaml

# OR apply everything via Kustomize after the Secret is in place:
kubectl apply -k k8s/production
```

### TODOs before applying to a real cluster

- Replace `rag.example.com` and `rag-studio-tls` in `k8s/production/ingress.yaml`
- Create a real `Secret` from your `.env` (the `secret.example.yaml` is a template only)
- Size CPU / memory `resources:` blocks for your traffic — defaults are modest dev sizing
- Wire image registry — by default manifests reference `ghcr.io/${GITHUB_REPOSITORY}/...:latest`

## Environment variables

See `.env.example` for the full list. Critical ones:

| Variable | Notes |
|---|---|
| `APP_ENV` | `development` / `production` / `test`. Production hides Swagger and requires JWT on `/api/*`. |
| `SECRET_KEY` | JWT signing key — generate via `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `DATABASE_URL` | `postgresql+asyncpg://...` for prod, `sqlite+aiosqlite:///./ragstudio.db` for dev |
| `REDIS_URL` | Used as Celery broker + result backend by default |
| `QDRANT_URL` | `http://qdrant:6333` inside Compose; cluster service name in K8s |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | LLM providers — pick what your stages call for |
| `AUTH_BOOTSTRAP_USERS` | CSV `email:password:role:uuid` — leave empty in production after creating real users |
| `MLFLOW_TRACKING_URI` | Optional, autopilot runs without it |

## Operations

### Health checks

- Liveness: `GET /health` — cheap, no dependency checks
- Readiness: `GET /ready` — verifies dependencies are responsive (future: probes DB, Redis, Qdrant)

K8s Deployments use both — liveness restarts crashed pods, readiness pauses traffic until the pod can serve.

### Logs

structlog emits JSON to stdout. `kubectl logs -f deployment/api -n rag-studio` or `docker compose logs -f api` is enough — point them at Loki, Datadog, or your preferred aggregator.

### Metrics

`prometheus-client` is wired but `/metrics` is not yet exposed by FastAPI — this is a follow-up. The Grafana overview dashboard ships with the queries pre-written so panels light up automatically once the endpoint lands.

### Backups

Postgres is the source of truth. Take logical dumps (`pg_dump`) into S3 / MinIO on a schedule. Qdrant snapshots via `qdrant-client.snapshots()` for vector backup.

### Rolling deploys

K8s Deployments use `RollingUpdate` with `maxSurge: 1`, `maxUnavailable: 0` — zero-downtime if `/ready` is implemented per dependency.

For Compose, `docker compose up -d` swaps containers; pair with the nginx upstream `max_fails` to keep connections live.

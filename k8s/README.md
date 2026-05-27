# Kubernetes Manifests

Production manifests for RAG Studio under `k8s/production/`, wired together
with Kustomize.

## Layout

| File                  | Purpose                                                                |
|-----------------------|------------------------------------------------------------------------|
| `namespace.yaml`      | `rag-studio` namespace                                                 |
| `configmap.yaml`      | Non-secret env (log level, service URLs, MLflow experiment)            |
| `secret.example.yaml` | Template Secret with `REPLACE-ME` placeholders                         |
| `postgres.yaml`       | StatefulSet + headless Service, 20Gi PVC                               |
| `redis.yaml`          | Deployment + Service, emptyDir storage                                 |
| `qdrant.yaml`         | StatefulSet + Service, 50Gi PVC                                        |
| `api.yaml`            | FastAPI Deployment (2 replicas) + Service + HPA (cpu 70%, min 2 max 8) |
| `worker.yaml`         | Celery worker Deployment (1 replica)                                   |
| `web.yaml`            | Next.js Deployment + Service + HPA                                     |
| `ingress.yaml`        | nginx-ingress, TLS placeholder, host `rag.example.com`                 |
| `kustomization.yaml`  | Kustomize entry point                                                  |

## Apply

The Secret is **not** managed by Kustomize. Create it first, then apply the
rest.

```bash
# 1. Create the Secret from your local .env (recommended).
kubectl create namespace rag-studio
kubectl create secret generic ragstudio-secrets \
  -n rag-studio \
  --from-env-file=.env

# 2. Apply everything else.
kubectl apply -k k8s/production
```

Alternative: copy `secret.example.yaml` to `secret.yaml` (gitignored), replace
every `REPLACE-ME`, and `kubectl apply -f secret.yaml`.

## Image tags

`api` and `web` Deployments point at `ghcr.io/vishal-ml-ds/rag-studio/<svc>:latest`.
Override per-environment via Kustomize image transformers:

```yaml
images:
  - name: ghcr.io/vishal-ml-ds/rag-studio/api
    newTag: v1.2.3
```

## Ingress

Replace `rag.example.com` and `rag-studio-tls` in `ingress.yaml` with the real
hostname and TLS secret before applying.

## TODO before first apply

- Create real Secret from `.env` (placeholders are non-functional)
- Replace ingress host + TLS secret
- Confirm StorageClass supports `ReadWriteOnce` PVCs
- Adjust HPA targets to actual load profile

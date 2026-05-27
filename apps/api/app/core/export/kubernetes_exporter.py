"""Render a DesignerState as Kubernetes manifests (multi-document YAML).

Emits Namespace, Deployment, Service, and ConfigMap documents stitched
together with ``---`` separators. Hand-rolled — keeps the dependency
surface tight (no PyYAML required).
"""

from __future__ import annotations

from typing import Any


def _slug(value: str) -> str:
    keep = [c if c.isalnum() else "-" for c in value.lower()]
    slug = "".join(keep).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "ragstudio"


def _get(stages: dict, stage_id: str, key: str, default: Any) -> Any:
    return stages.get(stage_id, {}).get(key, default)


def export_kubernetes(stages: dict, *, project_name: str) -> str:
    namespace = _slug(project_name)
    vector_provider = str(_get(stages, "vector_store", "provider", "qdrant"))
    vector_collection = str(_get(stages, "vector_store", "collection", "default"))
    embedding_model = str(
        _get(stages, "embedding", "model", "text-embedding-3-small")
    )
    generator_model = str(_get(stages, "generator", "model", "gpt-4o-mini"))
    top_k = int(_get(stages, "retrieval", "top_k", 5))

    namespace_doc = f"""apiVersion: v1
kind: Namespace
metadata:
  name: {namespace}
  labels:
    app.kubernetes.io/managed-by: rag-studio
"""

    configmap_doc = f"""apiVersion: v1
kind: ConfigMap
metadata:
  name: rag-config
  namespace: {namespace}
data:
  VECTOR_PROVIDER: "{vector_provider}"
  VECTOR_COLLECTION: "{vector_collection}"
  EMBEDDING_MODEL: "{embedding_model}"
  GENERATOR_MODEL: "{generator_model}"
  TOP_K: "{top_k}"
"""

    deployment_doc = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-api
  namespace: {namespace}
  labels:
    app: rag-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rag-api
  template:
    metadata:
      labels:
        app: rag-api
    spec:
      containers:
        - name: api
          image: ghcr.io/your-org/rag-studio-api:latest
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: rag-config
          readinessProbe:
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 30
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 2Gi
"""

    service_doc = f"""apiVersion: v1
kind: Service
metadata:
  name: rag-api
  namespace: {namespace}
spec:
  type: ClusterIP
  selector:
    app: rag-api
  ports:
    - name: http
      port: 80
      targetPort: 8000
"""

    qdrant_deployment = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: qdrant
  namespace: {namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qdrant
  template:
    metadata:
      labels:
        app: qdrant
    spec:
      containers:
        - name: qdrant
          image: qdrant/qdrant:v1.9.1
          ports:
            - containerPort: 6333
            - containerPort: 6334
"""

    qdrant_service = f"""apiVersion: v1
kind: Service
metadata:
  name: qdrant
  namespace: {namespace}
spec:
  type: ClusterIP
  selector:
    app: qdrant
  ports:
    - name: http
      port: 6333
      targetPort: 6333
    - name: grpc
      port: 6334
      targetPort: 6334
"""

    header = (
        f"# RAG-Studio Kubernetes export\n"
        f"# project   : {project_name}\n"
        f"# namespace : {namespace}\n"
    )

    docs = [
        namespace_doc,
        configmap_doc,
        deployment_doc,
        service_doc,
        qdrant_deployment,
        qdrant_service,
    ]
    return header + "---\n" + "---\n".join(docs)

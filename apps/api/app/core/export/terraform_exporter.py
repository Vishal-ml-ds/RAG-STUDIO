"""Render a DesignerState as Terraform HCL.

Emits provider-agnostic local-first stubs for Qdrant, Postgres and Redis
using the ``docker_container`` resource from ``kreuzwerker/docker``. Real
production exports would target AWS / GCP equivalents; that swap is a
single provider block here.
"""

from __future__ import annotations

from typing import Any


def _slug(value: str) -> str:
    keep = [c if c.isalnum() else "_" for c in value.lower()]
    slug = "".join(keep).strip("_")
    return slug or "project"


def _get(stages: dict, stage_id: str, key: str, default: Any) -> Any:
    return stages.get(stage_id, {}).get(key, default)


def export_terraform(stages: dict, *, project_name: str) -> str:
    name = _slug(project_name)
    vector_provider = _get(stages, "vector_store", "provider", "qdrant")
    vector_collection = _get(stages, "vector_store", "collection", "default")
    cloud_region = _get(stages, "cloud_provider", "region", "us-east-1")
    deployment_target = _get(stages, "deployment", "target", "docker-compose")

    return f'''# RAG-Studio Terraform export
# project        : {project_name}
# vector store   : {vector_provider} (collection={vector_collection})
# cloud region   : {cloud_region}
# deployment     : {deployment_target}

terraform {{
  required_version = ">= 1.5.0"
  required_providers {{
    docker = {{
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }}
  }}
}}

provider "docker" {{}}

variable "project_name" {{
  description = "Logical name for this RAG project"
  type        = string
  default     = "{name}"
}}

variable "qdrant_image" {{
  type    = string
  default = "qdrant/qdrant:v1.9.1"
}}

variable "postgres_image" {{
  type    = string
  default = "postgres:16-alpine"
}}

variable "redis_image" {{
  type    = string
  default = "redis:7-alpine"
}}

resource "docker_network" "rag" {{
  name = "${{var.project_name}}-net"
}}

resource "docker_image" "qdrant" {{
  name         = var.qdrant_image
  keep_locally = true
}}

resource "docker_container" "qdrant" {{
  name  = "${{var.project_name}}-qdrant"
  image = docker_image.qdrant.image_id

  networks_advanced {{
    name = docker_network.rag.name
  }}

  ports {{
    internal = 6333
    external = 6333
  }}
}}

resource "docker_image" "postgres" {{
  name         = var.postgres_image
  keep_locally = true
}}

resource "docker_container" "postgres" {{
  name  = "${{var.project_name}}-postgres"
  image = docker_image.postgres.image_id

  env = [
    "POSTGRES_USER=ragstudio",
    "POSTGRES_PASSWORD=ragstudio",
    "POSTGRES_DB={name}",
  ]

  networks_advanced {{
    name = docker_network.rag.name
  }}

  ports {{
    internal = 5432
    external = 5432
  }}
}}

resource "docker_image" "redis" {{
  name         = var.redis_image
  keep_locally = true
}}

resource "docker_container" "redis" {{
  name  = "${{var.project_name}}-redis"
  image = docker_image.redis.image_id

  networks_advanced {{
    name = docker_network.rag.name
  }}

  ports {{
    internal = 6379
    external = 6379
  }}
}}

output "qdrant_url" {{
  value = "http://localhost:6333"
}}

output "postgres_url" {{
  value = "postgresql://ragstudio:ragstudio@localhost:5432/{name}"
}}

output "redis_url" {{
  value = "redis://localhost:6379/0"
}}
'''

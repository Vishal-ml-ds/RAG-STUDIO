#!/usr/bin/env bash
# Run Alembic migrations against the database configured by DATABASE_URL.
set -euo pipefail

cd "$(dirname "$0")/../apps/api"

echo "→ applying migrations to: ${DATABASE_URL:-from .env}"
alembic upgrade head

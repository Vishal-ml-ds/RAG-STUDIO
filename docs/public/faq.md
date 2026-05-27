# FAQ

## What is RAG Studio?

A platform for designing, evaluating, and shipping RAG (Retrieval-Augmented Generation) pipelines. You configure a 17-stage pipeline visually (or generate one from a brief), run evaluations against your data, and export the final pipeline as Python, YAML, Terraform, Docker Compose, or Kubernetes — without rewriting the orchestration code.

## Who is this for?

- ML engineers building RAG systems who want to skip the orchestration boilerplate
- Teams comparing retrieval / chunking / embedding strategies on the same corpus
- Engineers shipping a RAG pipeline to production who want guardrails, observability, and an export they can audit

## Do I have to use Docker?

No. Local dev runs with `npm run dev:full` against SQLite + local Redis/Qdrant. Docker is recommended once you need multi-service consistency.

## Which LLM providers are supported?

OpenAI, Anthropic, Cohere, Google, Mistral, and any OpenAI-compatible endpoint (Together, Groq, vLLM, Ollama, Euri). Set the relevant `*_API_KEY` in `.env` and pick the model in the Designer's Generator stage.

## Where does the data live?

- Application state — Postgres
- Embeddings — Qdrant (default) or Weaviate / pgvector / Chroma via stage config
- Cache + Celery broker — Redis
- Documents — MinIO / S3
- ML run history — MLflow

## How do I add a new pipeline stage?

Stages are JSON. Edit `data/designer_stages.json`, add an entry with `id`, `name`, `category`, `description`, `default` config — done. No code change needed for the catalog, the Designer UI, or the persistence layer.

## How do I add a new LLM provider?

Add an entry to `data/pricing.json` (so the cost estimator sees it) and `data/embeddings.json` if it offers embeddings. The Generator stage reads providers from the catalog at runtime; the actual API call is dispatched by LangChain's provider router.

## How are secrets handled?

- `.env` is git-ignored — never commit it
- Production K8s uses real `Secret` resources (not the example template)
- The JWT is in an httpOnly cookie on the web side — it never reaches the browser
- LLM API keys live only on the api process, never in the frontend bundle

## Does autopilot actually use an LLM?

The current heuristic builder maps brief keywords to default stage configs deterministically. The hooks for a real LLM-driven builder are in `app/core/autopilot/builder.py` — wiring it to a LangGraph agent is the next step.

## Does the evaluation use RAGAS for real?

The wiring is there — `app/core/evaluation/ragas_runner.py` calls `ragas.evaluate()` when `OPENAI_API_KEY` is set. Without a key it returns a deterministic stub so the endpoint works in dev. Bring your own `Dataset` of `(question, answer, contexts, ground_truth)` tuples to run the real eval.

## Can I run this on a single VPS?

Yes. The Compose prod overlay is tuned for single-host. Use the nginx entry on `:80`, point a domain, add Let's Encrypt (Certbot) for TLS, and you're live. Caveat: vector indexes and Postgres on the same node compete for memory — size accordingly.

## Why no light mode?

Vishal's preference. A toggle is a 50-line PR if you want one.

## Why is the original 463 files and this isn't?

This is a rebuild. The original (https://github.com/anulsasidharan/Unified-RAG-Studio) accreted features over 4 weeks; this rebuild captures the same architecture across 21 phases with leaner code and cleaner naming. Built with permission from Anu.

## How do I contribute?

This repo accepts PRs against `main`. Follow the conventional commit style already in place (`feat(scope):`, `fix(scope):`). Don't introduce new dependencies without a 1-line justification in the PR description.

"""Prometheus metrics — HTTP latency + custom RAG counters.

Wired into FastAPI via `app/routers/metrics.py` (exposes /metrics) and called
from the observability middleware in main.py to record request timings.
"""

from prometheus_client import Counter, Histogram

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests, labelled by method, route, and status code.",
    labelnames=["method", "route", "status_code"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds.",
    labelnames=["method", "route"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

rag_inference_seconds = Histogram(
    "rag_inference_seconds",
    "End-to-end RAG inference latency (retrieval + generation).",
    labelnames=["project_id"],
)

guardrail_triggers_total = Counter(
    "guardrail_triggers_total",
    "Number of times a guardrail blocked or flagged content.",
    labelnames=["detector", "decision"],
)


def observe_http_request(
    *, method: str, route: str, status_code: int, duration_seconds: float
) -> None:
    http_requests_total.labels(method=method, route=route, status_code=str(status_code)).inc()
    http_request_duration_seconds.labels(method=method, route=route).observe(duration_seconds)

"""Heuristic brief → DesignerState builder.

This is intentionally a deterministic, dependency-free seed for what will
eventually be an LLM-driven planner. We score keyword signals in the brief
and override defaults from :data:`DEFAULT_STAGE_CONFIG` accordingly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.core.designer import DEFAULT_STAGE_CONFIG


@dataclass
class AutopilotPlan:
    project_name: str
    description: str
    stages: dict[str, dict[str, Any]]
    reasoning: list[str] = field(default_factory=list)


# Keyword → stage overrides. Each entry contributes a partial config that
# is merged into the running plan when any of its triggers is found in the
# brief. Order matters: later entries override earlier ones.
_KEYWORD_RULES: list[tuple[tuple[str, ...], dict[str, dict[str, Any]], str]] = [
    (
        ("pdf", "manual", "ebook", "book"),
        {
            "document_loader": {"loaders": ["pdf"]},
            "chunking": {"strategy": "recursive", "chunk_size": 1000, "chunk_overlap": 200},
        },
        "Brief mentions PDFs → enable PDF loader and recursive chunking.",
    ),
    (
        ("docx", "word", "ms word"),
        {"document_loader": {"loaders": ["docx"]}},
        "Brief mentions DOCX → enable DOCX loader.",
    ),
    (
        ("html", "website", "web page", "scrape", "crawl"),
        {
            "document_loader": {"loaders": ["html"]},
            "data_source": {"type": "urls", "paths": []},
        },
        "Brief mentions web content → switch source to URLs and HTML loader.",
    ),
    (
        ("code", "repo", "repository", "source code", "github"),
        {
            "document_loader": {"loaders": ["code", "markdown"]},
            "chunking": {"strategy": "ast", "chunk_size": 1500, "chunk_overlap": 100},
            "generator": {
                "provider": "anthropic",
                "model": "claude-3-5-sonnet-latest",
                "temperature": 0.0,
            },
        },
        "Brief mentions code → AST chunking + Anthropic Claude for code explanations.",
    ),
    (
        ("legal", "contract", "clause"),
        {
            "chunking": {"strategy": "clause", "chunk_size": 1200, "chunk_overlap": 250},
            "retrieval": {"strategy": "hybrid", "top_k": 10},
            "reranker": {"enabled": True, "provider": "cohere", "model": "rerank-english-v3.0"},
            "human_in_the_loop": {"enabled": True, "trigger": "always"},
        },
        "Legal domain → clause chunking, hybrid retrieval with reranker, HITL on.",
    ),
    (
        ("medical", "clinical", "pubmed", "healthcare"),
        {
            "embedding": {"provider": "openai", "model": "text-embedding-3-large"},
            "retrieval": {"strategy": "hybrid", "top_k": 12},
            "reranker": {"enabled": True, "provider": "cohere", "model": "rerank-english-v3.0"},
            "guardrails": {"input": ["pii"], "output": ["hallucination", "bias", "toxicity"]},
            "human_in_the_loop": {"enabled": True, "trigger": "always"},
        },
        "Healthcare domain → larger embedding, hybrid retrieval, strict guardrails, HITL.",
    ),
    (
        ("finance", "filing", "earnings", "10-k", "10k", "10-q"),
        {
            "chunking": {"strategy": "section", "chunk_size": 1500, "chunk_overlap": 300},
            "embedding": {"provider": "openai", "model": "text-embedding-3-large"},
            "retrieval": {"strategy": "hybrid", "top_k": 10},
            "reranker": {"enabled": True, "provider": "cohere", "model": "rerank-english-v3.0"},
            "generator": {"provider": "openai", "model": "gpt-4o", "temperature": 0.0},
        },
        "Finance domain → section chunking, gpt-4o, hybrid retrieval + reranker.",
    ),
    (
        ("support", "ticket", "faq", "customer"),
        {
            "chunking": {"strategy": "recursive", "chunk_size": 600, "chunk_overlap": 100},
            "retrieval": {"strategy": "hybrid", "top_k": 6},
            "reranker": {"enabled": True, "provider": "cohere", "model": "rerank-english-v3.0"},
            "human_in_the_loop": {"enabled": True, "trigger": "low_confidence"},
        },
        "Support domain → smaller chunks, hybrid + reranker, HITL on low confidence.",
    ),
    (
        ("multilingual", "translate", "spanish", "french", "german", "chinese", "hindi"),
        {"embedding": {"provider": "openai", "model": "text-embedding-3-large"}},
        "Multilingual content → upgrade embedding to text-embedding-3-large.",
    ),
    (
        ("fast", "cheap", "low cost", "budget"),
        {"generator": {"provider": "openai", "model": "gpt-4o-mini", "temperature": 0.2}},
        "Budget-conscious brief → keep generator on gpt-4o-mini.",
    ),
    (
        ("high accuracy", "production", "enterprise", "compliance"),
        {
            "generator": {"provider": "openai", "model": "gpt-4o", "temperature": 0.0},
            "evaluation": {
                "framework": "ragas",
                "metrics": [
                    "faithfulness",
                    "answer_relevancy",
                    "context_precision",
                    "context_recall",
                ],
            },
            "observability": {"tracing": True, "metrics": True, "log_level": "INFO"},
        },
        "High-stakes brief → gpt-4o, full RAGAS metric panel, observability on.",
    ),
    (
        ("kubernetes", "k8s", "cluster"),
        {"deployment": {"target": "kubernetes"}},
        "Kubernetes mentioned → deployment target = kubernetes.",
    ),
    (
        ("serverless", "lambda", "cloudrun"),
        {"deployment": {"target": "serverless"}},
        "Serverless mentioned → deployment target = serverless.",
    ),
]


def _starter_state() -> dict[str, dict[str, Any]]:
    return {k: dict(v) for k, v in DEFAULT_STAGE_CONFIG.items()}


def _merge_into(
    state: dict[str, dict[str, Any]], overrides: dict[str, dict[str, Any]]
) -> None:
    for stage_id, patch in overrides.items():
        target = state.setdefault(stage_id, {})
        target.update(patch)


def _derive_name(brief: str) -> str:
    cleaned = brief.strip()
    if not cleaned:
        return "Autopilot Project"
    head = cleaned.split(".")[0].strip()
    if len(head) > 80:
        head = head[:77].rstrip() + "..."
    return head.capitalize() if head else "Autopilot Project"


def build_state_from_brief(brief: str) -> AutopilotPlan:
    """Map a natural-language brief to a complete DesignerState plan."""
    lowered = (brief or "").lower()
    stages = _starter_state()
    reasoning: list[str] = []

    for triggers, overrides, why in _KEYWORD_RULES:
        if any(trigger in lowered for trigger in triggers):
            _merge_into(stages, overrides)
            reasoning.append(why)

    if not reasoning:
        reasoning.append(
            "No domain keywords matched — applied platform defaults across all stages."
        )

    return AutopilotPlan(
        project_name=_derive_name(brief),
        description=brief.strip() or "Auto-generated project",
        stages=stages,
        reasoning=reasoning,
    )


__all__ = ["AutopilotPlan", "build_state_from_brief"]

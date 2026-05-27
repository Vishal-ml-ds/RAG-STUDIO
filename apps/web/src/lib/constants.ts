import type { ExportFormat, StageCategory, StageDescriptor } from "@/lib/types";

/** Cookie name used to store the JWT (httpOnly, set by route handlers). */
export const SESSION_COOKIE = "rag_session";

/** Default backend base URL when NEXT_PUBLIC_API_URL is unset. */
export const DEFAULT_API_URL = "http://127.0.0.1:8000";

/**
 * Mirrors data/designer_stages.json. Used for client-side rendering when the
 * server has not yet fetched the live catalog. The backend remains the source
 * of truth — components should prefer the catalog passed from the server.
 */
export const DESIGNER_STAGES: StageDescriptor[] = [
  {
    id: "cloud_provider",
    name: "Cloud & Provider",
    category: "infrastructure",
    description:
      "Choose cloud provider (AWS / GCP / Azure / on-prem) and region.",
    default: { provider: "aws", region: "us-east-1" },
  },
  {
    id: "data_source",
    name: "Data Source",
    category: "ingestion",
    description: "Files, URLs, databases, or APIs feeding the corpus.",
    default: { type: "files", paths: [] },
  },
  {
    id: "document_loader",
    name: "Document Loader",
    category: "ingestion",
    description: "Parser for PDFs, DOCX, HTML, Markdown, JSON.",
    default: { loaders: ["pdf", "docx", "html"] },
  },
  {
    id: "chunking",
    name: "Chunking Strategy",
    category: "ingestion",
    description: "How documents are split before embedding.",
    default: { strategy: "recursive", chunk_size: 1000, chunk_overlap: 200 },
  },
  {
    id: "embedding",
    name: "Embedding Model",
    category: "ingestion",
    description: "Vector encoder for text to vector.",
    default: { provider: "openai", model: "text-embedding-3-small" },
  },
  {
    id: "vector_store",
    name: "Vector Store",
    category: "ingestion",
    description: "Where embeddings live (Qdrant, Weaviate, pgvector, FAISS).",
    default: { provider: "qdrant", collection: "default" },
  },
  {
    id: "retrieval",
    name: "Retrieval Strategy",
    category: "query",
    description: "Dense / sparse / hybrid + top-k.",
    default: { strategy: "dense", top_k: 5 },
  },
  {
    id: "reranker",
    name: "Reranker",
    category: "query",
    description: "Cross-encoder reranking after initial retrieval (optional).",
    default: {
      enabled: false,
      provider: "cohere",
      model: "rerank-english-v3.0",
    },
  },
  {
    id: "context_assembly",
    name: "Context Assembly",
    category: "query",
    description: "How retrieved chunks are merged into the prompt.",
    default: { max_tokens: 3000, include_metadata: true },
  },
  {
    id: "prompt",
    name: "Prompt Template",
    category: "query",
    description: "System + user prompt scaffold.",
    default: {
      system:
        "You are a helpful assistant grounded in the provided context.",
      user_template: "{question}\n\nContext:\n{context}",
    },
  },
  {
    id: "generator",
    name: "Generator (LLM)",
    category: "query",
    description: "The model that writes the final answer.",
    default: { provider: "openai", model: "gpt-4o-mini", temperature: 0.2 },
  },
  {
    id: "guardrails",
    name: "Guardrails",
    category: "safety",
    description:
      "Input / output policies (PII, toxicity, bias, hallucination).",
    default: { input: ["pii"], output: ["toxicity", "hallucination"] },
  },
  {
    id: "human_in_the_loop",
    name: "Human-in-the-Loop",
    category: "safety",
    description: "Approval gates for sensitive answers.",
    default: { enabled: false, trigger: "low_confidence" },
  },
  {
    id: "evaluation",
    name: "Evaluation",
    category: "quality",
    description:
      "RAGAS metrics (faithfulness, answer relevancy, context precision).",
    default: {
      framework: "ragas",
      metrics: ["faithfulness", "answer_relevancy", "context_precision"],
    },
  },
  {
    id: "observability",
    name: "Observability",
    category: "ops",
    description: "Tracing, metrics, request logs.",
    default: { tracing: true, metrics: true, log_level: "INFO" },
  },
  {
    id: "deployment",
    name: "Deployment Target",
    category: "ops",
    description: "How the pipeline ships (Docker Compose, K8s, serverless).",
    default: { target: "docker-compose" },
  },
  {
    id: "review",
    name: "Review & Export",
    category: "ops",
    description: "Final sign-off + export to Python / YAML / Terraform / K8s.",
    default: { exports: ["python", "yaml"] },
  },
];

export const STAGE_CATEGORIES: Array<{
  id: StageCategory;
  label: string;
  hint: string;
}> = [
  { id: "infrastructure", label: "Infrastructure", hint: "Where it runs" },
  { id: "ingestion", label: "Ingestion", hint: "Data in" },
  { id: "query", label: "Query", hint: "How it answers" },
  { id: "safety", label: "Safety", hint: "Guardrails" },
  { id: "quality", label: "Quality", hint: "Evaluation" },
  { id: "ops", label: "Ops", hint: "Deploy & observe" },
];

export const CATEGORY_ACCENT: Record<StageCategory, string> = {
  infrastructure: "border-blue-500/40 bg-blue-500/5",
  ingestion: "border-emerald-500/40 bg-emerald-500/5",
  query: "border-violet-500/40 bg-violet-500/5",
  safety: "border-amber-500/40 bg-amber-500/5",
  quality: "border-cyan-500/40 bg-cyan-500/5",
  ops: "border-rose-500/40 bg-rose-500/5",
};

export const EXPORT_FORMATS: Array<{
  id: ExportFormat;
  label: string;
  filename: string;
  language: string;
}> = [
  { id: "python", label: "Python", filename: "pipeline.py", language: "python" },
  { id: "yaml", label: "YAML", filename: "pipeline.yaml", language: "yaml" },
  {
    id: "terraform",
    label: "Terraform",
    filename: "main.tf",
    language: "hcl",
  },
  {
    id: "docker-compose",
    label: "Docker Compose",
    filename: "docker-compose.yml",
    language: "yaml",
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    filename: "manifests.yaml",
    language: "yaml",
  },
];

/**
 * TypeScript mirrors of the Pydantic schemas exposed by apps/api.
 * Keep this file in sync with apps/api/app/schemas/*.
 */

export type UUID = string;

// ---- Auth -----------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CurrentUserResponse {
  id: UUID;
  email: string;
  name: string | null;
  role: string;
}

// ---- Projects -------------------------------------------------------------

export interface ProjectCreate {
  name: string;
  description?: string | null;
}

export interface ProjectUpdate {
  name?: string | null;
  description?: string | null;
  status?: string | null;
}

export interface ProjectResponse {
  id: UUID;
  user_id: UUID;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  items: ProjectResponse[];
  total: number;
  page: number;
  page_size: number;
}

// ---- Designer ------------------------------------------------------------

export type StageCategory =
  | "infrastructure"
  | "ingestion"
  | "query"
  | "safety"
  | "quality"
  | "ops";

export interface StageDescriptor {
  id: string;
  name: string;
  category: StageCategory;
  description: string;
  default: Record<string, unknown>;
}

export interface StagesCatalogResponse {
  version: number;
  stages: StageDescriptor[];
}

export type StageConfig = Record<string, unknown>;

export interface DesignerStatePut {
  stages: Record<string, StageConfig>;
}

export interface DesignerStateResponse {
  id: UUID;
  project_id: UUID;
  version: number;
  stages: Record<string, StageConfig>;
  created_at: string;
  updated_at: string;
}

// ---- Templates -----------------------------------------------------------

export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  recommended_use_cases: string[];
}

export interface TemplateResponse extends TemplateSummary {
  stages: Record<string, StageConfig>;
}

export interface TemplateListResponse {
  version: number;
  templates: TemplateSummary[];
}

export interface TemplateInstantiateRequest {
  project_id: string;
}

// ---- Export --------------------------------------------------------------

export type ExportFormat =
  | "python"
  | "yaml"
  | "terraform"
  | "docker-compose"
  | "kubernetes";

export interface ExportResponse {
  project_id: string;
  format: ExportFormat;
  filename: string;
  content: string;
}

// ---- Guardrails ----------------------------------------------------------

export interface GuardrailCheckRequest {
  text: string;
  direction?: "input" | "output";
  context?: string | null;
  project_id?: UUID | null;
  policies?: string[] | null;
}

export interface FindingResponse {
  check: string;
  severity: string;
  message: string;
  matches: string[];
  metadata: Record<string, unknown>;
}

export interface GuardrailCheckResponse {
  allowed: boolean;
  direction: "input" | "output";
  policies_applied: string[];
  findings: FindingResponse[];
}

// ---- Evaluation ----------------------------------------------------------

export interface EvaluationRunRequest {
  metrics?: string[] | null;
  dataset_ref?: string | null;
  sample_count?: number;
}

export interface EvaluationRunResponse {
  id: UUID;
  project_id: UUID;
  framework: string;
  mode: string;
  status: string;
  dataset_ref: string | null;
  metrics: string[];
  scores: Record<string, number>;
  summary: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---- Autopilot -----------------------------------------------------------

export interface AutopilotBuildRequest {
  brief: string;
  name?: string | null;
}

export interface AutopilotBuildResponse {
  project_id: UUID;
  build_history_id: UUID;
  name: string;
  description: string;
  state: Record<string, StageConfig>;
  reasoning: string[];
  created_at: string;
}

// ---- API errors ----------------------------------------------------------

export interface ApiErrorBody {
  detail?: string | Array<{ msg: string; loc?: (string | number)[] }>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

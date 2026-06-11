export const HBCE_API_V1_CLIENT_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-CLIENT-INTERNAL-v0.1.1-TYPED_ERROR_RESPONSE_FIX" as const;

export const HBCE_DEFAULT_API_V1_BASE_URL =
  "https://hbce-ai-joker-c2.vercel.app" as const;

export type HbceJson =
  | string
  | number
  | boolean
  | null
  | HbceJson[]
  | { [key: string]: HbceJson };

export type HbceJsonObject = { [key: string]: HbceJson };

export type HbceApiV1ClientConfig = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
};

export type HbceApiV1RequestOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
};

export type HbceApiV1Response<TBody = unknown> = {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  headers: Record<string, string>;
  data: TBody | null;
  text: string;
};

export type HbceApiV1SessionInput = {
  humanIpr: string;
  runtimeIpr?: string;
  tenant?: string;
  workspace?: string;
  sessionIntent?: string;
  idempotencyKey?: string;
};

export type HbceApiV1ChatInput = {
  sessionId: string;
  humanIpr: string;
  message: string;
  runtimeIpr?: string;
  tenant?: string;
  workspace?: string;
  idempotencyKey?: string;
  context?: HbceJsonObject;
};

export type HbceApiV1FileDescriptor = {
  filename: string;
  mimeType?: string;
  size?: number;
  sha256?: string;
  role?: string;
  constraints?: HbceJsonObject;
};

export type HbceApiV1FilesInput = {
  sessionId: string;
  humanIpr: string;
  files: HbceApiV1FileDescriptor[];
  runtimeIpr?: string;
  tenant?: string;
  workspace?: string;
  idempotencyKey?: string;
};

export type HbceApiV1OperationInput = {
  operationType: string;
  subjectIpr: string;
  payload: HbceJsonObject;
  sessionId?: string;
  humanIpr?: string;
  runtimeIpr?: string;
  tenant?: string;
  workspace?: string;
  constraints?: HbceJsonObject;
  idempotencyKey?: string;
  callbackUrl?: string;
};

export type HbceSourceIntelligenceQuery = {
  sourceSet?: string;
  sourceId?: string;
  mode?: string;
};

export class HbceApiV1Error<TBody = unknown> extends Error {
  public readonly status: number;
  public readonly response: HbceApiV1Response<TBody>;

  constructor(message: string, response: HbceApiV1Response<TBody>) {
    super(message);
    this.name = "HbceApiV1Error";
    this.status = response.status;
    this.response = response;
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeBaseUrl(baseUrl?: string): string {
  const raw = baseUrl?.trim() || HBCE_DEFAULT_API_V1_BASE_URL;
  return trimTrailingSlash(raw);
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: HbceApiV1RequestOptions["query"]
): string {
  const url = new URL(`${trimTrailingSlash(baseUrl)}${normalizePath(path)}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function maybeJson(text: string): unknown | null {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function withTimeout(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout)
  };
}

function asJsonObject<TInput extends object>(input: TInput): HbceJsonObject {
  return input as unknown as HbceJsonObject;
}

export class HbceApiV1Client {
  public readonly baseUrl: string;
  public readonly apiKey?: string;
  public readonly timeoutMs: number;
  public readonly revision = HBCE_API_V1_CLIENT_REVISION;

  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(config: HbceApiV1ClientConfig = {}) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 55_000;
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async request<TBody = unknown>(
    method: "GET" | "POST",
    path: string,
    body?: HbceJsonObject,
    options: HbceApiV1RequestOptions = {}
  ): Promise<HbceApiV1Response<TBody>> {
    const timeout = withTimeout(options.timeoutMs ?? this.timeoutMs);
    const url = buildUrl(this.baseUrl, path, options.query);

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.defaultHeaders,
      ...options.headers
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (this.apiKey) {
      headers["x-hbce-api-key"] = this.apiKey;
    }

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: timeout.signal,
        cache: "no-store"
      });

      const text = await response.text();
      const parsed = maybeJson(text) as TBody | null;

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url,
        headers: headersToObject(response.headers),
        data: parsed,
        text
      };
    } finally {
      timeout.clear();
    }
  }

  async get<TBody = unknown>(
    path: string,
    options?: HbceApiV1RequestOptions
  ): Promise<HbceApiV1Response<TBody>> {
    return this.request<TBody>("GET", path, undefined, options);
  }

  async post<TBody = unknown>(
    path: string,
    body: HbceJsonObject,
    options?: HbceApiV1RequestOptions
  ): Promise<HbceApiV1Response<TBody>> {
    return this.request<TBody>("POST", path, body, options);
  }

  async expectOk<TBody = unknown>(
    responsePromise: Promise<HbceApiV1Response<TBody>>
  ): Promise<HbceApiV1Response<TBody>> {
    const response = await responsePromise;

    if (!response.ok) {
      throw new HbceApiV1Error(
        `HBCE API v1 request failed with HTTP ${response.status}`,
        response
      );
    }

    return response;
  }

  root(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1", options);
  }

  health(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/health", options);
  }

  capabilities(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/capabilities", options);
  }

  selfTest(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/self-test", options);
  }

  openapi(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/openapi", options);
  }

  sessionContract(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/ipr/session", options);
  }

  createSession(input: HbceApiV1SessionInput, options?: HbceApiV1RequestOptions) {
    return this.post("/api/v1/ipr/session", asJsonObject(input), options);
  }

  getSession(sessionId: string, options?: HbceApiV1RequestOptions) {
    return this.get(`/api/v1/ipr/session/${encodeURIComponent(sessionId)}`, options);
  }

  chatContract(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/chat", options);
  }

  chat(input: HbceApiV1ChatInput, options?: HbceApiV1RequestOptions) {
    return this.post("/api/v1/chat", asJsonObject(input), options);
  }

  filesContract(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/files", options);
  }

  files(input: HbceApiV1FilesInput, options?: HbceApiV1RequestOptions) {
    return this.post("/api/v1/files", asJsonObject(input), options);
  }

  operationsContract(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/operations", options);
  }

  createOperation(input: HbceApiV1OperationInput, options?: HbceApiV1RequestOptions) {
    return this.post("/api/v1/operations", asJsonObject(input), options);
  }

  getOperation(operationId: string, options?: HbceApiV1RequestOptions) {
    return this.get(`/api/v1/operations/${encodeURIComponent(operationId)}`, options);
  }

  events(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/events", options);
  }

  opc(opcId: string, options?: HbceApiV1RequestOptions) {
    return this.get(`/api/v1/opc/${encodeURIComponent(opcId)}`, options);
  }

  audit(auditId: string, options?: HbceApiV1RequestOptions) {
    return this.get(`/api/v1/audit/${encodeURIComponent(auditId)}`, options);
  }

  modelUsage(usageId: string, options?: HbceApiV1RequestOptions) {
    return this.get(`/api/v1/model-usage/${encodeURIComponent(usageId)}`, options);
  }

  sourceIntelligence(
    query?: HbceSourceIntelligenceQuery,
    options?: HbceApiV1RequestOptions
  ) {
    return this.get("/api/v1/source-intelligence", {
      ...options,
      query: {
        ...query,
        ...options?.query
      }
    });
  }

  demoIprAiAuditTrail(options?: HbceApiV1RequestOptions) {
    return this.get("/api/v1/demo/ipr-ai-audit-trail", options);
  }
}

export function createHbceApiV1Client(
  config: HbceApiV1ClientConfig = {}
): HbceApiV1Client {
  return new HbceApiV1Client(config);
}

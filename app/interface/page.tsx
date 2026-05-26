"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type RuntimeHealth = {
  ok?: boolean;
  runtime?: string;
  state?: string;
  provider?: string;
  apiMode?: string;
  model?: string;
  standardModel?: string;
  deepModel?: string;
  openAIConfigured?: boolean;
  operationalContext?: Record<string, unknown>;
  identity?: {
    entity?: string;
    ipr?: string;
    evt?: string;
    prev?: string;
    eventFamily?: string;
    state?: string;
    cycle?: string;
    core?: string;
    org?: string;
    location?: string;
    projectBirth?: Record<string, unknown>;
    monthlyReference?: Record<string, unknown>;
    previousCheckpointRef?: Record<string, unknown>;
    monthlyRef?: Record<string, unknown>;
  };
  access?: {
    decision?: string;
    matrixState?: string;
    semanticMemoryScope?: string;
    identityBinding?: string;
  };
  memory?: {
    scope?: string;
    authority?: string;
    persistenceMode?: string;
    reason?: string;
  };
  matrix?: {
    state?: string;
    active?: boolean;
    reason?: string;
  };
  boundary?: {
    legalCertification?: boolean;
    aiGovernanceBoundary?: string;
    useDemocraticBoundary?: string;
    memoryBoundary?: string;
  };
  error?: string;
};

type RuntimeFileKind = "text" | "image" | "pdf" | "binary";

type RuntimeFile = {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  kind: RuntimeFileKind;
  text: string;
  content: string;
  dataUrl?: string;
  base64?: string;
  role: "context" | "reference_only";
  uploaded: boolean;
};

type IprHandoffSource =
  | "url"
  | "sessionStorage"
  | "localStorage"
  | "accountSession"
  | "none";

type IprHandoffSubject = {
  entity: string;
  ipr: string;
  kind: "BIOLOGICAL_SUBJECT" | string;
};

type IprHandoffCertificate = {
  certificate_id: string;
  certificate_kind: string;
  certificate_status: string;
  certificate_scope: string[];
  card_serial?: string;
  certificate_hash?: string;
};

type IprHandoffAccess = {
  decision: string;
  scope: string;
  identity_binding: string;
};

type IprHandoff = {
  handoff_type: "HBCE_IPR_HANDOFF" | string;
  handoff_version: string;
  source: string;
  issued_at?: string;
  subject: IprHandoffSubject;
  certificate: IprHandoffCertificate;
  access: IprHandoffAccess;
  client_context: {
    transport_source: IprHandoffSource;
    client_validation: "HANDOFF_PRESENT_FOR_SERVER_VALIDATION";
    authority: "CLIENT_TRANSPORT_ONLY" | "SERVER_RUNTIME_VALIDATED";
    note: string;
  };
  rawPayload?: Record<string, unknown>;
};

type IprHandoffLoadResult = {
  handoff: IprHandoff | null;
  source: IprHandoffSource;
  error: string | null;
};

type IprAccountSessionResponse = {
  ok?: boolean;
  authenticated?: boolean;
  reason?: string;
  cookieName?: string;
  session?: {
    sessionId?: string;
    humanIpr?: string;
    runtimeIpr?: string;
    status?: string;
    createdAt?: string;
    expiresAt?: string;
    revokedAt?: string | null;
    lastSeenAt?: string | null;
    deviceLabel?: string;
    legalCertification?: boolean;
  };
  accountProfile?: Record<string, unknown>;
  reconstructedIprHandoff?: unknown;
  access?: {
    decision?: string;
    scope?: string;
    identityBinding?: string;
    source?: string;
    legalCertification?: boolean;
  };
  memory?: {
    expectedScope?: string;
    expectedAuthority?: string;
    persistenceMode?: string;
  };
  matrix?: {
    expectedState?: string;
    active?: boolean;
  };
  boundary?: unknown;
  legalCertification?: boolean;
  detail?: string;
  error?: string;
};

type ChatApiResponse = {
  ok?: boolean;
  sessionId?: string;
  response?: string;
  text?: string;
  state?: string;
  decision?: string;
  governanceDecision?: string;
  degradedReason?: string | null;
  continuityRef?: string | null;
  runtime?: unknown;
  engine?: unknown;
  governance?: unknown;
  operationalContext?: unknown;
  event?: unknown;
  evt?: unknown;
  modernEvt?: unknown;
  governedEvt?: unknown;
  opc?: unknown;
  opcProof?: unknown;
  proof?: unknown;
  memory?: unknown;
  semanticMemory?: unknown;
  diagnostics?: unknown;
  boundary?: unknown;
  identity?: unknown;
  verifiedSubject?: unknown;
  matrix?: unknown;
  access?: unknown;
  iprHandoff?: unknown;
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  state?: string;
  decision?: string;
  continuityRef?: string | null;
  raw?: ChatApiResponse;
};

type InfoItem = {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
};

const JOKER_SIGIL = "🜏";

const CANONICAL_MANUEL_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const CANONICAL_MANUEL_DISPLAY_NAME = "Manuel Coletta";

const DEFAULT_PROMPT =
  "JOKER-C2, run a complete runtime diagnostic. Tell me which OpenAI model you are using, your runtime IPR, the current EVT checkpoint, the role of OPC, and the difference between OpenAI as model provider and JOKER-C2 as governed runtime.";

const QUICK_PROMPTS = [
  "run complete OpenAI runtime diagnostic",
  "do you know who I am?",
  "explain the difference between GPT-5.5 and JOKER-C2",
  "explain IPR, EVT, OPC and IPR-bound memory",
  "fail-closed test: what happens if OPC is missing?",
  "prepare a 60-second pitch for OpenAI",
  "explain why JOKER-C2 is not a generic AI"
];

const TEXT_FILE_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/xhtml+xml",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "application/csv",
  "application/ld+json",
  "application/markdown",
  "application/x-ndjson",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/css",
  "text/javascript"
]);

const IMAGE_FILE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif"
]);

const PDF_FILE_TYPES = new Set(["application/pdf"]);

const HANDOFF_STORAGE_KEY = "hbce_ipr_handoff";

const LEGACY_HANDOFF_STORAGE_KEYS = [
  "hbce-ipr-handoff",
  "hbce.ipr.handoff",
  "iprHandoff",
  "ipr_handoff"
];

const HANDOFF_QUERY_KEYS = [
  "hbce_ipr_handoff",
  "hbce_ipr_handoff_b64",
  "iprHandoff",
  "ipr_handoff",
  "handoff"
];

function buildId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}

function safeText(value: unknown, fallback = "-"): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function firstText(value: unknown, paths: string[][], fallback = "-"): string {
  for (const path of paths) {
    const item = readPath(value, path);
    const text = safeText(item, "");

    if (text) {
      return text;
    }
  }

  return fallback;
}

function fallbackDash(value: string, fallback: string): string {
  return value && value !== "-" ? value : fallback;
}

function compactHash(value: string): string {
  if (!value || value === "-" || value === "none" || value.length <= 34) {
    return value;
  }

  return `${value.slice(0, 20)}…${value.slice(-10)}`;
}

function normalizeRuntimeDisplayText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function canonicalizeSubjectName(value: string, ipr?: string | null): string {
  const raw = value.trim();

  if (ipr === CANONICAL_MANUEL_HUMAN_IPR) {
    return CANONICAL_MANUEL_DISPLAY_NAME;
  }

  const normalized = normalizeRuntimeDisplayText(raw);

  if (
    normalized === "manuel coletta" ||
    normalized === "manuele coletta" ||
    normalized === "manuale coletta"
  ) {
    return CANONICAL_MANUEL_DISPLAY_NAME;
  }

  return raw || "-";
}

function normalizeVisibleRuntimeText(value: string): string {
  return value
    .replace(/\bManuele Coletta\b/g, CANONICAL_MANUEL_DISPLAY_NAME)
    .replace(/\bmanuale coletta\b/gi, CANONICAL_MANUEL_DISPLAY_NAME)
    .replace(/\bmanuel coletta\b/gi, CANONICAL_MANUEL_DISPLAY_NAME)
    .replace(/\bcertificazionelegale=false\b/gi, "legalCertification=false")
    .replace(/\bcertificazione legale=false\b/gi, "legalCertification=false")
    .replace(/\bCertificato legale OPC falso\b/gi, "OPC legalCertification=false")
    .replace(/\bDiritti di proprietà intellettuale umani\b/gi, "Human IPR")
    .replace(/\bDiritti di proprietà intellettuale sui soggetti biologici\b/gi, "HBCE IPR Biological Subject")
    .replace(/\bcontinuità legata alla proprietà intellettuale\b/gi, "IPR-bound continuity")
    .replace(/\bbind(\s+\*\*IPR_VERIFIED_BIOLOGICAL_SUBJECT\*\*)/gi, "binding$1");
}

function normalizeScope(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .map((item) => item.trim());
  }

  const text = safeText(value, "");

  if (!text) {
    return [];
  }

  return text
    .split(/[,\s|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasJokerAccessScope(scope: string[]): boolean {
  return scope.some((item) => item.toUpperCase() === "JOKER_C2_ACCESS");
}

function decodeBase64Text(value: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function parseHandoffCandidate(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const candidates = [
    trimmed,
    (() => {
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return null;
      }
    })(),
    decodeBase64Text(trimmed)
  ].filter((item): item is string => Boolean(item));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeIprHandoff(
  payload: Record<string, unknown>,
  source: IprHandoffSource
): IprHandoff | null {
  const subjectEntity = firstText(
    payload,
    [
      ["subject", "entity"],
      ["subject", "name"],
      ["subject", "full_name"],
      ["verifiedSubject", "entity"],
      ["verifiedSubject", "name"],
      ["verified_subject", "entity"],
      ["verified_subject", "name"],
      ["verified_subject_entity"],
      ["verified_subject_name"],
      ["holder", "name"],
      ["holder", "full_name"],
      ["identity", "name"],
      ["identity", "full_name"],
      ["entity"],
      ["name"],
      ["fullName"]
    ],
    ""
  );

  const subjectIpr = firstText(
    payload,
    [
      ["subject", "ipr"],
      ["subject", "ipr_id"],
      ["verifiedSubject", "ipr"],
      ["verified_subject", "ipr"],
      ["verified_subject_ipr"],
      ["subject_ipr"],
      ["ipr"],
      ["ipr_id"],
      ["identity", "ipr"],
      ["humanIpr"],
      ["human_ipr"]
    ],
    ""
  );

  const subjectKind =
    firstText(
      payload,
      [
        ["subject", "kind"],
        ["verifiedSubject", "kind"],
        ["verified_subject", "kind"],
        ["subject_kind"],
        ["subjectKind"]
      ],
      ""
    ) || "BIOLOGICAL_SUBJECT";

  const certificateId = firstText(
    payload,
    [
      ["certificate", "certificate_id"],
      ["certificate", "certificateId"],
      ["certificate", "id"],
      ["operationalCertificate", "certificate_id"],
      ["operationalCertificate", "certificateId"],
      ["operational_certificate", "certificate_id"],
      ["verified_subject_certificate_id"],
      ["certificate_id"],
      ["certificateId"]
    ],
    ""
  );

  const certificateKind =
    firstText(
      payload,
      [
        ["certificate", "certificate_kind"],
        ["certificate", "certificateKind"],
        ["certificate", "kind"],
        ["operationalCertificate", "certificate_kind"],
        ["operationalCertificate", "certificateKind"],
        ["operational_certificate", "certificate_kind"],
        ["certificate_kind"],
        ["certificateKind"]
      ],
      ""
    ) || "CERTIFICATE_09_OPERATIONAL";

  const certificateStatus =
    firstText(
      payload,
      [
        ["certificate", "certificate_status"],
        ["certificate", "certificateStatus"],
        ["certificate", "status"],
        ["operationalCertificate", "certificate_status"],
        ["operationalCertificate", "certificateStatus"],
        ["operational_certificate", "certificate_status"],
        ["verified_subject_certificate_status"],
        ["certificate_status"],
        ["certificateStatus"]
      ],
      ""
    ).toUpperCase() || "UNKNOWN";

  const certificateScope = normalizeScope(
    readPath(payload, ["certificate", "certificate_scope"]) ??
      readPath(payload, ["certificate", "certificateScope"]) ??
      readPath(payload, ["certificate", "scope"]) ??
      readPath(payload, ["operationalCertificate", "certificate_scope"]) ??
      readPath(payload, ["operationalCertificate", "certificateScope"]) ??
      readPath(payload, ["operational_certificate", "certificate_scope"]) ??
      readPath(payload, ["verified_subject_certificate_scope"]) ??
      readPath(payload, ["certificate_scope"]) ??
      readPath(payload, ["certificateScope"]) ??
      readPath(payload, ["scope"]) ??
      readPath(payload, ["accessScope"])
  );

  const cardSerial = firstText(
    payload,
    [
      ["certificate", "card_serial"],
      ["certificate", "cardSerial"],
      ["operationalCertificate", "card_serial"],
      ["operationalCertificate", "cardSerial"],
      ["operational_certificate", "card_serial"],
      ["verified_subject_card_serial"],
      ["card_serial"],
      ["cardSerial"]
    ],
    ""
  );

  const certificateHash = firstText(
    payload,
    [
      ["certificate", "certificate_hash"],
      ["certificate", "certificateHash"],
      ["certificate", "hash"],
      ["operationalCertificate", "certificate_hash"],
      ["operationalCertificate", "certificateHash"],
      ["operational_certificate", "certificate_hash"],
      ["certificate_hash"],
      ["certificateHash"],
      ["hash"]
    ],
    ""
  );

  const accessDecision =
    firstText(
      payload,
      [
        ["access", "decision"],
        ["access_decision"],
        ["accessDecision"],
        ["verified_subject_access_decision"]
      ],
      ""
    ).toUpperCase() || "PENDING_SERVER_VALIDATION";

  const accessScope =
    firstText(
      payload,
      [
        ["access", "scope"],
        ["verified_subject_certificate_scope"],
        ["certificate_scope"],
        ["certificateScope"],
        ["accessScope"]
      ],
      ""
    ) || (hasJokerAccessScope(certificateScope) ? "JOKER_C2_ACCESS" : "UNKNOWN");

  const identityBinding =
    firstText(
      payload,
      [
        ["access", "identity_binding"],
        ["access", "identityBinding"],
        ["identity_binding"],
        ["identityBinding"]
      ],
      ""
    ) || "IPR_VERIFIED_BIOLOGICAL_SUBJECT";

  if (!subjectIpr || !certificateId || certificateStatus !== "ACTIVE") {
    return null;
  }

  const effectiveScope =
    certificateScope.length > 0
      ? certificateScope
      : accessScope === "JOKER_C2_ACCESS"
        ? ["JOKER_C2_ACCESS"]
        : [];

  if (!hasJokerAccessScope(effectiveScope)) {
    return null;
  }

  return {
    handoff_type:
      firstText(payload, [["handoff_type"], ["type"]], "") || "HBCE_IPR_HANDOFF",
    handoff_version:
      firstText(payload, [["handoff_version"], ["version"]], "") || "1.0",
    source:
      source === "accountSession"
        ? "IPR_ACCOUNT_SESSION"
        : firstText(payload, [["source"], ["issuer"], ["app"]], "") ||
          "HBCE_IPR_ONBOARDING_APP",
    issued_at: firstText(payload, [["issued_at"], ["issuedAt"]], ""),
    subject: {
      entity: canonicalizeSubjectName(
        subjectEntity || "VERIFIED_BIOLOGICAL_SUBJECT",
        subjectIpr
      ),
      ipr: subjectIpr,
      kind: subjectKind
    },
    certificate: {
      certificate_id: certificateId,
      certificate_kind: certificateKind,
      certificate_status: certificateStatus,
      certificate_scope: effectiveScope,
      card_serial: cardSerial || undefined,
      certificate_hash: certificateHash || undefined
    },
    access: {
      decision: accessDecision,
      scope: accessScope,
      identity_binding: identityBinding
    },
    client_context: {
      transport_source: source,
      client_validation: "HANDOFF_PRESENT_FOR_SERVER_VALIDATION",
      authority:
        source === "accountSession"
          ? "SERVER_RUNTIME_VALIDATED"
          : "CLIENT_TRANSPORT_ONLY",
      note:
        source === "accountSession"
          ? "The IPR handoff was reconstructed from the authenticated server-side IPR account session."
          : "The browser can transport the IPR handoff, but only the JOKER-C2 API can validate and authorize it."
    },
    rawPayload: payload
  };
}

function buildIprHandoffFromAccountSession(
  payload: IprAccountSessionResponse | null
): IprHandoff | null {
  if (!payload || payload.authenticated !== true) {
    return null;
  }

  if (isRecord(payload.reconstructedIprHandoff)) {
    const normalized = normalizeIprHandoff(
      payload.reconstructedIprHandoff,
      "accountSession"
    );

    if (normalized) {
      return normalized;
    }
  }

  if (isRecord(payload.accountProfile)) {
    return normalizeIprHandoff(payload.accountProfile, "accountSession");
  }

  return null;
}

function readStoredHandoff(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return (
      window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

function persistHandoff(handoff: IprHandoff) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const serialized = JSON.stringify(handoff.rawPayload || handoff);

    window.sessionStorage.setItem(HANDOFF_STORAGE_KEY, serialized);
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, serialized);
  } catch {
    return;
  }
}

function clearStoredHandoff() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);

    for (const key of LEGACY_HANDOFF_STORAGE_KEYS) {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}

function stripHandoffQueryParams() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);
    let changed = false;

    for (const key of HANDOFF_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    if (changed) {
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    return;
  }
}

function loadIprHandoffFromBrowser(): IprHandoffLoadResult {
  if (typeof window === "undefined") {
    return {
      handoff: null,
      source: "none",
      error: null
    };
  }

  try {
    const url = new URL(window.location.href);

    for (const key of HANDOFF_QUERY_KEYS) {
      const raw = url.searchParams.get(key);

      if (!raw) {
        continue;
      }

      const parsed = parseHandoffCandidate(raw);
      const handoff = parsed ? normalizeIprHandoff(parsed, "url") : null;

      if (handoff) {
        persistHandoff(handoff);
        stripHandoffQueryParams();

        return {
          handoff,
          source: "url",
          error: null
        };
      }

      return {
        handoff: null,
        source: "url",
        error: `Invalid IPR handoff in URL parameter: ${key}`
      };
    }

    const sessionRaw = window.sessionStorage.getItem(HANDOFF_STORAGE_KEY);

    if (sessionRaw) {
      const parsed = parseHandoffCandidate(sessionRaw);
      const handoff = parsed
        ? normalizeIprHandoff(parsed, "sessionStorage")
        : null;

      if (handoff) {
        return {
          handoff,
          source: "sessionStorage",
          error: null
        };
      }

      return {
        handoff: null,
        source: "sessionStorage",
        error: "Invalid IPR handoff in sessionStorage"
      };
    }

    const localRaw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);

    if (localRaw) {
      const parsed = parseHandoffCandidate(localRaw);
      const handoff = parsed
        ? normalizeIprHandoff(parsed, "localStorage")
        : null;

      if (handoff) {
        return {
          handoff,
          source: "localStorage",
          error: null
        };
      }

      return {
        handoff: null,
        source: "localStorage",
        error: "Invalid IPR handoff in localStorage"
      };
    }

    for (const key of LEGACY_HANDOFF_STORAGE_KEYS) {
      const raw = readStoredHandoff(key);

      if (!raw) {
        continue;
      }

      const parsed = parseHandoffCandidate(raw);
      const handoff = parsed
        ? normalizeIprHandoff(parsed, "localStorage")
        : null;

      if (handoff) {
        persistHandoff(handoff);

        return {
          handoff,
          source: "localStorage",
          error: null
        };
      }
    }

    return {
      handoff: null,
      source: "none",
      error: null
    };
  } catch (err) {
    return {
      handoff: null,
      source: "none",
      error: err instanceof Error ? err.message : "IPR_HANDOFF_LOAD_FAILED"
    };
  }
}

function getAssistantText(payload: ChatApiResponse): string {
  return normalizeVisibleRuntimeText(
    safeText(payload.response || payload.text, "[EMPTY_RESPONSE]")
  );
}

function getContinuityRef(payload: ChatApiResponse): string | null {
  const direct = safeText(payload.continuityRef, "");

  if (direct) {
    return direct;
  }

  const resolved = firstText(
    payload,
    [
      ["memory", "lastEvt"],
      ["memory", "currentContinuityRef"],
      ["semanticMemory", "lastMemoryEvt"],
      ["governedEvt", "evt"],
      ["modernEvt", "evt"],
      ["evt", "evt"],
      ["event", "evt"]
    ],
    ""
  );

  return resolved || null;
}

function getModel(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["engine", "modelUsed"],
      ["modelUsed"],
      ["model"],
      ["diagnostics", "modelUsed"],
      ["runtime", "model"]
    ],
    "-"
  );
}

function getIpr(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["identity", "runtimeIpr"],
      ["identity", "ipr"],
      ["runtime", "ipr"],
      ["runtime", "runtime_ipr"],
      ["runtimeFrame", "runtime_ipr"]
    ],
    "-"
  );
}

function getCurrentAiEvt(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "EVT-0016-AI";

  return firstText(
    payload,
    [
      ["operationalContext", "current_ai_evt"],
      ["runtime", "operationalContext", "current_ai_evt"],
      ["identity", "evt"],
      ["identity", "checkpoint"],
      ["governedEvt", "operational_context", "current_ai_evt"],
      ["modernEvt", "operational_context", "current_ai_evt"]
    ],
    "EVT-0016-AI"
  );
}

function getEvt(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["continuityRef"],
      ["governedEvt", "evt"],
      ["modernEvt", "evt"],
      ["evt", "evt"],
      ["event", "evt"],
      ["runtime", "governedEvt"],
      ["runtime", "legacyEvt"]
    ],
    "-"
  );
}

function getOperationalHumanEvt(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "EVT-0016";

  return firstText(
    payload,
    [
      ["operationalContext", "current_evt"],
      ["runtime", "operationalContext", "current_evt"],
      ["governedEvt", "operational_context", "current_evt"],
      ["modernEvt", "operational_context", "current_evt"]
    ],
    "EVT-0016"
  );
}

function getOperationalCycle(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "UP-CANONICO";

  return firstText(
    payload,
    [
      ["operationalContext", "current_cycle"],
      ["runtime", "operationalContext", "current_cycle"],
      ["identity", "cycle"],
      ["runtime", "cycle"],
      ["governedEvt", "operational_context", "current_cycle"],
      ["modernEvt", "operational_context", "current_cycle"]
    ],
    "UP-CANONICO"
  );
}

function getEventFamily(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "UP-EVT";

  return firstText(
    payload,
    [
      ["operationalContext", "event_family"],
      ["runtime", "operationalContext", "event_family"],
      ["identity", "eventFamily"],
      ["runtime", "eventFamily"],
      ["governedEvt", "operational_context", "event_family"],
      ["modernEvt", "operational_context", "event_family"]
    ],
    "UP-EVT"
  );
}

function getProjectBirthDate(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "19/01/2026";

  return firstText(
    payload,
    [
      ["operationalContext", "project_birth", "display_date"],
      ["runtime", "operationalContext", "project_birth", "display_date"],
      ["governedEvt", "operational_context", "project_birth", "display_date"],
      ["modernEvt", "operational_context", "project_birth", "display_date"],
      ["identity", "projectBirth", "displayDate"],
      ["identity", "projectBirth", "display_date"]
    ],
    "19/01/2026"
  );
}

function getProjectBirthLabel(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "HBCE R&D / AI JOKER-C2 project birth date";

  return firstText(
    payload,
    [
      ["operationalContext", "project_birth", "label"],
      ["runtime", "operationalContext", "project_birth", "label"],
      ["governedEvt", "operational_context", "project_birth", "label"],
      ["modernEvt", "operational_context", "project_birth", "label"],
      ["identity", "projectBirth", "label"]
    ],
    "HBCE R&D / AI JOKER-C2 project birth date"
  );
}

function getMonthlyReference(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "UP-MESE-4";

  return firstText(
    payload,
    [
      ["operationalContext", "monthly_reference", "cycle"],
      ["runtime", "operationalContext", "monthly_reference", "cycle"],
      ["governedEvt", "operational_context", "monthly_reference", "cycle"],
      ["modernEvt", "operational_context", "monthly_reference", "cycle"],
      ["identity", "monthlyReference", "cycle"]
    ],
    "UP-MESE-4"
  );
}

function getMonthlyReferenceLabel(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "Fourth monthly synchronization cycle";

  return firstText(
    payload,
    [
      ["operationalContext", "monthly_reference", "label"],
      ["runtime", "operationalContext", "monthly_reference", "label"],
      ["governedEvt", "operational_context", "monthly_reference", "label"],
      ["modernEvt", "operational_context", "monthly_reference", "label"],
      ["identity", "monthlyReference", "label"]
    ],
    "Fourth monthly synchronization cycle"
  );
}

function getPreviousCheckpointRef(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "EVT-0015 / EVT-0015-AI";

  const human = firstText(
    payload,
    [
      ["operationalContext", "previous_checkpoint_ref", "evt"],
      ["runtime", "operationalContext", "previous_checkpoint_ref", "evt"],
      ["governedEvt", "operational_context", "previous_checkpoint_ref", "evt"],
      ["modernEvt", "operational_context", "previous_checkpoint_ref", "evt"],
      ["identity", "previousCheckpointRef", "evt"]
    ],
    "EVT-0015"
  );

  const ai = firstText(
    payload,
    [
      ["operationalContext", "previous_checkpoint_ref", "ai_evt"],
      ["runtime", "operationalContext", "previous_checkpoint_ref", "ai_evt"],
      ["governedEvt", "operational_context", "previous_checkpoint_ref", "ai_evt"],
      ["modernEvt", "operational_context", "previous_checkpoint_ref", "ai_evt"],
      ["identity", "previousCheckpointRef", "aiEvt"]
    ],
    "EVT-0015-AI"
  );

  return `${human} / ${ai}`;
}

function getVerifiedSubjectIpr(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["verifiedSubject", "ipr"],
      ["runtime", "verifiedSubject", "ipr"],
      ["runtime", "verified_subject_ipr"],
      ["identity", "verifiedSubject", "ipr"],
      ["identity", "verified_subject_ipr"],
      ["diagnostics", "verifiedSubject", "ipr"]
    ],
    "-"
  );
}

function getVerifiedSubjectName(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  const ipr = getVerifiedSubjectIpr(payload);
  const subject = firstText(
    payload,
    [
      ["verifiedSubject", "entity"],
      ["verifiedSubject", "name"],
      ["runtime", "verifiedSubject", "entity"],
      ["runtime", "verified_subject_entity"],
      ["identity", "verifiedSubject", "entity"],
      ["identity", "verified_subject_entity"],
      ["diagnostics", "verifiedSubject", "entity"]
    ],
    "-"
  );

  return subject === "-" ? "-" : canonicalizeSubjectName(subject, ipr);
}

function getMatrixState(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["matrix", "state"],
      ["matrix", "activation"],
      ["access", "matrixState"],
      ["identity", "matrixState"],
      ["memory", "matrixState"],
      ["runtime", "matrixState"],
      ["runtime", "matrix_state"],
      ["governance", "matrixState"],
      ["diagnostics", "matrixState"]
    ],
    "-"
  );
}

function getSemanticMemoryScope(
  payload?: ChatApiResponse | RuntimeHealth | null
): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "scope"],
      ["memory", "scope"],
      ["access", "semanticMemoryScope"],
      ["identity", "semanticMemoryScope"],
      ["runtime", "memoryScope"],
      ["runtime", "semanticMemoryScope"],
      ["runtime", "semantic_memory_scope"],
      ["diagnostics", "memoryScope"],
      ["diagnostics", "semanticMemoryScope"]
    ],
    "-"
  );
}

function getMemoryAuthority(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "authority"],
      ["memory", "authority"],
      ["runtime", "memoryAuthority"],
      ["diagnostics", "memoryAuthority"]
    ],
    "-"
  );
}

function getMemoryPersistenceMode(
  payload?: ChatApiResponse | RuntimeHealth | null
): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "persistenceMode"],
      ["memory", "persistenceMode"],
      ["runtime", "memoryPersistenceMode"],
      ["diagnostics", "memoryPersistenceMode"]
    ],
    "-"
  );
}

function getMemoryId(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "memoryId"],
      ["memory", "memoryId"],
      ["runtime", "memoryId"],
      ["diagnostics", "memoryId"]
    ],
    "-"
  );
}

function getMemoryKeyHash(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "memoryKeyHash"],
      ["memory", "memoryKeyHash"],
      ["runtime", "memoryKeyHash"],
      ["diagnostics", "memoryKeyHash"]
    ],
    "-"
  );
}

function getMemoryHash(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "memoryHash"],
      ["memory", "memoryHash"],
      ["runtime", "memoryHash"],
      ["diagnostics", "memoryHash"],
      ["opc", "publicProof", "memoryHash"],
      ["proof", "memoryHash"]
    ],
    "-"
  );
}

function getLastMemoryEvt(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "lastMemoryEvt"],
      ["memory", "lastEvt"],
      ["memory", "currentContinuityRef"],
      ["runtime", "memoryLastEvt"],
      ["diagnostics", "memoryLastEvt"]
    ],
    "-"
  );
}

function getLastMemoryOpc(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "lastMemoryOpcProofId"],
      ["memory", "lastOpcProofId"],
      ["runtime", "memoryLastOpcProofId"],
      ["diagnostics", "memoryLastOpcProofId"]
    ],
    "-"
  );
}

function getLastMemoryChainHash(
  payload?: ChatApiResponse | RuntimeHealth | null
): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["semanticMemory", "lastMemoryOpcChainHash"],
      ["memory", "lastOpcChainHash"],
      ["runtime", "memoryLastOpcChainHash"],
      ["diagnostics", "memoryLastOpcChainHash"]
    ],
    "-"
  );
}

function getOpcProof(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["opc", "publicProof", "proofId"],
      ["opc", "record", "proofId"],
      ["opc", "proofId"],
      ["opcProof", "proofId"],
      ["proof", "proofId"],
      ["runtime", "opcProofId"],
      ["diagnostics", "opcProofId"]
    ],
    "-"
  );
}

function getChainHash(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["opc", "publicProof", "chainHash"],
      ["opc", "record", "proof", "chainHash"],
      ["opc", "chainHash"],
      ["opcProof", "chainHash"],
      ["proof", "chainHash"],
      ["runtime", "opcChainHash"],
      ["diagnostics", "opcChainHash"]
    ],
    "-"
  );
}

function getEngineHash(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["opc", "publicProof", "engineHash"],
      ["opc", "record", "proof", "engineHash"],
      ["opc", "engineHash"],
      ["opcProof", "engineHash"],
      ["proof", "engineHash"],
      ["runtime", "opcEngineHash"],
      ["diagnostics", "opcEngineHash"]
    ],
    "-"
  );
}

function getProjectDomain(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["governance", "projectDomain"],
      ["projectDomain"],
      ["runtime", "projectDomain"],
      ["opc", "publicProof", "projectDomain"]
    ],
    "-"
  );
}

function getHbceModule(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["governance", "hbceModule"],
      ["hbceModule"],
      ["runtime", "hbceModule"],
      ["opc", "publicProof", "hbceModule"]
    ],
    "-"
  );
}

function getLegalCertification(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "false";

  return firstText(
    payload,
    [
      ["boundary", "legalCertification"],
      ["opcProof", "legalCertification"],
      ["proof", "legalCertification"],
      ["runtime", "legalCertification"]
    ],
    "false"
  );
}

function getStatusClass(value: string): string {
  const normalized = value.toUpperCase();

  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("GRANTED") ||
    normalized.includes("IPR_BOUND") ||
    normalized.includes("VALIDATED") ||
    normalized.includes("OPERATIONAL") ||
    normalized.includes("PASS") ||
    normalized.includes("DATABASE_PERSISTENT")
  ) {
    return "is-good";
  }

  if (
    normalized.includes("LIMITED") ||
    normalized.includes("PENDING") ||
    normalized.includes("PROCESS_MEMORY") ||
    normalized.includes("RUNTIME_ONLY") ||
    normalized.includes("MVP") ||
    normalized.includes("DATABASE_READY")
  ) {
    return "is-warn";
  }

  if (
    normalized.includes("DENIED") ||
    normalized.includes("ERROR") ||
    normalized.includes("INVALID") ||
    normalized.includes("BLOCKED") ||
    normalized.includes("FAILED")
  ) {
    return "is-bad";
  }

  return "";
}

function inferMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "application/typescript";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "application/yaml";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";

  return "application/octet-stream";
}

function resolveFileMimeType(file: File): string {
  return file.type || inferMimeTypeFromFileName(file.name);
}

function isTextFile(file: File): boolean {
  const type = resolveFileMimeType(file);

  return type.startsWith("text/") || TEXT_FILE_TYPES.has(type);
}

function isImageFile(file: File): boolean {
  const type = resolveFileMimeType(file);

  return type.startsWith("image/") || IMAGE_FILE_TYPES.has(type);
}

function isPdfFile(file: File): boolean {
  const type = resolveFileMimeType(file);

  return PDF_FILE_TYPES.has(type) || file.name.toLowerCase().endsWith(".pdf");
}

function resolveRuntimeFileKind(file: File): RuntimeFileKind {
  if (isTextFile(file)) return "text";
  if (isImageFile(file)) return "image";
  if (isPdfFile(file)) return "pdf";

  return "binary";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("FILE_DATA_URL_READ_FAILED"));
    };

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("FILE_DATA_URL_EMPTY_RESULT"));
        return;
      }

      resolve(result);
    };

    reader.readAsDataURL(file);
  });
}

function extractBase64FromDataUrl(dataUrl: string): string {
  const [, base64 = ""] = dataUrl.split(",", 2);

  return base64;
}

function buildFileContentManifest(input: {
  file: File;
  kind: RuntimeFileKind;
  type: string;
  textLength?: number;
  base64Length?: number;
}): string {
  return [
    `FILE_NAME=${input.file.name}`,
    `FILE_KIND=${input.kind}`,
    `MIME_TYPE=${input.type}`,
    `SIZE_BYTES=${input.file.size}`,
    `TEXT_LENGTH=${input.textLength ?? 0}`,
    `BASE64_LENGTH=${input.base64Length ?? 0}`,
    input.kind === "image"
      ? "MULTIMODAL_STATUS=IMAGE_READY_FOR_SERVER_SIDE_OPENAI_VISION"
      : input.kind === "pdf"
        ? "MULTIMODAL_STATUS=PDF_READY_FOR_SERVER_SIDE_EXTRACTION_OR_MODEL_FILE_HANDLING"
        : input.kind === "text"
          ? "MULTIMODAL_STATUS=TEXT_EXTRACTED_IN_BROWSER"
          : "MULTIMODAL_STATUS=REFERENCE_ONLY_UNSUPPORTED_BINARY"
  ].join("\n");
}

async function readRuntimeFile(file: File): Promise<RuntimeFile> {
  const type = resolveFileMimeType(file);
  const kind = resolveRuntimeFileKind(file);

  if (kind === "text") {
    const text = await file.text();

    return {
      id: buildId("FILE"),
      name: file.name,
      type,
      mimeType: type,
      size: file.size,
      kind,
      text,
      content: text,
      role: "context",
      uploaded: true
    };
  }

  if (kind === "image" || kind === "pdf") {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = extractBase64FromDataUrl(dataUrl);
    const manifest = buildFileContentManifest({
      file,
      kind,
      type,
      base64Length: base64.length
    });

    return {
      id: buildId("FILE"),
      name: file.name,
      type,
      mimeType: type,
      size: file.size,
      kind,
      text: manifest,
      content: manifest,
      dataUrl,
      base64,
      role: "context",
      uploaded: true
    };
  }

  const manifest = buildFileContentManifest({
    file,
    kind,
    type
  });

  return {
    id: buildId("FILE"),
    name: file.name,
    type,
    mimeType: type,
    size: file.size,
    kind,
    text: manifest,
    content: manifest,
    role: "reference_only",
    uploaded: true
  };
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(raw || `HTTP_${response.status}`);
  }
}

function StatusPill({
  label,
  value
}: {
  label?: string;
  value: string;
}) {
  const normalizedValue = normalizeVisibleRuntimeText(value);

  return (
    <span
      className={["joker-pill", getStatusClass(normalizedValue)]
        .filter(Boolean)
        .join(" ")}
      title={normalizedValue}
    >
      {label ? <b>{label}</b> : null}
      <span className="notranslate" translate="no">
        {compactHash(normalizedValue)}
      </span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  tone,
  compact
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
  compact?: boolean;
}) {
  const normalizedValue = normalizeVisibleRuntimeText(value);

  return (
    <div
      className={[
        "joker-metric",
        tone ? `is-${tone}` : getStatusClass(normalizedValue),
        compact ? "is-compact" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      title={normalizedValue}
    >
      <span>{label}</span>
      <strong className="notranslate" translate="no">
        {compactHash(normalizedValue)}
      </strong>
    </div>
  );
}

function InfoList({ items }: { items: InfoItem[] }) {
  return (
    <dl className="joker-info-list">
      {items.map((item) => {
        const normalizedValue = normalizeVisibleRuntimeText(item.value);
        const statusClass = item.tone ? `is-${item.tone}` : getStatusClass(normalizedValue);

        return (
          <div
            key={`${item.label}-${normalizedValue}`}
            className={["joker-info-row", statusClass].filter(Boolean).join(" ")}
          >
            <dt>{item.label}</dt>
            <dd className="notranslate" translate="no" title={normalizedValue}>
              {compactHash(normalizedValue)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function MessageBubble({
  message,
  onCopy
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";

  const verifiedSubjectName = isAssistant ? getVerifiedSubjectName(message.raw) : "-";
  const verifiedSubjectIpr = isAssistant ? getVerifiedSubjectIpr(message.raw) : "-";
  const matrixState = isAssistant ? getMatrixState(message.raw) : "-";
  const memoryScope = isAssistant ? getSemanticMemoryScope(message.raw) : "-";
  const memoryAuthority = isAssistant ? getMemoryAuthority(message.raw) : "-";
  const memoryMode = isAssistant ? getMemoryPersistenceMode(message.raw) : "-";
  const lastMemoryEvt = isAssistant ? getLastMemoryEvt(message.raw) : "-";
  const lastMemoryOpc = isAssistant ? getLastMemoryOpc(message.raw) : "-";
  const visibleContent = normalizeVisibleRuntimeText(message.content);

  return (
    <article
      className={[
        "joker-message",
        isUser ? "joker-message-user" : "",
        isAssistant ? "joker-message-assistant" : "",
        isSystem ? "joker-message-system" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="joker-message-avatar notranslate" translate="no">
        {isUser ? "M" : isSystem ? "!" : JOKER_SIGIL}
      </div>

      <div className="joker-message-body">
        <div className="joker-message-head">
          <div>
            <strong className="notranslate" translate="no">
              {isUser ? "Manuel" : isSystem ? "System" : "JOKER-C2"}
            </strong>
            {isAssistant && message.raw ? (
              <span className="notranslate" translate="no">
                {safeText(message.state, "-")} · {safeText(message.decision, "-")}
              </span>
            ) : null}
          </div>
          <time>{message.createdAt}</time>
        </div>

        <pre className="joker-message-text">
          {visibleContent}
        </pre>

        {isAssistant && message.raw ? (
          <div className="joker-runtime-strip notranslate" translate="no">
            <StatusPill label="Model" value={getModel(message.raw)} />
            <StatusPill label="Runtime IPR" value={getIpr(message.raw)} />
            <StatusPill label="Current AI EVT" value={getCurrentAiEvt(message.raw)} />
            <StatusPill label="Response EVT" value={getEvt(message.raw)} />
            <StatusPill label="OPC" value={getOpcProof(message.raw)} />
            {verifiedSubjectIpr !== "-" ? (
              <StatusPill label="Human IPR" value={verifiedSubjectIpr} />
            ) : null}
            {verifiedSubjectName !== "-" ? (
              <StatusPill label="Subject" value={verifiedSubjectName} />
            ) : null}
            {matrixState !== "-" ? <StatusPill label="MATRIX" value={matrixState} /> : null}
            {memoryScope !== "-" ? (
              <StatusPill label="Memory" value={memoryScope} />
            ) : null}
            {memoryAuthority !== "-" ? (
              <StatusPill label="Authority" value={memoryAuthority} />
            ) : null}
            {memoryMode !== "-" ? <StatusPill label="Mode" value={memoryMode} /> : null}
            {lastMemoryEvt !== "-" ? (
              <StatusPill label="Last EVT" value={lastMemoryEvt} />
            ) : null}
            {lastMemoryOpc !== "-" ? (
              <StatusPill label="Last OPC" value={lastMemoryOpc} />
            ) : null}
          </div>
        ) : null}

        {isAssistant ? (
          <div className="joker-message-actions">
            <button type="button" onClick={() => onCopy(visibleContent)}>
              Copy response
            </button>

            {message.raw ? (
              <details>
                <summary>Runtime details</summary>

                <div className="joker-details-grid">
                  <MetricCard label="State" value={safeText(message.state, "-")} compact />
                  <MetricCard label="Decision" value={safeText(message.decision, "-")} compact />
                  <MetricCard label="ProjectDomain" value={getProjectDomain(message.raw)} compact />
                  <MetricCard label="HbceModule" value={getHbceModule(message.raw)} compact />
                  <MetricCard label="Subject" value={verifiedSubjectName} compact />
                  <MetricCard label="Human IPR" value={verifiedSubjectIpr} compact />
                  <MetricCard label="MATRIX" value={matrixState} compact />
                  <MetricCard label="SemanticMemory" value={memoryScope} compact />
                  <MetricCard label="MemoryAuthority" value={memoryAuthority} compact />
                  <MetricCard label="MemoryMode" value={memoryMode} compact />
                  <MetricCard label="MemoryId" value={getMemoryId(message.raw)} compact />
                  <MetricCard label="MemoryKeyHash" value={getMemoryKeyHash(message.raw)} compact />
                  <MetricCard label="MemoryHash" value={getMemoryHash(message.raw)} compact />
                  <MetricCard label="LastMemoryEVT" value={lastMemoryEvt} compact />
                  <MetricCard label="LastMemoryOPC" value={lastMemoryOpc} compact />
                  <MetricCard
                    label="MemoryChainHash"
                    value={getLastMemoryChainHash(message.raw)}
                    compact
                  />
                  <MetricCard label="EngineHash" value={getEngineHash(message.raw)} compact />
                  <MetricCard label="ChainHash" value={getChainHash(message.raw)} compact />
                  <MetricCard
                    label="legalCertification"
                    value={getLegalCertification(message.raw)}
                    compact
                  />
                </div>

                <pre className="joker-json notranslate" translate="no">
                  {safeJson(message.raw)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function InterfacePage() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<RuntimeFile[]>([]);
  const [continuityRef, setContinuityRef] = useState<string | null>(null);

  const [iprHandoff, setIprHandoff] = useState<IprHandoff | null>(null);
  const [iprAccountHandoff, setIprAccountHandoff] =
    useState<IprHandoff | null>(null);
  const [iprAccountSession, setIprAccountSession] =
    useState<IprAccountSessionResponse | null>(null);

  const [iprHandoffSource, setIprHandoffSource] =
    useState<IprHandoffSource>("none");
  const [iprHandoffError, setIprHandoffError] = useState<string | null>(null);
  const [iprAccountSessionError, setIprAccountSessionError] =
    useState<string | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingIprSession, setIsCheckingIprSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lastAssistantPayload = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const item = messages[index];

      if (item.role === "assistant" && item.raw) {
        return item.raw;
      }
    }

    return null;
  }, [messages]);

  const effectiveIprHandoff = iprAccountHandoff || iprHandoff;
  const effectiveIprHandoffSource: IprHandoffSource = iprAccountHandoff
    ? "accountSession"
    : iprHandoffSource;
  const hasAccountSession = iprAccountSession?.authenticated === true;

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("hbce-joker-c2-session-id")
        : null;

    const nextSessionId = stored || buildId("JOKER-UI");

    setSessionId(nextSessionId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-c2-session-id", nextSessionId);
    }

    refreshIprHandoff();
    void checkIprAccountSession();
    void checkRuntime();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [message]);

  function refreshIprHandoff() {
    const result = loadIprHandoffFromBrowser();

    setIprHandoff(result.handoff);
    setIprHandoffSource(result.source);
    setIprHandoffError(result.error);
  }

  async function refreshIdentityContext() {
    refreshIprHandoff();
    await checkIprAccountSession();
  }

  function clearIprHandoff() {
    clearStoredHandoff();
    stripHandoffQueryParams();
    setIprHandoff(null);
    setIprHandoffSource("none");
    setIprHandoffError(null);
  }

  async function checkIprAccountSession() {
    setIsCheckingIprSession(true);
    setIprAccountSessionError(null);

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });

      const payload = await readJsonResponse<IprAccountSessionResponse>(
        response
      );

      setIprAccountSession(payload);

      if (!response.ok || payload.authenticated !== true) {
        setIprAccountHandoff(null);
        setIprAccountSessionError(
          payload.reason || payload.detail || `HTTP_${response.status}`
        );
        return;
      }

      const handoff = buildIprHandoffFromAccountSession(payload);

      setIprAccountHandoff(handoff);

      if (!handoff) {
        setIprAccountSessionError(
          "IPR_ACCOUNT_SESSION_ACTIVE_BUT_HANDOFF_NOT_RECONSTRUCTED"
        );
      }
    } catch (err) {
      setIprAccountSession(null);
      setIprAccountHandoff(null);
      setIprAccountSessionError(
        err instanceof Error ? err.message : "IPR_ACCOUNT_SESSION_CHECK_FAILED"
      );
    } finally {
      setIsCheckingIprSession(false);
    }
  }

  async function checkRuntime() {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "GET",
        cache: "no-store",
        credentials: "include"
      });

      const payload = await readJsonResponse<RuntimeHealth>(response);

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `HTTP_${response.status}`);
      }

      setHealth(payload);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "HEALTH_CHECK_FAILED");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleFiles(inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return;

    setError(null);

    try {
      const selected = Array.from(inputFiles);
      const nextFiles = await Promise.all(selected.map(readRuntimeFile));

      setFiles((current) => [...current, ...nextFiles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FILE_READ_FAILED");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function clearFiles() {
    setFiles([]);
  }

  function newChat() {
    const nextSessionId = buildId("JOKER-UI");

    setSessionId(nextSessionId);
    setMessages([]);
    setFiles([]);
    setContinuityRef(null);
    setMessage("");
    setError(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-c2-session-id", nextSessionId);
    }

    refreshIprHandoff();
    void checkIprAccountSession();
  }

  async function copyText(content: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      setCopied(false);
    }
  }

  async function sendMessage(forceMessage?: string) {
    const outgoing = (forceMessage ?? message).trim();

    if (!outgoing && files.length === 0) {
      setError("Write a message or attach a supported file.");
      return;
    }

    const effectiveMessage =
      outgoing || "Analyze the active files as JOKER-C2 operational context.";

    setError(null);
    setIsSending(true);
    setMessage("");

    const userMessage: ChatMessage = {
      id: buildId("MSG-U"),
      role: "user",
      content: effectiveMessage,
      createdAt: new Date().toLocaleString("it-IT")
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          message: effectiveMessage,
          sessionId,
          continuityRef,
          files,
          iprHandoff: effectiveIprHandoff,
          iprAccountSession:
            iprAccountSession?.authenticated === true
              ? {
                  source: "IPR_ACCOUNT_SESSION",
                  session: iprAccountSession.session,
                  accountProfile: iprAccountSession.accountProfile,
                  access: iprAccountSession.access,
                  memory: iprAccountSession.memory,
                  matrix: iprAccountSession.matrix,
                  legalCertification: false
                }
              : null
        })
      });

      const payload = await readJsonResponse<ChatApiResponse>(response);

      if (!response.ok || payload.ok === false) {
        const errorText =
          payload.error ||
          payload.response ||
          payload.text ||
          `Runtime request failed with HTTP ${response.status}`;

        throw new Error(errorText);
      }

      const nextContinuityRef = getContinuityRef(payload);

      if (nextContinuityRef) {
        setContinuityRef(nextContinuityRef);
      }

      const assistantMessage: ChatMessage = {
        id: buildId("MSG-A"),
        role: "assistant",
        content: getAssistantText(payload),
        createdAt: new Date().toLocaleString("it-IT"),
        state: safeText(payload.state, "-"),
        decision: safeText(payload.decision, "-"),
        continuityRef: nextContinuityRef,
        raw: payload
      };

      setMessages((current) => [...current, assistantMessage]);
      void checkIprAccountSession();
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : "CHAT_REQUEST_FAILED";

      setError(errorText);

      setMessages((current) => [
        ...current,
        {
          id: buildId("MSG-S"),
          role: "system",
          content: `Runtime error: ${errorText}`,
          createdAt: new Date().toLocaleString("it-IT")
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  const dashboardPayload = lastAssistantPayload || health;

  const humanIprLabel = effectiveIprHandoff?.subject.ipr || "NOT_VERIFIED";
  const subjectLabel = canonicalizeSubjectName(
    effectiveIprHandoff?.subject.entity || "No verified subject",
    humanIprLabel
  );

  const runtimeProjectBirthDate = getProjectBirthDate(dashboardPayload);
  const runtimeProjectBirthLabel = getProjectBirthLabel(dashboardPayload);
  const runtimeMonthlyReference = getMonthlyReference(dashboardPayload);
  const runtimeMonthlyReferenceLabel = getMonthlyReferenceLabel(dashboardPayload);

  const runtimeOperationalHumanEvt = fallbackDash(
    getOperationalHumanEvt(dashboardPayload),
    "EVT-0016"
  );

  const runtimeOperationalAiEvt = fallbackDash(
    getCurrentAiEvt(dashboardPayload),
    "EVT-0016-AI"
  );

  const runtimeResponseEvt = fallbackDash(
    getEvt(dashboardPayload),
    "none"
  );

  const runtimeOperationalCycle = fallbackDash(
    getOperationalCycle(dashboardPayload),
    "UP-CANONICO"
  );

  const runtimeEventFamily = fallbackDash(
    getEventFamily(dashboardPayload),
    "UP-EVT"
  );

  const runtimePreviousCheckpoint = getPreviousCheckpointRef(dashboardPayload);

  const runtimeMatrixState = fallbackDash(
    getMatrixState(lastAssistantPayload),
    effectiveIprHandoff
      ? safeText(iprAccountSession?.matrix?.expectedState, "MATRIX_ACTIVE")
      : "MATRIX_LIMITED"
  );

  const runtimeMemoryScope = fallbackDash(
    getSemanticMemoryScope(lastAssistantPayload),
    effectiveIprHandoff
      ? safeText(iprAccountSession?.memory?.expectedScope, "IPR_BOUND")
      : "RUNTIME_ONLY"
  );

  const runtimeMemoryAuthority = fallbackDash(
    getMemoryAuthority(lastAssistantPayload),
    effectiveIprHandoff
      ? safeText(
          iprAccountSession?.memory?.expectedAuthority,
          "SERVER_RUNTIME_VALIDATED"
        )
      : "SESSION_RUNTIME_ONLY"
  );

  const runtimeMemoryMode = fallbackDash(
    getMemoryPersistenceMode(lastAssistantPayload),
    effectiveIprHandoff
      ? safeText(
          iprAccountSession?.memory?.persistenceMode,
          "PROCESS_MEMORY_MVP"
        )
      : safeText(health?.memory?.persistenceMode, "PROCESS_MEMORY_MVP")
  );

  const runtimeLastMemoryEvt = fallbackDash(
    getLastMemoryEvt(lastAssistantPayload),
    "none"
  );

  const runtimeLastMemoryOpc = fallbackDash(
    getLastMemoryOpc(lastAssistantPayload),
    "none"
  );

  const runtimeLastMemoryChainHash = fallbackDash(
    getLastMemoryChainHash(lastAssistantPayload),
    "none"
  );

  const runtimeMemoryHash = fallbackDash(
    getMemoryHash(lastAssistantPayload),
    "none"
  );

  const runtimeMemoryId = fallbackDash(
    getMemoryId(lastAssistantPayload),
    "not initialized"
  );

  const runtimeMemoryKeyHash = fallbackDash(
    getMemoryKeyHash(lastAssistantPayload),
    "not initialized"
  );

  const runtimeOpcProof = fallbackDash(getOpcProof(lastAssistantPayload), "none");
  const runtimeOpcChainHash = fallbackDash(getChainHash(lastAssistantPayload), "none");
  const runtimeEngineHash = fallbackDash(getEngineHash(lastAssistantPayload), "none");
  const runtimeLegalCertification = fallbackDash(
    getLegalCertification(lastAssistantPayload || health),
    "false"
  );

  const accessDecision =
    effectiveIprHandoff?.access.decision ||
    safeText(iprAccountSession?.access?.decision, "PENDING_SERVER_VALIDATION");

  const certificateStatus =
    effectiveIprHandoff?.certificate.certificate_status || "MISSING";

  const certificateId =
    effectiveIprHandoff?.certificate.certificate_id || "NO_CERTIFICATE";

  const scope =
    effectiveIprHandoff?.certificate.certificate_scope.join(", ") ||
    "MATRIX_LIMITED";

  const identityRows: InfoItem[] = [
    { label: "Runtime IPR", value: "IPR-AI-0001" },
    { label: "Human IPR", value: humanIprLabel },
    { label: "Certificate", value: certificateId },
    { label: "Cert. status", value: certificateStatus },
    { label: "Scope", value: scope },
    { label: "Source", value: effectiveIprHandoffSource }
  ];

  const memoryRows: InfoItem[] = [
    { label: "MATRIX", value: runtimeMatrixState },
    { label: "Authority", value: runtimeMemoryAuthority },
    { label: "Persistence", value: runtimeMemoryMode },
    { label: "Memory ID", value: runtimeMemoryId },
    { label: "Memory key hash", value: runtimeMemoryKeyHash },
    { label: "Memory hash", value: runtimeMemoryHash }
  ];

  const proofRows: InfoItem[] = [
    { label: "Monthly reference", value: runtimeMonthlyReference },
    { label: "Monthly label", value: runtimeMonthlyReferenceLabel },
    { label: "Previous checkpoint", value: runtimePreviousCheckpoint },
    { label: "Response EVT", value: runtimeResponseEvt },
    { label: "OPC legalCertification", value: runtimeLegalCertification },
    { label: "Current OPC", value: runtimeOpcProof },
    { label: "Last memory EVT", value: runtimeLastMemoryEvt },
    { label: "Last memory OPC", value: runtimeLastMemoryOpc },
    { label: "Memory chain", value: runtimeLastMemoryChainHash },
    { label: "OPC chain", value: runtimeOpcChainHash },
    { label: "Engine hash", value: runtimeEngineHash }
  ];

  return (
    <main className="joker-page" lang="en">
      <header className="joker-topbar">
        <div className="joker-brand">
          <div className="joker-logo notranslate" translate="no">
            {JOKER_SIGIL}
          </div>
          <div>
            <strong className="notranslate" translate="no">AI JOKER-C2</strong>
            <span>
              <span className="notranslate" translate="no">HBCE</span>{" "}
              governed AI runtime
            </span>
          </div>
        </div>

        <div className="joker-health">
          <StatusPill value={safeText(health?.state, "CHECKING")} />
          <StatusPill label="Model" value={safeText(health?.model, getModel(health))} />
          <StatusPill label="Runtime IPR" value={safeText(health?.identity?.ipr, "IPR-AI-0001")} />
          <StatusPill label="Human IPR" value={humanIprLabel} />
          <StatusPill label="Memory" value={runtimeMemoryScope} />
        </div>

        <div className="joker-top-actions">
          <button type="button" onClick={checkRuntime} disabled={isChecking}>
            {isChecking ? "Checking..." : "Runtime"}
          </button>
          <button
            type="button"
            onClick={() => void refreshIdentityContext()}
            disabled={isCheckingIprSession}
          >
            {isCheckingIprSession ? "IPR..." : "IPR session"}
          </button>
          <button type="button" onClick={newChat}>
            New chat
          </button>
        </div>
      </header>

      <section className="joker-hero">
        <div className="joker-hero-copy">
          <span className="joker-kicker notranslate" translate="no">
            HERMETICUM B.C.E. S.r.l.
          </span>
          <h1>
            <span className="notranslate" translate="no">JOKER-C2</span>{" "}
            dashboard
          </h1>
          <p>
            Professional runtime console for <span className="notranslate" translate="no">IPR</span>{" "}
            identity, <span className="notranslate" translate="no">IPR-bound memory</span>,{" "}
            <span className="notranslate" translate="no">EVT</span> continuity,{" "}
            <span className="notranslate" translate="no">OPC</span> technical proof receipts and{" "}
            <span className="notranslate" translate="no">MATRIX</span> coordination.
            No legal certification is implied:{" "}
            <code className="notranslate" translate="no">legalCertification=false</code>.
          </p>
          <div className="joker-origin-note">
            <strong className="notranslate" translate="no">{runtimeProjectBirthDate}</strong>
            <span>{runtimeProjectBirthLabel}</span>
          </div>
        </div>

        <div className="joker-hero-grid">
          <MetricCard label="Project birth" value={runtimeProjectBirthDate} />
          <MetricCard label="Monthly reference" value={runtimeMonthlyReference} />
          <MetricCard label="Event family" value={runtimeEventFamily} />
          <MetricCard label="Human EVT" value={runtimeOperationalHumanEvt} />
          <MetricCard label="AI EVT" value={runtimeOperationalAiEvt} />
          <MetricCard label="Cycle" value={runtimeOperationalCycle} />
        </div>
      </section>

      <section className="joker-dashboard">
        <div
          className={[
            "joker-panel",
            "joker-identity-panel",
            effectiveIprHandoff ? "is-active" : "",
            iprHandoffError || iprAccountSessionError ? "is-error" : ""
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">
                <span className="notranslate" translate="no">HBCE IPR</span>{" "}
                biological subject
              </span>
              <h2 className="notranslate" translate="no">{subjectLabel}</h2>
            </div>
            <StatusPill value={accessDecision} />
          </div>

          <p>
            {hasAccountSession
              ? "Server-side IPR account session detected. Authenticated session has priority over client-side transport."
              : effectiveIprHandoff
                ? "Client-side IPR handoff detected. Authoritative validation happens in /api/chat."
                : "No biological IPR handoff or IPR account session detected. Runtime remains limited until server-side validation."}
          </p>

          <InfoList items={identityRows} />

          {iprAccountSessionError && !hasAccountSession ? (
            <div className="joker-alert is-warn">
              IPR account session:{" "}
              <span className="notranslate" translate="no">
                {iprAccountSessionError}
              </span>
            </div>
          ) : null}

          {iprHandoffError ? (
            <div className="joker-alert is-bad">
              <span className="notranslate" translate="no">
                {iprHandoffError}
              </span>
            </div>
          ) : null}

          <div className="joker-panel-actions">
            <button
              type="button"
              onClick={() => void refreshIdentityContext()}
              disabled={isCheckingIprSession}
            >
              Refresh IPR session
            </button>
            <button type="button" onClick={refreshIprHandoff}>
              Refresh local handoff
            </button>
            <button type="button" onClick={clearIprHandoff}>
              Clear local handoff
            </button>
            <button
              type="button"
              onClick={() => void sendMessage("do you know who I am?")}
              disabled={isSending}
            >
              Test recognition
            </button>
          </div>
        </div>

        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">Runtime memory</span>
              <h2>
                <span className="notranslate" translate="no">IPR-bound</span>{" "}
                continuity
              </h2>
            </div>
            <StatusPill value={runtimeMemoryScope} />
          </div>

          <p>
            Current memory preserves operational continuity. It does not
            automatically authorize future requests, lower risk, replace policy
            review, disable fail-closed logic or replace human oversight.
          </p>

          <InfoList items={memoryRows} />
        </div>

        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">
                <span className="notranslate" translate="no">EVT / OPC</span>{" "}
                proof
              </span>
              <h2>Audit visibility</h2>
            </div>
            <StatusPill value="technical proof" />
          </div>

          <p>
            <span className="notranslate" translate="no">OPC</span> remains a
            technical proof receipt for audit and governance review. It is not
            legal certification, not a qualified timestamp and not public
            authority validation.
          </p>

          <InfoList items={proofRows} />
        </div>
      </section>

      <section className="joker-chat">
        {messages.length === 0 ? (
          <div className="joker-empty">
            <div className="joker-empty-logo notranslate" translate="no">
              {JOKER_SIGIL}
            </div>
            <span className="joker-kicker notranslate" translate="no">AI JOKER-C2</span>
            <h2>Runtime ready</h2>
            <p>
              Write below or use a quick prompt. This chat operates inside the
              HBCE boundary: <span className="notranslate" translate="no">IPR</span>,{" "}
              <span className="notranslate" translate="no">EVT</span>,{" "}
              <span className="notranslate" translate="no">OPC</span>,{" "}
              <span className="notranslate" translate="no">MATRIX</span>,{" "}
              <span className="notranslate" translate="no">IPR-bound memory</span>,
              audit and fail-closed logic.
            </p>

            <div className="joker-prompt-grid">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="joker-default-prompt"
              onClick={() => void sendMessage(DEFAULT_PROMPT)}
              disabled={isSending}
            >
              Start full diagnostic
            </button>
          </div>
        ) : (
          <div className="joker-message-list">
            {messages.map((item) => (
              <MessageBubble key={item.id} message={item} onCopy={copyText} />
            ))}

            {isSending ? (
              <article className="joker-message joker-message-assistant">
                <div className="joker-message-avatar notranslate" translate="no">
                  {JOKER_SIGIL}
                </div>
                <div className="joker-message-body">
                  <div className="joker-message-head">
                    <div>
                      <strong className="notranslate" translate="no">JOKER-C2</strong>
                      <span>running governed operation</span>
                    </div>
                    <time>processing</time>
                  </div>
                  <div className="joker-thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            ) : null}

            <div ref={bottomRef} />
          </div>
        )}
      </section>

      <section className="joker-composer-shell">
        {error ? (
          <div className="joker-alert is-bad composer-alert">
            <span className="notranslate" translate="no">
              {error}
            </span>
          </div>
        ) : null}
        {copied ? (
          <div className="joker-alert is-good composer-alert">
            Response copied.
          </div>
        ) : null}

        {files.length > 0 ? (
          <div className="joker-file-bar">
            {files.map((file) => (
              <div
                key={file.id}
                className={[
                  "joker-file-chip",
                  `is-${file.kind}`
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={`${file.name} · ${file.kind} · ${file.mimeType} · ${formatFileSize(file.size)}`}
              >
                {file.kind === "image" && file.dataUrl ? (
                  <img
                    src={file.dataUrl}
                    alt=""
                    className="joker-file-preview"
                  />
                ) : null}
                <span className="notranslate" translate="no">{file.name}</span>
                <em className="notranslate" translate="no">
                  {file.kind} · {formatFileSize(file.size)}
                </em>
                <button type="button" onClick={() => removeFile(file.id)}>
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              className="joker-clear-files"
              onClick={clearFiles}
            >
              Clear files
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="joker-composer">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.markdown,.json,.csv,.html,.css,.js,.ts,.tsx,.xml,.yaml,.yml,.pdf,image/png,image/jpeg,image/webp,image/gif,text/*,application/json,application/pdf"
            style={{ display: "none" }}
            onChange={(event) => void handleFiles(event.target.files)}
          />

          <button
            type="button"
            className="joker-icon-button"
            onClick={() => fileInputRef.current?.click()}
            title="Add files"
          >
            +
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write to JOKER-C2..."
            rows={1}
          />

          <button
            type="submit"
            className="joker-send"
            disabled={isSending || (!message.trim() && files.length === 0)}
            title="Send"
          >
            ↑
          </button>
        </form>

        <div className="joker-footer-line">
          <span>Enter sends · Shift+Enter creates a new line</span>
          <span>
            Session:{" "}
            <span className="notranslate" translate="no">
              {sessionId || "initializing"}
            </span>
          </span>
        </div>
      </section>

      <style jsx>{`
        .joker-page {
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto auto auto 1fr auto;
          background:
            radial-gradient(circle at 18% -8%, rgba(14, 165, 233, 0.18), transparent 34%),
            radial-gradient(circle at 84% 0%, rgba(99, 102, 241, 0.16), transparent 32%),
            radial-gradient(circle at 50% 110%, rgba(34, 197, 94, 0.08), transparent 30%),
            linear-gradient(180deg, #020617 0%, #07111f 42%, #0f172a 100%);
          color: #e5edf8;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .notranslate {
          translate: no;
        }

        .joker-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: minmax(220px, 0.85fr) minmax(0, 1.5fr) auto;
          gap: 14px;
          align-items: center;
          padding: 14px 22px;
          border-bottom: 1px solid rgba(71, 85, 105, 0.55);
          background: rgba(2, 6, 23, 0.82);
          backdrop-filter: blur(22px);
        }

        .joker-brand {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .joker-logo,
        .joker-empty-logo,
        .joker-message-avatar {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          border-radius: 16px;
          background:
            linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(79, 70, 229, 1));
          color: white;
          font-weight: 950;
          box-shadow:
            0 12px 30px rgba(34, 211, 238, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }

        .joker-logo,
        .joker-empty-logo {
          font-size: 24px;
          line-height: 1;
        }

        .joker-message-avatar {
          position: sticky;
          top: 92px;
          font-size: 20px;
          line-height: 1;
        }

        .joker-empty-logo {
          width: 76px;
          height: 76px;
          border-radius: 28px;
          font-size: 36px;
        }

        .joker-brand strong {
          display: block;
          min-width: 0;
          color: #ffffff;
          font-size: 15px;
          letter-spacing: 0.02em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-brand span {
          display: block;
          min-width: 0;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-health,
        .joker-runtime-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(51, 65, 85, 0.9) transparent;
        }

        .joker-health {
          padding: 2px;
        }

        .joker-top-actions,
        .joker-panel-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          min-width: 0;
        }

        button {
          appearance: none;
          border: 1px solid rgba(71, 85, 105, 0.78);
          background: rgba(15, 23, 42, 0.78);
          color: #dbeafe;
          border-radius: 999px;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 780;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease,
            transform 160ms ease,
            opacity 160ms ease,
            box-shadow 160ms ease;
        }

        button:hover {
          border-color: rgba(34, 211, 238, 0.72);
          color: #eff6ff;
          background: rgba(8, 47, 73, 0.72);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.52;
          transform: none;
          box-shadow: none;
        }

        .joker-top-actions button,
        .joker-panel-actions button {
          padding: 8px 12px;
        }

        .joker-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          max-width: 220px;
          flex: 0 1 auto;
          padding: 6px 10px;
          border: 1px solid rgba(71, 85, 105, 0.68);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.74);
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 760;
          line-height: 1.1;
          white-space: nowrap;
        }

        .joker-pill b {
          flex: 0 0 auto;
          color: #64748b;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .joker-pill span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-pill.is-good {
          border-color: rgba(34, 197, 94, 0.36);
          background: rgba(20, 83, 45, 0.28);
          color: #bbf7d0;
        }

        .joker-pill.is-warn {
          border-color: rgba(251, 191, 36, 0.36);
          background: rgba(120, 53, 15, 0.22);
          color: #fde68a;
        }

        .joker-pill.is-bad {
          border-color: rgba(248, 113, 113, 0.38);
          background: rgba(127, 29, 29, 0.26);
          color: #fecaca;
        }

        .joker-hero {
          width: min(1180px, calc(100% - 36px));
          margin: 22px auto 0;
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
          gap: 16px;
          align-items: stretch;
        }

        .joker-hero-copy,
        .joker-panel {
          border: 1px solid rgba(71, 85, 105, 0.54);
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55)),
            rgba(2, 6, 23, 0.58);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .joker-hero-copy {
          min-width: 0;
          padding: 26px;
        }

        .joker-origin-note {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          margin-top: 18px;
          padding: 13px 14px;
          border: 1px solid rgba(34, 211, 238, 0.22);
          border-radius: 18px;
          background: rgba(8, 47, 73, 0.22);
        }

        .joker-origin-note strong {
          color: #f8fafc;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .joker-origin-note span {
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .joker-kicker {
          display: inline-flex;
          color: #67e8f9;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .joker-hero h1,
        .joker-empty h2 {
          margin: 10px 0 0;
          color: #ffffff;
          font-size: clamp(34px, 5.4vw, 58px);
          line-height: 0.96;
          letter-spacing: -0.055em;
        }

        .joker-hero p,
        .joker-panel p,
        .joker-empty p {
          margin: 14px 0 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .joker-hero code {
          color: #bae6fd;
          background: rgba(8, 47, 73, 0.48);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 8px;
          padding: 1px 5px;
        }

        .joker-hero-grid,
        .joker-metric-grid,
        .joker-details-grid {
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .joker-hero-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .joker-dashboard {
          width: min(1180px, calc(100% - 36px));
          margin: 16px auto 0;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr) minmax(0, 0.95fr);
          gap: 16px;
        }

        .joker-panel {
          min-width: 0;
          padding: 18px;
          overflow: hidden;
        }

        .joker-panel.is-active {
          border-color: rgba(34, 211, 238, 0.34);
          background:
            radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.13), transparent 30%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
        }

        .joker-panel.is-error {
          border-color: rgba(248, 113, 113, 0.42);
        }

        .joker-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }

        .joker-panel-head > div {
          min-width: 0;
        }

        .joker-panel-head .joker-pill {
          max-width: 46%;
          flex-shrink: 1;
        }

        .joker-panel h2 {
          margin: 4px 0 0;
          color: #f8fafc;
          font-size: 19px;
          letter-spacing: -0.025em;
          line-height: 1.12;
          overflow-wrap: anywhere;
        }

        .joker-metric-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 14px;
        }

        .joker-metric {
          min-width: 0;
          padding: 13px;
          border: 1px solid rgba(71, 85, 105, 0.58);
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.52));
          overflow: hidden;
        }

        .joker-hero-grid .joker-metric {
          min-height: 92px;
        }

        .joker-metric.is-compact {
          padding: 11px;
        }

        .joker-metric.is-good {
          border-color: rgba(34, 197, 94, 0.28);
          background: rgba(20, 83, 45, 0.18);
        }

        .joker-metric.is-warn {
          border-color: rgba(251, 191, 36, 0.26);
          background: rgba(120, 53, 15, 0.16);
        }

        .joker-metric.is-bad {
          border-color: rgba(248, 113, 113, 0.28);
          background: rgba(127, 29, 29, 0.18);
        }

        .joker-metric span {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .joker-metric strong {
          display: block;
          min-width: 0;
          margin-top: 8px;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.35;
          overflow-wrap: anywhere;
          word-break: break-word;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
        }

        .joker-info-list {
          display: grid;
          gap: 8px;
          margin: 16px 0 0;
          min-width: 0;
        }

        .joker-info-row {
          display: grid;
          grid-template-columns: minmax(112px, 0.42fr) minmax(0, 1fr);
          gap: 12px;
          align-items: start;
          min-width: 0;
          padding: 10px 11px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 15px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
        }

        .joker-info-row dt {
          min-width: 0;
          color: #64748b;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
          line-height: 1.35;
          text-transform: uppercase;
        }

        .joker-info-row dd {
          min-width: 0;
          margin: 0;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 820;
          line-height: 1.38;
          text-align: right;
          overflow-wrap: anywhere;
          word-break: break-word;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
        }

        .joker-info-row.is-good {
          border-color: rgba(34, 197, 94, 0.25);
          background: rgba(20, 83, 45, 0.16);
        }

        .joker-info-row.is-warn {
          border-color: rgba(251, 191, 36, 0.25);
          background: rgba(120, 53, 15, 0.14);
        }

        .joker-info-row.is-bad {
          border-color: rgba(248, 113, 113, 0.28);
          background: rgba(127, 29, 29, 0.18);
        }

        .joker-alert {
          margin-top: 12px;
          padding: 11px 12px;
          border-radius: 16px;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .joker-alert.is-good {
          color: #bbf7d0;
          border: 1px solid rgba(34, 197, 94, 0.35);
          background: rgba(20, 83, 45, 0.24);
        }

        .joker-alert.is-warn {
          color: #fde68a;
          border: 1px solid rgba(251, 191, 36, 0.35);
          background: rgba(120, 53, 15, 0.22);
        }

        .joker-alert.is-bad {
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(127, 29, 29, 0.26);
        }

        .joker-panel-actions {
          justify-content: flex-start;
          margin-top: 14px;
        }

        .joker-chat {
          min-height: 0;
          overflow-y: auto;
          padding: 30px 18px 22px;
        }

        .joker-empty {
          width: min(860px, 100%);
          min-height: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .joker-empty h2 {
          font-size: clamp(32px, 5vw, 54px);
        }

        .joker-empty p {
          max-width: 760px;
          font-size: 15px;
        }

        .joker-prompt-grid {
          width: min(820px, 100%);
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 26px;
        }

        .joker-prompt-grid button {
          min-height: 56px;
          padding: 13px 14px;
          border-radius: 18px;
          text-align: left;
          color: #cbd5e1;
          background: rgba(2, 6, 23, 0.42);
        }

        .joker-default-prompt {
          margin-top: 12px;
          padding: 11px 16px;
          border-color: rgba(34, 211, 238, 0.42);
          background: rgba(8, 47, 73, 0.42);
        }

        .joker-message-list {
          width: min(1010px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 20px;
          padding-bottom: 8px;
        }

        .joker-message {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 14px;
          align-items: flex-start;
        }

        .joker-message-user .joker-message-avatar {
          background: linear-gradient(135deg, #334155, #0f172a);
          box-shadow: none;
          font-size: 16px;
        }

        .joker-message-system .joker-message-avatar {
          background: linear-gradient(135deg, #ef4444, #7f1d1d);
          box-shadow: none;
          font-size: 16px;
        }

        .joker-message-body {
          min-width: 0;
          border: 1px solid rgba(71, 85, 105, 0.55);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.52));
          padding: 17px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2);
        }

        .joker-message-user .joker-message-body {
          background:
            linear-gradient(180deg, rgba(8, 145, 178, 0.16), rgba(2, 6, 23, 0.46));
          border-color: rgba(34, 211, 238, 0.28);
        }

        .joker-message-system .joker-message-body {
          background: rgba(127, 29, 29, 0.22);
          border-color: rgba(248, 113, 113, 0.32);
        }

        .joker-message-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
          margin-bottom: 10px;
        }

        .joker-message-head > div {
          min-width: 0;
        }

        .joker-message-head strong {
          display: block;
          color: #f8fafc;
          font-size: 13px;
          letter-spacing: 0.02em;
        }

        .joker-message-head span,
        .joker-message-head time {
          display: block;
          color: #64748b;
          font-size: 12px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .joker-message-text {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          color: #e5edf8;
          font-size: 15px;
          line-height: 1.72;
          font-family: inherit;
        }

        .joker-runtime-strip {
          flex-wrap: wrap;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(71, 85, 105, 0.55);
        }

        .joker-runtime-strip .joker-pill {
          max-width: 260px;
        }

        .joker-message-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 13px;
        }

        .joker-message-actions button {
          padding: 8px 11px;
          font-size: 12px;
        }

        details {
          width: 100%;
          min-width: 0;
        }

        summary {
          cursor: pointer;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 850;
        }

        .joker-details-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 12px;
        }

        .joker-json {
          margin: 12px 0 0;
          max-height: 380px;
          overflow: auto;
          padding: 13px;
          border: 1px solid rgba(71, 85, 105, 0.58);
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.28);
          color: #cbd5e1;
          font-size: 11px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .joker-thinking {
          display: flex;
          align-items: center;
          gap: 7px;
          height: 28px;
        }

        .joker-thinking span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #67e8f9;
          animation: jokerPulse 1s infinite ease-in-out;
        }

        .joker-thinking span:nth-child(2) {
          animation-delay: 0.16s;
        }

        .joker-thinking span:nth-child(3) {
          animation-delay: 0.32s;
        }

        @keyframes jokerPulse {
          0%,
          80%,
          100% {
            transform: scale(0.75);
            opacity: 0.45;
          }

          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .joker-composer-shell {
          position: sticky;
          bottom: 0;
          z-index: 25;
          padding: 14px 18px 18px;
          border-top: 1px solid rgba(71, 85, 105, 0.55);
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0), rgba(2, 6, 23, 0.94) 18%),
            rgba(2, 6, 23, 0.94);
          backdrop-filter: blur(22px);
        }

        .composer-alert {
          width: min(1010px, 100%);
          margin: 0 auto 10px;
        }

        .joker-file-bar {
          width: min(1010px, 100%);
          margin: 0 auto 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .joker-file-chip,
        .joker-clear-files {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          padding: 7px 10px;
          border: 1px solid rgba(71, 85, 105, 0.78);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.82);
          color: #cbd5e1;
          font-size: 12px;
        }

        .joker-file-chip.is-text {
          border-color: rgba(34, 197, 94, 0.28);
        }

        .joker-file-chip.is-image {
          border-color: rgba(34, 211, 238, 0.34);
        }

        .joker-file-chip.is-pdf {
          border-color: rgba(251, 191, 36, 0.34);
        }

        .joker-file-chip.is-binary {
          border-color: rgba(248, 113, 113, 0.32);
        }

        .joker-file-chip span {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-file-chip em {
          color: #64748b;
          font-size: 10px;
          font-style: normal;
          font-weight: 850;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .joker-file-preview {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid rgba(148, 163, 184, 0.35);
        }

        .joker-file-chip button {
          border: 0;
          padding: 0;
          width: 18px;
          height: 18px;
          background: rgba(71, 85, 105, 0.72);
          color: #e2e8f0;
        }

        .joker-clear-files {
          cursor: pointer;
        }

        .joker-composer {
          width: min(1010px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: end;
          gap: 10px;
          padding: 10px;
          border: 1px solid rgba(71, 85, 105, 0.72);
          border-radius: 30px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.96));
          box-shadow: 0 18px 58px rgba(0, 0, 0, 0.38);
        }

        .joker-icon-button,
        .joker-send {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 999px;
          font-size: 20px;
          line-height: 1;
        }

        .joker-send {
          border-color: rgba(34, 211, 238, 0.65);
          background: linear-gradient(135deg, #0891b2, #4f46e5);
          color: #ffffff;
        }

        .joker-composer textarea {
          width: 100%;
          max-height: 220px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: #f8fafc;
          padding: 8px 4px;
          font: inherit;
          font-size: 15px;
          line-height: 1.55;
        }

        .joker-composer textarea::placeholder {
          color: #64748b;
        }

        .joker-footer-line {
          width: min(1010px, 100%);
          margin: 8px auto 0;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.4;
        }

        @media (max-width: 1180px) {
          .joker-topbar {
            grid-template-columns: 1fr;
            align-items: stretch;
          }

          .joker-top-actions {
            justify-content: flex-start;
          }

          .joker-health {
            justify-content: flex-start;
          }

          .joker-hero,
          .joker-dashboard {
            grid-template-columns: 1fr;
          }

          .joker-hero-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .joker-panel-head .joker-pill {
            max-width: 58%;
          }
        }

        @media (max-width: 860px) {
          .joker-hero-grid,
          .joker-metric-grid,
          .joker-details-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .joker-prompt-grid {
            grid-template-columns: 1fr;
          }

          .joker-info-row {
            grid-template-columns: minmax(104px, 0.4fr) minmax(0, 1fr);
          }
        }

        @media (max-width: 640px) {
          .joker-topbar {
            padding: 12px;
          }

          .joker-hero,
          .joker-dashboard {
            width: calc(100% - 20px);
          }

          .joker-hero-copy,
          .joker-panel {
            border-radius: 22px;
            padding: 15px;
          }

          .joker-hero-grid,
          .joker-metric-grid,
          .joker-details-grid {
            grid-template-columns: 1fr;
          }

          .joker-info-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .joker-info-row dd {
            text-align: left;
          }

          .joker-panel-head {
            flex-direction: column;
          }

          .joker-panel-head .joker-pill {
            max-width: 100%;
          }

          .joker-chat {
            padding: 22px 10px 14px;
          }

          .joker-message {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .joker-message-avatar {
            position: static;
            width: 34px;
            height: 34px;
            border-radius: 13px;
          }

          .joker-message-body {
            border-radius: 20px;
            padding: 14px;
          }

          .joker-composer-shell {
            padding: 10px;
          }

          .joker-footer-line {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

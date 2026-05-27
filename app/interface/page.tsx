"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type JsonRecord = Record<string, unknown>;

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

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  raw?: JsonRecord | null;
};

type RuntimeStatus = {
  model: string;
  runtimeIpr: string;
  humanIpr: string;
  subject: string;
  certificateId: string;
  certificateStatus: string;
  scope: string;
  accessDecision: string;
  identityBinding: string;
  matrix: string;
  memory: string;
  authority: string;
  persistence: string;
  aiEvt: string;
  responseEvt: string;
  opc: string;
  chainHash: string;
  lastMemoryEvt: string;
  lastMemoryOpc: string;
  legalCertification: string;
  database: string;
  openAI: string;
};

type IprSessionResponse = {
  ok?: boolean;
  authenticated?: boolean;
  reason?: string;
  detail?: string;
  error?: string;
  session?: JsonRecord;
  accountProfile?: JsonRecord;
  reconstructedIprHandoff?: unknown;
  access?: JsonRecord;
  memory?: JsonRecord;
  matrix?: JsonRecord;
  legalCertification?: boolean;
};

const JOKER_SIGIL = "🜏";

const CANONICAL_MANUEL_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const CANONICAL_MANUEL_DISPLAY_NAME = "Manuel Coletta";

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

const DEFAULT_PROMPT =
  "JOKER-C2, esegui una diagnostica runtime completa. Dimmi modello OpenAI, Runtime IPR, Human IPR, MATRIX, memoria, EVT, OPC e legalCertification=false.";

const QUICK_PROMPTS = [
  "ciao JOKER-C2, sai chi sono?",
  "mostrami la diagnostica runtime: IPR, MATRIX, memoria, database, EVT e OPC",
  "registra come memoria operativa: EVT-0016 / EVT-0016-AI è il punto attivo del progetto JOKER-C2 SaaS Core v0.1",
  "richiama la memoria operativa attiva del progetto SaaS Core v0.1",
  "spiega perché JOKER-C2 non è una AI generica"
];

const TEXT_FILE_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/xhtml+xml",
  "application/x-yaml",
  "application/yaml",
  "application/markdown",
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

function buildId(prefix: string): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `${prefix}-${Date.now()}-${suffix}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return current;
}

function normalizeVisibleText(value: string): string {
  return value
    .replace(/\bManuele Coletta\b/g, CANONICAL_MANUEL_DISPLAY_NAME)
    .replace(/\bmanuale coletta\b/gi, CANONICAL_MANUEL_DISPLAY_NAME)
    .replace(/\bmanuel coletta\b/gi, CANONICAL_MANUEL_DISPLAY_NAME)
    .replace(/\bHERMETICUM\s+BCE\s*S\.?r\.?l\.?\b/gi, "HERMETICUM B.C.E. S.r.l.")
    .replace(/\bHERMETICUM\s+BCE\b/gi, "HERMETICUM B.C.E.")
    .replace(/\blegalCertificazione\b/g, "legalCertification")
    .replace(/\blegalcertificazione\b/g, "legalCertification")
    .replace(/\blegalCertification=falso\b/gi, "legalCertification=false")
    .replace(/\bcertificazionelegale=false\b/gi, "legalCertification=false")
    .replace(/\bproprietà intellettuale\b/gi, "IPR")
    .replace(/\bDiritti di proprietà intellettuale\b/gi, "IPR")
    .replace(/\bIPR IPR\b/g, "IPR")
    .replace(/\bOPC OPC\b/g, "OPC")
    .replace(/\bEVT EVT\b/g, "EVT")
    .replace(/\bMATRIX MATRIX\b/g, "MATRIX")
    .replace(/\bHBCE HBCE\b/g, "HBCE")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function text(value: unknown, fallback = "-"): string {
  if (typeof value === "string" && value.trim()) {
    return normalizeVisibleText(value.trim());
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function first(value: unknown, paths: string[][], fallback = "-"): string {
  for (const path of paths) {
    const candidate = text(getPath(value, path), "");

    if (candidate) return candidate;
  }

  return fallback;
}

function firstJoined(value: unknown, paths: string[][], fallback = "-"): string {
  for (const path of paths) {
    const candidate = getPath(value, path);
    const flattened = flattenText(candidate).join(", ").trim();

    if (flattened) return normalizeVisibleText(flattened);
  }

  return fallback;
}

function flattenText(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenText(item));
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap((item) => flattenText(item));
  }

  return [];
}

function compact(value: string, max = 42): string {
  if (!value || value === "-" || value.length <= max) return value;
  return `${value.slice(0, Math.max(12, max - 18))}…${value.slice(-10)}`;
}

function normalizeSearchText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function canonicalizeSubjectName(value: string, ipr?: string): string {
  if (ipr === CANONICAL_MANUEL_HUMAN_IPR) return CANONICAL_MANUEL_DISPLAY_NAME;

  const normalized = normalizeSearchText(value);

  if (
    normalized === "manuel coletta" ||
    normalized === "manuele coletta" ||
    normalized === "manuale coletta"
  ) {
    return CANONICAL_MANUEL_DISPLAY_NAME;
  }

  return normalizeVisibleText(value || "-");
}

function parseJsonCandidate(raw: string): JsonRecord | null {
  const candidates: string[] = [];

  candidates.push(raw);

  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // Human civilization continues.
  }

  const decoded = decodeBase64Text(raw);

  if (decoded) candidates.push(decoded);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;

      if (isRecord(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

function decodeBase64Text(value: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function readStoredHandoff(key: string): JsonRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    return raw ? parseJsonCandidate(raw) : null;
  } catch {
    return null;
  }
}

function persistHandoff(handoff: JsonRecord) {
  if (typeof window === "undefined") return;

  try {
    const serialized = JSON.stringify(handoff);
    window.sessionStorage.setItem(HANDOFF_STORAGE_KEY, serialized);
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, serialized);
  } catch {
    // Storage is apparently also a philosophical problem now.
  }
}

function clearStoredHandoff() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);

    for (const key of LEGACY_HANDOFF_STORAGE_KEYS) {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore.
  }
}

function stripHandoffQueryParams() {
  if (typeof window === "undefined") return;

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
    // Ignore.
  }
}

function loadIprHandoffFromBrowser(): {
  handoff: JsonRecord | null;
  source: string;
  error: string | null;
} {
  if (typeof window === "undefined") {
    return { handoff: null, source: "none", error: null };
  }

  try {
    const url = new URL(window.location.href);

    for (const key of HANDOFF_QUERY_KEYS) {
      const raw = url.searchParams.get(key);

      if (!raw) continue;

      const parsed = parseJsonCandidate(raw);

      if (!parsed) {
        return {
          handoff: null,
          source: "url",
          error: `Invalid IPR handoff in URL parameter: ${key}`
        };
      }

      persistHandoff(parsed);
      stripHandoffQueryParams();

      return {
        handoff: parsed,
        source: "url",
        error: null
      };
    }

    const canonical = readStoredHandoff(HANDOFF_STORAGE_KEY);

    if (canonical) {
      return {
        handoff: canonical,
        source: "localStorage",
        error: null
      };
    }

    for (const key of LEGACY_HANDOFF_STORAGE_KEYS) {
      const legacy = readStoredHandoff(key);

      if (legacy) {
        persistHandoff(legacy);

        return {
          handoff: legacy,
          source: "localStorage",
          error: null
        };
      }
    }

    return { handoff: null, source: "none", error: null };
  } catch (error) {
    return {
      handoff: null,
      source: "none",
      error: error instanceof Error ? error.message : "IPR_HANDOFF_LOAD_FAILED"
    };
  }
}

function getHandoffSubjectIpr(handoff: JsonRecord | null): string {
  if (!handoff) return "NOT_VERIFIED";

  return first(
    handoff,
    [
      ["subject", "ipr"],
      ["subject", "ipr_id"],
      ["verifiedSubject", "ipr"],
      ["verified_subject", "ipr"],
      ["verified_subject_ipr"],
      ["subject_ipr"],
      ["humanIpr"],
      ["human_ipr"],
      ["biologicalIpr"],
      ["biologicalIPR"],
      ["ipr"],
      ["ipr_id"],
      ["identity", "ipr"],
      ["identity", "humanIpr"],
      ["biologicalSubject", "ipr"]
    ],
    "NOT_VERIFIED"
  );
}

function getHandoffSubjectName(handoff: JsonRecord | null, ipr: string): string {
  if (!handoff) return "No verified subject";

  const subject = first(
    handoff,
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
      ["fullName"],
      ["biologicalSubject", "name"]
    ],
    "Verified biological subject"
  );

  return canonicalizeSubjectName(subject, ipr);
}

function getHandoffCertificateId(handoff: JsonRecord | null): string {
  if (!handoff) return "NO_CERTIFICATE";

  return first(
    handoff,
    [
      ["certificate", "certificate_id"],
      ["certificate", "certificateId"],
      ["certificate", "id"],
      ["operationalCertificate", "certificate_id"],
      ["operationalCertificate", "certificateId"],
      ["operational_certificate", "certificate_id"],
      ["verified_subject_certificate_id"],
      ["certificate_id"],
      ["certificateId"],
      ["certId"],
      ["biologicalSubject", "certificateId"]
    ],
    "NO_CERTIFICATE"
  );
}

function getHandoffCertificateStatus(handoff: JsonRecord | null): string {
  if (!handoff) return "MISSING";

  return first(
    handoff,
    [
      ["certificate", "certificate_status"],
      ["certificate", "certificateStatus"],
      ["certificate", "status"],
      ["operationalCertificate", "certificate_status"],
      ["operationalCertificate", "certificateStatus"],
      ["operational_certificate", "certificate_status"],
      ["verified_subject_certificate_status"],
      ["certificate_status"],
      ["certificateStatus"],
      ["status"],
      ["biologicalSubject", "status"]
    ],
    "UNKNOWN"
  ).toUpperCase();
}

function getHandoffScope(handoff: JsonRecord | null): string {
  if (!handoff) return "MATRIX_LIMITED";

  return firstJoined(
    handoff,
    [
      ["certificate", "certificate_scope"],
      ["certificate", "certificateScope"],
      ["certificate", "scope"],
      ["operationalCertificate", "certificate_scope"],
      ["operationalCertificate", "certificateScope"],
      ["operational_certificate", "certificate_scope"],
      ["verified_subject_certificate_scope"],
      ["certificate_scope"],
      ["certificateScope"],
      ["access", "scope"],
      ["access", "accessScope"],
      ["accessScope"],
      ["scope"],
      ["biologicalSubject", "scope"]
    ],
    "MATRIX_LIMITED"
  );
}

function getAnswer(payload: JsonRecord): string {
  return normalizeVisibleText(
    first(
      payload,
      [
        ["response"],
        ["text"],
        ["answer"],
        ["reply"],
        ["output"],
        ["content"],
        ["message"],
        ["assistantMessage"],
        ["assistant", "content"]
      ],
      "[EMPTY_RESPONSE]"
    )
  );
}

function getRuntimeStatus(payload: JsonRecord | null | undefined): RuntimeStatus {
  const source = payload ?? {};

  const humanIpr = first(
    source,
    [
      ["verifiedSubject", "ipr"],
      ["biologicalSubject", "humanIpr"],
      ["identity", "verifiedSubject", "ipr"],
      ["identity", "humanIpr"],
      ["access", "humanIpr"],
      ["runtime", "humanIpr"]
    ],
    "-"
  );

  const subject = canonicalizeSubjectName(
    first(
      source,
      [
        ["verifiedSubject", "entity"],
        ["verifiedSubject", "name"],
        ["biologicalSubject", "name"],
        ["identity", "verifiedSubject", "entity"],
        ["identity", "verified_subject_entity"]
      ],
      humanIpr === CANONICAL_MANUEL_HUMAN_IPR ? CANONICAL_MANUEL_DISPLAY_NAME : "-"
    ),
    humanIpr
  );

  const certificateId = first(
    source,
    [
      ["verifiedSubject", "certificateId"],
      ["biologicalSubject", "certificateId"],
      ["identity", "verifiedSubject", "certificateId"],
      ["iprHandoff", "verifiedSubject", "certificateId"]
    ],
    "-"
  );

  const certificateStatus = first(
    source,
    [
      ["verifiedSubject", "certificateStatus"],
      ["biologicalSubject", "status"],
      ["identity", "verifiedSubject", "certificateStatus"],
      ["iprHandoff", "verifiedSubject", "certificateStatus"]
    ],
    "-"
  );

  const scope = firstJoined(
    source,
    [
      ["verifiedSubject", "certificateScope"],
      ["biologicalSubject", "scope"],
      ["identity", "verifiedSubject", "certificateScope"],
      ["iprHandoff", "verifiedSubject", "certificateScope"]
    ],
    "-"
  );

  return {
    model: first(
      source,
      [
        ["engine", "modelUsed"],
        ["runtime", "model"],
        ["runtime", "modelUsed"],
        ["model"],
        ["provider", "model"],
        ["models", "defaultModel"]
      ],
      "-"
    ),
    runtimeIpr: first(
      source,
      [
        ["runtime", "ipr"],
        ["runtimeIpr"],
        ["identity", "runtimeIpr"],
        ["identity", "ipr"]
      ],
      "IPR-AI-0001"
    ),
    humanIpr,
    subject,
    certificateId,
    certificateStatus,
    scope,
    accessDecision: first(
      source,
      [
        ["access", "decision"],
        ["biologicalSubject", "accessDecision"],
        ["identity", "verifiedSubjectAccessDecision"]
      ],
      "-"
    ),
    identityBinding: first(
      source,
      [
        ["access", "identityBinding"],
        ["biologicalSubject", "identityBinding"],
        ["identity", "identityBinding"]
      ],
      "-"
    ),
    matrix: first(
      source,
      [
        ["access", "matrixState"],
        ["matrix", "state"],
        ["runtime", "matrix"],
        ["identity", "matrixState"]
      ],
      "-"
    ),
    memory: first(
      source,
      [
        ["access", "semanticMemoryScope"],
        ["memory", "scope"],
        ["semanticMemory", "scope"],
        ["runtime", "memory"],
        ["runtime", "memoryScope"]
      ],
      "-"
    ),
    authority: first(
      source,
      [
        ["memory", "authority"],
        ["semanticMemory", "authority"],
        ["runtime", "authority"],
        ["runtime", "memoryAuthority"]
      ],
      "-"
    ),
    persistence: first(
      source,
      [
        ["memory", "persistenceMode"],
        ["semanticMemory", "persistenceMode"],
        ["runtime", "mode"],
        ["runtime", "memoryPersistenceMode"],
        ["persistence", "activeMode"],
        ["database", "mode"]
      ],
      "-"
    ),
    aiEvt: first(
      source,
      [
        ["runtime", "aiEvt"],
        ["identity", "evt"],
        ["identity", "checkpoint"],
        ["operationalContext", "current_ai_evt"],
        ["project", "sourceEventAi"]
      ],
      "EVT-0016-AI"
    ),
    responseEvt: first(
      source,
      [
        ["runtime", "responseEvt"],
        ["runtime", "responseEvtId"],
        ["responseEvt"],
        ["responseEvtId"],
        ["evtId"],
        ["currentEvt"],
        ["continuity", "currentEvt"],
        ["continuityRef"],
        ["evt", "id"],
        ["evt", "evt"],
        ["event", "id"],
        ["event", "evt"],
        ["modernEvt", "id"],
        ["modernEvt", "evt"],
        ["governedEvt", "id"],
        ["governedEvt", "evt"]
      ],
      "-"
    ),
    opc: first(
      source,
      [
        ["runtime", "opc"],
        ["runtime", "opcId"],
        ["currentOpc"],
        ["opcId"],
        ["continuity", "currentOpc"],
        ["opc", "id"],
        ["opc", "proofId"],
        ["opc", "publicProof", "proofId"],
        ["opc", "record", "proofId"],
        ["opcProof", "id"],
        ["opcProof", "proofId"],
        ["proof", "id"],
        ["proof", "proofId"]
      ],
      "-"
    ),
    chainHash: first(
      source,
      [
        ["continuity", "chainHash"],
        ["opc", "publicProof", "chainHash"],
        ["opc", "record", "chainHash"],
        ["opc", "chainHash"],
        ["opcProof", "chainHash"],
        ["proof", "chainHash"]
      ],
      "-"
    ),
    lastMemoryEvt: first(
      source,
      [
        ["memory", "lastEvtId"],
        ["memory", "lastEvt"],
        ["memory", "currentContinuityRef"],
        ["semanticMemory", "lastMemoryEvt"],
        ["runtime", "memoryLastEvt"]
      ],
      "-"
    ),
    lastMemoryOpc: first(
      source,
      [
        ["memory", "lastOpcId"],
        ["memory", "lastOpcProofId"],
        ["semanticMemory", "lastMemoryOpcProofId"],
        ["runtime", "memoryLastOpcProofId"]
      ],
      "-"
    ),
    legalCertification: first(
      source,
      [
        ["boundary", "legalCertification"],
        ["opcProof", "legalCertification"],
        ["proof", "legalCertification"],
        ["opc", "publicProof", "legalCertification"],
        ["runtime", "legalCertification"]
      ],
      "false"
    ),
    database: first(
      source,
      [
        ["database", "mode"],
        ["database", "targetPersistence"],
        ["persistence", "activeMode"],
        ["memory", "persistenceMode"]
      ],
      "UNKNOWN"
    ),
    openAI: first(
      source,
      [
        ["provider", "configured"],
        ["openAIConfigured"],
        ["openaiConfigured"]
      ],
      "UNKNOWN"
    )
  };
}

function getStatusClass(value: string): string {
  const normalized = value.toUpperCase();

  if (
    normalized.includes("OK") ||
    normalized.includes("ONLINE") ||
    normalized.includes("ACTIVE") ||
    normalized.includes("GRANTED") ||
    normalized.includes("IPR_BOUND") ||
    normalized.includes("VALIDATED") ||
    normalized.includes("OPERATIONAL") ||
    normalized.includes("COMPLETED") ||
    normalized.includes("DATABASE_PERSISTENT") ||
    normalized.includes("CONFIGURED") ||
    normalized.includes("TRUE")
  ) {
    return "is-good";
  }

  if (
    normalized.includes("LIMITED") ||
    normalized.includes("PENDING") ||
    normalized.includes("PROCESS_MEMORY") ||
    normalized.includes("RUNTIME_ONLY") ||
    normalized.includes("MVP") ||
    normalized.includes("SERVER_VALIDATION_REQUIRED") ||
    normalized.includes("NOT_VERIFIED") ||
    normalized.includes("UNKNOWN") ||
    normalized === "-"
  ) {
    return "is-warn";
  }

  if (
    normalized.includes("DENIED") ||
    normalized.includes("ERROR") ||
    normalized.includes("INVALID") ||
    normalized.includes("BLOCKED") ||
    normalized.includes("FAILED") ||
    normalized.includes("HTTP_405")
  ) {
    return "is-bad";
  }

  return "";
}

function StatusPill({ label, value }: { label?: string; value: string }) {
  const visibleValue = normalizeVisibleText(value);

  return (
    <span
      className={["joker-pill", getStatusClass(visibleValue)].filter(Boolean).join(" ")}
      title={visibleValue}
      translate="no"
    >
      {label ? <b>{label}</b> : null}
      <span>{compact(visibleValue)}</span>
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  const visibleValue = normalizeVisibleText(value);

  return (
    <div
      className={["joker-metric", getStatusClass(visibleValue)].filter(Boolean).join(" ")}
      title={visibleValue}
      translate="no"
    >
      <span>{label}</span>
      <strong>{compact(visibleValue, 54)}</strong>
    </div>
  );
}

function InfoList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="joker-info-list">
      {items.map((item) => {
        const visibleValue = normalizeVisibleText(item.value);

        return (
          <div
            key={`${item.label}-${visibleValue}`}
            className={["joker-info-row", getStatusClass(visibleValue)]
              .filter(Boolean)
              .join(" ")}
            translate="no"
          >
            <dt>{item.label}</dt>
            <dd title={visibleValue}>{compact(visibleValue, 60)}</dd>
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
  const status = getRuntimeStatus(message.raw ?? null);
  const visibleContent = normalizeVisibleText(message.content);

  return (
    <article
      className={[
        "joker-message",
        isUser ? "joker-message-user" : "",
        isSystem ? "joker-message-system" : "",
        isAssistant ? "joker-message-assistant" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      translate="no"
    >
      <div className="joker-message-avatar">{isUser ? "M" : isSystem ? "!" : JOKER_SIGIL}</div>

      <div className="joker-message-body">
        <div className="joker-message-head">
          <div>
            <strong>{isUser ? "Manuel" : isSystem ? "System" : "JOKER-C2"}</strong>
            {isAssistant ? (
              <span>
                {first(message.raw, [["state"], ["status"]], "-")} ·{" "}
                {first(message.raw, [["decision"], ["access", "decision"]], "-")}
              </span>
            ) : null}
          </div>
          <time>{message.createdAt}</time>
        </div>

        <pre className="joker-message-text">{visibleContent}</pre>

        {isAssistant && message.raw ? (
          <div className="joker-runtime-strip">
            <StatusPill label="Model" value={status.model} />
            <StatusPill label="Runtime IPR" value={status.runtimeIpr} />
            <StatusPill label="AI EVT" value={status.aiEvt} />
            <StatusPill label="Response EVT" value={status.responseEvt} />
            <StatusPill label="OPC" value={status.opc} />
            <StatusPill label="Human IPR" value={status.humanIpr} />
            <StatusPill label="Subject" value={status.subject} />
            <StatusPill label="MATRIX" value={status.matrix} />
            <StatusPill label="Memory" value={status.memory} />
            <StatusPill label="Authority" value={status.authority} />
            <StatusPill label="Mode" value={status.persistence} />
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
                  <MetricCard label="Subject" value={status.subject} />
                  <MetricCard label="Human IPR" value={status.humanIpr} />
                  <MetricCard label="Certificate" value={status.certificateId} />
                  <MetricCard label="Certificate status" value={status.certificateStatus} />
                  <MetricCard label="Scope" value={status.scope} />
                  <MetricCard label="Access" value={status.accessDecision} />
                  <MetricCard label="Identity binding" value={status.identityBinding} />
                  <MetricCard label="MATRIX" value={status.matrix} />
                  <MetricCard label="Memory" value={status.memory} />
                  <MetricCard label="Authority" value={status.authority} />
                  <MetricCard label="Persistence" value={status.persistence} />
                  <MetricCard label="Response EVT" value={status.responseEvt} />
                  <MetricCard label="OPC" value={status.opc} />
                  <MetricCard label="Chain hash" value={status.chainHash} />
                  <MetricCard label="legalCertification" value={status.legalCertification} />
                </div>

                <pre className="joker-json">{safeJson(message.raw)}</pre>
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
  const [health, setHealth] = useState<JsonRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<RuntimeFile[]>([]);
  const [continuityRef, setContinuityRef] = useState<string | null>(null);

  const [iprHandoff, setIprHandoff] = useState<JsonRecord | null>(null);
  const [iprHandoffSource, setIprHandoffSource] = useState("none");
  const [iprHandoffError, setIprHandoffError] = useState<string | null>(null);

  const [iprSession, setIprSession] = useState<IprSessionResponse | null>(null);
  const [iprSessionError, setIprSessionError] = useState<string | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lastAssistantPayload = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const item = messages[index];

      if (item.role === "assistant" && item.raw) return item.raw;
    }

    return null;
  }, [messages]);

  const sessionHandoff = useMemo(() => {
    if (isRecord(iprSession?.reconstructedIprHandoff)) {
      return iprSession.reconstructedIprHandoff;
    }

    if (isRecord(iprSession?.accountProfile)) {
      return iprSession.accountProfile;
    }

    return null;
  }, [iprSession]);

  const effectiveHandoff = sessionHandoff || iprHandoff;
  const effectiveHandoffSource = sessionHandoff ? "accountSession" : iprHandoffSource;
  const hasAccountSession = iprSession?.authenticated === true;

  const dashboardPayload = lastAssistantPayload || health;
  const dashboardStatus = getRuntimeStatus(dashboardPayload);

  const handoffHumanIpr = getHandoffSubjectIpr(effectiveHandoff);
  const humanIpr =
    dashboardStatus.humanIpr !== "-"
      ? dashboardStatus.humanIpr
      : hasAccountSession
        ? text(getPath(iprSession, ["session", "humanIpr"]), CANONICAL_MANUEL_HUMAN_IPR)
        : handoffHumanIpr;

  const subject =
    dashboardStatus.subject !== "-"
      ? dashboardStatus.subject
      : getHandoffSubjectName(effectiveHandoff, humanIpr);

  const certificateId =
    dashboardStatus.certificateId !== "-"
      ? dashboardStatus.certificateId
      : getHandoffCertificateId(effectiveHandoff);

  const certificateStatus =
    dashboardStatus.certificateStatus !== "-"
      ? dashboardStatus.certificateStatus
      : getHandoffCertificateStatus(effectiveHandoff);

  const scope =
    dashboardStatus.scope !== "-"
      ? dashboardStatus.scope
      : getHandoffScope(effectiveHandoff);

  const accessDecision =
    dashboardStatus.accessDecision !== "-"
      ? dashboardStatus.accessDecision
      : first(iprSession, [["access", "decision"]], "PENDING_SERVER_VALIDATION");

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
    void checkIprSession();
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
    await checkIprSession();
  }

  function clearIprHandoff() {
    clearStoredHandoff();
    stripHandoffQueryParams();
    setIprHandoff(null);
    setIprHandoffSource("none");
    setIprHandoffError(null);
  }

  async function checkIprSession() {
    setIsCheckingSession(true);
    setIprSessionError(null);

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });

      const payload = await readJsonResponse<IprSessionResponse>(response);

      setIprSession(payload);

      if (!response.ok || payload.authenticated !== true) {
        setIprSessionError(
          payload.reason || payload.detail || payload.error || `HTTP_${response.status}`
        );
      }
    } catch (err) {
      setIprSession(null);
      setIprSessionError(
        err instanceof Error ? err.message : "IPR_ACCOUNT_SESSION_CHECK_FAILED"
      );
    } finally {
      setIsCheckingSession(false);
    }
  }

  async function checkRuntime() {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });

      const payload = await readJsonResponse<JsonRecord>(response);

      if (!response.ok || payload.ok === false) {
        throw new Error(text(payload.error, `HTTP_${response.status}`));
      }

      setHealth(payload);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "HEALTH_CHECK_FAILED");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const inputFiles = event.target.files;

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
    void checkIprSession();
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
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          message: effectiveMessage,
          sessionId,
          continuityRef,
          files,
          iprHandoff: effectiveHandoff,
          iprAccountSession:
            iprSession?.authenticated === true
              ? {
                  source: "IPR_ACCOUNT_SESSION",
                  session: iprSession.session,
                  accountProfile: iprSession.accountProfile,
                  reconstructedIprHandoff: iprSession.reconstructedIprHandoff,
                  access: iprSession.access,
                  memory: iprSession.memory,
                  matrix: iprSession.matrix,
                  legalCertification: false
                }
              : null
        })
      });

      const payload = await readJsonResponse<JsonRecord>(response);
      const answer = getAnswer(payload);
      const nextContinuityRef =
        first(
          payload,
          [
            ["continuity", "currentEvt"],
            ["continuityRef"],
            ["responseEvt"],
            ["responseEvtId"],
            ["evt", "id"],
            ["evt", "evt"],
            ["event", "id"],
            ["governedEvt", "id"],
            ["modernEvt", "id"]
          ],
          ""
        ) || null;

      if (nextContinuityRef) {
        setContinuityRef(nextContinuityRef);
      }

      if (!response.ok && !answer) {
        throw new Error(text(payload.error, `HTTP_${response.status}`));
      }

      const assistantMessage: ChatMessage = {
        id: buildId("MSG-A"),
        role: "assistant",
        content: answer || text(payload.error, `Runtime request failed with HTTP_${response.status}`),
        createdAt: new Date().toLocaleString("it-IT"),
        raw: payload
      };

      setMessages((current) => [...current, assistantMessage]);

      void checkIprSession();
      void checkRuntime();
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "CHAT_REQUEST_FAILED";

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

  const identityRows = [
    { label: "Runtime IPR", value: dashboardStatus.runtimeIpr },
    { label: "Subject", value: subject },
    { label: "Human IPR", value: humanIpr },
    { label: "Certificate", value: certificateId },
    { label: "Certificate status", value: certificateStatus },
    { label: "Scope", value: scope },
    { label: "Access", value: accessDecision },
    { label: "Binding", value: dashboardStatus.identityBinding },
    { label: "Source", value: effectiveHandoffSource }
  ];

  const memoryRows = [
    { label: "MATRIX", value: dashboardStatus.matrix },
    { label: "Memory", value: dashboardStatus.memory },
    { label: "Authority", value: dashboardStatus.authority },
    { label: "Persistence", value: dashboardStatus.persistence },
    { label: "Last EVT", value: dashboardStatus.lastMemoryEvt },
    { label: "Last OPC", value: dashboardStatus.lastMemoryOpc },
    { label: "Database", value: dashboardStatus.database }
  ];

  const proofRows = [
    { label: "AI EVT", value: dashboardStatus.aiEvt },
    { label: "Response EVT", value: dashboardStatus.responseEvt },
    { label: "OPC", value: dashboardStatus.opc },
    { label: "Chain hash", value: dashboardStatus.chainHash },
    { label: "legalCertification", value: dashboardStatus.legalCertification }
  ];

  return (
    <main className="joker-page notranslate" lang="it" translate="no">
      <header className="joker-topbar">
        <div className="joker-brand">
          <div className="joker-logo">{JOKER_SIGIL}</div>
          <div>
            <strong>AI JOKER-C2</strong>
            <span>HBCE governed AI runtime</span>
          </div>
        </div>

        <div className="joker-health">
          <StatusPill value={first(health, [["state"], ["status"]], "CHECKING")} />
          <StatusPill label="Model" value={dashboardStatus.model} />
          <StatusPill label="Runtime IPR" value={dashboardStatus.runtimeIpr} />
          <StatusPill label="Human IPR" value={humanIpr} />
          <StatusPill label="Memory" value={dashboardStatus.memory} />
        </div>

        <div className="joker-top-actions">
          <button type="button" onClick={() => void checkRuntime()} disabled={isChecking}>
            {isChecking ? "Checking..." : "Runtime"}
          </button>
          <button
            type="button"
            onClick={() => void refreshIdentityContext()}
            disabled={isCheckingSession}
          >
            {isCheckingSession ? "IPR..." : "IPR session"}
          </button>
          <button type="button" onClick={newChat}>
            New chat
          </button>
        </div>
      </header>

      <section className="joker-hero">
        <div className="joker-hero-copy">
          <span className="joker-kicker">Project HBCE R&D Transfer SaaS</span>
          <h1>JOKER-C2 dashboard</h1>
          <p>
            Console operativa per transizione da R&D/MVP a SaaS Core v0.1: IPR
            verificato, accesso governato, memoria IPR-bound, EVT, OPC,
            dashboard audit, model routing e boundary C2 Defense.
          </p>
          <code>legalCertification=false</code>
        </div>

        <div className="joker-hero-grid">
          <MetricCard label="Runtime" value="AI_JOKER-C2" />
          <MetricCard label="Model" value={dashboardStatus.model} />
          <MetricCard label="Human IPR" value={humanIpr} />
          <MetricCard label="MATRIX" value={dashboardStatus.matrix} />
          <MetricCard label="Response EVT" value={dashboardStatus.responseEvt} />
          <MetricCard label="OPC" value={dashboardStatus.opc} />
        </div>
      </section>

      <section className="joker-dashboard">
        <div
          className={[
            "joker-panel",
            effectiveHandoff || hasAccountSession ? "is-active" : "",
            iprHandoffError || iprSessionError ? "is-error" : ""
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">HBCE IPR Biological Subject</span>
              <h2>{subject}</h2>
            </div>
            <StatusPill value={accessDecision} />
          </div>

          <p>
            {hasAccountSession
              ? "Server-side IPR account session detected. Authenticated session has priority over local handoff."
              : effectiveHandoff
                ? "Client-side IPR handoff detected. Authoritative validation happens during POST /api/chat."
                : "No biological IPR handoff or account session detected. Runtime remains limited until server-side validation."}
          </p>

          <InfoList items={identityRows} />

          {iprSessionError && !hasAccountSession ? (
            <div className="joker-alert is-warn">IPR account session: {iprSessionError}</div>
          ) : null}

          {iprHandoffError ? (
            <div className="joker-alert is-bad">{iprHandoffError}</div>
          ) : null}

          <div className="joker-panel-actions">
            <button
              type="button"
              onClick={() => void refreshIdentityContext()}
              disabled={isCheckingSession}
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
              onClick={() => void sendMessage("ciao JOKER-C2, sai chi sono?")}
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
              <h2>IPR-bound continuity</h2>
            </div>
            <StatusPill value={dashboardStatus.memory} />
          </div>

          <p>
            La memoria operativa non autentica da sola il soggetto, non abbassa
            il rischio e non sostituisce la persistenza database.
          </p>

          <InfoList items={memoryRows} />
        </div>

        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">EVT / OPC proof</span>
              <h2>Audit visibility</h2>
            </div>
            <StatusPill value="technical proof" />
          </div>

          <p>
            OPC è una ricevuta tecnica per audit e governance. Non è una
            certificazione legale, non è timestamp qualificato e non è validazione
            di pubblica autorità.
          </p>

          <InfoList items={proofRows} />
        </div>
      </section>

      <section className="joker-chat">
        {messages.length === 0 ? (
          <div className="joker-empty">
            <div className="joker-empty-logo">{JOKER_SIGIL}</div>
            <span className="joker-kicker">AI JOKER-C2</span>
            <h2>Runtime ready</h2>
            <p>
              Scrivi sotto o usa un prompt rapido. La chat opera nel boundary
              HBCE: IPR, EVT, OPC, MATRIX, memoria IPR-bound, audit e fail-closed.
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
                <div className="joker-message-avatar">{JOKER_SIGIL}</div>
                <div className="joker-message-body">
                  <div className="joker-message-head">
                    <div>
                      <strong>JOKER-C2</strong>
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
        {error ? <div className="joker-alert is-bad composer-alert">{error}</div> : null}

        {copied ? (
          <div className="joker-alert is-good composer-alert">Response copied.</div>
        ) : null}

        {files.length > 0 ? (
          <div className="joker-file-bar">
            {files.map((file) => (
              <div
                key={file.id}
                className={["joker-file-chip", `is-${file.kind}`].join(" ")}
                title={`${file.name} · ${file.kind} · ${file.mimeType} · ${formatFileSize(file.size)}`}
              >
                {file.kind === "image" && file.dataUrl ? (
                  <img src={file.dataUrl} alt="" className="joker-file-preview" />
                ) : null}
                <span>{file.name}</span>
                <em>
                  {file.kind} · {formatFileSize(file.size)}
                </em>
                <button type="button" onClick={() => removeFile(file.id)}>
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="joker-clear-files" onClick={clearFiles}>
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
            onChange={handleFiles}
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
            Session: <span>{sessionId || "initializing"}</span>
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
          background: rgba(2, 6, 23, 0.86);
          backdrop-filter: blur(22px);
        }

        .joker-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
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
          background: linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(79, 70, 229, 1));
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

        .joker-empty-logo {
          width: 76px;
          height: 76px;
          border-radius: 28px;
          font-size: 36px;
        }

        .joker-brand strong {
          display: block;
          color: #ffffff;
          font-size: 15px;
          letter-spacing: 0.02em;
        }

        .joker-brand span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 12px;
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
        }

        .joker-top-actions,
        .joker-panel-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
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
          max-width: 260px;
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
          color: #64748b;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .joker-pill span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .is-good {
          border-color: rgba(34, 197, 94, 0.34) !important;
          background: rgba(20, 83, 45, 0.22) !important;
          color: #bbf7d0 !important;
        }

        .is-warn {
          border-color: rgba(251, 191, 36, 0.34) !important;
          background: rgba(120, 53, 15, 0.18) !important;
          color: #fde68a !important;
        }

        .is-bad {
          border-color: rgba(248, 113, 113, 0.36) !important;
          background: rgba(127, 29, 29, 0.22) !important;
          color: #fecaca !important;
        }

        .joker-hero,
        .joker-dashboard {
          width: min(1180px, calc(100% - 36px));
          margin: 22px auto 0;
          display: grid;
          gap: 16px;
        }

        .joker-hero {
          grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
          align-items: stretch;
        }

        .joker-dashboard {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 16px;
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
          padding: 26px;
        }

        .joker-panel {
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
          display: inline-flex;
          margin-top: 18px;
          color: #bae6fd;
          background: rgba(8, 47, 73, 0.48);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 10px;
          padding: 6px 8px;
        }

        .joker-hero-grid,
        .joker-details-grid {
          display: grid;
          gap: 10px;
        }

        .joker-hero-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .joker-details-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 12px;
        }

        .joker-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .joker-panel h2 {
          margin: 4px 0 0;
          color: #f8fafc;
          font-size: 19px;
          letter-spacing: -0.025em;
          line-height: 1.12;
          overflow-wrap: anywhere;
        }

        .joker-metric {
          min-width: 0;
          padding: 13px;
          border: 1px solid rgba(71, 85, 105, 0.58);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.52));
          overflow: hidden;
        }

        .joker-hero-grid .joker-metric {
          min-height: 92px;
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
        }

        .joker-info-row {
          display: grid;
          grid-template-columns: minmax(112px, 0.42fr) minmax(0, 1fr);
          gap: 12px;
          align-items: start;
          padding: 10px 11px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 15px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
        }

        .joker-info-row dt {
          color: #64748b;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
          line-height: 1.35;
          text-transform: uppercase;
        }

        .joker-info-row dd {
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

        .joker-alert {
          margin-top: 12px;
          padding: 11px 12px;
          border-radius: 16px;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
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
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.52));
          padding: 17px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2);
        }

        .joker-message-user .joker-message-body {
          background: linear-gradient(180deg, rgba(8, 145, 178, 0.16), rgba(2, 6, 23, 0.46));
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
          margin-bottom: 10px;
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
        }

        summary {
          cursor: pointer;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 850;
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
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.96));
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
          .joker-topbar,
          .joker-hero,
          .joker-dashboard {
            grid-template-columns: 1fr;
          }

          .joker-top-actions {
            justify-content: flex-start;
          }

          .joker-hero-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .joker-hero-grid,
          .joker-details-grid,
          .joker-prompt-grid {
            grid-template-columns: 1fr;
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

          .joker-chat {
            padding: 22px 10px 14px;
          }

          .joker-message {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .joker-message-avatar {
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

async function readRuntimeFile(file: File): Promise<RuntimeFile> {
  const type = resolveFileMimeType(file);
  const kind = resolveRuntimeFileKind(file);

  if (kind === "text") {
    const content = await file.text();

    return {
      id: buildId("FILE"),
      name: file.name,
      type,
      mimeType: type,
      size: file.size,
      kind,
      text: content,
      content,
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

  const manifest = buildFileContentManifest({ file, kind, type });

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

function resolveRuntimeFileKind(file: File): RuntimeFileKind {
  const type = resolveFileMimeType(file);

  if (type.startsWith("text/") || TEXT_FILE_TYPES.has(type)) return "text";
  if (type.startsWith("image/") || IMAGE_FILE_TYPES.has(type)) return "image";
  if (type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";

  return "binary";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("FILE_DATA_URL_READ_FAILED"));

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("FILE_DATA_URL_EMPTY_RESULT"));
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

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
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

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

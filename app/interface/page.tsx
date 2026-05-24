"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type RuntimeState =
  | "OPERATIONAL"
  | "DEGRADED"
  | "BLOCKED"
  | "INVALID"
  | "AUDIT_ONLY"
  | "MAINTENANCE"
  | string;

type RuntimeDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "DEGRADE"
  | "AUDIT"
  | "NOOP"
  | string;

type JsonRecord = Record<string, unknown>;

type FileInput = {
  id?: string;
  name?: string;
  type?: string;
  mimeType?: string;
  size?: number;
  text?: string;
  content?: string;
  role?: string;
  uploaded?: boolean;
};

type RuntimeIdentity = {
  entity?: string;
  ipr?: string;
  evt?: string;
  state?: string;
  cycle?: string;
  core?: string;
  org?: string;
  location?: string;
  runtimeRole?: string;
  projectBirthDate?: string;
  projectBirthLabel?: string;
};

type OpenAIEngineInfo = {
  provider?: string;
  apiMode?: string;
  role?: string;
  runtimeRole?: string;
  modelUsed?: string;
  standardModel?: string;
  deepModel?: string;
  mode?: string;
  configured?: boolean;
  projectBirthDate?: string;
  projectBirthLabel?: string;
};

type PublicEvt = {
  ok?: boolean;
  evt?: string;
  prev?: string;
  hash?: string;
  publicHash?: string;
  fullHash?: string;
};

type GovernedEvt = {
  ok?: boolean;
  evt?: string;
  prev?: string;
  project?: unknown;
  activeDomains?: string[];
  hash?: string;
  appendStatus?: string;
  appendReason?: string;
};

type OpcPublicProof = {
  proofId?: string;
  chainHash?: string;
  engine?: OpenAIEngineInfo;
  engineHash?: string | null;
  modelUsed?: string;
  memoryHash?: string;
  auditStatus?: string;
  verificationStatus?: string;
  legalCertification?: boolean;
  appendStatus?: string;
  appendReason?: string;
  hbceModule?: string;
  projectDomain?: string;
  publicProof?: unknown;
};

type MemoryInfo = {
  used?: boolean;
  available?: boolean;
  injected?: boolean;
  source?: string;
  rawSource?: string;
  lastEventId?: string | null;
  event?: string;
  memoryHash?: string;
  appendStatus?: string;
  appendReason?: string;
  governedEvt?: string;
  governedHash?: string;
};

type GovernanceInfo = {
  projectDomain?: string;
  activeDomains?: string[];
  domainType?: string;
  domainConfidence?: number;
  domainReasons?: string[];
  hbceModule?: string;
  activeModules?: string[];
  strategicDoctrines?: readonly string[] | string[];
  moduleType?: string;
  moduleConfidence?: number;
  moduleReasons?: string[];
  dataClass?: string;
  containsSecret?: boolean;
  containsPersonalData?: boolean;
  containsSecuritySensitiveData?: boolean;
  containsCivicSensitiveData?: boolean;
  containsDemocraticChoiceData?: boolean;
  policyStatus?: string;
  policyOutcome?: string;
  policyReference?: string;
  policyReasons?: string[];
  riskClass?: string;
  riskScore?: number;
  riskReasons?: string[];
  oversight?: string;
  humanOversight?: string;
  requiredRole?: string;
  oversightReason?: string;
  iprBinding?: boolean;
  evtRequired?: boolean;
  memoryRequired?: boolean;
  opcRequired?: boolean;
  auditRequired?: boolean;
  failClosed?: boolean;
  civicBoundary?: string;
  aiGovernanceBoundary?: string;
  aerospaceBoundary?: string;
  reasons?: string[];
  filePolicy?: {
    allowed?: boolean;
    allowedCount?: number;
    rejectedCount?: number;
    referenceOnlyCount?: number;
    blockingRejectedCount?: number;
    reasons?: string[];
  };
};

type DiagnosticsInfo = {
  openaiConfigured?: boolean;
  engineProvider?: string;
  engineRole?: string;
  runtimeRole?: string;
  engineApiMode?: string;
  engineMode?: string;
  modelUsed?: string;
  standardModel?: string;
  deepModel?: string;
  projectBirthDate?: string;
  degradedReason?: string | null;
  evtIprMemoryUsed?: boolean;
  memorySource?: string;
  memoryAvailable?: boolean;
  memoryInjected?: boolean;
  memoryEvent?: string;
  memoryHash?: string;
  memoryAppendStatus?: string;
  opcProofId?: string;
  opcChainHash?: string;
  opcEngineHash?: string | null;
  opcModelUsed?: string;
  opcAppendStatus?: string;
  opcVerificationStatus?: string;
  hbceModule?: string;
  activeModules?: string[];
  strategicDoctrines?: readonly string[] | string[];
  structuredFormat?: boolean;
};

type ChatApiResponse = {
  ok: boolean;
  sessionId?: string;
  response?: string;
  text?: string;
  state?: RuntimeState;
  decision?: RuntimeDecision;
  governanceDecision?: string;
  degradedReason?: string | null;
  continuityRef?: string | null;
  engine?: OpenAIEngineInfo;
  modelUsed?: string;
  projectDomain?: string;
  activeDomains?: string[];
  domainType?: string;
  hbceModule?: string;
  activeModules?: string[];
  moduleType?: string;
  collections?: readonly string[] | string[];
  modules?: readonly string[] | string[];
  strategicDoctrines?: readonly string[] | string[];
  contextClass?: string;
  legacyContextClass?: string;
  intentClass?: string;
  documentMode?: string;
  documentFamily?: string;
  evtIprMemoryUsed?: boolean;
  memorySource?: string;
  structuredFormat?: boolean;
  activeFiles?: string[];
  identity?: RuntimeIdentity;
  event?: unknown;
  evt?: PublicEvt;
  modernEvt?: unknown;
  governedEvt?: GovernedEvt;
  opc?: unknown;
  opcProof?: unknown;
  proof?: unknown;
  memory?: MemoryInfo;
  runtime?: unknown;
  governance?: GovernanceInfo;
  diagnostics?: DiagnosticsInfo;
  boundary?: unknown;
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  runtime?: ChatApiResponse;
};

const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_SESSION_PREFIX = "JOKER-UI";
const DEFAULT_ENGINE_PROVIDER = "OpenAI";
const DEFAULT_ENGINE_ROLE = "cognitive_engine";
const DEFAULT_ENGINE_API_MODE = "chat.completions";
const DEFAULT_ENGINE_MODEL = "gpt-5.5";
const DEFAULT_PROJECT_BIRTH_DATE = "2026-01-19";
const DEFAULT_PROJECT_BIRTH_LABEL = "HBCE R&D / AI JOKER-C2 project birth date";

const USE_DEMOCRATIC_BOUNDARY =
  "Identity verified first. Choice separated after. Vote anonymized. Process auditable.";

const HBCE_AI_BOUNDARY =
  "The AI model does not govern HBCE. HBCE governs the use of AI models.";

const CANONICAL_COLLECTIONS = [
  "MATRIX",
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "HBCE_ECOSISTEMA_AI"
];

const CANONICAL_MODULES = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "MATRIX"
];

const CANONICAL_STRATEGIC_DOCTRINES = [
  "HBCE_CYBERSECURITY_STRATEGY",
  "HBCE_DATA_PROTECTION_STRATEGY",
  "HBCE_INFORMATION_GOVERNANCE_STRATEGY"
];

function buildClientId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
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

function firstValue(value: unknown, paths: string[][]): unknown {
  for (const path of paths) {
    const item = readPath(value, path);

    if (item !== undefined && item !== null && item !== "") {
      return item;
    }
  }

  return undefined;
}

function valueToString(value: unknown, fallback = "-"): string {
  if (typeof value === "string") {
    return value.trim() ? value.trim() : fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const rendered = value
      .map((item) => valueToString(item, ""))
      .filter(Boolean)
      .join(", ");

    return rendered || fallback;
  }

  if (isRecord(value)) {
    const preferred =
      value.domain ||
      value.module ||
      value.evt ||
      value.id ||
      value.hash ||
      value.status ||
      value.state ||
      value.name;

    if (preferred !== undefined && preferred !== null) {
      return valueToString(preferred, fallback);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function valueToBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return undefined;
}

function valueToNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return undefined;
}

function valueToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => valueToString(item, ""))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatBool(value: unknown): string {
  const booleanValue = valueToBoolean(value);

  if (booleanValue === true) return "true";
  if (booleanValue === false) return "false";

  return "-";
}

function formatList(values?: unknown): string {
  const items = valueToStringArray(values);

  if (items.length === 0) {
    return "-";
  }

  return items.join(", ");
}

function normalizeStatus(value?: unknown): string {
  return valueToString(value, "-");
}

function statusTone(value?: unknown): string {
  const normalized = normalizeStatus(value).toUpperCase();

  if (
    normalized === "OPERATIONAL" ||
    normalized === "ALLOW" ||
    normalized === "ALLOWED" ||
    normalized === "APPENDED" ||
    normalized === "VERIFIABLE" ||
    normalized === "READY" ||
    normalized === "NOT_REQUIRED" ||
    normalized === "COMPLETED" ||
    normalized === "PERMIT" ||
    normalized === "TRUE" ||
    normalized === "CONFIGURED" ||
    normalized === "DEEP" ||
    normalized === "STANDARD" ||
    normalized === "ACTIVE" ||
    normalized === "ACTIVE_PROTOTYPE_LAYER"
  ) {
    return "joker-badge--ok";
  }

  if (
    normalized === "DEGRADED" ||
    normalized === "AUDIT" ||
    normalized === "ESCALATE" ||
    normalized === "ESCALATED" ||
    normalized === "RECOMMENDED" ||
    normalized === "RESTRICTED" ||
    normalized === "REQUIRE_AUDIT" ||
    normalized === "REQUIRE_REVIEW" ||
    normalized === "PENDING" ||
    normalized === "PARTIAL" ||
    normalized === "MEDIUM" ||
    normalized === "PLANNED_FUNCTIONAL_LAYER" ||
    normalized === "PLANNED_INTERFACE_LAYER" ||
    normalized === "DOCUMENTATION_ONLY" ||
    normalized === "DOCTRINE"
  ) {
    return "joker-badge--warn";
  }

  if (
    normalized === "BLOCKED" ||
    normalized === "BLOCK" ||
    normalized === "FAILED" ||
    normalized === "REJECTED" ||
    normalized === "INVALID" ||
    normalized === "PROHIBITED" ||
    normalized === "CRITICAL" ||
    normalized === "HIGH" ||
    normalized === "FALSE" ||
    normalized === "MISSING"
  ) {
    return "joker-badge--bad";
  }

  return "joker-badge--neutral";
}

function StatusBadge({
  value,
  title
}: {
  value?: unknown;
  title?: string;
}) {
  const safeValue = normalizeStatus(value);

  return (
    <span
      title={title || safeValue}
      className={classNames("joker-badge", statusTone(safeValue))}
    >
      {safeValue}
    </span>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
  badge = false,
  title
}: {
  label: string;
  value?: unknown;
  mono?: boolean;
  badge?: boolean;
  title?: string;
}) {
  const rendered = valueToString(value, "-");

  return (
    <div className="joker-field-row">
      <div className="joker-field-label">{label}</div>
      <div
        title={title || rendered}
        className={classNames("joker-field-value", mono && "joker-mono")}
      >
        {badge ? <StatusBadge value={rendered} title={title} /> : rendered}
      </div>
    </div>
  );
}

function RuntimeCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="joker-card">
      <h2 className="joker-card-title">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function MiniProofCard({
  title,
  rows,
  statusLabels = []
}: {
  title: string;
  rows: Array<[string, unknown]>;
  statusLabels?: string[];
}) {
  return (
    <div className="joker-proof-card">
      <div className="joker-proof-title">{title}</div>

      <div className="joker-proof-rows">
        {rows.map(([label, value]) => {
          const isStatus = statusLabels.includes(label);
          const safeValue = normalizeStatus(value);

          return (
            <div key={`${title}-${label}`} className="joker-proof-row">
              <div className="joker-proof-label">{label}</div>
              <div className="joker-proof-value">
                {isStatus ? (
                  <StatusBadge value={safeValue} />
                ) : (
                  <span title={safeValue} className="joker-mono joker-proof-text">
                    {safeValue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resolveEngine(runtime?: ChatApiResponse): OpenAIEngineInfo {
  return {
    provider: valueToString(
      firstValue(runtime, [
        ["engine", "provider"],
        ["diagnostics", "engineProvider"],
        ["runtime", "cognitiveEngineProvider"]
      ]),
      DEFAULT_ENGINE_PROVIDER
    ),
    apiMode: valueToString(
      firstValue(runtime, [
        ["engine", "apiMode"],
        ["diagnostics", "engineApiMode"],
        ["runtime", "engineApiMode"]
      ]),
      DEFAULT_ENGINE_API_MODE
    ),
    role: valueToString(
      firstValue(runtime, [
        ["engine", "role"],
        ["diagnostics", "engineRole"],
        ["runtime", "cognitiveEngineRole"]
      ]),
      DEFAULT_ENGINE_ROLE
    ),
    runtimeRole: valueToString(
      firstValue(runtime, [
        ["engine", "runtimeRole"],
        ["diagnostics", "runtimeRole"],
        ["identity", "runtimeRole"],
        ["runtime", "runtimeRole"]
      ]),
      "HBCE_governed_runtime"
    ),
    modelUsed: valueToString(
      firstValue(runtime, [
        ["engine", "modelUsed"],
        ["modelUsed"],
        ["diagnostics", "modelUsed"],
        ["runtime", "model"]
      ]),
      DEFAULT_ENGINE_MODEL
    ),
    standardModel: valueToString(
      firstValue(runtime, [
        ["engine", "standardModel"],
        ["diagnostics", "standardModel"],
        ["runtime", "standardModel"]
      ]),
      DEFAULT_ENGINE_MODEL
    ),
    deepModel: valueToString(
      firstValue(runtime, [
        ["engine", "deepModel"],
        ["diagnostics", "deepModel"],
        ["runtime", "deepModel"]
      ]),
      DEFAULT_ENGINE_MODEL
    ),
    mode: valueToString(
      firstValue(runtime, [
        ["engine", "mode"],
        ["diagnostics", "engineMode"],
        ["runtime", "engineMode"]
      ]),
      "deep"
    ),
    configured: valueToBoolean(
      firstValue(runtime, [
        ["engine", "configured"],
        ["diagnostics", "openaiConfigured"],
        ["runtime", "openAIConfigured"]
      ])
    ),
    projectBirthDate: valueToString(
      firstValue(runtime, [
        ["engine", "projectBirthDate"],
        ["diagnostics", "projectBirthDate"],
        ["identity", "projectBirthDate"],
        ["runtime", "projectBirthDate"]
      ]),
      DEFAULT_PROJECT_BIRTH_DATE
    ),
    projectBirthLabel: valueToString(
      firstValue(runtime, [
        ["engine", "projectBirthLabel"],
        ["identity", "projectBirthLabel"],
        ["runtime", "projectBirthLabel"]
      ]),
      DEFAULT_PROJECT_BIRTH_LABEL
    )
  };
}

function resolveOpcEngine(runtime?: ChatApiResponse): OpenAIEngineInfo {
  const fallback = resolveEngine(runtime);

  return {
    provider: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "provider"],
        ["opc", "publicProof", "engine", "provider"],
        ["opc", "engine", "provider"],
        ["opcProof", "engine", "provider"],
        ["proof", "engine", "provider"]
      ]),
      fallback.provider || DEFAULT_ENGINE_PROVIDER
    ),
    apiMode: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "apiMode"],
        ["opc", "publicProof", "engine", "apiMode"],
        ["opc", "engine", "apiMode"],
        ["opcProof", "engine", "apiMode"],
        ["proof", "engine", "apiMode"]
      ]),
      fallback.apiMode || DEFAULT_ENGINE_API_MODE
    ),
    role: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "role"],
        ["opc", "publicProof", "engine", "role"],
        ["opc", "engine", "role"],
        ["opcProof", "engine", "role"],
        ["proof", "engine", "role"]
      ]),
      fallback.role || DEFAULT_ENGINE_ROLE
    ),
    runtimeRole: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "runtimeRole"],
        ["opc", "publicProof", "engine", "runtimeRole"],
        ["opc", "engine", "runtimeRole"],
        ["opcProof", "engine", "runtimeRole"],
        ["proof", "engine", "runtimeRole"]
      ]),
      fallback.runtimeRole || "HBCE_governed_runtime"
    ),
    modelUsed: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "modelUsed"],
        ["opc", "publicProof", "engine", "modelUsed"],
        ["opc", "engine", "modelUsed"],
        ["opcProof", "engine", "modelUsed"],
        ["proof", "engine", "modelUsed"],
        ["opc", "publicProof", "modelUsed"],
        ["opc", "modelUsed"],
        ["diagnostics", "opcModelUsed"]
      ]),
      fallback.modelUsed || DEFAULT_ENGINE_MODEL
    ),
    standardModel: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "standardModel"],
        ["opc", "publicProof", "engine", "standardModel"],
        ["opc", "engine", "standardModel"]
      ]),
      fallback.standardModel || DEFAULT_ENGINE_MODEL
    ),
    deepModel: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "deepModel"],
        ["opc", "publicProof", "engine", "deepModel"],
        ["opc", "engine", "deepModel"]
      ]),
      fallback.deepModel || DEFAULT_ENGINE_MODEL
    ),
    mode: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "mode"],
        ["opc", "publicProof", "engine", "mode"],
        ["opc", "engine", "mode"]
      ]),
      fallback.mode || "deep"
    ),
    configured: valueToBoolean(
      firstValue(runtime, [
        ["opc", "record", "engine", "configured"],
        ["opc", "publicProof", "engine", "configured"],
        ["opc", "engine", "configured"]
      ])
    ) ?? fallback.configured,
    projectBirthDate: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "projectBirthDate"],
        ["opc", "publicProof", "engine", "projectBirthDate"],
        ["opc", "engine", "projectBirthDate"]
      ]),
      fallback.projectBirthDate || DEFAULT_PROJECT_BIRTH_DATE
    ),
    projectBirthLabel: valueToString(
      firstValue(runtime, [
        ["opc", "record", "engine", "projectBirthLabel"],
        ["opc", "publicProof", "engine", "projectBirthLabel"],
        ["opc", "engine", "projectBirthLabel"]
      ]),
      fallback.projectBirthLabel || DEFAULT_PROJECT_BIRTH_LABEL
    )
  };
}

function resolveOpcEngineHash(runtime?: ChatApiResponse): string {
  return valueToString(
    firstValue(runtime, [
      ["opc", "publicProof", "engineHash"],
      ["opc", "record", "proof", "engineHash"],
      ["opc", "engineHash"],
      ["opcProof", "engineHash"],
      ["proof", "engineHash"],
      ["diagnostics", "opcEngineHash"],
      ["runtime", "opcEngineHash"]
    ]),
    "-"
  );
}

function resolveEvt(runtime?: ChatApiResponse): PublicEvt {
  return {
    evt: valueToString(
      firstValue(runtime, [
        ["evt", "evt"],
        ["event", "evt"]
      ]),
      "-"
    ),
    prev: valueToString(
      firstValue(runtime, [
        ["evt", "prev"],
        ["event", "prev"]
      ]),
      "-"
    ),
    hash: valueToString(
      firstValue(runtime, [
        ["evt", "hash"],
        ["event", "anchors", "hash"]
      ]),
      "-"
    ),
    publicHash: valueToString(
      firstValue(runtime, [
        ["evt", "publicHash"],
        ["evt", "hash"],
        ["event", "anchors", "publicHash"],
        ["event", "anchors", "hash"]
      ]),
      "-"
    ),
    fullHash: valueToString(
      firstValue(runtime, [
        ["evt", "fullHash"],
        ["event", "anchors", "fullHash"]
      ]),
      "-"
    )
  };
}

function resolveGovernedEvt(runtime?: ChatApiResponse): GovernedEvt {
  const eventSource =
    firstValue(runtime, [["governedEvt"], ["modernEvt"]]) ||
    undefined;

  return {
    evt: valueToString(
      firstValue(runtime, [
        ["governedEvt", "evt"],
        ["modernEvt", "evt"],
        ["runtime", "governedEvt"]
      ]),
      "-"
    ),
    prev: valueToString(
      firstValue(runtime, [
        ["governedEvt", "prev"],
        ["modernEvt", "prev"]
      ]),
      "-"
    ),
    project: valueToString(
      firstValue(runtime, [
        ["governedEvt", "project"],
        ["governedEvt", "project", "domain"],
        ["modernEvt", "project"],
        ["modernEvt", "project", "domain"],
        ["runtime", "governedEvtProject"]
      ]) || readPath(eventSource, ["project", "domain"]),
      "-"
    ),
    activeDomains: valueToStringArray(
      firstValue(runtime, [
        ["governedEvt", "activeDomains"],
        ["governedEvt", "project", "active_domains"],
        ["modernEvt", "activeDomains"],
        ["modernEvt", "project", "active_domains"]
      ])
    ),
    hash: valueToString(
      firstValue(runtime, [
        ["governedEvt", "hash"],
        ["governedEvt", "trace", "hash"],
        ["modernEvt", "hash"],
        ["modernEvt", "trace", "hash"],
        ["runtime", "governedHash"]
      ]),
      "-"
    ),
    appendStatus: valueToString(
      firstValue(runtime, [
        ["governedEvt", "appendStatus"],
        ["modernEvt", "appendStatus"],
        ["governedEvt", "verification", "status"],
        ["modernEvt", "verification", "status"]
      ]),
      "-"
    ),
    appendReason: valueToString(
      firstValue(runtime, [
        ["governedEvt", "appendReason"],
        ["modernEvt", "appendReason"]
      ]),
      "-"
    )
  };
}

function resolveOpc(runtime?: ChatApiResponse): OpcPublicProof {
  return {
    proofId: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "proofId"],
        ["opc", "record", "proofId"],
        ["opc", "proofId"],
        ["opcProof", "proofId"],
        ["proof", "proofId"],
        ["runtime", "opcProofId"],
        ["diagnostics", "opcProofId"]
      ]),
      "-"
    ),
    chainHash: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "chainHash"],
        ["opc", "record", "proof", "chainHash"],
        ["opc", "chainHash"],
        ["opcProof", "chainHash"],
        ["proof", "chainHash"],
        ["runtime", "opcChainHash"],
        ["diagnostics", "opcChainHash"]
      ]),
      "-"
    ),
    engineHash: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "engineHash"],
        ["opc", "record", "proof", "engineHash"],
        ["opc", "engineHash"],
        ["opcProof", "engineHash"],
        ["proof", "engineHash"],
        ["runtime", "opcEngineHash"],
        ["diagnostics", "opcEngineHash"]
      ]),
      "-"
    ),
    modelUsed: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "engine", "modelUsed"],
        ["opc", "record", "engine", "modelUsed"],
        ["opc", "modelUsed"],
        ["opcProof", "modelUsed"],
        ["diagnostics", "opcModelUsed"]
      ]),
      DEFAULT_ENGINE_MODEL
    ),
    memoryHash: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "memoryHash"],
        ["opc", "memoryHash"],
        ["memory", "memoryHash"],
        ["diagnostics", "memoryHash"]
      ]),
      "-"
    ),
    auditStatus: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "auditStatus"],
        ["opc", "record", "audit", "status"],
        ["opc", "auditStatus"],
        ["opcProof", "auditStatus"],
        ["proof", "auditStatus"],
        ["diagnostics", "opcAppendStatus"]
      ]),
      "-"
    ),
    verificationStatus: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "verificationStatus"],
        ["opc", "record", "verification", "status"],
        ["opc", "verificationStatus"],
        ["opc", "verification", "status"],
        ["opcProof", "verificationStatus"],
        ["proof", "verificationStatus"],
        ["diagnostics", "opcVerificationStatus"]
      ]),
      "-"
    ),
    legalCertification:
      valueToBoolean(
        firstValue(runtime, [
          ["opc", "publicProof", "legalCertification"],
          ["opc", "record", "boundary", "legalCertification"],
          ["opc", "legalCertification"],
          ["opcProof", "legalCertification"],
          ["proof", "legalCertification"],
          ["boundary", "legalCertification"]
        ])
      ) ?? false,
    appendStatus: valueToString(
      firstValue(runtime, [
        ["opc", "appendStatus"],
        ["opcProof", "appendStatus"],
        ["diagnostics", "opcAppendStatus"]
      ]),
      "-"
    ),
    appendReason: valueToString(
      firstValue(runtime, [
        ["opc", "appendReason"],
        ["opcProof", "appendReason"]
      ]),
      "-"
    ),
    hbceModule: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "hbceModule"],
        ["opc", "record", "runtime", "hbceModule"],
        ["opc", "hbceModule"],
        ["opcProof", "hbceModule"],
        ["governance", "hbceModule"],
        ["runtime", "hbceModule"]
      ]),
      "-"
    ),
    projectDomain: valueToString(
      firstValue(runtime, [
        ["opc", "publicProof", "projectDomain"],
        ["opc", "record", "runtime", "projectDomain"],
        ["opc", "projectDomain"],
        ["opcProof", "projectDomain"],
        ["governance", "projectDomain"],
        ["runtime", "projectDomain"]
      ]),
      "-"
    )
  };
}

function resolveIdentity(runtime?: ChatApiResponse): RuntimeIdentity {
  return {
    entity: valueToString(firstValue(runtime, [["identity", "entity"], ["runtime", "entity"]]), "-"),
    ipr: valueToString(firstValue(runtime, [["identity", "ipr"], ["runtime", "ipr"]]), "-"),
    evt: valueToString(
      firstValue(runtime, [["identity", "evt"], ["runtime", "checkpoint"]]),
      "-"
    ),
    state: valueToString(firstValue(runtime, [["identity", "state"]]), "-"),
    cycle: valueToString(firstValue(runtime, [["identity", "cycle"], ["runtime", "cycle"]]), "-"),
    core: valueToString(firstValue(runtime, [["identity", "core"], ["runtime", "core"]]), "-"),
    org: valueToString(firstValue(runtime, [["identity", "org"]]), "-"),
    location: valueToString(firstValue(runtime, [["identity", "location"]]), "-"),
    runtimeRole: valueToString(
      firstValue(runtime, [["identity", "runtimeRole"], ["engine", "runtimeRole"], ["runtime", "runtimeRole"]]),
      "HBCE_governed_runtime"
    ),
    projectBirthDate: valueToString(
      firstValue(runtime, [["identity", "projectBirthDate"], ["engine", "projectBirthDate"], ["runtime", "projectBirthDate"]]),
      DEFAULT_PROJECT_BIRTH_DATE
    ),
    projectBirthLabel: valueToString(
      firstValue(runtime, [["identity", "projectBirthLabel"], ["engine", "projectBirthLabel"]]),
      DEFAULT_PROJECT_BIRTH_LABEL
    )
  };
}

function resolveGovernance(runtime?: ChatApiResponse): GovernanceInfo {
  return {
    projectDomain: valueToString(
      firstValue(runtime, [
        ["governance", "projectDomain"],
        ["projectDomain"],
        ["runtime", "projectDomain"]
      ]),
      "-"
    ),
    activeDomains: valueToStringArray(
      firstValue(runtime, [
        ["governance", "activeDomains"],
        ["activeDomains"],
        ["runtime", "activeDomains"]
      ])
    ),
    domainType: valueToString(
      firstValue(runtime, [
        ["governance", "domainType"],
        ["domainType"],
        ["runtime", "domainType"]
      ]),
      "-"
    ),
    hbceModule: valueToString(
      firstValue(runtime, [
        ["governance", "hbceModule"],
        ["hbceModule"],
        ["runtime", "hbceModule"]
      ]),
      "-"
    ),
    activeModules: valueToStringArray(
      firstValue(runtime, [
        ["governance", "activeModules"],
        ["activeModules"],
        ["runtime", "activeModules"],
        ["diagnostics", "activeModules"]
      ])
    ),
    moduleType: valueToString(
      firstValue(runtime, [
        ["governance", "moduleType"],
        ["moduleType"],
        ["runtime", "moduleType"]
      ]),
      "-"
    ),
    moduleConfidence: valueToNumber(
      firstValue(runtime, [
        ["governance", "moduleConfidence"],
        ["runtime", "moduleConfidence"]
      ])
    ),
    strategicDoctrines: valueToStringArray(
      firstValue(runtime, [
        ["strategicDoctrines"],
        ["governance", "strategicDoctrines"],
        ["diagnostics", "strategicDoctrines"]
      ])
    ),
    dataClass: valueToString(
      firstValue(runtime, [
        ["governance", "dataClass"],
        ["runtime", "dataClass"]
      ]),
      "-"
    ),
    containsSecret: valueToBoolean(firstValue(runtime, [["governance", "containsSecret"]])),
    containsPersonalData: valueToBoolean(firstValue(runtime, [["governance", "containsPersonalData"]])),
    containsSecuritySensitiveData: valueToBoolean(
      firstValue(runtime, [["governance", "containsSecuritySensitiveData"]])
    ),
    containsCivicSensitiveData: valueToBoolean(
      firstValue(runtime, [["governance", "containsCivicSensitiveData"], ["runtime", "containsCivicSensitiveData"]])
    ),
    containsDemocraticChoiceData: valueToBoolean(
      firstValue(runtime, [["governance", "containsDemocraticChoiceData"], ["runtime", "containsDemocraticChoiceData"]])
    ),
    policyStatus: valueToString(
      firstValue(runtime, [
        ["governance", "policyStatus"],
        ["runtime", "policyStatus"]
      ]),
      "-"
    ),
    policyOutcome: valueToString(
      firstValue(runtime, [
        ["governance", "policyOutcome"],
        ["runtime", "policyOutcome"]
      ]),
      "-"
    ),
    policyReference: valueToString(
      firstValue(runtime, [
        ["governance", "policyReference"],
        ["runtime", "policyReference"]
      ]),
      "-"
    ),
    riskClass: valueToString(
      firstValue(runtime, [
        ["governance", "riskClass"],
        ["runtime", "riskClass"]
      ]),
      "-"
    ),
    riskScore: valueToNumber(
      firstValue(runtime, [
        ["governance", "riskScore"],
        ["runtime", "riskScore"]
      ])
    ),
    oversight: valueToString(
      firstValue(runtime, [
        ["governance", "oversight"],
        ["governance", "humanOversight"],
        ["runtime", "humanOversight"]
      ]),
      "-"
    ),
    requiredRole: valueToString(
      firstValue(runtime, [
        ["governance", "requiredRole"],
        ["runtime", "requiredRole"]
      ]),
      "-"
    ),
    iprBinding: valueToBoolean(firstValue(runtime, [["governance", "iprBinding"], ["runtime", "iprBinding"]])),
    evtRequired: valueToBoolean(firstValue(runtime, [["governance", "evtRequired"], ["runtime", "evtRequired"]])),
    memoryRequired: valueToBoolean(firstValue(runtime, [["governance", "memoryRequired"], ["runtime", "memoryRequired"]])),
    opcRequired: valueToBoolean(firstValue(runtime, [["governance", "opcRequired"], ["runtime", "opcRequired"]])),
    auditRequired: valueToBoolean(firstValue(runtime, [["governance", "auditRequired"], ["runtime", "auditRequired"]])),
    failClosed: valueToBoolean(firstValue(runtime, [["governance", "failClosed"], ["runtime", "failClosed"]])),
    civicBoundary: valueToString(
      firstValue(runtime, [["governance", "civicBoundary"], ["boundary", "useDemocraticBoundary"]]),
      ""
    ),
    aiGovernanceBoundary: valueToString(
      firstValue(runtime, [["governance", "aiGovernanceBoundary"], ["boundary", "aiGovernanceBoundary"]]),
      ""
    ),
    aerospaceBoundary: valueToString(firstValue(runtime, [["governance", "aerospaceBoundary"]]), "")
  };
}

function resolveNextContinuityRef(runtime?: ChatApiResponse | null): string | null {
  const value = firstValue(runtime || undefined, [
    ["continuityRef"],
    ["memory", "event"],
    ["memory", "lastEventId"],
    ["governedEvt", "evt"],
    ["modernEvt", "evt"],
    ["evt", "evt"],
    ["event", "evt"]
  ]);

  const rendered = valueToString(value, "");

  return rendered || null;
}

function resolveResponseText(payload: ChatApiResponse): string {
  return valueToString(payload.response || payload.text, "");
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const engine = resolveEngine(message.runtime);
  const opcEngine = resolveOpcEngine(message.runtime);
  const opcEngineHash = resolveOpcEngineHash(message.runtime);
  const evt = resolveEvt(message.runtime);
  const governedEvt = resolveGovernedEvt(message.runtime);
  const opc = resolveOpc(message.runtime);
  const governance = resolveGovernance(message.runtime);
  const memory = message.runtime?.memory || {};

  return (
    <article
      className={classNames(
        "joker-message",
        isUser && "joker-message--user",
        !isUser && !isSystem && "joker-message--assistant",
        isSystem && "joker-message--system"
      )}
    >
      <div className="joker-message-head">
        <div className={classNames("joker-message-role", isUser && "joker-message-role--user")}>
          {isUser ? "You" : isSystem ? "System" : "AI JOKER-C2"}
        </div>
        <time className="joker-message-time">{message.createdAt}</time>
      </div>

      <div className="joker-message-content">{message.content}</div>

      {!isUser && !isSystem && message.runtime ? (
        <div className="joker-mini-grid">
          <MiniProofCard
            title="OpenAI Engine"
            rows={[
              ["Provider", engine.provider],
              ["Model", engine.modelUsed],
              ["Mode", engine.mode],
              ["API", engine.apiMode],
              ["Configured", formatBool(engine.configured)]
            ]}
            statusLabels={["Mode", "Configured"]}
          />

          <MiniProofCard
            title="OPC Engine"
            rows={[
              ["Provider", opcEngine.provider],
              ["Model", opcEngine.modelUsed],
              ["Mode", opcEngine.mode],
              ["EHash", opcEngineHash],
              ["API", opcEngine.apiMode]
            ]}
            statusLabels={["Mode"]}
          />

          <MiniProofCard
            title="EVT Chain"
            rows={[
              ["EVT", evt.evt],
              ["Prev", evt.prev],
              ["Public", evt.publicHash || evt.hash],
              ["Full", evt.fullHash]
            ]}
          />

          <MiniProofCard
            title="Governed EVT"
            rows={[
              ["EVT", governedEvt.evt],
              ["Prev", governedEvt.prev],
              ["Project", governedEvt.project],
              ["Append", governedEvt.appendStatus]
            ]}
            statusLabels={["Append"]}
          />

          <MiniProofCard
            title="HBCE Module"
            rows={[
              ["Module", governance.hbceModule],
              ["Type", governance.moduleType],
              ["Active", formatList(governance.activeModules)]
            ]}
          />

          <MiniProofCard
            title="Strategic Doctrine"
            rows={[
              ["Docs", formatList(governance.strategicDoctrines)],
              ["Layer", "ACTIVE"],
              ["Status", "DOCTRINE"]
            ]}
            statusLabels={["Layer", "Status"]}
          />

          <MiniProofCard
            title="EVT/IPR Memory"
            rows={[
              ["Event", memory.event],
              ["Hash", memory.memoryHash],
              ["Source", memory.source],
              ["Append", memory.appendStatus]
            ]}
            statusLabels={["Append"]}
          />

          <MiniProofCard
            title="OPC Proof Receipt"
            rows={[
              ["Proof", opc.proofId],
              ["Chain", opc.chainHash],
              ["Model", opc.modelUsed || opcEngine.modelUsed],
              ["EHash", opcEngineHash],
              ["Audit", opc.auditStatus],
              ["Verify", opc.verificationStatus],
              ["Legal", String(opc.legalCertification ?? false)]
            ]}
            statusLabels={["Audit", "Verify", "Legal"]}
          />
        </div>
      ) : null}
    </article>
  );
}

function FilesPanel({
  files,
  onRemoveFile,
  onClearFiles
}: {
  files: FileInput[];
  onRemoveFile: (id: string | undefined) => void;
  onClearFiles: () => void;
}) {
  if (files.length === 0) {
    return (
      <div className="joker-empty-files">
        Nessun file attivo. Puoi caricare file testuali per inserirli nel contesto runtime.
      </div>
    );
  }

  return (
    <div className="joker-files-box">
      <div className="joker-files-head">
        <h2>Active Files</h2>
        <button type="button" onClick={onClearFiles} className="joker-small-btn joker-small-btn--danger">
          Clear
        </button>
      </div>

      <div className="joker-files-list">
        {files.map((file) => (
          <div key={file.id || file.name} className="joker-file-row">
            <div className="joker-file-main">
              <div className="joker-file-name">{file.name || "unnamed"}</div>
              <div className="joker-file-meta">
                {file.type || file.mimeType || "unknown"} · {file.size || 0} bytes
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="joker-small-btn joker-small-btn--danger"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InterfacePage() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileInput[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastRuntime, setLastRuntime] = useState<ChatApiResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("hbce-joker-session-id")
        : null;

    const nextSessionId = stored || buildClientId(DEFAULT_SESSION_PREFIX);

    setSessionId(nextSessionId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-session-id", nextSessionId);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const runtimeSummary = useMemo(() => {
    const engine = resolveEngine(lastRuntime || undefined);
    const opcEngine = resolveOpcEngine(lastRuntime || undefined);
    const opc = resolveOpc(lastRuntime || undefined);
    const evt = resolveEvt(lastRuntime || undefined);
    const governedEvt = resolveGovernedEvt(lastRuntime || undefined);
    const identity = resolveIdentity(lastRuntime || undefined);
    const governance = resolveGovernance(lastRuntime || undefined);

    return {
      state: lastRuntime?.state || "Ready",
      decision: lastRuntime?.decision || "-",
      governanceDecision: lastRuntime?.governanceDecision || "-",
      engine,
      opcEngine,
      opcEngineHash: resolveOpcEngineHash(lastRuntime || undefined),
      opcModelUsed: opc.modelUsed || opcEngine.modelUsed || "-",
      opcChainHash: opc.chainHash || "-",
      opcAppendStatus: opc.appendStatus || "-",
      opcVerificationStatus: opc.verificationStatus || "-",
      opcAuditStatus: opc.auditStatus || "-",
      legalCertification: opc.legalCertification ?? false,
      projectDomain: governance.projectDomain || "-",
      activeDomains: governance.activeDomains || [],
      domainType: governance.domainType || "-",
      contextClass:
        valueToString(
          firstValue(lastRuntime || undefined, [["contextClass"], ["runtime", "contextClass"]]),
          "-"
        ),
      intentClass:
        valueToString(
          firstValue(lastRuntime || undefined, [["intentClass"], ["runtime", "intentClass"]]),
          "-"
        ),
      documentFamily: lastRuntime?.documentFamily || "-",
      hbceModule: governance.hbceModule || "-",
      activeModules: governance.activeModules || [],
      moduleType: governance.moduleType || "-",
      moduleConfidence: governance.moduleConfidence,
      collections: valueToStringArray(lastRuntime?.collections).length > 0
        ? valueToStringArray(lastRuntime?.collections)
        : CANONICAL_COLLECTIONS,
      modules: valueToStringArray(lastRuntime?.modules).length > 0
        ? valueToStringArray(lastRuntime?.modules)
        : CANONICAL_MODULES,
      strategicDoctrines:
        valueToStringArray(governance.strategicDoctrines).length > 0
          ? valueToStringArray(governance.strategicDoctrines)
          : CANONICAL_STRATEGIC_DOCTRINES,
      memoryUsed:
        lastRuntime?.evtIprMemoryUsed ??
        lastRuntime?.memory?.used ??
        lastRuntime?.diagnostics?.evtIprMemoryUsed,
      memorySource:
        lastRuntime?.memorySource ||
        lastRuntime?.memory?.source ||
        lastRuntime?.diagnostics?.memorySource ||
        "-",
      memoryHash:
        lastRuntime?.memory?.memoryHash ||
        lastRuntime?.diagnostics?.memoryHash ||
        "-",
      evt,
      governedEvt,
      opc,
      identity,
      governance
    };
  }, [lastRuntime]);

  async function handleFileChange(inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return;

    const nextFiles: FileInput[] = [];

    for (const file of Array.from(inputFiles)) {
      const text = await file.text();

      nextFiles.push({
        id: buildClientId("FILE"),
        name: file.name,
        type: file.type || "text/plain",
        mimeType: file.type || "text/plain",
        size: file.size,
        role: "context",
        text,
        content: text,
        uploaded: true
      });
    }

    setFiles((current) => [...current, ...nextFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(id: string | undefined) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function clearFiles() {
    setFiles([]);
  }

  function newSession() {
    const nextSessionId = buildClientId(DEFAULT_SESSION_PREFIX);

    setSessionId(nextSessionId);
    setMessages([]);
    setLastRuntime(null);
    setRuntimeError(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-session-id", nextSessionId);
    }
  }

  async function sendMessage(forceMessage?: string) {
    const outgoing = (forceMessage || message).trim();

    if (!outgoing && files.length === 0) return;

    setRuntimeError(null);
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: buildClientId("MSG-U"),
      role: "user",
      content: outgoing || "Usa i file attivi come contesto operativo.",
      createdAt: new Date().toLocaleString("it-IT")
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: outgoing,
          sessionId,
          files,
          continuityRef: resolveNextContinuityRef(lastRuntime)
        })
      });

      const payload = (await response.json()) as ChatApiResponse;

      if (!response.ok || !payload.ok) {
        const errorMessage =
          payload.error ||
          payload.response ||
          payload.text ||
          `Runtime request failed with HTTP ${response.status}`;

        throw new Error(errorMessage);
      }

      setLastRuntime(payload);

      const assistantMessage: ChatMessage = {
        id: buildClientId("MSG-A"),
        role: "assistant",
        content: resolveResponseText(payload) || "[EMPTY_RESPONSE]",
        createdAt: new Date().toLocaleString("it-IT"),
        runtime: payload
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Unknown runtime error.";

      setRuntimeError(errorText);

      setMessages((current) => [
        ...current,
        {
          id: buildClientId("MSG-S"),
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
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="joker-interface">
      <style jsx global>{`
        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #020617;
          color: #e5edf8;
        }

        * {
          box-sizing: border-box;
        }

        .joker-interface {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(circle at 20% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
            radial-gradient(circle at 85% 10%, rgba(99, 102, 241, 0.11), transparent 30%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
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

        .joker-shell {
          width: min(1440px, 100%);
          margin: 0 auto;
          display: grid;
          min-height: 100vh;
          gap: 24px;
          padding: 24px;
          grid-template-columns: minmax(0, 1fr) 390px;
        }

        .joker-main-panel {
          min-width: 0;
          min-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.62);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.38);
          backdrop-filter: blur(16px);
        }

        .joker-header {
          padding: 22px;
          border-bottom: 1px solid rgba(51, 65, 85, 0.9);
        }

        .joker-header-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .joker-kicker {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .joker-title {
          margin: 8px 0 0;
          color: #ffffff;
          font-size: clamp(24px, 4vw, 34px);
          font-weight: 760;
          letter-spacing: -0.035em;
          line-height: 1.05;
        }

        .joker-lead {
          max-width: 760px;
          margin: 10px 0 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.65;
        }

        .joker-session-box {
          min-width: min(100%, 290px);
          max-width: 420px;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.80);
        }

        .joker-session-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-session-id {
          margin-top: 6px;
          color: #cbd5e1;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .joker-chat-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 22px;
        }

        .joker-empty {
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          text-align: center;
          border: 1px dashed rgba(51, 65, 85, 0.95);
          border-radius: 28px;
          background: rgba(2, 6, 23, 0.35);
        }

        .joker-empty-inner {
          max-width: 620px;
        }

        .joker-empty-kicker {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-empty-title {
          margin: 12px 0 0;
          color: #f8fafc;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.25;
        }

        .joker-samples {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .joker-sample-btn,
        .joker-small-btn,
        .joker-action-btn,
        .joker-send-btn {
          appearance: none;
          border: 1px solid rgba(51, 65, 85, 0.98);
          background: rgba(15, 23, 42, 0.9);
          color: #cbd5e1;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
          transition:
            border-color 160ms ease,
            color 160ms ease,
            background 160ms ease,
            transform 160ms ease;
        }

        .joker-sample-btn:hover,
        .joker-small-btn:hover,
        .joker-action-btn:hover,
        .joker-send-btn:hover {
          border-color: rgba(34, 211, 238, 0.65);
          color: #a5f3fc;
          background: rgba(8, 47, 73, 0.45);
        }

        .joker-sample-btn {
          padding: 9px 14px;
          font-size: 14px;
        }

        .joker-message-list {
          display: grid;
          gap: 16px;
        }

        .joker-message {
          min-width: 0;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          background: rgba(2, 6, 23, 0.62);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
        }

        .joker-message--user {
          border-color: rgba(34, 211, 238, 0.26);
          background: rgba(8, 145, 178, 0.12);
        }

        .joker-message--assistant {
          border-color: rgba(51, 65, 85, 0.95);
        }

        .joker-message--system {
          border-color: rgba(248, 113, 113, 0.35);
          background: rgba(127, 29, 29, 0.24);
        }

        .joker-message-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .joker-message-role {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-message-role--user {
          color: #a5f3fc;
        }

        .joker-message-time {
          color: #64748b;
          font-size: 12px;
        }

        .joker-message-content {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          color: #f1f5f9;
          font-size: 15px;
          line-height: 1.72;
        }

        .joker-mini-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(51, 65, 85, 0.9);
        }

        .joker-proof-card {
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.90);
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.24);
        }

        .joker-proof-title {
          margin-bottom: 10px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-proof-rows {
          display: grid;
          gap: 8px;
        }

        .joker-proof-row {
          min-width: 0;
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 8px;
          align-items: flex-start;
        }

        .joker-proof-label {
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .joker-proof-value {
          min-width: 0;
        }

        .joker-proof-text {
          display: block;
          color: #cbd5e1;
          font-size: 11px;
          line-height: 1.45;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .joker-submit {
          padding: 22px;
          border-top: 1px solid rgba(51, 65, 85, 0.9);
        }

        .joker-error {
          margin-bottom: 14px;
          padding: 12px;
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(127, 29, 29, 0.22);
          border-radius: 16px;
          font-size: 14px;
        }

        .joker-form-grid {
          display: grid;
          gap: 12px;
        }

        .joker-input {
          width: 100%;
          min-height: 118px;
          resize: vertical;
          padding: 15px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          outline: none;
          background: rgba(2, 6, 23, 0.90);
          color: #f8fafc;
          font-size: 14px;
          line-height: 1.65;
          font-family: inherit;
        }

        .joker-input::placeholder {
          color: #475569;
        }

        .joker-input:focus {
          border-color: rgba(34, 211, 238, 0.75);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
        }

        .joker-form-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .joker-left-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .joker-action-btn,
        .joker-send-btn {
          padding: 9px 16px;
          font-size: 14px;
        }

        .joker-action-btn--warn:hover {
          border-color: rgba(251, 191, 36, 0.65);
          color: #fde68a;
          background: rgba(120, 53, 15, 0.35);
        }

        .joker-send-btn {
          border-color: rgba(34, 211, 238, 0.65);
          background: rgba(34, 211, 238, 0.10);
          color: #cffafe;
        }

        .joker-send-btn:disabled {
          cursor: not-allowed;
          border-color: rgba(30, 41, 59, 0.95);
          background: rgba(15, 23, 42, 0.75);
          color: #475569;
        }

        .joker-sidebar {
          display: grid;
          align-content: start;
          gap: 16px;
          min-width: 0;
        }

        .joker-card {
          min-width: 0;
          padding: 16px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.64);
          box-shadow: 0 14px 44px rgba(0, 0, 0, 0.20);
        }

        .joker-card-title {
          margin: 0 0 12px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-field-row {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr);
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(30, 41, 59, 0.85);
        }

        .joker-field-row:last-child {
          border-bottom: 0;
        }

        .joker-field-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .joker-field-value {
          min-width: 0;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.55;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .joker-mono {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 12px;
        }

        .joker-badge {
          display: inline-flex;
          max-width: 100%;
          align-items: center;
          padding: 4px 10px;
          border: 1px solid rgba(71, 85, 105, 0.7);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1.35;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .joker-badge--ok {
          color: #a7f3d0;
          border-color: rgba(16, 185, 129, 0.34);
          background: rgba(16, 185, 129, 0.11);
        }

        .joker-badge--warn {
          color: #fde68a;
          border-color: rgba(245, 158, 11, 0.34);
          background: rgba(245, 158, 11, 0.11);
        }

        .joker-badge--bad {
          color: #fecaca;
          border-color: rgba(239, 68, 68, 0.34);
          background: rgba(239, 68, 68, 0.11);
        }

        .joker-badge--neutral {
          color: #cbd5e1;
          border-color: rgba(71, 85, 105, 0.46);
          background: rgba(71, 85, 105, 0.11);
        }

        .joker-empty-files {
          padding: 16px;
          border: 1px dashed rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.35);
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .joker-files-box {
          padding: 14px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.64);
        }

        .joker-files-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .joker-files-head h2 {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-files-list {
          display: grid;
          gap: 8px;
        }

        .joker-file-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.85);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.20);
        }

        .joker-file-main {
          min-width: 0;
        }

        .joker-file-name {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-file-meta {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .joker-small-btn {
          padding: 6px 10px;
          font-size: 12px;
        }

        .joker-small-btn--danger:hover {
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.66);
          background: rgba(127, 29, 29, 0.26);
        }

        @media (max-width: 1440px) {
          .joker-mini-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1280px) {
          .joker-mini-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1120px) {
          .joker-shell {
            grid-template-columns: 1fr;
          }

          .joker-main-panel {
            min-height: auto;
          }

          .joker-sidebar {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .joker-shell {
            padding: 12px;
            gap: 12px;
          }

          .joker-header,
          .joker-chat-scroll,
          .joker-submit {
            padding: 16px;
          }

          .joker-main-panel {
            border-radius: 20px;
          }

          .joker-mini-grid {
            grid-template-columns: 1fr;
          }

          .joker-sidebar {
            grid-template-columns: 1fr;
          }

          .joker-form-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .joker-left-actions,
          .joker-send-btn {
            width: 100%;
          }

          .joker-action-btn,
          .joker-send-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="joker-shell">
        <section className="joker-main-panel">
          <header className="joker-header">
            <div className="joker-header-grid">
              <div>
                <div className="joker-kicker">AI JOKER-C2 · EVT-0015-AI</div>
                <h1 className="joker-title">OpenAI-powered IPR Runtime Demonstrator</h1>
                <p className="joker-lead">
                  Chat operativa con OpenAI come motore cognitivo e HBCE/JOKER-C2 come runtime governato.
                  Ogni risposta può esporre modello attivo, identità IPR, EVT, memoria EVT/IPR-bound, proof receipt OPC,
                  engine hash, governance HBCE/MATRIX, audit, verifica, fail-closed, HBCE ECOSISTEMA AI e salvaguardie U.S.E. quando pertinenti.
                </p>
              </div>

              <div className="joker-session-box">
                <div className="joker-session-label">Session ID</div>
                <div className="joker-session-id">{sessionId || "initializing"}</div>
              </div>
            </div>
          </header>

          <div className="joker-chat-scroll">
            {messages.length === 0 ? (
              <div className="joker-empty">
                <div className="joker-empty-inner">
                  <div className="joker-empty-kicker">JOKER-C2 online · UP-MESE-4</div>
                  <p className="joker-empty-title">
                    Nuova sessione inizializzata. Invia una richiesta operativa.
                  </p>
                  <div className="joker-samples">
                    {[
                      "diagnostica runtime OpenAI completa",
                      "joker cosa è IPR?",
                      "che differenza c’è tra IPR, EVT e OPC?",
                      "spiegami i sette moduli HBCE",
                      "spiegami HBCE ECOSISTEMA AI",
                      "quali sono i tre documenti dottrinali strategici?",
                      "spiegami U.S.E. e voto digitale federato"
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => void sendMessage(sample)}
                        className="joker-sample-btn"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="joker-message-list">
                {messages.map((item) => (
                  <MessageBubble key={item.id} message={item} />
                ))}

                {isSending ? (
                  <div className="joker-message joker-message--assistant">
                    AI JOKER-C2 sta generando risposta con motore OpenAI, EVT, memoria EVT/IPR, classificazione dominio,
                    classificazione modulo HBCE, dottrina strategica e OPC proof receipt con engine metadata nativo.
                  </div>
                ) : null}

                <div ref={scrollRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="joker-submit">
            {runtimeError ? <div className="joker-error">{runtimeError}</div> : null}

            <div className="joker-form-grid">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Invia una richiesta operativa..."
                rows={4}
                className="joker-input"
              />

              <div className="joker-form-actions">
                <div className="joker-left-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    style={{ display: "none" }}
                    onChange={(event) => void handleFileChange(event.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="joker-action-btn"
                  >
                    Add files
                  </button>

                  <button
                    type="button"
                    onClick={newSession}
                    className="joker-action-btn joker-action-btn--warn"
                  >
                    New session
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSending || (!message.trim() && files.length === 0)}
                  className="joker-send-btn"
                >
                  {isSending ? "Running..." : "Send"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="joker-sidebar">
          <RuntimeCard title="OpenAI Cognitive Engine">
            <FieldRow label="Provider" value={runtimeSummary.engine.provider} badge />
            <FieldRow label="Model" value={runtimeSummary.engine.modelUsed} mono />
            <FieldRow label="Standard" value={runtimeSummary.engine.standardModel} mono />
            <FieldRow label="Deep" value={runtimeSummary.engine.deepModel} mono />
            <FieldRow label="Mode" value={runtimeSummary.engine.mode} badge />
            <FieldRow label="API" value={runtimeSummary.engine.apiMode} mono />
            <FieldRow label="Configured" value={runtimeSummary.engine.configured} badge />
            <FieldRow label="Role" value={runtimeSummary.engine.role} />
            <FieldRow label="Runtime" value={runtimeSummary.engine.runtimeRole} />
            <FieldRow label="Birth" value={runtimeSummary.engine.projectBirthDate} mono />
          </RuntimeCard>

          <RuntimeCard title="OPC Engine Binding">
            <FieldRow label="Provider" value={runtimeSummary.opcEngine.provider} badge />
            <FieldRow label="Model" value={runtimeSummary.opcModelUsed} mono />
            <FieldRow label="Mode" value={runtimeSummary.opcEngine.mode} badge />
            <FieldRow label="API" value={runtimeSummary.opcEngine.apiMode} mono />
            <FieldRow label="EngineHash" value={runtimeSummary.opcEngineHash} mono />
            <FieldRow label="Chain" value={runtimeSummary.opcChainHash} mono />
            <FieldRow label="Role" value={runtimeSummary.opcEngine.role} />
            <FieldRow label="Runtime" value={runtimeSummary.opcEngine.runtimeRole} />
          </RuntimeCard>

          <RuntimeCard title="Execution Context">
            <FieldRow label="Node" value={DEFAULT_NODE} mono />
            <FieldRow label="Session" value={sessionId || "-"} mono />
            <FieldRow label="State" value={runtimeSummary.state} badge />
            <FieldRow label="Decision" value={runtimeSummary.decision} badge />
            <FieldRow label="GovDec" value={runtimeSummary.governanceDecision} badge />
            <FieldRow label="Domain" value={runtimeSummary.projectDomain} />
            <FieldRow label="Domains" value={formatList(runtimeSummary.activeDomains)} />
            <FieldRow label="DType" value={runtimeSummary.domainType} />
            <FieldRow label="Context" value={runtimeSummary.contextClass} />
            <FieldRow label="Intent" value={runtimeSummary.intentClass} />
            <FieldRow label="Family" value={runtimeSummary.documentFamily} />
          </RuntimeCard>

          <RuntimeCard title="Five Collections">
            <FieldRow label="Count" value={runtimeSummary.collections.length} />
            <FieldRow label="Active" value={formatList(runtimeSummary.collections)} />
          </RuntimeCard>

          <RuntimeCard title="Seven HBCE Modules">
            <FieldRow label="Count" value={runtimeSummary.modules.length} />
            <FieldRow label="Stack" value={formatList(runtimeSummary.modules)} />
          </RuntimeCard>

          <RuntimeCard title="Strategic Doctrine Layer">
            <FieldRow label="Count" value={runtimeSummary.strategicDoctrines.length} />
            <FieldRow label="Docs" value={formatList(runtimeSummary.strategicDoctrines)} />
          </RuntimeCard>

          <RuntimeCard title="HBCE Module">
            <FieldRow label="Module" value={runtimeSummary.hbceModule} badge />
            <FieldRow label="Type" value={runtimeSummary.moduleType} />
            <FieldRow label="Active" value={formatList(runtimeSummary.activeModules)} />
            <FieldRow
              label="Confidence"
              value={
                typeof runtimeSummary.moduleConfidence === "number"
                  ? runtimeSummary.moduleConfidence
                  : "-"
              }
            />
          </RuntimeCard>

          <RuntimeCard title="IPR Runtime">
            <FieldRow label="Entity" value={runtimeSummary.identity.entity} mono />
            <FieldRow label="IPR" value={runtimeSummary.identity.ipr} mono />
            <FieldRow label="Role" value={runtimeSummary.identity.runtimeRole} />
            <FieldRow label="EVT" value={runtimeSummary.identity.evt} mono />
            <FieldRow label="Cycle" value={runtimeSummary.identity.cycle} mono />
            <FieldRow label="Core" value={runtimeSummary.identity.core} mono />
            <FieldRow label="Birth" value={runtimeSummary.identity.projectBirthDate} mono />
          </RuntimeCard>

          <RuntimeCard title="OPC Proof Receipt">
            <FieldRow label="Proof" value={runtimeSummary.opc.proofId} mono />
            <FieldRow label="Chain" value={runtimeSummary.opc.chainHash} mono />
            <FieldRow label="Model" value={runtimeSummary.opcModelUsed} mono />
            <FieldRow label="EHash" value={runtimeSummary.opcEngineHash} mono />
            <FieldRow label="Module" value={runtimeSummary.opc.hbceModule || runtimeSummary.hbceModule} />
            <FieldRow label="Memory" value={runtimeSummary.opc.memoryHash} mono />
            <FieldRow label="Audit" value={runtimeSummary.opcAuditStatus} badge />
            <FieldRow label="Verify" value={runtimeSummary.opcVerificationStatus} badge />
            <FieldRow label="Append" value={runtimeSummary.opcAppendStatus} badge />
            <FieldRow label="Legal" value={runtimeSummary.legalCertification} badge />
            <FieldRow label="Reason" value={runtimeSummary.opc.appendReason} />
          </RuntimeCard>

          <RuntimeCard title="EVT Chain">
            <FieldRow label="EVT" value={runtimeSummary.evt.evt} mono />
            <FieldRow label="Prev" value={runtimeSummary.evt.prev} mono />
            <FieldRow
              label="Public"
              value={runtimeSummary.evt.publicHash || runtimeSummary.evt.hash || "-"}
              mono
            />
            <FieldRow label="Full" value={runtimeSummary.evt.fullHash} mono />
          </RuntimeCard>

          <RuntimeCard title="Governed EVT">
            <FieldRow label="EVT" value={runtimeSummary.governedEvt.evt} mono />
            <FieldRow label="Prev" value={runtimeSummary.governedEvt.prev} mono />
            <FieldRow label="Project" value={runtimeSummary.governedEvt.project} />
            <FieldRow label="Domains" value={formatList(runtimeSummary.governedEvt.activeDomains)} />
            <FieldRow label="Hash" value={runtimeSummary.governedEvt.hash} mono />
            <FieldRow label="Append" value={runtimeSummary.governedEvt.appendStatus} badge />
          </RuntimeCard>

          <RuntimeCard title="EVT/IPR Memory">
            <FieldRow label="Used" value={runtimeSummary.memoryUsed} />
            <FieldRow label="Source" value={runtimeSummary.memorySource} />
            <FieldRow label="Event" value={lastRuntime?.memory?.event || "-"} mono />
            <FieldRow label="Hash" value={runtimeSummary.memoryHash} mono />
            <FieldRow label="Append" value={lastRuntime?.memory?.appendStatus || "-"} badge />
            <FieldRow label="Governed" value={lastRuntime?.memory?.governedEvt || "-"} mono />
          </RuntimeCard>

          <RuntimeCard title="Governance">
            <FieldRow label="Data" value={runtimeSummary.governance.dataClass} badge />
            <FieldRow label="Secret" value={runtimeSummary.governance.containsSecret} />
            <FieldRow label="Personal" value={runtimeSummary.governance.containsPersonalData} />
            <FieldRow label="Security" value={runtimeSummary.governance.containsSecuritySensitiveData} />
            <FieldRow label="Civic" value={runtimeSummary.governance.containsCivicSensitiveData} />
            <FieldRow label="Choice" value={runtimeSummary.governance.containsDemocraticChoiceData} />
            <FieldRow label="Policy" value={runtimeSummary.governance.policyStatus} badge />
            <FieldRow label="Outcome" value={runtimeSummary.governance.policyOutcome} badge />
            <FieldRow label="Risk" value={runtimeSummary.governance.riskClass} badge />
            <FieldRow label="Score" value={runtimeSummary.governance.riskScore ?? "-"} />
            <FieldRow label="Oversight" value={runtimeSummary.governance.oversight} badge />
            <FieldRow label="Role" value={runtimeSummary.governance.requiredRole} />
            <FieldRow label="FailClosed" value={runtimeSummary.governance.failClosed} />
          </RuntimeCard>

          <RuntimeCard title="Runtime Requirements">
            <FieldRow label="IPR" value={runtimeSummary.governance.iprBinding} />
            <FieldRow label="EVT" value={runtimeSummary.governance.evtRequired} />
            <FieldRow label="Memory" value={runtimeSummary.governance.memoryRequired} />
            <FieldRow label="OPC" value={runtimeSummary.governance.opcRequired} />
            <FieldRow label="Audit" value={runtimeSummary.governance.auditRequired} />
          </RuntimeCard>

          {runtimeSummary.governance.civicBoundary ? (
            <RuntimeCard title="U.S.E. Boundary">
              <FieldRow label="Rule" value={runtimeSummary.governance.civicBoundary || USE_DEMOCRATIC_BOUNDARY} />
            </RuntimeCard>
          ) : null}

          {runtimeSummary.governance.aiGovernanceBoundary ? (
            <RuntimeCard title="HBCE AI Boundary">
              <FieldRow label="Rule" value={runtimeSummary.governance.aiGovernanceBoundary || HBCE_AI_BOUNDARY} />
            </RuntimeCard>
          ) : null}

          {runtimeSummary.governance.aerospaceBoundary ? (
            <RuntimeCard title="Aerospace Boundary">
              <FieldRow label="Rule" value={runtimeSummary.governance.aerospaceBoundary} />
            </RuntimeCard>
          ) : null}

          <RuntimeCard title="Files">
            <FilesPanel files={files} onRemoveFile={removeFile} onClearFiles={clearFiles} />
          </RuntimeCard>

          <RuntimeCard title="Diagnostics">
            <FieldRow label="OpenAI" value={lastRuntime?.diagnostics?.openaiConfigured ?? runtimeSummary.engine.configured} />
            <FieldRow label="Provider" value={runtimeSummary.engine.provider || "-"} badge />
            <FieldRow label="Engine" value={runtimeSummary.engine.role || "-"} />
            <FieldRow label="Runtime" value={runtimeSummary.engine.runtimeRole || "-"} />
            <FieldRow label="API" value={runtimeSummary.engine.apiMode || "-"} mono />
            <FieldRow label="Mode" value={runtimeSummary.engine.mode || "-"} badge />
            <FieldRow label="Model" value={runtimeSummary.engine.modelUsed || "-"} mono />
            <FieldRow label="Standard" value={runtimeSummary.engine.standardModel || "-"} mono />
            <FieldRow label="Deep" value={runtimeSummary.engine.deepModel || "-"} mono />
            <FieldRow label="Birth" value={runtimeSummary.engine.projectBirthDate || "-"} mono />
            <FieldRow
              label="Degraded"
              value={lastRuntime?.diagnostics?.degradedReason || lastRuntime?.degradedReason || "none"}
            />
            <FieldRow label="MemAvail" value={lastRuntime?.diagnostics?.memoryAvailable} />
            <FieldRow label="MemInj" value={lastRuntime?.diagnostics?.memoryInjected} />
            <FieldRow label="Memory" value={lastRuntime?.diagnostics?.memoryAppendStatus || "-"} badge />
            <FieldRow label="OPC" value={lastRuntime?.diagnostics?.opcAppendStatus || runtimeSummary.opcAppendStatus} badge />
            <FieldRow label="OPCChain" value={lastRuntime?.diagnostics?.opcChainHash || runtimeSummary.opcChainHash} mono />
            <FieldRow label="OPCEHash" value={lastRuntime?.diagnostics?.opcEngineHash || runtimeSummary.opcEngineHash} mono />
            <FieldRow label="OPCModel" value={lastRuntime?.diagnostics?.opcModelUsed || runtimeSummary.opcModelUsed} mono />
            <FieldRow label="Verify" value={lastRuntime?.diagnostics?.opcVerificationStatus || runtimeSummary.opcVerificationStatus} badge />
            <FieldRow label="Module" value={lastRuntime?.diagnostics?.hbceModule || runtimeSummary.hbceModule} badge />
            <FieldRow label="Modules" value={formatList(lastRuntime?.diagnostics?.activeModules || runtimeSummary.activeModules)} />
            <FieldRow label="Doctrine" value={formatList(lastRuntime?.diagnostics?.strategicDoctrines || runtimeSummary.strategicDoctrines)} />
          </RuntimeCard>
        </aside>
      </div>
    </main>
  );
}

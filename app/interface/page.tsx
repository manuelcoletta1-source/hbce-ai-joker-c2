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


type RuntimeFileStatus =
  | "TEXT_READY"
  | "PDF_CLIENT_PAYLOAD_READY"
  | "PDF_INGESTION_READY"
  | "PDF_METADATA_ONLY"
  | "PDF_INGESTION_FAIL"
  | "REFERENCE_ONLY"
  | "REJECTED";


type RuntimeFileMode =
  | "TEXT"
  | "PDF_BINARY_PAYLOAD"
  | "PDF_TEXT"
  | "REFERENCE_ONLY"
  | "REJECTED";


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
  base64Length?: number;
  role: "context" | "reference_only";
  uploaded: boolean;
  status: RuntimeFileStatus;
  mode: RuntimeFileMode;
  textLength: number;
  reason: string;
  fileHash?: string;
  documentProfileId?: string | null;
  documentProfileStatus?: string | null;
  documentProfileHash?: string | null;
  documentProfileReason?: string | null;
};


type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  raw?: JsonRecord | null;
  temporalSeal?: DualTimeMessageSeal | null;
};


type RuntimeStatus = {
  model: string;
  modelLevel: string;
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
  databaseConfigured: string;
  databaseAvailable: string;
  openAI: string;
  saasTier: string;
  saasRelease: string;
  saasCoreStatus: string;
  auditId: string;
  auditStatus: string;
  auditPersistence: string;
  auditHash: string;
  modelUsageId: string;
  modelUsageStatus: string;
  modelUsagePersistence: string;
  accountingMode: string;
  estimatedCostUnits: string;
  estimatedCostMinor: string;
  totalTokens: string;
  inputTokens: string;
  outputTokens: string;
  usageHash: string;
  utcResponseTime: string;
  temporalCertificateStatus: string;
  temporalProof: string;
  runtimeBirth: string;
  runtimeBirthUtc: string;
  runtimeAge: string;
  runtimeLifeSeconds: string;
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  accountId: string;
  threadId: string;
  saasSource: string;
  memoryId: string;
  memoryHash: string;
  memoryKeyHash: string;
  registeredEventId: string;
  registeredEventName: string;
  registeredEventHash: string;
  previousEvt: string;
  previousOpc: string;
  b2gReadiness: string;
};


type PublicSemanticMemoryActivatedTerm = {
  n: string;
  term: string;
  score: string;
  matchedSignals: string[];
};


type PublicSemanticMemorySnapshot = {
  available: boolean;
  enabled: string;
  type: string;
  formula: string;
  definition: string;
  persistable: string;
  memoryId: string;
  quality: string;
  continuityGain: string;
  thresholdDetected: string;
  couplingState: string;
  activatedTerms: PublicSemanticMemoryActivatedTerm[];
  topTerms: string[];
  primaryAxis: {
    decision: string;
    cost: string;
    trace: string;
    time: string;
  };
  policy: {
    saveRaw: string;
    saveSynthesis: string;
    reusableInPrompt: string;
  };
  source: {
    evtId: string;
    opcId: string;
    timestamp: string;
  };
  ipr: {
    humanIpr: string;
    runtimeIpr: string;
    identityBinding: string;
  };
  runtime: {
    access: string;
    matrix: string;
    memory: string;
    persistenceMode: string;
    persistenceStatus: string;
    tenantId: string;
    workspaceId: string;
    legalCertification: string;
  };
  boundary: {
    legalCertification: string;
    technicalProofOnly: string;
  };
};


type PublicRuntimeFileSnapshot = {
  id: string;
  name: string;
  mimeType: string;
  status: string;
  mode: string;
  textLength: string;
  fileHash: string;
  reason: string;
  documentProfileId: string;
  documentProfileStatus: string;
  documentProfileHash: string;
  documentProfileReason: string;
};


type PublicFileIngestionSnapshot = {
  available: boolean;
  status: string;
  promptReadyCount: string;
  textReadyCount: string;
  pdfReadyCount: string;
  pdfMetadataOnlyCount: string;
  pdfIngestionFailCount: string;
  referenceOnlyCount: string;
  rejectedCount: string;
  totalTextLength: string;
  legalCertification: string;
  opc: string;
  files: PublicRuntimeFileSnapshot[];
};


type PublicDocumentProfileSnapshot = {
  profileId: string;
  profileKeyHash: string;
  fileId: string;
  filename: string;
  fileHash: string;
  textStatus: string;
  textLength: string;
  mimeType: string;
  docFamily: string;
  volume: string;
  title: string;
  canonicalAxis: string;
  summary: string;
  keyTerms: string[];
  semanticTerms: string[];
  memoryId: string;
  sourceSavedChatId: string;
  lastEvtId: string;
  lastOpcProofId: string;
  profileStatus: string;
  quality: string;
  reusableInPrompt: string;
  profileHash: string;
  canonicalDocumentKind: string;
  glossaryGuardApplied: string;
  auditId: string;
  usageId: string;
  legalCertification: string;
  source: string;
  persistenceStatus: string;
  error: string;
};


type PublicDocumentRegistrySnapshot = {
  available: boolean;
  source: string;
  status: string;
  table: string;
  attempted: string;
  persistedCount: string;
  failedCount: string;
  rowCount: string;
  profileCount: string;
  reusableCount: string;
  linkedMemoryCount: string;
  legalCertification: string;
  opc: string;
  profiles: PublicDocumentProfileSnapshot[];
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


type IprMemoryDashboardState = {
  recentThreads: JsonRecord[];
  memorySaves: JsonRecord[];
  memoryRecords: JsonRecord[];
  registeredEvents: JsonRecord[];
  recallItems: JsonRecord[];
  promptMemoryBlock: string;
  lastRefreshUtc: string;
};


const EMPTY_IPR_MEMORY_DASHBOARD: IprMemoryDashboardState = {
  recentThreads: [],
  memorySaves: [],
  memoryRecords: [],
  registeredEvents: [],
  recallItems: [],
  promptMemoryBlock: "",
  lastRefreshUtc: ""
};


type CyberneticMemoryChainState = {
  memoryId: string;
  savedChatId: string;
  evtId: string;
  opcId: string;
  auditId: string;
  usageId: string;
  status: string;
  promptEligible: string;
  reusableInPrompt: string;
  source: string;
  recordStatus: string;
  documentRegistryStatus: string;
  linkedProfileCount: string;
  updatedAt: string;
};


const EMPTY_CYBERNETIC_MEMORY_CHAIN: CyberneticMemoryChainState = {
  memoryId: "-",
  savedChatId: "-",
  evtId: "-",
  opcId: "-",
  auditId: "-",
  usageId: "-",
  status: "NOT_READY",
  promptEligible: "false",
  reusableInPrompt: "false",
  source: "NONE",
  recordStatus: "NOT_CHECKED",
  documentRegistryStatus: "NOT_CHECKED",
  linkedProfileCount: "0",
  updatedAt: "-"
};


const JOKER_SIGIL = "🜏";
const INTERFACE_REVISION = "HBCE-JOKER-C2-INTERFACE-CYBERNETIC-MEMORY-CHAIN-v1.10-RECORDS_PAYLOAD_DOCUMENT_REGISTRY_BRIDGE";


type JokerTemporalRuntimeSnapshot = {
  utcResponseTime: string;
  utcClock: string;
  birthAnchorLocal: string;
  birthAnchorTimezone: string;
  birthAnchorUtc: string;
  lifeHuman: string;
  lifeSeconds: string;
  certificateStatus: string;
};


type DualTimeMessageSeal = {
  status: "FROZEN_DUAL_TIME_SEAL";
  role: "MANUEL" | "JOKER_C2" | "SYSTEM";
  utcSnapshot: string;
  cyberneticLifetimeSnapshot: string;
  lifeSecondsSnapshot: string;
  birthAnchorLocale: string;
  birthUtc: string;
  evtId: string;
  opcId: string;
  auditId: string;
  usageId: string;
  persistence: string;
  temporalProof: string;
  dualTimeHash: string;
  legalCertification: false;
};


const JOKER_C2_BIRTH_ANCHOR_LOCAL = "2026-01-19T15:30:00+01:00";
const JOKER_C2_BIRTH_ANCHOR_TIMEZONE = "Europe/Rome";
const JOKER_C2_BIRTH_ANCHOR_UTC = "2026-01-19T14:30:00.000Z";
const JOKER_C2_BIRTH_ANCHOR_UTC_MS = Date.parse(JOKER_C2_BIRTH_ANCHOR_UTC);


const JOKER_C2_OPERATIONAL_NODE_LABEL = "Torino / Italia / Europa";
const JOKER_C2_OPERATIONAL_NODE_TIMEZONE = "UTC+2";
const JOKER_C2_OPERATIONAL_NODE_CLOCK_LABEL = `${JOKER_C2_OPERATIONAL_NODE_LABEL} · ${JOKER_C2_OPERATIONAL_NODE_TIMEZONE}`;


const CANONICAL_MANUEL_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const CANONICAL_MANUEL_DISPLAY_NAME = "Manuel Coletta";


const HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED = true;
const HBCE_SELF_PILOT_TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const HBCE_SELF_PILOT_WORKSPACE_ID = "HBCE-WORKSPACE-RND";
const HBCE_SELF_PILOT_SUBSCRIPTION_ID = "HBCE-SUBSCRIPTION-SELF-PILOT";
const HBCE_SELF_PILOT_ACCOUNT_ID = "HBCE-ACCOUNT-SELF-PILOT";
const HBCE_SELF_PILOT_CERTIFICATE_ID = "HBCE-SELF-PILOT-CERTIFICATE";
const HBCE_SELF_PILOT_CERTIFICATE_STATUS = "ACTIVE";
const HBCE_SELF_PILOT_SCOPE = "JOKER_C2_ACCESS_SELF_PILOT";
const HBCE_SELF_PILOT_ACCESS_DECISION = "ACCESS_GRANTED_SELF_PILOT_SCOPE_BRIDGE";
const HBCE_SELF_PILOT_IDENTITY_BINDING = "IPR_VERIFIED_BIOLOGICAL_SUBJECT";
const HBCE_SELF_PILOT_MATRIX_STATE = "MATRIX_ACTIVE_SELF_PILOT_SCOPE_BRIDGE";
const HBCE_SELF_PILOT_MEMORY_SCOPE = "IPR_BOUND_SELF_PILOT_SCOPE_BRIDGE";
const HBCE_SELF_PILOT_MEMORY_AUTHORITY = "SELF_PILOT_MEMORY_SCOPE_BRIDGE";


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
  "JOKER-C2, esegui una diagnostica runtime completa. Dimmi modello OpenAI, Runtime IPR, Human IPR, birth anchor 2026-only, runtime age, MATRIX, memoria, EVT, OPC, audit, model usage, SaaS Core, tenant, workspace, subscription, account e legalCertification=false.";


const QUICK_PROMPTS = [
  "JOKER-C2, riconosci il mio IPR operativo e indica il birth anchor runtime attivo. Deve risultare solo 2026-01-19T15:30:00+01:00.",
  "mostrami la diagnostica runtime: IPR, MATRIX, memoria, database, EVT, OPC, audit, model usage e SaaS context",
  "registra un nuovo evento operativo denominato TEST_SAAS_B2G_UI_001, collegandolo a Human IPR, tenant, workspace, subscription, account, memory ID, EVT, OPC, audit ID e usage ID.",
  "richiama dalla memoria persistente l’evento TEST_SAAS_B2G_UI_001 e verifica stesso Human IPR, tenant, workspace, subscription, account e memory ID.",
  "dammi il verdetto finale SaaS B2G: READY, PARTIAL_READY o NOT_READY, valutando solo IPR, memoria, EVT, OPC, audit, usage, tenant/workspace/subscription/account e birth anchor 2026-only."
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


function utcMonthDays(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}


function calculateJokerLifetimeParts(now: Date): {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const birth = new Date(JOKER_C2_BIRTH_ANCHOR_UTC);


  if (!Number.isFinite(birth.getTime()) || now.getTime() <= birth.getTime()) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }


  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  let months = now.getUTCMonth() - birth.getUTCMonth();
  let days = now.getUTCDate() - birth.getUTCDate();
  let hours = now.getUTCHours() - birth.getUTCHours();
  let minutes = now.getUTCMinutes() - birth.getUTCMinutes();
  let seconds = now.getUTCSeconds() - birth.getUTCSeconds();


  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }


  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }


  if (hours < 0) {
    hours += 24;
    days -= 1;
  }


  if (days < 0) {
    months -= 1;
    const previousMonthIndex = (now.getUTCMonth() + 11) % 12;
    const previousMonthYear = previousMonthIndex === 11
      ? now.getUTCFullYear() - 1
      : now.getUTCFullYear();


    days += utcMonthDays(previousMonthYear, previousMonthIndex);
  }


  if (months < 0) {
    months += 12;
    years -= 1;
  }


  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds)
  };
}


function formatJokerLifetime(parts: ReturnType<typeof calculateJokerLifetimeParts>): string {
  return `${parts.years} years, ${parts.months} months, ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, ${parts.seconds} seconds`;
}


function buildJokerTemporalRuntimeSnapshot(now = new Date()): JokerTemporalRuntimeSnapshot {
  const safeNow = Number.isFinite(now.getTime()) ? now : new Date();
  const lifeSeconds = Math.max(
    0,
    Math.floor((safeNow.getTime() - JOKER_C2_BIRTH_ANCHOR_UTC_MS) / 1000)
  );


  return {
    utcResponseTime: safeNow.toISOString(),
    utcClock: formatUtcPlusTwoTemporalSnapshot(safeNow.toISOString()),
    birthAnchorLocal: `${JOKER_C2_BIRTH_ANCHOR_LOCAL} ${JOKER_C2_BIRTH_ANCHOR_TIMEZONE}`,
    birthAnchorTimezone: JOKER_C2_BIRTH_ANCHOR_TIMEZONE,
    birthAnchorUtc: JOKER_C2_BIRTH_ANCHOR_UTC,
    lifeHuman: formatJokerLifetime(calculateJokerLifetimeParts(safeNow)),
    lifeSeconds: String(lifeSeconds),
    certificateStatus: "ACTIVE_TEMPORAL_RUNTIME_CERTIFICATE"
  };
}


function toFrozenUtcSnapshot(value: string, fallbackNow?: Date): string {
  const visible = normalizeVisibleText(value || "");
  const fallbackSnapshot = buildJokerTemporalRuntimeSnapshot(fallbackNow ?? new Date());


  if (!visible || isBlankRuntimeValue(visible)) return fallbackSnapshot.utcResponseTime;


  const parsed = Date.parse(visible);


  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }


  return visible;
}


function buildFrozenTemporalSnapshotFromUtc(value: string, fallbackNow?: Date): JokerTemporalRuntimeSnapshot {
  const fallbackDate = fallbackNow ?? new Date();
  const frozenUtc = toFrozenUtcSnapshot(value, fallbackDate);
  const parsed = Date.parse(frozenUtc);


  if (Number.isFinite(parsed)) {
    return buildJokerTemporalRuntimeSnapshot(new Date(parsed));
  }


  return buildJokerTemporalRuntimeSnapshot(fallbackDate);
}


function deriveUtcSnapshotFromOperationalId(value: string): string {
  const visible = normalizeVisibleText(value || "");
  const match = visible.match(/(?:EVT|OPC|AUDIT|USAGE)[-_](20\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/i);


  if (!match) return "";


  const [, year, month, day, hour, minute, second] = match;
  const candidate = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  const parsed = Date.parse(candidate);


  if (!Number.isFinite(parsed)) return "";


  return new Date(parsed).toISOString();
}


function getCanonicalAssistantEventUtcSnapshot(runtimeStatus: RuntimeStatus | null): string {
  if (!runtimeStatus) return "";


  return firstDisplayValue(
    [
      deriveUtcSnapshotFromOperationalId(runtimeStatus.responseEvt),
      deriveUtcSnapshotFromOperationalId(runtimeStatus.opc),
      deriveUtcSnapshotFromOperationalId(runtimeStatus.auditId),
      deriveUtcSnapshotFromOperationalId(runtimeStatus.modelUsageId)
    ],
    ""
  );
}




function getPayloadDualTimeSealValue(
  payload: JsonRecord | null | undefined,
  role: ChatMessage["role"],
  field: string,
  fallback = ""
): string {
  if (!payload) return fallback;


  const responsePaths = [
    ["temporalSeals", "response", field],
    ["responseTemporalSeal", field],
    ["assistantTemporalSeal", field],
    ["temporalSeal", field]
  ];


  const requestPaths = [
    ["temporalSeals", "request", field],
    ["requestTemporalSeal", field],
    ["userTemporalSeal", field]
  ];


  const systemPaths = [
    ["temporalSeals", "system", field],
    ["systemTemporalSeal", field]
  ];


  const rolePaths = role === "assistant" ? responsePaths : role === "system" ? systemPaths : requestPaths;
  const commonPaths = [
    ["temporal", field],
    ["runtime", "temporal", field],
    ["temporalCertificate", field]
  ];


  return first(payload, [...rolePaths, ...commonPaths], fallback);
}


function buildDualTimeHash(input: {
  role: DualTimeMessageSeal["role"];
  messageId: string;
  utcSnapshot: string;
  lifeSecondsSnapshot: string;
  evtId: string;
  opcId: string;
  auditId: string;
  usageId: string;
}): string {
  const source = [
    input.role,
    input.messageId,
    input.utcSnapshot,
    input.lifeSecondsSnapshot,
    JOKER_C2_BIRTH_ANCHOR_LOCAL,
    JOKER_C2_BIRTH_ANCHOR_UTC,
    input.evtId,
    input.opcId,
    input.auditId,
    input.usageId,
    "legalCertification=false"
  ].join("|");


  let hash = 0x811c9dc5;


  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }


  return `dual-time:${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}


function buildDualTimeMessageSeal(input: {
  role: ChatMessage["role"];
  messageId: string;
  now?: Date;
  payload?: JsonRecord | null;
}): DualTimeMessageSeal {
  const fallbackNow = input.now ?? new Date();
  const fallbackSnapshot = buildJokerTemporalRuntimeSnapshot(fallbackNow);
  const runtimeStatus = input.payload ? getRuntimeStatus(input.payload) : null;
  const role = input.role === "assistant" ? "JOKER_C2" : input.role === "system" ? "SYSTEM" : "MANUEL";


  const assistantEventUtcSnapshot = input.role === "assistant"
    ? getCanonicalAssistantEventUtcSnapshot(runtimeStatus)
    : "";
  const payloadUtcSnapshot = firstDisplayValue(
    [
      assistantEventUtcSnapshot,
      getPayloadDualTimeSealValue(input.payload, input.role, "utcSnapshot"),
      getPayloadDualTimeSealValue(input.payload, input.role, "utcResponseTime"),
      getPayloadDualTimeSealValue(input.payload, input.role, "utcClock"),
      runtimeStatus?.utcResponseTime || "",
      fallbackSnapshot.utcResponseTime
    ],
    fallbackSnapshot.utcResponseTime
  );
  const utcSnapshot = toFrozenUtcSnapshot(payloadUtcSnapshot, fallbackNow);
  const canonicalTemporalSnapshot = buildFrozenTemporalSnapshotFromUtc(utcSnapshot, fallbackNow);


  const cyberneticLifetimeSnapshot = canonicalTemporalSnapshot.lifeHuman;
  const lifeSecondsSnapshot = canonicalTemporalSnapshot.lifeSeconds;
  const evtId = firstDisplayValue(
    [getPayloadDualTimeSealValue(input.payload, input.role, "evtId"), runtimeStatus?.responseEvt || ""],
    "-"
  );
  const opcId = firstDisplayValue(
    [getPayloadDualTimeSealValue(input.payload, input.role, "opcId"), runtimeStatus?.opc || ""],
    "-"
  );
  const auditId = firstDisplayValue(
    [getPayloadDualTimeSealValue(input.payload, input.role, "auditId"), runtimeStatus?.auditId || ""],
    "-"
  );
  const usageId = firstDisplayValue(
    [getPayloadDualTimeSealValue(input.payload, input.role, "usageId"), runtimeStatus?.modelUsageId || ""],
    "-"
  );
  const payloadPersistence = getPayloadDualTimeSealValue(input.payload, input.role, "persistence");
  const persistence = firstDisplayValue(
    [
      payloadPersistence,
      runtimeStatus
        ? `EVT=${runtimeStatus.responseEvt && runtimeStatus.responseEvt !== "-" ? "PERSISTED" : runtimeStatus.persistence} · OPC=${runtimeStatus.opc && runtimeStatus.opc !== "-" ? runtimeStatus.auditPersistence || "PERSISTED" : "-"}`
        : ""
    ],
    "FROZEN_CLIENT_SIDE"
  );
  const temporalProof = firstDisplayValue(
    [
      getPayloadDualTimeSealValue(input.payload, input.role, "temporalProof"),
      runtimeStatus?.temporalProof || ""
    ],
    "TORINO_ITALIA_EUROPA_UTC_PLUS_TWO_PLUS_CYBER_LIFE_FROZEN_SEAL"
  );


  return {
    status: "FROZEN_DUAL_TIME_SEAL",
    role,
    utcSnapshot,
    cyberneticLifetimeSnapshot,
    lifeSecondsSnapshot,
    birthAnchorLocale: `${JOKER_C2_BIRTH_ANCHOR_LOCAL} ${JOKER_C2_BIRTH_ANCHOR_TIMEZONE}`,
    birthUtc: JOKER_C2_BIRTH_ANCHOR_UTC,
    evtId,
    opcId,
    auditId,
    usageId,
    persistence,
    temporalProof,
    dualTimeHash: buildDualTimeHash({
      role,
      messageId: input.messageId,
      utcSnapshot,
      lifeSecondsSnapshot,
      evtId,
      opcId,
      auditId,
      usageId
    }),
    legalCertification: false
  };
}


function stripInlineTemporalRuntimeCertificate(value: string): string {
  const normalized = normalizeVisibleText(value);
  const marker = "JOKER-C2 Temporal Runtime Certificate";
  const markerIndex = normalized.lastIndexOf(marker);


  if (markerIndex < 0) {
    return normalized;
  }


  if (markerIndex === 0) {
    return "Dual-Time Seal rendered outside the response body.";
  }


  const before = normalized.slice(0, markerIndex).trim();


  return before || "Dual-Time Seal rendered outside the response body.";
}


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


function firstRecord(value: unknown, paths: string[][]): JsonRecord | null {
  for (const path of paths) {
    const candidate = getPath(value, path);


    if (isRecord(candidate)) {
      return candidate;
    }
  }


  return null;
}


function firstArray(value: unknown, paths: string[][]): unknown[] {
  for (const path of paths) {
    const candidate = getPath(value, path);


    if (Array.isArray(candidate)) {
      return candidate;
    }
  }


  return [];
}


function booleanLike(value: unknown, fallback = "-"): string {
  if (typeof value === "boolean") {
    return String(value);
  }


  if (typeof value === "number") {
    return value === 0 ? "false" : "true";
  }


  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toLowerCase();


    if (["true", "false"].includes(normalized)) {
      return normalized;
    }


    return normalizeVisibleText(value.trim());
  }


  return fallback;
}


function flattenTopTerms(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }


  return value
    .map((item) => {
      if (typeof item === "string") return normalizeVisibleText(item);
      if (isRecord(item)) return text(item.term, "");
      return "";
    })
    .filter(Boolean)
    .slice(0, 12);
}


function normalizeSemanticActivatedTerms(value: unknown[]): PublicSemanticMemoryActivatedTerm[] {
  return value
    .filter(isRecord)
    .map((term) => ({
      n: text(term.n, "-"),
      term: text(term.term, "-"),
      score: text(term.score, "-"),
      matchedSignals: Array.isArray(term.matchedSignals)
        ? term.matchedSignals.map((signal) => text(signal, "")).filter(Boolean).slice(0, 8)
        : []
    }))
    .filter((term) => term.term !== "-")
    .slice(0, 12);
}


function isSemanticMemoryLike(record: JsonRecord | null): record is JsonRecord {
  if (!record) return false;


  return Boolean(
    text(record.memoryId, "") ||
      text(record.quality, "") ||
      text(record.continuityGain, "") ||
      text(record.couplingState, "") ||
      isRecord(record.semantic) ||
      isRecord(record.corpus) ||
      isRecord(record.alienCode) ||
      isRecord(record.rascensional) ||
      isRecord(record.policy)
  );
}


function getPublicSemanticMemorySnapshot(
  payload: JsonRecord | null | undefined
): PublicSemanticMemorySnapshot {
  const source = payload ?? {};
  const candidateRecords = [
    firstRecord(source, [["semanticMemoryPublic"]]),
    firstRecord(source, [["saas", "semanticMemory"]]),
    firstRecord(source, [["diagnostics", "semanticMemory"]]),
    firstRecord(source, [["esoterologicalSemanticMemory"]]),
    firstRecord(source, [["esoterologicalSemanticMemoryRecord"]]),
    firstRecord(source, [["semanticMemory"]])
  ];


  const record = candidateRecords.find(isSemanticMemoryLike) ?? null;
  const available = Boolean(record);


  const activatedTerms = normalizeSemanticActivatedTerms(
    firstArray(record, [["activatedTerms"], ["corpus", "activatedTerms"]])
  );
  const publicTopTerms = flattenTopTerms(getPath(record, ["topTerms"]));
  const topTerms = publicTopTerms.length
    ? publicTopTerms
    : activatedTerms.map((term) => `${term.n} | ${term.term}`).slice(0, 8);


  return {
    available,
    enabled: booleanLike(getPath(record, ["enabled"]), available ? "true" : "false"),
    type: first(record, [["type"]], available ? "MEMORIA_SEMANTICA_ESOTEROLOGICA_API_CHAT" : "NOT_AVAILABLE"),
    formula: first(record, [["formula"]], "-"),
    definition: first(record, [["definition"]], "-"),
    persistable: booleanLike(getPath(record, ["persistable"]), "-"),
    memoryId: first(record, [["memoryId"]], "-"),
    quality: first(record, [["quality"], ["semantic", "quality"]], "-"),
    continuityGain: first(record, [["continuityGain"], ["rascensional", "continuityGain"]], "-"),
    thresholdDetected: booleanLike(
      getPath(record, ["thresholdDetected"]) ?? getPath(record, ["rascensional", "thresholdDetected"]),
      "-"
    ),
    couplingState: first(record, [["couplingState"], ["alienCode", "couplingState"]], "-"),
    activatedTerms,
    topTerms,
    primaryAxis: {
      decision: first(record, [["primaryAxis", "decision"], ["corpus", "primaryAxis", "decision"]], "-"),
      cost: first(record, [["primaryAxis", "cost"], ["corpus", "primaryAxis", "cost"]], "-"),
      trace: first(record, [["primaryAxis", "trace"], ["corpus", "primaryAxis", "trace"]], "-"),
      time: first(record, [["primaryAxis", "time"], ["corpus", "primaryAxis", "time"]], "-")
    },
    policy: {
      saveRaw: booleanLike(getPath(record, ["policy", "saveRaw"]), "-"),
      saveSynthesis: booleanLike(getPath(record, ["policy", "saveSynthesis"]), "-"),
      reusableInPrompt: booleanLike(getPath(record, ["policy", "reusableInPrompt"]), "-")
    },
    source: {
      evtId: first(record, [["source", "evtId"], ["evtId"]], "-"),
      opcId: first(record, [["source", "opcId"], ["opcId"]], "-"),
      timestamp: first(record, [["source", "timestamp"], ["timestamp"]], "-")
    },
    ipr: {
      humanIpr: first(record, [["ipr", "humanIpr"], ["humanIpr"]], "-"),
      runtimeIpr: first(record, [["ipr", "runtimeIpr"], ["runtimeIpr"]], "-"),
      identityBinding: first(record, [["ipr", "identityBinding"], ["identityBinding"]], "-")
    },
    runtime: {
      access: first(record, [["runtime", "access"]], "-"),
      matrix: first(record, [["runtime", "matrix"]], "-"),
      memory: first(record, [["runtime", "memory"]], "-"),
      persistenceMode: first(record, [["runtime", "persistenceMode"]], "-"),
      persistenceStatus: first(record, [["runtime", "persistenceStatus"]], "-"),
      tenantId: first(record, [["runtime", "tenantId"]], "-"),
      workspaceId: first(record, [["runtime", "workspaceId"]], "-"),
      legalCertification: first(record, [["runtime", "legalCertification"], ["boundary", "legalCertification"]], "false")
    },
    boundary: {
      legalCertification: first(record, [["boundary", "legalCertification"], ["runtime", "legalCertification"]], "false"),
      technicalProofOnly: first(record, [["boundary", "technicalProofOnly"]], "true")
    }
  };
}


function normalizePublicRuntimeFileStatus(value: unknown): string {
  const normalized = text(value, "").trim().toUpperCase();


  if (!normalized) {
    return "NOT_AVAILABLE";
  }


  if (normalized === "PDF_CLIENT_PAYLOAD_READY") {
    return "PDF_CLIENT_PAYLOAD_READY";
  }


  if (
    normalized === "TEXT_READY" ||
    normalized === "PDF_INGESTION_READY" ||
    normalized === "PDF_METADATA_ONLY" ||
    normalized === "PDF_INGESTION_FAIL" ||
    normalized === "REFERENCE_ONLY" ||
    normalized === "REJECTED"
  ) {
    return normalized;
  }


  return normalized;
}


function normalizePublicRuntimeFileSnapshot(record: JsonRecord): PublicRuntimeFileSnapshot {
  return {
    id: first(record, [["id"], ["fileId"]], "-"),
    name: first(record, [["name"], ["fileName"]], "runtime-file"),
    mimeType: first(record, [["mimeType"], ["type"]], "-"),
    status: normalizePublicRuntimeFileStatus(
      getPath(record, ["status"]) ?? getPath(record, ["fileStatus"]) ?? getPath(record, ["ingestionStatus"])
    ),
    mode: first(record, [["mode"], ["fileMode"]], "-"),
    textLength: first(record, [["textLength"], ["contentLength"], ["characters"]], "0"),
    fileHash: first(record, [["fileHash"], ["hash"], ["sha256"]], "-"),
    reason: first(record, [["reason"], ["message"], ["detail"]], "-"),
    documentProfileId: first(record, [["documentProfileId"], ["profileId"]], "-"),
    documentProfileStatus: first(record, [["documentProfileStatus"], ["profileStatus"]], "-"),
    documentProfileHash: first(record, [["documentProfileHash"], ["profileHash"]], "-"),
    documentProfileReason: first(record, [["documentProfileReason"], ["profileReason"]], "-")
  };
}


function isFileIngestionLike(record: JsonRecord | null): record is JsonRecord {
  if (!record) return false;


  return Boolean(
    text(record.status, "") ||
      text(record.promptReadyCount, "") ||
      text(getPath(record, ["summary", "promptReadyCount"]), "") ||
      Array.isArray(record.files)
  );
}


function getPublicFileIngestionSnapshot(
  payload: JsonRecord | null | undefined
): PublicFileIngestionSnapshot {
  const source = payload ?? {};
  const candidateRecords = [
    firstRecord(source, [["fileIngestion"]]),
    firstRecord(source, [["diagnostics", "fileIngestion"]]),
    firstRecord(source, [["runtime", "fileIngestion"]]),
    firstRecord(source, [["uploadedFiles"]])
  ];
  const record = candidateRecords.find(isFileIngestionLike) ?? null;
  const fileRecords = firstArray(record, [["files"], ["activeFiles"], ["runtimeFiles"]])
    .filter(isRecord)
    .map(normalizePublicRuntimeFileSnapshot)
    .slice(0, 12);
  const available = Boolean(record) || fileRecords.length > 0;


  return {
    available,
    status: first(
      record,
      [["status"], ["ingestionStatus"], ["summary", "status"]],
      available ? "FILE_INGESTION_READY" : "NOT_AVAILABLE"
    ),
    promptReadyCount: first(record, [["promptReadyCount"], ["summary", "promptReadyCount"]], "0"),
    textReadyCount: first(record, [["textReadyCount"], ["summary", "textReadyCount"]], "0"),
    pdfReadyCount: first(record, [["pdfReadyCount"], ["summary", "pdfReadyCount"]], "0"),
    pdfMetadataOnlyCount: first(record, [["pdfMetadataOnlyCount"], ["summary", "pdfMetadataOnlyCount"]], "0"),
    pdfIngestionFailCount: first(record, [["pdfIngestionFailCount"], ["summary", "pdfIngestionFailCount"]], "0"),
    referenceOnlyCount: first(record, [["referenceOnlyCount"], ["summary", "referenceOnlyCount"]], "0"),
    rejectedCount: first(record, [["rejectedCount"], ["summary", "rejectedCount"]], "0"),
    totalTextLength: first(record, [["totalTextLength"], ["summary", "totalTextLength"]], "0"),
    legalCertification: first(record, [["legalCertification"], ["summary", "legalCertification"]], "false"),
    opc: first(record, [["opc"], ["summary", "opc"]], "technical proof receipt only"),
    files: fileRecords
  };
}


function normalizeDocumentProfileTerms(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }


  return Array.from(
    new Set(
      value.flatMap((item) => {
        if (typeof item === "string" && item.trim()) {
          return [item.trim()];
        }


        if (isRecord(item)) {
          return [
            first(item, [["term"], ["name"], ["label"], ["value"]], "")
          ].filter((term) => term && term !== "-");
        }


        return [];
      })
    )
  ).slice(0, 16);
}


function unwrapDocumentProfileRecord(record: JsonRecord): JsonRecord {
  const nested = firstRecord(record, [["profile"], ["documentProfile"]]);


  return nested ?? record;
}


function normalizePublicDocumentProfileSnapshot(record: JsonRecord): PublicDocumentProfileSnapshot {
  const profile = unwrapDocumentProfileRecord(record);
  const input = firstRecord(record, [["input"]]);
  const metadata = firstRecord(profile, [["documentMetadata"], ["metadata"]]) ?? firstRecord(record, [["documentMetadata"], ["metadata"]]);


  return {
    profileId: first(profile, [["profileId"], ["id"], ["documentProfileId"]], first(record, [["profileId"], ["documentProfileId"]], "-")),
    profileKeyHash: first(profile, [["profileKeyHash"]], "-"),
    fileId: first(profile, [["fileId"]], first(record, [["fileId"], ["id"]], "-")),
    filename: first(profile, [["filename"], ["name"]], first(record, [["filename"], ["name"]], "-")),
    fileHash: first(profile, [["fileHash"], ["hash"], ["sha256"]], first(record, [["fileHash"], ["hash"], ["sha256"]], "-")),
    textStatus: first(profile, [["textStatus"], ["status"]], first(record, [["textStatus"], ["status"]], "-")),
    textLength: first(profile, [["textLength"]], first(record, [["textLength"]], "0")),
    mimeType: first(profile, [["mimeType"], ["type"]], first(record, [["mimeType"], ["type"]], "-")),
    docFamily: first(profile, [["docFamily"]], first(input, [["docFamily"]], first(record, [["docFamily"]], "-"))),
    volume: first(profile, [["volume"]], first(input, [["volume"]], first(record, [["volume"]], "-"))),
    title: first(profile, [["title"]], first(input, [["title"]], first(record, [["title"]], "-"))),
    canonicalAxis: first(profile, [["canonicalAxis"]], first(input, [["canonicalAxis"]], first(record, [["canonicalAxis"]], "-"))),
    summary: first(profile, [["summary"]], first(record, [["summary"], ["reason"]], "-")),
    keyTerms: normalizeDocumentProfileTerms(getPath(profile, ["keyTerms"]) ?? getPath(input, ["keyTerms"])),
    semanticTerms: normalizeDocumentProfileTerms(getPath(profile, ["semanticTerms"])),
    memoryId: first(profile, [["memoryId"]], first(record, [["memoryId"]], "-")),
    sourceSavedChatId: first(profile, [["sourceSavedChatId"]], first(record, [["sourceSavedChatId"]], "-")),
    lastEvtId: first(profile, [["lastEvtId"]], first(record, [["lastEvtId"], ["evtId"]], "-")),
    lastOpcProofId: first(profile, [["lastOpcProofId"]], first(record, [["lastOpcProofId"], ["opcId"]], "-")),
    profileStatus: first(profile, [["profileStatus"]], first(record, [["profileStatus"]], "-")),
    quality: first(profile, [["quality"]], first(record, [["quality"]], "-")),
    reusableInPrompt: booleanLike(getPath(profile, ["reusableInPrompt"]) ?? getPath(input, ["reusableInPrompt"]), "-"),
    profileHash: first(profile, [["profileHash"]], first(record, [["profileHash"], ["documentProfileHash"]], "-")),
    canonicalDocumentKind: first(profile, [["canonicalDocumentKind"]], first(metadata, [["canonicalDocumentKind"]], first(input, [["canonicalDocumentKind"]], "-"))),
    glossaryGuardApplied: booleanLike(getPath(profile, ["glossaryGuardApplied"]) ?? getPath(metadata, ["glossaryGuardApplied"]) ?? getPath(input, ["glossaryGuardApplied"]), "-"),
    auditId: first(profile, [["auditId"]], first(record, [["auditId"]], "-")),
    usageId: first(profile, [["usageId"], ["modelUsageId"]], first(record, [["usageId"], ["modelUsageId"]], "-")),
    legalCertification: booleanLike(getPath(profile, ["legalCertification"]), "false"),
    source: first(record, [["source"]], isRecord(getPath(record, ["profile"])) ? "DOCUMENT_PROFILE_RESULT" : "DOCUMENT_PROFILE"),
    persistenceStatus: first(record, [["status"]], first(profile, [["profileStatus"]], "-")),
    error: first(record, [["error"]], "-")
  };
}


function collectDocumentProfileRecordsFromPayload(payload: JsonRecord | null | undefined): JsonRecord[] {
  if (!payload) {
    return [];
  }


  const sources: unknown[] = [
    getPath(payload, ["documentProfiles"]),
    getPath(payload, ["documentProfiles", "profiles"]),
    getPath(payload, ["documentRegistry", "profiles"]),
    getPath(payload, ["documentRegistry", "profileStatuses"]),
    getPath(payload, ["diagnostics", "documentProfiles"]),
    getPath(payload, ["diagnostics", "documentRegistry", "profiles"]),
    getPath(payload, ["diagnostics", "documentRegistry", "profileStatuses"]),
    getPath(payload, ["runtime", "documentProfiles"]),
    getPath(payload, ["runtime", "documentRegistry", "profiles"])
  ];


  return sources.flatMap((source) => {
    if (Array.isArray(source)) {
      return source.filter(isRecord);
    }


    if (isRecord(source)) {
      const nested = firstArray(source, [["profiles"], ["rows"], ["items"], ["profileStatuses"]]).filter(isRecord);


      return nested.length > 0 ? nested : [source];
    }


    return [];
  });
}


function dedupeDocumentProfiles(profiles: PublicDocumentProfileSnapshot[]): PublicDocumentProfileSnapshot[] {
  const seen = new Set<string>();
  const result: PublicDocumentProfileSnapshot[] = [];


  for (const profile of profiles) {
    const key = [profile.profileId, profile.fileId, profile.filename, profile.fileHash]
      .filter((item) => item && item !== "-")
      .join(":") || `${profile.title}:${profile.summary}`;


    if (seen.has(key)) {
      continue;
    }


    seen.add(key);
    result.push(profile);
  }


  return result;
}


function getPublicDocumentRegistrySnapshot(
  payload: JsonRecord | null | undefined,
  fallbackPayload?: JsonRecord | null
): PublicDocumentRegistrySnapshot {
  const sources = [payload, fallbackPayload].filter(isRecord);
  const registryRecords = sources
    .flatMap((source) => [
      firstRecord(source, [["documentRegistry"]]),
      firstRecord(source, [["diagnostics", "documentRegistry"]]),
      firstRecord(source, [["runtime", "documentRegistry"]])
    ])
    .filter(isRecord);
  const registry = registryRecords[0] ?? null;
  const profiles = dedupeDocumentProfiles(
    sources
      .flatMap((source) => collectDocumentProfileRecordsFromPayload(source))
      .map(normalizePublicDocumentProfileSnapshot)
  ).slice(0, 20);
  const linkedMemoryCount = profiles.filter((profile) => !isBlankRuntimeValue(profile.memoryId)).length;
  const reusableCount = profiles.filter((profile) => profile.reusableInPrompt === "true").length;
  const available = Boolean(registry) || profiles.length > 0;


  return {
    available,
    source: registry ? "DOCUMENT_REGISTRY_PAYLOAD" : profiles.length > 0 ? "DOCUMENT_PROFILE_RECORDS" : "NOT_AVAILABLE",
    status: first(registry, [["status"]], available ? "DOCUMENT_REGISTRY_READY" : "NOT_AVAILABLE"),
    table: first(registry, [["table"]], available ? "document_profiles" : "-"),
    attempted: booleanLike(getPath(registry, ["attempted"]), available ? "true" : "false"),
    persistedCount: first(registry, [["persistedCount"]], String(profiles.length)),
    failedCount: first(registry, [["failedCount"]], "0"),
    rowCount: first(fallbackPayload, [["documentProfiles", "rowCount"]], first(registry, [["rowCount"]], String(profiles.length))),
    profileCount: String(profiles.length),
    reusableCount: String(reusableCount),
    linkedMemoryCount: String(linkedMemoryCount),
    legalCertification: first(registry, [["legalCertification"]], "false"),
    opc: first(registry, [["opc"]], "technical proof receipt only"),
    profiles
  };
}


function isLinkedDocumentProfile(profile: PublicDocumentProfileSnapshot): boolean {
  return isUsableCyberneticMemoryId(profile.memoryId);
}


function getDocumentProfileChainRecord(profile: PublicDocumentProfileSnapshot): JsonRecord {
  return {
    memoryId: profile.memoryId,
    sourceSavedChatId: profile.sourceSavedChatId,
    lastEvtId: profile.lastEvtId,
    lastOpcProofId: profile.lastOpcProofId,
    auditId: profile.auditId,
    usageId: profile.usageId,
    memoryStatus: profile.profileStatus || "ACTIVE",
    status: profile.profileStatus || "ACTIVE",
    promptEligible: isLinkedDocumentProfile(profile) ? "true" : "false",
    reusableInPrompt: profile.reusableInPrompt,
    updatedAt: new Date().toISOString(),
    source: "DOCUMENT_PROFILE_MEMORY_SELECTOR",
    documentRegistry: {
      status: isLinkedDocumentProfile(profile) ? "AVAILABLE" : "NO_LINKED_PROFILE",
      linkedProfileCount: isLinkedDocumentProfile(profile) ? "1" : "0",
      profileCount: "1",
      profileId: profile.profileId,
      title: profile.title,
      volume: profile.volume,
      canonicalDocumentKind: profile.canonicalDocumentKind,
      legalCertification: false,
      opc: "technical proof receipt only"
    },
    documentProfile: {
      profileId: profile.profileId,
      filename: profile.filename,
      fileHash: profile.fileHash,
      docFamily: profile.docFamily,
      volume: profile.volume,
      title: profile.title,
      canonicalAxis: profile.canonicalAxis,
      canonicalDocumentKind: profile.canonicalDocumentKind,
      glossaryGuardApplied: profile.glossaryGuardApplied,
      profileStatus: profile.profileStatus,
      quality: profile.quality
    }
  };
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


function isBlankRuntimeValue(value: string): boolean {
  const normalized = value.trim().toUpperCase();


  return (
    !normalized ||
    normalized === "-" ||
    normalized === "UNKNOWN" ||
    normalized === "MISSING" ||
    normalized === "NO_VALUE"
  );
}


function isNegativeRuntimeValue(value: string): boolean {
  const normalized = value.trim().toUpperCase();


  return (
    isBlankRuntimeValue(value) ||
    normalized.includes("NOT_VERIFIED") ||
    normalized.includes("NO_VERIFIED") ||
    normalized.includes("NO_CERTIFICATE") ||
    normalized.includes("NO_TENANT") ||
    normalized.includes("NO_WORKSPACE") ||
    normalized.includes("NO_SUBSCRIPTION") ||
    normalized.includes("NO_ACCOUNT") ||
    normalized.includes("NO_SESSION") ||
    normalized.includes("SERVER_VALIDATION_REQUIRED") ||
    normalized.includes("MATRIX_LIMITED") ||
    normalized.includes("RUNTIME_ONLY") ||
    normalized.includes("ACCESS_LIMITED") ||
    normalized.includes("NO_VERIFIED_BIOLOGICAL_SUBJECT")
  );
}


function firstUsableRuntimeValue(values: string[], fallback = "-"): string {
  for (const value of values) {
    const visible = normalizeVisibleText(value || "");


    if (!isNegativeRuntimeValue(visible)) {
      return visible;
    }
  }


  return fallback;
}


function firstDisplayValue(values: string[], fallback = "-"): string {
  for (const value of values) {
    const visible = normalizeVisibleText(value || "");


    if (!isBlankRuntimeValue(visible)) {
      return visible;
    }
  }


  return fallback;
}


function isActiveCertificateStatus(value: string): boolean {
  const normalized = value.toUpperCase();


  return normalized === "ACTIVE" || normalized === "VALID";
}


function hasJokerC2Scope(value: string): boolean {
  return value.toUpperCase().includes("JOKER_C2_ACCESS");
}


function parseJsonCandidate(raw: string): JsonRecord | null {
  const candidates: string[] = [];


  candidates.push(raw);


  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // Browser decoding failed. Society carries on heroically.
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
      ["humanIPR"],
      ["human_ipr"],
      ["biologicalIpr"],
      ["biologicalIPR"],
      ["ipr"],
      ["ipr_id"],
      ["identity", "ipr"],
      ["identity", "humanIpr"],
      ["identity", "human_ipr"],
      ["biologicalSubject", "ipr"],
      ["session", "humanIpr"],
      ["session", "human_ipr"]
    ],
    "NOT_VERIFIED"
  );
}


function getSessionHumanIpr(session: IprSessionResponse | null): string {
  if (!session) return "";


  return first(
    session,
    [
      ["session", "humanIpr"],
      ["session", "human_ipr"],
      ["session", "subjectIpr"],
      ["session", "subject_ipr"],
      ["accountProfile", "humanIpr"],
      ["accountProfile", "human_ipr"],
      ["accountProfile", "subjectIpr"],
      ["accountProfile", "subject_ipr"],
      ["accountProfile", "ipr"],
      ["reconstructedIprHandoff", "humanIpr"],
      ["reconstructedIprHandoff", "human_ipr"],
      ["reconstructedIprHandoff", "subject", "ipr"],
      ["reconstructedIprHandoff", "verifiedSubject", "ipr"],
      ["reconstructedIprHandoff", "verified_subject_ipr"]
    ],
    ""
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


function getSessionSubjectName(session: IprSessionResponse | null, ipr: string): string {
  if (!session) return "";


  return canonicalizeSubjectName(
    first(
      session,
      [
        ["session", "subjectName"],
        ["session", "subject_name"],
        ["session", "name"],
        ["accountProfile", "subjectName"],
        ["accountProfile", "subject_name"],
        ["accountProfile", "name"],
        ["accountProfile", "fullName"],
        ["reconstructedIprHandoff", "subjectName"],
        ["reconstructedIprHandoff", "name"],
        ["reconstructedIprHandoff", "subject", "name"],
        ["reconstructedIprHandoff", "verifiedSubject", "name"],
        ["reconstructedIprHandoff", "verified_subject_name"]
      ],
      ""
    ),
    ipr
  );
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


function getSessionCertificateId(session: IprSessionResponse | null): string {
  if (!session) return "";


  return first(
    session,
    [
      ["session", "certificateId"],
      ["session", "certificate_id"],
      ["accountProfile", "certificateId"],
      ["accountProfile", "certificate_id"],
      ["accountProfile", "certificate", "certificateId"],
      ["accountProfile", "certificate", "certificate_id"],
      ["reconstructedIprHandoff", "certificateId"],
      ["reconstructedIprHandoff", "certificate_id"],
      ["reconstructedIprHandoff", "certificate", "certificateId"],
      ["reconstructedIprHandoff", "certificate", "certificate_id"],
      ["reconstructedIprHandoff", "operationalCertificate", "certificateId"],
      ["reconstructedIprHandoff", "verified_subject_certificate_id"]
    ],
    ""
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


function getSessionCertificateStatus(session: IprSessionResponse | null): string {
  if (!session) return "";


  return first(
    session,
    [
      ["session", "certificateStatus"],
      ["session", "certificate_status"],
      ["session", "status"],
      ["accountProfile", "certificateStatus"],
      ["accountProfile", "certificate_status"],
      ["accountProfile", "status"],
      ["accountProfile", "certificate", "status"],
      ["accountProfile", "certificate", "certificateStatus"],
      ["reconstructedIprHandoff", "certificateStatus"],
      ["reconstructedIprHandoff", "certificate_status"],
      ["reconstructedIprHandoff", "status"],
      ["reconstructedIprHandoff", "certificate", "status"],
      ["reconstructedIprHandoff", "operationalCertificate", "status"],
      ["reconstructedIprHandoff", "verified_subject_certificate_status"]
    ],
    ""
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


function getSessionScope(session: IprSessionResponse | null): string {
  if (!session) return "";


  return firstJoined(
    session,
    [
      ["session", "scope"],
      ["session", "accessScope"],
      ["session", "access_scope"],
      ["accountProfile", "scope"],
      ["accountProfile", "accessScope"],
      ["accountProfile", "certificateScope"],
      ["accountProfile", "certificate_scope"],
      ["accountProfile", "certificate", "scope"],
      ["accountProfile", "certificate", "certificateScope"],
      ["reconstructedIprHandoff", "scope"],
      ["reconstructedIprHandoff", "certificateScope"],
      ["reconstructedIprHandoff", "certificate_scope"],
      ["reconstructedIprHandoff", "certificate", "scope"],
      ["reconstructedIprHandoff", "operationalCertificate", "scope"],
      ["reconstructedIprHandoff", "verified_subject_certificate_scope"],
      ["access", "scope"],
      ["access", "accessScope"]
    ],
    ""
  );
}


function buildEnrichedIprHandoff(input: {
  base: JsonRecord | null;
  subject: string;
  humanIpr: string;
  certificateId: string;
  certificateStatus: string;
  scope: string;
  accessDecision: string;
  identityBinding: string;
}): JsonRecord | null {
  const hasIdentity =
    !isNegativeRuntimeValue(input.humanIpr) &&
    !isNegativeRuntimeValue(input.certificateId) &&
    isActiveCertificateStatus(input.certificateStatus) &&
    hasJokerC2Scope(input.scope);


  if (!input.base && !hasIdentity) {
    return null;
  }


  const base = isRecord(input.base) ? { ...input.base } : {};


  return {
    ...base,
    subjectName: input.subject,
    name: input.subject,
    humanIpr: input.humanIpr,
    humanIPR: input.humanIpr,
    human_ipr: input.humanIpr,
    biologicalIpr: input.humanIpr,
    subjectIpr: input.humanIpr,
    verified_subject_ipr: input.humanIpr,
    certificateId: input.certificateId,
    certificateID: input.certificateId,
    certificate_id: input.certificateId,
    verified_subject_certificate_id: input.certificateId,
    certificateStatus: input.certificateStatus,
    certificate_status: input.certificateStatus,
    verified_subject_certificate_status: input.certificateStatus,
    scope: input.scope,
    certificateScope: input.scope,
    certificate_scope: input.scope,
    verified_subject_certificate_scope: input.scope,
    accessDecision: hasIdentity ? "ACCESS_GRANTED" : input.accessDecision,
    access_decision: hasIdentity ? "ACCESS_GRANTED" : input.accessDecision,
    identityBinding: hasIdentity
      ? "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      : input.identityBinding,
    identity_binding: hasIdentity
      ? "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      : input.identityBinding,
    subject: {
      ...(isRecord(base.subject) ? base.subject : {}),
      entity: input.subject,
      name: input.subject,
      ipr: input.humanIpr
    },
    verifiedSubject: {
      ...(isRecord(base.verifiedSubject) ? base.verifiedSubject : {}),
      entity: input.subject,
      name: input.subject,
      ipr: input.humanIpr,
      certificateId: input.certificateId,
      certificateStatus: input.certificateStatus,
      certificateScope: input.scope
    },
    biologicalSubject: {
      ...(isRecord(base.biologicalSubject) ? base.biologicalSubject : {}),
      entity: input.subject,
      name: input.subject,
      ipr: input.humanIpr,
      humanIpr: input.humanIpr,
      certificateId: input.certificateId,
      status: input.certificateStatus,
      scope: input.scope
    },
    certificate: {
      ...(isRecord(base.certificate) ? base.certificate : {}),
      id: input.certificateId,
      certificateId: input.certificateId,
      certificate_id: input.certificateId,
      status: input.certificateStatus,
      certificateStatus: input.certificateStatus,
      certificate_status: input.certificateStatus,
      scope: input.scope,
      certificateScope: input.scope,
      certificate_scope: input.scope
    },
    operationalCertificate: {
      ...(isRecord(base.operationalCertificate) ? base.operationalCertificate : {}),
      id: input.certificateId,
      certificateId: input.certificateId,
      certificate_id: input.certificateId,
      status: input.certificateStatus,
      certificateStatus: input.certificateStatus,
      certificate_status: input.certificateStatus,
      scope: input.scope,
      certificateScope: input.scope,
      certificate_scope: input.scope
    },
    access: {
      ...(isRecord(base.access) ? base.access : {}),
      decision: hasIdentity ? "ACCESS_GRANTED" : input.accessDecision,
      accessDecision: hasIdentity ? "ACCESS_GRANTED" : input.accessDecision,
      identityBinding: hasIdentity
        ? "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
        : input.identityBinding,
      scope: input.scope
    },
    legalCertification: false
  };
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


function deriveB2GReadiness(status: Pick<RuntimeStatus,
  | "humanIpr"
  | "memory"
  | "persistence"
  | "responseEvt"
  | "opc"
  | "auditId"
  | "auditStatus"
  | "modelUsageId"
  | "modelUsageStatus"
  | "tenantId"
  | "workspaceId"
  | "subscriptionId"
  | "accountId"
  | "runtimeBirth"
>): "READY" | "PARTIAL_READY" | "NOT_READY" {
  const required = [
    status.humanIpr,
    status.responseEvt,
    status.opc,
    status.auditId,
    status.modelUsageId,
    status.tenantId,
    status.workspaceId,
    status.subscriptionId,
    status.accountId
  ];

  const hasRequiredIds = required.every((value) => !isNegativeRuntimeValue(value));
  const hasPersistentMemory =
    status.memory.toUpperCase().includes("IPR_BOUND") &&
    status.persistence.toUpperCase().includes("DATABASE_PERSISTENT");
  const hasPersistedLogs =
    status.auditStatus.toUpperCase().includes("PERSISTED") &&
    status.modelUsageStatus.toUpperCase().includes("PERSISTED");
  const has2026Birth = status.runtimeBirth === JOKER_C2_BIRTH_ANCHOR_LOCAL;

  if (hasRequiredIds && hasPersistentMemory && hasPersistedLogs && has2026Birth) {
    return "READY";
  }

  if (hasRequiredIds || hasPersistentMemory || hasPersistedLogs || has2026Birth) {
    return "PARTIAL_READY";
  }

  return "NOT_READY";
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


  const status: RuntimeStatus = {
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
    modelLevel: first(
      source,
      [
        ["runtime", "modelLevel"],
        ["modelLevel"],
        ["modelUsage", "modelLevel"],
        ["saas", "modelUsage", "modelLevel"]
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
        ["saas", "legalCertification"],
        ["audit", "legalCertification"],
        ["modelUsage", "legalCertification"],
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
    databaseConfigured: first(
      source,
      [
        ["database", "configured"],
        ["persistence", "databaseConfigured"],
        ["operationalContext", "databaseConfigured"],
        ["components", "database", "configured"]
      ],
      "UNKNOWN"
    ),
    databaseAvailable: first(
      source,
      [
        ["database", "available"],
        ["persistence", "databaseAvailable"],
        ["operationalContext", "databaseAvailable"],
        ["components", "database", "available"]
      ],
      "UNKNOWN"
    ),
    openAI: first(
      source,
      [
        ["provider", "configured"],
        ["openAIConfigured"],
        ["openaiConfigured"],
        ["operationalContext", "openAIConfigured"]
      ],
      "UNKNOWN"
    ),
    saasTier: first(
      source,
      [
        ["saas", "tier"],
        ["modelUsage", "saasTier"],
        ["saasCore", "tier"]
      ],
      "-"
    ),
    saasRelease: first(
      source,
      [
        ["saas", "release"],
        ["saasCore", "release"],
        ["project", "targetRelease"],
        ["operationalContext", "release"]
      ],
      "SaaS Core v0.1"
    ),
    saasCoreStatus: first(
      source,
      [
        ["saasCore", "status"],
        ["state"],
        ["status"]
      ],
      "-"
    ),
    auditId: first(
      source,
      [
        ["audit", "auditId"],
        ["saas", "audit", "auditId"]
      ],
      "-"
    ),
    auditStatus: first(
      source,
      [
        ["audit", "status"],
        ["saas", "audit", "status"],
        ["runtimeAuditLog", "mode"],
        ["components", "runtimeAuditLog", "status"]
      ],
      "-"
    ),
    auditPersistence: first(
      source,
      [
        ["audit", "persistence", "status"],
        ["saas", "audit", "persistence", "status"],
        ["runtimeAuditLog", "mode"],
        ["components", "runtimeAuditLog", "mode"]
      ],
      "-"
    ),
    auditHash: first(
      source,
      [
        ["audit", "auditHash"],
        ["saas", "audit", "auditHash"]
      ],
      "-"
    ),
    modelUsageId: first(
      source,
      [
        ["modelUsage", "usageId"],
        ["saas", "modelUsage", "usageId"]
      ],
      "-"
    ),
    modelUsageStatus: first(
      source,
      [
        ["modelUsage", "status"],
        ["saas", "modelUsage", "status"],
        ["modelUsageLog", "mode"],
        ["components", "modelUsageLog", "status"]
      ],
      "-"
    ),
    modelUsagePersistence: first(
      source,
      [
        ["modelUsage", "persistence", "status"],
        ["saas", "modelUsage", "persistence", "status"],
        ["modelUsageLog", "mode"],
        ["components", "modelUsageLog", "mode"]
      ],
      "-"
    ),
    accountingMode: first(
      source,
      [
        ["modelUsage", "accountingMode"],
        ["saas", "modelUsage", "accountingMode"]
      ],
      "-"
    ),
    estimatedCostUnits: first(
      source,
      [
        ["modelUsage", "estimatedCostUnits"],
        ["saas", "modelUsage", "estimatedCostUnits"]
      ],
      "-"
    ),
    estimatedCostMinor: first(
      source,
      [
        ["modelUsage", "estimatedCostMinor"],
        ["saas", "modelUsage", "estimatedCostMinor"]
      ],
      "-"
    ),
    totalTokens: first(
      source,
      [
        ["modelUsage", "tokens", "totalTokens"],
        ["saas", "modelUsage", "tokens", "totalTokens"],
        ["diagnostics", "tokenUsage", "totalTokens"]
      ],
      "-"
    ),
    inputTokens: first(
      source,
      [
        ["modelUsage", "tokens", "inputTokens"],
        ["saas", "modelUsage", "tokens", "inputTokens"],
        ["diagnostics", "tokenUsage", "inputTokens"]
      ],
      "-"
    ),
    outputTokens: first(
      source,
      [
        ["modelUsage", "tokens", "outputTokens"],
        ["saas", "modelUsage", "tokens", "outputTokens"],
        ["diagnostics", "tokenUsage", "outputTokens"]
      ],
      "-"
    ),
    usageHash: first(
      source,
      [
        ["modelUsage", "usageHash"],
        ["saas", "modelUsage", "usageHash"]
      ],
      "-"
    ),
    utcResponseTime: first(
      source,
      [
        ["temporalCertificate", "utcResponseTime"],
        ["temporalCertificate", "utc"],
        ["temporal", "utcResponseTime"],
        ["temporal", "currentTimestamp"],
        ["runtime", "temporal", "utcResponseTime"],
        ["diagnostics", "temporal", "currentResponseTimestamp"],
        ["diagnostics", "temporal", "currentTimestamp"]
      ],
      "-"
    ),
    temporalCertificateStatus: first(
      source,
      [
        ["temporalCertificate", "status"],
        ["temporal", "certificateStatus"],
        ["runtime", "temporal", "certificateStatus"]
      ],
      "ACTIVE_TEMPORAL_RUNTIME_CERTIFICATE"
    ),
    temporalProof: first(
      source,
      [
        ["temporalCertificate", "temporalProof"],
        ["temporalCertificate", "proof"],
        ["temporal", "temporalProof"],
        ["runtime", "temporal", "temporalProof"]
      ],
      "EVT_OPC_AUDIT_USAGE_LINKED"
    ),
    runtimeBirth: first(
      source,
      [
        ["temporalCertificate", "birthAnchorLocal"],
        ["temporalCertificate", "birthAnchor", "local"],
        ["temporal", "birthAnchorLocal"],
        ["temporal", "runtimeBirth"],
        ["runtime", "temporal", "birthAnchorLocal"],
        ["runtime", "temporal", "runtimeBirth"],
        ["continuity", "runtimeBirth"],
        ["identity", "projectBirth", "t"]
      ],
      JOKER_C2_BIRTH_ANCHOR_LOCAL
    ),
    runtimeBirthUtc: first(
      source,
      [
        ["temporalCertificate", "birthAnchorUtc"],
        ["temporalCertificate", "birthAnchor", "utc"],
        ["temporal", "birthAnchorUtc"],
        ["temporal", "runtimeBirthUtc"],
        ["runtime", "temporal", "birthAnchorUtc"],
        ["runtime", "temporal", "runtimeBirthUtc"],
        ["diagnostics", "temporal", "runtimeBirthUtc"]
      ],
      JOKER_C2_BIRTH_ANCHOR_UTC
    ),
    runtimeAge: first(
      source,
      [
        ["temporalCertificate", "lifeHuman"],
        ["temporalCertificate", "jokerLifetime"],
        ["temporal", "lifeHuman"],
        ["temporal", "jokerLifetime"],
        ["runtime", "temporal", "lifeHuman"],
        ["runtime", "runtimeAge"],
        ["continuity", "runtimeAge"],
        ["identity", "projectBirth", "runtimeAge"]
      ],
      buildJokerTemporalRuntimeSnapshot().lifeHuman
    ),
    runtimeLifeSeconds: first(
      source,
      [
        ["temporalCertificate", "lifeSeconds"],
        ["temporalCertificate", "jokerLifeSeconds"],
        ["temporal", "lifeSeconds"],
        ["temporal", "jokerLifeSeconds"],
        ["runtime", "temporal", "lifeSeconds"],
        ["runtime", "runtimeLifeSeconds"],
        ["continuity", "runtimeLifeSeconds"],
        ["identity", "projectBirth", "runtimeLifeSeconds"]
      ],
      buildJokerTemporalRuntimeSnapshot().lifeSeconds
    ),
    tenantId: first(
      source,
      [
        ["saas", "tenantId"],
        ["runtime", "tenantId"],
        ["diagnostics", "saasContext", "tenantId"],
        ["opc", "record", "operationalContext", "tenantId"]
      ],
      "-"
    ),
    workspaceId: first(
      source,
      [
        ["saas", "workspaceId"],
        ["runtime", "workspaceId"],
        ["diagnostics", "saasContext", "workspaceId"],
        ["opc", "record", "operationalContext", "workspaceId"]
      ],
      "-"
    ),
    subscriptionId: first(
      source,
      [
        ["saas", "subscriptionId"],
        ["runtime", "subscriptionId"],
        ["diagnostics", "saasContext", "subscriptionId"],
        ["opc", "record", "operationalContext", "subscriptionId"]
      ],
      "-"
    ),
    accountId: first(
      source,
      [
        ["saas", "accountId"],
        ["runtime", "accountId"],
        ["diagnostics", "saasContext", "accountId"],
        ["opc", "record", "operationalContext", "accountId"]
      ],
      "-"
    ),
    threadId: first(
      source,
      [
        ["saas", "threadId"],
        ["runtime", "threadId"],
        ["diagnostics", "saasContext", "threadId"]
      ],
      "-"
    ),
    saasSource: first(
      source,
      [
        ["saas", "source"],
        ["runtime", "saasContextSource"],
        ["diagnostics", "saasContext", "source"],
        ["opc", "record", "operationalContext", "saasContextSource"]
      ],
      "-"
    ),
    memoryId: first(
      source,
      [
        ["memory", "memoryId"],
        ["saas", "memory", "memoryId"],
        ["diagnostics", "memory", "memoryId"],
        ["opc", "record", "memory", "memoryId"]
      ],
      "-"
    ),
    memoryHash: first(
      source,
      [
        ["memory", "memoryHash"],
        ["diagnostics", "memory", "memoryHash"],
        ["opc", "record", "memory", "hash"],
        ["modelUsage", "memoryHash"]
      ],
      "-"
    ),
    memoryKeyHash: first(
      source,
      [
        ["memory", "memoryKeyHash"],
        ["diagnostics", "memory", "memoryKeyHash"],
        ["opc", "record", "memory", "memoryKeyHash"]
      ],
      "-"
    ),
    registeredEventId: first(
      source,
      [
        ["registeredEvent", "registeredEventId"],
        ["registeredEvent", "eventId"],
        ["saas", "registeredEvent", "registeredEventId"],
        ["audit", "registeredEventId"],
        ["modelUsage", "registeredEventId"]
      ],
      "-"
    ),
    registeredEventName: first(
      source,
      [
        ["registeredEvent", "registeredEventName"],
        ["registeredEvent", "eventName"],
        ["saas", "registeredEvent", "registeredEventName"],
        ["audit", "registeredEventName"],
        ["modelUsage", "registeredEventName"]
      ],
      "-"
    ),
    registeredEventHash: first(
      source,
      [
        ["registeredEvent", "registeredEventHash"],
        ["registeredEvent", "eventHash"],
        ["saas", "registeredEvent", "registeredEventHash"],
        ["audit", "registeredEventHash"],
        ["modelUsage", "registeredEventHash"]
      ],
      "-"
    ),
    previousEvt: first(
      source,
      [
        ["continuity", "previousEvt"],
        ["evt", "prev"],
        ["event", "prev"],
        ["audit", "previousEvtRef"],
        ["modelUsage", "previousEvtRef"]
      ],
      "-"
    ),
    previousOpc: first(
      source,
      [
        ["continuity", "previousOpc"],
        ["audit", "previousOpcRef"],
        ["modelUsage", "previousOpcRef"]
      ],
      "-"
    ),
    b2gReadiness: "PARTIAL_READY"
  };

  return {
    ...status,
    b2gReadiness: deriveB2GReadiness(status)
  };
}


function getStatusClass(value: string): string {
  const normalized = value.toUpperCase();


  if (normalized === "NOT_READY" || normalized === "FAIL_TEMPORAL_ANCHOR") {
    return "is-bad";
  }


  if (normalized === "PARTIAL_READY") {
    return "is-warn";
  }


  if (normalized === "READY" || normalized === "PASS_2026_ONLY") {
    return "is-good";
  }


  if (
    normalized.includes("DENIED") ||
    normalized.includes("ERROR") ||
    normalized.includes("INVALID") ||
    normalized.includes("BLOCKED") ||
    normalized.includes("FAILED") ||
    normalized.includes("FAIL") ||
    normalized.includes("HTTP_405")
  ) {
    return "is-bad";
  }


  if (
    normalized.includes("LIMITED") ||
    normalized.includes("PENDING") ||
    normalized.includes("PROCESS_MEMORY") ||
    normalized.includes("RUNTIME_ONLY") ||
    normalized.includes("MVP") ||
    normalized.includes("TARGET") ||
    normalized.includes("SERVER_VALIDATION_REQUIRED") ||
    normalized.includes("NOT_VERIFIED") ||
    normalized.includes("NOT_AVAILABLE") ||
    normalized.includes("NOT_SELECTED") ||
    normalized.includes("METADATA_ONLY") ||
    normalized.includes("REFERENCE_ONLY") ||
    normalized.includes("CLIENT_PAYLOAD") ||
    normalized.includes("UNKNOWN") ||
    normalized === "-"
  ) {
    return "is-warn";
  }


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
    normalized.includes("PERSISTED") ||
    normalized.includes("RECORDED") ||
    normalized.includes("TECHNICAL_PROOF") ||
    normalized.includes("EVT_OPC") ||
    normalized.includes("READY") ||
    normalized.includes("TRUE")
  ) {
    return "is-good";
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


type InfoListItem = {
  label: string;
  value: string;
  detail?: string;
  title?: string;
};


function InfoList({ items }: { items: InfoListItem[] }) {
  return (
    <dl className="joker-info-list">
      {items.map((item) => {
        const visibleValue = normalizeVisibleText(item.value);
        const visibleDetail = item.detail ? normalizeVisibleText(item.detail) : "";
        const title = normalizeVisibleText(item.title || [visibleValue, visibleDetail].filter(Boolean).join(" · "));


        return (
          <div
            key={`${item.label}-${visibleValue}-${visibleDetail}`}
            className={["joker-info-row", visibleDetail ? "has-detail" : "", getStatusClass(visibleValue)]
              .filter(Boolean)
              .join(" ")}
            translate="no"
          >
            <dt>{item.label}</dt>
            <dd title={title}>
              <span>{compact(visibleValue, visibleDetail ? 54 : 60)}</span>
              {visibleDetail ? <small>{compact(visibleDetail, 72)}</small> : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}


function jsonRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}


function firstRecordText(record: JsonRecord, paths: string[][], fallback = "-"): string {
  return first(record, paths, fallback);
}


function getIprMemoryRecordTitle(record: JsonRecord): string {
  return firstRecordText(
    record,
    [
      ["memoryTitle"],
      ["title"],
      ["threadTitle"],
      ["primaryIntention"],
      ["radicalIntention"],
      ["memorySummary"]
    ],
    "IPR memory record"
  );
}


function getIprMemoryRecordSummary(record: JsonRecord): string {
  return firstRecordText(
    record,
    [
      ["memorySummary"],
      ["summary"],
      ["primaryIntention"],
      ["radicalIntention"],
      ["preview"],
      ["lastMessagePreview"]
    ],
    "No memory synthesis available."
  );
}


function getIprMemoryRecordId(record: JsonRecord): string {
  return firstRecordText(
    record,
    [
      ["memoryId"],
      ["savedChatId"],
      ["threadId"],
      ["registeredEventId"],
      ["id"]
    ],
    "-"
  );
}


function getIprMemoryRecordMemoryId(record: JsonRecord): string {
  const candidate = firstRecordText(
    record,
    [
      ["memoryId"],
      ["memory", "memoryId"],
      ["memoryRecord", "memoryId"],
      ["record", "memoryId"],
      ["sourceMemoryId"],
      ["iprMemoryId"]
    ],
    ""
  );


  return candidate.startsWith("IPR-MEM-") ? candidate : "";
}


function getIprMemoryRecordTimestamp(record: JsonRecord): string {
  return firstRecordText(
    record,
    [
      ["updatedAt"],
      ["createdAt"],
      ["savedAt"],
      ["registeredAt"],
      ["lastMessageAt"]
    ],
    "-"
  );
}


function getIprMemoryRecordEvtId(record: JsonRecord): string {
  return firstRecordText(record, [["evtId"], ["lastEvtId"], ["lastEvt"], ["responseEvt"], ["registeredEventId"], ["source", "evtId"], ["memory", "lastEvtId"], ["memoryRecord", "evtId"], ["record", "evtId"]], "-");
}


function getIprMemoryRecordOpcId(record: JsonRecord): string {
  return firstRecordText(record, [["opcId"], ["opcProofId"], ["lastOpcProofId"], ["lastOpcId"], ["opc"], ["source", "opcId"], ["memory", "lastOpcProofId"], ["memoryRecord", "opcId"], ["record", "opcId"]], "-");
}


function getIprMemoryRecordSavedChatId(record: JsonRecord): string {
  return firstRecordText(record, [["savedChatId"], ["sourceSavedChatId"], ["chatSaveId"], ["source", "savedChatId"], ["memoryRecord", "savedChatId"], ["record", "savedChatId"]], "-");
}


function getRecordStatusPayloadRecord(payload: JsonRecord | null | undefined): JsonRecord | null {
  if (!payload) return null;
  return firstRecord(payload, [["memoryRecord"], ["record"], ["memory"], ["status", "memoryRecord"], ["data", "memoryRecord"]]);
}


function buildCyberneticMemoryChainSnapshot(payload: JsonRecord | null | undefined, fallback?: Partial<CyberneticMemoryChainState>): CyberneticMemoryChainState {
  const source = payload ?? {};
  const record = getRecordStatusPayloadRecord(source) ?? source;
  const documentRegistry = firstRecord(source, [["documentRegistry"], ["registry", "documentRegistry"]]);
  const memoryId = firstUsableRuntimeValue([first(record, [["memoryId"], ["id"]], ""), first(source, [["memoryId"], ["savedMemoryId"], ["memory", "memoryId"]], ""), fallback?.memoryId ?? ""], "-");

  return {
    memoryId,
    savedChatId: firstUsableRuntimeValue([getIprMemoryRecordSavedChatId(record), first(source, [["savedChatId"], ["sourceSavedChatId"]], ""), fallback?.savedChatId ?? ""], "-"),
    evtId: firstUsableRuntimeValue([getIprMemoryRecordEvtId(record), first(source, [["evtId"], ["lastEvtId"], ["responseEvt"], ["evt", "id"]], ""), fallback?.evtId ?? ""], "-"),
    opcId: firstUsableRuntimeValue([getIprMemoryRecordOpcId(record), first(source, [["opcId"], ["opcProofId"], ["opc"], ["opc", "id"]], ""), fallback?.opcId ?? ""], "-"),
    auditId: firstUsableRuntimeValue([first(record, [["auditId"]], ""), first(source, [["auditId"], ["audit", "auditId"]], ""), fallback?.auditId ?? ""], "-"),
    usageId: firstUsableRuntimeValue([first(record, [["usageId"], ["modelUsageId"]], ""), first(source, [["usageId"], ["modelUsageId"], ["usage", "usageId"]], ""), fallback?.usageId ?? ""], "-"),
    status: firstDisplayValue([first(record, [["memoryStatus"], ["status"], ["recordStatus"]], ""), first(source, [["memoryStatus"], ["status"]], ""), fallback?.status ?? ""], "UNKNOWN"),
    promptEligible: firstDisplayValue([booleanLike(getPath(record, ["promptEligible"]), ""), first(record, [["promptEligible"]], ""), first(source, [["promptEligible"]], ""), fallback?.promptEligible ?? ""], "false"),
    reusableInPrompt: firstDisplayValue([booleanLike(getPath(record, ["reusableInPrompt"]), ""), first(record, [["reusableInPrompt"]], ""), first(source, [["reusableInPrompt"]], ""), fallback?.reusableInPrompt ?? ""], "false"),
    source: firstDisplayValue([fallback?.source ?? "", first(source, [["source"]], "")], "IPR_MEMORY_CHAIN"),
    recordStatus: firstDisplayValue([first(source, [["recordStatus"], ["status"], ["memoryStatus"]], ""), fallback?.recordStatus ?? ""], "NOT_CHECKED"),
    documentRegistryStatus: firstDisplayValue([first(documentRegistry, [["status"], ["reason"]], ""), first(source, [["documentRegistryStatus"]], ""), fallback?.documentRegistryStatus ?? ""], "NOT_CHECKED"),
    linkedProfileCount: firstDisplayValue([first(documentRegistry, [["linkedProfileCount"], ["profileCount"]], ""), first(source, [["linkedProfileCount"]], ""), fallback?.linkedProfileCount ?? ""], "0"),
    updatedAt: firstDisplayValue([getIprMemoryRecordTimestamp(record), first(source, [["checkedAt"], ["updatedAt"], ["createdAt"]], ""), fallback?.updatedAt ?? ""], new Date().toISOString())
  };
}


function isUsableCyberneticMemoryId(value: string): boolean {
  return value.trim().startsWith("IPR-MEM-");
}


function buildCyberneticMemoryRecallPrompt(chain: CyberneticMemoryChainState): string {
  return [
    "CYBERNETIC_MEMORY_RECALL_REQUEST v1.0", "", "Richiama questa memoria IPR come memoria cibernetica riusabile nel runtime JOKER-C2.", "Non creare nuova memoria semantica generica.", "Non salvare nulla se non viene richiesta una nuova persistenza esplicita.", "Se la memoria è collegata a document_profiles, esegui anche il recall documentale dinamico.", "", `memoryId: ${chain.memoryId}`, `evtId: ${chain.evtId}`, `opcId: ${chain.opcId}`, `documentRegistryStatus: ${chain.documentRegistryStatus}`, `linkedProfileCount: ${chain.linkedProfileCount}`, "", "Risposta attesa:", "CYBERNETIC_MEMORY_RECALL_READY", "MEMORY_CHAIN_RECALL_READY: true", "DOCUMENT_MEMORY_RECALL_READY: true se linkedProfileCount > 0", "", "Indica in modo tecnico:", "- memoryId richiamato", "- EVT collegato", "- OPC collegato", "- stato memoria", "- promptEligible", "- reusableInPrompt", "- documentRegistry.status", "- linkedProfileCount", "- documentProfileRecallInjected", "- profileId/title/volume se disponibili", "- legalCertification=false", "- OPC=technical proof receipt only"
  ].join("\n");
}


function buildCyberneticEvtBindingPrompt(chain: CyberneticMemoryChainState): string {
  return ["CYBERNETIC_MEMORY_EVT_BINDING_REQUEST v1.0", "", "Verifica il collegamento tra memoria IPR ed EVT per la memoria selezionata.", "Non creare memoria semantica generica.", "Non salvare nuova memoria.", "", `memoryId: ${chain.memoryId}`, `evtId: ${chain.evtId}`, "", "Risposta attesa:", "IPR_MEMORY_EVT_BINDING_READY", "", "Indica: memoryId, evtId, Human IPR, tenant, workspace, stato EVT, legalCertification=false, OPC=technical proof receipt only."].join("\n");
}


function buildCyberneticOpcBindingPrompt(chain: CyberneticMemoryChainState): string {
  return ["CYBERNETIC_MEMORY_OPC_BINDING_REQUEST v1.0", "", "Verifica il collegamento tra EVT e OPC per la memoria selezionata.", "Non creare memoria semantica generica.", "Non salvare nuova memoria.", "", `memoryId: ${chain.memoryId}`, `evtId: ${chain.evtId}`, `opcId: ${chain.opcId}`, "", "Risposta attesa:", "EVT_OPC_BINDING_READY", "", "Indica: memoryId, evtId, opcId, hash/proof status, legalCertification=false, OPC=technical proof receipt only."].join("\n");
}


function buildIprSaveMessages(messages: ChatMessage[]): JsonRecord[] {
  return messages.map((item, index) => {
    const status = getRuntimeStatus(item.raw ?? null);

    return {
      messageId: item.id,
      role: item.role,
      content: normalizeVisibleText(item.content),
      evtId: status.responseEvt !== "-" ? status.responseEvt : status.aiEvt,
      opcProofId: status.opc,
      opcChainHash: status.chainHash,
      runtimeState: first(item.raw, [["state"], ["status"]], item.role === "assistant" ? "ASSISTANT_RESPONSE" : "USER_MESSAGE"),
      runtimeDecision: first(item.raw, [["decision"], ["access", "decision"]], "-"),
      generationClass: first(item.raw, [["generationClass"], ["class"], ["contextClass"]], "-"),
      messageVisibility: "IPR_CHAT_RECENT_HISTORY",
      createdAt: item.createdAt,
      metadata: {
        sequenceIndex: index,
        hasRawPayload: Boolean(item.raw),
        temporalSeal: item.temporalSeal ?? null,
        legalCertification: false
      }
    };
  });
}


function getLatestUserIntention(messages: ChatMessage[]): string {
  const userMessages = messages.filter((item) => item.role === "user" && normalizeVisibleText(item.content));

  if (userMessages.length === 0) {
    return "Salvataggio esplicito della chat JOKER-C2 su IPR come Intenzione Primaria Radicale.";
  }

  return normalizeVisibleText(userMessages[userMessages.length - 1].content).slice(0, 1200);
}


function getChatThreadTitle(messages: ChatMessage[], sessionId: string): string {
  const firstUserMessage = messages.find((item) => item.role === "user" && normalizeVisibleText(item.content));
  const source = firstUserMessage ? normalizeVisibleText(firstUserMessage.content) : sessionId;

  return compact(source || "JOKER-C2 IPR chat", 88);
}



function FileIngestionCard({
  snapshot,
  localFiles
}: {
  snapshot: PublicFileIngestionSnapshot;
  localFiles: RuntimeFile[];
}) {
  const visibleServerFiles = snapshot.files.slice(0, 8);
  const visibleLocalFiles = localFiles.slice(0, 8);


  return (
    <section className="joker-file-ingestion-card" translate="no">
      <div className="joker-semantic-head">
        <div>
          <span className="joker-kicker">File ingestion</span>
          <h3>TXT / PDF runtime context</h3>
        </div>
        <div className="joker-semantic-pills">
          <StatusPill label="Server" value={snapshot.status} />
          <StatusPill label="Local" value={localFiles.length > 0 ? "LOCAL_FILES_READY" : "NO_LOCAL_FILES"} />
        </div>
      </div>


      <div className="joker-semantic-grid">
        <MetricCard label="Prompt ready" value={snapshot.promptReadyCount} />
        <MetricCard label="PDF ready" value={snapshot.pdfReadyCount} />
        <MetricCard label="PDF metadata only" value={snapshot.pdfMetadataOnlyCount} />
        <MetricCard label="PDF fail" value={snapshot.pdfIngestionFailCount} />
        <MetricCard label="Text ready" value={snapshot.textReadyCount} />
        <MetricCard label="Reference only" value={snapshot.referenceOnlyCount} />
        <MetricCard label="Rejected" value={snapshot.rejectedCount} />
        <MetricCard label="Total text" value={snapshot.totalTextLength} />
      </div>


      {visibleServerFiles.length > 0 ? (
        <div className="joker-file-ingestion-list" aria-label="Server file ingestion results">
          <strong>Server ingestion result</strong>
          {visibleServerFiles.map((file) => (
            <div key={`${file.id}-${file.fileHash}`} className="joker-file-ingestion-row">
              <span title={file.name}>{compact(file.name, 34)}</span>
              <StatusPill value={file.status} />
              <em title={file.documentProfileId !== "-" ? `${file.documentProfileId} · ${file.reason}` : file.reason}>{compact(file.documentProfileId !== "-" ? `${file.documentProfileId} · ${file.reason}` : file.reason, 78)}</em>
            </div>
          ))}
        </div>
      ) : null}


      {visibleLocalFiles.length > 0 ? (
        <div className="joker-file-ingestion-list" aria-label="Local files waiting for runtime ingestion">
          <strong>Local payload prepared</strong>
          {visibleLocalFiles.map((file) => (
            <div key={file.id} className="joker-file-ingestion-row">
              <span title={file.name}>{compact(file.name, 34)}</span>
              <StatusPill value={file.status} />
              <em title={file.reason}>{compact(file.reason, 78)}</em>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}



function DocumentRegistryCard({
  snapshot,
  compactMode = false
}: {
  snapshot: PublicDocumentRegistrySnapshot;
  compactMode?: boolean;
}) {
  const visibleProfiles = snapshot.profiles.slice(0, compactMode ? 4 : 8);


  return (
    <section className={["joker-document-registry-card", compactMode ? "is-compact" : ""].filter(Boolean).join(" ")} translate="no">
      <div className="joker-semantic-head">
        <div>
          <span className="joker-kicker">Cybernetic document registry</span>
          <h3>document_profiles · dynamic recall</h3>
        </div>
        <div className="joker-semantic-pills">
          <StatusPill label="Registry" value={snapshot.status} />
          <StatusPill label="Profiles" value={snapshot.profileCount} />
          <StatusPill label="Linked" value={snapshot.linkedMemoryCount} />
        </div>
      </div>


      <div className="joker-semantic-grid">
        <MetricCard label="Table" value={snapshot.table} />
        <MetricCard label="Persisted" value={snapshot.persistedCount} />
        <MetricCard label="Failed" value={snapshot.failedCount} />
        <MetricCard label="Reusable" value={snapshot.reusableCount} />
      </div>


      {visibleProfiles.length > 0 ? (
        <div className="joker-document-profile-list" aria-label="Document profiles available for dynamic recall">
          <strong>Document profile records</strong>
          {visibleProfiles.map((profile) => (
            <div key={`${profile.profileId}-${profile.fileHash}-${profile.memoryId}`} className="joker-document-profile-row">
              <div>
                <span title={profile.filename}>{compact(profile.filename, compactMode ? 30 : 42)}</span>
                <em title={profile.title}>{compact(profile.title, compactMode ? 38 : 64)}</em>
              </div>
              <StatusPill value={profile.textStatus} />
              <StatusPill label="Family" value={profile.docFamily} />
              <StatusPill label="Volume" value={profile.volume} />
              {!compactMode ? <StatusPill label="Kind" value={profile.canonicalDocumentKind} /> : null}
              <div>
                <span title={profile.memoryId}>{compact(profile.memoryId, compactMode ? 24 : 34)}</span>
                <em title={profile.canonicalAxis}>{compact(profile.canonicalAxis, compactMode ? 30 : 54)}</em>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="joker-file-ingestion-list">
          <strong>Document profile records</strong>
          <div className="joker-file-ingestion-row">
            <span>NO_DOCUMENT_PROFILES</span>
            <StatusPill value="NOT_AVAILABLE" />
            <em>Carica un file o richiama /api/files con includeProfiles=true per popolare il registry.</em>
          </div>
        </div>
      )}
    </section>
  );
}


function SemanticMemoryCard({
  snapshot,
  compactMode = false
}: {
  snapshot: PublicSemanticMemorySnapshot;
  compactMode?: boolean;
}) {
  const visibleTerms = snapshot.activatedTerms.slice(0, compactMode ? 6 : 12);
  const fallbackTopTerms = snapshot.topTerms.slice(0, compactMode ? 6 : 12);


  if (!snapshot.available) {
    return (
      <section className={["joker-semantic-card", compactMode ? "is-compact" : ""]
        .filter(Boolean)
        .join(" ")}
      >
        <div className="joker-semantic-head">
          <div>
            <span className="joker-kicker">Semantic memory</span>
            <h3>MEMORIA SEMANTICA ESOTEROLOGICA API CHAT</h3>
          </div>
          <div className="joker-semantic-pills">
            <StatusPill value="NOT_AVAILABLE" />
          </div>
        </div>
      </section>
    );
  }


  return (
    <section
      className={["joker-semantic-card", compactMode ? "is-compact" : ""]
        .filter(Boolean)
        .join(" ")}
      translate="no"
    >
      <div className="joker-semantic-head">
        <div>
          <span className="joker-kicker">Semantic memory</span>
          <h3>MEMORIA SEMANTICA ESOTEROLOGICA API CHAT</h3>
        </div>


        <div className="joker-semantic-pills">
          <StatusPill label="Quality" value={snapshot.quality} />
          <StatusPill label="Continuity" value={snapshot.continuityGain} />
          <StatusPill label="Coupling" value={snapshot.couplingState} />
        </div>
      </div>


      <div className="joker-semantic-grid">
        <MetricCard label="Memory ID" value={snapshot.memoryId} />
        <MetricCard label="Persistable" value={snapshot.persistable} />
        <MetricCard label="Threshold" value={snapshot.thresholdDetected} />
        <MetricCard label="saveRaw" value={snapshot.policy.saveRaw} />
        <MetricCard label="saveSynthesis" value={snapshot.policy.saveSynthesis} />
        <MetricCard label="Reusable" value={snapshot.policy.reusableInPrompt} />
        <MetricCard label="EVT" value={snapshot.source.evtId} />
        <MetricCard label="OPC" value={snapshot.source.opcId} />
        {!compactMode ? <MetricCard label="Human IPR" value={snapshot.ipr.humanIpr} /> : null}
        {!compactMode ? <MetricCard label="Runtime IPR" value={snapshot.ipr.runtimeIpr} /> : null}
        {!compactMode ? <MetricCard label="Persistence" value={snapshot.runtime.persistenceStatus} /> : null}
        {!compactMode ? <MetricCard label="legalCertification" value={snapshot.boundary.legalCertification} /> : null}
      </div>


      {visibleTerms.length > 0 ? (
        <div className="joker-semantic-terms" aria-label="Activated canonical terms">
          {visibleTerms.map((term) => (
            <span key={`${snapshot.memoryId}-${term.n}-${term.term}`} className="joker-semantic-term" title={term.matchedSignals.join(" · ") || term.term}>
              <b>{term.n}</b>
              <span>{term.term}</span>
              {term.score !== "-" ? <em>{term.score}</em> : null}
            </span>
          ))}
        </div>
      ) : fallbackTopTerms.length > 0 ? (
        <div className="joker-semantic-terms" aria-label="Top semantic terms">
          {fallbackTopTerms.map((term) => (
            <span key={`${snapshot.memoryId}-${term}`} className="joker-semantic-term">
              <span>{term}</span>
            </span>
          ))}
        </div>
      ) : null}


      {!compactMode ? (
        <div className="joker-semantic-axis">
          <div>
            <span>Decisione</span>
            <strong>{snapshot.primaryAxis.decision}</strong>
          </div>
          <div>
            <span>Costo</span>
            <strong>{snapshot.primaryAxis.cost}</strong>
          </div>
          <div>
            <span>Traccia</span>
            <strong>{snapshot.primaryAxis.trace}</strong>
          </div>
          <div>
            <span>Tempo</span>
            <strong>{snapshot.primaryAxis.time}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}



function formatUtcPlusTwoTemporalSnapshot(value: string): string {
  const visible = normalizeVisibleText(value || "");
  const parsed = Date.parse(visible);


  if (!Number.isFinite(parsed)) {
    return visible || "-";
  }


  const utcPlusTwo = new Date(parsed + 2 * 60 * 60 * 1000);
  const year = String(utcPlusTwo.getUTCFullYear()).padStart(4, "0");
  const month = String(utcPlusTwo.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcPlusTwo.getUTCDate()).padStart(2, "0");
  const hour = String(utcPlusTwo.getUTCHours()).padStart(2, "0");
  const minute = String(utcPlusTwo.getUTCMinutes()).padStart(2, "0");
  const second = String(utcPlusTwo.getUTCSeconds()).padStart(2, "0");


  return `${year}-${month}-${day} ${hour}:${minute}:${second} Torino / Italia / Europa · UTC+2`;
}


type TemporalDisplayValue = {
  utc: string;
  local: string;
  title: string;
};


function formatUtcAndRomeTemporalDisplay(value: string | null | undefined): TemporalDisplayValue {
  const visible = normalizeVisibleText(value || "");
  const parsed = Date.parse(visible);


  if (!visible || !Number.isFinite(parsed)) {
    const fallback = visible || "-";


    return {
      utc: fallback,
      local: fallback,
      title: fallback
    };
  }


  const date = new Date(parsed);
  const utc = date.toISOString();
  const local = new Intl.DateTimeFormat("it-IT", {
    timeZone: JOKER_C2_BIRTH_ANCHOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);


  return {
    utc,
    local: `${local} ${JOKER_C2_BIRTH_ANCHOR_TIMEZONE}`,
    title: `UTC ${utc} · ${JOKER_C2_BIRTH_ANCHOR_TIMEZONE} ${local}`
  };
}


function DualTimeSealCard({ seal }: { seal: DualTimeMessageSeal }) {
  const utcPlusTwoSnapshot = formatUtcPlusTwoTemporalSnapshot(seal.utcSnapshot);


  return (
    <div className="joker-dual-time-seal" translate="no" aria-label="JOKER-C2 Dual-Time Seal Torino Italia Europa UTC+2">
      <div className="joker-dual-time-seal-head">
        <strong>{seal.role === "MANUEL" ? "MANUEL · QUESTION" : seal.role === "SYSTEM" ? "SYSTEM · EVENT" : "JOKER-C2 · RESPONSE"}</strong>
        <span>{seal.status}</span>
      </div>


      <div className="joker-dual-time-rails">
        <div>
          <span>TORINO / ITALIA / EUROPA · UTC+2</span>
          <strong title={`Canonical UTC ${seal.utcSnapshot}`}>{utcPlusTwoSnapshot}</strong>
        </div>


        <div>
          <span>CYBER/LIFE</span>
          <strong>{seal.cyberneticLifetimeSnapshot}</strong>
        </div>
      </div>


      <div className="joker-dual-time-meta">
        <span title={seal.dualTimeHash}>Hash {compact(seal.dualTimeHash, 36)}</span>
        <span title={seal.utcSnapshot}>UTC technical {compact(seal.utcSnapshot, 38)}</span>
        <span title={seal.birthAnchorLocale}>Birth {compact(seal.birthAnchorLocale, 46)}</span>
        <span>legalCertification=false</span>
        {seal.evtId !== "-" ? <span title={seal.evtId}>EVT {compact(seal.evtId, 34)}</span> : null}
        {seal.opcId !== "-" ? <span title={seal.opcId}>OPC {compact(seal.opcId, 34)}</span> : null}
      </div>
    </div>
  );
}


function MessageBubble({
  message,
  onCopy,
  onSaveChatToIpr,
  onCopyRuntimeId,
  canSaveChatToIpr,
  isSavingChatToIpr
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onSaveChatToIpr: () => Promise<void>;
  onCopyRuntimeId: (label: string, value: string) => Promise<void>;
  canSaveChatToIpr: boolean;
  isSavingChatToIpr: boolean;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";
  const status = getRuntimeStatus(message.raw ?? null);
  const semanticMemory = getPublicSemanticMemorySnapshot(message.raw ?? null);
  const documentRegistry = getPublicDocumentRegistrySnapshot(message.raw ?? null);
  const messageMemoryId = firstUsableRuntimeValue([status.memoryId, semanticMemory.memoryId], "-");
  const messageEvtId = firstUsableRuntimeValue([status.responseEvt, status.aiEvt, semanticMemory.source.evtId], "-");
  const messageOpcId = firstUsableRuntimeValue([status.opc, semanticMemory.source.opcId], "-");
  const visibleContent = normalizeVisibleText(message.content);
  const cleanVisibleContent = isAssistant
    ? stripInlineTemporalRuntimeCertificate(visibleContent)
    : visibleContent;
  const messageSeal =
    message.temporalSeal ??
    buildDualTimeMessageSeal({
      role: message.role,
      messageId: message.id,
      payload: message.raw ?? null
    });
  const displayedContent =
    cleanVisibleContent ||
    (isAssistant
      ? "Dual-Time Seal rendered outside the response body."
      : "Dual-Time Seal rendered outside the message body.");


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


        <DualTimeSealCard seal={messageSeal} />


        <pre className="joker-message-text">{displayedContent}</pre>


        {isAssistant && message.raw ? (
          <div className="joker-runtime-strip">
            <StatusPill label="Model" value={status.model} />
            <StatusPill label="Level" value={status.modelLevel} />
            <StatusPill label="Runtime IPR" value={status.runtimeIpr} />
            <StatusPill label="AI EVT" value={status.aiEvt} />
            <StatusPill label="Response EVT" value={status.responseEvt} />
            <StatusPill label="OPC" value={status.opc} />
            <StatusPill label="Audit" value={status.auditId} />
            <StatusPill label="Usage" value={status.modelUsageId} />
            <StatusPill label="UTC technical" value={status.utcResponseTime} />
            <StatusPill label="Birth" value={status.runtimeBirth} />
            <StatusPill label="Age" value={status.runtimeAge} />
            <StatusPill label="B2G" value={status.b2gReadiness} />
            <StatusPill label="Human IPR" value={status.humanIpr} />
            <StatusPill label="Subject" value={status.subject} />
            <StatusPill label="MATRIX" value={status.matrix} />
            <StatusPill label="Memory" value={status.memory} />
            <StatusPill label="Mode" value={status.persistence} />
            {semanticMemory.available ? (
              <>
                <StatusPill label="Semantic" value={semanticMemory.quality} />
                <StatusPill label="Coupling" value={semanticMemory.couplingState} />
              </>
            ) : null}
            {documentRegistry.available ? (
              <StatusPill label="Docs" value={documentRegistry.profileCount} />
            ) : null}
          </div>
        ) : null}


        {isAssistant && semanticMemory.available ? (
          <SemanticMemoryCard snapshot={semanticMemory} compactMode />
        ) : null}


        {isAssistant && documentRegistry.available ? (
          <DocumentRegistryCard snapshot={documentRegistry} compactMode />
        ) : null}


        {isAssistant ? (
          <div className="joker-message-actions">
            <button type="button" onClick={() => onCopy(displayedContent)}>
              Copy response
            </button>


            <button type="button" onClick={() => void onCopyRuntimeId("IPR-MEM", messageMemoryId)} disabled={!isUsableCyberneticMemoryId(messageMemoryId)} title="Copia il memoryId esposto dalla risposta">
              Copy IPR-MEM
            </button>


            <button type="button" onClick={() => void onCopyRuntimeId("EVT", messageEvtId)} disabled={isBlankRuntimeValue(messageEvtId)} title="Copia l’EVT collegato alla risposta">
              Copy EVT
            </button>


            <button type="button" onClick={() => void onCopyRuntimeId("OPC", messageOpcId)} disabled={isBlankRuntimeValue(messageOpcId)} title="Copia l’OPC collegato alla risposta">
              Copy OPC
            </button>


            <button
              type="button"
              className="joker-save-ipr-button"
              onClick={() => void onSaveChatToIpr()}
              disabled={!canSaveChatToIpr || isSavingChatToIpr}
              title="Salva l’intera chat corrente su IPR come Intenzione Primaria Radicale"
            >
              {isSavingChatToIpr ? "Saving on IPR..." : "Salva questa chat su IPR"}
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
                  <MetricCard label="Audit ID" value={status.auditId} />
                  <MetricCard label="Audit persistence" value={status.auditPersistence} />
                  <MetricCard label="Usage ID" value={status.modelUsageId} />
                  <MetricCard label="Usage persistence" value={status.modelUsagePersistence} />
                  <MetricCard label="Accounting" value={status.accountingMode} />
                  <MetricCard label="Total tokens" value={status.totalTokens} />
                  <MetricCard label="Estimated cost minor" value={status.estimatedCostMinor} />
                  <MetricCard label="Canonical UTC response time" value={status.utcResponseTime} />
                  <MetricCard label="Temporal certificate" value={status.temporalCertificateStatus} />
                  <MetricCard label="Runtime birth" value={status.runtimeBirth} />
                  <MetricCard label="Runtime age" value={status.runtimeAge} />
                  <MetricCard label="Tenant" value={status.tenantId} />
                  <MetricCard label="Workspace" value={status.workspaceId} />
                  <MetricCard label="Subscription" value={status.subscriptionId} />
                  <MetricCard label="Account" value={status.accountId} />
                  <MetricCard label="Memory ID" value={status.memoryId} />
                  <MetricCard label="Registered event" value={status.registeredEventName} />
                  <MetricCard label="B2G readiness" value={status.b2gReadiness} />
                  {semanticMemory.available ? (
                    <>
                      <MetricCard label="Semantic memory" value={semanticMemory.memoryId} />
                      <MetricCard label="Semantic quality" value={semanticMemory.quality} />
                      <MetricCard label="Continuity gain" value={semanticMemory.continuityGain} />
                      <MetricCard label="Coupling state" value={semanticMemory.couplingState} />
                      <MetricCard label="saveRaw" value={semanticMemory.policy.saveRaw} />
                      <MetricCard label="saveSynthesis" value={semanticMemory.policy.saveSynthesis} />
                    </>
                  ) : null}
                  {documentRegistry.available ? (
                    <>
                      <MetricCard label="Document registry" value={documentRegistry.status} />
                      <MetricCard label="Document profiles" value={documentRegistry.profileCount} />
                      <MetricCard label="Linked profiles" value={documentRegistry.linkedMemoryCount} />
                      <MetricCard label="Registry table" value={documentRegistry.table} />
                    </>
                  ) : null}
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
  const [fileRegistryPayload, setFileRegistryPayload] = useState<JsonRecord | null>(null);
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
  const [clockNow, setClockNow] = useState<Date>(() => new Date());


  const [isLoadingIprMemory, setIsLoadingIprMemory] = useState(false);
  const [isSavingChatToIpr, setIsSavingChatToIpr] = useState(false);
  const [isRemovingIprMemoryId, setIsRemovingIprMemoryId] = useState<string | null>(null);
  const [iprMemoryError, setIprMemoryError] = useState<string | null>(null);
  const [iprMemoryNotice, setIprMemoryNotice] = useState<string | null>(null);
  const [iprMemoryDashboard, setIprMemoryDashboard] = useState<IprMemoryDashboardState>(
    EMPTY_IPR_MEMORY_DASHBOARD
  );
  const [cyberneticMemoryChain, setCyberneticMemoryChain] = useState<CyberneticMemoryChainState>(
    EMPTY_CYBERNETIC_MEMORY_CHAIN
  );
  const [isCheckingCyberneticMemory, setIsCheckingCyberneticMemory] = useState(false);


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
  const dashboardSemanticMemory = getPublicSemanticMemorySnapshot(dashboardPayload);
  const dashboardFileIngestion = getPublicFileIngestionSnapshot(dashboardPayload);
  const dashboardDocumentRegistry = getPublicDocumentRegistrySnapshot(dashboardPayload, fileRegistryPayload);
  const linkedDocumentProfiles = dashboardDocumentRegistry.profiles.filter(isLinkedDocumentProfile);
  const localPromptReadyCount = files.filter((file) =>
    ["TEXT_READY", "PDF_CLIENT_PAYLOAD_READY", "PDF_INGESTION_READY"].includes(file.status)
  ).length;
  const localPdfPayloadCount = files.filter((file) => file.status === "PDF_CLIENT_PAYLOAD_READY").length;
  const liveTemporal = useMemo(() => buildJokerTemporalRuntimeSnapshot(clockNow), [clockNow]);
  const effectiveRuntimeBirth = firstDisplayValue(
    [dashboardStatus.runtimeBirth],
    JOKER_C2_BIRTH_ANCHOR_LOCAL
  );
  const effectiveRuntimeBirthUtc = firstDisplayValue(
    [dashboardStatus.runtimeBirthUtc],
    JOKER_C2_BIRTH_ANCHOR_UTC
  );
  const effectiveTemporalCertificateStatus =
    effectiveRuntimeBirth === JOKER_C2_BIRTH_ANCHOR_LOCAL
      ? liveTemporal.certificateStatus
      : "FAIL_TEMPORAL_ANCHOR";


  const sessionHumanIpr = getSessionHumanIpr(iprSession);
  const handoffHumanIpr = getHandoffSubjectIpr(effectiveHandoff);


  const humanIpr = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.humanIpr : "",
      sessionHumanIpr,
      handoffHumanIpr,
      hasAccountSession ? CANONICAL_MANUEL_HUMAN_IPR : "",
      HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED ? CANONICAL_MANUEL_HUMAN_IPR : "",
      dashboardStatus.humanIpr
    ],
    "NOT_VERIFIED"
  );


  const subject = firstDisplayValue(
    [
      lastAssistantPayload && !isNegativeRuntimeValue(dashboardStatus.humanIpr)
        ? dashboardStatus.subject
        : "",
      getSessionSubjectName(iprSession, humanIpr),
      getHandoffSubjectName(effectiveHandoff, humanIpr),
      humanIpr === CANONICAL_MANUEL_HUMAN_IPR ? CANONICAL_MANUEL_DISPLAY_NAME : "",
      dashboardStatus.subject
    ],
    "No verified subject"
  );


  const certificateId = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.certificateId : "",
      getSessionCertificateId(iprSession),
      getHandoffCertificateId(effectiveHandoff),
      HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED ? HBCE_SELF_PILOT_CERTIFICATE_ID : "",
      dashboardStatus.certificateId
    ],
    "NO_CERTIFICATE"
  );


  const certificateStatus = firstDisplayValue(
    [
      lastAssistantPayload && isActiveCertificateStatus(dashboardStatus.certificateStatus)
        ? dashboardStatus.certificateStatus
        : "",
      getSessionCertificateStatus(iprSession),
      getHandoffCertificateStatus(effectiveHandoff),
      HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED ? HBCE_SELF_PILOT_CERTIFICATE_STATUS : "",
      dashboardStatus.certificateStatus
    ],
    "MISSING"
  );


  const scope = firstUsableRuntimeValue(
    [
      lastAssistantPayload && hasJokerC2Scope(dashboardStatus.scope)
        ? dashboardStatus.scope
        : "",
      getSessionScope(iprSession),
      getHandoffScope(effectiveHandoff),
      HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED ? HBCE_SELF_PILOT_SCOPE : "",
      dashboardStatus.scope
    ],
    "MATRIX_LIMITED"
  );


  const selfPilotMemoryScopeBridgeReady =
    HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED &&
    humanIpr === CANONICAL_MANUEL_HUMAN_IPR &&
    certificateId === HBCE_SELF_PILOT_CERTIFICATE_ID &&
    isActiveCertificateStatus(certificateStatus) &&
    hasJokerC2Scope(scope);


  const accountIdentityReady =
    hasAccountSession &&
    !isNegativeRuntimeValue(humanIpr) &&
    !isNegativeRuntimeValue(certificateId) &&
    isActiveCertificateStatus(certificateStatus) &&
    hasJokerC2Scope(scope);


  const accessDecision = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.accessDecision : "",
      accountIdentityReady ? "ACCESS_GRANTED_ACCOUNT_SESSION" : "",
      selfPilotMemoryScopeBridgeReady ? HBCE_SELF_PILOT_ACCESS_DECISION : "",
      first(iprSession, [["access", "decision"], ["access", "accessDecision"]], ""),
      dashboardStatus.accessDecision
    ],
    "SERVER_VALIDATION_REQUIRED"
  );


  const identityBinding = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.identityBinding : "",
      accountIdentityReady ? "IPR_VERIFIED_BIOLOGICAL_SUBJECT" : "",
      selfPilotMemoryScopeBridgeReady ? HBCE_SELF_PILOT_IDENTITY_BINDING : "",
      first(iprSession, [["access", "identityBinding"], ["access", "identity_binding"]], ""),
      dashboardStatus.identityBinding
    ],
    "NOT_VERIFIED"
  );


  const matrixState = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.matrix : "",
      accountIdentityReady ? "MATRIX_ACCOUNT_SESSION_READY" : "",
      selfPilotMemoryScopeBridgeReady ? HBCE_SELF_PILOT_MATRIX_STATE : "",
      first(iprSession, [["matrix", "state"], ["access", "matrixState"]], ""),
      dashboardStatus.matrix
    ],
    "MATRIX_LIMITED"
  );


  const memoryScope = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.memory : "",
      accountIdentityReady ? "IPR_BOUND_ACCOUNT_SESSION_READY" : "",
      selfPilotMemoryScopeBridgeReady ? HBCE_SELF_PILOT_MEMORY_SCOPE : "",
      first(iprSession, [["memory", "scope"], ["access", "semanticMemoryScope"]], ""),
      dashboardStatus.memory
    ],
    "RUNTIME_ONLY"
  );


  const memoryAuthority = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.authority : "",
      accountIdentityReady ? "SERVER_ACCOUNT_SESSION_VALIDATED" : "",
      selfPilotMemoryScopeBridgeReady ? HBCE_SELF_PILOT_MEMORY_AUTHORITY : "",
      first(iprSession, [["memory", "authority"]], ""),
      dashboardStatus.authority
    ],
    "RUNTIME_HEALTH_CHECK"
  );


  const saasTier = firstUsableRuntimeValue(
    [
      lastAssistantPayload ? dashboardStatus.saasTier : "",
      accountIdentityReady ? "IPR" : "",
      selfPilotMemoryScopeBridgeReady ? "SELF_PILOT" : "",
      dashboardStatus.saasTier
    ],
    "-"
  );


  const enrichedIprHandoff = buildEnrichedIprHandoff({
    base: effectiveHandoff,
    subject,
    humanIpr,
    certificateId,
    certificateStatus,
    scope,
    accessDecision,
    identityBinding
  });


  const activeTenantId = firstUsableRuntimeValue(
    [
      dashboardStatus.tenantId,
      first(iprSession, [["session", "tenantId"], ["accountProfile", "tenantId"]], "")
    ],
    HBCE_SELF_PILOT_TENANT_ID
  );


  const activeWorkspaceId = firstUsableRuntimeValue(
    [
      dashboardStatus.workspaceId,
      first(iprSession, [["session", "workspaceId"], ["accountProfile", "workspaceId"]], "")
    ],
    HBCE_SELF_PILOT_WORKSPACE_ID
  );


  const activeSubscriptionId = firstUsableRuntimeValue(
    [
      dashboardStatus.subscriptionId,
      first(iprSession, [["session", "subscriptionId"], ["accountProfile", "subscriptionId"]], "")
    ],
    HBCE_SELF_PILOT_SUBSCRIPTION_ID
  );


  const activeAccountId = firstUsableRuntimeValue(
    [
      dashboardStatus.accountId,
      first(iprSession, [["session", "accountId"], ["accountProfile", "accountId"]], "")
    ],
    HBCE_SELF_PILOT_ACCOUNT_ID
  );


  const activeThreadId = firstUsableRuntimeValue(
    [dashboardStatus.threadId, sessionId],
    sessionId || "JOKER-UI-UNINITIALIZED"
  );


  const selfPilotMemoryScopeBridgeApplied =
    selfPilotMemoryScopeBridgeReady &&
    activeTenantId === HBCE_SELF_PILOT_TENANT_ID &&
    activeWorkspaceId === HBCE_SELF_PILOT_WORKSPACE_ID;


  const canUseIprMemory =
    !isNegativeRuntimeValue(humanIpr) &&
    !isNegativeRuntimeValue(activeTenantId) &&
    !isNegativeRuntimeValue(activeWorkspaceId);


  const currentPrimaryIntention = getLatestUserIntention(messages);
  const currentThreadTitle = getChatThreadTitle(messages, activeThreadId);


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
    if (!sessionId || !canUseIprMemory) return;

    void refreshIprMemoryDashboard();
  }, [sessionId, humanIpr, activeTenantId, activeWorkspaceId]);


  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockNow(new Date());
    }, 1000);


    return () => window.clearInterval(intervalId);
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


  async function checkIprSession(): Promise<IprSessionResponse | null> {
    setIsCheckingSession(true);
    setIprSessionError(null);


    try {
      const snapshot = await fetchIprSessionSnapshot();


      setIprSession(snapshot.payload);
      setIprSessionError(snapshot.error);


      return snapshot.payload;
    } finally {
      setIsCheckingSession(false);
    }
  }


  async function resolveRequestIdentityContext(): Promise<{
    iprHandoff: JsonRecord | null;
    iprAccountSession: JsonRecord | null;
  }> {
    const browserHandoffResult = loadIprHandoffFromBrowser();


    setIprHandoff(browserHandoffResult.handoff);
    setIprHandoffSource(browserHandoffResult.source);
    setIprHandoffError(browserHandoffResult.error);


    const sessionSnapshot = await fetchIprSessionSnapshot();


    setIprSession(sessionSnapshot.payload);
    setIprSessionError(sessionSnapshot.error);


    const activeSession = sessionSnapshot.payload ?? iprSession;


    const activeSessionHandoff = isRecord(activeSession?.reconstructedIprHandoff)
      ? activeSession.reconstructedIprHandoff
      : isRecord(activeSession?.accountProfile)
        ? activeSession.accountProfile
        : null;


    const activeBaseHandoff =
      activeSessionHandoff ||
      browserHandoffResult.handoff ||
      effectiveHandoff ||
      iprHandoff;


    const activeHasAccountSession =
      activeSession?.authenticated === true || hasAccountSession;


    const requestHumanIpr = firstUsableRuntimeValue(
      [
        getSessionHumanIpr(activeSession),
        getHandoffSubjectIpr(activeBaseHandoff),
        activeHasAccountSession ? CANONICAL_MANUEL_HUMAN_IPR : "",
        humanIpr
      ],
      "NOT_VERIFIED"
    );


    const requestSubject = firstDisplayValue(
      [
        getSessionSubjectName(activeSession, requestHumanIpr),
        getHandoffSubjectName(activeBaseHandoff, requestHumanIpr),
        requestHumanIpr === CANONICAL_MANUEL_HUMAN_IPR
          ? CANONICAL_MANUEL_DISPLAY_NAME
          : "",
        subject
      ],
      "No verified subject"
    );


    const requestCertificateId = firstUsableRuntimeValue(
      [
        getSessionCertificateId(activeSession),
        getHandoffCertificateId(activeBaseHandoff),
        certificateId
      ],
      "NO_CERTIFICATE"
    );


    const requestCertificateStatus = firstDisplayValue(
      [
        getSessionCertificateStatus(activeSession),
        getHandoffCertificateStatus(activeBaseHandoff),
        certificateStatus
      ],
      "MISSING"
    );


    const requestScope = firstUsableRuntimeValue(
      [
        getSessionScope(activeSession),
        getHandoffScope(activeBaseHandoff),
        scope
      ],
      "MATRIX_LIMITED"
    );


    const requestIdentityReady =
      activeHasAccountSession &&
      !isNegativeRuntimeValue(requestHumanIpr) &&
      !isNegativeRuntimeValue(requestCertificateId) &&
      isActiveCertificateStatus(requestCertificateStatus) &&
      hasJokerC2Scope(requestScope);


    const requestAccessDecision = firstUsableRuntimeValue(
      [
        requestIdentityReady ? "ACCESS_GRANTED_ACCOUNT_SESSION" : "",
        first(activeSession, [["access", "decision"], ["access", "accessDecision"]], ""),
        accessDecision
      ],
      "SERVER_VALIDATION_REQUIRED"
    );


    const requestIdentityBinding = firstUsableRuntimeValue(
      [
        requestIdentityReady ? "IPR_VERIFIED_BIOLOGICAL_SUBJECT" : "",
        first(activeSession, [["access", "identityBinding"], ["access", "identity_binding"]], ""),
        identityBinding
      ],
      "NOT_VERIFIED"
    );


    const requestHandoff = buildEnrichedIprHandoff({
      base: activeBaseHandoff,
      subject: requestSubject,
      humanIpr: requestHumanIpr,
      certificateId: requestCertificateId,
      certificateStatus: requestCertificateStatus,
      scope: requestScope,
      accessDecision: requestAccessDecision,
      identityBinding: requestIdentityBinding
    });


    if (requestHandoff) {
      persistHandoff(requestHandoff);
      setIprHandoff(requestHandoff);
      setIprHandoffSource(activeSessionHandoff ? "accountSession" : browserHandoffResult.source);
    }


    const requestAccountSession =
      activeSession?.authenticated === true
        ? {
            source: "IPR_ACCOUNT_SESSION",
            session: activeSession.session,
            accountProfile: activeSession.accountProfile,
            reconstructedIprHandoff: activeSession.reconstructedIprHandoff,
            access: activeSession.access,
            memory: activeSession.memory,
            matrix: activeSession.matrix,
            legalCertification: false
          }
        : null;


    return {
      iprHandoff: requestHandoff,
      iprAccountSession: requestAccountSession
    };
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


  function buildIprMemoryRequestBase(): JsonRecord {
    return {
      humanIpr,
      runtimeIpr: dashboardStatus.runtimeIpr,
      tenantId: activeTenantId,
      workspaceId: activeWorkspaceId,
      subscriptionId: activeSubscriptionId,
      accountId: activeAccountId,
      sessionId,
      threadId: activeThreadId,
      certificateId,
      certificateStatus,
      scope,
      accessDecision,
      identityBinding,
      matrixState,
      memoryScope,
      memoryAuthority,
      iprHandoff: enrichedIprHandoff,
      identityTransport: {
        source: selfPilotMemoryScopeBridgeApplied
          ? "SELF_PILOT_MEMORY_SCOPE_BRIDGE"
          : hasAccountSession
            ? "IPR_ACCOUNT_SESSION"
            : enrichedIprHandoff
              ? "IPR_HANDOFF"
              : "NO_IPR_CONTEXT",
        interfaceRevision: INTERFACE_REVISION,
        legalCertification: false
      },
      selfPilotMemoryScopeBridge: {
        enabled: HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED,
        applied: selfPilotMemoryScopeBridgeApplied,
        reason: selfPilotMemoryScopeBridgeApplied
          ? "UI_SELF_PILOT_MEMORY_SCOPE_READY"
          : "SERVER_OR_HANDOFF_SCOPE",
        legalCertification: false
      },
      interfaceRevision: INTERFACE_REVISION,
      strictIdentity: true,
      legalCertification: false
    };
  }


  async function refreshIprMemoryDashboard() {
    if (!canUseIprMemory) {
      setIprMemoryError("IPR memory requires verified Human IPR, tenant and workspace. Self-pilot scope bridge did not activate.");
      return;
    }


    setIsLoadingIprMemory(true);
    setIprMemoryError(null);


    try {
      const base = buildIprMemoryRequestBase();

      const [recentResponse, recordsResponse, recallResponse] = await Promise.all([
        fetch("/api/ipr-memory/recent", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            ...base,
            includeArchived: false,
            includeMessages: false,
            includeMemorySaves: true,
            includeReusableMemory: true,
            limit: 10,
            messageLimit: 20
          })
        }),
        fetch("/api/ipr-memory/records", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            ...base,
            includeInactive: false,
            includeMemorySaves: true,
            includeRegisteredEvents: true,
            includeDocumentProfiles: true,
            onlyLinkedDocumentProfiles: false,
            reusableInPrompt: true,
            limit: 10
          })
        }),
        fetch("/api/ipr-memory/recall", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            ...base,
            query: currentPrimaryIntention,
            currentMessage: message,
            includePromptBlock: true,
            includeRecords: false,
            includeDiagnostics: true,
            limit: 6,
            promptMaxChars: 4000
          })
        })
      ]);


      const recentPayload = await readJsonResponse<JsonRecord>(recentResponse);
      const recordsPayload = await readJsonResponse<JsonRecord>(recordsResponse);
      const recallPayload = await readJsonResponse<JsonRecord>(recallResponse);


      if (!recentResponse.ok || recentPayload.ok === false) {
        throw new Error(text(recentPayload.error, `RECENT_HTTP_${recentResponse.status}`));
      }


      if (!recordsResponse.ok || recordsPayload.ok === false) {
        throw new Error(text(recordsPayload.error, `RECORDS_HTTP_${recordsResponse.status}`));
      }


      if (!recallResponse.ok || recallPayload.ok === false) {
        throw new Error(text(recallPayload.error, `RECALL_HTTP_${recallResponse.status}`));
      }


      setIprMemoryDashboard({
        recentThreads: jsonRecords(recentPayload.threads),
        memorySaves: [
          ...jsonRecords(recentPayload.memorySaves),
          ...jsonRecords(recordsPayload.memorySaves)
        ],
        memoryRecords: jsonRecords(recordsPayload.memoryRecords),
        registeredEvents: jsonRecords(recordsPayload.registeredEvents),
        recallItems: jsonRecords(recallPayload.recallItems),
        promptMemoryBlock: text(recallPayload.promptMemoryBlock, ""),
        lastRefreshUtc: new Date().toISOString()
      });
      setFileRegistryPayload(recordsPayload);
      setIprMemoryNotice("IPR memory dashboard refreshed.");
    } catch (err) {
      setIprMemoryError(err instanceof Error ? err.message : "IPR_MEMORY_REFRESH_FAILED");
    } finally {
      setIsLoadingIprMemory(false);
    }
  }


  async function checkCyberneticMemoryRecordStatus(memoryIdOverride?: string) {
    const memoryId = memoryIdOverride || cyberneticMemoryChain.memoryId;

    if (!isUsableCyberneticMemoryId(memoryId)) {
      setIprMemoryError("No valid IPR-MEM memoryId available for record-status verification.");
      return null;
    }

    if (!canUseIprMemory) {
      setIprMemoryError("Cannot verify IPR memory chain without verified Human IPR, tenant and workspace. Self-pilot scope bridge did not activate.");
      return null;
    }

    setIsCheckingCyberneticMemory(true);
    setIprMemoryError(null);

    try {
      const query = new URLSearchParams({ memoryId, humanIpr, tenantId: activeTenantId, workspaceId: activeWorkspaceId, includeDocumentRegistry: "true", strictIdentity: "true" });
      const response = await fetch(`/api/ipr-memory/record-status?${query.toString()}`, { method: "GET", cache: "no-store", credentials: "include", headers: { Accept: "application/json" } });
      const payload = await readJsonResponse<JsonRecord>(response);

      if (!response.ok || payload.ok === false) {
        throw new Error(text(payload.error, `RECORD_STATUS_HTTP_${response.status}`));
      }

      const nextChain = buildCyberneticMemoryChainSnapshot(payload, { ...cyberneticMemoryChain, memoryId, source: "RECORD_STATUS_VERIFICATION", updatedAt: new Date().toISOString() });
      setCyberneticMemoryChain(nextChain);
      setIprMemoryNotice(`Record-status verified. memoryId=${nextChain.memoryId} · EVT=${nextChain.evtId} · OPC=${nextChain.opcId} · docs=${nextChain.linkedProfileCount}`);
      return nextChain;
    } catch (err) {
      setIprMemoryError(err instanceof Error ? err.message : "CYBERNETIC_MEMORY_STATUS_FAILED");
      return null;
    } finally {
      setIsCheckingCyberneticMemory(false);
    }
  }


  async function bindCurrentIprMemoryToEvt() {
    const verifiedChain = await checkCyberneticMemoryRecordStatus();
    if (!verifiedChain) return;
    if (isBlankRuntimeValue(verifiedChain.evtId)) {
      setIprMemoryError("IPR memory exists, but no EVT is exposed yet. The save-chat route must persist or expose evtId before SaaS-grade binding.");
      return;
    }
    setIprMemoryNotice(`IPR→EVT binding verified. memoryId=${verifiedChain.memoryId} · evtId=${verifiedChain.evtId}`);
  }


  async function bindCurrentEvtToOpc() {
    const verifiedChain = await checkCyberneticMemoryRecordStatus();
    if (!verifiedChain) return;
    if (isBlankRuntimeValue(verifiedChain.evtId)) {
      setIprMemoryError("Cannot verify EVT→OPC because no EVT is exposed by the selected memory.");
      return;
    }
    if (isBlankRuntimeValue(verifiedChain.opcId)) {
      setIprMemoryError("EVT is present, but no OPC proof is exposed yet. The chain is not SaaS-grade until OPC is linked.");
      return;
    }
    setIprMemoryNotice(`EVT→OPC binding verified. evtId=${verifiedChain.evtId} · opcId=${verifiedChain.opcId} · legalCertification=false`);
  }


  async function injectCurrentIprMemoryIntoChat() {
    if (!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId)) {
      setIprMemoryError("No valid IPR-MEM memoryId available to inject into chat.");
      return;
    }
    await sendMessage(buildCyberneticMemoryRecallPrompt(cyberneticMemoryChain));
  }


  async function askChatToVerifyIprEvtBinding() {
    if (!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId)) {
      setIprMemoryError("No valid IPR-MEM memoryId available for IPR→EVT chat verification.");
      return;
    }
    await sendMessage(buildCyberneticEvtBindingPrompt(cyberneticMemoryChain));
  }


  async function askChatToVerifyEvtOpcBinding() {
    if (!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId)) {
      setIprMemoryError("No valid IPR-MEM memoryId available for EVT→OPC chat verification.");
      return;
    }
    await sendMessage(buildCyberneticOpcBindingPrompt(cyberneticMemoryChain));
  }


  async function copyRuntimeId(label: string, value: string) {
    if (isBlankRuntimeValue(value)) {
      setIprMemoryError(`${label} is not available for copy.`);
      return;
    }
    await copyText(value);
    setIprMemoryNotice(`${label} copied: ${value}`);
  }


  async function saveCurrentChatToIpr() {
    if (messages.length === 0) {
      setIprMemoryError("No chat messages available to save on IPR.");
      return;
    }


    if (!canUseIprMemory) {
      setIprMemoryError("Cannot save chat on IPR without verified Human IPR, tenant and workspace. Self-pilot scope bridge did not activate.");
      return;
    }


    setIsSavingChatToIpr(true);
    setIprMemoryError(null);
    setIprMemoryNotice(null);


    try {
      const response = await fetch("/api/ipr-memory/save-chat", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          confirmSaveToIpr: true,
          humanIpr,
          runtimeIpr: dashboardStatus.runtimeIpr,
          tenantId: activeTenantId,
          workspaceId: activeWorkspaceId,
          subscriptionId: activeSubscriptionId,
          accountId: activeAccountId,
          certificateId,
          certificateStatus,
          scope,
          accessDecision,
          identityBinding,
          matrixState,
          memoryScope,
          memoryAuthority,
          iprHandoff: enrichedIprHandoff,
          identityTransport: {
            source: selfPilotMemoryScopeBridgeApplied
              ? "SELF_PILOT_MEMORY_SCOPE_BRIDGE"
              : hasAccountSession
                ? "IPR_ACCOUNT_SESSION"
                : enrichedIprHandoff
                  ? "IPR_HANDOFF"
                  : "NO_IPR_CONTEXT",
            interfaceRevision: INTERFACE_REVISION,
            legalCertification: false
          },
          selfPilotMemoryScopeBridge: {
            enabled: HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED,
            applied: selfPilotMemoryScopeBridgeApplied,
            legalCertification: false
          },
          interfaceRevision: INTERFACE_REVISION,
          sessionId,
          threadId: activeThreadId,
          threadTitle: currentThreadTitle,
          memoryTitle: `IPR · ${currentThreadTitle}`,
          memorySummary: `Intenzione Primaria Radicale: ${currentPrimaryIntention}`,
          primaryIntention: currentPrimaryIntention,
          radicalIntention: currentPrimaryIntention,
          saveIntent: "USER_EXPLICIT_SAVE_TO_IPR",
          saveScope: "IPR_BOUND",
          classification: "USER_SELECTED_CHAT_MEMORY",
          evtId: dashboardStatus.responseEvt,
          opcProofId: dashboardStatus.opc,
          auditId: dashboardStatus.auditId,
          usageId: dashboardStatus.modelUsageId,
          selectedMessageIds: messages.map((item) => item.id),
          messages: buildIprSaveMessages(messages),
          activeFiles: files.map((file) => ({
            fileId: file.id,
            id: file.id,
            filename: file.name,
            name: file.name,
            fileHash: file.fileHash,
            mimeType: file.mimeType,
            status: file.status,
            mode: file.mode,
            textLength: file.textLength,
            documentProfileId: file.documentProfileId ?? null,
            documentProfileStatus: file.documentProfileStatus ?? null,
            legalCertification: false
          })),
          documentProfiles: dashboardDocumentRegistry.profiles.map((profile) => ({
            profileId: profile.profileId,
            fileId: profile.fileId,
            filename: profile.filename,
            fileHash: profile.fileHash,
            docFamily: profile.docFamily,
            volume: profile.volume,
            title: profile.title,
            memoryId: profile.memoryId,
            profileStatus: profile.profileStatus,
            reusableInPrompt: profile.reusableInPrompt,
            legalCertification: false
          })),
          documentRegistry: {
            source: dashboardDocumentRegistry.source,
            table: dashboardDocumentRegistry.table,
            profileCount: dashboardDocumentRegistry.profileCount,
            linkedMemoryCount: dashboardDocumentRegistry.linkedMemoryCount,
            legalCertification: false
          },
          messageCount: messages.length,
          saveRaw: false,
          saveSynthesis: true,
          reusableInPrompt: true,
          rawContentSaved: false,
          rawContentPolicy: "SYNTHESIS_ONLY_BY_DEFAULT",
          createThreadIfMissing: true,
          persistProvidedMessages: true,
          strictIdentity: true,
          temporalCertificate: {
            status: effectiveTemporalCertificateStatus,
            nodeClock: liveTemporal.utcClock,
            responseUtc: liveTemporal.utcResponseTime,
            birthAnchorLocal: JOKER_C2_BIRTH_ANCHOR_LOCAL,
            birthAnchorUtc: JOKER_C2_BIRTH_ANCHOR_UTC,
            jokerLifetime: liveTemporal.lifeHuman,
            jokerLifeSeconds: liveTemporal.lifeSeconds,
            legalCertification: false
          },
          metadata: {
            source: "JOKER_C2_INTERFACE_SAVE_CHAT_BUTTON",
            iprMeaning: {
              identityPrimaryRecord: "Identity Primary Record",
              intenzionePrimariaRadicale: "Intenzione Primaria Radicale"
            },
            uiSessionId: sessionId,
            savedAt: new Date().toISOString(),
            legalCertification: false
          }
        })
      });


      const payload = await readJsonResponse<JsonRecord>(response);


      if (!response.ok || payload.ok === false) {
        throw new Error(text(payload.error, `SAVE_CHAT_HTTP_${response.status}`));
      }


      const savedChatId = first(payload, [["savedChatId"]], "-");
      const memoryId = first(payload, [["memoryId"]], "-");
      const evtId = firstUsableRuntimeValue([first(payload, [["evtId"], ["lastEvtId"], ["responseEvt"], ["evt", "id"]], ""), dashboardStatus.responseEvt], "-");
      const opcId = firstUsableRuntimeValue([first(payload, [["opcId"], ["opcProofId"], ["opc"], ["opc", "id"]], ""), dashboardStatus.opc], "-");
      const savedChain = buildCyberneticMemoryChainSnapshot(payload, {
        memoryId,
        savedChatId,
        evtId,
        opcId,
        auditId: firstUsableRuntimeValue([first(payload, [["auditId"]], ""), dashboardStatus.auditId], "-"),
        usageId: firstUsableRuntimeValue([first(payload, [["usageId"], ["modelUsageId"]], ""), dashboardStatus.modelUsageId], "-"),
        status: "ACTIVE_REUSABLE",
        promptEligible: "true",
        reusableInPrompt: "true",
        source: "SAVE_CHAT_TO_IPR",
        updatedAt: new Date().toISOString()
      });

      setCyberneticMemoryChain(savedChain);
      setIprMemoryNotice(`Chat saved on IPR. savedChatId=${savedChatId} · memoryId=${memoryId} · EVT=${savedChain.evtId} · OPC=${savedChain.opcId}`);
      await refreshIprMemoryDashboard();

      if (isUsableCyberneticMemoryId(memoryId)) {
        void checkCyberneticMemoryRecordStatus(memoryId);
      }
    } catch (err) {
      setIprMemoryError(err instanceof Error ? err.message : "IPR_CHAT_SAVE_FAILED");
    } finally {
      setIsSavingChatToIpr(false);
    }
  }


  function selectIprMemoryRecordForCyberneticChain(record: JsonRecord, source: "memory-record" | "recall-item" | "recent-chat" | "document-profile") {
    const memoryId = getIprMemoryRecordMemoryId(record);
    if (!memoryId) {
      setIprMemoryError("Cannot select this item for the cybernetic chain because no IPR-MEM memoryId is exposed.");
      return;
    }

    const nextChain = buildCyberneticMemoryChainSnapshot(record, {
      memoryId,
      savedChatId: getIprMemoryRecordSavedChatId(record),
      evtId: getIprMemoryRecordEvtId(record),
      opcId: getIprMemoryRecordOpcId(record),
      status: first(record, [["memoryStatus"], ["status"]], "SELECTED"),
      promptEligible: firstDisplayValue([booleanLike(getPath(record, ["promptEligible"]), ""), first(record, [["promptEligible"]], "")], "false"),
      reusableInPrompt: firstDisplayValue([booleanLike(getPath(record, ["reusableInPrompt"]), ""), first(record, [["reusableInPrompt"]], "")], "false"),
      source,
      updatedAt: new Date().toISOString()
    });

    setCyberneticMemoryChain(nextChain);
    setIprMemoryNotice(`Selected cybernetic memory chain. memoryId=${nextChain.memoryId} · EVT=${nextChain.evtId} · OPC=${nextChain.opcId}`);
  }


  function selectDocumentProfileForCyberneticChain(profile: PublicDocumentProfileSnapshot) {
    if (!isLinkedDocumentProfile(profile)) {
      setIprMemoryError("Cannot select this document profile because it is not linked to an IPR-MEM memoryId yet.");
      return;
    }

    const record = getDocumentProfileChainRecord(profile);
    const nextChain = buildCyberneticMemoryChainSnapshot(record, {
      memoryId: profile.memoryId,
      savedChatId: profile.sourceSavedChatId,
      evtId: profile.lastEvtId,
      opcId: profile.lastOpcProofId,
      auditId: profile.auditId,
      usageId: profile.usageId,
      status: profile.profileStatus || "ACTIVE",
      promptEligible: "true",
      reusableInPrompt: profile.reusableInPrompt,
      source: "document-profile",
      recordStatus: "ACTIVE_REUSABLE",
      documentRegistryStatus: "AVAILABLE",
      linkedProfileCount: "1",
      updatedAt: new Date().toISOString()
    });

    setCyberneticMemoryChain(nextChain);
    setIprMemoryNotice(`Selected document profile chain. profileId=${profile.profileId} · memoryId=${nextChain.memoryId} · volume=${profile.volume}`);
  }


  async function removeIprMemoryRecordFromRecall(record: JsonRecord, source: "memory-record" | "recall-item" | "recent-chat") {
    const memoryId = getIprMemoryRecordMemoryId(record);


    if (!memoryId) {
      setIprMemoryError("Cannot remove this IPR item because no memoryId is exposed by the dashboard payload.");
      return;
    }


    if (!canUseIprMemory) {
      setIprMemoryError("Cannot remove IPR memory without verified Human IPR, tenant and workspace. Self-pilot scope bridge did not activate.");
      return;
    }


    const title = getIprMemoryRecordTitle(record);
    const confirmed = window.confirm(
      `Rimuovere questa memoria dal recall IPR?\n\n${memoryId}\n${compact(title, 140)}\n\nIl record verrà disattivato, non cancellato fisicamente. legalCertification=false`
    );


    if (!confirmed) return;


    setIsRemovingIprMemoryId(memoryId);
    setIprMemoryError(null);
    setIprMemoryNotice(null);


    try {
      const response = await fetch("/api/ipr-memory/delete-record", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          memoryId,
          humanIpr,
          tenantId: activeTenantId,
          workspaceId: activeWorkspaceId,
          confirmDeleteFromIpr: true,
          deleteMode: "SOFT_DELETE",
          reason: "USER_EXPLICIT_REMOVE_FROM_IPR_RECALL",
          strictIdentity: true,
          source,
          interfaceRevision: INTERFACE_REVISION,
          legalCertification: false
        })
      });


      const payload = await readJsonResponse<JsonRecord>(response);


      if (!response.ok || payload.ok === false) {
        throw new Error(text(payload.error, `DELETE_RECORD_HTTP_${response.status}`));
      }


      const removedFromRecall = booleanLike(getPath(payload, ["removedFromRecall"]), "true");
      const status = first(payload, [["status"]], "IPR_MEMORY_RECORD_DISABLED");


      setIprMemoryNotice(
        `IPR memory removed from recall. memoryId=${memoryId} · status=${status} · removedFromRecall=${removedFromRecall}`
      );
      if (cyberneticMemoryChain.memoryId === memoryId) {
        setCyberneticMemoryChain({ ...cyberneticMemoryChain, status: "DELETED", promptEligible: "false", reusableInPrompt: "false", recordStatus: status, updatedAt: new Date().toISOString() });
      }
      await refreshIprMemoryDashboard();
    } catch (err) {
      setIprMemoryError(err instanceof Error ? err.message : "IPR_MEMORY_DELETE_FAILED");
    } finally {
      setIsRemovingIprMemoryId(null);
    }
  }


  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const inputFiles = event.target.files;


    if (!inputFiles || inputFiles.length === 0) return;


    setError(null);


    try {
      const selected = Array.from(inputFiles);
      const nextFiles = await Promise.all(selected.map(readRuntimeFile));
      const mergedFiles = [...files, ...nextFiles];


      setFiles(mergedFiles);
      await syncFilesToDocumentRegistry(mergedFiles, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FILE_READ_FAILED");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }


  function removeFile(id: string) {
    const nextFiles = files.filter((file) => file.id !== id);


    setFiles(nextFiles);
    void syncFilesToDocumentRegistry(nextFiles, true);
  }


  function clearFiles() {
    setFiles([]);
    void clearServerFileSession();
  }


  function newChat() {
    const nextSessionId = buildId("JOKER-UI");


    setSessionId(nextSessionId);
    setMessages([]);
    setFiles([]);
    setFileRegistryPayload(null);
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


  async function syncFilesToDocumentRegistry(nextFiles: RuntimeFile[], replace = true) {
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          sessionId,
          threadId: activeThreadId,
          humanIpr,
          runtimeIpr: dashboardStatus.runtimeIpr,
          tenantId: activeTenantId,
          workspaceId: activeWorkspaceId,
          subscriptionId: activeSubscriptionId,
          accountId: activeAccountId,
          certificateId,
          certificateStatus,
          scope,
          iprHandoff: enrichedIprHandoff,
          selfPilotMemoryScopeBridge: {
            enabled: HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED,
            applied: selfPilotMemoryScopeBridgeApplied,
            legalCertification: false
          },
          interfaceRevision: INTERFACE_REVISION,
          sourceKind: "JOKER_C2_INTERFACE_FILE_UPLOAD",
          replace,
          files: nextFiles,
          legalCertification: false
        })
      });
      const payload = await readJsonResponse<JsonRecord>(response);


      if (!response.ok || payload.ok === false) {
        throw new Error(text(payload.error, `FILES_HTTP_${response.status}`));
      }


      setFileRegistryPayload(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "DOCUMENT_PROFILE_REGISTRY_SYNC_FAILED");
    }
  }


  async function clearServerFileSession() {
    try {
      const response = await fetch(`/api/files?sessionId=${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });
      const payload = await readJsonResponse<JsonRecord>(response);


      if (!response.ok || payload.ok === false) {
        throw new Error(text(payload.error, `FILES_DELETE_HTTP_${response.status}`));
      }


      setFileRegistryPayload(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FILE_SESSION_CLEAR_FAILED");
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


    const userMessageId = buildId("MSG-U");
    const userMessageNow = new Date();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: effectiveMessage,
      createdAt: userMessageNow.toLocaleString("it-IT"),
      temporalSeal: buildDualTimeMessageSeal({
        role: "user",
        messageId: userMessageId,
        now: userMessageNow
      })
    };


    setMessages((current) => [...current, userMessage]);


    try {
      const requestIdentity = await resolveRequestIdentityContext();


      const fallbackAccountSession =
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
          : null;


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
          threadId: activeThreadId,
          continuityRef,
          files,
          humanIpr,
          runtimeIpr: dashboardStatus.runtimeIpr,
          tenantId: activeTenantId,
          workspaceId: activeWorkspaceId,
          subscriptionId: activeSubscriptionId,
          accountId: activeAccountId,
          certificateId,
          certificateStatus,
          scope,
          accessDecision,
          identityBinding,
          matrixState,
          memoryScope,
          interfaceRevision: INTERFACE_REVISION,
          selfPilotMemoryScopeBridge: {
            enabled: HBCE_SELF_PILOT_MEMORY_SCOPE_BRIDGE_ENABLED,
            applied: selfPilotMemoryScopeBridgeApplied,
            legalCertification: false
          },
          iprHandoff: requestIdentity.iprHandoff ?? enrichedIprHandoff,
          iprAccountSession: requestIdentity.iprAccountSession ?? fallbackAccountSession,
          identityTransport: {
            source: requestIdentity.iprAccountSession
              ? "IPR_ACCOUNT_SESSION_FRESH"
              : requestIdentity.iprHandoff
                ? "IPR_HANDOFF_FRESH"
                : selfPilotMemoryScopeBridgeApplied
                  ? "SELF_PILOT_MEMORY_SCOPE_BRIDGE"
                  : "NO_IPR_CONTEXT",
            legalCertification: false
          }
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


      const assistantMessageId = buildId("MSG-A");
      const assistantMessageNow = new Date();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: answer || text(payload.error, `Runtime request failed with HTTP_${response.status}`),
        createdAt: assistantMessageNow.toLocaleString("it-IT"),
        raw: payload,
        temporalSeal: buildDualTimeMessageSeal({
          role: "assistant",
          messageId: assistantMessageId,
          now: assistantMessageNow,
          payload
        })
      };


      setMessages((current) => [...current, assistantMessage]);


      void checkIprSession();
      void checkRuntime();
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "CHAT_REQUEST_FAILED";


      setError(errorText);
      setMessages((current) => [
        ...current,
        (() => {
          const systemMessageId = buildId("MSG-S");
          const systemMessageNow = new Date();


          return {
            id: systemMessageId,
            role: "system" as const,
            content: `Runtime error: ${errorText}`,
            createdAt: systemMessageNow.toLocaleString("it-IT"),
            temporalSeal: buildDualTimeMessageSeal({
              role: "system",
              messageId: systemMessageId,
              now: systemMessageNow
            })
          };
        })()
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
    { label: "Binding", value: identityBinding },
    { label: "Source", value: effectiveHandoffSource }
  ];


  const memoryRows = [
    { label: "MATRIX", value: matrixState },
    { label: "Memory", value: memoryScope },
    { label: "Authority", value: memoryAuthority },
    { label: "Persistence", value: dashboardStatus.persistence },
    { label: "Last EVT", value: dashboardStatus.lastMemoryEvt },
    { label: "Last OPC", value: dashboardStatus.lastMemoryOpc },
    { label: "Database", value: dashboardStatus.database }
  ];


  const fileIngestionRows = [
    { label: "Server status", value: dashboardFileIngestion.status },
    { label: "Prompt ready server", value: dashboardFileIngestion.promptReadyCount },
    { label: "PDF ready server", value: dashboardFileIngestion.pdfReadyCount },
    { label: "PDF metadata only", value: dashboardFileIngestion.pdfMetadataOnlyCount },
    { label: "PDF ingestion fail", value: dashboardFileIngestion.pdfIngestionFailCount },
    { label: "Local files", value: String(files.length) },
    { label: "Local prompt-ready", value: String(localPromptReadyCount) },
    { label: "Local PDF payload", value: String(localPdfPayloadCount) },
    { label: "Document registry", value: dashboardDocumentRegistry.status },
    { label: "Document profiles", value: dashboardDocumentRegistry.profileCount },
    { label: "Linked profiles", value: dashboardDocumentRegistry.linkedMemoryCount },
    { label: "legalCertification", value: dashboardFileIngestion.legalCertification },
    { label: "OPC", value: dashboardFileIngestion.opc }
  ];


  const semanticMemoryRows = [
    { label: "Enabled", value: dashboardSemanticMemory.enabled },
    { label: "Memory ID", value: dashboardSemanticMemory.memoryId },
    { label: "Quality", value: dashboardSemanticMemory.quality },
    { label: "Continuity gain", value: dashboardSemanticMemory.continuityGain },
    { label: "Coupling state", value: dashboardSemanticMemory.couplingState },
    { label: "Persistable", value: dashboardSemanticMemory.persistable },
    { label: "Threshold", value: dashboardSemanticMemory.thresholdDetected },
    { label: "saveRaw", value: dashboardSemanticMemory.policy.saveRaw },
    { label: "saveSynthesis", value: dashboardSemanticMemory.policy.saveSynthesis },
    { label: "Reusable", value: dashboardSemanticMemory.policy.reusableInPrompt },
    { label: "Semantic EVT", value: dashboardSemanticMemory.source.evtId },
    { label: "Semantic OPC", value: dashboardSemanticMemory.source.opcId },
    { label: "legalCertification", value: dashboardSemanticMemory.boundary.legalCertification }
  ];


  const proofRows = [
    { label: "AI EVT", value: dashboardStatus.aiEvt },
    { label: "Response EVT", value: dashboardStatus.responseEvt },
    { label: "OPC", value: dashboardStatus.opc },
    { label: "Chain hash", value: dashboardStatus.chainHash },
    { label: "legalCertification", value: dashboardStatus.legalCertification }
  ];


  const temporalRows = [
    { label: "Torino / Italia / Europa node clock UTC+2", value: liveTemporal.utcClock },
    { label: "Canonical UTC response time", value: dashboardStatus.utcResponseTime },
    { label: "AI JOKER-C2 lifetime live", value: liveTemporal.lifeHuman },
    { label: "Runtime age payload", value: dashboardStatus.runtimeAge },
    { label: "Birth anchor locale", value: `${JOKER_C2_BIRTH_ANCHOR_LOCAL} ${JOKER_C2_BIRTH_ANCHOR_TIMEZONE}` },
    { label: "Birth UTC", value: effectiveRuntimeBirthUtc },
    { label: "Life seconds live", value: liveTemporal.lifeSeconds },
    { label: "Temporal proof", value: dashboardStatus.temporalProof },
    { label: "Temporal certificate", value: effectiveTemporalCertificateStatus },
    { label: "2026-only", value: effectiveRuntimeBirth === JOKER_C2_BIRTH_ANCHOR_LOCAL ? "PASS_2026_ONLY" : "FAIL_TEMPORAL_ANCHOR" }
  ];


  const saasRows = [
    { label: "Release", value: dashboardStatus.saasRelease },
    { label: "Tier", value: saasTier },
    { label: "Core status", value: dashboardStatus.saasCoreStatus },
    { label: "Tenant", value: dashboardStatus.tenantId },
    { label: "Workspace", value: dashboardStatus.workspaceId },
    { label: "Subscription", value: dashboardStatus.subscriptionId },
    { label: "Account", value: dashboardStatus.accountId },
    { label: "Thread", value: dashboardStatus.threadId },
    { label: "Source", value: dashboardStatus.saasSource },
    { label: "OpenAI", value: dashboardStatus.openAI },
    { label: "Database configured", value: dashboardStatus.databaseConfigured },
    { label: "Database available", value: dashboardStatus.databaseAvailable }
  ];


  const auditRows = [
    { label: "Audit ID", value: dashboardStatus.auditId },
    { label: "Audit status", value: dashboardStatus.auditStatus },
    { label: "Audit persistence", value: dashboardStatus.auditPersistence },
    { label: "Audit hash", value: dashboardStatus.auditHash },
    { label: "Response EVT", value: dashboardStatus.responseEvt },
    { label: "OPC", value: dashboardStatus.opc }
  ];


  const registeredEventRows = [
    { label: "Registered event ID", value: dashboardStatus.registeredEventId },
    { label: "Registered event name", value: dashboardStatus.registeredEventName },
    { label: "Registered event hash", value: dashboardStatus.registeredEventHash },
    { label: "Memory ID", value: dashboardStatus.memoryId },
    { label: "Memory hash", value: dashboardStatus.memoryHash },
    { label: "Memory key hash", value: dashboardStatus.memoryKeyHash },
    { label: "Previous EVT", value: dashboardStatus.previousEvt },
    { label: "Previous OPC", value: dashboardStatus.previousOpc },
    { label: "B2G readiness", value: dashboardStatus.b2gReadiness }
  ];


  const modelUsageRows = [
    { label: "Usage ID", value: dashboardStatus.modelUsageId },
    { label: "Usage status", value: dashboardStatus.modelUsageStatus },
    { label: "Usage persistence", value: dashboardStatus.modelUsagePersistence },
    { label: "Accounting", value: dashboardStatus.accountingMode },
    { label: "Input tokens", value: dashboardStatus.inputTokens },
    { label: "Output tokens", value: dashboardStatus.outputTokens },
    { label: "Total tokens", value: dashboardStatus.totalTokens },
    { label: "Cost units", value: dashboardStatus.estimatedCostUnits },
    { label: "Cost minor", value: dashboardStatus.estimatedCostMinor },
    { label: "Usage hash", value: dashboardStatus.usageHash }
  ];


  const lastRefreshTemporalDisplay = formatUtcAndRomeTemporalDisplay(iprMemoryDashboard.lastRefreshUtc);
  const cyberneticChainUpdatedTemporalDisplay = formatUtcAndRomeTemporalDisplay(cyberneticMemoryChain.updatedAt);


  const iprMemoryControlRows = [
    { label: "Human IPR", value: humanIpr },
    { label: "Tenant", value: activeTenantId },
    { label: "Workspace", value: activeWorkspaceId },
    { label: "Memory scope bridge", value: selfPilotMemoryScopeBridgeApplied ? "SELF_PILOT_SCOPE_BRIDGE_ACTIVE" : "SERVER_SCOPE" },
    { label: "Access", value: accessDecision },
    { label: "Memory scope", value: memoryScope },
    { label: "Thread", value: activeThreadId },
    { label: "Interface revision", value: INTERFACE_REVISION },
    { label: "Recent chats", value: String(iprMemoryDashboard.recentThreads.length) },
    { label: "Saved chats", value: String(iprMemoryDashboard.memorySaves.length) },
    { label: "Memory records", value: String(iprMemoryDashboard.memoryRecords.length) },
    { label: "Recall items", value: String(iprMemoryDashboard.recallItems.length) },
    { label: "Document profiles", value: dashboardDocumentRegistry.profileCount },
    { label: "Linked docs", value: dashboardDocumentRegistry.linkedMemoryCount },
    { label: "Last refresh", value: `UTC ${lastRefreshTemporalDisplay.utc}`, detail: lastRefreshTemporalDisplay.local, title: lastRefreshTemporalDisplay.title },
    { label: "legalCertification", value: "false" }
  ];


  const cyberneticMemoryChainRows = [
    { label: "IPR Memory", value: cyberneticMemoryChain.memoryId },
    { label: "Saved chat", value: cyberneticMemoryChain.savedChatId },
    { label: "EVT", value: cyberneticMemoryChain.evtId },
    { label: "OPC", value: cyberneticMemoryChain.opcId },
    { label: "Audit", value: cyberneticMemoryChain.auditId },
    { label: "Usage", value: cyberneticMemoryChain.usageId },
    { label: "Status", value: cyberneticMemoryChain.status },
    { label: "Prompt eligible", value: cyberneticMemoryChain.promptEligible },
    { label: "Reusable", value: cyberneticMemoryChain.reusableInPrompt },
    { label: "Record status", value: cyberneticMemoryChain.recordStatus },
    { label: "Document registry", value: cyberneticMemoryChain.documentRegistryStatus },
    { label: "Linked profiles", value: cyberneticMemoryChain.linkedProfileCount },
    { label: "Source", value: cyberneticMemoryChain.source },
    { label: "Updated", value: `UTC ${cyberneticChainUpdatedTemporalDisplay.utc}`, detail: cyberneticChainUpdatedTemporalDisplay.local, title: cyberneticChainUpdatedTemporalDisplay.title },
    { label: "legalCertification", value: "false" },
    { label: "OPC boundary", value: "technical proof receipt only" }
  ];


  const cyberneticChainReady = isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) && !isBlankRuntimeValue(cyberneticMemoryChain.evtId) && !isBlankRuntimeValue(cyberneticMemoryChain.opcId);


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
          <StatusPill label="MATRIX" value={matrixState} />
          <StatusPill label="Memory" value={memoryScope} />
          <StatusPill label="Docs" value={dashboardDocumentRegistry.available ? dashboardDocumentRegistry.status : "NO_DOC_REGISTRY"} />
          {dashboardSemanticMemory.available ? (
            <StatusPill label="Semantic" value={dashboardSemanticMemory.quality} />
          ) : null}
          <StatusPill label="Audit" value={dashboardStatus.auditStatus} />
          <StatusPill label="Usage" value={dashboardStatus.modelUsageStatus} />
          <StatusPill label="Birth" value={dashboardStatus.runtimeBirth} />
          <StatusPill label="B2G" value={dashboardStatus.b2gReadiness} />
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
            verificato, accesso governato, memoria cibernetica IPR-bound, EVT, OPC,
            dashboard audit, model usage, model routing e boundary B2G.
          </p>
          <code>legalCertification=false</code>


          <div className="joker-temporal-clock" aria-label="JOKER-C2 Temporal Runtime Certificate Torino Italia Europa UTC+2">
            <div className="joker-temporal-clock-head">
              <span className="joker-kicker">JOKER-C2 Temporal Runtime Certificate</span>
              <StatusPill value={effectiveTemporalCertificateStatus} />
            </div>
            <div className="joker-temporal-clock-main">
              <span>{JOKER_C2_OPERATIONAL_NODE_CLOCK_LABEL}</span>
              <strong>{liveTemporal.utcClock}</strong>
            </div>
            <div className="joker-temporal-clock-grid">
              <div>
                <span>AI JOKER-C2 lifetime</span>
                <strong>{liveTemporal.lifeHuman}</strong>
              </div>
              <div>
                <span>Birth anchor</span>
                <strong>{JOKER_C2_BIRTH_ANCHOR_LOCAL} {JOKER_C2_BIRTH_ANCHOR_TIMEZONE}</strong>
              </div>
            </div>
            <em>Torino / Italia / Europa node time UTC+2 + cybernetic lifetime + birth anchor locale · technical proof only · legalCertification=false</em>
          </div>
        </div>


        <div className="joker-hero-grid">
          <MetricCard label="Runtime" value="AI_JOKER-C2" />
          <MetricCard label="Model" value={dashboardStatus.model} />
          <MetricCard label="Model level" value={dashboardStatus.modelLevel} />
          <MetricCard label="Human IPR" value={humanIpr} />
          <MetricCard label="MATRIX" value={matrixState} />
          <MetricCard label="Memory" value={memoryScope} />
          <MetricCard label="Semantic quality" value={dashboardSemanticMemory.available ? dashboardSemanticMemory.quality : "NOT_AVAILABLE"} />
          <MetricCard label="File context" value={dashboardFileIngestion.available ? dashboardFileIngestion.status : files.length > 0 ? "LOCAL_FILES_READY" : "NOT_AVAILABLE"} />
          <MetricCard label="Document profiles" value={dashboardDocumentRegistry.profileCount} />
          <MetricCard label="Linked document memory" value={dashboardDocumentRegistry.linkedMemoryCount} />
          <MetricCard label="Coupling state" value={dashboardSemanticMemory.available ? dashboardSemanticMemory.couplingState : "NOT_AVAILABLE"} />
          <MetricCard label="Response EVT" value={dashboardStatus.responseEvt} />
          <MetricCard label="OPC" value={dashboardStatus.opc} />
          <MetricCard label="Audit" value={dashboardStatus.auditId} />
          <MetricCard label="Usage" value={dashboardStatus.modelUsageId} />
          <MetricCard label="SaaS tier" value={saasTier} />
          <MetricCard label="Torino / Italia / Europa · UTC+2" value={liveTemporal.utcClock} />
          <MetricCard label="AI JOKER-C2 lifetime" value={liveTemporal.lifeHuman} />
          <MetricCard label="Birth anchor" value={`${JOKER_C2_BIRTH_ANCHOR_LOCAL} ${JOKER_C2_BIRTH_ANCHOR_TIMEZONE}`} />
          <MetricCard label="Runtime age" value={dashboardStatus.runtimeAge} />
          <MetricCard label="B2G readiness" value={dashboardStatus.b2gReadiness} />
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
            {accountIdentityReady
              ? "Server-side IPR account session detected. Identity frame is ready for authoritative validation during POST /api/chat."
              : hasAccountSession
                ? "Server-side IPR account session detected, but the interface still needs a complete Human IPR, ACTIVE certificate and JOKER_C2_ACCESS scope frame."
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
            <StatusPill value={memoryScope} />
          </div>


          <p>
            La memoria operativa non autentica da sola il soggetto, non abbassa
            il rischio e non sostituisce la persistenza database.
          </p>


          <InfoList items={memoryRows} />
        </div>


        <div className={dashboardFileIngestion.available || files.length > 0 ? "joker-panel is-active" : "joker-panel"}>
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">File ingestion</span>
              <h2>TXT / PDF runtime context</h2>
            </div>
            <StatusPill value={dashboardFileIngestion.available ? dashboardFileIngestion.status : files.length > 0 ? "LOCAL_FILES_READY" : "NOT_AVAILABLE"} />
          </div>


          <p>
            Questo blocco distingue file caricati localmente, testo pronto per il prompt,
            PDF con payload binario, PDF letto davvero, PDF solo metadato e fallimento parser.
            Ora mostra anche il registry cyber: il file non resta più allegato volante, diventa documentProfile richiamabile.
          </p>


          <InfoList items={fileIngestionRows} />


          <FileIngestionCard snapshot={dashboardFileIngestion} localFiles={files} />
          <DocumentRegistryCard snapshot={dashboardDocumentRegistry} />
        </div>


        <div className={dashboardSemanticMemory.available ? "joker-panel is-active" : "joker-panel"}>
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">Semantic memory</span>
              <h2>Corpus classifier</h2>
            </div>
            <StatusPill value={dashboardSemanticMemory.available ? dashboardSemanticMemory.quality : "NOT_AVAILABLE"} />
          </div>


          <p>
            Snapshot pubblico controllato della memoria semantica esoterologica: qualità,
            continuità, coupling state, termini canonici, policy di salvataggio e boundary.
          </p>


          <InfoList items={semanticMemoryRows} />


          <SemanticMemoryCard snapshot={dashboardSemanticMemory} />
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


        <div className="joker-panel joker-temporal-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">Temporal runtime</span>
              <h2>Temporal Runtime Certificate</h2>
            </div>
            <StatusPill value={effectiveTemporalCertificateStatus} />
          </div>


          <p>
            Ogni risposta viene legata a due coordinate: ora locale del nodo Torino / Italia / Europa visualizzata in UTC+2 e tempo di vita di AI JOKER-C2 calcolato dal birth anchor locale canonico. Il timestamp UTC resta conservato nei metadati tecnici. È prova tecnica temporale, non certificazione legale.
          </p>


          <div className="joker-live-clock">
            <div>
              <span>{JOKER_C2_OPERATIONAL_NODE_CLOCK_LABEL}</span>
              <strong>{liveTemporal.utcClock}</strong>
            </div>
            <div>
              <span>AI JOKER-C2 lifetime</span>
              <strong>{liveTemporal.lifeHuman}</strong>
            </div>
            <div>
              <span>Birth anchor locale</span>
              <strong>{JOKER_C2_BIRTH_ANCHOR_LOCAL} {JOKER_C2_BIRTH_ANCHOR_TIMEZONE}</strong>
            </div>
          </div>


          <InfoList items={temporalRows} />
        </div>


        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">SaaS Core</span>
              <h2>Runtime product layer</h2>
            </div>
            <StatusPill value={dashboardStatus.saasCoreStatus} />
          </div>


          <p>
            Stato operativo del passaggio da demo R&D a SaaS Core v0.1: provider,
            database, tier, persistenza, audit e usage accounting.
          </p>


          <InfoList items={saasRows} />
        </div>


        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">Runtime Audit Log</span>
              <h2>Decision reconstruction</h2>
            </div>
            <StatusPill value={dashboardStatus.auditStatus} />
          </div>


          <p>
            L’audit runtime registra decisione, rischio, modello, memoria, EVT,
            OPC e boundary. Serve a ricostruire l’operazione, non a fare miracoli notarili.
          </p>


          <InfoList items={auditRows} />
        </div>


        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">Model Usage Log</span>
              <h2>SaaS accounting</h2>
            </div>
            <StatusPill value={dashboardStatus.modelUsageStatus} />
          </div>


          <p>
            Il model usage log collega modello, token, costo stimato, SaaS tier,
            audit, EVT e OPC. Il contatore non è poesia, ma almeno paga le bollette.
          </p>


          <InfoList items={modelUsageRows} />
        </div>


        <div className="joker-panel">
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">Registered Event</span>
              <h2>SaaS B2G memory registry</h2>
            </div>
            <StatusPill value={dashboardStatus.b2gReadiness} />
          </div>


          <p>
            Questo blocco verifica se l’evento nominato, la memoria persistente, EVT, OPC, audit e usage stanno convergendo nello stesso contesto SaaS. Cioè la parte in cui smettiamo di collezionare ID e iniziamo a usarli.
          </p>


          <InfoList items={registeredEventRows} />
        </div>
      </section>


      <section className="joker-ipr-memory">
        <div className={canUseIprMemory ? "joker-panel is-active" : "joker-panel is-error"}>
          <div className="joker-panel-head">
            <div>
              <span className="joker-kicker">IPR memory console</span>
              <h2>Chat recenti · Intenzione Primaria Radicale</h2>
            </div>
            <StatusPill value={canUseIprMemory ? "IPR_MEMORY_READY" : "IPR_MEMORY_BLOCKED"} />
          </div>


          <p>
            Layer UI separato da /api/chat: legge chat recenti, mostra memorie IPR e salva
            la chat solo con azione esplicita. In modalità self-pilot usa il bridge IPR/tenant/workspace
            per non bloccare la memoria quando la sessione account non espone ancora lo scope completo.
            IPR qui significa sia Identity Primary Record sia Intenzione Primaria Radicale.
          </p>


          <InfoList items={iprMemoryControlRows} />


          {iprMemoryError ? (
            <div className="joker-alert is-bad">{iprMemoryError}</div>
          ) : null}


          {iprMemoryNotice ? (
            <div className="joker-alert is-good">{iprMemoryNotice}</div>
          ) : null}


          <div className="joker-panel-actions">
            <button type="button" onClick={() => void refreshIprMemoryDashboard()} disabled={isLoadingIprMemory || !canUseIprMemory}>
              {isLoadingIprMemory ? "Refreshing memory..." : "Refresh IPR memory"}
            </button>
            <button type="button" className="joker-memory-primary-button" onClick={() => void saveCurrentChatToIpr()} disabled={isSavingChatToIpr || messages.length === 0 || !canUseIprMemory}>
              {isSavingChatToIpr ? "Saving on IPR..." : "1 · Save chat → IPR"}
            </button>
          </div>


          <div className={cyberneticChainReady ? "joker-cyber-chain is-ready" : "joker-cyber-chain"}>
            <div className="joker-memory-column-head">
              <div>
                <span className="joker-kicker">IPR · EVT · OPC</span>
                <h3>Memoria cibernetica SaaS chain</h3>
              </div>
              <StatusPill value={cyberneticChainReady ? "CYBER_CHAIN_READY" : cyberneticMemoryChain.status} />
            </div>
            <p>La chat scelta viene salvata come memoria IPR-bound; EVT la colloca nel tempo operativo; OPC ne produce la ricevuta tecnica. La memoria riusabile resta in memory_records, non nello scontrino OPC. Piccola concessione alla realtà.</p>
            <InfoList items={cyberneticMemoryChainRows} />
            <div className="joker-cyber-chain-steps" aria-label="Cybernetic memory chain actions">
              <button type="button" className="joker-memory-primary-button" onClick={() => void saveCurrentChatToIpr()} disabled={isSavingChatToIpr || messages.length === 0 || !canUseIprMemory}>{isSavingChatToIpr ? "Saving..." : "1 · Chat → IPR"}</button>
              <button type="button" onClick={() => void bindCurrentIprMemoryToEvt()} disabled={isCheckingCyberneticMemory || !isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) || !canUseIprMemory}>{isCheckingCyberneticMemory ? "Checking..." : "2 · IPR → EVT"}</button>
              <button type="button" onClick={() => void bindCurrentEvtToOpc()} disabled={isCheckingCyberneticMemory || !isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) || !canUseIprMemory}>{isCheckingCyberneticMemory ? "Checking..." : "3 · EVT → OPC"}</button>
              <button type="button" onClick={() => void injectCurrentIprMemoryIntoChat()} disabled={!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) || isSending}>4 · Inject memory → Chat</button>
            </div>
            <div className="joker-cyber-chain-steps is-secondary" aria-label="Cybernetic memory utility actions">
              <button type="button" onClick={() => void checkCyberneticMemoryRecordStatus()} disabled={isCheckingCyberneticMemory || !isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) || !canUseIprMemory}>Record-status</button>
              <button type="button" onClick={() => void copyRuntimeId("IPR-MEM", cyberneticMemoryChain.memoryId)} disabled={!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId)}>Copy IPR-MEM</button>
              <button type="button" onClick={() => void copyRuntimeId("EVT", cyberneticMemoryChain.evtId)} disabled={isBlankRuntimeValue(cyberneticMemoryChain.evtId)}>Copy EVT</button>
              <button type="button" onClick={() => void copyRuntimeId("OPC", cyberneticMemoryChain.opcId)} disabled={isBlankRuntimeValue(cyberneticMemoryChain.opcId)}>Copy OPC</button>
              <button type="button" onClick={() => void askChatToVerifyIprEvtBinding()} disabled={!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) || isSending}>Ask chat: IPR→EVT</button>
              <button type="button" onClick={() => void askChatToVerifyEvtOpcBinding()} disabled={!isUsableCyberneticMemoryId(cyberneticMemoryChain.memoryId) || isSending}>Ask chat: EVT→OPC</button>
            </div>
          </div>
        </div>


        <div className="joker-memory-grid">
          <div className="joker-memory-column">
            <div className="joker-memory-column-head">
              <div>
                <span className="joker-kicker">Recent chats</span>
                <h3>Chat recenti</h3>
              </div>
              <StatusPill value={String(iprMemoryDashboard.recentThreads.length)} />
            </div>


            {iprMemoryDashboard.recentThreads.length > 0 ? (
              <div className="joker-memory-list">
                {iprMemoryDashboard.recentThreads.map((record, index) => (
                  <article key={`recent-${getIprMemoryRecordId(record)}-${index}`} className="joker-memory-item">
                    <div className="joker-memory-item-head">
                      <strong title={getIprMemoryRecordTitle(record)}>
                        {compact(getIprMemoryRecordTitle(record), 72)}
                      </strong>
                      <span>{compact(getIprMemoryRecordTimestamp(record), 34)}</span>
                    </div>
                    <p>{compact(getIprMemoryRecordSummary(record), 180)}</p>
                    <div className="joker-memory-meta">
                      <span title={first(record, [["threadId"]], "-")}>Thread {compact(first(record, [["threadId"]], "-"), 32)}</span>
                      <span>Messages {first(record, [["messageCount"], ["messagesCount"]], "0")}</span>
                      <span>IPR save {first(record, [["iprSaveStatus"], ["saveStatus"]], "-")}</span>
                    </div>
                    {getIprMemoryRecordMemoryId(record) ? (
                      <div className="joker-memory-actions">
                        <button type="button" onClick={() => selectIprMemoryRecordForCyberneticChain(record, "recent-chat")} disabled={!canUseIprMemory}>Usa nella catena</button>
                        <button type="button" onClick={() => void copyRuntimeId("IPR-MEM", getIprMemoryRecordMemoryId(record))} disabled={!getIprMemoryRecordMemoryId(record)}>Copy IPR-MEM</button>
                        <button
                          type="button"
                          className="joker-memory-danger-button"
                          onClick={() => void removeIprMemoryRecordFromRecall(record, "recent-chat")}
                          disabled={isRemovingIprMemoryId === getIprMemoryRecordMemoryId(record) || !canUseIprMemory}
                        >
                          {isRemovingIprMemoryId === getIprMemoryRecordMemoryId(record) ? "Rimozione..." : "Rimuovi da IPR recall"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="joker-empty-mini">
                Nessuna chat recente caricata. Premi Refresh IPR memory, perché apparentemente anche le dashboard hanno bisogno di essere invitate.
              </div>
            )}
          </div>


          <div className="joker-memory-column">
            <div className="joker-memory-column-head">
              <div>
                <span className="joker-kicker">IPR records</span>
                <h3>Memorie IPR</h3>
              </div>
              <StatusPill value={String(iprMemoryDashboard.memoryRecords.length)} />
            </div>


            {iprMemoryDashboard.memoryRecords.length > 0 ? (
              <div className="joker-memory-list">
                {iprMemoryDashboard.memoryRecords.map((record, index) => (
                  <article key={`memory-${getIprMemoryRecordId(record)}-${index}`} className="joker-memory-item">
                    <div className="joker-memory-item-head">
                      <strong title={getIprMemoryRecordTitle(record)}>
                        {compact(getIprMemoryRecordTitle(record), 72)}
                      </strong>
                      <span>{compact(getIprMemoryRecordTimestamp(record), 34)}</span>
                    </div>
                    <p>{compact(getIprMemoryRecordSummary(record), 220)}</p>
                    <div className="joker-memory-meta">
                      <span title={first(record, [["memoryId"]], "-")}>Memory {compact(first(record, [["memoryId"]], "-"), 32)}</span>
                      <span>{first(record, [["classification"]], "USER_SELECTED_CHAT_MEMORY")}</span>
                      <span>Reusable {booleanLike(getPath(record, ["reusableInPrompt"]), first(record, [["reusableInPrompt"]], "-"))}</span>
                    </div>
                    <div className="joker-memory-actions">
                      <button type="button" onClick={() => selectIprMemoryRecordForCyberneticChain(record, "memory-record")} disabled={!getIprMemoryRecordMemoryId(record) || !canUseIprMemory}>Usa nella catena</button>
                      <button type="button" onClick={() => void copyRuntimeId("IPR-MEM", getIprMemoryRecordMemoryId(record))} disabled={!getIprMemoryRecordMemoryId(record)}>Copy IPR-MEM</button>
                      <button
                        type="button"
                        className="joker-memory-danger-button"
                        onClick={() => void removeIprMemoryRecordFromRecall(record, "memory-record")}
                        disabled={
                          !getIprMemoryRecordMemoryId(record) ||
                          isRemovingIprMemoryId === getIprMemoryRecordMemoryId(record) ||
                          !canUseIprMemory
                        }
                      >
                        {isRemovingIprMemoryId === getIprMemoryRecordMemoryId(record) ? "Rimozione..." : "Rimuovi da IPR recall"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="joker-empty-mini">
                Nessuna memoria IPR persistente caricata. Il bottone “Salva questa chat su IPR” serve proprio a questo, incredibile ma lineare.
              </div>
            )}
          </div>


          <div className="joker-memory-column">
            <div className="joker-memory-column-head">
              <div>
                <span className="joker-kicker">Document profiles</span>
                <h3>Memorie documentali</h3>
              </div>
              <StatusPill value={String(linkedDocumentProfiles.length)} />
            </div>


            {linkedDocumentProfiles.length > 0 ? (
              <div className="joker-memory-list">
                {linkedDocumentProfiles.slice(0, 6).map((profile, index) => (
                  <article key={`document-profile-chain-${profile.profileId}-${index}`} className="joker-memory-item is-document-profile">
                    <div className="joker-memory-item-head">
                      <strong title={profile.title}>{compact(profile.title, 72)}</strong>
                      <span>{compact(profile.volume, 20)}</span>
                    </div>
                    <p>{compact(profile.summary, 220)}</p>
                    <div className="joker-memory-meta">
                      <span title={profile.profileId}>Profile {compact(profile.profileId, 28)}</span>
                      <span title={profile.memoryId}>Memory {compact(profile.memoryId, 28)}</span>
                      <span>{profile.canonicalDocumentKind}</span>
                      <span>Linked docs 1</span>
                    </div>
                    <div className="joker-memory-meta">
                      <span title={profile.filename}>{compact(profile.filename, 36)}</span>
                      <span>{profile.quality}</span>
                      <span>Reusable {profile.reusableInPrompt}</span>
                      <span>Glossary guard {profile.glossaryGuardApplied}</span>
                    </div>
                    <div className="joker-memory-actions">
                      <button type="button" onClick={() => selectDocumentProfileForCyberneticChain(profile)} disabled={!canUseIprMemory}>Usa profilo nella catena</button>
                      <button type="button" onClick={() => void copyRuntimeId("IPR-MEM", profile.memoryId)} disabled={!isLinkedDocumentProfile(profile)}>Copy IPR-MEM</button>
                      <button type="button" onClick={() => void copyRuntimeId("DOC-PROFILE", profile.profileId)} disabled={isBlankRuntimeValue(profile.profileId)}>Copy DOC-PROFILE</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="joker-empty-mini">
                Nessun profilo documento collegato a IPR-MEM nella vista corrente. Il registry può esistere, ma senza memoryId la chain non deve fingere di avere un documento, perché poi nasce il solito teatro.
              </div>
            )}
          </div>


          <div className="joker-memory-column">
            <div className="joker-memory-column-head">
              <div>
                <span className="joker-kicker">Recall</span>
                <h3>Prompt memory block</h3>
              </div>
              <StatusPill value={iprMemoryDashboard.promptMemoryBlock ? "READY" : "EMPTY"} />
            </div>


            {iprMemoryDashboard.recallItems.length > 0 ? (
              <div className="joker-memory-list">
                {iprMemoryDashboard.recallItems.slice(0, 4).map((record, index) => (
                  <article key={`recall-${getIprMemoryRecordId(record)}-${index}`} className="joker-memory-item">
                    <div className="joker-memory-item-head">
                      <strong title={getIprMemoryRecordTitle(record)}>
                        {compact(getIprMemoryRecordTitle(record), 72)}
                      </strong>
                      <span>score {first(record, [["score"], ["rankScore"]], "-")}</span>
                    </div>
                    <p>{compact(getIprMemoryRecordSummary(record), 180)}</p>
                    <div className="joker-memory-meta">
                      <span>{first(record, [["quality"]], "-")}</span>
                      <span>{first(record, [["sourceKind"]], "IPR_MEMORY")}</span>
                      <span>EVT {compact(first(record, [["evtId"]], "-"), 28)}</span>
                    </div>
                    {getIprMemoryRecordMemoryId(record) ? (
                      <div className="joker-memory-actions">
                        <button type="button" onClick={() => selectIprMemoryRecordForCyberneticChain(record, "recall-item")} disabled={!canUseIprMemory}>Usa nella catena</button>
                        <button type="button" onClick={() => void copyRuntimeId("IPR-MEM", getIprMemoryRecordMemoryId(record))} disabled={!getIprMemoryRecordMemoryId(record)}>Copy IPR-MEM</button>
                        <button
                          type="button"
                          className="joker-memory-danger-button"
                          onClick={() => void removeIprMemoryRecordFromRecall(record, "recall-item")}
                          disabled={isRemovingIprMemoryId === getIprMemoryRecordMemoryId(record) || !canUseIprMemory}
                        >
                          {isRemovingIprMemoryId === getIprMemoryRecordMemoryId(record) ? "Rimozione..." : "Rimuovi da IPR recall"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="joker-empty-mini">
                Nessun recall riusabile. Bene: almeno non stiamo iniettando ricordi a caso nella chat come coriandoli.
              </div>
            )}


            {iprMemoryDashboard.promptMemoryBlock ? (
              <details className="joker-memory-prompt-block">
                <summary>Show prompt memory block</summary>
                <pre>{iprMemoryDashboard.promptMemoryBlock}</pre>
              </details>
            ) : null}
          </div>
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
              HBCE: IPR, EVT, OPC, MATRIX, memoria IPR-bound, runtime audit,
              model usage, SaaS accounting e fail-closed.
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
              <MessageBubble
                key={item.id}
                message={item}
                onCopy={copyText}
                onSaveChatToIpr={saveCurrentChatToIpr}
                onCopyRuntimeId={copyRuntimeId}
                canSaveChatToIpr={canUseIprMemory && messages.length > 0}
                isSavingChatToIpr={isSavingChatToIpr}
              />
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
                title={`${file.name} · ${file.status} · ${file.mimeType} · ${formatFileSize(file.size)} · ${file.reason}`}
              >
                {file.kind === "image" && file.dataUrl ? (
                  <img src={file.dataUrl} alt="" className="joker-file-preview" />
                ) : null}
                <span>{file.name}</span>
                <em>
                  {file.status} · {file.kind} · {formatFileSize(file.size)}
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
        .joker-dashboard,
        .joker-ipr-memory {
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


        .joker-temporal-clock,
        .joker-live-clock {
          margin-top: 18px;
          padding: 14px;
          border: 1px solid rgba(34, 211, 238, 0.24);
          border-radius: 20px;
          background:
            radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.14), transparent 38%),
            linear-gradient(180deg, rgba(8, 47, 73, 0.32), rgba(15, 23, 42, 0.54));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }


        .joker-temporal-clock-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }


        .joker-temporal-clock-main {
          margin-top: 14px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(2, 6, 23, 0.42);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }


        .joker-temporal-clock-main span,
        .joker-temporal-clock-grid span,
        .joker-live-clock span {
          display: block;
          color: #67e8f9;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }


        .joker-temporal-clock-main strong,
        .joker-temporal-clock-grid strong,
        .joker-live-clock strong {
          display: block;
          margin-top: 6px;
          color: #f8fafc;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 13px;
          line-height: 1.42;
          overflow-wrap: anywhere;
        }


        .joker-temporal-clock-main strong {
          font-size: 18px;
          letter-spacing: -0.02em;
        }


        .joker-temporal-clock-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 10px;
        }


        .joker-temporal-clock-grid div,
        .joker-live-clock div {
          min-width: 0;
          padding: 11px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.34);
        }


        .joker-live-clock {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }


        .joker-temporal-clock em {
          display: block;
          margin-top: 12px;
          color: #94a3b8;
          font-size: 11px;
          font-style: normal;
          line-height: 1.45;
        }


        .joker-temporal-panel {
          border-color: rgba(34, 211, 238, 0.38);
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


        .joker-info-row dd span,
        .joker-info-row dd small {
          display: block;
        }


        .joker-info-row dd small {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 760;
          line-height: 1.35;
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


        .joker-ipr-memory {
          margin-top: 16px;
        }


        .joker-cyber-chain {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid rgba(71, 85, 105, 0.56);
          border-radius: 22px;
          background:
            radial-gradient(circle at 0% 0%, rgba(14, 165, 233, 0.1), transparent 34%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.46));
        }


        .joker-cyber-chain.is-ready {
          border-color: rgba(34, 197, 94, 0.38);
          background:
            radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.12), transparent 34%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.46));
        }


        .joker-cyber-chain-steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }


        .joker-cyber-chain-steps.is-secondary {
          grid-template-columns: repeat(6, minmax(0, 1fr));
          margin-top: 10px;
        }


        .joker-memory-primary-button {
          border-color: rgba(34, 211, 238, 0.48);
          background: rgba(8, 47, 73, 0.7);
          color: #e0f2fe;
        }


        .joker-memory-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }


        .joker-memory-column {
          min-width: 0;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.66), rgba(2, 6, 23, 0.44)),
            rgba(2, 6, 23, 0.52);
          padding: 15px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }


        .joker-memory-column-head,
        .joker-memory-item-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }


        .joker-memory-column h3 {
          margin: 6px 0 0;
          color: #f8fafc;
          font-size: 18px;
          letter-spacing: -0.02em;
        }


        .joker-memory-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }


        .joker-memory-item {
          min-width: 0;
          border: 1px solid rgba(51, 65, 85, 0.78);
          border-radius: 18px;
          padding: 12px;
          background:
            radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.08), transparent 38%),
            rgba(15, 23, 42, 0.62);
        }


        .joker-memory-item strong {
          min-width: 0;
          color: #e0f2fe;
          font-size: 13px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }


        .joker-memory-item-head span {
          flex: 0 0 auto;
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
          line-height: 1.3;
          text-align: right;
          max-width: 150px;
          overflow-wrap: anywhere;
        }


        .joker-memory-item p {
          margin: 9px 0 0;
          color: #a8b7cc;
          font-size: 12px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }


        .joker-memory-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }


        .joker-memory-meta span {
          max-width: 100%;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 999px;
          padding: 4px 7px;
          background: rgba(2, 6, 23, 0.42);
          color: #94a3b8;
          font-size: 10px;
          font-weight: 820;
          overflow-wrap: anywhere;
        }


        .joker-memory-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }


        .joker-memory-danger-button {
          border: 1px solid rgba(248, 113, 113, 0.42);
          border-radius: 999px;
          padding: 7px 10px;
          background: rgba(127, 29, 29, 0.22);
          color: #fecaca;
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.01em;
        }


        .joker-memory-danger-button:hover:not(:disabled) {
          border-color: rgba(252, 165, 165, 0.74);
          background: rgba(153, 27, 27, 0.36);
          color: #fee2e2;
        }


        .joker-memory-danger-button:disabled {
          cursor: not-allowed;
          opacity: 0.46;
        }


        .joker-empty-mini {
          margin-top: 14px;
          border: 1px dashed rgba(71, 85, 105, 0.74);
          border-radius: 18px;
          padding: 14px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.55;
          background: rgba(2, 6, 23, 0.32);
        }


        .joker-memory-prompt-block {
          margin-top: 12px;
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 16px;
          background: rgba(8, 47, 73, 0.22);
          overflow: hidden;
        }


        .joker-memory-prompt-block summary {
          cursor: pointer;
          padding: 10px 12px;
          color: #bae6fd;
          font-size: 12px;
          font-weight: 850;
        }


        .joker-memory-prompt-block pre {
          margin: 0;
          max-height: 260px;
          overflow: auto;
          padding: 12px;
          border-top: 1px solid rgba(34, 211, 238, 0.16);
          color: #cbd5e1;
          font-size: 11px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
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


        .joker-dual-time-seal {
          margin: 0 0 13px;
          padding: 12px;
          border: 1px solid rgba(34, 211, 238, 0.28);
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(8, 145, 178, 0.14), rgba(79, 70, 229, 0.08)),
            rgba(2, 6, 23, 0.44);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }


        .joker-message-user .joker-dual-time-seal {
          border-color: rgba(34, 211, 238, 0.36);
          background:
            linear-gradient(135deg, rgba(14, 116, 144, 0.2), rgba(2, 6, 23, 0.28)),
            rgba(8, 47, 73, 0.2);
        }


        .joker-dual-time-seal-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 9px;
        }


        .joker-dual-time-seal-head strong {
          color: #f8fafc;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }


        .joker-dual-time-seal-head span {
          color: #67e8f9;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }


        .joker-dual-time-rails {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }


        .joker-dual-time-rails div {
          min-width: 0;
          padding: 10px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.62);
        }


        .joker-dual-time-rails span,
        .joker-dual-time-meta span {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }


        .joker-dual-time-rails strong {
          display: block;
          margin-top: 4px;
          color: #e0f2fe;
          font-size: 12px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }


        .joker-dual-time-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 9px;
        }


        .joker-dual-time-meta span {
          display: inline-flex;
          max-width: 100%;
          padding: 5px 7px;
          border: 1px solid rgba(71, 85, 105, 0.48);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.48);
          color: #cbd5e1;
          overflow-wrap: anywhere;
          text-transform: none;
          letter-spacing: 0;
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


        .joker-message-actions .joker-save-ipr-button {
          border-color: rgba(34, 211, 238, 0.42);
          background:
            radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.16), transparent 42%),
            rgba(8, 47, 73, 0.48);
          color: #e0f2fe;
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


        .joker-semantic-card,
        .joker-file-ingestion-card,
        .joker-document-registry-card {
          margin-top: 14px;
          padding: 14px;
          border: 1px solid rgba(34, 211, 238, 0.24);
          border-radius: 20px;
          background:
            radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.12), transparent 32%),
            linear-gradient(180deg, rgba(8, 47, 73, 0.24), rgba(15, 23, 42, 0.5));
        }


        .joker-semantic-card.is-compact,
        .joker-document-registry-card.is-compact {
          padding: 12px;
          border-radius: 18px;
        }


        .joker-semantic-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }


        .joker-semantic-head h3 {
          margin: 5px 0 0;
          color: #f8fafc;
          font-size: 15px;
          letter-spacing: -0.02em;
        }


        .joker-semantic-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }


        .joker-semantic-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }


        .joker-semantic-card.is-compact .joker-semantic-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }


        .joker-semantic-terms {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }


        .joker-semantic-term {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 100%;
          padding: 6px 8px;
          border: 1px solid rgba(103, 232, 249, 0.18);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.42);
          color: #dbeafe;
          font-size: 11px;
          font-weight: 760;
        }


        .joker-semantic-term b {
          display: inline-grid;
          place-items: center;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(34, 211, 238, 0.16);
          color: #67e8f9;
          font-size: 10px;
          font-weight: 950;
        }


        .joker-semantic-term em {
          color: #94a3b8;
          font-size: 10px;
          font-style: normal;
        }


        .joker-semantic-axis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }


        .joker-semantic-axis div {
          padding: 10px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.32);
        }


        .joker-semantic-axis span {
          display: block;
          color: #67e8f9;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }


        .joker-semantic-axis strong {
          display: block;
          margin-top: 6px;
          color: #dbeafe;
          font-size: 12px;
          font-weight: 720;
          line-height: 1.55;
        }


        .joker-file-ingestion-list {
          margin-top: 12px;
          display: grid;
          gap: 7px;
        }


        .joker-file-ingestion-list > strong {
          color: #67e8f9;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }


        .joker-file-ingestion-row {
          display: grid;
          grid-template-columns: minmax(120px, 1.1fr) auto minmax(160px, 2fr);
          gap: 8px;
          align-items: center;
          padding: 8px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.32);
          color: #cbd5e1;
          font-size: 11px;
        }


        .joker-file-ingestion-row em {
          color: #94a3b8;
          font-style: normal;
          line-height: 1.4;
        }


        .joker-document-profile-list {
          margin-top: 12px;
          display: grid;
          gap: 8px;
        }


        .joker-document-profile-list > strong {
          color: #67e8f9;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }


        .joker-document-profile-row {
          display: grid;
          grid-template-columns: minmax(150px, 1.6fr) auto auto auto minmax(140px, 1.2fr);
          gap: 8px;
          align-items: center;
          padding: 9px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 15px;
          background: rgba(2, 6, 23, 0.34);
          color: #cbd5e1;
          font-size: 11px;
        }


        .joker-document-profile-row div {
          min-width: 0;
        }


        .joker-document-profile-row span,
        .joker-document-profile-row em {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .joker-document-profile-row span {
          color: #e2e8f0;
          font-weight: 820;
        }


        .joker-document-profile-row em {
          margin-top: 3px;
          color: #94a3b8;
          font-style: normal;
          line-height: 1.35;
        }


        @media (max-width: 1180px) {
          .joker-topbar,
          .joker-hero,
          .joker-dashboard {
            grid-template-columns: 1fr;
          }


          .joker-memory-grid {
            grid-template-columns: 1fr;
          }


          .joker-cyber-chain-steps,
          .joker-cyber-chain-steps.is-secondary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
          .joker-prompt-grid,
          .joker-temporal-clock-grid,
          .joker-dual-time-rails,
          .joker-semantic-grid,
          .joker-semantic-axis,
          .joker-semantic-card.is-compact .joker-semantic-grid,
          .joker-memory-grid {
            grid-template-columns: 1fr;
          }
        }


        @media (max-width: 640px) {
          .joker-topbar {
            padding: 12px;
          }


          .joker-hero,
          .joker-dashboard,
          .joker-ipr-memory {
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


          .joker-cyber-chain-steps,
          .joker-cyber-chain-steps.is-secondary {
            grid-template-columns: 1fr;
          }


          .joker-footer-line {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}


async function fetchIprSessionSnapshot(): Promise<{
  payload: IprSessionResponse | null;
  error: string | null;
}> {
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


    if (!response.ok || payload.authenticated !== true) {
      return {
        payload,
        error: payload.reason || payload.detail || payload.error || `HTTP_${response.status}`
      };
    }


    return {
      payload,
      error: null
    };
  } catch (err) {
    return {
      payload: null,
      error: err instanceof Error ? err.message : "IPR_ACCOUNT_SESSION_CHECK_FAILED"
    };
  }
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
      uploaded: true,
      status: "TEXT_READY",
      mode: "TEXT",
      textLength: content.length,
      reason: "Readable text file prepared for JOKER-C2 prompt context."
    };
  }


  if (kind === "pdf") {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = extractBase64FromDataUrl(dataUrl);


    return {
      id: buildId("FILE"),
      name: file.name,
      type,
      mimeType: type,
      size: file.size,
      kind,
      text: "",
      content: "",
      dataUrl,
      base64,
      base64Length: base64.length,
      role: "context",
      uploaded: true,
      status: base64 ? "PDF_CLIENT_PAYLOAD_READY" : "PDF_METADATA_ONLY",
      mode: base64 ? "PDF_BINARY_PAYLOAD" : "REFERENCE_ONLY",
      textLength: 0,
      reason: base64
        ? "PDF binary payload prepared for server-side extraction. The server must return PDF_INGESTION_READY, PDF_METADATA_ONLY or PDF_INGESTION_FAIL."
        : "PDF metadata detected, but no base64 payload was produced by the browser."
    };
  }


  if (kind === "image") {
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
      base64Length: base64.length,
      role: "context",
      uploaded: true,
      status: "REFERENCE_ONLY",
      mode: "REFERENCE_ONLY",
      textLength: 0,
      reason: "Image file prepared as reference-only visual payload."
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
    uploaded: true,
    status: "REFERENCE_ONLY",
    mode: "REFERENCE_ONLY",
    textLength: 0,
    reason: "Binary file kept as reference-only because no safe text extraction is available in the browser."
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

import { createHash, randomUUID } from "node:crypto";

import {
  describeDefaultIprBoundMemoryStore,
  getDatabaseReadyIprBoundMemoryStore,
  getDefaultIprBoundMemoryStore,
  getProcessIprBoundMemoryStore
} from "./ipr-bound-memory-store";

import type {
  IprBoundMemoryStoreAdapter,
  IprBoundMemoryStoreDescription
} from "./ipr-bound-memory-store";

export type MemoryScope = "RUNTIME_ONLY" | "IPR_BOUND";

export type MemoryPersistenceMode =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type MemoryAuthority =
  | "SESSION_RUNTIME_ONLY"
  | "SERVER_RUNTIME_VALIDATED";

export type MemorySubjectKind =
  | "BIOLOGICAL_SUBJECT"
  | "AI_RUNTIME"
  | "UNKNOWN";

export type IprBoundMemorySubject = {
  entity: string;
  ipr: string;
  kind: MemorySubjectKind | string;
};

export type IprBoundMemoryCertificate = {
  certificateId: string;
  certificateStatus: string;
  certificateScope: string[];
  certificateKind?: string;
  cardSerial?: string;
  certificateHash?: string;
};

export type IprBoundMemoryRuntimeIdentity = {
  entity: string;
  ipr: string;
  checkpoint?: string;
  cycle?: string;
  core?: string;
  org?: string;
  location?: string;
};

export type IprBoundMemoryHandoffEvaluation = {
  isValid: boolean;
  source: string;
  authority: string;
  matrixState: string;
  semanticMemoryScope: MemoryScope;
  reason: string;
  accessDecision?: string;
  identityBinding?: string;
  subject?: IprBoundMemorySubject;
  certificate?: IprBoundMemoryCertificate;
};

export type MemoryEventLink = {
  evt: string;
  opcProofId?: string;
  opcChainHash?: string;
  createdAt: string;
  userMessageHash: string;
  assistantMessageHash: string;
};

export type MemoryTurn = {
  user: string;
  assistant: string;
  createdAt: string;
  evt?: string;
};

export type IprBoundMemoryRecord = {
  memoryId: string;
  memoryKey: string;
  memoryKeyHash: string;
  scope: MemoryScope;
  authority: MemoryAuthority;
  persistenceMode: MemoryPersistenceMode;
  subject?: IprBoundMemorySubject;
  certificate?: IprBoundMemoryCertificate;
  runtime: IprBoundMemoryRuntimeIdentity;
  matrixState: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  lastEvt?: string;
  lastOpcProofId?: string;
  lastOpcChainHash?: string;
  eventLinks: MemoryEventLink[];
  facts: string[];
  recentTurns: MemoryTurn[];
  summary: string;
  memoryHash: string;
};

export type GetOrCreateRuntimeMemoryInput = {
  sessionId: string;
  handoff: IprBoundMemoryHandoffEvaluation;
  runtime: IprBoundMemoryRuntimeIdentity;
  previousContinuityRef?: string | null;
  seedFacts?: string[];
  store?: IprBoundMemoryStoreAdapter;
};

export type UpdateMemoryAfterCompletionInput = {
  memory: IprBoundMemoryRecord;
  userMessage: string;
  assistantMessage: string;
  evt: string;
  opcProofId?: string;
  opcChainHash?: string;
  extraFacts?: string[];
  store?: IprBoundMemoryStoreAdapter;
};

export type PublicIprBoundMemoryRecord = {
  memoryId: string;
  memoryKeyHash: string;
  scope: MemoryScope;
  authority: MemoryAuthority;
  persistenceMode: MemoryPersistenceMode;
  subject?: IprBoundMemorySubject;
  certificate?: IprBoundMemoryCertificate;
  runtime: IprBoundMemoryRuntimeIdentity;
  matrixState: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  lastEvt?: string;
  lastOpcProofId?: string;
  lastOpcChainHash?: string;
  eventLinks: MemoryEventLink[];
  facts: string[];
  recentTurns: MemoryTurn[];
  summary: string;
  memoryHash: string;
};

const MAX_MEMORY_FACTS = 32;
const MAX_MEMORY_EVENTS = 24;
const MAX_MEMORY_TURNS = 8;
const MAX_MEMORY_TEXT_CHARS = 900;

export const IPR_BOUND_MEMORY_BOUNDARY =
  "IPR-bound memory preserves operational continuity only. It cannot override HBCE governance, policy evaluation, cyber safety boundaries, human oversight, fail-closed logic, or legal certification boundaries.";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

export function truncateRuntimeText(value: string, max = MAX_MEMORY_TEXT_CHARS): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 3)}...`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function normalizeFact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function mergeUniqueStrings(current: string[], next: string[], max: number): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const item of [...current, ...next]) {
    const normalized = normalizeFact(item);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(normalized);
  }

  return merged.slice(-max);
}

function resolveMemoryStore(
  store?: IprBoundMemoryStoreAdapter
): IprBoundMemoryStoreAdapter {
  return store ?? getDefaultIprBoundMemoryStore();
}

function resolvePersistenceMode(
  store: IprBoundMemoryStoreAdapter
): MemoryPersistenceMode {
  if (store.kind === "PROCESS_MEMORY_MVP") {
    return "PROCESS_MEMORY_MVP";
  }

  if (store.kind === "DATABASE_READY") {
    return "DATABASE_READY";
  }

  if (store.kind === "DATABASE_PERSISTENT") {
    return "DATABASE_PERSISTENT";
  }

  return "EXTERNAL_ADAPTER";
}

function buildMemoryKey(input: GetOrCreateRuntimeMemoryInput): string {
  if (input.handoff.isValid && input.handoff.subject?.ipr) {
    return [
      "IPR_BOUND",
      input.handoff.subject.ipr,
      input.runtime.ipr,
      input.sessionId
    ].join("::");
  }

  return ["RUNTIME_ONLY", input.runtime.ipr, input.sessionId].join("::");
}

function buildMemorySummary(input: {
  handoff: IprBoundMemoryHandoffEvaluation;
  runtime: IprBoundMemoryRuntimeIdentity;
  sessionId: string;
}): string {
  if (input.handoff.isValid && input.handoff.subject) {
    return [
      `JOKER-C2 is operating with IPR-bound memory for ${input.handoff.subject.entity}.`,
      `Human IPR ${input.handoff.subject.ipr} is bound to runtime IPR ${input.runtime.ipr}.`,
      `Memory key is scoped to human_ipr + runtime_ipr + session_id.`,
      `Session ${input.sessionId} remains governed by HBCE policy, EVT continuity, OPC proof receipts and MATRIX coordination.`
    ].join(" ");
  }

  return [
    `JOKER-C2 is operating with runtime-only memory.`,
    `No verified biological IPR is available for this session.`,
    `Memory remains scoped to runtime IPR ${input.runtime.ipr} and session ${input.sessionId}.`,
    `No biological identity continuity may be inferred without server-side IPR validation.`
  ].join(" ");
}

function buildDerivedCanonicalMemoryFacts(input: GetOrCreateRuntimeMemoryInput): string[] {
  const facts = [
    "The active operational repository is hbce-ai-joker-c2.",
    "JOKER-C2 is the governed AI runtime demonstrator of HERMETICUM B.C.E., not a foundation model and not an autonomous offensive C2 system.",
    "OpenAI provides the cognitive engine; HBCE/JOKER-C2 provides runtime governance, identity, event continuity, risk logic, proof receipts and audit posture.",
    "HBCE IPR Onboarding is the gateway that prepares the IPR handoff; JOKER-C2 operates after a valid handoff reaches the runtime.",
    "The central runtime file for chat orchestration is app/api/chat/route.ts.",
    "The dedicated server-side memory module is lib/ipr-bound-memory.ts.",
    "The dedicated storage adapter layer is lib/ipr-bound-memory-store.ts.",
    "IPR identifies; EVT traces; Memory preserves continuity; OPC proves; MATRIX organizes; HBCE governs.",
    "The memory key must be scoped to human_ipr + runtime_ipr + session_id when biological IPR is verified.",
    "If the biological IPR is not verified, semantic memory remains RUNTIME_ONLY.",
    "If the biological IPR is verified server-side, semantic memory may become IPR_BOUND.",
    "Every governed operation should preserve continuity through EVT and OPC linkage.",
    "Memory cannot override policy, risk evaluation, human oversight, cyber safety, fail-closed behavior or legal certification boundaries.",
    "Repository work must be delivered as complete integral files, not partial patches.",
    "For GitHub work, the expected delivery format is: nome file, ragionamento della rifattorizzazione, il file integrale, il commit del file."
  ];

  if (input.previousContinuityRef) {
    facts.push(`The previous runtime continuity reference is ${input.previousContinuityRef}.`);
  }

  if (input.handoff.isValid && input.handoff.subject) {
    facts.push(
      `The verified biological subject is ${input.handoff.subject.entity}.`,
      `The verified biological IPR is ${input.handoff.subject.ipr}.`,
      `The current memory scope is IPR_BOUND.`,
      `The current memory authority is SERVER_RUNTIME_VALIDATED.`,
      `The current MATRIX state is ${input.handoff.matrixState}.`
    );
  } else {
    facts.push(
      "No verified biological subject is available.",
      "The current memory scope is RUNTIME_ONLY.",
      "The current memory authority is SESSION_RUNTIME_ONLY."
    );
  }

  if (input.handoff.certificate) {
    facts.push(
      `The active operational certificate is ${input.handoff.certificate.certificateId}.`,
      `The operational certificate status is ${input.handoff.certificate.certificateStatus}.`,
      `The operational certificate scope is ${input.handoff.certificate.certificateScope.join(", ")}.`
    );

    if (input.handoff.certificate.cardSerial) {
      facts.push(`The active IPR Card serial is ${input.handoff.certificate.cardSerial}.`);
    }
  }

  if (input.seedFacts?.length) {
    facts.push(...input.seedFacts);
  }

  return mergeUniqueStrings([], facts, MAX_MEMORY_FACTS);
}

export function buildMemoryRecordHash(
  record: Omit<IprBoundMemoryRecord, "memoryHash"> | IprBoundMemoryRecord
): string {
  const canonical = {
    memoryId: record.memoryId,
    memoryKeyHash: record.memoryKeyHash,
    scope: record.scope,
    authority: record.authority,
    persistenceMode: record.persistenceMode,
    subject: record.subject,
    certificate: record.certificate,
    runtime: record.runtime,
    matrixState: record.matrixState,
    sessionId: record.sessionId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastEvt: record.lastEvt,
    lastOpcProofId: record.lastOpcProofId,
    lastOpcChainHash: record.lastOpcChainHash,
    eventLinks: record.eventLinks,
    facts: record.facts,
    recentTurns: record.recentTurns,
    summary: record.summary
  };

  return sha256Hex(stableStringify(canonical));
}

export function getOrCreateRuntimeMemory(
  input: GetOrCreateRuntimeMemoryInput
): IprBoundMemoryRecord {
  const store = resolveMemoryStore(input.store);
  const memoryKey = buildMemoryKey(input);
  const existing = store.get(memoryKey);
  const now = new Date().toISOString();
  const persistenceMode = resolvePersistenceMode(store);

  const scope: MemoryScope =
    input.handoff.isValid && input.handoff.subject?.ipr ? "IPR_BOUND" : "RUNTIME_ONLY";

  const authority: MemoryAuthority =
    scope === "IPR_BOUND" ? "SERVER_RUNTIME_VALIDATED" : "SESSION_RUNTIME_ONLY";

  if (existing) {
    const nextFacts = buildDerivedCanonicalMemoryFacts(input);

    const updatedWithoutHash: Omit<IprBoundMemoryRecord, "memoryHash"> = {
      ...existing,
      scope,
      authority,
      persistenceMode,
      subject: input.handoff.subject ?? existing.subject,
      certificate: input.handoff.certificate ?? existing.certificate,
      runtime: input.runtime,
      matrixState: input.handoff.matrixState,
      updatedAt: now,
      facts: mergeUniqueStrings(existing.facts, nextFacts, MAX_MEMORY_FACTS),
      summary: buildMemorySummary({
        handoff: input.handoff,
        runtime: input.runtime,
        sessionId: input.sessionId
      })
    };

    const updated: IprBoundMemoryRecord = {
      ...updatedWithoutHash,
      memoryHash: buildMemoryRecordHash(updatedWithoutHash)
    };

    store.set(memoryKey, updated);

    return updated;
  }

  const createdWithoutHash: Omit<IprBoundMemoryRecord, "memoryHash"> = {
    memoryId: `MEM-${sha256Hex(`${memoryKey}::${now}::${randomUUID()}`).slice(0, 16)}`,
    memoryKey,
    memoryKeyHash: sha256Hex(memoryKey),
    scope,
    authority,
    persistenceMode,
    subject: input.handoff.subject,
    certificate: input.handoff.certificate,
    runtime: input.runtime,
    matrixState: input.handoff.matrixState,
    sessionId: input.sessionId,
    createdAt: now,
    updatedAt: now,
    lastEvt: input.previousContinuityRef || undefined,
    lastOpcProofId: undefined,
    lastOpcChainHash: undefined,
    eventLinks: [],
    facts: buildDerivedCanonicalMemoryFacts(input),
    recentTurns: [],
    summary: buildMemorySummary({
      handoff: input.handoff,
      runtime: input.runtime,
      sessionId: input.sessionId
    })
  };

  const created: IprBoundMemoryRecord = {
    ...createdWithoutHash,
    memoryHash: buildMemoryRecordHash(createdWithoutHash)
  };

  store.set(memoryKey, created);

  return created;
}

export function updateMemoryAfterCompletion(
  input: UpdateMemoryAfterCompletionInput
): IprBoundMemoryRecord {
  const store = resolveMemoryStore(input.store);
  const now = new Date().toISOString();

  const eventLink: MemoryEventLink = {
    evt: input.evt,
    opcProofId: input.opcProofId,
    opcChainHash: input.opcChainHash,
    createdAt: now,
    userMessageHash: sha256Hex(input.userMessage),
    assistantMessageHash: sha256Hex(input.assistantMessage)
  };

  const turn: MemoryTurn = {
    user: truncateRuntimeText(input.userMessage),
    assistant: truncateRuntimeText(input.assistantMessage),
    createdAt: now,
    evt: input.evt
  };

  const nextFacts = mergeUniqueStrings(
    input.memory.facts,
    input.extraFacts ?? [],
    MAX_MEMORY_FACTS
  );

  const updatedWithoutHash: Omit<IprBoundMemoryRecord, "memoryHash"> = {
    ...input.memory,
    persistenceMode: resolvePersistenceMode(store),
    updatedAt: now,
    lastEvt: input.evt,
    lastOpcProofId: input.opcProofId ?? input.memory.lastOpcProofId,
    lastOpcChainHash: input.opcChainHash ?? input.memory.lastOpcChainHash,
    eventLinks: [...input.memory.eventLinks, eventLink].slice(-MAX_MEMORY_EVENTS),
    facts: nextFacts,
    recentTurns: [...input.memory.recentTurns, turn].slice(-MAX_MEMORY_TURNS),
    summary: [
      input.memory.summary,
      `Last governed interaction was linked to ${input.evt}.`,
      input.opcProofId ? `Last OPC proof receipt is ${input.opcProofId}.` : "",
      input.opcChainHash ? `Last OPC chain hash is ${input.opcChainHash}.` : ""
    ]
      .filter(Boolean)
      .join(" ")
  };

  const updated: IprBoundMemoryRecord = {
    ...updatedWithoutHash,
    memoryHash: buildMemoryRecordHash(updatedWithoutHash)
  };

  store.set(updated.memoryKey, updated);

  return updated;
}

export function buildMemoryPromptFrame(memory: IprBoundMemoryRecord): string {
  const subjectLine = memory.subject
    ? `Verified biological subject: ${memory.subject.entity} (${memory.subject.ipr}).`
    : "Verified biological subject: NOT_VERIFIED.";

  const certificateLine = memory.certificate
    ? [
        `Certificate: ${memory.certificate.certificateId}.`,
        `Status: ${memory.certificate.certificateStatus}.`,
        `Scope: ${memory.certificate.certificateScope.join(", ")}.`
      ].join(" ")
    : "Certificate: NO_CERTIFICATE.";

  const recentTurns = memory.recentTurns.length
    ? memory.recentTurns
        .map((turn, index) =>
          [
            `Turn ${index + 1}:`,
            `User: ${turn.user}`,
            `Assistant: ${turn.assistant}`,
            turn.evt ? `EVT: ${turn.evt}` : ""
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join("\n")
    : "No previous memory turns recorded in this runtime process.";

  return [
    "HBCE-GENERATED IPR-BOUND MEMORY CONTEXT",
    `Memory ID: ${memory.memoryId}`,
    `Memory key hash: ${memory.memoryKeyHash}`,
    `Memory hash: ${memory.memoryHash}`,
    `Scope: ${memory.scope}`,
    `Authority: ${memory.authority}`,
    `Persistence mode: ${memory.persistenceMode}`,
    `MATRIX: ${memory.matrixState}`,
    `Runtime entity: ${memory.runtime.entity}`,
    `Runtime IPR: ${memory.runtime.ipr}`,
    subjectLine,
    certificateLine,
    `Last memory EVT: ${memory.lastEvt || "none"}`,
    `Last memory OPC proof: ${memory.lastOpcProofId || "none"}`,
    `Last memory OPC chain hash: ${memory.lastOpcChainHash || "none"}`,
    `Summary: ${memory.summary}`,
    "Canonical memory facts:",
    ...memory.facts.map((fact) => `- ${fact}`),
    "Recent memory turns:",
    recentTurns,
    "Memory boundary:",
    IPR_BOUND_MEMORY_BOUNDARY
  ].join("\n");
}

export function toPublicMemoryRecord(
  memory: IprBoundMemoryRecord
): PublicIprBoundMemoryRecord {
  return {
    memoryId: memory.memoryId,
    memoryKeyHash: memory.memoryKeyHash,
    scope: memory.scope,
    authority: memory.authority,
    persistenceMode: memory.persistenceMode,
    subject: memory.subject,
    certificate: memory.certificate,
    runtime: memory.runtime,
    matrixState: memory.matrixState,
    sessionId: memory.sessionId,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    lastEvt: memory.lastEvt,
    lastOpcProofId: memory.lastOpcProofId,
    lastOpcChainHash: memory.lastOpcChainHash,
    eventLinks: memory.eventLinks,
    facts: memory.facts,
    recentTurns: memory.recentTurns,
    summary: memory.summary,
    memoryHash: memory.memoryHash
  };
}

export function describeRuntimeMemoryStore(): IprBoundMemoryStoreDescription {
  return describeDefaultIprBoundMemoryStore();
}

export function getRuntimeMemoryStoreSize(): number {
  return getDefaultIprBoundMemoryStore().size();
}

export function getRuntimeMemoryByKeyHash(
  memoryKeyHash: string
): PublicIprBoundMemoryRecord | null {
  const memory = getDefaultIprBoundMemoryStore().findByMemoryKeyHash(memoryKeyHash);

  if (!memory) {
    return null;
  }

  return toPublicMemoryRecord(memory);
}

export function clearProcessRuntimeMemory(): void {
  getProcessIprBoundMemoryStore().clear();
}

export function getProcessMemoryStoreDescription(): IprBoundMemoryStoreDescription {
  return getProcessIprBoundMemoryStore().describe();
}

export function getDatabaseReadyMemoryStoreDescription(): IprBoundMemoryStoreDescription {
  return getDatabaseReadyIprBoundMemoryStore().describe();
}

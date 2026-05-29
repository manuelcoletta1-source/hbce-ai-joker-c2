import { createHash } from "node:crypto";


import {
  describeDefaultHbceDatabase,
  ensureHbceDatabaseReady,
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";


import type {
  HbceDatabaseQueryRow,
  HbceDatabaseQueryValue
} from "./ipr-database";


export type IprBoundMemoryStoreKind =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";


export type IprBoundMemoryStoreStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DEGRADED";


export type IprBoundMemoryPersistenceStage =
  | "RUNTIME_VOLATILE"
  | "DATABASE_CONTRACT_READY"
  | "DATABASE_PERSISTENT_TARGET"
  | "DATABASE_PERSISTENT_ACTIVE"
  | "EXTERNAL_ADAPTER_TARGET";


export type IprBoundMemoryStoreCapability =
  | "IPR_BOUND_MEMORY"
  | "MEMORY_KEY_LOOKUP"
  | "MEMORY_HASH_LOOKUP"
  | "PROCESS_SCOPED_RUNTIME"
  | "DATABASE_CONTRACT"
  | "DATABASE_CONNECTION_DETECTED"
  | "DATABASE_MEMORY_WRITER_REQUIRED"
  | "DATABASE_MEMORY_WRITER_ACTIVE"
  | "DATABASE_MEMORY_READER_ACTIVE"
  | "DATABASE_DURABILITY_TARGET"
  | "TENANT_SCOPE_REQUIRED"
  | "WORKSPACE_SCOPE_REQUIRED"
  | "ACCESS_CONTROL_REQUIRED"
  | "ENCRYPTION_REQUIRED"
  | "AUDIT_LOG_REQUIRED"
  | "RETENTION_REQUIRED"
  | "DELETION_REQUIRED"
  | "BACKUP_REQUIRED"
  | "RECOVERY_REQUIRED"
  | "MONITORING_REQUIRED"
  | "EXTERNAL_ADAPTER_CONTRACT";


export type IprBoundMemoryStoreRecord = {
  memoryId: string;
  memoryKey: string;
  memoryKeyHash: string;
  tenantId?: string;
  workspaceId?: string;
  threadId?: string;
  sessionId?: string;
  subject?: {
    ipr?: string;
    [key: string]: unknown;
  };
  runtime?: {
    ipr?: string;
    [key: string]: unknown;
  };
  saas?: {
    tenantId?: string;
    workspaceId?: string;
    subscriptionTier?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};


export type IprBoundMemoryRegisteredEvent = {
  registeredEventId: string;
  eventName: string;
  eventNameHash: string;
  tenantId: string | null;
  workspaceId: string | null;
  subscriptionId: string | null;
  accountId: string | null;
  humanIpr: string | null;
  runtimeIpr: string;
  memoryId: string;
  evtId: string | null;
  opcProofId: string | null;
  auditId: string | null;
  usageId: string | null;
  eventScope: string;
  eventStatus: string;
  continuityHash: string;
  createdAt: string;
  payload: Record<string, unknown>;
  legalCertification: false;
};


export type IprBoundMemoryStoreDatabaseDescription = {
  configured: boolean;
  available: boolean;
  description: ReturnType<typeof describeDefaultHbceDatabase>;
  note: string;
};


export type IprBoundMemoryStoreDescription = {
  name: string;
  kind: IprBoundMemoryStoreKind;
  status: IprBoundMemoryStoreStatus;
  durable: boolean;
  runtimeScoped: boolean;
  recordCount: number;
  boundary: string;
  persistenceStage: IprBoundMemoryPersistenceStage;
  saasReady: boolean;
  requiresDatabase: boolean;
  legalCertification: false;
  capabilities: IprBoundMemoryStoreCapability[];
  requirements: string[];
  database?: IprBoundMemoryStoreDatabaseDescription;
};


export type IprBoundMemoryDatabaseWriteContext = {
  tenantId?: string | null;
  workspaceId?: string | null;
  threadId?: string | null;
};


export type IprBoundMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
> = {
  name: string;
  kind: IprBoundMemoryStoreKind;
  durable: boolean;
  runtimeScoped: boolean;


  describe(): IprBoundMemoryStoreDescription;


  get(memoryKey: string): TRecord | undefined;
  set(memoryKey: string, record: TRecord): TRecord;
  has(memoryKey: string): boolean;
  delete(memoryKey: string): boolean;
  clear(): void;
  size(): number;
  values(): TRecord[];
  findByMemoryKeyHash(memoryKeyHash: string): TRecord | null;
};


export type IprBoundMemoryAsyncStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
> = IprBoundMemoryStoreAdapter<TRecord> & {
  getAsync(memoryKey: string): Promise<TRecord | undefined>;
  setAsync(
    memoryKey: string,
    record: TRecord,
    context?: IprBoundMemoryDatabaseWriteContext
  ): Promise<TRecord>;
  hasAsync(memoryKey: string): Promise<boolean>;
  deleteAsync(memoryKey: string): Promise<boolean>;
  clearAsync(): Promise<void>;
  sizeAsync(): Promise<number>;
  valuesAsync(): Promise<TRecord[]>;
  findByMemoryKeyHashAsync(memoryKeyHash: string): Promise<TRecord | null>;
};


type MemoryRecordDatabaseRow = HbceDatabaseQueryRow & {
  memory_id?: string;
  tenant_id?: string | null;
  workspace_id?: string | null;
  memory_key_hash?: string;
  human_ipr?: string | null;
  runtime_ipr?: string | null;
  session_id?: string | null;
  thread_id?: string | null;
  scope?: string | null;
  authority?: string | null;
  persistence_mode?: string | null;
  memory_hash?: string | null;
  memory_chain_hash?: string | null;
  last_evt_id?: string | null;
  last_opc_proof_id?: string | null;
  last_opc_chain_hash?: string | null;
  record_payload?: unknown;
  record_count?: number | string;
};


type MemoryRegisteredEventDatabaseRow = HbceDatabaseQueryRow & {
  registered_event_id?: string;
  tenant_id?: string | null;
  workspace_id?: string | null;
  subscription_id?: string | null;
  account_id?: string | null;
  human_ipr?: string | null;
  runtime_ipr?: string | null;
  memory_id?: string | null;
  evt_id?: string | null;
  opc_proof_id?: string | null;
  audit_id?: string | null;
  usage_id?: string | null;
  event_name?: string;
  event_name_hash?: string;
  event_scope?: string | null;
  event_status?: string | null;
  continuity_hash?: string | null;
  created_at?: string | Date;
  payload?: unknown;
  legal_certification?: boolean;
};


const PROCESS_MEMORY_STORE_BOUNDARY =
  "This adapter stores IPR-bound memory in server-side process memory only. It is valid for MVP runtime demonstrations, but it is not durable enterprise storage and may reset on redeploy, cold start, instance recycling or runtime migration.";


const DATABASE_READY_BOUNDARY =
  "This adapter declares that the codebase is prepared for a database memory layer. It is not an active durable store until the async database memory writer is used by the runtime path.";


const DATABASE_PERSISTENT_BOUNDARY =
  "This adapter provides the DATABASE_PERSISTENT target for durable SaaS memory through the memory_records table. The synchronous runtime path writes to process cache and schedules database persistence; the async path performs authoritative database read/write. It requires HBCE database availability, tenant and workspace scoping where available, access control, retention, deletion, backup, recovery and monitoring before production reliance.";


const EXTERNAL_ADAPTER_BOUNDARY =
  "This adapter declares support for an external memory adapter supplied by the runtime. External adapters must enforce HBCE memory boundaries, IPR scoping, auditability, fail-closed behavior and legalCertification=false unless a valid regulated certification layer is later integrated.";


const STORE_NOT_CONFIGURED_ERROR =
  "IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED";


const DATABASE_CLEAR_DISABLED_ERROR =
  "IPR_BOUND_MEMORY_DATABASE_CLEAR_DISABLED";


const PROCESS_MEMORY_CAPABILITIES: IprBoundMemoryStoreCapability[] = [
  "IPR_BOUND_MEMORY",
  "MEMORY_KEY_LOOKUP",
  "MEMORY_HASH_LOOKUP",
  "REGISTERED_EVENT_LOOKUP",
  "PROCESS_SCOPED_RUNTIME"
];


const DATABASE_READY_CAPABILITIES: IprBoundMemoryStoreCapability[] = [
  "IPR_BOUND_MEMORY",
  "MEMORY_KEY_LOOKUP",
  "MEMORY_HASH_LOOKUP",
  "REGISTERED_EVENT_LOOKUP",
  "DATABASE_CONTRACT",
  "DATABASE_CONNECTION_DETECTED",
  "DATABASE_MEMORY_WRITER_REQUIRED",
  "TENANT_SCOPE_REQUIRED",
  "WORKSPACE_SCOPE_REQUIRED",
  "ACCESS_CONTROL_REQUIRED",
  "ENCRYPTION_REQUIRED",
  "AUDIT_LOG_REQUIRED",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED"
];


const DATABASE_PERSISTENT_CAPABILITIES: IprBoundMemoryStoreCapability[] = [
  "IPR_BOUND_MEMORY",
  "MEMORY_KEY_LOOKUP",
  "MEMORY_HASH_LOOKUP",
  "REGISTERED_EVENT_LOOKUP",
  "DATABASE_CONTRACT",
  "DATABASE_CONNECTION_DETECTED",
  "DATABASE_MEMORY_WRITER_ACTIVE",
  "DATABASE_MEMORY_READER_ACTIVE",
  "DATABASE_DURABILITY_TARGET",
  "TENANT_SCOPE_REQUIRED",
  "WORKSPACE_SCOPE_REQUIRED",
  "ACCESS_CONTROL_REQUIRED",
  "ENCRYPTION_REQUIRED",
  "AUDIT_LOG_REQUIRED",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED",
  "BACKUP_REQUIRED",
  "RECOVERY_REQUIRED",
  "MONITORING_REQUIRED"
];


const EXTERNAL_ADAPTER_CAPABILITIES: IprBoundMemoryStoreCapability[] = [
  "IPR_BOUND_MEMORY",
  "MEMORY_KEY_LOOKUP",
  "MEMORY_HASH_LOOKUP",
  "REGISTERED_EVENT_LOOKUP",
  "EXTERNAL_ADAPTER_CONTRACT",
  "TENANT_SCOPE_REQUIRED",
  "WORKSPACE_SCOPE_REQUIRED",
  "ACCESS_CONTROL_REQUIRED",
  "AUDIT_LOG_REQUIRED",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED"
];


const PROCESS_MEMORY_REQUIREMENTS = [
  "Use only for MVP runtime demonstrations.",
  "Do not treat process memory as durable SaaS storage.",
  "Do not rely on this adapter for enterprise audit, replay, retention or deletion guarantees.",
  "Expect reset on redeploy, cold start, instance recycling or runtime migration."
];


const DATABASE_READY_REQUIREMENTS = [
  "Connect and use the database memory writer before claiming DATABASE_PERSISTENT continuity.",
  "Keep DATABASE_READY as preparation only when the database writer is unavailable.",
  "Define tenant and workspace scoping.",
  "Define access control.",
  "Define retention and deletion policy.",
  "Define encryption strategy.",
  "Define audit backend.",
  "Define backup and recovery before production use."
];


const DATABASE_PERSISTENT_REQUIREMENTS = [
  "Real database storage must be active.",
  "The memory persistence layer must write memory records to the memory_records table.",
  "The memory persistence layer must read memory records from the memory_records table.",
  "Named operational events must be persisted to memory_registered_events for SaaS B2G recall.",
  "Tenant isolation must be enforced when tenant_id is available.",
  "Workspace isolation must be enforced when workspace_id is available.",
  "Subject IPR and runtime IPR binding must be persisted.",
  "Access control must be enforced before read, write, delete and audit operations.",
  "Encryption at rest and transport security must be defined.",
  "Audit logging must cover memory creation, update, lookup, deletion and export.",
  "Retention, deletion and recovery workflows must be testable.",
  "Backups and operational monitoring must be active.",
  "OPC remains technical proof only; legalCertification=false."
];


const EXTERNAL_ADAPTER_REQUIREMENTS = [
  "External adapter must implement the full IprBoundMemoryStoreAdapter contract.",
  "External adapter must preserve IPR-bound memory boundaries.",
  "External adapter must enforce tenant and workspace scoping when used in SaaS mode.",
  "External adapter must expose auditability and fail-closed behavior.",
  "External adapter must preserve legalCertification=false unless a regulated certification layer is later integrated."
];


type HbceJokerC2GlobalMemoryStore = typeof globalThis & {
  __HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__?: Map<
    string,
    IprBoundMemoryStoreRecord
  >;
  __HBCE_JOKER_C2_IPR_BOUND_MEMORY_FLUSH_ERRORS_V1__?: string[];
};


const globalMemoryStore = globalThis as HbceJokerC2GlobalMemoryStore;


const processMemoryMap =
  globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__ ??
  new Map<string, IprBoundMemoryStoreRecord>();


globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__ =
  processMemoryMap;


const memoryFlushErrors =
  globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_FLUSH_ERRORS_V1__ ?? [];


globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_FLUSH_ERRORS_V1__ =
  memoryFlushErrors;


let databaseSchemaReadyPromise: Promise<void> | null = null;


function normalizeMemoryKey(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}


function normalizeMemoryKeyHash(value: string): string {
  return value.replace(/\s+/g, "").trim().toUpperCase();
}


function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}


function assertMemoryKey(memoryKey: string): string {
  const normalized = normalizeMemoryKey(memoryKey);


  if (!normalized) {
    throw new Error("IPR_BOUND_MEMORY_STORE_EMPTY_MEMORY_KEY");
  }


  return normalized;
}


function memoryKeyToHash(memoryKey: string): string {
  return sha256Hex(assertMemoryKey(memoryKey));
}


function assertMemoryKeyHash(memoryKeyHash: string): string {
  const normalized = normalizeMemoryKeyHash(memoryKeyHash);


  if (!normalized) {
    throw new Error("IPR_BOUND_MEMORY_STORE_EMPTY_MEMORY_KEY_HASH");
  }


  return normalized;
}


function assertMemoryRecord<TRecord extends IprBoundMemoryStoreRecord>(
  record: TRecord
): TRecord {
  if (!record || typeof record !== "object") {
    throw new Error("IPR_BOUND_MEMORY_STORE_INVALID_RECORD");
  }


  if (!record.memoryId || !record.memoryKey || !record.memoryKeyHash) {
    throw new Error("IPR_BOUND_MEMORY_STORE_INCOMPLETE_RECORD");
  }


  return record;
}


function normalizeMemoryRecord<TRecord extends IprBoundMemoryStoreRecord>(
  record: TRecord
): TRecord {
  const safeRecord = assertMemoryRecord(record);
  const memoryKey = assertMemoryKey(safeRecord.memoryKey);


  return {
    ...safeRecord,
    memoryKey,
    memoryKeyHash: assertMemoryKeyHash(safeRecord.memoryKeyHash || memoryKeyToHash(memoryKey))
  };
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function readRecordPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;


  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }


    current = current[key];
  }


  return current;
}


function readStringPath(value: unknown, path: string[], fallback = ""): string {
  const item = readRecordPath(value, path);


  if (typeof item === "string" && item.trim()) {
    return item.trim();
  }


  if (typeof item === "number" || typeof item === "boolean") {
    return String(item);
  }


  return fallback;
}


function readNullableStringPath(value: unknown, path: string[]): string | null {
  const text = readStringPath(value, path, "");


  return text || null;
}


function firstNullableStringPath(value: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    const text = readNullableStringPath(value, path);


    if (text) {
      return text;
    }
  }


  return null;
}


function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}


function normalizeJsonPayload(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) {
    return value;
  }


  if (typeof value === "string" && value.trim()) {
    const parsed = safeJsonParse(value);


    return isRecord(parsed) ? parsed : null;
  }


  return null;
}


function getMemoryDatabaseDescription(): IprBoundMemoryStoreDatabaseDescription {
  const configured = isHbceDatabaseConfigured();
  const available = isHbceDatabaseAvailable();


  return {
    configured,
    available,
    description: describeDefaultHbceDatabase(),
    note: available
      ? "HBCE database connection is available. The DATABASE_PERSISTENT memory store can use memory_records for durable IPR-bound memory."
      : configured
        ? "HBCE database is configured but not fully available to the memory store contract."
        : "HBCE database is not configured. IPR-bound memory remains process-scoped unless an external adapter is supplied."
  };
}


function isDatabasePersistentUsable(): boolean {
  return isHbceDatabaseConfigured() && isHbceDatabaseAvailable();
}


function resolveDatabasePlaceholderStatus(): IprBoundMemoryStoreStatus {
  const database = getMemoryDatabaseDescription();


  if (!database.configured) {
    return "NOT_CONFIGURED";
  }


  return database.available ? "AVAILABLE" : "DEGRADED";
}


function resolveDatabasePersistentStatus(): IprBoundMemoryStoreStatus {
  const database = getMemoryDatabaseDescription();


  if (!database.configured) {
    return "NOT_CONFIGURED";
  }


  if (!database.available) {
    return "DEGRADED";
  }


  return "AVAILABLE";
}


function buildStoreDescription(input: {
  name: string;
  kind: IprBoundMemoryStoreKind;
  status: IprBoundMemoryStoreStatus;
  durable: boolean;
  runtimeScoped: boolean;
  recordCount: number;
  boundary: string;
  persistenceStage: IprBoundMemoryPersistenceStage;
  saasReady: boolean;
  requiresDatabase: boolean;
  capabilities: IprBoundMemoryStoreCapability[];
  requirements: string[];
  database?: IprBoundMemoryStoreDatabaseDescription;
}): IprBoundMemoryStoreDescription {
  return {
    name: input.name,
    kind: input.kind,
    status: input.status,
    durable: input.durable,
    runtimeScoped: input.runtimeScoped,
    recordCount: input.recordCount,
    boundary: input.boundary,
    persistenceStage: input.persistenceStage,
    saasReady: input.saasReady,
    requiresDatabase: input.requiresDatabase,
    legalCertification: false,
    capabilities: input.capabilities,
    requirements: input.requirements,
    database: input.database
  };
}


function throwStoreNotConfigured(): never {
  throw new Error(STORE_NOT_CONFIGURED_ERROR);
}


function rememberFlushError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  memoryFlushErrors.push(message);


  while (memoryFlushErrors.length > 20) {
    memoryFlushErrors.shift();
  }
}


async function ensureDatabaseMemoryStoreReady(): Promise<void> {
  if (!isHbceDatabaseConfigured()) {
    throw new Error("IPR_BOUND_MEMORY_DATABASE_NOT_CONFIGURED");
  }


  if (!isHbceDatabaseAvailable()) {
    throw new Error("IPR_BOUND_MEMORY_DATABASE_NOT_AVAILABLE");
  }


  if (!databaseSchemaReadyPromise) {
    databaseSchemaReadyPromise = ensureHbceDatabaseReady().then((result) => {
      if (!result.ok) {
        throw new Error(
          result.initialization.error ||
            "IPR_BOUND_MEMORY_DATABASE_SCHEMA_INITIALIZATION_FAILED"
        );
      }
    });
  }


  try {
    await databaseSchemaReadyPromise;
  } catch (error) {
    databaseSchemaReadyPromise = null;
    throw error;
  }
}



function normalizeRegisteredEventName(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}


function readRegisteredEventsFromRecord(
  record: IprBoundMemoryStoreRecord
): IprBoundMemoryRegisteredEvent[] {
  const rawEvents = readRecordPath(record, ["registeredEvents"]);


  if (!Array.isArray(rawEvents)) {
    return [];
  }


  const fallbackTenantId = firstNullableStringPath(record, [
    ["tenantId"],
    ["saas", "tenantId"]
  ]);
  const fallbackWorkspaceId = firstNullableStringPath(record, [
    ["workspaceId"],
    ["saas", "workspaceId"]
  ]);
  const fallbackSubscriptionId = firstNullableStringPath(record, [
    ["subscriptionId"],
    ["saas", "subscriptionId"]
  ]);
  const fallbackAccountId = firstNullableStringPath(record, [
    ["accountId"],
    ["saas", "accountId"]
  ]);
  const fallbackHumanIpr = readNullableStringPath(record, ["subject", "ipr"]);
  const fallbackRuntimeIpr =
    readStringPath(record, ["runtime", "ipr"], "") || "IPR-AI-0001";


  return rawEvents
    .filter(isRecord)
    .map((event, index) => {
      const eventName = normalizeRegisteredEventName(
        readStringPath(event, ["eventName"], "") ||
          readStringPath(event, ["name"], "") ||
          readStringPath(event, ["event_name"], "")
      );


      if (!eventName) {
        return null;
      }


      const evtId = firstNullableStringPath(event, [
        ["evtId"],
        ["evt"],
        ["evt_id"]
      ]);
      const opcProofId = firstNullableStringPath(event, [
        ["opcProofId"],
        ["opcId"],
        ["opc"],
        ["opc_proof_id"]
      ]);
      const auditId = firstNullableStringPath(event, [["auditId"], ["audit_id"]]);
      const usageId = firstNullableStringPath(event, [["usageId"], ["usage_id"]]);
      const createdAt =
        readStringPath(event, ["createdAt"], "") ||
        readStringPath(event, ["created_at"], "") ||
        new Date().toISOString();
      const eventNameHash = sha256Hex(eventName.toUpperCase());
      const continuityHash =
        readStringPath(event, ["continuityHash"], "") ||
        sha256Hex(
          [
            eventName,
            record.memoryId,
            evtId || "NO_EVT",
            opcProofId || "NO_OPC",
            auditId || "NO_AUDIT",
            usageId || "NO_USAGE"
          ].join("::")
        );
      const registeredEventId =
        readStringPath(event, ["registeredEventId"], "") ||
        readStringPath(event, ["eventId"], "") ||
        `MRE-${sha256Hex(`${record.memoryId}::${eventName}::${evtId || index}`).slice(0, 16)}`;


      return {
        registeredEventId,
        eventName,
        eventNameHash,
        tenantId:
          firstNullableStringPath(event, [["tenantId"], ["tenant_id"]]) ||
          fallbackTenantId,
        workspaceId:
          firstNullableStringPath(event, [["workspaceId"], ["workspace_id"]]) ||
          fallbackWorkspaceId,
        subscriptionId:
          firstNullableStringPath(event, [["subscriptionId"], ["subscription_id"]]) ||
          fallbackSubscriptionId,
        accountId:
          firstNullableStringPath(event, [["accountId"], ["account_id"]]) ||
          fallbackAccountId,
        humanIpr:
          firstNullableStringPath(event, [["humanIpr"], ["human_ipr"]]) ||
          fallbackHumanIpr,
        runtimeIpr:
          readStringPath(event, ["runtimeIpr"], "") ||
          readStringPath(event, ["runtime_ipr"], "") ||
          fallbackRuntimeIpr,
        memoryId: record.memoryId,
        evtId,
        opcProofId,
        auditId,
        usageId,
        eventScope:
          readStringPath(event, ["eventScope"], "") ||
          readStringPath(event, ["event_scope"], "") ||
          "IPR_BOUND",
        eventStatus:
          readStringPath(event, ["eventStatus"], "") ||
          readStringPath(event, ["event_status"], "") ||
          "ACTIVE",
        continuityHash,
        createdAt,
        payload: {
          ...event,
          eventName,
          legalCertification: false
        },
        legalCertification: false as const
      } satisfies IprBoundMemoryRegisteredEvent;
    })
    .filter((event): event is IprBoundMemoryRegisteredEvent => Boolean(event));
}


function databaseRowToRegisteredMemoryEvent(
  row: MemoryRegisteredEventDatabaseRow
): IprBoundMemoryRegisteredEvent | null {
  const eventName = normalizeRegisteredEventName(row.event_name);


  if (!eventName || !row.registered_event_id || !row.event_name_hash) {
    return null;
  }


  const payload = normalizeJsonPayload(row.payload) || {};


  return {
    registeredEventId: row.registered_event_id,
    eventName,
    eventNameHash: row.event_name_hash,
    tenantId: row.tenant_id ?? null,
    workspaceId: row.workspace_id ?? null,
    subscriptionId: row.subscription_id ?? null,
    accountId: row.account_id ?? null,
    humanIpr: row.human_ipr ?? null,
    runtimeIpr: row.runtime_ipr || "IPR-AI-0001",
    memoryId: String(row.memory_id || ""),
    evtId: row.evt_id ?? null,
    opcProofId: row.opc_proof_id ?? null,
    auditId: row.audit_id ?? null,
    usageId: row.usage_id ?? null,
    eventScope: row.event_scope || "IPR_BOUND",
    eventStatus: row.event_status || "ACTIVE",
    continuityHash: row.continuity_hash || "",
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || ""),
    payload,
    legalCertification: false
  };
}


async function upsertDatabaseRegisteredMemoryEvents(
  record: IprBoundMemoryStoreRecord
): Promise<void> {
  const events = readRegisteredEventsFromRecord(record);


  if (events.length === 0) {
    return;
  }


  await ensureDatabaseMemoryStoreReady();


  for (const event of events) {
    const result = await queryHbceDatabase(
      `
INSERT INTO memory_registered_events (
  registered_event_id,
  tenant_id,
  workspace_id,
  subscription_id,
  account_id,
  human_ipr,
  runtime_ipr,
  memory_id,
  evt_id,
  opc_proof_id,
  audit_id,
  usage_id,
  event_name,
  event_name_hash,
  event_scope,
  event_status,
  continuity_hash,
  payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14,
  $15,
  $16,
  $17,
  $18::jsonb,
  false
)
ON CONFLICT (registered_event_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  subscription_id = EXCLUDED.subscription_id,
  account_id = EXCLUDED.account_id,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  memory_id = EXCLUDED.memory_id,
  evt_id = EXCLUDED.evt_id,
  opc_proof_id = EXCLUDED.opc_proof_id,
  audit_id = EXCLUDED.audit_id,
  usage_id = EXCLUDED.usage_id,
  event_name = EXCLUDED.event_name,
  event_name_hash = EXCLUDED.event_name_hash,
  event_scope = EXCLUDED.event_scope,
  event_status = EXCLUDED.event_status,
  continuity_hash = EXCLUDED.continuity_hash,
  payload = EXCLUDED.payload,
  legal_certification = false;
`.trim(),
      [
        event.registeredEventId,
        event.tenantId,
        event.workspaceId,
        event.subscriptionId,
        event.accountId,
        event.humanIpr,
        event.runtimeIpr,
        event.memoryId,
        event.evtId,
        event.opcProofId,
        event.auditId,
        event.usageId,
        event.eventName,
        event.eventNameHash,
        event.eventScope,
        event.eventStatus,
        event.continuityHash,
        JSON.stringify(event.payload)
      ]
    );


    if (!result.ok) {
      throw new Error(
        result.error || "IPR_BOUND_MEMORY_REGISTERED_EVENT_UPSERT_FAILED"
      );
    }
  }
}


function memoryRecordToDatabaseFields(
  record: IprBoundMemoryStoreRecord,
  context?: IprBoundMemoryDatabaseWriteContext
): {
  tenantId: string | null;
  workspaceId: string | null;
  memoryId: string;
  memoryKeyHash: string;
  humanIpr: string | null;
  runtimeIpr: string;
  sessionId: string;
  threadId: string | null;
  scope: string;
  authority: string;
  persistenceMode: "DATABASE_PERSISTENT";
  memoryHash: string;
  memoryChainHash: string | null;
  lastEvtId: string | null;
  lastOpcProofId: string | null;
  lastOpcChainHash: string | null;
  recordPayloadJson: string;
} {
  const normalizedRecord = normalizeMemoryRecord(record);


  const tenantId =
    context?.tenantId ||
    firstNullableStringPath(normalizedRecord, [
      ["tenantId"],
      ["saas", "tenantId"]
    ]);


  const workspaceId =
    context?.workspaceId ||
    firstNullableStringPath(normalizedRecord, [
      ["workspaceId"],
      ["saas", "workspaceId"]
    ]);


  const runtimeIpr =
    readStringPath(normalizedRecord, ["runtime", "ipr"], "") ||
    "IPR-AI-0001";


  const sessionId =
    readStringPath(normalizedRecord, ["sessionId"], "") ||
    "UNKNOWN_SESSION";


  const threadId =
    context?.threadId ||
    firstNullableStringPath(normalizedRecord, [
      ["threadId"],
      ["conversationId"],
      ["sessionId"]
    ]);


  const scope =
    readStringPath(normalizedRecord, ["scope"], "") ||
    "RUNTIME_ONLY";


  const authority =
    readStringPath(normalizedRecord, ["authority"], "") ||
    "SESSION_RUNTIME_ONLY";


  const memoryHash =
    readStringPath(normalizedRecord, ["memoryHash"], "") ||
    sha256Hex(JSON.stringify(normalizedRecord));


  const lastOpcChainHash = readNullableStringPath(
    normalizedRecord,
    ["lastOpcChainHash"]
  );


  const persistentPayload = {
    ...normalizedRecord,
    tenantId,
    workspaceId,
    threadId,
    persistenceMode: "DATABASE_PERSISTENT",
    persistence: isRecord(normalizedRecord.persistence)
      ? {
          ...normalizedRecord.persistence,
          mode: "DATABASE_PERSISTENT",
          status: "DATABASE_PERSISTENT_ACTIVE",
          durable: true,
          runtimeScoped: false,
          databaseRequired: false,
          databaseReady: true,
          target: "DATABASE_PERSISTENT",
          legalCertification: false
        }
      : normalizedRecord.persistence,
    saas: isRecord(normalizedRecord.saas)
      ? {
          ...normalizedRecord.saas,
          tenantId: tenantId ?? normalizedRecord.saas.tenantId,
          workspaceId: workspaceId ?? normalizedRecord.saas.workspaceId,
          memoryTarget: "DATABASE_PERSISTENT",
          auditRequired: true,
          modelUsageLoggingRequired: true,
          evtRequired: true,
          opcRequired: true,
          legalCertification: false
        }
      : normalizedRecord.saas
  };


  return {
    tenantId,
    workspaceId,
    memoryId: normalizedRecord.memoryId,
    memoryKeyHash: normalizedRecord.memoryKeyHash,
    humanIpr: readNullableStringPath(normalizedRecord, ["subject", "ipr"]),
    runtimeIpr,
    sessionId,
    threadId,
    scope,
    authority,
    persistenceMode: "DATABASE_PERSISTENT",
    memoryHash,
    memoryChainHash: memoryHash,
    lastEvtId: readNullableStringPath(normalizedRecord, ["lastEvt"]),
    lastOpcProofId: readNullableStringPath(normalizedRecord, ["lastOpcProofId"]),
    lastOpcChainHash,
    recordPayloadJson: JSON.stringify(persistentPayload)
  };
}


function databaseRowToMemoryRecord<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(row: MemoryRecordDatabaseRow): TRecord | null {
  const payload = normalizeJsonPayload(row.record_payload);


  if (!payload) {
    return null;
  }


  const candidate = {
    ...payload,
    tenantId:
      readStringPath(payload, ["tenantId"], "") ||
      readStringPath(row, ["tenant_id"], ""),
    workspaceId:
      readStringPath(payload, ["workspaceId"], "") ||
      readStringPath(row, ["workspace_id"], ""),
    memoryId:
      readStringPath(payload, ["memoryId"], "") ||
      readStringPath(row, ["memory_id"], ""),
    memoryKeyHash:
      readStringPath(payload, ["memoryKeyHash"], "") ||
      readStringPath(row, ["memory_key_hash"], "")
  };


  if (!readStringPath(candidate, ["memoryKey"], "")) {
    return null;
  }


  const normalized = normalizeMemoryRecord(
    candidate as unknown as TRecord
  ) as TRecord;


  return {
    ...normalized,
    persistenceMode: "DATABASE_PERSISTENT",
    persistence: isRecord(normalized.persistence)
      ? {
          ...normalized.persistence,
          mode: "DATABASE_PERSISTENT",
          status: "DATABASE_PERSISTENT_ACTIVE",
          durable: true,
          runtimeScoped: false,
          databaseRequired: false,
          databaseReady: true,
          target: "DATABASE_PERSISTENT",
          legalCertification: false
        }
      : normalized.persistence,
    saas: isRecord(normalized.saas)
      ? {
          ...normalized.saas,
          tenantId:
            readStringPath(normalized, ["tenantId"], "") ||
            readStringPath(normalized.saas, ["tenantId"], ""),
          workspaceId:
            readStringPath(normalized, ["workspaceId"], "") ||
            readStringPath(normalized.saas, ["workspaceId"], ""),
          memoryTarget: "DATABASE_PERSISTENT",
          auditRequired: true,
          modelUsageLoggingRequired: true,
          evtRequired: true,
          opcRequired: true,
          legalCertification: false
        }
      : normalized.saas
  } as TRecord;
}


function cacheProcessMemoryRecord<TRecord extends IprBoundMemoryStoreRecord>(
  record: TRecord
): TRecord {
  const normalized = normalizeMemoryRecord(record);


  processMemoryMap.set(normalized.memoryKey, normalized);


  return normalized;
}


async function querySingleMemoryRecord<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  sql: string,
  params: HbceDatabaseQueryValue[]
): Promise<TRecord | null> {
  await ensureDatabaseMemoryStoreReady();


  const result = await queryHbceDatabase<MemoryRecordDatabaseRow>(sql, params);


  if (!result.ok) {
    throw new Error(result.error || "IPR_BOUND_MEMORY_DATABASE_QUERY_FAILED");
  }


  const row = result.rows[0];


  if (!row) {
    return null;
  }


  return databaseRowToMemoryRecord<TRecord>(row);
}


async function upsertDatabaseMemoryRecord<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  record: TRecord,
  context?: IprBoundMemoryDatabaseWriteContext
): Promise<TRecord> {
  await ensureDatabaseMemoryStoreReady();


  const normalizedRecord = normalizeMemoryRecord(record);
  const fields = memoryRecordToDatabaseFields(normalizedRecord, context);


  const result = await queryHbceDatabase<MemoryRecordDatabaseRow>(
    `
INSERT INTO memory_records (
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  record_payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14,
  $15,
  $16,
  $17::jsonb,
  false
)
ON CONFLICT (memory_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  memory_key_hash = EXCLUDED.memory_key_hash,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  session_id = EXCLUDED.session_id,
  thread_id = EXCLUDED.thread_id,
  scope = EXCLUDED.scope,
  authority = EXCLUDED.authority,
  persistence_mode = EXCLUDED.persistence_mode,
  memory_hash = EXCLUDED.memory_hash,
  memory_chain_hash = EXCLUDED.memory_chain_hash,
  last_evt_id = EXCLUDED.last_evt_id,
  last_opc_proof_id = EXCLUDED.last_opc_proof_id,
  last_opc_chain_hash = EXCLUDED.last_opc_chain_hash,
  updated_at = now(),
  record_payload = EXCLUDED.record_payload,
  legal_certification = false
RETURNING
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  record_payload;
`.trim(),
    [
      fields.memoryId,
      fields.tenantId,
      fields.workspaceId,
      fields.memoryKeyHash,
      fields.humanIpr,
      fields.runtimeIpr,
      fields.sessionId,
      fields.threadId,
      fields.scope,
      fields.authority,
      fields.persistenceMode,
      fields.memoryHash,
      fields.memoryChainHash,
      fields.lastEvtId,
      fields.lastOpcProofId,
      fields.lastOpcChainHash,
      fields.recordPayloadJson
    ]
  );


  if (!result.ok) {
    throw new Error(result.error || "IPR_BOUND_MEMORY_DATABASE_UPSERT_FAILED");
  }


  await upsertDatabaseRegisteredMemoryEvents(normalizedRecord);


  const persisted =
    result.rows[0] ? databaseRowToMemoryRecord<TRecord>(result.rows[0]) : null;


  const finalRecord = persisted || ({
    ...normalizedRecord,
    tenantId: fields.tenantId ?? normalizedRecord.tenantId,
    workspaceId: fields.workspaceId ?? normalizedRecord.workspaceId,
    threadId: fields.threadId ?? normalizedRecord.threadId,
    persistenceMode: "DATABASE_PERSISTENT"
  } as TRecord);


  cacheProcessMemoryRecord(finalRecord);


  return finalRecord;
}


function scheduleDatabaseMemoryFlush<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  record: TRecord,
  context?: IprBoundMemoryDatabaseWriteContext
): void {
  if (!isDatabasePersistentUsable()) {
    return;
  }


  void upsertDatabaseMemoryRecord(record, context).catch((error) => {
    rememberFlushError(error);
  });
}


export function createProcessMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  store: Map<string, TRecord> = processMemoryMap as Map<string, TRecord>
): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return {
    name: "HBCE_JOKER_C2_PROCESS_MEMORY_STORE",
    kind: "PROCESS_MEMORY_MVP",
    durable: false,
    runtimeScoped: true,


    describe(): IprBoundMemoryStoreDescription {
      return buildStoreDescription({
        name: this.name,
        kind: this.kind,
        status: "AVAILABLE",
        durable: this.durable,
        runtimeScoped: this.runtimeScoped,
        recordCount: store.size,
        boundary: PROCESS_MEMORY_STORE_BOUNDARY,
        persistenceStage: "RUNTIME_VOLATILE",
        saasReady: false,
        requiresDatabase: false,
        capabilities: PROCESS_MEMORY_CAPABILITIES,
        requirements: PROCESS_MEMORY_REQUIREMENTS,
        database: getMemoryDatabaseDescription()
      });
    },


    get(memoryKey: string): TRecord | undefined {
      return store.get(assertMemoryKey(memoryKey));
    },


    set(memoryKey: string, record: TRecord): TRecord {
      const normalizedKey = assertMemoryKey(memoryKey);
      const normalizedRecord = normalizeMemoryRecord(record);


      if (normalizedRecord.memoryKey !== normalizedKey) {
        throw new Error("IPR_BOUND_MEMORY_STORE_KEY_RECORD_MISMATCH");
      }


      store.set(normalizedKey, normalizedRecord);


      return normalizedRecord;
    },


    has(memoryKey: string): boolean {
      return store.has(assertMemoryKey(memoryKey));
    },


    delete(memoryKey: string): boolean {
      return store.delete(assertMemoryKey(memoryKey));
    },


    clear(): void {
      store.clear();
    },


    size(): number {
      return store.size;
    },


    values(): TRecord[] {
      return Array.from(store.values());
    },


    findByMemoryKeyHash(memoryKeyHash: string): TRecord | null {
      const normalizedHash = assertMemoryKeyHash(memoryKeyHash);


      for (const record of store.values()) {
        if (normalizeMemoryKeyHash(record.memoryKeyHash) === normalizedHash) {
          return record;
        }
      }


      return null;
    },


    async getAsync(memoryKey: string): Promise<TRecord | undefined> {
      return this.get(memoryKey);
    },


    async setAsync(memoryKey: string, record: TRecord): Promise<TRecord> {
      return this.set(memoryKey, record);
    },


    async hasAsync(memoryKey: string): Promise<boolean> {
      return this.has(memoryKey);
    },


    async deleteAsync(memoryKey: string): Promise<boolean> {
      return this.delete(memoryKey);
    },


    async clearAsync(): Promise<void> {
      this.clear();
    },


    async sizeAsync(): Promise<number> {
      return this.size();
    },


    async valuesAsync(): Promise<TRecord[]> {
      return this.values();
    },


    async findByMemoryKeyHashAsync(memoryKeyHash: string): Promise<TRecord | null> {
      return this.findByMemoryKeyHash(memoryKeyHash);
    }
  };
}


function createUnavailableMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(input: {
  name: string;
  kind: IprBoundMemoryStoreKind;
  durable: boolean;
  runtimeScoped: boolean;
  boundary: string;
  persistenceStage: IprBoundMemoryPersistenceStage;
  saasReady: boolean;
  requiresDatabase: boolean;
  capabilities: IprBoundMemoryStoreCapability[];
  requirements: string[];
  databaseAware?: boolean;
}): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return {
    name: input.name,
    kind: input.kind,
    durable: input.durable,
    runtimeScoped: input.runtimeScoped,


    describe(): IprBoundMemoryStoreDescription {
      return buildStoreDescription({
        name: this.name,
        kind: this.kind,
        status: input.databaseAware
          ? resolveDatabasePlaceholderStatus()
          : "NOT_CONFIGURED",
        durable: this.durable,
        runtimeScoped: this.runtimeScoped,
        recordCount: 0,
        boundary: input.boundary,
        persistenceStage: input.persistenceStage,
        saasReady: input.saasReady,
        requiresDatabase: input.requiresDatabase,
        capabilities: input.capabilities,
        requirements: input.requirements,
        database: input.databaseAware ? getMemoryDatabaseDescription() : undefined
      });
    },


    get(memoryKey: string): TRecord | undefined {
      void memoryKey;
      return throwStoreNotConfigured();
    },


    set(memoryKey: string, record: TRecord): TRecord {
      void memoryKey;
      void record;
      return throwStoreNotConfigured();
    },


    has(memoryKey: string): boolean {
      void memoryKey;
      return throwStoreNotConfigured();
    },


    delete(memoryKey: string): boolean {
      void memoryKey;
      return throwStoreNotConfigured();
    },


    clear(): void {
      throwStoreNotConfigured();
    },


    size(): number {
      return 0;
    },


    values(): TRecord[] {
      return [];
    },


    findByMemoryKeyHash(memoryKeyHash: string): TRecord | null {
      void memoryKeyHash;
      return throwStoreNotConfigured();
    },


    async getAsync(memoryKey: string): Promise<TRecord | undefined> {
      void memoryKey;
      return throwStoreNotConfigured();
    },


    async setAsync(memoryKey: string, record: TRecord): Promise<TRecord> {
      void memoryKey;
      void record;
      return throwStoreNotConfigured();
    },


    async hasAsync(memoryKey: string): Promise<boolean> {
      void memoryKey;
      return throwStoreNotConfigured();
    },


    async deleteAsync(memoryKey: string): Promise<boolean> {
      void memoryKey;
      return throwStoreNotConfigured();
    },


    async clearAsync(): Promise<void> {
      throwStoreNotConfigured();
    },


    async sizeAsync(): Promise<number> {
      return 0;
    },


    async valuesAsync(): Promise<TRecord[]> {
      return [];
    },


    async findByMemoryKeyHashAsync(memoryKeyHash: string): Promise<TRecord | null> {
      void memoryKeyHash;
      return throwStoreNotConfigured();
    }
  };
}


export function createDatabaseReadyPlaceholderAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return createUnavailableMemoryStoreAdapter<TRecord>({
    name: "HBCE_JOKER_C2_DATABASE_READY_PLACEHOLDER",
    kind: "DATABASE_READY",
    durable: false,
    runtimeScoped: false,
    boundary: DATABASE_READY_BOUNDARY,
    persistenceStage: "DATABASE_CONTRACT_READY",
    saasReady: false,
    requiresDatabase: true,
    capabilities: DATABASE_READY_CAPABILITIES,
    requirements: DATABASE_READY_REQUIREMENTS,
    databaseAware: true
  });
}


export function createDatabasePersistentMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return {
    name: "HBCE_JOKER_C2_DATABASE_PERSISTENT_MEMORY_STORE",
    kind: "DATABASE_PERSISTENT",
    durable: isDatabasePersistentUsable(),
    runtimeScoped: !isDatabasePersistentUsable(),


    describe(): IprBoundMemoryStoreDescription {
      const active = isDatabasePersistentUsable();


      return buildStoreDescription({
        name: this.name,
        kind: this.kind,
        status: resolveDatabasePersistentStatus(),
        durable: active,
        runtimeScoped: !active,
        recordCount: processIprBoundMemoryStore.size(),
        boundary: DATABASE_PERSISTENT_BOUNDARY,
        persistenceStage: active
          ? "DATABASE_PERSISTENT_ACTIVE"
          : "DATABASE_PERSISTENT_TARGET",
        saasReady: active,
        requiresDatabase: true,
        capabilities: DATABASE_PERSISTENT_CAPABILITIES,
        requirements: DATABASE_PERSISTENT_REQUIREMENTS,
        database: getMemoryDatabaseDescription()
      });
    },


    get(memoryKey: string): TRecord | undefined {
      return processIprBoundMemoryStore.get(memoryKey) as TRecord | undefined;
    },


    set(memoryKey: string, record: TRecord): TRecord {
      const normalizedKey = assertMemoryKey(memoryKey);
      const normalizedRecord = normalizeMemoryRecord(record);


      if (normalizedRecord.memoryKey !== normalizedKey) {
        throw new Error("IPR_BOUND_MEMORY_STORE_KEY_RECORD_MISMATCH");
      }


      const cached = {
        ...normalizedRecord,
        persistenceMode: "DATABASE_PERSISTENT"
      } as TRecord;


      cacheProcessMemoryRecord(cached);
      scheduleDatabaseMemoryFlush(cached);


      return cached;
    },


    has(memoryKey: string): boolean {
      return processIprBoundMemoryStore.has(memoryKey);
    },


    delete(memoryKey: string): boolean {
      const normalizedKey = assertMemoryKey(memoryKey);
      const deleted = processIprBoundMemoryStore.delete(normalizedKey);


      if (isDatabasePersistentUsable()) {
        void this.deleteAsync(normalizedKey).catch((error) => {
          rememberFlushError(error);
        });
      }


      return deleted;
    },


    clear(): void {
      processIprBoundMemoryStore.clear();
    },


    size(): number {
      return processIprBoundMemoryStore.size();
    },


    values(): TRecord[] {
      return processIprBoundMemoryStore.values() as TRecord[];
    },


    findByMemoryKeyHash(memoryKeyHash: string): TRecord | null {
      return processIprBoundMemoryStore.findByMemoryKeyHash(memoryKeyHash) as
        | TRecord
        | null;
    },


    async getAsync(memoryKey: string): Promise<TRecord | undefined> {
      const normalizedKey = assertMemoryKey(memoryKey);
      const cached = processIprBoundMemoryStore.get(normalizedKey) as
        | TRecord
        | undefined;


      if (cached) {
        return cached;
      }


      const memoryKeyHash = memoryKeyToHash(normalizedKey);


      const record = await querySingleMemoryRecord<TRecord>(
        `
SELECT
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  record_payload
FROM memory_records
WHERE memory_key_hash = $1
  AND record_payload ->> 'memoryKey' = $2
  AND legal_certification = false
ORDER BY updated_at DESC
LIMIT 1;
`.trim(),
        [memoryKeyHash, normalizedKey]
      );


      if (record) {
        cacheProcessMemoryRecord(record);
      }


      return record || undefined;
    },


    async setAsync(
      memoryKey: string,
      record: TRecord,
      context?: IprBoundMemoryDatabaseWriteContext
    ): Promise<TRecord> {
      const normalizedKey = assertMemoryKey(memoryKey);
      const normalizedRecord = normalizeMemoryRecord(record);


      if (normalizedRecord.memoryKey !== normalizedKey) {
        throw new Error("IPR_BOUND_MEMORY_STORE_KEY_RECORD_MISMATCH");
      }


      const persisted = await upsertDatabaseMemoryRecord<TRecord>(
        {
          ...normalizedRecord,
          memoryKeyHash: assertMemoryKeyHash(normalizedRecord.memoryKeyHash),
          persistenceMode: "DATABASE_PERSISTENT"
        } as TRecord,
        context
      );


      cacheProcessMemoryRecord(persisted);


      return persisted;
    },


    async hasAsync(memoryKey: string): Promise<boolean> {
      const record = await this.getAsync(memoryKey);


      return Boolean(record);
    },


    async deleteAsync(memoryKey: string): Promise<boolean> {
      await ensureDatabaseMemoryStoreReady();


      const normalizedKey = assertMemoryKey(memoryKey);
      const memoryKeyHash = memoryKeyToHash(normalizedKey);


      const result = await queryHbceDatabase<MemoryRecordDatabaseRow>(
        `
DELETE FROM memory_records
WHERE memory_key_hash = $1
  AND record_payload ->> 'memoryKey' = $2
  AND legal_certification = false
RETURNING memory_id;
`.trim(),
        [memoryKeyHash, normalizedKey]
      );


      if (!result.ok) {
        throw new Error(result.error || "IPR_BOUND_MEMORY_DATABASE_DELETE_FAILED");
      }


      processIprBoundMemoryStore.delete(normalizedKey);


      return result.rows.length > 0;
    },


    async clearAsync(): Promise<void> {
      if (process.env.HBCE_ALLOW_MEMORY_DATABASE_CLEAR !== "true") {
        throw new Error(DATABASE_CLEAR_DISABLED_ERROR);
      }


      await ensureDatabaseMemoryStoreReady();


      const result = await queryHbceDatabase(
        `
DELETE FROM memory_records
WHERE legal_certification = false;
`.trim(),
        []
      );


      if (!result.ok) {
        throw new Error(result.error || "IPR_BOUND_MEMORY_DATABASE_CLEAR_FAILED");
      }


      processIprBoundMemoryStore.clear();
    },


    async sizeAsync(): Promise<number> {
      await ensureDatabaseMemoryStoreReady();


      const result = await queryHbceDatabase<MemoryRecordDatabaseRow>(
        `
SELECT COUNT(*)::text AS record_count
FROM memory_records
WHERE legal_certification = false;
`.trim(),
        []
      );


      if (!result.ok) {
        throw new Error(result.error || "IPR_BOUND_MEMORY_DATABASE_SIZE_FAILED");
      }


      const count = result.rows[0]?.record_count;


      if (typeof count === "number") {
        return count;
      }


      if (typeof count === "string") {
        const parsed = Number.parseInt(count, 10);


        return Number.isFinite(parsed) ? parsed : 0;
      }


      return 0;
    },


    async valuesAsync(): Promise<TRecord[]> {
      await ensureDatabaseMemoryStoreReady();


      const result = await queryHbceDatabase<MemoryRecordDatabaseRow>(
        `
SELECT
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  record_payload
FROM memory_records
WHERE legal_certification = false
ORDER BY updated_at DESC
LIMIT 100;
`.trim(),
        []
      );


      if (!result.ok) {
        throw new Error(result.error || "IPR_BOUND_MEMORY_DATABASE_VALUES_FAILED");
      }


      return result.rows
        .map((row) => databaseRowToMemoryRecord<TRecord>(row))
        .filter((record): record is TRecord => Boolean(record));
    },


    async findByMemoryKeyHashAsync(memoryKeyHash: string): Promise<TRecord | null> {
      const normalizedHash = assertMemoryKeyHash(memoryKeyHash);


      const cached = processIprBoundMemoryStore.findByMemoryKeyHash(normalizedHash) as
        | TRecord
        | null;


      if (cached) {
        return cached;
      }


      const record = await querySingleMemoryRecord<TRecord>(
        `
SELECT
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  record_payload
FROM memory_records
WHERE memory_key_hash = $1
  AND legal_certification = false
ORDER BY updated_at DESC
LIMIT 1;
`.trim(),
        [normalizedHash]
      );


      if (record) {
        cacheProcessMemoryRecord(record);
      }


      return record;
    }
  };
}


export function createDatabasePersistentPlaceholderAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return createDatabasePersistentMemoryStoreAdapter<TRecord>();
}


export function createExternalAdapterPlaceholder<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return createUnavailableMemoryStoreAdapter<TRecord>({
    name: "HBCE_JOKER_C2_EXTERNAL_MEMORY_ADAPTER_PLACEHOLDER",
    kind: "EXTERNAL_ADAPTER",
    durable: false,
    runtimeScoped: false,
    boundary: EXTERNAL_ADAPTER_BOUNDARY,
    persistenceStage: "EXTERNAL_ADAPTER_TARGET",
    saasReady: false,
    requiresDatabase: false,
    capabilities: EXTERNAL_ADAPTER_CAPABILITIES,
    requirements: EXTERNAL_ADAPTER_REQUIREMENTS,
    databaseAware: false
  });
}


export function createExternalIprBoundMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  adapter: IprBoundMemoryAsyncStoreAdapter<TRecord>
): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  const description = adapter.describe();


  if (adapter.kind !== "EXTERNAL_ADAPTER") {
    throw new Error("IPR_BOUND_MEMORY_EXTERNAL_ADAPTER_KIND_REQUIRED");
  }


  if (description.legalCertification !== false) {
    throw new Error("IPR_BOUND_MEMORY_EXTERNAL_ADAPTER_LEGAL_CERTIFICATION_FORBIDDEN");
  }


  if (!adapter.durable) {
    throw new Error("IPR_BOUND_MEMORY_EXTERNAL_ADAPTER_MUST_BE_DURABLE");
  }


  if (adapter.runtimeScoped) {
    throw new Error("IPR_BOUND_MEMORY_EXTERNAL_ADAPTER_MUST_NOT_BE_RUNTIME_SCOPED");
  }


  return adapter;
}


export const processIprBoundMemoryStore =
  createProcessMemoryStoreAdapter<IprBoundMemoryStoreRecord>(
    processMemoryMap as Map<string, IprBoundMemoryStoreRecord>
  );


export const databaseReadyIprBoundMemoryStore =
  createDatabaseReadyPlaceholderAdapter<IprBoundMemoryStoreRecord>();


export const databasePersistentIprBoundMemoryStore =
  createDatabasePersistentMemoryStoreAdapter<IprBoundMemoryStoreRecord>();


export const externalIprBoundMemoryStore =
  createExternalAdapterPlaceholder<IprBoundMemoryStoreRecord>();


export function getDefaultIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  if (isIprBoundMemoryDatabasePersistentActive()) {
    return getDatabasePersistentIprBoundMemoryStore<TRecord>();
  }


  return processIprBoundMemoryStore as unknown as IprBoundMemoryStoreAdapter<TRecord>;
}


export function getDefaultIprBoundMemoryAsyncStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  if (isIprBoundMemoryDatabasePersistentActive()) {
    return getDatabasePersistentIprBoundMemoryStore<TRecord>();
  }


  return getProcessIprBoundMemoryStore<TRecord>();
}


export function getProcessIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return processIprBoundMemoryStore as unknown as IprBoundMemoryAsyncStoreAdapter<TRecord>;
}


export function getDatabaseReadyIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  if (isIprBoundMemoryDatabasePersistentActive()) {
    return getDatabasePersistentIprBoundMemoryStore<TRecord>();
  }


  return databaseReadyIprBoundMemoryStore as unknown as IprBoundMemoryAsyncStoreAdapter<TRecord>;
}


export function getDatabasePersistentIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return databasePersistentIprBoundMemoryStore as unknown as IprBoundMemoryAsyncStoreAdapter<TRecord>;
}


export function getExternalIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return externalIprBoundMemoryStore as unknown as IprBoundMemoryAsyncStoreAdapter<TRecord>;
}


export function getSaasTargetIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  return getDatabasePersistentIprBoundMemoryStore<TRecord>();
}


export function selectIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  kind: IprBoundMemoryStoreKind
): IprBoundMemoryStoreAdapter<TRecord> {
  if (kind === "PROCESS_MEMORY_MVP") {
    return getProcessIprBoundMemoryStore<TRecord>();
  }


  if (kind === "DATABASE_READY") {
    return getDatabaseReadyIprBoundMemoryStore<TRecord>();
  }


  if (kind === "DATABASE_PERSISTENT") {
    return getDatabasePersistentIprBoundMemoryStore<TRecord>();
  }


  return getExternalIprBoundMemoryStore<TRecord>();
}


export function selectIprBoundMemoryAsyncStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  kind: IprBoundMemoryStoreKind
): IprBoundMemoryAsyncStoreAdapter<TRecord> {
  if (kind === "PROCESS_MEMORY_MVP") {
    return getProcessIprBoundMemoryStore<TRecord>();
  }


  if (kind === "DATABASE_READY") {
    return getDatabaseReadyIprBoundMemoryStore<TRecord>();
  }


  if (kind === "DATABASE_PERSISTENT") {
    return getDatabasePersistentIprBoundMemoryStore<TRecord>();
  }


  return getExternalIprBoundMemoryStore<TRecord>();
}


export function isIprBoundMemoryDatabaseConfigured(): boolean {
  return isHbceDatabaseConfigured();
}


export function isIprBoundMemoryDatabaseAvailable(): boolean {
  return isHbceDatabaseAvailable();
}


export function isIprBoundMemoryDatabasePersistentActive(): boolean {
  return isDatabasePersistentUsable();
}


export function getIprBoundMemoryDatabaseDescription(): IprBoundMemoryStoreDatabaseDescription {
  return getMemoryDatabaseDescription();
}


export async function ensureIprBoundMemoryDatabaseReady(): Promise<void> {
  await ensureDatabaseMemoryStoreReady();
}



export async function findRegisteredMemoryEventByNameAsync(input: {
  eventName: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  humanIpr?: string | null;
  memoryId?: string | null;
}): Promise<IprBoundMemoryRegisteredEvent | null> {
  await ensureDatabaseMemoryStoreReady();


  const eventName = normalizeRegisteredEventName(input.eventName);


  if (!eventName) {
    throw new Error("IPR_BOUND_MEMORY_REGISTERED_EVENT_NAME_REQUIRED");
  }


  const result = await queryHbceDatabase<MemoryRegisteredEventDatabaseRow>(
    `
SELECT
  registered_event_id,
  tenant_id,
  workspace_id,
  subscription_id,
  account_id,
  human_ipr,
  runtime_ipr,
  memory_id,
  evt_id,
  opc_proof_id,
  audit_id,
  usage_id,
  event_name,
  event_name_hash,
  event_scope,
  event_status,
  continuity_hash,
  created_at,
  payload,
  legal_certification
FROM memory_registered_events
WHERE event_name_hash = $1
  AND ($2::text IS NULL OR tenant_id = $2)
  AND ($3::text IS NULL OR workspace_id = $3)
  AND ($4::text IS NULL OR human_ipr = $4)
  AND ($5::text IS NULL OR memory_id = $5)
  AND legal_certification = false
ORDER BY created_at DESC
LIMIT 1;
`.trim(),
    [
      sha256Hex(eventName.toUpperCase()),
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.humanIpr ?? null,
      input.memoryId ?? null
    ]
  );


  if (!result.ok) {
    throw new Error(
      result.error || "IPR_BOUND_MEMORY_REGISTERED_EVENT_LOOKUP_FAILED"
    );
  }


  return result.rows[0]
    ? databaseRowToRegisteredMemoryEvent(result.rows[0])
    : null;
}


export async function listRegisteredMemoryEventsAsync(input: {
  tenantId?: string | null;
  workspaceId?: string | null;
  humanIpr?: string | null;
  memoryId?: string | null;
  limit?: number;
} = {}): Promise<IprBoundMemoryRegisteredEvent[]> {
  await ensureDatabaseMemoryStoreReady();


  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const result = await queryHbceDatabase<MemoryRegisteredEventDatabaseRow>(
    `
SELECT
  registered_event_id,
  tenant_id,
  workspace_id,
  subscription_id,
  account_id,
  human_ipr,
  runtime_ipr,
  memory_id,
  evt_id,
  opc_proof_id,
  audit_id,
  usage_id,
  event_name,
  event_name_hash,
  event_scope,
  event_status,
  continuity_hash,
  created_at,
  payload,
  legal_certification
FROM memory_registered_events
WHERE ($1::text IS NULL OR tenant_id = $1)
  AND ($2::text IS NULL OR workspace_id = $2)
  AND ($3::text IS NULL OR human_ipr = $3)
  AND ($4::text IS NULL OR memory_id = $4)
  AND legal_certification = false
ORDER BY created_at DESC
LIMIT $5;
`.trim(),
    [
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.humanIpr ?? null,
      input.memoryId ?? null,
      limit
    ]
  );


  if (!result.ok) {
    throw new Error(
      result.error || "IPR_BOUND_MEMORY_REGISTERED_EVENTS_LIST_FAILED"
    );
  }


  return result.rows
    .map((row) => databaseRowToRegisteredMemoryEvent(row))
    .filter((event): event is IprBoundMemoryRegisteredEvent => Boolean(event));
}


export async function getRuntimeMemoryByKeyHashAsync(
  memoryKeyHash: string
): Promise<IprBoundMemoryStoreRecord | null> {
  return getDefaultIprBoundMemoryAsyncStore().findByMemoryKeyHashAsync(
    memoryKeyHash
  );
}


export async function getRuntimeMemoryStoreSizeAsync(): Promise<number> {
  return getDefaultIprBoundMemoryAsyncStore().sizeAsync();
}


export function describeDefaultIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDefaultIprBoundMemoryStore().describe();
}


export function describeDefaultIprBoundMemoryAsyncStore(): IprBoundMemoryStoreDescription {
  return getDefaultIprBoundMemoryAsyncStore().describe();
}


export function describeProcessIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getProcessIprBoundMemoryStore().describe();
}


export function describeDatabaseReadyIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDatabaseReadyIprBoundMemoryStore().describe();
}


export function describeDatabasePersistentIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDatabasePersistentIprBoundMemoryStore().describe();
}


export function describeExternalIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getExternalIprBoundMemoryStore().describe();
}


export function describeSaasTargetIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getSaasTargetIprBoundMemoryStore().describe();
}


export function listIprBoundMemoryStoreDescriptions(): IprBoundMemoryStoreDescription[] {
  return [
    describeProcessIprBoundMemoryStore(),
    describeDatabaseReadyIprBoundMemoryStore(),
    describeDatabasePersistentIprBoundMemoryStore(),
    describeExternalIprBoundMemoryStore()
  ];
}


export function getRuntimeMemoryStoreSize(): number {
  return getDefaultIprBoundMemoryStore().size();
}


export function getRuntimeMemoryByKeyHash(
  memoryKeyHash: string
): IprBoundMemoryStoreRecord | null {
  return getDefaultIprBoundMemoryStore().findByMemoryKeyHash(memoryKeyHash);
}


export function getRuntimeMemoryFlushErrors(): string[] {
  return [...memoryFlushErrors];
}


export function clearProcessRuntimeMemory(): void {
  processIprBoundMemoryStore.clear();
}


export async function clearPersistentRuntimeMemoryForTestsOnly(): Promise<void> {
  await getDatabasePersistentIprBoundMemoryStore().clearAsync();
}

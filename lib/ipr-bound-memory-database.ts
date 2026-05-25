import {
  describeDefaultHbceDatabase,
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";

import type {
  HbceDatabaseQueryResult,
  HbceDatabaseQueryRow,
  HbceDatabaseQueryValue
} from "./ipr-database";

import type { IprBoundMemoryRecord } from "./ipr-bound-memory";

export type IprBoundMemoryDatabaseOperationStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "SCHEMA_READY"
  | "SCHEMA_FAILED"
  | "WRITE_COMPLETED"
  | "WRITE_FAILED"
  | "READ_COMPLETED"
  | "READ_FAILED"
  | "DELETE_COMPLETED"
  | "DELETE_FAILED"
  | "INVALID_MEMORY_RECORD";

export type IprBoundMemoryDatabaseSchemaDescription = {
  tableName: typeof IPR_BOUND_MEMORY_DATABASE_TABLE;
  schemaVersion: typeof IPR_BOUND_MEMORY_DATABASE_SCHEMA_VERSION;
  persistenceMode: "DATABASE_PERSISTENT";
  legalCertification: false;
  boundary: string;
};

export type IprBoundMemoryDatabaseDescription = {
  configured: boolean;
  available: boolean;
  persistenceMode: "DATABASE_PERSISTENT";
  durable: boolean;
  database: ReturnType<typeof describeDefaultHbceDatabase>;
  schema: IprBoundMemoryDatabaseSchemaDescription;
  legalCertification: false;
};

export type IprBoundMemoryDatabaseOperationResult<
  TRecord = IprBoundMemoryRecord
> = {
  ok: boolean;
  status: IprBoundMemoryDatabaseOperationStatus;
  operation: string;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
  durable: boolean;
  persistenceMode: "DATABASE_PERSISTENT";
  rowCount: number;
  record: TRecord | null;
  records: TRecord[];
  query?: HbceDatabaseQueryResult | null;
  error: string | null;
  schema: IprBoundMemoryDatabaseSchemaDescription;
  boundary: string;
  legalCertification: false;
};

type IprBoundMemoryDatabaseRow = HbceDatabaseQueryRow & {
  memory_id?: unknown;
  memory_key?: unknown;
  memory_key_hash?: unknown;
  scope?: unknown;
  authority?: unknown;
  persistence_mode?: unknown;
  subject_ipr?: unknown;
  subject_entity?: unknown;
  runtime_ipr?: unknown;
  runtime_entity?: unknown;
  session_id?: unknown;
  matrix_state?: unknown;
  last_evt?: unknown;
  last_opc_proof_id?: unknown;
  last_opc_chain_hash?: unknown;
  memory_hash?: unknown;
  payload?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  legal_certification?: unknown;
};

const IPR_BOUND_MEMORY_DATABASE_TABLE =
  "hbce_ipr_bound_memory_records" as const;

const IPR_BOUND_MEMORY_DATABASE_SCHEMA_VERSION =
  "HBCE-IPR-BOUND-MEMORY-DB-v0.1" as const;

export const IPR_BOUND_MEMORY_DATABASE_BOUNDARY =
  "IPR-bound memory database persistence stores operational memory records for continuity, audit and replay. It does not override HBCE governance, does not authorize future requests, does not weaken cyber safety, does not replace human oversight and does not provide legal certification.";

const IPR_BOUND_MEMORY_DATABASE_SCHEMA_SQL = [
  `
  CREATE TABLE IF NOT EXISTS hbce_ipr_bound_memory_records (
    id BIGSERIAL PRIMARY KEY,
    memory_id TEXT NOT NULL,
    memory_key TEXT NOT NULL UNIQUE,
    memory_key_hash TEXT NOT NULL UNIQUE,
    scope TEXT NOT NULL,
    authority TEXT NOT NULL,
    persistence_mode TEXT NOT NULL,
    subject_ipr TEXT,
    subject_entity TEXT,
    runtime_ipr TEXT NOT NULL,
    runtime_entity TEXT NOT NULL,
    session_id TEXT NOT NULL,
    matrix_state TEXT NOT NULL,
    last_evt TEXT,
    last_opc_proof_id TEXT,
    last_opc_chain_hash TEXT,
    memory_hash TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    legal_certification BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (legal_certification = FALSE)
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_memory_id
  ON hbce_ipr_bound_memory_records (memory_id)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_memory_key_hash
  ON hbce_ipr_bound_memory_records (memory_key_hash)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_subject_ipr
  ON hbce_ipr_bound_memory_records (subject_ipr)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_runtime_ipr
  ON hbce_ipr_bound_memory_records (runtime_ipr)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_session_id
  ON hbce_ipr_bound_memory_records (session_id)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_last_evt
  ON hbce_ipr_bound_memory_records (last_evt)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_hbce_ipr_bound_memory_updated_at
  ON hbce_ipr_bound_memory_records (updated_at DESC)
  `
];

function buildSchemaDescription(): IprBoundMemoryDatabaseSchemaDescription {
  return {
    tableName: IPR_BOUND_MEMORY_DATABASE_TABLE,
    schemaVersion: IPR_BOUND_MEMORY_DATABASE_SCHEMA_VERSION,
    persistenceMode: "DATABASE_PERSISTENT",
    legalCertification: false,
    boundary: IPR_BOUND_MEMORY_DATABASE_BOUNDARY
  };
}

function databaseConfigured(): boolean {
  return isHbceDatabaseConfigured();
}

function databaseAvailable(): boolean {
  return isHbceDatabaseAvailable();
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function nullableString(value: unknown): string | null {
  const text = safeString(value, "");

  return text || null;
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_IPR_BOUND_MEMORY_DATABASE_ERROR";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMemoryRecord(value: unknown): value is IprBoundMemoryRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.memoryId === "string" &&
    typeof value.memoryKey === "string" &&
    typeof value.memoryKeyHash === "string" &&
    typeof value.scope === "string" &&
    typeof value.authority === "string" &&
    typeof value.persistenceMode === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.memoryHash === "string"
  );
}

function normalizeMemoryRecordForDatabase(
  record: IprBoundMemoryRecord
): IprBoundMemoryRecord {
  if (!isMemoryRecord(record)) {
    throw new Error("INVALID_IPR_BOUND_MEMORY_RECORD");
  }

  return {
    ...record,
    persistenceMode: "DATABASE_PERSISTENT",
    persistence: {
      ...record.persistence,
      mode: "DATABASE_PERSISTENT",
      status: "DATABASE_PERSISTENT_ACTIVE",
      target: "DATABASE_PERSISTENT",
      durable: true,
      runtimeScoped: false,
      databaseRequired: false,
      databaseReady: true,
      legalCertification: false
    }
  };
}

function parsePayload(value: unknown): IprBoundMemoryRecord | null {
  if (isMemoryRecord(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return isMemoryRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function rowToMemoryRecord(
  row: IprBoundMemoryDatabaseRow | undefined
): IprBoundMemoryRecord | null {
  if (!row) {
    return null;
  }

  return parsePayload(row.payload);
}

function rowsToMemoryRecords(
  rows: IprBoundMemoryDatabaseRow[]
): IprBoundMemoryRecord[] {
  return rows
    .map((row) => rowToMemoryRecord(row))
    .filter((record): record is IprBoundMemoryRecord => Boolean(record));
}

function buildResult<TRecord = IprBoundMemoryRecord>(input: {
  ok: boolean;
  status: IprBoundMemoryDatabaseOperationStatus;
  operation: string;
  rowCount?: number;
  record?: TRecord | null;
  records?: TRecord[];
  query?: HbceDatabaseQueryResult | null;
  error?: string | null;
}): IprBoundMemoryDatabaseOperationResult<TRecord> {
  const configured = databaseConfigured();
  const available = databaseAvailable();

  return {
    ok: input.ok,
    status: input.status,
    operation: input.operation,
    databaseConfigured: configured,
    databaseAvailable: available,
    durable: input.ok && available,
    persistenceMode: "DATABASE_PERSISTENT",
    rowCount: input.rowCount ?? input.records?.length ?? 0,
    record: input.record ?? null,
    records: input.records ?? [],
    query: input.query ?? null,
    error: input.error ?? null,
    schema: buildSchemaDescription(),
    boundary: IPR_BOUND_MEMORY_DATABASE_BOUNDARY,
    legalCertification: false
  };
}

function buildUnavailableResult<TRecord = IprBoundMemoryRecord>(
  operation: string
): IprBoundMemoryDatabaseOperationResult<TRecord> {
  return buildResult<TRecord>({
    ok: false,
    status: "NOT_CONFIGURED",
    operation,
    rowCount: 0,
    record: null,
    records: [],
    error: databaseConfigured()
      ? "HBCE database is configured but not available. IPR-bound memory remains non-durable."
      : "HBCE database is not configured. IPR-bound memory remains process-scoped."
  });
}

function buildInvalidRecordResult(
  operation: string,
  error: string
): IprBoundMemoryDatabaseOperationResult {
  return buildResult({
    ok: false,
    status: "INVALID_MEMORY_RECORD",
    operation,
    rowCount: 0,
    record: null,
    records: [],
    error
  });
}

function ensureDatabaseCanPersist(
  operation: string
): IprBoundMemoryDatabaseOperationResult | null {
  if (!databaseConfigured() || !databaseAvailable()) {
    return buildUnavailableResult(operation);
  }

  return null;
}

function memoryRecordToDatabaseParams(
  record: IprBoundMemoryRecord
): HbceDatabaseQueryValue[] {
  const normalized = normalizeMemoryRecordForDatabase(record);

  return [
    normalized.memoryId,
    normalized.memoryKey,
    normalized.memoryKeyHash,
    normalized.scope,
    normalized.authority,
    normalized.persistenceMode,
    nullableString(normalized.subject?.ipr),
    nullableString(normalized.subject?.entity),
    normalized.runtime.ipr,
    normalized.runtime.entity,
    normalized.sessionId,
    normalized.matrixState,
    nullableString(normalized.lastEvt),
    nullableString(normalized.lastOpcProofId),
    nullableString(normalized.lastOpcChainHash),
    normalized.memoryHash,
    JSON.stringify(normalized),
    normalized.createdAt,
    normalized.updatedAt
  ];
}

export function describeIprBoundMemoryDatabasePersistence(): IprBoundMemoryDatabaseDescription {
  const configured = databaseConfigured();
  const available = databaseAvailable();

  return {
    configured,
    available,
    persistenceMode: "DATABASE_PERSISTENT",
    durable: configured && available,
    database: describeDefaultHbceDatabase(),
    schema: buildSchemaDescription(),
    legalCertification: false
  };
}

export function isIprBoundMemoryDatabasePersistenceAvailable(): boolean {
  return databaseConfigured() && databaseAvailable();
}

export async function ensureIprBoundMemoryDatabaseSchema(): Promise<
  IprBoundMemoryDatabaseOperationResult
> {
  const unavailable = ensureDatabaseCanPersist("ensure_schema");

  if (unavailable) {
    return unavailable;
  }

  let lastQuery: HbceDatabaseQueryResult | null = null;

  try {
    for (const statement of IPR_BOUND_MEMORY_DATABASE_SCHEMA_SQL) {
      const sql = statement.trim();

      if (!sql) {
        continue;
      }

      lastQuery = await queryHbceDatabase(sql, []);

      if (!lastQuery.ok) {
        return buildResult({
          ok: false,
          status: "SCHEMA_FAILED",
          operation: "ensure_schema",
          rowCount: lastQuery.rowCount,
          query: lastQuery,
          error: lastQuery.error || "IPR_BOUND_MEMORY_DATABASE_SCHEMA_FAILED"
        });
      }
    }

    return buildResult({
      ok: true,
      status: "SCHEMA_READY",
      operation: "ensure_schema",
      rowCount: IPR_BOUND_MEMORY_DATABASE_SCHEMA_SQL.length,
      query: lastQuery,
      error: null
    });
  } catch (error) {
    return buildResult({
      ok: false,
      status: "SCHEMA_FAILED",
      operation: "ensure_schema",
      rowCount: 0,
      query: lastQuery,
      error: safeError(error)
    });
  }
}

export async function upsertIprBoundMemoryDatabaseRecord(
  record: IprBoundMemoryRecord
): Promise<IprBoundMemoryDatabaseOperationResult> {
  if (!isMemoryRecord(record)) {
    return buildInvalidRecordResult(
      "upsert_memory",
      "INVALID_IPR_BOUND_MEMORY_RECORD"
    );
  }

  const schema = await ensureIprBoundMemoryDatabaseSchema();

  if (!schema.ok) {
    return buildResult({
      ok: false,
      status:
        schema.status === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "WRITE_FAILED",
      operation: "upsert_memory",
      rowCount: 0,
      record: null,
      records: [],
      query: schema.query,
      error: schema.error || "IPR_BOUND_MEMORY_DATABASE_SCHEMA_NOT_READY"
    });
  }

  const normalized = normalizeMemoryRecordForDatabase(record);

  const sql = `
    INSERT INTO hbce_ipr_bound_memory_records (
      memory_id,
      memory_key,
      memory_key_hash,
      scope,
      authority,
      persistence_mode,
      subject_ipr,
      subject_entity,
      runtime_ipr,
      runtime_entity,
      session_id,
      matrix_state,
      last_evt,
      last_opc_proof_id,
      last_opc_chain_hash,
      memory_hash,
      payload,
      created_at,
      updated_at,
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
      $18::timestamptz,
      $19::timestamptz,
      false
    )
    ON CONFLICT (memory_key)
    DO UPDATE SET
      memory_id = EXCLUDED.memory_id,
      memory_key_hash = EXCLUDED.memory_key_hash,
      scope = EXCLUDED.scope,
      authority = EXCLUDED.authority,
      persistence_mode = EXCLUDED.persistence_mode,
      subject_ipr = EXCLUDED.subject_ipr,
      subject_entity = EXCLUDED.subject_entity,
      runtime_ipr = EXCLUDED.runtime_ipr,
      runtime_entity = EXCLUDED.runtime_entity,
      session_id = EXCLUDED.session_id,
      matrix_state = EXCLUDED.matrix_state,
      last_evt = EXCLUDED.last_evt,
      last_opc_proof_id = EXCLUDED.last_opc_proof_id,
      last_opc_chain_hash = EXCLUDED.last_opc_chain_hash,
      memory_hash = EXCLUDED.memory_hash,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at,
      legal_certification = false
    RETURNING
      memory_id,
      memory_key,
      memory_key_hash,
      scope,
      authority,
      persistence_mode,
      subject_ipr,
      subject_entity,
      runtime_ipr,
      runtime_entity,
      session_id,
      matrix_state,
      last_evt,
      last_opc_proof_id,
      last_opc_chain_hash,
      memory_hash,
      payload,
      created_at,
      updated_at,
      legal_certification
  `;

  try {
    const query = await queryHbceDatabase<IprBoundMemoryDatabaseRow>(
      sql,
      memoryRecordToDatabaseParams(normalized)
    );

    if (!query.ok) {
      return buildResult({
        ok: false,
        status: "WRITE_FAILED",
        operation: "upsert_memory",
        rowCount: query.rowCount,
        record: null,
        records: [],
        query,
        error: query.error || "IPR_BOUND_MEMORY_DATABASE_WRITE_FAILED"
      });
    }

    const persisted = rowToMemoryRecord(query.rows[0]) ?? normalized;

    return buildResult({
      ok: true,
      status: "WRITE_COMPLETED",
      operation: "upsert_memory",
      rowCount: query.rowCount,
      record: persisted,
      records: [persisted],
      query,
      error: null
    });
  } catch (error) {
    return buildResult({
      ok: false,
      status: "WRITE_FAILED",
      operation: "upsert_memory",
      rowCount: 0,
      record: null,
      records: [],
      error: safeError(error)
    });
  }
}

export async function getIprBoundMemoryDatabaseRecordByKey(
  memoryKey: string
): Promise<IprBoundMemoryDatabaseOperationResult> {
  const unavailable = ensureDatabaseCanPersist("get_memory_by_key");

  if (unavailable) {
    return unavailable;
  }

  const sql = `
    SELECT
      memory_id,
      memory_key,
      memory_key_hash,
      scope,
      authority,
      persistence_mode,
      subject_ipr,
      subject_entity,
      runtime_ipr,
      runtime_entity,
      session_id,
      matrix_state,
      last_evt,
      last_opc_proof_id,
      last_opc_chain_hash,
      memory_hash,
      payload,
      created_at,
      updated_at,
      legal_certification
    FROM hbce_ipr_bound_memory_records
    WHERE memory_key = $1
    LIMIT 1
  `;

  try {
    const query = await queryHbceDatabase<IprBoundMemoryDatabaseRow>(
      sql,
      [memoryKey]
    );

    if (!query.ok) {
      return buildResult({
        ok: false,
        status: "READ_FAILED",
        operation: "get_memory_by_key",
        rowCount: query.rowCount,
        record: null,
        records: [],
        query,
        error: query.error || "IPR_BOUND_MEMORY_DATABASE_READ_FAILED"
      });
    }

    const record = rowToMemoryRecord(query.rows[0]);

    return buildResult({
      ok: true,
      status: "READ_COMPLETED",
      operation: "get_memory_by_key",
      rowCount: query.rowCount,
      record,
      records: record ? [record] : [],
      query,
      error: null
    });
  } catch (error) {
    return buildResult({
      ok: false,
      status: "READ_FAILED",
      operation: "get_memory_by_key",
      rowCount: 0,
      record: null,
      records: [],
      error: safeError(error)
    });
  }
}

export async function getIprBoundMemoryDatabaseRecordByKeyHash(
  memoryKeyHash: string
): Promise<IprBoundMemoryDatabaseOperationResult> {
  const unavailable = ensureDatabaseCanPersist("get_memory_by_key_hash");

  if (unavailable) {
    return unavailable;
  }

  const sql = `
    SELECT
      memory_id,
      memory_key,
      memory_key_hash,
      scope,
      authority,
      persistence_mode,
      subject_ipr,
      subject_entity,
      runtime_ipr,
      runtime_entity,
      session_id,
      matrix_state,
      last_evt,
      last_opc_proof_id,
      last_opc_chain_hash,
      memory_hash,
      payload,
      created_at,
      updated_at,
      legal_certification
    FROM hbce_ipr_bound_memory_records
    WHERE memory_key_hash = $1
    LIMIT 1
  `;

  try {
    const query = await queryHbceDatabase<IprBoundMemoryDatabaseRow>(
      sql,
      [memoryKeyHash.trim().toUpperCase()]
    );

    if (!query.ok) {
      return buildResult({
        ok: false,
        status: "READ_FAILED",
        operation: "get_memory_by_key_hash",
        rowCount: query.rowCount,
        record: null,
        records: [],
        query,
        error: query.error || "IPR_BOUND_MEMORY_DATABASE_READ_FAILED"
      });
    }

    const record = rowToMemoryRecord(query.rows[0]);

    return buildResult({
      ok: true,
      status: "READ_COMPLETED",
      operation: "get_memory_by_key_hash",
      rowCount: query.rowCount,
      record,
      records: record ? [record] : [],
      query,
      error: null
    });
  } catch (error) {
    return buildResult({
      ok: false,
      status: "READ_FAILED",
      operation: "get_memory_by_key_hash",
      rowCount: 0,
      record: null,
      records: [],
      error: safeError(error)
    });
  }
}

export async function listIprBoundMemoryDatabaseRecords(
  limit = 50
): Promise<IprBoundMemoryDatabaseOperationResult> {
  const unavailable = ensureDatabaseCanPersist("list_memory_records");

  if (unavailable) {
    return unavailable;
  }

  const safeLimit = Math.max(1, Math.min(250, Math.floor(limit)));

  const sql = `
    SELECT
      memory_id,
      memory_key,
      memory_key_hash,
      scope,
      authority,
      persistence_mode,
      subject_ipr,
      subject_entity,
      runtime_ipr,
      runtime_entity,
      session_id,
      matrix_state,
      last_evt,
      last_opc_proof_id,
      last_opc_chain_hash,
      memory_hash,
      payload,
      created_at,
      updated_at,
      legal_certification
    FROM hbce_ipr_bound_memory_records
    ORDER BY updated_at DESC
    LIMIT $1
  `;

  try {
    const query = await queryHbceDatabase<IprBoundMemoryDatabaseRow>(
      sql,
      [safeLimit]
    );

    if (!query.ok) {
      return buildResult({
        ok: false,
        status: "READ_FAILED",
        operation: "list_memory_records",
        rowCount: query.rowCount,
        record: null,
        records: [],
        query,
        error: query.error || "IPR_BOUND_MEMORY_DATABASE_LIST_FAILED"
      });
    }

    const records = rowsToMemoryRecords(query.rows);

    return buildResult({
      ok: true,
      status: "READ_COMPLETED",
      operation: "list_memory_records",
      rowCount: records.length,
      record: records[0] ?? null,
      records,
      query,
      error: null
    });
  } catch (error) {
    return buildResult({
      ok: false,
      status: "READ_FAILED",
      operation: "list_memory_records",
      rowCount: 0,
      record: null,
      records: [],
      error: safeError(error)
    });
  }
}

export async function deleteIprBoundMemoryDatabaseRecordByKey(
  memoryKey: string
): Promise<IprBoundMemoryDatabaseOperationResult> {
  const unavailable = ensureDatabaseCanPersist("delete_memory_by_key");

  if (unavailable) {
    return unavailable;
  }

  const sql = `
    DELETE FROM hbce_ipr_bound_memory_records
    WHERE memory_key = $1
    RETURNING
      memory_id,
      memory_key,
      memory_key_hash,
      scope,
      authority,
      persistence_mode,
      subject_ipr,
      subject_entity,
      runtime_ipr,
      runtime_entity,
      session_id,
      matrix_state,
      last_evt,
      last_opc_proof_id,
      last_opc_chain_hash,
      memory_hash,
      payload,
      created_at,
      updated_at,
      legal_certification
  `;

  try {
    const query = await queryHbceDatabase<IprBoundMemoryDatabaseRow>(
      sql,
      [memoryKey]
    );

    if (!query.ok) {
      return buildResult({
        ok: false,
        status: "DELETE_FAILED",
        operation: "delete_memory_by_key",
        rowCount: query.rowCount,
        record: null,
        records: [],
        query,
        error: query.error || "IPR_BOUND_MEMORY_DATABASE_DELETE_FAILED"
      });
    }

    const record = rowToMemoryRecord(query.rows[0]);

    return buildResult({
      ok: true,
      status: "DELETE_COMPLETED",
      operation: "delete_memory_by_key",
      rowCount: query.rowCount,
      record,
      records: record ? [record] : [],
      query,
      error: null
    });
  } catch (error) {
    return buildResult({
      ok: false,
      status: "DELETE_FAILED",
      operation: "delete_memory_by_key",
      rowCount: 0,
      record: null,
      records: [],
      error: safeError(error)
    });
  }
}

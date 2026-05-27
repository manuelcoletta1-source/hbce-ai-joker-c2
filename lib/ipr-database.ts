import { neon } from "@neondatabase/serverless";

import {
  HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA,
  HBCE_DATABASE_SCHEMA_BOUNDARY,
  HBCE_DATABASE_SCHEMA_SQL,
  HBCE_DATABASE_SCHEMA_TABLES,
  HBCE_DATABASE_SCHEMA_VERSION
} from "./ipr-database-schema";

export type HbceDatabaseStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DRIVER_AVAILABLE"
  | "INITIALIZATION_FAILED"
  | "QUERY_FAILED";

export type HbceDatabaseKind =
  | "NEON_POSTGRES_HTTP"
  | "POSTGRES_COMPATIBLE"
  | "DISABLED";

export type HbceDatabaseQueryValue =
  | string
  | number
  | boolean
  | null
  | Date
  | Record<string, unknown>
  | unknown[];

export type HbceDatabaseQueryRow = Record<string, unknown>;

export type HbceDatabaseQueryResult<
  Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow
> = {
  ok: boolean;
  status: HbceDatabaseStatus;
  rows: Row[];
  rowCount: number;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
};

export type HbceDatabaseDescription = {
  configured: boolean;
  available: boolean;
  kind: HbceDatabaseKind;
  status: HbceDatabaseStatus;
  schemaVersion: typeof HBCE_DATABASE_SCHEMA_VERSION;
  persistenceMode: typeof HBCE_DATABASE_PERSISTENCE_MODE;
  databaseUrlPresent: boolean;
  driver: string;
  mode: "HTTP_QUERY";
  boundary: string;
  legalCertificationBoundary: string;
  legalCertification: false;
};

export type HbceDatabaseAdapter = {
  describe(): HbceDatabaseDescription;

  initializeSchema(): Promise<HbceDatabaseQueryResult>;

  query<Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow>(
    sql: string,
    params?: HbceDatabaseQueryValue[]
  ): Promise<HbceDatabaseQueryResult<Row>>;
};

export type HbceDatabaseReadyResult = {
  ok: boolean;
  description: HbceDatabaseDescription;
  initialization: HbceDatabaseQueryResult;
  schema: typeof HBCE_DATABASE_SCHEMA;
};

type HbceSchemaStatementRow = HbceDatabaseQueryRow & {
  index: number;
  ok: boolean;
  status:
    | "EXECUTED"
    | "FAILED"
    | "TABLE_PRESENT"
    | "TABLE_MISSING"
    | "COLUMN_PRESENT"
    | "COLUMN_MISSING";
  sqlHash: string | null;
  tableName?: string;
  columnName?: string;
  error: string | null;
};

const NEON_SERVERLESS_DRIVER = "@neondatabase/serverless";

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL"
];

const MEMORY_RECORDS_COMPATIBILITY_SCHEMA_SQL = [
  `
CREATE TABLE IF NOT EXISTS memory_records (
  memory_id text PRIMARY KEY,
  tenant_id text,
  workspace_id text,
  memory_key_hash text NOT NULL,
  human_ipr text,
  runtime_ipr text NOT NULL DEFAULT 'IPR-AI-0001',
  session_id text NOT NULL DEFAULT 'UNKNOWN_SESSION',
  thread_id text,
  scope text,
  authority text,
  persistence_mode text NOT NULL DEFAULT 'DATABASE_PERSISTENT',
  memory_hash text,
  memory_chain_hash text,
  last_evt_id text,
  last_opc_proof_id text,
  last_opc_chain_hash text,
  record_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  legal_certification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_thread_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_tenant_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_workspace_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_human_ipr_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_runtime_ipr_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_session_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS tenant_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS workspace_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_key_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS human_ipr text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS runtime_ipr text DEFAULT 'IPR-AI-0001';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS session_id text DEFAULT 'UNKNOWN_SESSION';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS thread_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS scope text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS authority text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS persistence_mode text DEFAULT 'DATABASE_PERSISTENT';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_chain_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS last_evt_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS last_opc_proof_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS last_opc_chain_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS record_payload jsonb DEFAULT '{}'::jsonb;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS legal_certification boolean DEFAULT false;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
`.trim(),
  `
UPDATE memory_records
SET
  runtime_ipr = COALESCE(runtime_ipr, 'IPR-AI-0001'),
  session_id = COALESCE(session_id, 'UNKNOWN_SESSION'),
  persistence_mode = COALESCE(persistence_mode, 'DATABASE_PERSISTENT'),
  legal_certification = COALESCE(legal_certification, false),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE
  runtime_ipr IS NULL
  OR session_id IS NULL
  OR persistence_mode IS NULL
  OR legal_certification IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN runtime_ipr SET DEFAULT 'IPR-AI-0001';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN session_id SET DEFAULT 'UNKNOWN_SESSION';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN persistence_mode SET DEFAULT 'DATABASE_PERSISTENT';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN legal_certification SET DEFAULT false;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN created_at SET DEFAULT now();
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN updated_at SET DEFAULT now();
`.trim(),
  `
CREATE UNIQUE INDEX IF NOT EXISTS memory_records_memory_id_uidx
ON memory_records (memory_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_memory_key_hash_idx
ON memory_records (memory_key_hash);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_human_ipr_idx
ON memory_records (human_ipr);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_runtime_ipr_idx
ON memory_records (runtime_ipr);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_session_id_idx
ON memory_records (session_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_thread_id_idx
ON memory_records (thread_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_tenant_workspace_idx
ON memory_records (tenant_id, workspace_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_updated_at_idx
ON memory_records (updated_at DESC);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_legal_certification_idx
ON memory_records (legal_certification);
`.trim()
];

const MEMORY_RECORDS_REQUIRED_COLUMNS = [
  "memory_id",
  "tenant_id",
  "workspace_id",
  "memory_key_hash",
  "human_ipr",
  "runtime_ipr",
  "session_id",
  "thread_id",
  "scope",
  "authority",
  "persistence_mode",
  "memory_hash",
  "memory_chain_hash",
  "last_evt_id",
  "last_opc_proof_id",
  "last_opc_chain_hash",
  "record_payload",
  "legal_certification",
  "created_at",
  "updated_at"
];

const DISABLED_DATABASE_DESCRIPTION: HbceDatabaseDescription = {
  configured: false,
  available: false,
  kind: "DISABLED",
  status: "NOT_CONFIGURED",
  schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
  persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
  databaseUrlPresent: false,
  driver: NEON_SERVERLESS_DRIVER,
  mode: "HTTP_QUERY",
  boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
  legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  legalCertification: false
};

function nowMs(): number {
  return Date.now();
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
    return "UNKNOWN_DATABASE_ERROR";
  }
}

function simpleHash(input: string): string {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return `sqlhash:${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function getDatabaseUrlFromEnv(): string | null {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function isDatabaseUrlConfigured(): boolean {
  return Boolean(getDatabaseUrlFromEnv());
}

function inferDatabaseKind(databaseUrl: string | null): HbceDatabaseKind {
  if (!databaseUrl) {
    return "DISABLED";
  }

  const normalized = databaseUrl.toLowerCase();

  if (normalized.includes("neon.tech") || normalized.includes("neon")) {
    return "NEON_POSTGRES_HTTP";
  }

  return "POSTGRES_COMPATIBLE";
}

function isRecord(value: unknown): value is HbceDatabaseQueryRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRows<Row extends HbceDatabaseQueryRow>(
  value: unknown
): Row[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord) as Row[];
}

function serializeQueryValue(value: HbceDatabaseQueryValue): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

function serializeQueryParams(params: HbceDatabaseQueryValue[]): unknown[] {
  return params.map((param) => serializeQueryValue(param));
}

function buildResult<Row extends HbceDatabaseQueryRow>(input: {
  ok: boolean;
  status: HbceDatabaseStatus;
  rows?: Row[];
  rowCount?: number;
  error?: string | null;
  sql?: string | null;
  startedAt: number;
}): HbceDatabaseQueryResult<Row> {
  const rows = input.rows || [];

  return {
    ok: input.ok,
    status: input.status,
    rows,
    rowCount: typeof input.rowCount === "number" ? input.rowCount : rows.length,
    error: input.error || null,
    sqlHash: input.sql ? simpleHash(normalizeSql(input.sql)) : null,
    durationMs: Math.max(0, nowMs() - input.startedAt)
  };
}

function shouldAutoApplySchema(): boolean {
  const raw =
    process.env.HBCE_DATABASE_AUTO_SCHEMA ||
    process.env.JOKER_DATABASE_AUTO_SCHEMA ||
    "true";

  return raw.trim().toLowerCase() !== "false";
}

function shouldInitializeBeforeQuery(sqlText: string): boolean {
  const normalized = normalizeSql(sqlText).toLowerCase();

  if (!normalized) {
    return false;
  }

  if (normalized.includes("hbce_schema_migrations")) {
    return false;
  }

  if (normalized.startsWith("create table")) {
    return false;
  }

  if (normalized.startsWith("alter table")) {
    return false;
  }

  if (normalized.startsWith("create index")) {
    return false;
  }

  return true;
}

function buildRequiredTablesCheckSql(): string {
  const tableList = HBCE_DATABASE_SCHEMA_TABLES
    .map((tableName) => sqlLiteral(tableName))
    .join(", ");

  return `
SELECT table_name
FROM information_schema.tables
WHERE table_schema IN ('public', current_schema())
  AND table_name IN (${tableList});
`.trim();
}

function buildMemoryRecordsRequiredColumnsCheckSql(): string {
  const columnList = MEMORY_RECORDS_REQUIRED_COLUMNS
    .map((columnName) => sqlLiteral(columnName))
    .join(", ");

  return `
SELECT column_name
FROM information_schema.columns
WHERE table_schema IN ('public', current_schema())
  AND table_name = 'memory_records'
  AND column_name IN (${columnList});
`.trim();
}

class DisabledHbceDatabaseAdapter implements HbceDatabaseAdapter {
  describe(): HbceDatabaseDescription {
    return DISABLED_DATABASE_DESCRIPTION;
  }

  async initializeSchema(): Promise<HbceDatabaseQueryResult> {
    const startedAt = nowMs();

    return buildResult({
      ok: false,
      status: "NOT_CONFIGURED",
      rows: [],
      rowCount: 0,
      error:
        "DATABASE_URL is not configured. HBCE persistence remains unavailable and runtime must not claim DATABASE_PERSISTENT continuity.",
      startedAt
    });
  }

  async query<Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow>(
    sql: string
  ): Promise<HbceDatabaseQueryResult<Row>> {
    const startedAt = nowMs();

    return buildResult<Row>({
      ok: false,
      status: "NOT_CONFIGURED",
      rows: [],
      rowCount: 0,
      error: "DATABASE_URL is not configured. Query was not executed.",
      sql,
      startedAt
    });
  }
}

class NeonHttpHbceDatabaseAdapter implements HbceDatabaseAdapter {
  private readonly databaseUrl: string;
  private readonly kind: HbceDatabaseKind;
  private schemaInitializationPromise: Promise<HbceDatabaseQueryResult> | null = null;
  private schemaInitialized = false;

  constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
    this.kind = inferDatabaseKind(databaseUrl);
  }

  describe(): HbceDatabaseDescription {
    return {
      configured: true,
      available: true,
      kind: this.kind,
      status: "DRIVER_AVAILABLE",
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
      databaseUrlPresent: true,
      driver: NEON_SERVERLESS_DRIVER,
      mode: "HTTP_QUERY",
      boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
      legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
      legalCertification: false
    };
  }

  private getSql() {
    return neon(this.databaseUrl);
  }

  async initializeSchema(): Promise<HbceDatabaseQueryResult> {
    if (this.schemaInitialized && this.schemaInitializationPromise) {
      return this.schemaInitializationPromise;
    }

    if (this.schemaInitializationPromise) {
      return this.schemaInitializationPromise;
    }

    this.schemaInitializationPromise = this.initializeSchemaOnce();

    const result = await this.schemaInitializationPromise;

    if (result.ok) {
      this.schemaInitialized = true;
    } else {
      this.schemaInitializationPromise = null;
      this.schemaInitialized = false;
    }

    return result;
  }

  private async initializeSchemaOnce(): Promise<HbceDatabaseQueryResult> {
    const startedAt = nowMs();
    const compatibilitySql = MEMORY_RECORDS_COMPATIBILITY_SCHEMA_SQL.join("\n\n");
    const joinedSql = [
      HBCE_DATABASE_SCHEMA_SQL.join("\n\n"),
      compatibilitySql
    ].join("\n\n");
    const sql = this.getSql();
    const rows: HbceSchemaStatementRow[] = [];

    let executedStatements = 0;
    let failedStatements = 0;

    const allStatements = [
      ...HBCE_DATABASE_SCHEMA_SQL,
      ...MEMORY_RECORDS_COMPATIBILITY_SCHEMA_SQL
    ];

    for (let index = 0; index < allStatements.length; index += 1) {
      const statement = allStatements[index];
      const normalized = statement.trim();

      if (!normalized) {
        continue;
      }

      try {
        await sql.query(normalized, []);
        executedStatements += 1;

        rows.push({
          index,
          ok: true,
          status: "EXECUTED",
          sqlHash: simpleHash(normalizeSql(normalized)),
          error: null
        });
      } catch (error) {
        failedStatements += 1;

        rows.push({
          index,
          ok: false,
          status: "FAILED",
          sqlHash: simpleHash(normalizeSql(normalized)),
          error: safeError(error)
        });
      }
    }

    let missingTables: string[] = [];

    try {
      const tableResult = await sql.query(buildRequiredTablesCheckSql(), []);
      const existingRows = normalizeRows<{ table_name?: unknown }>(tableResult);
      const existingTables = new Set(
        existingRows
          .map((row) => row.table_name)
          .filter((value): value is string => typeof value === "string")
      );

      missingTables = HBCE_DATABASE_SCHEMA_TABLES.filter(
        (tableName) => !existingTables.has(tableName)
      );

      for (const tableName of HBCE_DATABASE_SCHEMA_TABLES) {
        const present = existingTables.has(tableName);

        rows.push({
          index: allStatements.length,
          ok: present,
          status: present ? "TABLE_PRESENT" : "TABLE_MISSING",
          sqlHash: null,
          tableName,
          error: present ? null : `Required table ${tableName} is missing.`
        });
      }
    } catch (error) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error: `Schema statements executed with ${failedStatements} statement error(s), but required table verification failed: ${safeError(error)}`,
        sql: joinedSql,
        startedAt
      });
    }

    let missingMemoryColumns: string[] = [];

    try {
      const columnResult = await sql.query(
        buildMemoryRecordsRequiredColumnsCheckSql(),
        []
      );
      const existingColumnRows = normalizeRows<{ column_name?: unknown }>(
        columnResult
      );
      const existingColumns = new Set(
        existingColumnRows
          .map((row) => row.column_name)
          .filter((value): value is string => typeof value === "string")
      );

      missingMemoryColumns = MEMORY_RECORDS_REQUIRED_COLUMNS.filter(
        (columnName) => !existingColumns.has(columnName)
      );

      for (const columnName of MEMORY_RECORDS_REQUIRED_COLUMNS) {
        const present = existingColumns.has(columnName);

        rows.push({
          index: allStatements.length + 1,
          ok: present,
          status: present ? "COLUMN_PRESENT" : "COLUMN_MISSING",
          sqlHash: null,
          tableName: "memory_records",
          columnName,
          error: present
            ? null
            : `Required column memory_records.${columnName} is missing.`
        });
      }
    } catch (error) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error: `Schema statements executed with ${failedStatements} statement error(s), but memory_records column verification failed: ${safeError(error)}`,
        sql: joinedSql,
        startedAt
      });
    }

    if (missingTables.length > 0 || missingMemoryColumns.length > 0) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error:
          `HBCE database schema initialization incomplete. ` +
          `Missing tables: ${missingTables.length ? missingTables.join(", ") : "none"}. ` +
          `Missing memory_records columns: ${missingMemoryColumns.length ? missingMemoryColumns.join(", ") : "none"}. ` +
          `Statement failures: ${failedStatements}.`,
        sql: joinedSql,
        startedAt
      });
    }

    return buildResult<HbceDatabaseQueryRow>({
      ok: true,
      status: "AVAILABLE",
      rows,
      rowCount: executedStatements,
      error:
        failedStatements > 0
          ? `Schema available with ${failedStatements} non-fatal statement failure(s). Existing incompatible constraints or legacy columns may already have been normalized.`
          : null,
      sql: joinedSql,
      startedAt
    });
  }

  async query<Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow>(
    sqlText: string,
    params: HbceDatabaseQueryValue[] = []
  ): Promise<HbceDatabaseQueryResult<Row>> {
    const startedAt = nowMs();
    const normalizedSql = sqlText.trim();

    if (!normalizedSql) {
      return buildResult<Row>({
        ok: false,
        status: "QUERY_FAILED",
        rows: [],
        rowCount: 0,
        error: "EMPTY_SQL_QUERY",
        sql: sqlText,
        startedAt
      });
    }

    if (shouldAutoApplySchema() && shouldInitializeBeforeQuery(normalizedSql)) {
      await this.initializeSchema();
    }

    try {
      const sql = this.getSql();
      const result = await sql.query(
        normalizedSql,
        serializeQueryParams(params)
      );
      const rows = normalizeRows<Row>(result);

      return buildResult<Row>({
        ok: true,
        status: "AVAILABLE",
        rows,
        rowCount: rows.length,
        sql: sqlText,
        startedAt
      });
    } catch (error) {
      return buildResult<Row>({
        ok: false,
        status: "QUERY_FAILED",
        rows: [],
        rowCount: 0,
        error: safeError(error),
        sql: sqlText,
        startedAt
      });
    }
  }
}

const globalForHbceDatabase = globalThis as typeof globalThis & {
  __hbceDatabaseAdapter?: HbceDatabaseAdapter;
};

export function createHbceDatabaseAdapter(): HbceDatabaseAdapter {
  const databaseUrl = getDatabaseUrlFromEnv();

  if (!databaseUrl) {
    return new DisabledHbceDatabaseAdapter();
  }

  return new NeonHttpHbceDatabaseAdapter(databaseUrl);
}

export function getDefaultHbceDatabase(): HbceDatabaseAdapter {
  if (!globalForHbceDatabase.__hbceDatabaseAdapter) {
    globalForHbceDatabase.__hbceDatabaseAdapter = createHbceDatabaseAdapter();
  }

  return globalForHbceDatabase.__hbceDatabaseAdapter;
}

export function resetDefaultHbceDatabaseForTests(): void {
  delete globalForHbceDatabase.__hbceDatabaseAdapter;
}

export function describeDefaultHbceDatabase(): HbceDatabaseDescription {
  return getDefaultHbceDatabase().describe();
}

export function isHbceDatabaseConfigured(): boolean {
  return isDatabaseUrlConfigured();
}

export function isHbceDatabaseAvailable(): boolean {
  const description = describeDefaultHbceDatabase();

  return description.configured && description.available;
}

export async function initializeHbceDatabaseSchema(): Promise<HbceDatabaseQueryResult> {
  return getDefaultHbceDatabase().initializeSchema();
}

export async function applyHbceDatabaseSchemaAsync(): Promise<HbceDatabaseQueryResult> {
  return initializeHbceDatabaseSchema();
}

export async function queryHbceDatabase<
  Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow
>(
  sql: string,
  params: HbceDatabaseQueryValue[] = []
): Promise<HbceDatabaseQueryResult<Row>> {
  return getDefaultHbceDatabase().query<Row>(sql, params);
}

export async function ensureHbceDatabaseReady(): Promise<HbceDatabaseReadyResult> {
  const database = getDefaultHbceDatabase();
  const initialization = await database.initializeSchema();

  return {
    ok: initialization.ok,
    description: database.describe(),
    initialization,
    schema: HBCE_DATABASE_SCHEMA
  };
}

export function getHbceDatabaseBoundary() {
  return {
    schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
    persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
    autoSchemaApply: shouldAutoApplySchema(),
    boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
    legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
    legalCertification: false
  };
}

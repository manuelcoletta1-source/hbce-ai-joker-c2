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
  status: "EXECUTED" | "FAILED" | "TABLE_PRESENT" | "TABLE_MISSING";
  sqlHash: string | null;
  tableName?: string;
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
    const joinedSql = HBCE_DATABASE_SCHEMA_SQL.join("\n\n");
    const sql = this.getSql();
    const rows: HbceSchemaStatementRow[] = [];

    let executedStatements = 0;
    let failedStatements = 0;

    for (let index = 0; index < HBCE_DATABASE_SCHEMA_SQL.length; index += 1) {
      const statement = HBCE_DATABASE_SCHEMA_SQL[index];
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
          index: HBCE_DATABASE_SCHEMA_SQL.length,
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

    if (missingTables.length > 0) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error:
          `HBCE database schema initialization incomplete. Missing tables: ${missingTables.join(", ")}. ` +
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

import {
  HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA,
  HBCE_DATABASE_SCHEMA_BOUNDARY,
  HBCE_DATABASE_SCHEMA_SQL,
  HBCE_DATABASE_SCHEMA_VERSION
} from "./ipr-database-schema";

export type HbceDatabaseStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DRIVER_NOT_AVAILABLE"
  | "INITIALIZATION_FAILED"
  | "QUERY_FAILED";

export type HbceDatabaseKind =
  | "NEON_POSTGRES"
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

export type HbceDatabaseQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> = {
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
  boundary: string;
  legalCertificationBoundary: string;
  legalCertification: false;
};

export type HbceDatabaseAdapter = {
  describe(): HbceDatabaseDescription;
  initializeSchema(): Promise<HbceDatabaseQueryResult>;
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: HbceDatabaseQueryValue[]
  ): Promise<HbceDatabaseQueryResult<Row>>;
};

type NeonLikeClient = {
  connect(): Promise<void>;
  query(
    sql: string,
    params?: HbceDatabaseQueryValue[]
  ): Promise<{
    rows?: unknown[];
    rowCount?: number | null;
  }>;
  end(): Promise<void>;
};

type NeonLikeClientConstructor = new (input: {
  connectionString: string;
}) => NeonLikeClient;

type NeonServerlessModule = {
  Client?: NeonLikeClientConstructor;
};

const NEON_SERVERLESS_DRIVER = "@neondatabase/serverless";

const DISABLED_DATABASE_DESCRIPTION: HbceDatabaseDescription = {
  configured: false,
  available: false,
  kind: "DISABLED",
  status: "NOT_CONFIGURED",
  schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
  persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
  databaseUrlPresent: false,
  driver: NEON_SERVERLESS_DRIVER,
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

function getDatabaseUrlFromEnv(): string | null {
  const direct = process.env.DATABASE_URL;

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const postgresUrl = process.env.POSTGRES_URL;

  if (typeof postgresUrl === "string" && postgresUrl.trim()) {
    return postgresUrl.trim();
  }

  return null;
}

function isDatabaseUrlConfigured(): boolean {
  return Boolean(getDatabaseUrlFromEnv());
}

async function dynamicImportModule(specifier: string): Promise<unknown> {
  const importer = new Function(
    "specifier",
    "return import(specifier)"
  ) as (value: string) => Promise<unknown>;

  return importer(specifier);
}

async function loadNeonServerlessModule(): Promise<NeonServerlessModule | null> {
  try {
    const loaded = await dynamicImportModule(NEON_SERVERLESS_DRIVER);

    if (loaded && typeof loaded === "object") {
      return loaded as NeonServerlessModule;
    }

    return null;
  } catch {
    return null;
  }
}

function buildResult<Row extends Record<string, unknown>>(input: {
  ok: boolean;
  status: HbceDatabaseStatus;
  rows?: Row[];
  rowCount?: number;
  error?: string | null;
  sql?: string | null;
  startedAt: number;
}): HbceDatabaseQueryResult<Row> {
  return {
    ok: input.ok,
    status: input.status,
    rows: input.rows || [],
    rowCount: input.rowCount || 0,
    error: input.error || null,
    sqlHash: input.sql ? simpleHash(normalizeSql(input.sql)) : null,
    durationMs: Math.max(0, nowMs() - input.startedAt)
  };
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
      error:
        "DATABASE_URL is not configured. HBCE persistence remains unavailable and runtime must not claim DATABASE_PERSISTENT continuity.",
      startedAt
    });
  }

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string
  ): Promise<HbceDatabaseQueryResult<Row>> {
    const startedAt = nowMs();

    return buildResult<Row>({
      ok: false,
      status: "NOT_CONFIGURED",
      rows: [],
      rowCount: 0,
      error:
        "DATABASE_URL is not configured. Query was not executed.",
      sql,
      startedAt
    });
  }
}

class NeonHbceDatabaseAdapter implements HbceDatabaseAdapter {
  private readonly databaseUrl: string;

  constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
  }

  describe(): HbceDatabaseDescription {
    return {
      configured: true,
      available: true,
      kind: "NEON_POSTGRES",
      status: "AVAILABLE",
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
      databaseUrlPresent: true,
      driver: NEON_SERVERLESS_DRIVER,
      boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
      legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
      legalCertification: false
    };
  }

  private async createClient(): Promise<NeonLikeClient | null> {
    const module = await loadNeonServerlessModule();

    if (!module?.Client) {
      return null;
    }

    return new module.Client({
      connectionString: this.databaseUrl
    });
  }

  async initializeSchema(): Promise<HbceDatabaseQueryResult> {
    const startedAt = nowMs();
    const joinedSql = HBCE_DATABASE_SCHEMA_SQL.join("\n\n");
    const client = await this.createClient();

    if (!client) {
      return buildResult({
        ok: false,
        status: "DRIVER_NOT_AVAILABLE",
        error:
          "The @neondatabase/serverless driver is not available. Add it to package.json before using DATABASE_PERSISTENT mode.",
        sql: joinedSql,
        startedAt
      });
    }

    try {
      await client.connect();

      for (const statement of HBCE_DATABASE_SCHEMA_SQL) {
        const normalized = statement.trim();

        if (normalized) {
          await client.query(normalized);
        }
      }

      return buildResult({
        ok: true,
        status: "AVAILABLE",
        rows: [],
        rowCount: HBCE_DATABASE_SCHEMA_SQL.length,
        sql: joinedSql,
        startedAt
      });
    } catch (error) {
      return buildResult({
        ok: false,
        status: "INITIALIZATION_FAILED",
        error: safeError(error),
        sql: joinedSql,
        startedAt
      });
    } finally {
      try {
        await client.end();
      } catch {
        // Ignore close errors. The query result above remains authoritative.
      }
    }
  }

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params: HbceDatabaseQueryValue[] = []
  ): Promise<HbceDatabaseQueryResult<Row>> {
    const startedAt = nowMs();
    const normalizedSql = sql.trim();

    if (!normalizedSql) {
      return buildResult<Row>({
        ok: false,
        status: "QUERY_FAILED",
        rows: [],
        rowCount: 0,
        error: "EMPTY_SQL_QUERY",
        sql,
        startedAt
      });
    }

    const client = await this.createClient();

    if (!client) {
      return buildResult<Row>({
        ok: false,
        status: "DRIVER_NOT_AVAILABLE",
        rows: [],
        rowCount: 0,
        error:
          "The @neondatabase/serverless driver is not available. Add it to package.json before using DATABASE_PERSISTENT mode.",
        sql,
        startedAt
      });
    }

    try {
      await client.connect();
      const result = await client.query(normalizedSql, params);
      const rows = Array.isArray(result.rows)
        ? (result.rows.filter((row): row is Row => Boolean(row) && typeof row === "object" && !Array.isArray(row)) as Row[])
        : [];

      return buildResult<Row>({
        ok: true,
        status: "AVAILABLE",
        rows,
        rowCount:
          typeof result.rowCount === "number"
            ? result.rowCount
            : rows.length,
        sql,
        startedAt
      });
    } catch (error) {
      return buildResult<Row>({
        ok: false,
        status: "QUERY_FAILED",
        rows: [],
        rowCount: 0,
        error: safeError(error),
        sql,
        startedAt
      });
    } finally {
      try {
        await client.end();
      } catch {
        // Ignore close errors. The query result above remains authoritative.
      }
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

  return new NeonHbceDatabaseAdapter(databaseUrl);
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

export async function initializeHbceDatabaseSchema(): Promise<HbceDatabaseQueryResult> {
  return getDefaultHbceDatabase().initializeSchema();
}

export async function queryHbceDatabase<
  Row extends Record<string, unknown> = Record<string, unknown>
>(
  sql: string,
  params: HbceDatabaseQueryValue[] = []
): Promise<HbceDatabaseQueryResult<Row>> {
  return getDefaultHbceDatabase().query<Row>(sql, params);
}

export async function ensureHbceDatabaseReady(): Promise<{
  ok: boolean;
  description: HbceDatabaseDescription;
  initialization: HbceDatabaseQueryResult;
  schema: typeof HBCE_DATABASE_SCHEMA;
}> {
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
    boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
    legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
    legalCertification: false
  };
}

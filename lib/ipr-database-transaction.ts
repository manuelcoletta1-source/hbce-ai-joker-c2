import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "@neondatabase/serverless";

import {
  isHbceDatabaseUrlConfigured,
  requireHbceDatabaseUrl,
} from "@/lib/ipr-database-url-resolver";

export type HbceTransactionQueryValue =
  | string
  | number
  | boolean
  | bigint
  | Date
  | null;

export type HbceTransactionState =
  | "NOT_STARTED"
  | "ACTIVE"
  | "COMMITTED"
  | "ROLLED_BACK"
  | "FAILED";

export type HbceTransactionContext = {
  readonly client: PoolClient;
  readonly transactionId: string;
  readonly startedAt: string;

  query<Row extends QueryResultRow = QueryResultRow>(
    sql: string,
    parameters?: readonly HbceTransactionQueryValue[],
  ): Promise<QueryResult<Row>>;
};

export type HbceTransactionOptions = {
  isolationLevel?:
    | "READ COMMITTED"
    | "REPEATABLE READ"
    | "SERIALIZABLE";

  readOnly?: boolean;

  deferrable?: boolean;

  statementTimeoutMs?: number;

  lockTimeoutMs?: number;

  idleInTransactionSessionTimeoutMs?: number;
};

export type HbceTransactionResult<T> = {
  ok: true;
  transactionId: string;
  state: "COMMITTED";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  value: T;
};

export type HbceTransactionFailure = {
  ok: false;
  transactionId: string;
  state: "ROLLED_BACK" | "FAILED";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  error: string;
  rollbackError: string | null;
};

export type HbceTransactionOutcome<T> =
  | HbceTransactionResult<T>
  | HbceTransactionFailure;

const DEFAULT_STATEMENT_TIMEOUT_MS = 120_000;
const DEFAULT_LOCK_TIMEOUT_MS = 15_000;
const DEFAULT_IDLE_TRANSACTION_TIMEOUT_MS = 120_000;

const DEFAULT_ISOLATION_LEVEL =
  "READ COMMITTED" as const;

let pool: Pool | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function elapsedMs(startedAtMs: number): number {
  return Math.max(
    0,
    Date.now() - startedAtMs,
  );
}

function normalizeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function requireDatabaseUrl(): string {
  try {
    return requireHbceDatabaseUrl();
  } catch (error) {
    const message =
      normalizeError(error);

    if (
      message ===
      "HBCE_DATABASE_URL_NOT_CONFIGURED"
    ) {
      throw new Error(
        "HBCE_DATABASE_TRANSACTION_URL_NOT_CONFIGURED",
      );
    }

    if (
      message ===
      "HBCE_DATABASE_URL_INVALID_CONFIGURATION"
    ) {
      throw new Error(
        "HBCE_DATABASE_TRANSACTION_URL_INVALID_CONFIGURATION",
      );
    }

    throw error;
  }
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      Math.floor(value),
    ),
  );
}

function createTransactionId(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);

  const randomPart =
    crypto.randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase();

  return `HBCE-TX-${timestamp}-${randomPart}`;
}

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString:
      requireDatabaseUrl(),

    max: 5,

    idleTimeoutMillis:
      30_000,

    connectionTimeoutMillis:
      20_000,
  });

  pool.on(
    "error",
    (error: Error) => {
      console.error(
        "HBCE_DATABASE_TRANSACTION_POOL_ERROR",
        {
          error:
            normalizeError(error),
        },
      );
    },
  );

  return pool;
}

function buildBeginStatement(
  options: HbceTransactionOptions,
): string {
  const isolationLevel =
    options.isolationLevel ??
    DEFAULT_ISOLATION_LEVEL;

  const accessMode =
    options.readOnly
      ? "READ ONLY"
      : "READ WRITE";

  const deferrableMode =
    options.deferrable
      ? "DEFERRABLE"
      : "NOT DEFERRABLE";

  if (
    options.deferrable &&
    (
      isolationLevel !==
        "SERIALIZABLE" ||
      !options.readOnly
    )
  ) {
    throw new Error(
      "HBCE_TRANSACTION_DEFERRABLE_REQUIRES_SERIALIZABLE_READ_ONLY",
    );
  }

  return [
    "BEGIN",
    `ISOLATION LEVEL ${isolationLevel}`,
    accessMode,
    deferrableMode,
  ].join(" ");
}

async function configureTransactionSession(
  client: PoolClient,
  options: HbceTransactionOptions,
): Promise<void> {
  const statementTimeoutMs =
    boundedInteger(
      options.statementTimeoutMs,
      DEFAULT_STATEMENT_TIMEOUT_MS,
      1_000,
      600_000,
    );

  const lockTimeoutMs =
    boundedInteger(
      options.lockTimeoutMs,
      DEFAULT_LOCK_TIMEOUT_MS,
      1_000,
      120_000,
    );

  const idleTimeoutMs =
    boundedInteger(
      options.idleInTransactionSessionTimeoutMs,
      DEFAULT_IDLE_TRANSACTION_TIMEOUT_MS,
      1_000,
      600_000,
    );

  await client.query(
    `
      SELECT
        set_config(
          'statement_timeout',
          $1,
          true
        )
    `,
    [String(statementTimeoutMs)],
  );

  await client.query(
    `
      SELECT
        set_config(
          'lock_timeout',
          $1,
          true
        )
    `,
    [String(lockTimeoutMs)],
  );

  await client.query(
    `
      SELECT
        set_config(
          'idle_in_transaction_session_timeout',
          $1,
          true
        )
    `,
    [String(idleTimeoutMs)],
  );
}

export function isHbceTransactionDatabaseConfigured(): boolean {
  return isHbceDatabaseUrlConfigured();
}

export function describeHbceTransactionDatabase(): {
  configured: boolean;
  driver: string;
  mode: string;
  supportsPersistentSession: boolean;
  supportsBeginCommitRollback: boolean;
  poolInitialized: boolean;
} {
  return {
    configured:
      isHbceTransactionDatabaseConfigured(),

    driver:
      "@neondatabase/serverless Pool",

    mode:
      "PERSISTENT_POOLED_SESSION",

    supportsPersistentSession:
      true,

    supportsBeginCommitRollback:
      true,

    poolInitialized:
      pool !== null,
  };
}

export async function withHbceDatabaseTransaction<T>(
  operation: (
    context: HbceTransactionContext,
  ) => Promise<T>,
  options: HbceTransactionOptions = {},
): Promise<HbceTransactionOutcome<T>> {
  const transactionId =
    createTransactionId();

  const startedAt =
    nowIso();

  const startedAtMs =
    Date.now();

  let client:
    PoolClient | null = null;

  let state:
    HbceTransactionState =
      "NOT_STARTED";

  try {
    client =
      await getPool().connect();

    const beginStatement =
      buildBeginStatement(options);

    await client.query(
      beginStatement,
    );

    state =
      "ACTIVE";

    await configureTransactionSession(
      client,
      options,
    );

    const context:
      HbceTransactionContext = {
        client,
        transactionId,
        startedAt,

        async query<
          Row extends QueryResultRow =
            QueryResultRow,
        >(
          sql: string,
          parameters:
            readonly HbceTransactionQueryValue[] =
              [],
        ): Promise<QueryResult<Row>> {
          if (
            state !==
            "ACTIVE"
          ) {
            throw new Error(
              `HBCE_TRANSACTION_NOT_ACTIVE:${state}`,
            );
          }

          return client!.query<Row>(
            sql,
            [...parameters],
          );
        },
      };

    const value =
      await operation(context);

    await client.query(
      "COMMIT",
    );

    state =
      "COMMITTED";

    const completedAt =
      nowIso();

    return {
      ok: true,
      transactionId,
      state:
        "COMMITTED",
      startedAt,
      completedAt,
      durationMs:
        elapsedMs(
          startedAtMs,
        ),
      value,
    };
  } catch (error) {
    const primaryError =
      normalizeError(error);

    let rollbackError:
      string | null = null;

    if (
      client &&
      state === "ACTIVE"
    ) {
      try {
        await client.query(
          "ROLLBACK",
        );

        state =
          "ROLLED_BACK";
      } catch (
        rollbackFailure
      ) {
        rollbackError =
          normalizeError(
            rollbackFailure,
          );

        state =
          "FAILED";
      }
    } else {
      state =
        "FAILED";
    }

    const completedAt =
      nowIso();

    return {
      ok: false,
      transactionId,
      state:
        state ===
        "ROLLED_BACK"
          ? "ROLLED_BACK"
          : "FAILED",
      startedAt,
      completedAt,
      durationMs:
        elapsedMs(
          startedAtMs,
        ),
      error:
        primaryError,
      rollbackError,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function closeHbceTransactionPool(): Promise<void> {
  if (!pool) {
    return;
  }

  const activePool =
    pool;

  pool =
    null;

  await activePool.end();
}

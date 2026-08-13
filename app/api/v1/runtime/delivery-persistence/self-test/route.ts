import {
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import {
  Pool,
} from "@neondatabase/serverless";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createHbceDeliveryAttemptRecord,
  createHbceDeliveryRecord,
} from "../../../../../../runtime/hbce-level10-delivery-domain";

import {
  NeonHbceDeliveryRepository,
  type HbceDeliveryDatabasePool,
} from "../../../../../../runtime/hbce-level10-delivery-neon-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

const REVISION =
  "HBCE-RUNTIME-LEVEL-10-D001-DELIVERY-PERSISTENCE-SELF-TEST-v1_4" as const;

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer" as const;

const MANUAL_AUTHORIZATION_HEADER =
  "x-hbce-ledger-self-test-token" as const;

const RUNTIME_IPR =
  "IPR-AI-0001" as const;

const HUMAN_AUTHORITY_IPR =
  "IPR-3" as const;

type Check = {
  id: string;
  description: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
};

function makeCheck(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
): Check {
  return {
    id,
    description,
    expected,
    actual,
    passed:
      Object.is(
        expected,
        actual,
      ),
  };
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

function getDatabaseUrl():
  string {
  const databaseUrl =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.NEON_DATABASE_URL;

  if (
    typeof databaseUrl !== "string" ||
    databaseUrl.length === 0
  ) {
    throw new Error(
      "HBCE_LEVEL_10_D001_DATABASE_NOT_CONFIGURED",
    );
  }

  return databaseUrl;
}

type DatabaseEndpointIdentity = {
  sourceEnvironmentKey:
    | "DATABASE_URL"
    | "POSTGRES_URL"
    | "NEON_DATABASE_URL"
    | "NONE";

  databaseHostClass:
    | "NEON"
    | "POSTGRES_COMPATIBLE"
    | "UNKNOWN";

  neonEndpointId:
    string | null;
};

function getDatabaseEndpointIdentity():
  DatabaseEndpointIdentity {
  const candidates = [
    [
      "POSTGRES_URL",
      process.env.POSTGRES_URL,
    ],
    [
      "DATABASE_URL",
      process.env.DATABASE_URL,
    ],
    [
      "NEON_DATABASE_URL",
      process.env.NEON_DATABASE_URL,
    ],
  ] as const;

  const selected =
    candidates.find(
      ([, value]) =>
        typeof value === "string" &&
        value.length > 0,
    );

  if (!selected) {
    return {
      sourceEnvironmentKey:
        "NONE",

      databaseHostClass:
        "UNKNOWN",

      neonEndpointId:
        null,
    };
  }

  const [
    sourceEnvironmentKey,
    rawDatabaseUrl,
  ] = selected;

  if (
    typeof rawDatabaseUrl !== "string" ||
    rawDatabaseUrl.length === 0
  ) {
    return {
      sourceEnvironmentKey,

      databaseHostClass:
        "UNKNOWN",

      neonEndpointId:
        null,
    };
  }

  const databaseUrl =
    rawDatabaseUrl;

  try {
    const parsed =
      new URL(
        databaseUrl,
      );

    const hostname =
      parsed.hostname
        .toLowerCase();

    const isNeon =
      hostname.endsWith(
        ".neon.tech",
      );

    const firstLabel =
      hostname
        .split(".")[0] ??
      "";

    const normalizedEndpointId =
      firstLabel.replace(
        /-pooler$/i,
        "",
      );

    return {
      sourceEnvironmentKey,

      databaseHostClass:
        isNeon
          ? "NEON"
          : "POSTGRES_COMPATIBLE",

      neonEndpointId:
        isNeon &&
        normalizedEndpointId.startsWith(
          "ep-",
        )
          ? normalizedEndpointId
          : null,
    };
  } catch {
    return {
      sourceEnvironmentKey,

      databaseHostClass:
        "UNKNOWN",

      neonEndpointId:
        null,
    };
  }
}

function getExpectedManualToken():
  string | null {
  const value =
    process.env
      .HBCE_LEDGER_SELF_TEST_TOKEN;

  if (
    typeof value !== "string" ||
    value.length < 16
  ) {
    return null;
  }

  return value;
}

function constantTimeEqual(
  actual: string,
  expected: string,
): boolean {
  const actualBuffer =
    Buffer.from(
      actual,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8",
    );

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actualBuffer,
    expectedBuffer,
  );
}

function isAuthorized(
  request: NextRequest,
  expectedToken: string,
): boolean {
  const suppliedToken =
    request.headers.get(
      MANUAL_AUTHORIZATION_HEADER,
    );

  if (
    typeof suppliedToken !== "string" ||
    suppliedToken.length === 0
  ) {
    return false;
  }

  return constantTimeEqual(
    suppliedToken,
    expectedToken,
  );
}

function buildHeaders(
  status:
    | "READY"
    | "PASS"
    | "FAIL"
    | "FAIL_CLOSED",
): Record<string, string> {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate",

    Pragma:
      "no-cache",

    Expires:
      "0",

    "X-HBCE-Artifact":
      REVISION,

    "X-HBCE-Operational-Status":
      status,

    "X-HBCE-Human-Authorization-Required":
      "true",

    "X-HBCE-Autonomous-Authorization":
      "false",

    "X-HBCE-Runtime-Activation":
      "false",

    "X-HBCE-No-Submit-From-Code":
      "true",

    "X-HBCE-Legal-Certification":
      "false",
  };
}

async function safeEnd(
  pool: Pool | null,
): Promise<void> {
  if (!pool) {
    return;
  }

  try {
    await pool.end();
  } catch {
    /*
     * Pool shutdown failure must not replace
     * the primary self-test result.
     */
  }
}

function createPool(
  databaseUrl: string,
): Pool {
  return new Pool({
    connectionString:
      databaseUrl,
  });
}

function asRepositoryPool(
  pool: Pool,
): HbceDeliveryDatabasePool {
  return pool as unknown as
    HbceDeliveryDatabasePool;
}

function numericCount(
  value: unknown,
): number {
  const count =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isSafeInteger(count) ||
    count < 0
  ) {
    throw new Error(
      "HBCE_D001_INVALID_DATABASE_COUNT",
    );
  }

  return count;
}

async function emergencyCleanup(
  databaseUrl: string,
  operationId: string,
  deliveryId: string,
  attemptId: string,
): Promise<{
  attempted: boolean;
  completed: boolean;
  error: string | null;
}> {
  const pool =
    createPool(
      databaseUrl,
    );

  try {
    await pool.query(
      "BEGIN",
    );

    await pool.query(
      `
        DELETE FROM public.runtime_delivery_attempts
        WHERE attempt_id = $1
      `,
      [
        attemptId,
      ],
    );

    await pool.query(
      `
        DELETE FROM public.runtime_deliveries
        WHERE delivery_id = $1
      `,
      [
        deliveryId,
      ],
    );

    await pool.query(
      `
        DELETE FROM public.runtime_operations
        WHERE operation_id = $1
      `,
      [
        operationId,
      ],
    );

    await pool.query(
      "COMMIT",
    );

    return {
      attempted:
        true,

      completed:
        true,

      error:
        null,
    };
  } catch (error) {
    try {
      await pool.query(
        "ROLLBACK",
      );
    } catch {
      /*
       * Preserve cleanup failure.
       */
    }

    return {
      attempted:
        true,

      completed:
        false,

      error:
        normalizeError(
          error,
        ),
    };
  } finally {
    await safeEnd(
      pool,
    );
  }
}

function getOrigin(
  request: NextRequest,
): string {
  const forwardedProto =
    request.headers.get(
      "x-forwarded-proto",
    );

  const forwardedHost =
    request.headers.get(
      "x-forwarded-host",
    );

  const host =
    forwardedHost ??
    request.headers.get(
      "host",
    );

  if (host) {
    return `${
      forwardedProto ??
      "https"
    }://${host}`;
  }

  return request.nextUrl.origin;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const databaseUrl =
    getDatabaseUrl();

  const diagnosticPool =
    createPool(
      databaseUrl,
    );

  let databaseSessionIdentity:
    Record<string, unknown>;

  try {
    const result =
      await diagnosticPool.query<{
        database_name:
          string;
        database_user:
          string;
        database_schema:
          string | null;
        search_path:
          string;
        unqualified_deliveries:
          string | null;
        public_deliveries:
          string | null;
        unqualified_attempts:
          string | null;
        public_attempts:
          string | null;
      }>(
        `
          SELECT
            current_database()
              AS database_name,
            current_user
              AS database_user,
            current_schema()
              AS database_schema,
            current_setting('search_path')
              AS search_path,
            to_regclass('runtime_deliveries')::text
              AS unqualified_deliveries,
            to_regclass('public.runtime_deliveries')::text
              AS public_deliveries,
            to_regclass('runtime_delivery_attempts')::text
              AS unqualified_attempts,
            to_regclass('public.runtime_delivery_attempts')::text
              AS public_attempts
        `,
      );

    databaseSessionIdentity =
      result.rows[0] ?? {
        status:
          "NO_ROW",
      };
  } catch (error) {
    databaseSessionIdentity = {
      status:
        "QUERY_FAILED",

      error:
        normalizeError(
          error,
        ),
    };
  } finally {
    await safeEnd(
      diagnosticPool,
    );
  }

  const postgresUrl =
    process.env.POSTGRES_URL;

  let postgresUrlDiagnostic:
    Record<string, unknown> = {
      configured:
        false,
    };

  if (
    typeof postgresUrl === "string" &&
    postgresUrl.length > 0
  ) {
    let safeIdentity:
      Record<string, unknown>;

    try {
      const parsed =
        new URL(
          postgresUrl,
        );

      const hostname =
        parsed.hostname.toLowerCase();

      const firstLabel =
        hostname.split(".")[0] ?? "";

      const pooled =
        firstLabel.endsWith(
          "-pooler",
        );

      const neonEndpointId =
        (
          pooled
            ? firstLabel.slice(
                0,
                -7,
              )
            : firstLabel
        ).startsWith("ep-")
          ? (
              pooled
                ? firstLabel.slice(
                    0,
                    -7,
                  )
                : firstLabel
            )
          : null;

      safeIdentity = {
        configured:
          true,

        pooled,

        databaseHostClass:
          hostname.endsWith(
            ".neon.tech",
          )
            ? "NEON"
            : "POSTGRES_COMPATIBLE",

        neonEndpointId,
      };
    } catch {
      safeIdentity = {
        configured:
          true,

        pooled:
          null,

        databaseHostClass:
          "UNKNOWN",

        neonEndpointId:
          null,
      };
    }

    const postgresDiagnosticPool =
      createPool(
        postgresUrl,
      );

    try {
      const result =
        await postgresDiagnosticPool.query<{
          database_name:
            string;
          database_user:
            string;
          database_schema:
            string | null;
          search_path:
            string;
          runtime_operations:
            string | null;
          runtime_deliveries:
            string | null;
          runtime_delivery_attempts:
            string | null;
        }>(
          `
            SELECT
              current_database()
                AS database_name,

              current_user
                AS database_user,

              current_schema()
                AS database_schema,

              current_setting('search_path')
                AS search_path,

              to_regclass(
                'public.runtime_operations'
              )::text
                AS runtime_operations,

              to_regclass(
                'public.runtime_deliveries'
              )::text
                AS runtime_deliveries,

              to_regclass(
                'public.runtime_delivery_attempts'
              )::text
                AS runtime_delivery_attempts
          `,
        );

      postgresUrlDiagnostic = {
        ...safeIdentity,

        session:
          result.rows[0] ?? null,
      };
    } catch (error) {
      postgresUrlDiagnostic = {
        ...safeIdentity,

        status:
          "QUERY_FAILED",

        error:
          normalizeError(
            error,
          ),
      };
    } finally {
      await safeEnd(
        postgresDiagnosticPool,
      );
    }
  }

  return NextResponse.json(
    {
      ok:
        true,

      status:
        "HBCE_RUNTIME_LEVEL_10_D001_DELIVERY_PERSISTENCE_SELF_TEST_READY",

      operationalStatus:
        "READY",

      revision:
        REVISION,

      product:
        PRODUCT,

      generatedAt:
        new Date().toISOString(),

      endpoint:
        `${getOrigin(
          request,
        )}/api/v1/runtime/delivery-persistence/self-test`,

      executionMethod:
        "POST",

      selfTestExecuted:
        false,

      databaseIdentity:
        getDatabaseEndpointIdentity(),

      databaseSessionIdentity,

      postgresUrlDiagnostic,

      authorization: {
        humanAuthorizationRequired:
          true,

        header:
          MANUAL_AUTHORIZATION_HEADER,

        secretConfigured:
          getExpectedManualToken() !==
          null,

        autonomousAuthorization:
          false,
      },

      boundary: {
        technicalRuntimeTestOnly:
          true,

        getPerformsMutation:
          false,

        postPerformsTemporaryDatabaseMutation:
          true,

        createsPersistentBusinessData:
          false,

        realExternalDelivery:
          false,

        workersImplemented:
          false,

        retriesImplemented:
          false,

        webhooksImplemented:
          false,

        schedulerImplemented:
          false,

        deadLetterQueueImplemented:
          false,

        runtimeActivation:
          false,

        autonomousAuthorization:
          false,

        noSubmitFromCode:
          true,

        legalCertification:
          false,
      },
    },
    {
      status:
        200,

      headers:
        buildHeaders(
          "READY",
        ),
    },
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt =
    Date.now();

  const generatedAt =
    new Date().toISOString();

  const expectedToken =
    getExpectedManualToken();

  if (!expectedToken) {
    return NextResponse.json(
      {
        ok:
          false,

        status:
          "HBCE_RUNTIME_LEVEL_10_D001_SELF_TEST_CONFIGURATION_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        reason:
          "HBCE_LEDGER_SELF_TEST_TOKEN is missing or shorter than 16 characters.",

        selfTestExecuted:
          false,

        legalCertification:
          false,
      },
      {
        status:
          503,

        headers:
          buildHeaders(
            "FAIL_CLOSED",
          ),
      },
    );
  }

  if (
    !isAuthorized(
      request,
      expectedToken,
    )
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        status:
          "HBCE_RUNTIME_LEVEL_10_D001_SELF_TEST_UNAUTHORIZED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        selfTestExecuted:
          false,

        authorization: {
          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          accepted:
            false,
        },

        legalCertification:
          false,
      },
      {
        status:
          401,

        headers: {
          ...buildHeaders(
            "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "REJECTED",
        },
      },
    );
  }

  let databaseUrl:
    string;

  try {
    databaseUrl =
      getDatabaseUrl();
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        status:
          "HBCE_RUNTIME_LEVEL_10_D001_DATABASE_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        selfTestExecuted:
          false,

        error:
          normalizeError(
            error,
          ),

        legalCertification:
          false,
      },
      {
        status:
          503,

        headers:
          buildHeaders(
            "FAIL_CLOSED",
          ),
      },
    );
  }

  const testSuffix =
    randomUUID()
      .replaceAll(
        "-",
        "",
      )
      .toUpperCase();

  const operationId =
    `HBCE-D001-TEST-${testSuffix}`;

  const deliveryId =
    `HBCE-D001-TEST-DELIVERY-${testSuffix}`;

  const attemptId =
    `HBCE-D001-TEST-ATTEMPT-${testSuffix}`;

  const outboxId =
    `HBCE-D001-TEST-OUTBOX-${testSuffix}`;

  const tenantId =
    "HBCE-D001-TEST-TENANT";

  const workspaceId =
    "HBCE-D001-TEST-WORKSPACE";

  const subjectIpr =
    "HBCE-D001-TEST-SUBJECT";

  const idempotencyKey =
    `HBCE-D001-TEST-IDEMPOTENCY-${testSuffix}`;

  const checks:
    Check[] =
    [];

  let poolA:
    Pool | null =
    null;

  let poolB:
    Pool | null =
    null;

  let poolC:
    Pool | null =
    null;

  try {
    /*
     * ============================================================
     * POOL A
     * Fresh persistent write.
     * ============================================================
     */

    poolA =
      createPool(
        databaseUrl,
      );

    const operationInsert =
      await poolA.query(
        `
          INSERT INTO public.runtime_operations (
            operation_id,
            idempotency_key,
            tenant_id,
            workspace_id,
            human_ipr,
            runtime_ipr,
            session_id,
            workflow_kind,
            operation_status,
            checkpoint,
            recovery_status,
            attempt_count,
            recovery_count,
            max_attempts,
            state_hash,
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
            FALSE
          )
          RETURNING operation_id
        `,
        [
          operationId,
          idempotencyKey,
          tenantId,
          workspaceId,
          HUMAN_AUTHORITY_IPR,
          RUNTIME_IPR,
          `HBCE-D001-TEST-SESSION-${testSuffix}`,
          "HBCE_DURABLE_WORKFLOW",
          "NEW",
          "NEW",
          "NOT_REQUIRED",
          0,
          0,
          3,
          `sha256:${"0".repeat(
            64,
          )}`,
        ],
      );

    checks.push(
      makeCheck(
        "D001-001",
        "Synthetic runtime operation is physically inserted.",
        1,
        operationInsert.rowCount ??
          operationInsert.rows.length,
      ),
    );

    const repositoryA =
      new NeonHbceDeliveryRepository(
        asRepositoryPool(
          poolA,
        ),
      );

    const delivery =
      createHbceDeliveryRecord({
        deliveryId,
        operationId,
        outboxId,

        tenantId,
        workspaceId,
        subjectIpr,
        idempotencyKey,

        destinationType:
          "PERSISTENCE_TEST",

        destinationRef:
          "HBCE-D001-TEST-OPAQUE-DESTINATION",
      });

    const persistedDelivery =
      await repositoryA
        .createDelivery(
          delivery,
        );

    checks.push(
      makeCheck(
        "D001-002",
        "Repository createDelivery persists canonical deliveryId.",
        deliveryId,
        persistedDelivery.deliveryId,
      ),
    );

    checks.push(
      makeCheck(
        "D001-003",
        "New canonical Delivery remains PENDING.",
        "PENDING",
        persistedDelivery.status,
      ),
    );

    const attempt =
      createHbceDeliveryAttemptRecord({
        attemptId,
        deliveryId,
        attemptNumber:
          1,

        workerId:
          "D001-PERSISTENCE-TEST-HARNESS",

        leaseToken:
          `HBCE-D001-TEST-LEASE-${testSuffix}`,

        requestHash:
          `sha256:${"1".repeat(
            64,
          )}`,

        responseCode:
          null,

        responseHash:
          null,

        outcome:
          "PERSISTENCE_TEST_ONLY",

        errorClass:
          null,
      });

    const persistedAttempt =
      await repositoryA
        .createAttempt(
          attempt,
        );

    checks.push(
      makeCheck(
        "D001-004",
        "Repository createAttempt persists canonical attemptId.",
        attemptId,
        persistedAttempt.attemptId,
      ),
    );

    checks.push(
      makeCheck(
        "D001-005",
        "DeliveryAttempt number remains canonical.",
        1,
        persistedAttempt.attemptNumber,
      ),
    );

    await safeEnd(
      poolA,
    );

    poolA =
      null;

    /*
     * ============================================================
     * POOL B
     * New physical connection/pool.
     * Repository must re-read previously committed evidence.
     * ============================================================
     */

    poolB =
      createPool(
        databaseUrl,
      );

    const repositoryB =
      new NeonHbceDeliveryRepository(
        asRepositoryPool(
          poolB,
        ),
      );

    const rereadDelivery =
      await repositoryB
        .findByDeliveryId(
          deliveryId,
        );

    checks.push(
      makeCheck(
        "D001-006",
        "Fresh Pool B re-reads Delivery after Pool A closure.",
        deliveryId,
        rereadDelivery?.deliveryId ??
          null,
      ),
    );

    checks.push(
      makeCheck(
        "D001-007",
        "Fresh Pool B preserves operation binding.",
        operationId,
        rereadDelivery?.operationId ??
          null,
      ),
    );

    checks.push(
      makeCheck(
        "D001-008",
        "Fresh Pool B preserves outbox identifier.",
        outboxId,
        rereadDelivery?.outboxId ??
          null,
      ),
    );

    const attempts =
      await repositoryB
        .findAttempts(
          deliveryId,
        );

    checks.push(
      makeCheck(
        "D001-009",
        "Fresh Pool B re-reads exactly one DeliveryAttempt.",
        1,
        attempts.length,
      ),
    );

    checks.push(
      makeCheck(
        "D001-010",
        "Fresh Pool B preserves DeliveryAttempt identifier.",
        attemptId,
        attempts[0]
          ?.attemptId ??
          null,
      ),
    );

    const latestAttempt =
      await repositoryB
        .findLatestAttempt(
          deliveryId,
        );

    checks.push(
      makeCheck(
        "D001-011",
        "findLatestAttempt resolves the persisted attempt.",
        attemptId,
        latestAttempt
          ?.attemptId ??
          null,
      ),
    );

    const legalResult =
      await poolB.query<{
        delivery_legal_certification:
          boolean;

        attempt_legal_certification:
          boolean;
      }>(
        `
          SELECT
            d.legal_certification
              AS delivery_legal_certification,
            a.legal_certification
              AS attempt_legal_certification
          FROM public.runtime_deliveries d
          JOIN public.runtime_delivery_attempts a
            ON a.delivery_id = d.delivery_id
          WHERE
            d.delivery_id = $1
            AND a.attempt_id = $2
          LIMIT 1
        `,
        [
          deliveryId,
          attemptId,
        ],
      );

    checks.push(
      makeCheck(
        "D001-012",
        "Delivery physical legalCertification boundary remains false.",
        false,
        legalResult.rows[0]
          ?.delivery_legal_certification ??
          null,
      ),
    );

    checks.push(
      makeCheck(
        "D001-013",
        "DeliveryAttempt physical legalCertification boundary remains false.",
        false,
        legalResult.rows[0]
          ?.attempt_legal_certification ??
          null,
      ),
    );

    /*
     * Exercise the repository's bounded synthetic cleanup.
     */
    const cleanupResult =
      await repositoryB
        .cleanupSyntheticData();

    checks.push(
      makeCheck(
        "D001-014",
        "Repository synthetic cleanup removes the current Delivery.",
        true,
        cleanupResult.deletedDeliveries >=
          1,
      ),
    );

    checks.push(
      makeCheck(
        "D001-015",
        "Repository synthetic cleanup removes the current DeliveryAttempt.",
        true,
        cleanupResult.deletedAttempts >=
          1,
      ),
    );

    const operationDelete =
      await poolB.query(
        `
          DELETE FROM public.runtime_operations
          WHERE operation_id = $1
        `,
        [
          operationId,
        ],
      );

    checks.push(
      makeCheck(
        "D001-016",
        "Synthetic parent runtime operation is explicitly removed.",
        1,
        operationDelete.rowCount ??
          operationDelete.rows.length,
      ),
    );

    await safeEnd(
      poolB,
    );

    poolB =
      null;

    /*
     * ============================================================
     * POOL C
     * Third independent pool verifies zero persistent residue.
     * ============================================================
     */

    poolC =
      createPool(
        databaseUrl,
      );

    const residueResult =
      await poolC.query<{
        operation_rows:
          number | string;

        delivery_rows:
          number | string;

        attempt_rows:
          number | string;
      }>(
        `
          SELECT
            (
              SELECT COUNT(*)
              FROM public.runtime_operations
              WHERE operation_id = $1
            ) AS operation_rows,

            (
              SELECT COUNT(*)
              FROM public.runtime_deliveries
              WHERE delivery_id = $2
            ) AS delivery_rows,

            (
              SELECT COUNT(*)
              FROM public.runtime_delivery_attempts
              WHERE attempt_id = $3
            ) AS attempt_rows
        `,
        [
          operationId,
          deliveryId,
          attemptId,
        ],
      );

    const residue =
      residueResult.rows[0];

    checks.push(
      makeCheck(
        "D001-017",
        "Pool C finds zero synthetic runtime operation residue.",
        0,
        numericCount(
          residue
            ?.operation_rows,
        ),
      ),
    );

    checks.push(
      makeCheck(
        "D001-018",
        "Pool C finds zero synthetic Delivery residue.",
        0,
        numericCount(
          residue
            ?.delivery_rows,
        ),
      ),
    );

    checks.push(
      makeCheck(
        "D001-019",
        "Pool C finds zero synthetic DeliveryAttempt residue.",
        0,
        numericCount(
          residue
            ?.attempt_rows,
        ),
      ),
    );

    await safeEnd(
      poolC,
    );

    poolC =
      null;

    const passedChecks =
      checks.filter(
        (entry) =>
          entry.passed,
      ).length;

    const failedChecks =
      checks.length -
      passedChecks;

    const ok =
      failedChecks ===
      0;

    const durationMs =
      Math.max(
        0,
        Date.now() -
          startedAt,
      );

    return NextResponse.json(
      {
        ok,

        status:
          ok
            ? "HBCE_RUNTIME_LEVEL_10_D001_DELIVERY_PERSISTENCE_PASS"
            : "HBCE_RUNTIME_LEVEL_10_D001_DELIVERY_PERSISTENCE_FAIL",

        operationalStatus:
          ok
            ? "PASS"
            : "FAIL",

        revision:
          REVISION,

        generatedAt,

        product:
          PRODUCT,

        apiVersion:
          "v1",

        runtime:
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        deployment: {
          origin:
            getOrigin(
              request,
            ),

          runtimeEnvironment:
            process.env.NODE_ENV ??
            "unknown",

          vercelEnvironment:
            process.env.VERCEL_ENV ??
            "local",

          vercelRegion:
            process.env.VERCEL_REGION ??
            "local",

          nodeVersion:
            process.version,
        },

        execution: {
          mode:
            "D001_PERSISTENT_DELIVERY_REPOSITORY_PHYSICAL_DURABILITY",

          authorizationMode:
            "MANUAL_SECRET_REQUIRED",

          poolSequence: [
            "POOL_A_WRITE",
            "POOL_A_CLOSE",
            "POOL_B_FRESH_REREAD",
            "POOL_B_CLEANUP",
            "POOL_B_CLOSE",
            "POOL_C_ZERO_RESIDUE_VERIFY",
            "POOL_C_CLOSE",
          ],

          repository:
            "NeonHbceDeliveryRepository",
        },

        summary: {
          totalChecks:
            checks.length,

          passedChecks,

          failedChecks,

          durationMs,

          persistentSchemaApplicationVerified:
            ok,

          physicalDurabilityVerified:
            ok,

          zeroSyntheticResidue:
            checks
              .filter(
                (entry) =>
                  [
                    "D001-017",
                    "D001-018",
                    "D001-019",
                  ].includes(
                    entry.id,
                  ),
              )
              .every(
                (entry) =>
                  entry.passed,
              ),
        },

        checks,

        boundary: {
          technicalRuntimeTestOnly:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          createsTemporaryPersistentTestData:
            true,

          createsPersistentBusinessData:
            false,

          rawRequestPersistence:
            false,

          rawResponsePersistence:
            false,

          realExternalDelivery:
            false,

          workersImplemented:
            false,

          retriesImplemented:
            false,

          webhooksImplemented:
            false,

          schedulerImplemented:
            false,

          deadLetterQueueImplemented:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,
        },
      },
      {
        status:
          ok
            ? 200
            : 503,

        headers:
          buildHeaders(
            ok
              ? "PASS"
              : "FAIL",
          ),
      },
    );
  } catch (error) {
    /*
     * Close any execution pools before emergency cleanup.
     */
    await safeEnd(
      poolA,
    );

    poolA =
      null;

    await safeEnd(
      poolB,
    );

    poolB =
      null;

    await safeEnd(
      poolC,
    );

    poolC =
      null;

    const cleanup =
      await emergencyCleanup(
        databaseUrl,
        operationId,
        deliveryId,
        attemptId,
      );

    const durationMs =
      Math.max(
        0,
        Date.now() -
          startedAt,
      );

    return NextResponse.json(
      {
        ok:
          false,

        status:
          "HBCE_RUNTIME_LEVEL_10_D001_DELIVERY_PERSISTENCE_FAIL",

        operationalStatus:
          "FAIL",

        revision:
          REVISION,

        generatedAt,

        product:
          PRODUCT,

        execution: {
          mode:
            "D001_PERSISTENT_DELIVERY_REPOSITORY_PHYSICAL_DURABILITY",

          authorizationMode:
            "MANUAL_SECRET_REQUIRED",

          firstFailure:
            normalizeError(
              error,
            ),
        },

        summary: {
          totalChecks:
            checks.length,

          passedChecks:
            checks.filter(
              (entry) =>
                entry.passed,
            ).length,

          failedChecks:
            checks.filter(
              (entry) =>
                !entry.passed,
            ).length +
            1,

          durationMs,

          persistentSchemaApplicationVerified:
            false,

          physicalDurabilityVerified:
            false,
        },

        checks,

        emergencyCleanup:
          cleanup,

        boundary: {
          technicalRuntimeTestOnly:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          realExternalDelivery:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,

          passClaimAuthorized:
            false,
        },

        error:
          normalizeError(
            error,
          ),
      },
      {
        status:
          503,

        headers:
          buildHeaders(
            "FAIL",
          ),
      },
    );
  } finally {
    await safeEnd(
      poolA,
    );

    await safeEnd(
      poolB,
    );

    await safeEnd(
      poolC,
    );
  }
}

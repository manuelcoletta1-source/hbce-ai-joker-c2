import {
  queryHbceDatabaseWithoutSchemaInitialization
} from "@/lib/ipr-database";


export const IPR_AUTH_RATE_LIMIT_PHYSICAL_PROOF_BOUNDARY = {
  revision:
    "HBCE-IPR-AUTH-RATE-LIMIT-PHYSICAL-PROOF-v1_0",

  targetSchemaVersion:
    "HBCE-IPR-DB-v1.12",

  targetTable:
    "ipr_auth_rate_limit_buckets",

  queryMode:
    "NO_AUTO_SCHEMA",

  authority:
    "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_EVIDENCE_ONLY",

  databaseMutation:
    false,

  schemaMutation:
    false,

  sessionCreation:
    false,

  runtimeAuthorization:
    false,

  credentialBypass:
    false,

  rawIpRead:
    false,

  rawHumanIprRead:
    false,

  rawUserAgentRead:
    false,

  legalCertification:
    false
} as const;


const TARGET_SCHEMA_VERSION =
  IPR_AUTH_RATE_LIMIT_PHYSICAL_PROOF_BOUNDARY
    .targetSchemaVersion;

const TARGET_TABLE =
  IPR_AUTH_RATE_LIMIT_PHYSICAL_PROOF_BOUNDARY
    .targetTable;


const REQUIRED_COLUMNS = {
  bucket_key_hash: {
    dataType: "text",
    nullable: "NO"
  },
  bucket_kind: {
    dataType: "text",
    nullable: "NO"
  },
  failed_attempts: {
    dataType: "integer",
    nullable: "NO"
  },
  window_started_at: {
    dataType: "timestamp with time zone",
    nullable: "NO"
  },
  last_failed_at: {
    dataType: "timestamp with time zone",
    nullable: "YES"
  },
  blocked_until: {
    dataType: "timestamp with time zone",
    nullable: "YES"
  },
  created_at: {
    dataType: "timestamp with time zone",
    nullable: "NO"
  },
  updated_at: {
    dataType: "timestamp with time zone",
    nullable: "NO"
  },
  bucket_payload: {
    dataType: "jsonb",
    nullable: "NO"
  },
  legal_certification: {
    dataType: "boolean",
    nullable: "NO"
  }
} as const;


const REQUIRED_CHECK_CONSTRAINTS = [
  "ipr_auth_rate_limit_bucket_kind_valid",
  "ipr_auth_rate_limit_failed_attempts_non_negative",
  "ipr_auth_rate_limit_block_after_window",
  "ipr_auth_rate_limit_legal_certification_false"
] as const;


const REQUIRED_INDEXES = [
  "ipr_auth_rate_limit_buckets_blocked_until_idx",
  "ipr_auth_rate_limit_buckets_kind_updated_idx"
] as const;


type PhysicalProofCheckId =
  | "TABLE_EXISTS"
  | "V1_12_MIGRATION_RECORD_EXISTS"
  | "REQUIRED_COLUMNS_EXIST"
  | "PRIMARY_KEY_EXISTS"
  | "REQUIRED_CONSTRAINTS_EXIST"
  | "REQUIRED_INDEXES_EXIST";


export type IprAuthRateLimitPhysicalProofCheck = {
  id: PhysicalProofCheckId;
  ok: boolean;
  evidence: string[];
  error: string | null;
};


export type IprAuthRateLimitPhysicalProofResult = {
  ok: boolean;

  status:
    | "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_PROOF_PASS"
    | "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_PROOF_FAIL";

  revision:
    typeof IPR_AUTH_RATE_LIMIT_PHYSICAL_PROOF_BOUNDARY.revision;

  targetSchemaVersion:
    typeof TARGET_SCHEMA_VERSION;

  targetTable:
    typeof TARGET_TABLE;

  queryMode:
    "NO_AUTO_SCHEMA";

  checkedAt:
    string;

  checks:
    IprAuthRateLimitPhysicalProofCheck[];

  failedChecks:
    PhysicalProofCheckId[];

  authority:
    "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_EVIDENCE_ONLY";

  databaseMutation:
    false;

  schemaMutation:
    false;

  sessionCreated:
    false;

  runtimeAuthorized:
    false;

  credentialBypass:
    false;

  rawIpRead:
    false;

  rawHumanIprRead:
    false;

  rawUserAgentRead:
    false;

  legalCertification:
    false;
};


type TablePresenceRow = {
  table_name?: unknown;
};


type MigrationRow = {
  version?: unknown;
  legal_certification?: unknown;
};


type ColumnRow = {
  column_name?: unknown;
  data_type?: unknown;
  is_nullable?: unknown;
};


type ConstraintRow = {
  constraint_name?: unknown;
  constraint_type?: unknown;
  definition?: unknown;
};


type IndexRow = {
  index_name?: unknown;
  index_definition?: unknown;
};


const TABLE_PRESENCE_SQL = `
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = current_schema()
  AND table_type = 'BASE TABLE'
  AND table_name = $1
`.trim();


const MIGRATION_RECORD_SQL = `
SELECT
  version,
  legal_certification
FROM hbce_schema_migrations
WHERE version = $1
LIMIT 2
`.trim();


const COLUMN_SQL = `
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name = $1
ORDER BY ordinal_position ASC
`.trim();


const CONSTRAINT_SQL = `
SELECT
  c.conname AS constraint_name,
  c.contype AS constraint_type,
  pg_get_constraintdef(c.oid, true)
    AS definition
FROM pg_constraint c
WHERE c.conrelid = $1::regclass
ORDER BY c.conname ASC
`.trim();


const INDEX_SQL = `
SELECT
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = current_schema()
  AND tablename = $1
ORDER BY indexname ASC
`.trim();


function stringOrNull(
  value: unknown
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}


function queryFailure(
  id: PhysicalProofCheckId,
  error: unknown
): IprAuthRateLimitPhysicalProofCheck {
  return {
    id,
    ok: false,
    evidence: [],
    error:
      stringOrNull(error) ||
      "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_QUERY_FAILED"
  };
}


async function inspectTable():
  Promise<IprAuthRateLimitPhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      TablePresenceRow
    >(
      TABLE_PRESENCE_SQL,
      [
        TARGET_TABLE
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "TABLE_EXISTS",
      result.error
    );
  }

  const matches =
    result.rows.filter(
      (row) =>
        stringOrNull(
          row.table_name
        ) === TARGET_TABLE
    );

  return {
    id: "TABLE_EXISTS",
    ok: matches.length === 1,
    evidence:
      matches.length === 1
        ? [
            `table:${TARGET_TABLE}`
          ]
        : [],
    error:
      matches.length === 1
        ? null
        : "AUTH_RATE_LIMIT_TABLE_NOT_FOUND"
  };
}


async function inspectMigration():
  Promise<IprAuthRateLimitPhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      MigrationRow
    >(
      MIGRATION_RECORD_SQL,
      [
        TARGET_SCHEMA_VERSION
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "V1_12_MIGRATION_RECORD_EXISTS",
      result.error
    );
  }

  const matches =
    result.rows.filter(
      (row) =>
        stringOrNull(
          row.version
        ) === TARGET_SCHEMA_VERSION &&
        row.legal_certification === false
    );

  return {
    id:
      "V1_12_MIGRATION_RECORD_EXISTS",

    ok:
      matches.length === 1,

    evidence:
      matches.length === 1
        ? [
            `migration:${TARGET_SCHEMA_VERSION}`,
            "legalCertification:false"
          ]
        : [],

    error:
      matches.length === 1
        ? null
        : "V1_12_MIGRATION_RECORD_NOT_PROVEN"
  };
}


async function inspectColumns():
  Promise<IprAuthRateLimitPhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      ColumnRow
    >(
      COLUMN_SQL,
      [
        TARGET_TABLE
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "REQUIRED_COLUMNS_EXIST",
      result.error
    );
  }

  const actual =
    new Map<
      string,
      {
        dataType: string;
        nullable: string;
      }
    >();

  for (const row of result.rows) {
    const columnName =
      stringOrNull(
        row.column_name
      );

    const dataType =
      stringOrNull(
        row.data_type
      );

    const nullable =
      stringOrNull(
        row.is_nullable
      );

    if (
      columnName &&
      dataType &&
      nullable
    ) {
      actual.set(
        columnName,
        {
          dataType,
          nullable
        }
      );
    }
  }

  const invalid =
    Object.entries(
      REQUIRED_COLUMNS
    ).filter(
      ([
        columnName,
        expected
      ]) => {
        const found =
          actual.get(
            columnName
          );

        return (
          !found ||
          found.dataType !==
            expected.dataType ||
          found.nullable !==
            expected.nullable
        );
      }
    );

  return {
    id:
      "REQUIRED_COLUMNS_EXIST",

    ok:
      invalid.length === 0,

    evidence:
      invalid.length === 0
        ? Object.keys(
            REQUIRED_COLUMNS
          ).map(
            (columnName) =>
              `column:${columnName}`
          )
        : [],

    error:
      invalid.length === 0
        ? null
        : `AUTH_RATE_LIMIT_COLUMNS_NOT_PROVEN:${invalid
            .map(
              ([columnName]) =>
                columnName
            )
            .join(",")}`
  };
}


async function inspectPrimaryKey():
  Promise<IprAuthRateLimitPhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      ConstraintRow
    >(
      CONSTRAINT_SQL,
      [
        TARGET_TABLE
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "PRIMARY_KEY_EXISTS",
      result.error
    );
  }

  const primaryKeys =
    result.rows.filter(
      (row) =>
        stringOrNull(
          row.constraint_type
        ) === "p"
    );

  const row =
    primaryKeys.length === 1
      ? primaryKeys[0]
      : undefined;

  const definition =
    (
      stringOrNull(
        row?.definition
      ) || ""
    ).toLowerCase();

  const valid =
    primaryKeys.length === 1 &&
    definition.includes(
      "primary key"
    ) &&
    definition.includes(
      "bucket_key_hash"
    );

  return {
    id:
      "PRIMARY_KEY_EXISTS",

    ok:
      valid,

    evidence:
      valid
        ? [
            "primaryKey:bucket_key_hash"
          ]
        : [],

    error:
      valid
        ? null
        : "AUTH_RATE_LIMIT_PRIMARY_KEY_NOT_PROVEN"
  };
}


async function inspectConstraints():
  Promise<IprAuthRateLimitPhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      ConstraintRow
    >(
      CONSTRAINT_SQL,
      [
        TARGET_TABLE
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "REQUIRED_CONSTRAINTS_EXIST",
      result.error
    );
  }

  const names =
    new Set(
      result.rows
        .map(
          (row) =>
            stringOrNull(
              row.constraint_name
            )
        )
        .filter(
          (
            value
          ): value is string =>
            value !== null
        )
    );

  const missing =
    REQUIRED_CHECK_CONSTRAINTS
      .filter(
        (name) =>
          !names.has(
            name
          )
      );

  return {
    id:
      "REQUIRED_CONSTRAINTS_EXIST",

    ok:
      missing.length === 0,

    evidence:
      missing.length === 0
        ? REQUIRED_CHECK_CONSTRAINTS.map(
            (name) =>
              `constraint:${name}`
          )
        : [],

    error:
      missing.length === 0
        ? null
        : `AUTH_RATE_LIMIT_CONSTRAINTS_NOT_PROVEN:${missing.join(",")}`
  };
}


async function inspectIndexes():
  Promise<IprAuthRateLimitPhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      IndexRow
    >(
      INDEX_SQL,
      [
        TARGET_TABLE
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "REQUIRED_INDEXES_EXIST",
      result.error
    );
  }

  const names =
    new Set(
      result.rows
        .map(
          (row) =>
            stringOrNull(
              row.index_name
            )
        )
        .filter(
          (
            value
          ): value is string =>
            value !== null
        )
    );

  const missing =
    REQUIRED_INDEXES.filter(
      (name) =>
        !names.has(
          name
        )
    );

  return {
    id:
      "REQUIRED_INDEXES_EXIST",

    ok:
      missing.length === 0,

    evidence:
      missing.length === 0
        ? REQUIRED_INDEXES.map(
            (name) =>
              `index:${name}`
          )
        : [],

    error:
      missing.length === 0
        ? null
        : `AUTH_RATE_LIMIT_INDEXES_NOT_PROVEN:${missing.join(",")}`
  };
}


export async function inspectIprAuthRateLimitPhysicalSchema():
  Promise<IprAuthRateLimitPhysicalProofResult> {

  const checks:
    IprAuthRateLimitPhysicalProofCheck[] =
    [];

  const inspectors = [
    inspectTable,
    inspectMigration,
    inspectColumns,
    inspectPrimaryKey,
    inspectConstraints,
    inspectIndexes
  ] as const;

  for (const inspect of inspectors) {
    try {
      checks.push(
        await inspect()
      );
    } catch (error) {
      checks.push(
        queryFailure(
          inspectors.indexOf(inspect) === 0
            ? "TABLE_EXISTS"
            : inspectors.indexOf(inspect) === 1
              ? "V1_12_MIGRATION_RECORD_EXISTS"
              : inspectors.indexOf(inspect) === 2
                ? "REQUIRED_COLUMNS_EXIST"
                : inspectors.indexOf(inspect) === 3
                  ? "PRIMARY_KEY_EXISTS"
                  : inspectors.indexOf(inspect) === 4
                    ? "REQUIRED_CONSTRAINTS_EXIST"
                    : "REQUIRED_INDEXES_EXIST",
          error
        )
      );
    }
  }

  const failedChecks =
    checks
      .filter(
        (check) =>
          !check.ok
      )
      .map(
        (check) =>
          check.id
      );

  const ok =
    failedChecks.length === 0;

  return {
    ok,

    status:
      ok
        ? "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_PROOF_PASS"
        : "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_PROOF_FAIL",

    revision:
      IPR_AUTH_RATE_LIMIT_PHYSICAL_PROOF_BOUNDARY
        .revision,

    targetSchemaVersion:
      TARGET_SCHEMA_VERSION,

    targetTable:
      TARGET_TABLE,

    queryMode:
      "NO_AUTO_SCHEMA",

    checkedAt:
      new Date().toISOString(),

    checks,

    failedChecks,

    authority:
      "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_EVIDENCE_ONLY",

    databaseMutation:
      false,

    schemaMutation:
      false,

    sessionCreated:
      false,

    runtimeAuthorized:
      false,

    credentialBypass:
      false,

    rawIpRead:
      false,

    rawHumanIprRead:
      false,

    rawUserAgentRead:
      false,

    legalCertification:
      false
  };
}

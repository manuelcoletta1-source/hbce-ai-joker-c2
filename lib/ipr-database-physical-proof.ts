import {
  queryHbceDatabaseWithoutSchemaInitialization
} from "@/lib/ipr-database";


export const IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY = {
  revision:
    "HBCE-IPR-DATABASE-PHYSICAL-PROOF-v1_0",

  targetSchemaVersion:
    "HBCE-IPR-DB-v1.11",

  targetTable:
    "ipr_onboarding_pre_profile_policy_records",

  queryMode:
    "NO_AUTO_SCHEMA",

  authority:
    "PHYSICAL_SCHEMA_EVIDENCE_ONLY",

  databaseMutation:
    false,

  sessionCreation:
    false,

  runtimeAuthorization:
    false,

  profilePersistence:
    false,

  routeActivation:
    false,

  legalCertification:
    false
} as const;


const TARGET_SCHEMA_VERSION =
  IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY
    .targetSchemaVersion;


const TARGET_TABLE =
  IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY
    .targetTable;


const TARGET_TRIGGER =
  "trg_ipr_onboarding_pre_profile_policy_append_only";


const TARGET_FUNCTION =
  "hbce_reject_ipr_onboarding_pre_profile_policy_mutation";


const EXPECTED_FUNCTION_ERROR =
  "HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN";


const REQUIRED_CONSTRAINTS = [
  "ipr_onboarding_pre_profile_policy_record_id_sha256",
  "ipr_onboarding_pre_profile_policy_human_ipr_hash_sha256",
  "ipr_onboarding_pre_profile_policy_projection_key_sha256",
  "ipr_onboarding_pre_profile_policy_payload_hash_sha256",
  "ipr_onboarding_pre_profile_policy_issuer_credential_hash_sha256",
  "ipr_onboarding_pre_profile_policy_issuer_authorization_hash_sha256",
  "ipr_onboarding_pre_profile_policy_supersedes_hash_sha256",
  "ipr_onboarding_pre_profile_policy_revokes_hash_sha256",
  "ipr_onboarding_pre_profile_policy_scope_non_empty",
  "ipr_onboarding_pre_profile_policy_issuer_kind_non_empty",
  "ipr_onboarding_pre_profile_policy_decision_valid",
  "ipr_onboarding_pre_profile_policy_grant_all_flags_true",
  "ipr_onboarding_pre_profile_policy_non_grant_flags_false",
  "ipr_onboarding_pre_profile_policy_grant_expiry_required",
  "ipr_onboarding_pre_profile_policy_validity_window",
  "ipr_onboarding_pre_profile_policy_revoke_reference_required",
  "ipr_onboarding_pre_profile_policy_non_revoke_reference_forbidden",
  "ipr_onboarding_pre_profile_policy_genealogy_exclusive",
  "ipr_onboarding_pre_profile_policy_no_self_supersession",
  "ipr_onboarding_pre_profile_policy_no_self_revocation",
  "ipr_onboarding_pre_profile_policy_legal_certification_false"
] as const;


const SEMANTIC_CONSTRAINT_TOKENS = {
  ipr_onboarding_pre_profile_policy_decision_valid: [
    "decision",
    "grant",
    "deny",
    "revoke"
  ],

  ipr_onboarding_pre_profile_policy_grant_all_flags_true: [
    "decision",
    "grant",
    "allow_joker_c2_access",
    "verified_biological_subject",
    "matrix_active",
    "ipr_bound_memory"
  ],

  ipr_onboarding_pre_profile_policy_non_grant_flags_false: [
    "decision",
    "grant",
    "allow_joker_c2_access",
    "verified_biological_subject",
    "matrix_active",
    "ipr_bound_memory"
  ],

  ipr_onboarding_pre_profile_policy_grant_expiry_required: [
    "decision",
    "grant",
    "expires_at"
  ],

  ipr_onboarding_pre_profile_policy_validity_window: [
    "expires_at",
    "not_before",
    "issued_at"
  ],

  ipr_onboarding_pre_profile_policy_revoke_reference_required: [
    "decision",
    "revoke",
    "revokes_policy_record_id"
  ],

  ipr_onboarding_pre_profile_policy_non_revoke_reference_forbidden: [
    "decision",
    "revoke",
    "revokes_policy_record_id"
  ],

  ipr_onboarding_pre_profile_policy_genealogy_exclusive: [
    "supersedes_policy_record_id",
    "revokes_policy_record_id"
  ],

  ipr_onboarding_pre_profile_policy_no_self_supersession: [
    "supersedes_policy_record_id",
    "policy_record_id"
  ],

  ipr_onboarding_pre_profile_policy_no_self_revocation: [
    "revokes_policy_record_id",
    "policy_record_id"
  ],

  ipr_onboarding_pre_profile_policy_legal_certification_false: [
    "legal_certification",
    "false"
  ]
} as const;


type PhysicalProofCheckId =
  | "TABLE_EXISTS"
  | "V1_11_MIGRATION_RECORD_EXISTS"
  | "APPEND_ONLY_TRIGGER_EXISTS"
  | "IMMUTABILITY_FUNCTION_EXISTS"
  | "POLICY_CONSTRAINTS_EXIST";


export type IprDatabasePhysicalProofCheck = {
  id: PhysicalProofCheckId;
  ok: boolean;
  evidence: string[];
  error: string | null;
};


export type IprDatabasePhysicalProofResult = {
  ok: boolean;

  status:
    | "PHYSICAL_SCHEMA_PROOF_PASS"
    | "PHYSICAL_SCHEMA_PROOF_FAIL";

  revision:
    typeof IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY.revision;

  targetSchemaVersion:
    typeof TARGET_SCHEMA_VERSION;

  targetTable:
    typeof TARGET_TABLE;

  queryMode:
    "NO_AUTO_SCHEMA";

  checkedAt:
    string;

  checks:
    IprDatabasePhysicalProofCheck[];

  failedChecks:
    PhysicalProofCheckId[];

  authority:
    "PHYSICAL_SCHEMA_EVIDENCE_ONLY";

  databaseMutation:
    false;

  sessionCreated:
    false;

  runtimeAuthorized:
    false;

  profilePersisted:
    false;

  routeActivated:
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


type TriggerRow = {
  trigger_name?: unknown;
  trigger_enabled?: unknown;
  trigger_definition?: unknown;
};


type FunctionRow = {
  function_name?: unknown;
  language?: unknown;
  source?: unknown;
};


type ConstraintRow = {
  constraint_name?: unknown;
  definition?: unknown;
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


const TRIGGER_SQL = `
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS trigger_enabled,
  pg_get_triggerdef(t.oid, true)
    AS trigger_definition
FROM pg_trigger t
WHERE t.tgrelid = $1::regclass
  AND t.tgname = $2
  AND NOT t.tgisinternal
`.trim();


const FUNCTION_SQL = `
SELECT
  p.proname AS function_name,
  l.lanname AS language,
  p.prosrc AS source
FROM pg_proc p
JOIN pg_namespace n
  ON n.oid = p.pronamespace
JOIN pg_language l
  ON l.oid = p.prolang
WHERE n.nspname = current_schema()
  AND p.proname = $1
ORDER BY p.oid ASC
`.trim();


const CONSTRAINT_SQL = `
SELECT
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid, true)
    AS definition
FROM pg_constraint c
WHERE c.conrelid = $1::regclass
  AND c.contype = 'c'
ORDER BY c.conname ASC
`.trim();


function stringOrNull(
  value: unknown
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}


function normalizeDefinition(
  value: unknown
): string {
  return (
    stringOrNull(value) || ""
  )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


function queryFailure(
  id: PhysicalProofCheckId,
  error: unknown
): IprDatabasePhysicalProofCheck {
  return {
    id,
    ok: false,
    evidence: [],
    error:
      stringOrNull(error) ||
      "PHYSICAL_SCHEMA_QUERY_FAILED"
  };
}


async function inspectTable():
  Promise<IprDatabasePhysicalProofCheck> {

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
        stringOrNull(row.table_name) ===
        TARGET_TABLE
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
        : "TARGET_POLICY_TABLE_NOT_FOUND"
  };
}


async function inspectMigration():
  Promise<IprDatabasePhysicalProofCheck> {

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
      "V1_11_MIGRATION_RECORD_EXISTS",
      result.error
    );
  }

  const matchingRows =
    result.rows.filter(
      (row) =>
        stringOrNull(row.version) ===
          TARGET_SCHEMA_VERSION &&
        row.legal_certification === false
    );

  return {
    id:
      "V1_11_MIGRATION_RECORD_EXISTS",

    ok:
      matchingRows.length === 1,

    evidence:
      matchingRows.length === 1
        ? [
            `migration:${TARGET_SCHEMA_VERSION}`,
            "legalCertification:false"
          ]
        : [],

    error:
      matchingRows.length === 1
        ? null
        : "V1_11_MIGRATION_RECORD_NOT_PROVEN"
  };
}


async function inspectTrigger():
  Promise<IprDatabasePhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      TriggerRow
    >(
      TRIGGER_SQL,
      [
        TARGET_TABLE,
        TARGET_TRIGGER
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "APPEND_ONLY_TRIGGER_EXISTS",
      result.error
    );
  }

  const row =
    result.rows.length === 1
      ? result.rows[0]
      : undefined;

  const definition =
    normalizeDefinition(
      row?.trigger_definition
    );

  const enabled =
    stringOrNull(
      row?.trigger_enabled
    );

  const definitionValid =
    [
      "before",
      "update",
      "delete",
      TARGET_TABLE.toLowerCase(),
      TARGET_FUNCTION.toLowerCase()
    ].every(
      (token) =>
        definition.includes(token)
    );

  const valid =
    stringOrNull(
      row?.trigger_name
    ) === TARGET_TRIGGER &&
    enabled !== null &&
    enabled !== "D" &&
    definitionValid;

  return {
    id:
      "APPEND_ONLY_TRIGGER_EXISTS",

    ok:
      valid,

    evidence:
      valid
        ? [
            `trigger:${TARGET_TRIGGER}`,
            `enabled:${enabled}`,
            "events:UPDATE+DELETE",
            "timing:BEFORE"
          ]
        : [],

    error:
      valid
        ? null
        : "APPEND_ONLY_TRIGGER_NOT_PROVEN"
  };
}


async function inspectFunction():
  Promise<IprDatabasePhysicalProofCheck> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      FunctionRow
    >(
      FUNCTION_SQL,
      [
        TARGET_FUNCTION
      ]
    );

  if (!result.ok) {
    return queryFailure(
      "IMMUTABILITY_FUNCTION_EXISTS",
      result.error
    );
  }

  const rows =
    result.rows.filter(
      (row) =>
        stringOrNull(
          row.function_name
        ) === TARGET_FUNCTION
    );

  const row =
    rows.length === 1
      ? rows[0]
      : undefined;

  const source =
    stringOrNull(
      row?.source
    ) || "";

  const valid =
    rows.length === 1 &&
    stringOrNull(
      row?.language
    ) === "plpgsql" &&
    source.includes(
      EXPECTED_FUNCTION_ERROR
    );

  return {
    id:
      "IMMUTABILITY_FUNCTION_EXISTS",

    ok:
      valid,

    evidence:
      valid
        ? [
            `function:${TARGET_FUNCTION}`,
            "language:plpgsql",
            `error:${EXPECTED_FUNCTION_ERROR}`
          ]
        : [],

    error:
      valid
        ? null
        : "IMMUTABILITY_FUNCTION_NOT_PROVEN"
  };
}


function constraintDefinitionsByName(
  rows: ConstraintRow[]
): Map<string, string> {

  const definitions =
    new Map<string, string>();

  for (const row of rows) {
    const name =
      stringOrNull(
        row.constraint_name
      );

    if (!name) {
      continue;
    }

    definitions.set(
      name,
      normalizeDefinition(
        row.definition
      )
    );
  }

  return definitions;
}


function semanticConstraintIsValid(
  name:
    keyof typeof SEMANTIC_CONSTRAINT_TOKENS,
  definition: string
): boolean {

  return SEMANTIC_CONSTRAINT_TOKENS[
    name
  ].every(
    (token) =>
      definition.includes(
        token.toLowerCase()
      )
  );
}


async function inspectConstraints():
  Promise<IprDatabasePhysicalProofCheck> {

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
      "POLICY_CONSTRAINTS_EXIST",
      result.error
    );
  }

  const definitions =
    constraintDefinitionsByName(
      result.rows
    );

  const missing =
    REQUIRED_CONSTRAINTS.filter(
      (name) =>
        !definitions.has(name)
    );

  const semanticFailures =
    (
      Object.keys(
        SEMANTIC_CONSTRAINT_TOKENS
      ) as Array<
        keyof typeof SEMANTIC_CONSTRAINT_TOKENS
      >
    ).filter(
      (name) => {
        const definition =
          definitions.get(name);

        return (
          !definition ||
          !semanticConstraintIsValid(
            name,
            definition
          )
        );
      }
    );

  const valid =
    missing.length === 0 &&
    semanticFailures.length === 0;

  return {
    id:
      "POLICY_CONSTRAINTS_EXIST",

    ok:
      valid,

    evidence:
      valid
        ? [
            `constraintCount:${REQUIRED_CONSTRAINTS.length}`,
            "grantSemantics:ALL_FLAGS_TRUE",
            "nonGrantSemantics:ALL_FLAGS_FALSE",
            "grantExpiry:REQUIRED",
            "legalCertification:false"
          ]
        : [
            ...missing.map(
              (name) =>
                `missing:${name}`
            ),
            ...semanticFailures.map(
              (name) =>
                `semanticMismatch:${name}`
            )
          ],

    error:
      valid
        ? null
        : "POLICY_CONSTRAINT_SET_NOT_PROVEN"
  };
}


export async function inspectIprDatabasePhysicalSchema():
  Promise<IprDatabasePhysicalProofResult> {

  /*
   * Queste query sono intenzionalmente hardcoded.
   *
   * Questo layer non accetta SQL arbitrario e usa
   * esclusivamente il percorso NO_AUTO_SCHEMA.
   *
   * Non inizializza lo schema, non crea sessioni,
   * non persiste profili e non attribuisce
   * autorità runtime.
   */

  const checks = [
    await inspectTable(),
    await inspectMigration(),
    await inspectTrigger(),
    await inspectFunction(),
    await inspectConstraints()
  ];

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
        ? "PHYSICAL_SCHEMA_PROOF_PASS"
        : "PHYSICAL_SCHEMA_PROOF_FAIL",

    revision:
      IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY
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
      "PHYSICAL_SCHEMA_EVIDENCE_ONLY",

    databaseMutation:
      false,

    sessionCreated:
      false,

    runtimeAuthorized:
      false,

    profilePersisted:
      false,

    routeActivated:
      false,

    legalCertification:
      false
  };
}

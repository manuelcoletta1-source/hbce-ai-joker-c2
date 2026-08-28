import {
  createHash,
  createHmac,
  randomBytes
} from "node:crypto";

import type {
  QueryResultRow
} from "@neondatabase/serverless";

import {
  assertValidHumanIpr
} from "@/lib/ipr-auth";

import {
  isHbceTransactionDatabaseConfigured,
  withHbceDatabaseTransaction,
  type HbceTransactionContext
} from "@/lib/ipr-database-transaction";


export const IPR_PASSWORD_RECOVERY_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-v1_0",

  minimumSchemaVersion:
    "HBCE-IPR-DB-v1.13",

  table:
    "ipr_password_recovery_grants",

  scope:
    "PASSWORD_ROTATION",

  defaultIssuerKind:
    "HBCE_SERVER_RECOVERY_AUTHORITY",

  hashSecretEnvironmentVariable:
    "HBCE_PASSWORD_RECOVERY_HASH_SECRET",

  grantTokenBytes:
    48,

  defaultTtlSeconds:
    15 * 60,

  minimumTtlSeconds:
    60,

  maximumTtlSeconds:
    60 * 60,

  recoveryTokenHash:
    "SHA-256",

  subjectBinding:
    "HMAC-SHA256",

  issuerAuthorityBinding:
    "HMAC-SHA256",

  rawRecoveryTokenPersistence:
    false,

  rawHumanIprBindingPersistence:
    false,

  rawAuthorityReferencePersistence:
    false,

  plaintextPasswordPersistence:
    false,

  sessionCreationAuthority:
    false,

  credentialCreationAuthority:
    false,

  runtimeAuthorizationAuthority:
    false,

  automaticLoginAfterRecovery:
    false,

  authorityVerificationPerformedHere:
    false,

  requiresServerVerifiedAuthorityBeforeIssuance:
    true,

  arbitraryGrantPayloadPersistence:
    false,

  recoveryTokenLoggingAllowed:
    false,

  oneUse:
    true,

  replayProtection:
    true,

  legalCertification:
    false
} as const;


export type IprPasswordRecoveryGrantStatus =
  | "ISSUED"
  | "CONSUMED"
  | "REVOKED";


export type IprPasswordRecoveryGrantScope =
  "PASSWORD_ROTATION";


export type IssueIprPasswordRecoveryGrantInput = {
  humanIpr:
    string;

  issuerAuthorityRef:
    string;

  issuerKind?:
    string;

  ttlSeconds?:
    number;

  notBefore?:
    string;
};


export type IssuedIprPasswordRecoveryGrant = {
  recoveryToken:
    string;

  scope:
    IprPasswordRecoveryGrantScope;

  issuerKind:
    string;

  issuedAt:
    string;

  notBefore:
    string;

  expiresAt:
    string;

  ttlSeconds:
    number;

  oneUse:
    true;

  legalCertification:
    false;
};


export type LockIprPasswordRecoveryGrantInput = {
  humanIpr:
    string;

  recoveryToken:
    string;
};


export type LockedIprPasswordRecoveryGrant = {
  grantHash:
    string;

  humanIprHash:
    string;

  scope:
    IprPasswordRecoveryGrantScope;

  status:
    "ISSUED";

  issuedAt:
    string;

  notBefore:
    string;

  expiresAt:
    string;

  issuerKind:
    string;

  issuerAuthorityRefHash:
    string;

  legalCertification:
    false;
};


export type ConsumedIprPasswordRecoveryGrant = {
  grantHash:
    string;

  status:
    "CONSUMED";

  consumedAt:
    string;

  legalCertification:
    false;
};


type IprPasswordRecoveryGrantRow =
  QueryResultRow & {
    grant_hash?: unknown;
    human_ipr_hash?: unknown;
    scope?: unknown;
    status?: unknown;
    issued_at?: unknown;
    not_before?: unknown;
    expires_at?: unknown;
    consumed_at?: unknown;
    revoked_at?: unknown;
    issuer_kind?: unknown;
    issuer_authority_ref_hash?: unknown;
    legal_certification?: unknown;
  };


const RECOVERY_HASH_DOMAIN =
  "HBCE_IPR_PASSWORD_RECOVERY";


function stringOrNull(
  value: unknown
): string | null {
  return (
    typeof value === "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
}


function requireString(
  value: unknown,
  errorCode: string
): string {
  const normalized =
    stringOrNull(
      value
    );

  if (!normalized) {
    throw new Error(
      errorCode
    );
  }

  return normalized;
}


function requireHashSecret():
  string {

  const secret =
    (
      process.env
        .HBCE_PASSWORD_RECOVERY_HASH_SECRET ||
      ""
    ).trim();

  if (
    Buffer.byteLength(
      secret,
      "utf8"
    ) < 32
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_HASH_SECRET_REQUIRED"
    );
  }

  return secret;
}


function normalizeIssuerKind(
  value:
    string | undefined
): string {

  const issuerKind =
    (
      value ||
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .defaultIssuerKind
    )
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z0-9:_-]{3,80}$/
      .test(
        issuerKind
      )
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_INVALID_ISSUER_KIND"
    );
  }

  return issuerKind;
}


function normalizeTtlSeconds(
  value:
    number | undefined
): number {

  const fallback =
    IPR_PASSWORD_RECOVERY_BOUNDARY
      .defaultTtlSeconds;

  const candidate =
    typeof value === "number" &&
    Number.isFinite(value)
      ? Math.floor(value)
      : fallback;

  if (
    candidate <
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .minimumTtlSeconds ||
    candidate >
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .maximumTtlSeconds
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_INVALID_TTL"
    );
  }

  return candidate;
}


function normalizeIsoDate(
  value:
    string | undefined,
  fallback:
    Date,
  errorCode:
    string
): string {

  if (
    value === undefined
  ) {
    return fallback.toISOString();
  }

  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      errorCode
    );
  }

  const parsed =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      errorCode
    );
  }

  return parsed.toISOString();
}


function toIso(
  value:
    unknown,
  errorCode:
    string
): string {

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  const normalized =
    requireString(
      value,
      errorCode
    );

  const parsed =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      errorCode
    );
  }

  return parsed.toISOString();
}


function base64Url(
  value:
    Buffer
): string {

  return value
    .toString(
      "base64"
    )
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/g,
      ""
    );
}


function sha256Hex(
  value:
    string
): string {

  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function hmacSha256Hex(
  purpose:
    string,
  value:
    string
): string {

  const secret =
    requireHashSecret();

  return createHmac(
    "sha256",
    secret
  )
    .update(
      [
        RECOVERY_HASH_DOMAIN,
        purpose,
        value
      ].join(
        "\0"
      ),
      "utf8"
    )
    .digest(
      "hex"
    );
}


export function deriveIprPasswordRecoveryGrantHash(
  recoveryToken:
    string
): string {

  const token =
    requireString(
      recoveryToken,
      "HBCE_PASSWORD_RECOVERY_TOKEN_REQUIRED"
    );

  return sha256Hex(
    token
  );
}


export function deriveIprPasswordRecoverySubjectHash(
  humanIpr:
    string
): string {

  const normalized =
    assertValidHumanIpr(
      humanIpr
    );

  return hmacSha256Hex(
    "SUBJECT",
    normalized
  );
}


export function deriveIprPasswordRecoveryAuthorityHash(
  issuerAuthorityRef:
    string
): string {

  const normalized =
    requireString(
      issuerAuthorityRef,
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_REF_REQUIRED"
    );

  return hmacSha256Hex(
    "AUTHORITY_REF",
    normalized
  );
}


function generateRecoveryToken():
  string {

  return base64Url(
    randomBytes(
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .grantTokenBytes
    )
  );
}


export function describeIprPasswordRecoveryStore() {
  const hashSecret =
    (
      process.env
        .HBCE_PASSWORD_RECOVERY_HASH_SECRET ||
      ""
    ).trim();

  return {
    revision:
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .revision,

    minimumSchemaVersion:
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .minimumSchemaVersion,

    table:
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .table,

    databaseConfigured:
      isHbceTransactionDatabaseConfigured(),

    hashSecretConfigured:
      Buffer.byteLength(
        hashSecret,
        "utf8"
      ) >= 32,

    persistenceMode:
      "DATABASE_PERSISTENT",

    transactionRequirement:
      "SERIALIZABLE",

    oneUse:
      true,

    replayProtection:
      true,

    sessionCreationAuthority:
      false,

    credentialCreationAuthority:
      false,

    runtimeAuthorizationAuthority:
      false,

    automaticLoginAfterRecovery:
      false,

    authorityVerificationPerformedHere:
      false,

    requiresServerVerifiedAuthorityBeforeIssuance:
      true,

    arbitraryGrantPayloadPersistence:
      false,

    recoveryTokenLoggingAllowed:
      false,

    legalCertification:
      false
  } as const;
}


const REVOKE_PRIOR_GRANTS_SQL = `
UPDATE ipr_password_recovery_grants
SET
  status =
    'REVOKED',

  revoked_at =
    now(),

  legal_certification =
    false

WHERE
  human_ipr_hash = $1
  AND scope =
    'PASSWORD_ROTATION'
  AND status =
    'ISSUED'
  AND consumed_at IS NULL
  AND revoked_at IS NULL
`.trim();


const INSERT_GRANT_SQL = `
INSERT INTO ipr_password_recovery_grants (
  grant_hash,
  human_ipr_hash,
  scope,
  status,
  issued_at,
  not_before,
  expires_at,
  consumed_at,
  revoked_at,
  issuer_kind,
  issuer_authority_ref_hash,
  grant_payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  'PASSWORD_ROTATION',
  'ISSUED',
  $3::timestamptz,
  $4::timestamptz,
  $5::timestamptz,
  NULL,
  NULL,
  $6,
  $7,
  $8::jsonb,
  false
)
RETURNING
  issued_at::text
    AS issued_at,
  not_before::text
    AS not_before,
  expires_at::text
    AS expires_at,
  issuer_kind,
  legal_certification
`.trim();


const LOCK_GRANT_SQL = `
SELECT
  grant_hash,
  human_ipr_hash,
  scope,
  status,
  issued_at::text
    AS issued_at,
  not_before::text
    AS not_before,
  expires_at::text
    AS expires_at,
  consumed_at::text
    AS consumed_at,
  revoked_at::text
    AS revoked_at,
  issuer_kind,
  issuer_authority_ref_hash,
  legal_certification
FROM ipr_password_recovery_grants
WHERE
  grant_hash = $1
  AND human_ipr_hash = $2
  AND scope =
    'PASSWORD_ROTATION'
LIMIT 1
FOR UPDATE
`.trim();


const CONSUME_GRANT_SQL = `
UPDATE ipr_password_recovery_grants
SET
  status =
    'CONSUMED',

  consumed_at =
    now(),

  legal_certification =
    false

WHERE
  grant_hash = $1
  AND human_ipr_hash = $2
  AND status =
    'ISSUED'
  AND scope =
    'PASSWORD_ROTATION'
  AND consumed_at IS NULL
  AND revoked_at IS NULL
  AND not_before <= now()
  AND expires_at > now()

RETURNING
  grant_hash,
  status,
  consumed_at::text
    AS consumed_at,
  legal_certification
`.trim();


export async function issueIprPasswordRecoveryGrant(
  input:
    IssueIprPasswordRecoveryGrantInput
): Promise<
  IssuedIprPasswordRecoveryGrant
> {

  /*
   * Fail closed before opening a transaction.
   */
  requireHashSecret();

  if (
    !isHbceTransactionDatabaseConfigured()
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_DATABASE_NOT_CONFIGURED"
    );
  }

  const humanIpr =
    assertValidHumanIpr(
      input.humanIpr
    );

  const humanIprHash =
    deriveIprPasswordRecoverySubjectHash(
      humanIpr
    );

  const issuerAuthorityRefHash =
    deriveIprPasswordRecoveryAuthorityHash(
      input.issuerAuthorityRef
    );

  const issuerKind =
    normalizeIssuerKind(
      input.issuerKind
    );

  const ttlSeconds =
    normalizeTtlSeconds(
      input.ttlSeconds
    );

  const issuedAtDate =
    new Date();

  const issuedAt =
    issuedAtDate.toISOString();

  const notBefore =
    normalizeIsoDate(
      input.notBefore,
      issuedAtDate,
      "HBCE_PASSWORD_RECOVERY_INVALID_NOT_BEFORE"
    );

  const expiresAtDate =
    new Date(
      issuedAtDate.getTime() +
      (
        ttlSeconds *
        1000
      )
    );

  const notBeforeMs =
    Date.parse(
      notBefore
    );

  if (
    !Number.isFinite(
      notBeforeMs
    ) ||
    notBeforeMs >=
      expiresAtDate.getTime()
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_NOT_BEFORE_OUTSIDE_GRANT_WINDOW"
    );
  }

  const expiresAt =
    expiresAtDate.toISOString();

  const recoveryToken =
    generateRecoveryToken();

  const grantHash =
    deriveIprPasswordRecoveryGrantHash(
      recoveryToken
    );

  const payload =
    JSON.stringify({
      revision:
        IPR_PASSWORD_RECOVERY_BOUNDARY
          .revision,

      scope:
        IPR_PASSWORD_RECOVERY_BOUNDARY
          .scope,

      oneUse:
        true,

      replayProtection:
        true,

      rawRecoveryTokenPersisted:
        false,

      rawHumanIprBindingPersisted:
        false,

      rawAuthorityReferencePersisted:
        false,

      sessionCreationAuthority:
        false,

      credentialCreationAuthority:
        false,

      runtimeAuthorizationAuthority:
        false,

      authorityVerificationPerformedHere:
        false,

      requiresServerVerifiedAuthorityBeforeIssuance:
        true,

      arbitraryGrantPayloadPersistence:
        false,

      recoveryTokenLoggingAllowed:
        false,

      legalCertification:
        false
    });

  const transaction =
    await withHbceDatabaseTransaction(
      async ({
        query
      }) => {

        await query(
          REVOKE_PRIOR_GRANTS_SQL,
          [
            humanIprHash
          ]
        );

        const inserted =
          await query<
            IprPasswordRecoveryGrantRow
          >(
            INSERT_GRANT_SQL,
            [
              grantHash,
              humanIprHash,
              issuedAt,
              notBefore,
              expiresAt,
              issuerKind,
              issuerAuthorityRefHash,
              payload
            ]
          );

        if (
          inserted.rowCount !== 1 ||
          !inserted.rows[0]
        ) {
          throw new Error(
            "HBCE_PASSWORD_RECOVERY_GRANT_INSERT_FAILED"
          );
        }

        const row =
          inserted.rows[0];

        if (
          row.legal_certification !==
          false
        ) {
          throw new Error(
            "HBCE_PASSWORD_RECOVERY_LEGAL_CERTIFICATION_BOUNDARY_VIOLATED"
          );
        }

        return {
          issuedAt:
            toIso(
              row.issued_at,
              "HBCE_PASSWORD_RECOVERY_INVALID_ISSUED_AT"
            ),

          notBefore:
            toIso(
              row.not_before,
              "HBCE_PASSWORD_RECOVERY_INVALID_NOT_BEFORE"
            ),

          expiresAt:
            toIso(
              row.expires_at,
              "HBCE_PASSWORD_RECOVERY_INVALID_EXPIRES_AT"
            ),

          issuerKind:
            requireString(
              row.issuer_kind,
              "HBCE_PASSWORD_RECOVERY_INVALID_ISSUER_KIND"
            )
        };
      },
      {
        isolationLevel:
          "SERIALIZABLE",

        readOnly:
          false,

        statementTimeoutMs:
          30_000,

        lockTimeoutMs:
          10_000,

        idleInTransactionSessionTimeoutMs:
          30_000
      }
    );

  if (!transaction.ok) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_ISSUE_FAILED"
    );
  }

  return {
    recoveryToken,

    scope:
      "PASSWORD_ROTATION",

    issuerKind:
      transaction.value
        .issuerKind,

    issuedAt:
      transaction.value
        .issuedAt,

    notBefore:
      transaction.value
        .notBefore,

    expiresAt:
      transaction.value
        .expiresAt,

    ttlSeconds,

    oneUse:
      true,

    legalCertification:
      false
  };
}


export async function lockValidIprPasswordRecoveryGrant(
  transaction:
    HbceTransactionContext,
  input:
    LockIprPasswordRecoveryGrantInput
): Promise<
  LockedIprPasswordRecoveryGrant
> {

  const grantHash =
    deriveIprPasswordRecoveryGrantHash(
      input.recoveryToken
    );

  const humanIprHash =
    deriveIprPasswordRecoverySubjectHash(
      input.humanIpr
    );

  const result =
    await transaction.query<
      IprPasswordRecoveryGrantRow
    >(
      LOCK_GRANT_SQL,
      [
        grantHash,
        humanIprHash
      ]
    );

  if (
    result.rowCount !== 1 ||
    !result.rows[0]
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );
  }

  const row =
    result.rows[0];

  if (
    row.legal_certification !==
    false
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );
  }

  if (
    row.scope !==
      "PASSWORD_ROTATION" ||
    row.status !==
      "ISSUED" ||
    row.consumed_at !==
      null ||
    row.revoked_at !==
      null
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );
  }

  const notBefore =
    toIso(
      row.not_before,
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );

  const expiresAt =
    toIso(
      row.expires_at,
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );

  const now =
    Date.now();

  if (
    Date.parse(
      notBefore
    ) > now ||
    Date.parse(
      expiresAt
    ) <= now
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );
  }

  return {
    grantHash:
      requireString(
        row.grant_hash,
        "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
      ),

    humanIprHash:
      requireString(
        row.human_ipr_hash,
        "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
      ),

    scope:
      "PASSWORD_ROTATION",

    status:
      "ISSUED",

    issuedAt:
      toIso(
        row.issued_at,
        "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
      ),

    notBefore,

    expiresAt,

    issuerKind:
      requireString(
        row.issuer_kind,
        "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
      ),

    issuerAuthorityRefHash:
      requireString(
        row.issuer_authority_ref_hash,
        "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
      ),

    legalCertification:
      false
  };
}


export async function consumeLockedIprPasswordRecoveryGrant(
  transaction:
    HbceTransactionContext,
  grant:
    LockedIprPasswordRecoveryGrant
): Promise<
  ConsumedIprPasswordRecoveryGrant
> {

  if (
    grant.status !==
      "ISSUED" ||
    grant.scope !==
      "PASSWORD_ROTATION" ||
    grant.legalCertification !==
      false
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
    );
  }

  const result =
    await transaction.query<
      IprPasswordRecoveryGrantRow
    >(
      CONSUME_GRANT_SQL,
      [
        grant.grantHash,
        grant.humanIprHash
      ]
    );

  if (
    result.rowCount !== 1 ||
    !result.rows[0]
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_CONSUME_FAILED"
    );
  }

  const row =
    result.rows[0];

  if (
    row.status !==
      "CONSUMED" ||
    row.legal_certification !==
      false
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GRANT_CONSUME_FAILED"
    );
  }

  return {
    grantHash:
      requireString(
        row.grant_hash,
        "HBCE_PASSWORD_RECOVERY_GRANT_CONSUME_FAILED"
      ),

    status:
      "CONSUMED",

    consumedAt:
      toIso(
        row.consumed_at,
        "HBCE_PASSWORD_RECOVERY_GRANT_CONSUME_FAILED"
      ),

    legalCertification:
      false
  };
}

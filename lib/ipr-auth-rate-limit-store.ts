import {
  createHmac
} from "node:crypto";

import {
  isIP
} from "node:net";

import {
  normalizeHumanIpr
} from "@/lib/ipr-auth";

import {
  queryHbceDatabaseWithoutSchemaInitialization,
  type HbceDatabaseQueryRow
} from "@/lib/ipr-database";

import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext
} from "@/lib/ipr-database-transaction";


export const IPR_AUTH_RATE_LIMIT_BOUNDARY = {
  revision:
    "HBCE-IPR-AUTH-RATE-LIMIT-v1_0",

  schemaVersion:
    "HBCE-IPR-DB-v1.12",

  table:
    "ipr_auth_rate_limit_buckets",

  hashSecretEnvironmentVariable:
    "HBCE_AUTH_RATE_LIMIT_HASH_SECRET",

  keyDerivation:
    "HMAC-SHA256",

  ipPolicy: {
    maxFailedAttempts: 20,
    windowSeconds: 15 * 60,
    blockSeconds: 15 * 60
  },

  iprIpPolicy: {
    maxFailedAttempts: 5,
    windowSeconds: 15 * 60,
    blockSeconds: 15 * 60
  },

  retentionPolicy: {
    staleAfterSeconds:
      24 * 60 * 60,

    maximumBucketsPerRun:
      500,

    automaticPruning:
      false,

    pruningMode:
      "EXPLICIT_MAINTENANCE_ONLY"
  },

  globalIpResetOnSuccessfulLogin:
    false,

  iprIpResetOnSuccessfulLogin:
    true,

  rawIpPersistence:
    false,

  rawHumanIprPersistence:
    false,

  rawUserAgentPersistence:
    false,

  sessionCreationAuthority:
    false,

  runtimeAuthorizationAuthority:
    false,

  credentialBypassAuthority:
    false,

  legalCertification:
    false
} as const;


export type IprAuthRateLimitBucketKind =
  | "IP"
  | "IPR_IP";


type RateLimitPolicy = {
  maxFailedAttempts: number;
  windowSeconds: number;
  blockSeconds: number;
};


type IprAuthRateLimitBucketRow =
  HbceDatabaseQueryRow & {
    bucket_kind?: unknown;
    failed_attempts?: unknown;
    window_started_at?: unknown;
    last_failed_at?: unknown;
    blocked_until?: unknown;
    legal_certification?: unknown;
  };


export type IprAuthRateLimitBucketState = {
  bucketKind:
    IprAuthRateLimitBucketKind;

  failedAttempts:
    number;

  windowStartedAt:
    string | null;

  lastFailedAt:
    string | null;

  blockedUntil:
    string | null;

  currentlyBlocked:
    boolean;

  legalCertification:
    false;
};


export type IprAuthRateLimitPruneResult = {
  deletedBuckets:
    number;

  staleAfterSeconds:
    number;

  maximumBucketsPerRun:
    number;

  legalCertification:
    false;
};


export type IprAuthRateLimitRetentionPreflightResult = {
  eligibleBuckets:
    number;

  staleAfterSeconds:
    number;

  databaseReadOnly:
    true;

  legalCertification:
    false;
};


export type IprAuthRateLimitRequestState = {
  blocked:
    boolean;

  blockedKinds:
    IprAuthRateLimitBucketKind[];

  blockedUntil:
    string | null;

  ip:
    IprAuthRateLimitBucketState | null;

  iprIp:
    IprAuthRateLimitBucketState | null;

  legalCertification:
    false;
};


type BucketKeys = {
  ip:
    string;

  iprIp:
    string;
};


function stringOrNull(
  value: unknown
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}


function integerOrZero(
  value: unknown
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return Math.floor(parsed);
}


function normalizeClientIp(
  value: string
): string | null {
  const candidate =
    value.trim();

  if (!candidate) {
    return null;
  }

  if (isIP(candidate) === 0) {
    return null;
  }

  return candidate.toLowerCase();
}


export function resolveIprAuthRateLimitClientIp(
  headers: Headers
): string | null {
  /*
   * Production trust boundary:
   * Vercel-managed x-forwarded-for.
   *
   * x-real-ip is accepted only outside production
   * as a development fallback.
   */

  const forwardedFor =
    headers.get(
      "x-forwarded-for"
    ) || "";

  const firstForwardedIp =
    forwardedFor
      .split(",")
      .map(
        (value) =>
          value.trim()
      )
      .filter(Boolean)[0] ||
    "";

  const normalizedForwarded =
    normalizeClientIp(
      firstForwardedIp
    );

  if (normalizedForwarded) {
    return normalizedForwarded;
  }

  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    const realIp =
      headers.get(
        "x-real-ip"
      ) || "";

    return normalizeClientIp(
      realIp
    );
  }

  return null;
}


function requireHashSecret():
  string {

  const secret =
    (
      process.env
        .HBCE_AUTH_RATE_LIMIT_HASH_SECRET ||
      ""
    ).trim();

  if (
    Buffer.byteLength(
      secret,
      "utf8"
    ) < 32
  ) {
    throw new Error(
      "HBCE_AUTH_RATE_LIMIT_HASH_SECRET_REQUIRED"
    );
  }

  return secret;
}


function hmacBucketKey(
  payload: string
): string {
  const secret =
    requireHashSecret();

  return (
    "hmac-sha256:" +
    createHmac(
      "sha256",
      secret
    )
      .update(
        payload,
        "utf8"
      )
      .digest(
        "hex"
      )
  );
}


function deriveBucketKeys(
  input: {
    humanIpr: string;
    clientIp: string;
  }
): BucketKeys {

  const humanIpr =
    normalizeHumanIpr(
      input.humanIpr
    );

  const clientIp =
    normalizeClientIp(
      input.clientIp
    );

  if (!humanIpr) {
    throw new Error(
      "HBCE_AUTH_RATE_LIMIT_HUMAN_IPR_REQUIRED"
    );
  }

  if (!clientIp) {
    throw new Error(
      "HBCE_AUTH_RATE_LIMIT_CLIENT_IP_REQUIRED"
    );
  }

  return {
    ip:
      hmacBucketKey(
        [
          "HBCE_C5X",
          "IP",
          clientIp
        ].join("\0")
      ),

    iprIp:
      hmacBucketKey(
        [
          "HBCE_C5X",
          "IPR_IP",
          humanIpr,
          clientIp
        ].join("\0")
      )
  };
}


function getPolicy(
  bucketKind:
    IprAuthRateLimitBucketKind
): RateLimitPolicy {

  if (bucketKind === "IP") {
    return {
      ...IPR_AUTH_RATE_LIMIT_BOUNDARY
        .ipPolicy
    };
  }

  return {
    ...IPR_AUTH_RATE_LIMIT_BOUNDARY
      .iprIpPolicy
  };
}


function bucketStateFromRow(
  row:
    IprAuthRateLimitBucketRow | undefined,
  expectedKind:
    IprAuthRateLimitBucketKind
): IprAuthRateLimitBucketState | null {

  if (!row) {
    return null;
  }

  const bucketKind =
    stringOrNull(
      row.bucket_kind
    );

  if (
    bucketKind !==
    expectedKind
  ) {
    throw new Error(
      "HBCE_AUTH_RATE_LIMIT_BUCKET_KIND_MISMATCH"
    );
  }

  if (
    row.legal_certification !==
    false
  ) {
    throw new Error(
      "HBCE_AUTH_RATE_LIMIT_LEGAL_CERTIFICATION_BOUNDARY_VIOLATED"
    );
  }

  const blockedUntil =
    stringOrNull(
      row.blocked_until
    );

  const blockedUntilMs =
    blockedUntil
      ? Date.parse(
          blockedUntil
        )
      : Number.NaN;

  return {
    bucketKind:
      expectedKind,

    failedAttempts:
      integerOrZero(
        row.failed_attempts
      ),

    windowStartedAt:
      stringOrNull(
        row.window_started_at
      ),

    lastFailedAt:
      stringOrNull(
        row.last_failed_at
      ),

    blockedUntil,

    currentlyBlocked:
      Number.isFinite(
        blockedUntilMs
      ) &&
      blockedUntilMs >
        Date.now(),

    legalCertification:
      false
  };
}


const READ_BUCKET_SQL = `
SELECT
  bucket_kind,
  failed_attempts,
  window_started_at::text
    AS window_started_at,
  last_failed_at::text
    AS last_failed_at,
  blocked_until::text
    AS blocked_until,
  legal_certification
FROM ipr_auth_rate_limit_buckets
WHERE bucket_key_hash = $1
  AND bucket_kind = $2
LIMIT 1
`.trim();


async function readBucket(
  bucketKeyHash: string,
  bucketKind:
    IprAuthRateLimitBucketKind
): Promise<
  IprAuthRateLimitBucketState | null
> {

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      IprAuthRateLimitBucketRow
    >(
      READ_BUCKET_SQL,
      [
        bucketKeyHash,
        bucketKind
      ]
    );

  if (!result.ok) {
    throw new Error(
      result.error ||
      "HBCE_AUTH_RATE_LIMIT_BUCKET_READ_FAILED"
    );
  }

  return bucketStateFromRow(
    result.rows[0],
    bucketKind
  );
}


const UPSERT_FAILURE_SQL = `
INSERT INTO ipr_auth_rate_limit_buckets (
  bucket_key_hash,
  bucket_kind,
  failed_attempts,
  window_started_at,
  last_failed_at,
  blocked_until,
  bucket_payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  1,
  now(),
  now(),
  CASE
    WHEN 1 >= $3::integer
    THEN
      now() +
      (
        $5::integer *
        INTERVAL '1 second'
      )
    ELSE NULL
  END,
  jsonb_build_object(
    'revision',
      'HBCE-IPR-AUTH-RATE-LIMIT-v1_0',
    'bucketKind',
      $2::text,
    'maxFailedAttempts',
      $3::integer,
    'windowSeconds',
      $4::integer,
    'blockSeconds',
      $5::integer,
    'rawIpPersisted',
      false,
    'rawHumanIprPersisted',
      false,
    'rawUserAgentPersisted',
      false,
    'legalCertification',
      false
  ),
  false
)
ON CONFLICT (
  bucket_key_hash
)
DO UPDATE
SET
  failed_attempts =
    CASE
      WHEN
        ipr_auth_rate_limit_buckets
          .blocked_until
          IS NOT NULL
        AND
        ipr_auth_rate_limit_buckets
          .blocked_until >
          now()
      THEN
        ipr_auth_rate_limit_buckets
          .failed_attempts

      WHEN
        ipr_auth_rate_limit_buckets
          .blocked_until
          IS NOT NULL
        AND
        ipr_auth_rate_limit_buckets
          .blocked_until <=
          now()
      THEN 1

      WHEN
        ipr_auth_rate_limit_buckets
          .window_started_at +
        (
          $4::integer *
          INTERVAL '1 second'
        ) <= now()
      THEN 1

      ELSE
        ipr_auth_rate_limit_buckets
          .failed_attempts + 1
    END,

  window_started_at =
    CASE
      WHEN
        ipr_auth_rate_limit_buckets
          .blocked_until
          IS NOT NULL
        AND
        ipr_auth_rate_limit_buckets
          .blocked_until >
          now()
      THEN
        ipr_auth_rate_limit_buckets
          .window_started_at

      WHEN
        ipr_auth_rate_limit_buckets
          .blocked_until
          IS NOT NULL
        AND
        ipr_auth_rate_limit_buckets
          .blocked_until <=
          now()
      THEN now()

      WHEN
        ipr_auth_rate_limit_buckets
          .window_started_at +
        (
          $4::integer *
          INTERVAL '1 second'
        ) <= now()
      THEN now()

      ELSE
        ipr_auth_rate_limit_buckets
          .window_started_at
    END,

  last_failed_at =
    now(),

  blocked_until =
    CASE
      WHEN
        ipr_auth_rate_limit_buckets
          .blocked_until
          IS NOT NULL
        AND
        ipr_auth_rate_limit_buckets
          .blocked_until >
          now()
      THEN
        ipr_auth_rate_limit_buckets
          .blocked_until

      WHEN (
        CASE
          WHEN
            ipr_auth_rate_limit_buckets
              .blocked_until
              IS NOT NULL
            AND
            ipr_auth_rate_limit_buckets
              .blocked_until <=
              now()
          THEN 1

          WHEN
            ipr_auth_rate_limit_buckets
              .window_started_at +
            (
              $4::integer *
              INTERVAL '1 second'
            ) <= now()
          THEN 1

          ELSE
            ipr_auth_rate_limit_buckets
              .failed_attempts + 1
        END
      ) >= $3::integer
      THEN
        now() +
        (
          $5::integer *
          INTERVAL '1 second'
        )

      ELSE NULL
    END,

  updated_at =
    now(),

  bucket_payload =
    EXCLUDED.bucket_payload,

  legal_certification =
    false

WHERE
  ipr_auth_rate_limit_buckets
    .bucket_kind =
  EXCLUDED.bucket_kind

RETURNING
  bucket_kind,
  failed_attempts,
  window_started_at::text
    AS window_started_at,
  last_failed_at::text
    AS last_failed_at,
  blocked_until::text
    AS blocked_until,
  legal_certification
`.trim();


async function recordBucketFailure(
  context:
    HbceTransactionContext,
  bucketKeyHash:
    string,
  bucketKind:
    IprAuthRateLimitBucketKind
): Promise<
  IprAuthRateLimitBucketState
> {

  const policy =
    getPolicy(
      bucketKind
    );

  const result =
    await context.query(
      UPSERT_FAILURE_SQL,
      [
        bucketKeyHash,
        bucketKind,
        policy.maxFailedAttempts,
        policy.windowSeconds,
        policy.blockSeconds
      ]
    );

  const row =
    result.rows[0] as
      | IprAuthRateLimitBucketRow
      | undefined;

  const state =
    bucketStateFromRow(
      row,
      bucketKind
    );

  if (!state) {
    throw new Error(
      "HBCE_AUTH_RATE_LIMIT_BUCKET_WRITE_NOT_PROVEN"
    );
  }

  return state;
}


const RESET_IPR_IP_SQL = `
UPDATE ipr_auth_rate_limit_buckets
SET
  failed_attempts = 0,
  window_started_at = now(),
  last_failed_at = NULL,
  blocked_until = NULL,
  updated_at = now(),
  bucket_payload =
    jsonb_build_object(
      'revision',
        'HBCE-IPR-AUTH-RATE-LIMIT-v1_0',
      'bucketKind',
        'IPR_IP',
      'resetReason',
        'VALID_AUTHENTICATION',
      'rawIpPersisted',
        false,
      'rawHumanIprPersisted',
        false,
      'rawUserAgentPersisted',
        false,
      'legalCertification',
        false
    ),
  legal_certification = false
WHERE
  bucket_key_hash = $1
  AND bucket_kind = 'IPR_IP'
RETURNING
  bucket_kind,
  failed_attempts,
  window_started_at::text
    AS window_started_at,
  last_failed_at::text
    AS last_failed_at,
  blocked_until::text
    AS blocked_until,
  legal_certification
`.trim();


function latestBlockedUntil(
  states:
    Array<
      IprAuthRateLimitBucketState | null
    >
): string | null {

  const candidates =
    states
      .filter(
        (
          state
        ): state is
          IprAuthRateLimitBucketState =>
          Boolean(
            state?.currentlyBlocked &&
            state.blockedUntil
          )
      )
      .map(
        (state) =>
          state.blockedUntil!
      )
      .sort(
        (a, b) =>
          Date.parse(b) -
          Date.parse(a)
      );

  return candidates[0] || null;
}


const RETENTION_PREFLIGHT_SQL = `
SELECT
  COUNT(*)::integer AS eligible_buckets
FROM ipr_auth_rate_limit_buckets
WHERE
  updated_at <=
    now() -
    (
      $1::integer *
      INTERVAL '1 second'
    )
  AND (
    blocked_until IS NULL
    OR blocked_until <= now()
  )
  AND legal_certification = false
`.trim();


const PRUNE_STALE_BUCKETS_SQL = `
WITH candidates AS (
  SELECT
    bucket_key_hash
  FROM ipr_auth_rate_limit_buckets
  WHERE
    updated_at <=
      now() -
      (
        $1::integer *
        INTERVAL '1 second'
      )
    AND (
      blocked_until IS NULL
      OR blocked_until <= now()
    )
    AND legal_certification = false
  ORDER BY
    updated_at ASC,
    bucket_key_hash ASC
  LIMIT $2::integer
  FOR UPDATE SKIP LOCKED
)
DELETE FROM ipr_auth_rate_limit_buckets AS buckets
USING candidates
WHERE
  buckets.bucket_key_hash =
    candidates.bucket_key_hash
RETURNING
  buckets.bucket_kind
`.trim();


export class PersistentIprAuthRateLimitStore {

  async inspectAsync(
    input: {
      humanIpr: string;
      clientIp: string;
    }
  ): Promise<
    IprAuthRateLimitRequestState
  > {

    const keys =
      deriveBucketKeys(
        input
      );

    const [
      ip,
      iprIp
    ] =
      await Promise.all([
        readBucket(
          keys.ip,
          "IP"
        ),
        readBucket(
          keys.iprIp,
          "IPR_IP"
        )
      ]);

    const blockedKinds:
      IprAuthRateLimitBucketKind[] =
      [];

    if (ip?.currentlyBlocked) {
      blockedKinds.push(
        "IP"
      );
    }

    if (
      iprIp?.currentlyBlocked
    ) {
      blockedKinds.push(
        "IPR_IP"
      );
    }

    return {
      blocked:
        blockedKinds.length > 0,

      blockedKinds,

      blockedUntil:
        latestBlockedUntil([
          ip,
          iprIp
        ]),

      ip,

      iprIp,

      legalCertification:
        false
    };
  }


  async recordFailureAsync(
    input: {
      humanIpr: string;
      clientIp: string;
    }
  ): Promise<
    IprAuthRateLimitRequestState
  > {

    const keys =
      deriveBucketKeys(
        input
      );

    const outcome =
      await withHbceDatabaseTransaction(
        async (
          context
        ) => {

          /*
           * Fixed lock order:
           * IP first, then IPR_IP.
           *
           * This reduces deadlock risk when
           * concurrent attempts share an IP.
           */

          const ip =
            await recordBucketFailure(
              context,
              keys.ip,
              "IP"
            );

          const iprIp =
            await recordBucketFailure(
              context,
              keys.iprIp,
              "IPR_IP"
            );

          return {
            ip,
            iprIp
          };
        },
        {
          isolationLevel:
            "READ COMMITTED",

          readOnly:
            false,

          statementTimeoutMs:
            15_000,

          lockTimeoutMs:
            5_000
        }
      );

    if (!outcome.ok) {
      throw new Error(
        outcome.error ||
        "HBCE_AUTH_RATE_LIMIT_FAILURE_TRANSACTION_FAILED"
      );
    }

    const {
      ip,
      iprIp
    } =
      outcome.value;

    const blockedKinds:
      IprAuthRateLimitBucketKind[] =
      [];

    if (ip.currentlyBlocked) {
      blockedKinds.push(
        "IP"
      );
    }

    if (
      iprIp.currentlyBlocked
    ) {
      blockedKinds.push(
        "IPR_IP"
      );
    }

    return {
      blocked:
        blockedKinds.length > 0,

      blockedKinds,

      blockedUntil:
        latestBlockedUntil([
          ip,
          iprIp
        ]),

      ip,

      iprIp,

      legalCertification:
        false
    };
  }


  async resetIprIpAfterSuccessAsync(
    input: {
      humanIpr: string;
      clientIp: string;
    }
  ): Promise<
    IprAuthRateLimitBucketState | null
  > {

    const keys =
      deriveBucketKeys(
        input
      );

    const outcome =
      await withHbceDatabaseTransaction(
        async (
          context
        ) => {

          const result =
            await context.query(
              RESET_IPR_IP_SQL,
              [
                keys.iprIp
              ]
            );

          const row =
            result.rows[0] as
              | IprAuthRateLimitBucketRow
              | undefined;

          return bucketStateFromRow(
            row,
            "IPR_IP"
          );
        },
        {
          isolationLevel:
            "READ COMMITTED",

          readOnly:
            false,

          statementTimeoutMs:
            15_000,

          lockTimeoutMs:
            5_000
        }
      );

    if (!outcome.ok) {
      throw new Error(
        outcome.error ||
        "HBCE_AUTH_RATE_LIMIT_RESET_TRANSACTION_FAILED"
      );
    }

    /*
     * No row is acceptable:
     * a valid login can occur before a pair bucket
     * has ever been created.
     */

    return outcome.value;
  }


  async inspectRetentionEligibilityAsync():
    Promise<IprAuthRateLimitRetentionPreflightResult> {

    const staleAfterSeconds =
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .retentionPolicy
        .staleAfterSeconds;

    const result =
      await queryHbceDatabaseWithoutSchemaInitialization<
        HbceDatabaseQueryRow & {
          eligible_buckets?: unknown;
        }
      >(
        RETENTION_PREFLIGHT_SQL,
        [
          staleAfterSeconds
        ]
      );

    if (!result.ok) {
      throw new Error(
        result.error ||
        "HBCE_AUTH_RATE_LIMIT_RETENTION_PREFLIGHT_FAILED"
      );
    }

    return {
      eligibleBuckets:
        integerOrZero(
          result.rows[0]
            ?.eligible_buckets
        ),

      staleAfterSeconds,

      databaseReadOnly:
        true,

      legalCertification:
        false
    };
  }


  async pruneStaleBucketsAsync():
    Promise<IprAuthRateLimitPruneResult> {

    const staleAfterSeconds =
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .retentionPolicy
        .staleAfterSeconds;

    const maximumBucketsPerRun =
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .retentionPolicy
        .maximumBucketsPerRun;

    const outcome =
      await withHbceDatabaseTransaction(
        async (
          context
        ) => {

          const result =
            await context.query(
              PRUNE_STALE_BUCKETS_SQL,
              [
                staleAfterSeconds,
                maximumBucketsPerRun
              ]
            );

          return {
            deletedBuckets:
              result.rows.length
          };
        },
        {
          isolationLevel:
            "READ COMMITTED",

          readOnly:
            false,

          statementTimeoutMs:
            15_000,

          lockTimeoutMs:
            5_000
        }
      );

    if (!outcome.ok) {
      throw new Error(
        outcome.error ||
        "HBCE_AUTH_RATE_LIMIT_RETENTION_TRANSACTION_FAILED"
      );
    }

    return {
      deletedBuckets:
        outcome.value.deletedBuckets,

      staleAfterSeconds,

      maximumBucketsPerRun,

      legalCertification:
        false
    };
  }
}


let defaultStore:
  PersistentIprAuthRateLimitStore | null =
  null;


export function getDefaultIprAuthRateLimitStore():
  PersistentIprAuthRateLimitStore {

  if (!defaultStore) {
    defaultStore =
      new PersistentIprAuthRateLimitStore();
  }

  return defaultStore;
}


export function describeIprAuthRateLimitStore() {
  return {
    revision:
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .revision,

    schemaVersion:
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .schemaVersion,

    table:
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .table,

    persistence:
      "DATABASE_PERSISTENT",

    keyDerivation:
      "HMAC-SHA256",

    secretConfigured:
      Buffer.byteLength(
        (
          process.env
            .HBCE_AUTH_RATE_LIMIT_HASH_SECRET ||
          ""
        ).trim(),
        "utf8"
      ) >= 32,

    ipPolicy:
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .ipPolicy,

    iprIpPolicy:
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .iprIpPolicy,

    retentionPolicy:
      IPR_AUTH_RATE_LIMIT_BOUNDARY
        .retentionPolicy,

    rawIpPersistence:
      false,

    rawHumanIprPersistence:
      false,

    rawUserAgentPersistence:
      false,

    globalIpResetOnSuccessfulLogin:
      false,

    iprIpResetOnSuccessfulLogin:
      true,

    sessionCreationAuthority:
      false,

    runtimeAuthorizationAuthority:
      false,

    credentialBypassAuthority:
      false,

    legalCertification:
      false
  };
}

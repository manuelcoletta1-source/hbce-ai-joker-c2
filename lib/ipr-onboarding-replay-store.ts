import {
  createHash
} from "node:crypto";

import type {
  HbceTransactionQueryValue
} from "./ipr-database-transaction";

import type {
  IprOnboardingTrustedIngressValidated
} from "./ipr-onboarding-trusted-ingress";


export const IPR_ONBOARDING_REPLAY_STORE_VERSION =
  "HBCE-IPR-ONBOARDING-REPLAY-STORE-v1.0";

export const IPR_ONBOARDING_REPLAY_STORE_AUTHORITY =
  "REPLAY_EVIDENCE_ONLY" as const;


const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;


type ReplayQueryRow =
  Record<string, unknown>;


export type IprOnboardingReplayQuery = (
  sql: string,
  parameters?:
    readonly HbceTransactionQueryValue[],
) => Promise<{
  rows: ReplayQueryRow[];
  rowCount?: number | null;
}>;


export type IprOnboardingReplayTransaction = {
  transactionId: string;
  query: IprOnboardingReplayQuery;
};


export type IprOnboardingReplayDeniedReason =
  | "NONCE_ALREADY_CONSUMED"
  | "PROJECTION_PAYLOAD_CONFLICT"
  | "PROJECTION_SCOPE_CONFLICT"
  | "PROJECTION_IDENTITY_CONFLICT"
  | "PROJECTION_INCOMPLETE_STATE";


export type IprOnboardingReplayProjectionStatus =
  | "PENDING"
  | "PROFILE_PERSISTED";


type ReplayAuthorityBoundary = {
  runtimeAuthorized: false;
  sessionAuthenticated: false;
  profilePersistenceAuthorized: false;

  authority:
    typeof IPR_ONBOARDING_REPLAY_STORE_AUTHORITY;

  legalCertification: false;
};


type ReplayIdentity = {
  transactionId: string;

  projectionKey: string;
  payloadHash: string;
  nonceHash: string;

  credentialIdHash: string;
  humanIprHash: string;

  tenantId: string;
  workspaceId: string;
};


export type IprOnboardingReplayNewProjection =
  ReplayAuthorityBoundary &
  ReplayIdentity & {
    ok: true;

    status:
      "NEW_PROJECTION_RESERVED";

    replayDecision:
      "NEW_PROJECTION";

    projectionStatus:
      "PENDING";

    replayCount: 0;

    nextAction:
      "EVALUATE_SERVER_PROJECTION";
  };


export type IprOnboardingReplayIdempotent =
  ReplayAuthorityBoundary &
  ReplayIdentity & {
    ok: true;

    status:
      "IDEMPOTENT_REPLAY_ACCEPTED";

    replayDecision:
      "IDEMPOTENT_REPLAY";

    projectionStatus:
      "PROFILE_PERSISTED";

    replayCount: number;

    nextAction:
      "NO_PROFILE_WRITE_REQUIRED";
  };


export type IprOnboardingReplayDenied =
  ReplayAuthorityBoundary &
  ReplayIdentity & {
    ok: false;

    status:
      "REPLAY_DENIED";

    replayDecision:
      "DENIED";

    reason:
      IprOnboardingReplayDeniedReason;

    projectionStatus:
      IprOnboardingReplayProjectionStatus | null;

    replayCount:
      number | null;

    nextAction:
      "FAIL_CLOSED";
  };


export type IprOnboardingReplayDecision =
  | IprOnboardingReplayNewProjection
  | IprOnboardingReplayIdempotent
  | IprOnboardingReplayDenied;


export type IprOnboardingReplayProfilePersisted =
  ReplayAuthorityBoundary & {
    ok: true;

    status:
      "PROFILE_PERSISTENCE_RECORDED";

    transactionId: string;

    projectionKey: string;
    payloadHash: string;

    projectionStatus:
      "PROFILE_PERSISTED";

    replayCount: number;

    alreadyPersisted: boolean;
  };


export type IprOnboardingReplayStoreErrorCode =
  | "TRANSACTION_ID_REQUIRED"
  | "INVALID_SHA256"
  | "SERVICE_CREDENTIAL_ID_REQUIRED"
  | "TENANT_REQUIRED"
  | "WORKSPACE_REQUIRED"
  | "HUMAN_IPR_REQUIRED"
  | "REPLAY_RECEIPT_MISSING"
  | "REPLAY_RECEIPT_INVALID"
  | "REPLAY_UPDATE_FAILED";


export class IprOnboardingReplayStoreError
  extends Error {
  readonly code:
    IprOnboardingReplayStoreErrorCode;

  constructor(
    code:
      IprOnboardingReplayStoreErrorCode,
    message: string,
  ) {
    super(
      `${code}:${message}`,
    );

    this.name =
      "IprOnboardingReplayStoreError";

    this.code =
      code;
  }
}


function fail(
  code:
    IprOnboardingReplayStoreErrorCode,
  message: string,
): never {
  throw new IprOnboardingReplayStoreError(
    code,
    message,
  );
}


function normalizeRequiredText(
  value: unknown,
  code:
    IprOnboardingReplayStoreErrorCode,
): string {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!normalized) {
    fail(
      code,
      "Required value is absent.",
    );
  }

  return normalized;
}


function requireSha256(
  value: unknown,
): string {
  const normalized =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  if (
    !SHA256_PATTERN.test(
      normalized,
    )
  ) {
    fail(
      "INVALID_SHA256",
      "Replay hash must be lowercase SHA-256 hex.",
    );
  }

  return normalized;
}


function sha256OperationalId(
  domain: string,
  value: string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      `${domain}\u0000${value}`,
      "utf8",
    )
    .digest(
      "hex",
    );
}


function readRequiredRowText(
  row: ReplayQueryRow,
  key: string,
): string {
  const value =
    row[key];

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    fail(
      "REPLAY_RECEIPT_INVALID",
      `Required database field is invalid: ${key}`,
    );
  }

  return value.trim();
}


function readProjectionStatus(
  row: ReplayQueryRow,
): IprOnboardingReplayProjectionStatus {
  const value =
    readRequiredRowText(
      row,
      "status",
    );

  if (
    value !== "PENDING" &&
    value !== "PROFILE_PERSISTED"
  ) {
    fail(
      "REPLAY_RECEIPT_INVALID",
      "Persisted projection status is invalid.",
    );
  }

  return value;
}


function readReplayCount(
  row: ReplayQueryRow,
): number {
  const raw =
    row.replay_count;

  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;

  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    fail(
      "REPLAY_RECEIPT_INVALID",
      "Persisted replay count is invalid.",
    );
  }

  return value;
}


function authorityBoundary():
  ReplayAuthorityBoundary {
  return {
    runtimeAuthorized:
      false,

    sessionAuthenticated:
      false,

    profilePersistenceAuthorized:
      false,

    authority:
      IPR_ONBOARDING_REPLAY_STORE_AUTHORITY,

    legalCertification:
      false,
  };
}


function buildReplayIdentity(
  transaction:
    IprOnboardingReplayTransaction,
  ingress:
    IprOnboardingTrustedIngressValidated,
): ReplayIdentity {
  const transactionId =
    normalizeRequiredText(
      transaction.transactionId,
      "TRANSACTION_ID_REQUIRED",
    );

  const projectionKey =
    requireSha256(
      ingress.projectionKey,
    );

  const payloadHash =
    requireSha256(
      ingress.payloadHash,
    );

  const nonceHash =
    requireSha256(
      ingress.nonceHash,
    );

  const credentialId =
    normalizeRequiredText(
      ingress.service
        .credentialId,
      "SERVICE_CREDENTIAL_ID_REQUIRED",
    );

  const tenantId =
    normalizeRequiredText(
      ingress.service
        .tenantId,
      "TENANT_REQUIRED",
    );

  const workspaceId =
    normalizeRequiredText(
      ingress.service
        .workspaceId,
      "WORKSPACE_REQUIRED",
    );

  const humanIpr =
    normalizeRequiredText(
      ingress.evidence
        .iprId,
      "HUMAN_IPR_REQUIRED",
    );

  const credentialIdHash =
    sha256OperationalId(
      "HBCE-IPR-ONBOARDING-REPLAY-CREDENTIAL-v1",
      credentialId,
    );

  const humanIprHash =
    sha256OperationalId(
      "HBCE-IPR-ONBOARDING-REPLAY-HUMAN-IPR-v1",
      humanIpr,
    );

  return {
    transactionId,
    projectionKey,
    payloadHash,
    nonceHash,
    credentialIdHash,
    humanIprHash,
    tenantId,
    workspaceId,
  };
}


function denied(
  identity:
    ReplayIdentity,
  reason:
    IprOnboardingReplayDeniedReason,
  projectionStatus:
    IprOnboardingReplayProjectionStatus | null,
  replayCount:
    number | null,
): IprOnboardingReplayDenied {
  return {
    ok:
      false,

    status:
      "REPLAY_DENIED",

    replayDecision:
      "DENIED",

    reason,

    projectionStatus,
    replayCount,

    nextAction:
      "FAIL_CLOSED",

    ...identity,
    ...authorityBoundary(),
  };
}


/**
 * Records transport replay evidence inside a caller-owned database
 * transaction.
 *
 * This function does not:
 * - authenticate a biological subject;
 * - create credentials;
 * - create a session or cookie;
 * - create verifiedSubject;
 * - persist an account profile;
 * - grant runtime authority.
 *
 * The supplied query function must belong to the same transaction that
 * will later evaluate server projection policy and, only if separately
 * eligible, persist subject/profile state.
 */
export async function evaluateAndRecordIprOnboardingReplay(
  input: {
    transaction:
      IprOnboardingReplayTransaction;

    ingress:
      IprOnboardingTrustedIngressValidated;
  },
): Promise<IprOnboardingReplayDecision> {
  const {
    transaction,
    ingress,
  } =
    input;

  const identity =
    buildReplayIdentity(
      transaction,
      ingress,
    );

  const nonceInsert =
    await transaction.query(
      `
INSERT INTO ipr_onboarding_projection_nonces (
  nonce_hash,
  projection_key,
  payload_hash,
  credential_id_hash,
  accepted_at,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  now(),
  false
)
ON CONFLICT (nonce_hash) DO NOTHING
RETURNING
  nonce_hash
      `.trim(),
      [
        identity.nonceHash,
        identity.projectionKey,
        identity.payloadHash,
        identity.credentialIdHash,
      ],
    );

  if (
    nonceInsert.rows.length === 0
  ) {
    return denied(
      identity,
      "NONCE_ALREADY_CONSUMED",
      null,
      null,
    );
  }

  const receiptInsert =
    await transaction.query(
      `
INSERT INTO ipr_onboarding_projection_receipts (
  projection_key,
  payload_hash,
  first_credential_id_hash,
  tenant_id,
  workspace_id,
  human_ipr_hash,
  status,
  first_accepted_at,
  last_seen_at,
  replay_count,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  'PENDING',
  now(),
  now(),
  0,
  false
)
ON CONFLICT (projection_key) DO NOTHING
RETURNING
  projection_key,
  payload_hash,
  status,
  replay_count
      `.trim(),
      [
        identity.projectionKey,
        identity.payloadHash,
        identity.credentialIdHash,
        identity.tenantId,
        identity.workspaceId,
        identity.humanIprHash,
      ],
    );

  if (
    receiptInsert.rows.length === 1
  ) {
    return {
      ok:
        true,

      status:
        "NEW_PROJECTION_RESERVED",

      replayDecision:
        "NEW_PROJECTION",

      projectionStatus:
        "PENDING",

      replayCount:
        0,

      nextAction:
        "EVALUATE_SERVER_PROJECTION",

      ...identity,
      ...authorityBoundary(),
    };
  }

  const existingResult =
    await transaction.query(
      `
SELECT
  projection_key,
  payload_hash,
  first_credential_id_hash,
  tenant_id,
  workspace_id,
  human_ipr_hash,
  status,
  replay_count
FROM ipr_onboarding_projection_receipts
WHERE projection_key = $1
FOR UPDATE
      `.trim(),
      [
        identity.projectionKey,
      ],
    );

  const existing =
    existingResult.rows[0];

  if (!existing) {
    fail(
      "REPLAY_RECEIPT_MISSING",
      "Projection conflict was reported but no persisted receipt exists.",
    );
  }

  const existingProjectionKey =
    requireSha256(
      readRequiredRowText(
        existing,
        "projection_key",
      ),
    );

  if (
    existingProjectionKey !==
    identity.projectionKey
  ) {
    fail(
      "REPLAY_RECEIPT_INVALID",
      "Persisted projection key does not match the requested key.",
    );
  }

  const existingPayloadHash =
    requireSha256(
      readRequiredRowText(
        existing,
        "payload_hash",
      ),
    );

  const existingTenantId =
    readRequiredRowText(
      existing,
      "tenant_id",
    );

  const existingWorkspaceId =
    readRequiredRowText(
      existing,
      "workspace_id",
    );

  const existingHumanIprHash =
    requireSha256(
      readRequiredRowText(
        existing,
        "human_ipr_hash",
      ),
    );

  const projectionStatus =
    readProjectionStatus(
      existing,
    );

  const replayCount =
    readReplayCount(
      existing,
    );

  if (
    existingPayloadHash !==
    identity.payloadHash
  ) {
    return denied(
      identity,
      "PROJECTION_PAYLOAD_CONFLICT",
      projectionStatus,
      replayCount,
    );
  }

  if (
    existingTenantId !==
      identity.tenantId ||
    existingWorkspaceId !==
      identity.workspaceId
  ) {
    return denied(
      identity,
      "PROJECTION_SCOPE_CONFLICT",
      projectionStatus,
      replayCount,
    );
  }

  if (
    existingHumanIprHash !==
    identity.humanIprHash
  ) {
    return denied(
      identity,
      "PROJECTION_IDENTITY_CONFLICT",
      projectionStatus,
      replayCount,
    );
  }

  if (
    projectionStatus !==
    "PROFILE_PERSISTED"
  ) {
    return denied(
      identity,
      "PROJECTION_INCOMPLETE_STATE",
      projectionStatus,
      replayCount,
    );
  }

  const replayUpdate =
    await transaction.query(
      `
UPDATE ipr_onboarding_projection_receipts
SET
  last_seen_at = now(),
  replay_count = replay_count + 1,
  legal_certification = false
WHERE projection_key = $1
  AND payload_hash = $2
  AND status = 'PROFILE_PERSISTED'
RETURNING
  status,
  replay_count
      `.trim(),
      [
        identity.projectionKey,
        identity.payloadHash,
      ],
    );

  const updated =
    replayUpdate.rows[0];

  if (!updated) {
    fail(
      "REPLAY_UPDATE_FAILED",
      "Idempotent replay receipt could not be updated.",
    );
  }

  const updatedStatus =
    readProjectionStatus(
      updated,
    );

  const updatedReplayCount =
    readReplayCount(
      updated,
    );

  if (
    updatedStatus !==
    "PROFILE_PERSISTED"
  ) {
    fail(
      "REPLAY_UPDATE_FAILED",
      "Idempotent replay changed to a non-persisted state.",
    );
  }

  return {
    ok:
      true,

    status:
      "IDEMPOTENT_REPLAY_ACCEPTED",

    replayDecision:
      "IDEMPOTENT_REPLAY",

    projectionStatus:
      "PROFILE_PERSISTED",

    replayCount:
      updatedReplayCount,

    nextAction:
      "NO_PROFILE_WRITE_REQUIRED",

    ...identity,
    ...authorityBoundary(),
  };
}


/**
 * Marks a previously reserved PENDING projection receipt as persisted.
 *
 * The caller must invoke this only after the subject/profile database
 * writes have succeeded inside the same transaction.
 *
 * This marker does not authenticate, create a session, create a cookie,
 * create verifiedSubject, or grant runtime authority.
 */
export async function markIprOnboardingReplayProfilePersisted(
  input: {
    transaction:
      IprOnboardingReplayTransaction;

    projectionKey: string;
    payloadHash: string;
  },
): Promise<IprOnboardingReplayProfilePersisted> {
  const transactionId =
    normalizeRequiredText(
      input.transaction
        .transactionId,
      "TRANSACTION_ID_REQUIRED",
    );

  const projectionKey =
    requireSha256(
      input.projectionKey,
    );

  const payloadHash =
    requireSha256(
      input.payloadHash,
    );

  const updateResult =
    await input.transaction.query(
      `
UPDATE ipr_onboarding_projection_receipts
SET
  status = 'PROFILE_PERSISTED',
  last_seen_at = now(),
  legal_certification = false
WHERE projection_key = $1
  AND payload_hash = $2
  AND status = 'PENDING'
RETURNING
  projection_key,
  payload_hash,
  status,
  replay_count
      `.trim(),
      [
        projectionKey,
        payloadHash,
      ],
    );

  const updated =
    updateResult.rows[0];

  if (updated) {
    return {
      ok:
        true,

      status:
        "PROFILE_PERSISTENCE_RECORDED",

      transactionId,
      projectionKey,
      payloadHash,

      projectionStatus:
        "PROFILE_PERSISTED",

      replayCount:
        readReplayCount(
          updated,
        ),

      alreadyPersisted:
        false,

      ...authorityBoundary(),
    };
  }

  const existingResult =
    await input.transaction.query(
      `
SELECT
  projection_key,
  payload_hash,
  status,
  replay_count
FROM ipr_onboarding_projection_receipts
WHERE projection_key = $1
FOR UPDATE
      `.trim(),
      [
        projectionKey,
      ],
    );

  const existing =
    existingResult.rows[0];

  if (!existing) {
    fail(
      "REPLAY_RECEIPT_MISSING",
      "Cannot mark a projection receipt that does not exist.",
    );
  }

  const existingPayloadHash =
    requireSha256(
      readRequiredRowText(
        existing,
        "payload_hash",
      ),
    );

  if (
    existingPayloadHash !==
    payloadHash
  ) {
    fail(
      "REPLAY_RECEIPT_INVALID",
      "Persisted payload hash differs from the requested projection.",
    );
  }

  const existingStatus =
    readProjectionStatus(
      existing,
    );

  if (
    existingStatus !==
    "PROFILE_PERSISTED"
  ) {
    fail(
      "REPLAY_UPDATE_FAILED",
      "Projection receipt remains incomplete after persistence marking.",
    );
  }

  return {
    ok:
      true,

    status:
      "PROFILE_PERSISTENCE_RECORDED",

    transactionId,
    projectionKey,
    payloadHash,

    projectionStatus:
      "PROFILE_PERSISTED",

    replayCount:
      readReplayCount(
        existing,
      ),

    alreadyPersisted:
      true,

    ...authorityBoundary(),
  };
}

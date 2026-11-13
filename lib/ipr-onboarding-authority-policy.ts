import type {
  HbceTransactionContext,
} from "@/lib/ipr-database-transaction";

export const IPR_ONBOARDING_PRE_PROFILE_AUTHORITY_POLICY_BOUNDARY =
  "Persistent append-only pre-profile policy may authorize profile persistence only when one exact-bound, currently valid, non-revoked GRANT survives fail-closed genealogy evaluation. It does not authenticate a subject, create a session or cookie, create verifiedSubject, grant runtime authority, or provide legal certification.";


export type IprOnboardingPreProfilePolicyTransaction =
  Pick<
    HbceTransactionContext,
    "transactionId" | "query"
  >;


type PolicyDecision =
  | "GRANT"
  | "DENY"
  | "REVOKE";


type PolicyRow = {
  policy_record_id: string;
  tenant_id: string;
  workspace_id: string;
  human_ipr_hash: string;
  projection_key: string;
  payload_hash: string;

  decision: PolicyDecision;

  allow_joker_c2_access: boolean;
  verified_biological_subject: boolean;
  matrix_active: boolean;
  ipr_bound_memory: boolean;

  issuer_kind: string;
  issuer_credential_id_hash: string;
  issuer_authorization_ref_hash: string;

  issued_at: string | Date;
  not_before: string | Date | null;
  expires_at: string | Date | null;

  supersedes_policy_record_id: string | null;
  revokes_policy_record_id: string | null;

  legal_certification: boolean;
};


export type IprOnboardingPreProfilePolicyDeniedReason =
  | "POLICY_NOT_FOUND"
  | "POLICY_BINDING_MISMATCH"
  | "POLICY_ISSUER_CREDENTIAL_MISMATCH"
  | "POLICY_DENIED"
  | "POLICY_REVOKED"
  | "POLICY_NOT_YET_VALID"
  | "POLICY_EXPIRED"
  | "POLICY_GRANT_FLAGS_INVALID"
  | "POLICY_RECORD_INVALID";


type AuthorityBoundary = {
  runtimeAuthorized: false;
  sessionAuthenticated: false;
  legalCertification: false;
};


export type IprOnboardingPreProfilePolicyGranted =
  AuthorityBoundary & {
    ok: true;
    status: "PRE_PROFILE_POLICY_GRANTED";
    decision: "GRANT";

    policyRecordId: string;

    profilePersistenceAuthorized: true;

    serverPolicy: {
      allowJokerC2Access: true;
      verifiedBiologicalSubject: true;
      matrixActive: true;
      iprBoundMemory: true;
    };

    boundary:
      typeof IPR_ONBOARDING_PRE_PROFILE_AUTHORITY_POLICY_BOUNDARY;
  };


export type IprOnboardingPreProfilePolicyDenied =
  AuthorityBoundary & {
    ok: false;
    status: "PRE_PROFILE_POLICY_DENIED";
    decision: "DENY";

    reason:
      IprOnboardingPreProfilePolicyDeniedReason;

    policyRecordId:
      string | null;

    profilePersistenceAuthorized:
      false;

    serverPolicy: {
      allowJokerC2Access: false;
      verifiedBiologicalSubject: false;
      matrixActive: false;
      iprBoundMemory: false;
    };

    boundary:
      typeof IPR_ONBOARDING_PRE_PROFILE_AUTHORITY_POLICY_BOUNDARY;
  };


export type IprOnboardingPreProfilePolicyResult =
  | IprOnboardingPreProfilePolicyGranted
  | IprOnboardingPreProfilePolicyDenied;


function falsePolicy() {
  return {
    allowJokerC2Access:
      false as const,

    verifiedBiologicalSubject:
      false as const,

    matrixActive:
      false as const,

    iprBoundMemory:
      false as const,
  };
}


function deny(
  reason:
    IprOnboardingPreProfilePolicyDeniedReason,

  policyRecordId:
    string | null = null,
): IprOnboardingPreProfilePolicyDenied {
  return {
    ok:
      false,

    status:
      "PRE_PROFILE_POLICY_DENIED",

    decision:
      "DENY",

    reason,

    policyRecordId,

    profilePersistenceAuthorized:
      false,

    serverPolicy:
      falsePolicy(),

    runtimeAuthorized:
      false,

    sessionAuthenticated:
      false,

    legalCertification:
      false,

    boundary:
      IPR_ONBOARDING_PRE_PROFILE_AUTHORITY_POLICY_BOUNDARY,
  };
}


function isSha256(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{64}$/.test(value)
  );
}


function timeMs(
  value:
    string | Date | null,
): number | null {
  if (value === null) {
    return null;
  }

  const ms =
    value instanceof Date
      ? value.getTime()
      : Date.parse(value);

  return Number.isFinite(ms)
    ? ms
    : null;
}


function exactBinding(
  row: PolicyRow,
  input: {
    tenantId: string;
    workspaceId: string;
    humanIprHash: string;
    projectionKey: string;
    payloadHash: string;
  },
): boolean {
  return (
    row.tenant_id === input.tenantId &&
    row.workspace_id === input.workspaceId &&
    row.human_ipr_hash === input.humanIprHash &&
    row.projection_key === input.projectionKey &&
    row.payload_hash === input.payloadHash
  );
}


function issuedAtMs(
  row: PolicyRow,
): number {
  return (
    timeMs(
      row.issued_at,
    ) ??
    Number.NEGATIVE_INFINITY
  );
}


export async function resolveIprOnboardingPreProfileAuthorityPolicy(
  input: {
    transaction:
      IprOnboardingPreProfilePolicyTransaction;

    tenantId: string;
    workspaceId: string;
    humanIprHash: string;
    projectionKey: string;
    payloadHash: string;
    issuerCredentialIdHash: string;

    now?: Date;
  },
): Promise<IprOnboardingPreProfilePolicyResult> {
  if (
    !input.tenantId.trim() ||
    !input.workspaceId.trim() ||
    !isSha256(input.humanIprHash) ||
    !isSha256(input.projectionKey) ||
    !isSha256(input.payloadHash) ||
    !isSha256(input.issuerCredentialIdHash)
  ) {
    return deny(
      "POLICY_RECORD_INVALID",
    );
  }

  const result =
    await input.transaction.query<PolicyRow>(
      `
SELECT
  policy_record_id,
  tenant_id,
  workspace_id,
  human_ipr_hash,
  projection_key,
  payload_hash,
  decision,
  allow_joker_c2_access,
  verified_biological_subject,
  matrix_active,
  ipr_bound_memory,
  issuer_kind,
  issuer_credential_id_hash,
  issuer_authorization_ref_hash,
  issued_at,
  not_before,
  expires_at,
  supersedes_policy_record_id,
  revokes_policy_record_id,
  legal_certification
FROM ipr_onboarding_pre_profile_policy_records
WHERE tenant_id = $1
  AND workspace_id = $2
  AND human_ipr_hash = $3
  AND projection_key = $4
  AND payload_hash = $5
ORDER BY issued_at ASC, policy_record_id ASC
      `.trim(),
      [
        input.tenantId,
        input.workspaceId,
        input.humanIprHash,
        input.projectionKey,
        input.payloadHash,
      ],
    );

  const rows =
    result.rows;

  if (rows.length === 0) {
    return deny(
      "POLICY_NOT_FOUND",
    );
  }

  /*
   * Defense in depth:
   * even though SQL applies the exact binding,
   * reject any unexpected row returned outside it.
   */
  if (
    rows.some(
      (row) =>
        !exactBinding(
          row,
          input,
        ),
    )
  ) {
    return deny(
      "POLICY_BINDING_MISMATCH",
    );
  }

  if (
    rows.some(
      (row) =>
        row.issuer_credential_id_hash !==
        input.issuerCredentialIdHash,
    )
  ) {
    return deny(
      "POLICY_ISSUER_CREDENTIAL_MISMATCH",
    );
  }

  if (
    rows.some(
      (row) =>
        !isSha256(
          row.policy_record_id,
        ) ||
        !isSha256(
          row.issuer_credential_id_hash,
        ) ||
        !isSha256(
          row.issuer_authorization_ref_hash,
        ) ||
        row.legal_certification !==
          false,
    )
  ) {
    return deny(
      "POLICY_RECORD_INVALID",
    );
  }

  const ordered =
    [...rows].sort(
      (a, b) => {
        const delta =
          issuedAtMs(a) -
          issuedAtMs(b);

        if (delta !== 0) {
          return delta;
        }

        return a.policy_record_id.localeCompare(
          b.policy_record_id,
        );
      },
    );

  const recordIds =
    new Set(
      ordered.map(
        (row) =>
          row.policy_record_id,
      ),
    );

  /*
   * Genealogy must be closed over the returned exact-bound
   * policy set. An orphan supersession or revocation reference
   * cannot participate in authority resolution.
   */
  for (const row of ordered) {
    if (
      row.supersedes_policy_record_id !==
        null &&
      !recordIds.has(
        row.supersedes_policy_record_id,
      )
    ) {
      return deny(
        "POLICY_RECORD_INVALID",
        row.policy_record_id,
      );
    }

    if (
      row.revokes_policy_record_id !==
        null &&
      !recordIds.has(
        row.revokes_policy_record_id,
      )
    ) {
      return deny(
        "POLICY_RECORD_INVALID",
        row.policy_record_id,
      );
    }
  }

  const nowMs =
    (
      input.now ??
      new Date()
    ).getTime();

  /*
   * A future record cannot alter current authority.
   * not_before and issued_at both constrain when genealogy
   * becomes effective.
   */
  const effectiveRows =
    ordered.filter(
      (row) => {
        const issued =
          timeMs(
            row.issued_at,
          );

        const notBefore =
          timeMs(
            row.not_before,
          );

        if (issued === null) {
          return false;
        }

        if (issued > nowMs) {
          return false;
        }

        if (
          notBefore !== null &&
          notBefore > nowMs
        ) {
          return false;
        }

        return true;
      },
    );

  if (effectiveRows.length === 0) {
    return deny(
      "POLICY_NOT_YET_VALID",
    );
  }

  /*
   * REVOKE records are control events, not authority heads.
   * Effective supersession removes an earlier policy from the
   * current head set.
   */
  const effectiveSuperseded =
    new Set(
      effectiveRows
        .map(
          (row) =>
            row.supersedes_policy_record_id,
        )
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    );

  const policyHeads =
    effectiveRows.filter(
      (row) =>
        row.decision !==
          "REVOKE" &&
        !effectiveSuperseded.has(
          row.policy_record_id,
        ),
    );

  /*
   * Fail closed on ambiguity. Authority must resolve to exactly
   * one effective policy head.
   */
  if (policyHeads.length !== 1) {
    return deny(
      "POLICY_RECORD_INVALID",
    );
  }

  const selected =
    policyHeads[0];

  if (!selected) {
    return deny(
      "POLICY_RECORD_INVALID",
    );
  }

  /*
   * A revocation only invalidates the policy record it names.
   * A later explicit successor is independently evaluated.
   */
  const revoked =
    effectiveRows.some(
      (row) =>
        row.decision ===
          "REVOKE" &&
        row.revokes_policy_record_id ===
          selected.policy_record_id,
    );

  if (revoked) {
    return deny(
      "POLICY_REVOKED",
      selected.policy_record_id,
    );
  }

  if (
    selected.decision !==
    "GRANT"
  ) {
    return deny(
      "POLICY_DENIED",
      selected.policy_record_id,
    );
  }

  const issuedMs =
    timeMs(
      selected.issued_at,
    );

  const notBeforeMs =
    timeMs(
      selected.not_before,
    );

  const expiresMs =
    timeMs(
      selected.expires_at,
    );

  if (
    issuedMs === null ||
    expiresMs === null
  ) {
    return deny(
      "POLICY_RECORD_INVALID",
      selected.policy_record_id,
    );
  }

  if (
    notBeforeMs !== null &&
    nowMs < notBeforeMs
  ) {
    return deny(
      "POLICY_NOT_YET_VALID",
      selected.policy_record_id,
    );
  }

  if (
    nowMs < issuedMs
  ) {
    return deny(
      "POLICY_NOT_YET_VALID",
      selected.policy_record_id,
    );
  }

  if (
    nowMs >= expiresMs
  ) {
    return deny(
      "POLICY_EXPIRED",
      selected.policy_record_id,
    );
  }

  if (
    selected.allow_joker_c2_access !==
      true ||
    selected.verified_biological_subject !==
      true ||
    selected.matrix_active !==
      true ||
    selected.ipr_bound_memory !==
      true
  ) {
    return deny(
      "POLICY_GRANT_FLAGS_INVALID",
      selected.policy_record_id,
    );
  }

  return {
    ok:
      true,

    status:
      "PRE_PROFILE_POLICY_GRANTED",

    decision:
      "GRANT",

    policyRecordId:
      selected.policy_record_id,

    profilePersistenceAuthorized:
      true,

    serverPolicy: {
      allowJokerC2Access:
        true,

      verifiedBiologicalSubject:
        true,

      matrixActive:
        true,

      iprBoundMemory:
        true,
    },

    runtimeAuthorized:
      false,

    sessionAuthenticated:
      false,

    legalCertification:
      false,

    boundary:
      IPR_ONBOARDING_PRE_PROFILE_AUTHORITY_POLICY_BOUNDARY,
  };
}

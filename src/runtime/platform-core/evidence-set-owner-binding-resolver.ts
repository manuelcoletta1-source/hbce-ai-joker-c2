import {
  isValidHumanIpr,
  normalizeHumanIpr,
} from "../../../lib/ipr-auth";

import {
  isHbceTransactionDatabaseConfigured,
  withHbceDatabaseTransaction,
} from "../../../lib/ipr-database-transaction";

export const PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_PROTOCOL =
  "HBCE-EVIDENCE-OWNER-HUMAN-IPR-EXACT-v1" as const;

export const PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS =
  "IPR_VERIFIED_BIOLOGICAL_SUBJECT" as const;

export const PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export type PlatformCoreEvidenceSetOwnerBindingKind =
  | "MATCH"
  | "MISMATCH"
  | "UNRESOLVED";

export type PlatformCoreEvidenceSetOwnerBindingReason =
  | "EXACT_OWNER_MATCH"
  | "EXACT_OWNER_MISMATCH"
  | "AUTHENTICATED_HUMAN_IPR_MISSING"
  | "AUTHENTICATED_HUMAN_IPR_INVALID"
  | "AUTHENTICATED_HUMAN_IPR_NOT_CANONICAL"
  | "AUTHENTICATED_IDENTITY_BINDING_INVALID"
  | "CANONICAL_OWNER_SUBJECT_REF_MISSING"
  | "DATABASE_NOT_CONFIGURED"
  | "DATABASE_FAILURE"
  | "DURABLE_SUBJECT_NOT_FOUND"
  | "DURABLE_SUBJECT_RECORD_INVALID";

export type PlatformCoreEvidenceSetOwnerBindingInput =
  Readonly<{
    authenticatedHumanIpr:
      unknown;

    authenticatedIdentityBinding:
      unknown;

    canonicalOwnerSubjectRef:
      unknown;
  }>;

export type PlatformCoreEvidenceSetOwnerBindingResult =
  Readonly<{
    protocol:
      typeof PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_PROTOCOL;

    kind:
      PlatformCoreEvidenceSetOwnerBindingKind;

    reason:
      PlatformCoreEvidenceSetOwnerBindingReason;

    durableSubjectConfirmed:
      boolean;
  }>;

type DurableSubjectRow =
  Record<string, unknown> &
  Readonly<{
    human_ipr:
      unknown;

    subject_kind:
      unknown;

    status:
      unknown;

    legal_certification:
      unknown;
  }>;

function result(
  kind:
    PlatformCoreEvidenceSetOwnerBindingKind,
  reason:
    PlatformCoreEvidenceSetOwnerBindingReason,
  durableSubjectConfirmed:
    boolean,
): PlatformCoreEvidenceSetOwnerBindingResult {
  return Object.freeze({
    protocol:
      PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_PROTOCOL,

    kind,

    reason,

    durableSubjectConfirmed,
  });
}

function unresolved(
  reason:
    Exclude<
      PlatformCoreEvidenceSetOwnerBindingReason,
      | "EXACT_OWNER_MATCH"
      | "EXACT_OWNER_MISMATCH"
    >,
): PlatformCoreEvidenceSetOwnerBindingResult {
  return result(
    "UNRESOLVED",
    reason,
    false,
  );
}

function requireCanonicalAuthenticatedHumanIpr(
  value:
    unknown,
):
  | Readonly<{
      ok:
        true;

      humanIpr:
        string;
    }>
  | Readonly<{
      ok:
        false;

      reason:
        | "AUTHENTICATED_HUMAN_IPR_MISSING"
        | "AUTHENTICATED_HUMAN_IPR_INVALID"
        | "AUTHENTICATED_HUMAN_IPR_NOT_CANONICAL";
    }> {
  if (
    typeof value !==
      "string"
    || value.length ===
      0
  ) {
    return Object.freeze({
      ok:
        false,

      reason:
        "AUTHENTICATED_HUMAN_IPR_MISSING",
    });
  }

  const normalized =
    normalizeHumanIpr(
      value,
    );

  if (
    !isValidHumanIpr(
      normalized,
    )
  ) {
    return Object.freeze({
      ok:
        false,

      reason:
        "AUTHENTICATED_HUMAN_IPR_INVALID",
    });
  }

  if (
    value !==
      normalized
  ) {
    return Object.freeze({
      ok:
        false,

      reason:
        "AUTHENTICATED_HUMAN_IPR_NOT_CANONICAL",
    });
  }

  return Object.freeze({
    ok:
      true,

    humanIpr:
      normalized,
  });
}

function requireCanonicalOwnerSubjectRef(
  value:
    unknown,
):
  | Readonly<{
      ok:
        true;

      ownerSubjectRef:
        string;
    }>
  | Readonly<{
      ok:
        false;
    }> {
  if (
    typeof value !==
      "string"
    || value.length ===
      0
  ) {
    return Object.freeze({
      ok:
        false,
    });
  }

  return Object.freeze({
    ok:
      true,

    ownerSubjectRef:
      value,
  });
}

function isEligibleDurableSubject(
  row:
    DurableSubjectRow,
  authenticatedHumanIpr:
    string,
): boolean {
  return (
    row.human_ipr ===
      authenticatedHumanIpr
    && row.status ===
      "ACTIVE"
    && row.subject_kind ===
      "BIOLOGICAL_SUBJECT"
    && row.legal_certification ===
      false
  );
}

export async function resolvePlatformCoreEvidenceSetOwnerBinding(
  input:
    PlatformCoreEvidenceSetOwnerBindingInput,
): Promise<
  PlatformCoreEvidenceSetOwnerBindingResult
> {
  const authenticated =
    requireCanonicalAuthenticatedHumanIpr(
      input.authenticatedHumanIpr,
    );

  if (
    !authenticated.ok
  ) {
    return unresolved(
      authenticated.reason,
    );
  }

  if (
    input.authenticatedIdentityBinding !==
      PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS
  ) {
    return unresolved(
      "AUTHENTICATED_IDENTITY_BINDING_INVALID",
    );
  }

  const owner =
    requireCanonicalOwnerSubjectRef(
      input.canonicalOwnerSubjectRef,
    );

  if (
    !owner.ok
  ) {
    return unresolved(
      "CANONICAL_OWNER_SUBJECT_REF_MISSING",
    );
  }

  if (
    !isHbceTransactionDatabaseConfigured()
  ) {
    return unresolved(
      "DATABASE_NOT_CONFIGURED",
    );
  }

  const outcome =
    await withHbceDatabaseTransaction(
      async (
        transaction,
      ) => {
        const query =
          await transaction.query<DurableSubjectRow>(
            `
              SELECT
                human_ipr,
                subject_kind,
                status,
                legal_certification
              FROM ipr_subjects
              WHERE human_ipr = $1
              LIMIT 2
            `,
            [
              authenticated.humanIpr,
            ],
          );

        return Object.freeze(
          [
            ...query.rows,
          ],
        );
      },
      {
        isolationLevel:
          PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_TRANSACTION_ISOLATION,

        readOnly:
          true,
      },
    );

  if (
    !outcome.ok
  ) {
    return unresolved(
      "DATABASE_FAILURE",
    );
  }

  if (
    outcome.value.length ===
      0
  ) {
    return unresolved(
      "DURABLE_SUBJECT_NOT_FOUND",
    );
  }

  if (
    outcome.value.length !==
      1
  ) {
    return unresolved(
      "DURABLE_SUBJECT_RECORD_INVALID",
    );
  }

  const durableSubject =
    outcome.value[0];

  if (
    !isEligibleDurableSubject(
      durableSubject,
      authenticated.humanIpr,
    )
  ) {
    return unresolved(
      "DURABLE_SUBJECT_RECORD_INVALID",
    );
  }

  if (
    owner.ownerSubjectRef !==
      authenticated.humanIpr
  ) {
    return result(
      "MISMATCH",
      "EXACT_OWNER_MISMATCH",
      true,
    );
  }

  return result(
    "MATCH",
    "EXACT_OWNER_MATCH",
    true,
  );
}

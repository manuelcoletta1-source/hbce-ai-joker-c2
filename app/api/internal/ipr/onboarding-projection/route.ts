import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential,
} from "@/lib/api-auth";

import {
  validateIprOnboardingTrustedIngress,
} from "@/lib/ipr-onboarding-trusted-ingress";

import {
  evaluateAndRecordIprOnboardingReplay,
  markIprOnboardingReplayProfilePersisted,
} from "@/lib/ipr-onboarding-replay-store";

import {
  resolveIprOnboardingPreProfileAuthorityPolicy,
} from "@/lib/ipr-onboarding-authority-policy";

import {
  projectVerifiedOnboardingToIprAccountProfile,
} from "@/lib/ipr-onboarding-server-projection";

import {
  persistIprAccountProfileInTransaction,
} from "@/lib/ipr-account-store";

import {
  withHbceDatabaseTransaction,
} from "@/lib/ipr-database-transaction";


const ENDPOINT =
  "/api/internal/ipr/onboarding-projection";

const REQUIRED_SCOPE =
  "internal:ipr-onboarding:project";

const ENTITY_ENV =
  "HBCE_IPR_ONBOARDING_PROJECTION_ENTITY";


type ProjectionFailureCode =
  | "REQUEST_JSON_INVALID"
  | "ACCOUNT_ID_REQUIRED"
  | "ENTITY_REQUIRED"
  | "REPLAY_DENIED"
  | "PRE_PROFILE_POLICY_DENIED"
  | "SERVER_PROJECTION_DENIED"
  | "PROFILE_PERSISTENCE_FAILED"
  | "REPLAY_MARKER_FAILED";


class ProjectionTransactionError
  extends Error {
  readonly code:
    ProjectionFailureCode;

  readonly detail:
    string;

  constructor(
    code: ProjectionFailureCode,
    detail: string,
  ) {
    super(
      `${code}:${detail}`,
    );

    this.name =
      "ProjectionTransactionError";

    this.code =
      code;

    this.detail =
      detail;
  }
}


function normalizeText(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}


function requestIp(
  request: NextRequest,
): string | null {
  const forwarded =
    normalizeText(
      request.headers.get(
        "x-forwarded-for",
      ),
    );

  if (forwarded) {
    return (
      forwarded
        .split(",")[0]
        ?.trim() ||
      null
    );
  }

  return (
    normalizeText(
      request.headers.get(
        "x-real-ip",
      ),
    ) ||
    null
  );
}


function userAgent(
  request: NextRequest,
): string | null {
  return (
    normalizeText(
      request.headers.get(
        "user-agent",
      ),
    ) ||
    null
  );
}


function failClosed(
  status: number,
  code: string,
  detail: string,
  extra:
    Record<string, unknown> = {},
) {
  return NextResponse.json(
    {
      ok: false,
      status: code,
      detail,

      runtimeAuthorized: false,
      sessionAuthenticated: false,
      profilePersistenceAuthorized: false,
      legalCertification: false,

      ...extra,
    },
    {
      status,
    },
  );
}


export async function POST(
  request: NextRequest,
) {
  /*
   * WP02 boundary:
   * this endpoint may persist an eligible pre-profile projection.
   * It does not authenticate a Human IPR session, create cookies,
   * grant JOKER-C2 runtime authority or issue legal certification.
   */
  const auth =
    await validateHbceApiCredential({
      headers:
        request.headers,

      endpoint:
        ENDPOINT,

      method:
        "POST",

      requiredScopes: [
        REQUIRED_SCOPE,
      ],

      requestIp:
        requestIp(request),

      userAgent:
        userAgent(request),
    });

  if (!auth.ok) {
    return NextResponse.json(
      buildHbceApiAuthErrorBody(
        auth,
      ),
      {
        status:
          auth.httpStatus,

        headers:
          auth.httpStatus === 401
            ? {
                "WWW-Authenticate":
                  'Bearer realm="HBCE internal IPR onboarding projection", error="invalid_token"',
              }
            : {},
      },
    );
  }

  let envelope:
    unknown;

  try {
    envelope =
      await request.json();
  } catch {
    return failClosed(
      400,
      "REQUEST_JSON_INVALID",
      "The trusted onboarding projection envelope must be valid JSON.",
    );
  }

  const ingress =
    validateIprOnboardingTrustedIngress({
      auth,
      envelope,
    });

  if (!ingress.ok) {
    return failClosed(
      403,
      ingress.status,
      ingress.reason,
      {
        authority:
          ingress.authority,
      },
    );
  }

  const accountId =
    normalizeText(
      auth.credential.accountId,
    );

  if (!accountId) {
    return failClosed(
      503,
      "ACCOUNT_ID_REQUIRED",
      "The authenticated service credential must bind an explicit account identifier.",
    );
  }

  const entity =
    normalizeText(
      process.env[
        ENTITY_ENV
      ],
    );

  if (!entity) {
    return failClosed(
      503,
      "ENTITY_REQUIRED",
      `${ENTITY_ENV} must be explicitly configured server-side.`,
    );
  }

  const transaction =
    await withHbceDatabaseTransaction(
      async (context) => {
        const replay =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              context,
            ingress,
          });

        if (!replay.ok) {
          throw new ProjectionTransactionError(
            "REPLAY_DENIED",
            replay.reason,
          );
        }

        /*
         * An already persisted identical projection is idempotent.
         * No profile write and no new authority evaluation are required.
         */
        if (
          replay.replayDecision ===
          "IDEMPOTENT_REPLAY"
        ) {
          return {
            outcome:
              "IDEMPOTENT_REPLAY" as const,

            replay,

            runtimeAuthorized:
              false as const,

            sessionAuthenticated:
              false as const,

            profilePersistenceAuthorized:
              false as const,

            legalCertification:
              false as const,
          };
        }

        const policy =
          await resolveIprOnboardingPreProfileAuthorityPolicy({
            transaction:
              context,

            tenantId:
              ingress.service.tenantId,

            workspaceId:
              ingress.service.workspaceId,

            humanIprHash:
              replay.humanIprHash,

            projectionKey:
              ingress.projectionKey,

            payloadHash:
              ingress.payloadHash,

            issuerCredentialIdHash:
              replay.credentialIdHash,
          });

        if (!policy.ok) {
          throw new ProjectionTransactionError(
            "PRE_PROFILE_POLICY_DENIED",
            policy.reason,
          );
        }

        const projection =
          projectVerifiedOnboardingToIprAccountProfile({
            evidence:
              ingress.evidence,

            server: {
              tenantId:
                ingress.service.tenantId,

              workspaceId:
                ingress.service.workspaceId,

              accountId,
              entity,

              ...policy.serverPolicy,
            },
          });

        if (!projection.ok) {
          throw new ProjectionTransactionError(
            "SERVER_PROJECTION_DENIED",
            projection.reason,
          );
        }

        const persistence =
          await persistIprAccountProfileInTransaction({
            transaction:
              context,

            profileInput:
              projection.profileInput,
          });

        if (
          !persistence.profilePersisted ||
          !persistence.subjectPersisted
        ) {
          throw new ProjectionTransactionError(
            "PROFILE_PERSISTENCE_FAILED",
            "Transactional IPR subject/profile persistence did not positively confirm both writes.",
          );
        }

        const marker =
          await markIprOnboardingReplayProfilePersisted({
            transaction:
              context,

            projectionKey:
              ingress.projectionKey,

            payloadHash:
              ingress.payloadHash,
          });

        if (
          !marker.ok ||
          marker.projectionStatus !==
            "PROFILE_PERSISTED"
        ) {
          throw new ProjectionTransactionError(
            "REPLAY_MARKER_FAILED",
            "Replay receipt was not positively marked PROFILE_PERSISTED.",
          );
        }

        return {
          outcome:
            "PROFILE_PERSISTED" as const,

          replay,
          policy,
          projection,
          persistence,
          marker,

          runtimeAuthorized:
            false as const,

          sessionAuthenticated:
            false as const,

          /*
           * Persistence was authorized only inside this transaction.
           * This response does not carry continuing execution authority.
           */
          profilePersistenceAuthorized:
            false as const,

          legalCertification:
            false as const,
        };
      },
      {
        isolationLevel:
          "SERIALIZABLE",

        readOnly:
          false,

        statementTimeoutMs:
          30000,

        lockTimeoutMs:
          10000,

        idleInTransactionSessionTimeoutMs:
          30000,
      },
    );

  if (!transaction.ok) {
    const parts =
      transaction.error.split(
        ":",
        2,
      );

    const knownCodes =
      new Set<ProjectionFailureCode>([
        "REPLAY_DENIED",
        "PRE_PROFILE_POLICY_DENIED",
        "SERVER_PROJECTION_DENIED",
        "PROFILE_PERSISTENCE_FAILED",
        "REPLAY_MARKER_FAILED",
      ]);

    const candidateCode =
      parts[0] as
        ProjectionFailureCode;

    const code =
      knownCodes.has(
        candidateCode,
      )
        ? candidateCode
        : "PROFILE_PERSISTENCE_FAILED";

    const detail =
      parts[1] ||
      "The projection transaction failed closed and was not committed.";

    return failClosed(
      code ===
        "REPLAY_DENIED"
        ? 409
        : code ===
            "PRE_PROFILE_POLICY_DENIED" ||
          code ===
            "SERVER_PROJECTION_DENIED"
          ? 403
          : 500,
      code,
      detail,
      {
        transactionState:
          transaction.state,

        rollbackErrorPresent:
          Boolean(
            transaction.rollbackError,
          ),
      },
    );
  }

  if (
    transaction.value.outcome ===
    "IDEMPOTENT_REPLAY"
  ) {
    return NextResponse.json(
      {
        ok: true,

        status:
          "IDEMPOTENT_REPLAY_ACCEPTED",

        projectionStatus:
          transaction.value.replay
            .projectionStatus,

        replayCount:
          transaction.value.replay
            .replayCount,

        runtimeAuthorized:
          false,

        sessionAuthenticated:
          false,

        profilePersistenceAuthorized:
          false,

        legalCertification:
          false,
      },
      {
        status: 200,
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,

      status:
        "PROFILE_PERSISTED",

      projectionStatus:
        transaction.value.marker
          .projectionStatus,

      policyRecordId:
        transaction.value.policy
          .policyRecordId,

      evidenceHash:
        transaction.value.projection
          .evidenceHash,

      profileHash:
        transaction.value.persistence
          .profile.profileHash,

      runtimeAuthorized:
        false,

      sessionAuthenticated:
        false,

      profilePersistenceAuthorized:
        false,

      legalCertification:
        false,
    },
    {
      status: 201,
    },
  );
}

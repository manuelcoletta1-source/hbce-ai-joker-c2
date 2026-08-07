/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime State API
 *
 * Revision:
 * AIJC2-RUNTIME-STATE-API-v1_0
 *
 * Purpose:
 * - acquire governed repository evidence;
 * - build RuntimeSelfState from real repository data;
 * - expose a read-only runtime-state boundary;
 * - preserve explicit human authorization;
 * - preserve fail-closed governance;
 * - never mutate repository state;
 * - never persist raw source text;
 * - never perform automatic recall;
 * - never issue legal certification.
 *
 * legalCertification=false
 */

import {
  NextResponse,
} from "next/server";

import {
  executeRepositorySnapshotService,
  RepositorySnapshotServiceError,
} from "../../../../src/runtime/services/repository-snapshot.service";

import {
  buildRuntimeSelfStateFromRepository,
} from "../../../../src/runtime/state/runtime-self-state-from-repository";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const RUNTIME_STATE_API_REVISION =
  "AIJC2-RUNTIME-STATE-API-v1_0" as const;

interface RuntimeStateApiRequestBody {
  readonly owner?: string;

  readonly repository?: string;

  readonly branch?: string;

  readonly token?: string | null;

  readonly generatedAt?: string;

  readonly runtimeVersion?: string;

  readonly buildPassed?: boolean;

  readonly testsPassed?: boolean;

  readonly humanAuthorization?: boolean;

  readonly operatorAuthorized?: boolean;

  readonly legalCertification?: boolean;

  readonly sourceInspection?: {
    readonly enabled?: boolean;

    readonly authorizedPaths?: readonly string[];

    readonly maximumFiles?: number;

    readonly maximumFileBytes?: number;

    readonly maximumTotalBytes?: number;

    readonly allowedExtensions?: readonly string[];
  };
}

function jsonResponse(
  body: unknown,
  status:
    number,
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Runtime":
          "AI_JOKER_C2",

        "X-HBCE-Legal-Certification":
          "false",

        "X-HBCE-Runtime-State-Revision":
          RUNTIME_STATE_API_REVISION,
      },
    },
  );
}

function normalizeString(
  value:
    unknown,
  fallback:
    string,
): string {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    return fallback;
  }

  return value.trim();
}

function normalizeBoolean(
  value:
    unknown,
  fallback:
    boolean,
): boolean {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function normalizeOptionalToken(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : null;
}

function normalizeAuthorizedPaths(
  value:
    unknown,
): readonly string[] {
  if (
    !Array.isArray(value)
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    [
      ...new Set(
        value
          .filter(
            (
              item,
            ): item is string =>
              typeof item ===
                "string" &&
              item.trim().length >
                0,
          )
          .map(
            (item) =>
              item.trim(),
          ),
      ),
    ].sort(),
  );
}

function buildSourceInspection(
  body:
    RuntimeStateApiRequestBody,
) {
  const enabled =
    body.sourceInspection
      ?.enabled === true;

  const authorizedPaths =
    normalizeAuthorizedPaths(
      body.sourceInspection
        ?.authorizedPaths,
    );

  if (!enabled) {
    return undefined;
  }

  if (
    authorizedPaths.length ===
    0
  ) {
    throw new Error(
      "RUNTIME_STATE_API_AUTHORIZED_PATHS_REQUIRED",
    );
  }

  return {
    enabled:
      true,

    authorizedPaths,

    maximumFiles:
      body.sourceInspection
        ?.maximumFiles,

    maximumFileBytes:
      body.sourceInspection
        ?.maximumFileBytes,

    maximumTotalBytes:
      body.sourceInspection
        ?.maximumTotalBytes,

    allowedExtensions:
      body.sourceInspection
        ?.allowedExtensions,
  };
}

function assertLegalBoundary(
  body:
    RuntimeStateApiRequestBody,
): void {
  if (
    body.legalCertification ===
    true
  ) {
    throw new Error(
      "RUNTIME_STATE_API_LEGAL_BOUNDARY_VIOLATION",
    );
  }
}

function assertAuthorization(
  body:
    RuntimeStateApiRequestBody,
): void {
  if (
    body.humanAuthorization !==
    true
  ) {
    throw new Error(
      "RUNTIME_STATE_API_HUMAN_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    body.operatorAuthorized !==
    true
  ) {
    throw new Error(
      "RUNTIME_STATE_API_OPERATOR_AUTHORIZATION_REQUIRED",
    );
  }
}

export async function POST(
  request:
    Request,
) {
  const generatedAt =
    new Date()
      .toISOString();

  let body:
    RuntimeStateApiRequestBody;

  try {
    body =
      await request.json();
  } catch {
    return jsonResponse(
      {
        ok:
          false,

        status:
          "INVALID_REQUEST_BODY",

        revision:
          RUNTIME_STATE_API_REVISION,

        generatedAt,

        error:
          "RUNTIME_STATE_API_INVALID_JSON",

        legalCertification:
          false,
      },
      400,
    );
  }

  try {
    assertLegalBoundary(
      body,
    );

    assertAuthorization(
      body,
    );

    const owner =
      normalizeString(
        body.owner,
        "manuelcoletta1-source",
      );

    const repository =
      normalizeString(
        body.repository,
        "hbce-ai-joker-c2",
      );

    const branch =
      normalizeString(
        body.branch,
        "main",
      );

    const effectiveGeneratedAt =
      normalizeString(
        body.generatedAt,
        generatedAt,
      );

    const runtimeVersion =
      normalizeString(
        body.runtimeVersion,
        "AI_JOKER_C2_SAAS_CORE_v0_1",
      );

    const operationSeed =
      Date.now();

    const sourceInspection =
      buildSourceInspection(
        body,
      );

    const snapshot =
      await executeRepositorySnapshotService({
        identity: {
          humanIpr:
            "IPR-3",

          runtimeIpr:
            "IPR-AI-0001",

          tenantId:
            "HERMETICUM_BCE",

          workspaceId:
            "HBCE_RUNTIME_STATE",

          sessionId:
            `HBCE-RUNTIME-STATE-${operationSeed}`,
        },

        github: {
          owner,

          repository,

          branch,

          token:
            normalizeOptionalToken(
              body.token,
            ),

          maximumFiles:
            5000,
        },

        sourceInspection,

        mission:
          "Build governed AI JOKER-C2 RuntimeSelfState from real repository evidence.",

        operationId:
          `HBCE-RUNTIME-STATE-${operationSeed}`,

        idempotencyKey:
          `HBCE-RUNTIME-STATE-IDEMPOTENCY-${operationSeed}`,

        responseEvt:
          `EVT-RUNTIME-STATE-${operationSeed}`,

        opcId:
          null,

        humanAuthorization:
          true,

        legalCertification:
          false,
      });

    if (
      snapshot.ok !==
      true
    ) {
      return jsonResponse(
        {
          ok:
            false,

          status:
            "RUNTIME_STATE_REPOSITORY_SNAPSHOT_BLOCKED",

          revision:
            RUNTIME_STATE_API_REVISION,

          generatedAt:
            effectiveGeneratedAt,

          snapshot,

          error:
            "RUNTIME_STATE_API_REPOSITORY_SNAPSHOT_NOT_READY",

          legalCertification:
            false,
        },
        409,
      );
    }

    const state =
      buildRuntimeSelfStateFromRepository({
        generatedAt:
          effectiveGeneratedAt,

        runtimeVersion,

        repositorySnapshot:
          snapshot,

        buildPassed:
          normalizeBoolean(
            body.buildPassed,
            true,
          ),

        testsPassed:
          normalizeBoolean(
            body.testsPassed,
            true,
          ),

        operatorAuthorized:
          true,
      });

    return jsonResponse(
      {
        ok:
          true,

        status:
          "RUNTIME_STATE_READY",

        revision:
          RUNTIME_STATE_API_REVISION,

        generatedAt:
          effectiveGeneratedAt,

        repository: {
          owner:
            snapshot.repository
              .owner,

          repository:
            snapshot.repository
              .repositoryName,

          branch:
            snapshot.repository
              .branch,

          commit:
            snapshot.repository
              .commitSha,

          totalFiles:
            snapshot.snapshot
              .totalFiles,

          inspectedFiles:
            snapshot.snapshot
              .inspectedFiles,

          uninspectedFiles:
            snapshot.snapshot
              .uninspectedFiles,
        },

        state,

        governance: {
          deterministic:
            true,

          failClosed:
            true,

          repositoryReadOnly:
            true,

          humanAuthorizationRequired:
            true,

          automaticExecution:
            false,

          automaticPersistence:
            false,

          automaticRecall:
            false,

          automaticRepositoryMutation:
            false,

          rawContentPersistence:
            false,

          legalCertification:
            false,
        },

        legalCertification:
          false,
      },
      200,
    );
  } catch (error) {
    if (
      error instanceof
      RepositorySnapshotServiceError
    ) {
      return jsonResponse(
        {
          ok:
            false,

          status:
            "RUNTIME_STATE_FAIL_CLOSED",

          revision:
            RUNTIME_STATE_API_REVISION,

          generatedAt,

          error:
            error.code,

          message:
            error.message,

          causeCode:
            error.causeCode,

          legalCertification:
            false,
        },
        error.httpStatus ??
          500,
      );
    }

    return jsonResponse(
      {
        ok:
          false,

        status:
          "RUNTIME_STATE_FAIL_CLOSED",

        revision:
          RUNTIME_STATE_API_REVISION,

        generatedAt,

        error:
          error instanceof
            Error
            ? error.message
            : "RUNTIME_STATE_API_UNKNOWN_FAILURE",

        legalCertification:
          false,
      },
      400,
    );
  }
}

export async function GET() {
  return jsonResponse(
    {
      ok:
        true,

      status:
        "RUNTIME_STATE_API_READY",

      revision:
        RUNTIME_STATE_API_REVISION,

      generatedAt:
        new Date()
          .toISOString(),

      capabilities: {
        repositorySnapshot:
          true,

        governedSourceInspection:
          true,

        runtimeSelfStateProjection:
          true,

        automaticPersistence:
          false,

        automaticRecall:
          false,

        automaticRepositoryMutation:
          false,

        legalCertification:
          false,
      },

      legalCertification:
        false,
    },
    200,
  );
}

import { NextRequest, NextResponse } from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";

import {
  PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS,
  resolvePlatformCoreEvidenceSetOwnerBinding
} from "@/src/runtime/platform-core/evidence-set-owner-binding-resolver";

import {
  PlatformCoreEvidenceSetRepositoryError,
  readPlatformCoreCanonicalEvidenceSet
} from "@/src/runtime/platform-core/evidence-set-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    evidenceSetId?: string;
  }>;
};

const EVIDENCE_SET_ID_PATTERN = /^EVS-[0-9A-Z:\-_.]+$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

const FORBIDDEN_IDENTITY_QUERY_PARAMETERS = [
  "owner_subject_ref",
  "authenticatedHumanIpr",
  "humanIpr",
  "accountId",
  "subjectId",
  "subjectReferenceHash"
] as const;

function jsonNoStore(payload: unknown, status: number): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function errorResponse(status: number, reason: string): NextResponse {
  return jsonNoStore(
    {
      ok: false,
      reason
    },
    status
  );
}

function hasForbiddenIdentityOverride(request: NextRequest): boolean {
  return FORBIDDEN_IDENTITY_QUERY_PARAMETERS.some((parameter) =>
    request.nextUrl.searchParams.has(parameter)
  );
}

function parseEvidenceSetId(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length < 5 ||
    value.length > 128 ||
    !EVIDENCE_SET_ID_PATTERN.test(value)
  ) {
    return null;
  }

  return value;
}

function parseEvidenceSetVersion(request: NextRequest): number | null {
  const values = request.nextUrl.searchParams.getAll("version");

  if (values.length !== 1) {
    return null;
  }

  const value = values[0];

  if (!POSITIVE_INTEGER_PATTERN.test(value)) {
    return null;
  }

  const version = Number(value);

  if (!Number.isSafeInteger(version) || version <= 0) {
    return null;
  }

  return version;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (!sessionResolution.runtimeAuthorized) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED");
  }

  const authenticatedHumanIpr = sessionResolution.access.humanIpr;
  const authenticatedIdentityBinding =
    sessionResolution.access.identityBinding;

  if (
    authenticatedIdentityBinding !==
      PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS ||
    typeof authenticatedHumanIpr !== "string" ||
    authenticatedHumanIpr.length === 0
  ) {
    return errorResponse(403, "EVIDENCE_READ_FORBIDDEN");
  }

  if (hasForbiddenIdentityOverride(request)) {
    return errorResponse(400, "EVIDENCE_REQUEST_INVALID");
  }

  const params = await context.params;
  const evidenceSetId = parseEvidenceSetId(params.evidenceSetId);
  const evidenceSetVersion = parseEvidenceSetVersion(request);

  if (evidenceSetId === null || evidenceSetVersion === null) {
    return errorResponse(400, "EVIDENCE_REQUEST_INVALID");
  }

  let evidenceSet: Awaited<
    ReturnType<typeof readPlatformCoreCanonicalEvidenceSet>
  >;

  try {
    evidenceSet = await readPlatformCoreCanonicalEvidenceSet(
      evidenceSetId,
      evidenceSetVersion
    );
  } catch (error: unknown) {
    if (
      error instanceof PlatformCoreEvidenceSetRepositoryError &&
      error.code === "INVALID_INPUT"
    ) {
      return errorResponse(400, "EVIDENCE_REQUEST_INVALID");
    }

    return errorResponse(503, "EVIDENCE_READ_UNAVAILABLE");
  }

  if (evidenceSet === null) {
    return errorResponse(404, "EVIDENCE_NOT_FOUND");
  }

  let ownerBinding: Awaited<
    ReturnType<typeof resolvePlatformCoreEvidenceSetOwnerBinding>
  >;

  try {
    ownerBinding = await resolvePlatformCoreEvidenceSetOwnerBinding({
      authenticatedHumanIpr,
      authenticatedIdentityBinding,
      canonicalOwnerSubjectRef: evidenceSet.owner_subject_ref
    });
  } catch {
    return errorResponse(503, "EVIDENCE_READ_UNAVAILABLE");
  }

  if (ownerBinding.kind === "MISMATCH") {
    return errorResponse(404, "EVIDENCE_NOT_FOUND");
  }

  if (ownerBinding.kind !== "MATCH") {
    return errorResponse(503, "EVIDENCE_READ_UNAVAILABLE");
  }

  return jsonNoStore(evidenceSet, 200);
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const repositoryHarness = vi.hoisted(() => {
  class MockPlatformCoreEvidenceSetRepositoryError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "PlatformCoreEvidenceSetRepositoryError";
      this.code = code;
    }
  }

  return {
    ErrorClass: MockPlatformCoreEvidenceSetRepositoryError,
  };
});

vi.mock("@/lib/ipr-auth-session-resolver", () => ({
  resolveIprAccountSessionFromRequestAsync: vi.fn(),
}));

vi.mock(
  "@/src/runtime/platform-core/evidence-set-owner-binding-resolver",
  () => ({
    PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS:
      "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    resolvePlatformCoreEvidenceSetOwnerBinding: vi.fn(),
  }),
);

vi.mock("@/src/runtime/platform-core/evidence-set-repository", () => ({
  PlatformCoreEvidenceSetRepositoryError: repositoryHarness.ErrorClass,
  readPlatformCoreCanonicalEvidenceSet: vi.fn(),
}));

import { resolveIprAccountSessionFromRequestAsync } from "@/lib/ipr-auth-session-resolver";
import {
  PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS,
  resolvePlatformCoreEvidenceSetOwnerBinding,
} from "@/src/runtime/platform-core/evidence-set-owner-binding-resolver";
import {
  PlatformCoreEvidenceSetRepositoryError,
  readPlatformCoreCanonicalEvidenceSet,
} from "@/src/runtime/platform-core/evidence-set-repository";
import { GET } from "./route";

const AUTHENTICATED_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const EVIDENCE_SET_ID = "EVS-HTTP-TEST-001";
const VERIFIED_IDENTITY_BINDING =
  PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS;

const canonicalEvidenceSet = Object.freeze({
  evidence_set_id: EVIDENCE_SET_ID,
  evidence_set_version: 1,
  owner_subject_ref: AUTHENTICATED_HUMAN_IPR,
  state: "OPEN",
  payload_sha256: "a".repeat(64),
}) as any;

const sessionMock = vi.mocked(resolveIprAccountSessionFromRequestAsync);
const repositoryReadMock = vi.mocked(readPlatformCoreCanonicalEvidenceSet);
const ownerBindingMock = vi.mocked(resolvePlatformCoreEvidenceSetOwnerBinding);

function authorizedSession(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    authenticated: true,
    sessionAuthenticated: true,
    runtimeAuthorized: true,
    reason: "SESSION_ACTIVE",
    mode: "ASYNC_DATABASE_RESTORE",
    cookieName: "hbce_ipr_session",
    access: {
      decision: "ACCESS_GRANTED",
      scope: "JOKER_C2_ACCESS",
      identityBinding: VERIFIED_IDENTITY_BINDING,
      humanIpr: AUTHENTICATED_HUMAN_IPR,
      runtimeIpr: "IPR-AI-0001",
      accountId: "IPR-ACCOUNT-AAAAAAAAAAAAAAAAAAAAAAAA",
    },
    ...overrides,
  } as any;
}

function unauthenticatedSession() {
  return {
    ...authorizedSession(),
    authenticated: false,
    sessionAuthenticated: false,
    runtimeAuthorized: false,
    reason: "SESSION_COOKIE_MISSING",
    access: {
      decision: "AUTHENTICATION_REQUIRED",
      scope: "",
      identityBinding: "NO_AUTHENTICATED_IPR_SESSION",
    },
  } as any;
}

function ownerResult(kind: "MATCH" | "MISMATCH" | "UNRESOLVED") {
  return {
    protocol: "HBCE-EVIDENCE-OWNER-HUMAN-IPR-EXACT-v1",
    kind,
    reason:
      kind === "MATCH"
        ? "EXACT_OWNER_MATCH"
        : kind === "MISMATCH"
          ? "EXACT_OWNER_MISMATCH"
          : "DATABASE_FAILURE",
    durableSubjectConfirmed: kind !== "UNRESOLVED",
  } as any;
}

async function invokeRoute(input: {
  evidenceSetId?: string;
  query?: string;
} = {}) {
  const evidenceSetId = input.evidenceSetId ?? EVIDENCE_SET_ID;
  const query = input.query ? `?${input.query}` : "";
  const request = new NextRequest(
    `http://localhost/api/v1/runtime/evidence/${encodeURIComponent(
      evidenceSetId,
    )}${query}`,
  );

  return GET(request, {
    params: Promise.resolve({ evidenceSetId }),
  });
}

async function body(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function expectNoEvidencePayload(payload: Record<string, unknown>) {
  expect(payload.evidence_set_id).toBeUndefined();
  expect(payload.owner_subject_ref).toBeUndefined();
  expect(payload.payload_sha256).toBeUndefined();
}

describe("GET /api/v1/runtime/evidence/[evidenceSetId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue(authorizedSession());
    repositoryReadMock.mockResolvedValue(canonicalEvidenceSet);
    ownerBindingMock.mockResolvedValue(ownerResult("MATCH"));
  });

  it("H01 unauthenticated request returns 401 and repository is not called", async () => {
    sessionMock.mockResolvedValue(unauthenticatedSession());

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(401);
    expect(repositoryReadMock).not.toHaveBeenCalled();
    expectNoEvidencePayload(await body(response));
  });

  it("H02 runtimeAuthorized false returns 401 and repository is not called", async () => {
    sessionMock.mockResolvedValue(
      authorizedSession({ runtimeAuthorized: false }),
    );

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(401);
    expect(repositoryReadMock).not.toHaveBeenCalled();
  });

  it("H03 missing or wrong verified biological identity returns 403 before repository access", async () => {
    sessionMock.mockResolvedValue(
      authorizedSession({
        access: {
          ...authorizedSession().access,
          identityBinding: "IPR_ACCOUNT_AUTHENTICATED",
        },
      }),
    );

    expect((await invokeRoute({ query: "version=1" })).status).toBe(403);

    sessionMock.mockResolvedValue(
      authorizedSession({
        access: {
          ...authorizedSession().access,
          humanIpr: "",
        },
      }),
    );

    expect((await invokeRoute({ query: "version=1" })).status).toBe(403);
    expect(repositoryReadMock).not.toHaveBeenCalled();
  });

  it("H04 missing invalid duplicate or unsafe version returns 400 before repository access", async () => {
    for (const query of [
      "",
      "version=0",
      "version=-1",
      "version=1.5",
      "version=1&version=2",
      "version=9007199254740992",
    ]) {
      expect((await invokeRoute({ query })).status).toBe(400);
    }

    expect(repositoryReadMock).not.toHaveBeenCalled();
  });

  it("H05 forbidden client identity override parameters return 400", async () => {
    for (const name of [
      "owner_subject_ref",
      "authenticatedHumanIpr",
      "humanIpr",
      "accountId",
      "subjectId",
      "subjectReferenceHash",
    ]) {
      expect(
        (
          await invokeRoute({
            query: `version=1&${name}=CLIENT_VALUE`,
          })
        ).status,
      ).toBe(400);
    }

    expect(repositoryReadMock).not.toHaveBeenCalled();
  });

  it("H06 repository null returns 404 without canonical EvidenceSet payload", async () => {
    repositoryReadMock.mockResolvedValue(null);

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(404);
    expectNoEvidencePayload(await body(response));
    expect(ownerBindingMock).not.toHaveBeenCalled();
  });

  it("H07 repository errors fail closed without canonical EvidenceSet payload", async () => {
    repositoryReadMock.mockRejectedValueOnce(
      new PlatformCoreEvidenceSetRepositoryError(
        "DATABASE_FAILURE",
        "TEST_DATABASE_FAILURE",
      ),
    );

    const unavailable = await invokeRoute({ query: "version=1" });

    expect(unavailable.status).toBe(503);
    expectNoEvidencePayload(await body(unavailable));

    repositoryReadMock.mockRejectedValueOnce(
      new PlatformCoreEvidenceSetRepositoryError(
        "INVALID_INPUT",
        "TEST_INVALID_INPUT",
      ),
    );

    const invalid = await invokeRoute({ query: "version=1" });

    expect(invalid.status).toBe(400);
    expectNoEvidencePayload(await body(invalid));
  });

  it("H08 owner resolver MATCH returns 200 with the exact canonical EvidenceSet", async () => {
    ownerBindingMock.mockResolvedValue(ownerResult("MATCH"));

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(canonicalEvidenceSet);
    expect(repositoryReadMock).toHaveBeenCalledWith(EVIDENCE_SET_ID, 1);
  });

  it("H09 owner resolver MISMATCH returns 404 without canonical EvidenceSet payload", async () => {
    ownerBindingMock.mockResolvedValue(ownerResult("MISMATCH"));

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(404);
    expectNoEvidencePayload(await body(response));
  });

  it("H10 owner resolver UNRESOLVED returns 503 without canonical EvidenceSet payload", async () => {
    ownerBindingMock.mockResolvedValue(ownerResult("UNRESOLVED"));

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(503);
    expectNoEvidencePayload(await body(response));
  });

  it("H11 successful and denied responses preserve Cache-Control no-store", async () => {
    const success = await invokeRoute({ query: "version=1" });

    expect(success.headers.get("Cache-Control")).toBe("no-store, max-age=0");

    sessionMock.mockResolvedValue(unauthenticatedSession());

    const denied = await invokeRoute({ query: "version=1" });

    expect(denied.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });

  it("H12 owner authorization uses server Human IPR plus canonical owner and never substitutes other identity material", async () => {
    sessionMock.mockResolvedValue(
      authorizedSession({
        humanAuthorityIpr: "IPR-3",
        access: {
          ...authorizedSession().access,
          accountId: "IPR-ACCOUNT-BBBBBBBBBBBBBBBBBBBBBBBB",
        },
      }),
    );

    const response = await invokeRoute({ query: "version=1" });

    expect(response.status).toBe(200);
    expect(ownerBindingMock).toHaveBeenCalledTimes(1);
    expect(ownerBindingMock).toHaveBeenCalledWith({
      authenticatedHumanIpr: AUTHENTICATED_HUMAN_IPR,
      authenticatedIdentityBinding: VERIFIED_IDENTITY_BINDING,
      canonicalOwnerSubjectRef: AUTHENTICATED_HUMAN_IPR,
    });
    expect(JSON.stringify(ownerBindingMock.mock.calls)).not.toContain("IPR-3");
  });
});

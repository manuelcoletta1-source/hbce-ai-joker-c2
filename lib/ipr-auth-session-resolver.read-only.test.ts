import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifySessionReadOnly: vi.fn(),
  profileReadOnly: vi.fn(),
  describeAuthStore: vi.fn(),
  describeAccountStore: vi.fn(),
  getDefaultAuthStore: vi.fn(),
  getDefaultAccountStore: vi.fn()
}));

vi.mock("./ipr-session-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ipr-session-store")>();

  return {
    ...actual,
    describeDefaultIprAuthStore: mocks.describeAuthStore,
    getDefaultIprAuthStore: mocks.getDefaultAuthStore,
    verifyDatabasePersistentIprSessionTokenReadOnly:
      mocks.verifySessionReadOnly
  };
});

vi.mock("./ipr-account-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ipr-account-store")>();

  return {
    ...actual,
    describeDefaultIprAccountStore: mocks.describeAccountStore,
    getDefaultIprAccountStore: mocks.getDefaultAccountStore,
    getDatabasePersistentIprAccountProfileReadOnly:
      mocks.profileReadOnly
  };
});

import { IPR_AUTH_COOKIE_NAME } from "./ipr-auth";
import { resolveIprAuthSessionReadOnly } from "./ipr-auth-session-resolver";

function request(token?: string): NextRequest {
  return new NextRequest(
    "https://hbce.example/api/v1/runtime/diagnostics",
    {
      headers: token
        ? {
            cookie: `${IPR_AUTH_COOKIE_NAME}=${token}`
          }
        : undefined
    }
  );
}

function activeSession() {
  return {
    sessionId: "HBCE-SESSION-READ-ONLY-TEST",
    humanIpr: "IPR-3",
    runtimeIpr: "IPR-AI-0001",
    status: "ACTIVE",
    createdAt: "2026-09-12T10:00:00.000Z",
    expiresAt: "2026-09-13T10:00:00.000Z",
    revokedAt: null,
    lastSeenAt: null,
    deviceLabel: null,
    userAgentHash: null,
    ipAddressHash: null,
    sessionPayload: {
      accountId: "HBCE-ACCOUNT-TEST",
      profileId: "HBCE-PROFILE-TEST",
      certificateId: "HBCE-CERTIFICATE-TEST",
      cardSerial: "HBCE-CARD-TEST"
    },
    legalCertification: false
  } as any;
}

function profile() {
  return {
    humanIpr: "IPR-3",
    tenantId: "HBCE-TENANT-TEST",
    workspaceId: "HBCE-WORKSPACE-TEST",
    accountId: "HBCE-ACCOUNT-TEST",
    entity: "HUMAN",
    subjectKind: "HUMAN",
    certificateId: "HBCE-CERTIFICATE-TEST",
    certificateKind: "IPR",
    certificateStatus: "ACTIVE",
    certificateScope: [],
    cardSerial: "HBCE-CARD-TEST",
    certificateHash: "a".repeat(64),
    accessDecision: "ALLOW",
    accessScope: "JOKER_C2_ACCESS",
    identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: "MATRIX_ACTIVE",
    semanticMemoryScope: "IPR_BOUND",
    source: "HBCE_TEST",
    handoffHash: "b".repeat(64),
    profileHash: "c".repeat(64),
    createdAt: "2026-09-12T10:00:00.000Z",
    updatedAt: "2026-09-12T10:00:00.000Z",
    lastLoginAt: null,
    profilePayload: {},
    legalCertification: false
  } as any;
}

function activeVerification() {
  return {
    ok: true,
    authenticated: true,
    reason: "SESSION_ACTIVE",
    session: activeSession()
  } as any;
}

function expectNoProcessFallback() {
  expect(mocks.getDefaultAuthStore).not.toHaveBeenCalled();
  expect(mocks.getDefaultAccountStore).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.describeAuthStore.mockReturnValue({
    name: "TEST_READ_ONLY_AUTH_STORE"
  });
  mocks.describeAccountStore.mockReturnValue({
    name: "TEST_READ_ONLY_ACCOUNT_STORE"
  });

  mocks.getDefaultAuthStore.mockImplementation(() => {
    throw new Error("PROCESS_AUTH_FALLBACK_FORBIDDEN");
  });
  mocks.getDefaultAccountStore.mockImplementation(() => {
    throw new Error("PROCESS_ACCOUNT_FALLBACK_FORBIDDEN");
  });
});

describe("dedicated DATABASE_PERSISTENT read-only auth resolver", () => {
  it("returns SESSION_COOKIE_MISSING without invoking persistent authorities", async () => {
    const result = await resolveIprAuthSessionReadOnly(request());

    expect(result.reason).toBe("SESSION_COOKIE_MISSING");
    expect(result.authenticated).toBe(false);
    expect(result.runtimeAuthorized).toBe(false);
    expect(result.mode).toBe("ASYNC_DATABASE_RESTORE");
    expect(mocks.verifySessionReadOnly).not.toHaveBeenCalled();
    expect(mocks.profileReadOnly).not.toHaveBeenCalled();
    expectNoProcessFallback();
  });

  it("propagates session database errors fail closed", async () => {
    mocks.verifySessionReadOnly.mockRejectedValue(
      new Error("HBCE_TEST_SESSION_DATABASE_FAILURE")
    );

    await expect(
      resolveIprAuthSessionReadOnly(request("TOKEN-SESSION-DB-FAIL"))
    ).rejects.toThrow("HBCE_TEST_SESSION_DATABASE_FAILURE");

    expect(mocks.profileReadOnly).not.toHaveBeenCalled();
    expectNoProcessFallback();
  });

  it("denies revoked and expired sessions without profile lookup", async () => {
    for (const reason of ["SESSION_REVOKED", "SESSION_EXPIRED"] as const) {
      vi.clearAllMocks();
      mocks.describeAuthStore.mockReturnValue({
        name: "TEST_READ_ONLY_AUTH_STORE"
      });
      mocks.describeAccountStore.mockReturnValue({
        name: "TEST_READ_ONLY_ACCOUNT_STORE"
      });

      mocks.verifySessionReadOnly.mockResolvedValue({
        ok: false,
        authenticated: false,
        reason,
        session: {
          ...activeSession(),
          status: reason === "SESSION_REVOKED" ? "REVOKED" : "EXPIRED",
          revokedAt:
            reason === "SESSION_REVOKED"
              ? "2026-09-12T11:00:00.000Z"
              : null
        }
      });

      const result =
        await resolveIprAuthSessionReadOnly(request(`TOKEN-${reason}`));

      expect(result.reason).toBe(reason);
      expect(result.authenticated).toBe(false);
      expect(result.runtimeAuthorized).toBe(false);
      expect(mocks.profileReadOnly).not.toHaveBeenCalled();
      expectNoProcessFallback();
    }
  });

  it("propagates profile database errors fail closed", async () => {
    mocks.verifySessionReadOnly.mockResolvedValue(activeVerification());
    mocks.profileReadOnly.mockRejectedValue(
      new Error("HBCE_TEST_PROFILE_DATABASE_FAILURE")
    );

    await expect(
      resolveIprAuthSessionReadOnly(request("TOKEN-PROFILE-DB-FAIL"))
    ).rejects.toThrow("HBCE_TEST_PROFILE_DATABASE_FAILURE");

    expect(mocks.profileReadOnly).toHaveBeenCalledTimes(1);
    expectNoProcessFallback();
  });

  it("preserves candidate order and stops at the first authoritative profile", async () => {
    mocks.verifySessionReadOnly.mockResolvedValue(activeVerification());
    mocks.profileReadOnly
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile());

    const result =
      await resolveIprAuthSessionReadOnly(request("TOKEN-FIRST-PROFILE"));

    expect(
      mocks.profileReadOnly.mock.calls.map(([input]) => input.strategy)
    ).toEqual(["humanIpr", "accountId", "profileId"]);
    expect(mocks.profileReadOnly).toHaveBeenCalledTimes(3);
    expect(result.reason).toBe("SESSION_ACTIVE");
    expect(result.profileLookup.found).toBe(true);
    expect(result.profileLookup.matchedStrategy).toBe("profileId");
    expect(result.profileLookup.attempts.map((attempt) => attempt.strategy))
      .toEqual(["humanIpr", "accountId", "profileId"]);
    expectNoProcessFallback();
  });

  it("returns IPR_ACCOUNT_PROFILE_NOT_FOUND after all five authoritative misses", async () => {
    mocks.verifySessionReadOnly.mockResolvedValue(activeVerification());
    mocks.profileReadOnly.mockResolvedValue(null);

    const result =
      await resolveIprAuthSessionReadOnly(request("TOKEN-ALL-PROFILE-MISS"));

    expect(
      mocks.profileReadOnly.mock.calls.map(([input]) => input.strategy)
    ).toEqual([
      "humanIpr",
      "accountId",
      "profileId",
      "certificateId",
      "cardSerial"
    ]);
    expect(result.reason).toBe("IPR_ACCOUNT_PROFILE_NOT_FOUND");
    expect(result.authenticated).toBe(false);
    expect(result.sessionAuthenticated).toBe(true);
    expect(result.runtimeAuthorized).toBe(false);
    expect(result.profileLookup.attempted).toBe(true);
    expect(result.profileLookup.found).toBe(false);
    expect(result.profileLookup.attempts).toHaveLength(5);
    expectNoProcessFallback();
  });
});

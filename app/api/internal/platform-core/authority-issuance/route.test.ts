import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { buildHbceApiAuthErrorBody, validateHbceApiCredential } from "@/lib/api-auth";
import { issuePlatformCoreCanonicalAuthorityGenesis } from "@/src/runtime/platform-core/authority-issuance.service";

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return { ...actual, validateHbceApiCredential: vi.fn(), buildHbceApiAuthErrorBody: vi.fn() };
});

vi.mock("@/src/runtime/platform-core/authority-issuance.service", () => ({
  issuePlatformCoreCanonicalAuthorityGenesis: vi.fn(),
}));

import { POST } from "./route";

const ENDPOINT = "/api/internal/platform-core/authority-issuance";
const SCOPE = "internal:platform-core:authority-issue";
const REVISION = "HBCE-PLATFORM-CORE-AUTHORITY-ISSUANCE-ROUTE-v1.0";

const grantedAuth = {
  ok: true,
  status: "API_AUTH_GRANTED",
  credential: {
    credentialId: "CRED-AUTHORITY-001",
    tenantId: "TENANT-001",
    workspaceId: "WORKSPACE-001",
    scopes: [SCOPE],
  },
  endpoint: ENDPOINT,
  method: "POST",
  requiredScopes: [SCOPE],
} as any;

const deniedAuth = {
  ok: false,
  status: "API_AUTH_DENIED",
  failReason: "API_CREDENTIAL_REQUIRED",
  httpStatus: 401,
} as any;

function authorityInput() {
  return {
    authority_id: "AUT-TEST-001",
    principal_ref: "IPR-TEST-001",
    actor_ref: "IPR-TEST-001",
    mandate_ref: "MANDATE-TEST-001",
    mandate_version: 1,
    capability_ref: "CAP-TEST-001",
    capability_version: 1,
    authority_source: {
      source_type: "HUMAN_GRANT",
      source_ref: "GRANT-TEST-001",
      source_sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    scope: {
      action_classes: ["TEST_ACTION"],
      target_refs: ["TARGET-001"],
      iospace_refs: [],
      constraint_refs: [],
    },
    limits: {
      policy_refs: [],
      quantitative_limit_refs: [],
      condition_refs: [],
    },
    state: "ACTIVE",
    valid_from: "2026-09-11T00:00:00.000Z",
    valid_until: null,
    created_at: "2026-09-11T00:00:00.000Z",
    updated_at: "2026-09-11T00:00:00.000Z",
    evidence_state: "PRESENT",
    evidence_reference: "EVIDENCE-TEST-001",
    genealogy: {
      cause: "TEST_GENESIS",
      evidence_reference: "EVIDENCE-TEST-001",
      timestamp: "2026-09-11T00:00:00.000Z",
    },
  };
}

function requestFor(body: unknown) {
  return new NextRequest(`http://localhost${ENDPOINT}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const newPersistence = Object.freeze({
  authority: Object.freeze({
    authority_id: "AUT-TEST-001",
    authority_version: 1,
    payload_sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    state: "ACTIVE",
  }),
  persistedAt: "2026-09-11T12:00:00.000Z",
  idempotentReplay: false,
}) as unknown as Awaited<ReturnType<typeof issuePlatformCoreCanonicalAuthorityGenesis>>;

const replayPersistence = Object.freeze({
  ...newPersistence,
  idempotentReplay: true,
}) as unknown as Awaited<ReturnType<typeof issuePlatformCoreCanonicalAuthorityGenesis>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(validateHbceApiCredential).mockResolvedValue(grantedAuth);
  vi.mocked(buildHbceApiAuthErrorBody).mockReturnValue({
    ok: false,
    status: "API_AUTH_DENIED",
    failReason: "API_CREDENTIAL_REQUIRED",
    legalCertification: false,
  });
  vi.mocked(issuePlatformCoreCanonicalAuthorityGenesis).mockResolvedValue(newPersistence);
});

describe("POST /api/internal/platform-core/authority-issuance", () => {
  it("fails closed on denied API authentication and never issues authority", async () => {
    vi.mocked(validateHbceApiCredential).mockResolvedValueOnce(deniedAuth);
    const response = await POST(requestFor(authorityInput()));
    expect(response.status).toBe(401);
    expect(buildHbceApiAuthErrorBody).toHaveBeenCalledTimes(1);
    expect(buildHbceApiAuthErrorBody).toHaveBeenCalledWith(deniedAuth);
    expect(issuePlatformCoreCanonicalAuthorityGenesis).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before authority issuance", async () => {
    const request = new NextRequest(`http://localhost${ENDPOINT}`, {
      method: "POST",
      body: "{",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      status: "AUTHORITY_ISSUANCE_DENIED",
      reason: "AUTHORITY_GENESIS_INPUT_REQUIRED",
      legalCertification: false,
    });
    expect(issuePlatformCoreCanonicalAuthorityGenesis).not.toHaveBeenCalled();
  });

  it("uses the exact endpoint method and dedicated scope and returns 201 for new persistence", async () => {
    const input = authorityInput();
    const response = await POST(requestFor(input));
    expect(validateHbceApiCredential).toHaveBeenCalledTimes(1);
    expect(validateHbceApiCredential).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: ENDPOINT,
      method: "POST",
      requiredScopes: [SCOPE],
    }));
    expect(issuePlatformCoreCanonicalAuthorityGenesis).toHaveBeenCalledTimes(1);
    expect(issuePlatformCoreCanonicalAuthorityGenesis).toHaveBeenCalledWith(input);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-hbce-route-revision")).toBe(REVISION);
    expect(response.headers.get("x-hbce-legal-certification")).toBe("false");
    expect(await response.json()).toEqual({
      ok: true,
      status: "AUTHORITY_ISSUANCE_PERSISTED",
      authority: newPersistence.authority,
      persistedAt: newPersistence.persistedAt,
      idempotentReplay: false,
      legalCertification: false,
    });
  });

  it("returns 200 for an idempotent replay", async () => {
    vi.mocked(issuePlatformCoreCanonicalAuthorityGenesis).mockResolvedValueOnce(replayPersistence);
    const response = await POST(requestFor(authorityInput()));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      status: "AUTHORITY_ISSUANCE_PERSISTED",
      idempotentReplay: true,
      legalCertification: false,
    });
  });

  it("propagates authority issuance failure unchanged", async () => {
    const failure = new Error("AUTHORITY_ISSUANCE_TEST_FAILURE");
    vi.mocked(issuePlatformCoreCanonicalAuthorityGenesis).mockRejectedValueOnce(failure);
    await expect(POST(requestFor(authorityInput()))).rejects.toBe(failure);
  });

  it("forwards caller JSON without deriving or adding authority material", async () => {
    const input = authorityInput();
    await POST(requestFor(input));
    expect(issuePlatformCoreCanonicalAuthorityGenesis).toHaveBeenCalledTimes(1);
    expect(issuePlatformCoreCanonicalAuthorityGenesis).toHaveBeenCalledWith(input);
    expect(input).not.toHaveProperty("verifiedSubject");
    expect(input).not.toHaveProperty("verified_subject");
  });
});

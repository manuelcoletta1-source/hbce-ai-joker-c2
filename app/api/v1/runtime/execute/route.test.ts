import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential,
} from "@/lib/api-auth";

import {
  bootstrapRuntime,
} from "@/lib/runtime/bootstrap";

import {
  buildPlatformCoreCanonicalAuthorization,
  PlatformCoreCanonicalAuthorizationBuilderError,
} from "@/src/runtime/platform-core/canonical-authorization-builder";

import {
  resolvePlatformCoreProductionAuthorizationAuthority,
} from "@/src/runtime/platform-core/production-authorization-authority-resolver";

vi.mock("@/lib/api-auth", () => ({
  validateHbceApiCredential: vi.fn(),
  buildHbceApiAuthErrorBody: vi.fn(),
}));

vi.mock("@/lib/runtime/bootstrap", () => ({
  bootstrapRuntime: vi.fn(),
}));

vi.mock(
  "@/src/runtime/platform-core/canonical-authorization-builder",
  async () => {
    const actual =
      await vi.importActual<
        typeof import("@/src/runtime/platform-core/canonical-authorization-builder")
      >("@/src/runtime/platform-core/canonical-authorization-builder");

    return {
      ...actual,
      buildPlatformCoreCanonicalAuthorization: vi.fn(),
    };
  },
);

vi.mock(
  "@/src/runtime/platform-core/production-authorization-authority-resolver",
  () => ({
    resolvePlatformCoreProductionAuthorizationAuthority: vi.fn(),
  }),
);

import { POST } from "./route";

const ENDPOINT = "/api/v1/runtime/execute";
const SCOPE = "v1:runtime:execute";

const grantedAuth = {
  ok: true,
  status: "API_AUTH_GRANTED",
  credential: {
    credentialId: "CRED-RUNTIME-001",
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

const runtimeInput = {
  mission: {
    missionId: "MISSION-TEST-001",
  },
  claims: [],
  sources: [],
  layers: [],
};

const canonicalAuthorizationSource = {
  authorization_id: "AZN-TEST-001",
};

const canonicalAuthorization = {
  authorization_id: "AZN-TEST-001",
  authority_ref: "AUT-TEST-001",
  authority_version: 1,
} as any;

const resolvedAuthority = {
  protocol: "HBCE-PLATFORM-CORE-PRODUCTION-AUTHORIZATION-AUTHORITY-RESOLVER-v1",
  kind: "RESOLVED",
  authority: {},
  usability: {
    usable: true,
    reason: "AUTHORITY_USABLE",
  },
} as any;

function requestFor(
  body: unknown,
): NextRequest {
  return new NextRequest(
    `http://localhost${ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

function envelope() {
  return {
    runtimeInput,
    canonicalAuthorizationSource,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(
    validateHbceApiCredential,
  ).mockResolvedValue(
    grantedAuth,
  );

  vi.mocked(
    buildHbceApiAuthErrorBody,
  ).mockReturnValue({
    ok: false,
    status: "API_AUTH_DENIED",
    failReason: "API_CREDENTIAL_REQUIRED",
    legalCertification: false,
  });

  vi.mocked(
    buildPlatformCoreCanonicalAuthorization,
  ).mockReturnValue(
    canonicalAuthorization,
  );

  vi.mocked(
    resolvePlatformCoreProductionAuthorizationAuthority,
  ).mockResolvedValue(
    resolvedAuthority,
  );

  vi.mocked(
    bootstrapRuntime,
  ).mockReturnValue({
    authorized: true,
    failClosed: false,
    reason: "SUCCESS",
  } as any);
});

describe("POST /api/v1/runtime/execute control-plane ingress", () => {
  it("R2BI01 denies API auth before request-body processing", async () => {
    vi.mocked(
      validateHbceApiCredential,
    ).mockResolvedValueOnce(
      deniedAuth,
    );

    const request =
      new NextRequest(
        `http://localhost${ENDPOINT}`,
        {
          method: "POST",
          body: "{",
        },
      );

    const response =
      await POST(request);

    expect(response.status).toBe(401);
    expect(
      buildHbceApiAuthErrorBody,
    ).toHaveBeenCalledWith(
      deniedAuth,
    );
    expect(
      buildPlatformCoreCanonicalAuthorization,
    ).not.toHaveBeenCalled();
    expect(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).not.toHaveBeenCalled();
    expect(
      bootstrapRuntime,
    ).not.toHaveBeenCalled();
  });

  it("R2BI02 returns 400 for malformed JSON before build resolve or bootstrap", async () => {
    const response =
      await POST(
        new NextRequest(
          `http://localhost${ENDPOINT}`,
          {
            method: "POST",
            body: "{",
          },
        ),
      );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      failClosed: true,
      reason: "RUNTIME_EXECUTION_INPUT_REQUIRED",
    });
    expect(
      buildPlatformCoreCanonicalAuthorization,
    ).not.toHaveBeenCalled();
    expect(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).not.toHaveBeenCalled();
    expect(
      bootstrapRuntime,
    ).not.toHaveBeenCalled();
  });

  it("R2BI03 returns 400 for canonical authorization builder rejection", async () => {
    vi.mocked(
      buildPlatformCoreCanonicalAuthorization,
    ).mockImplementationOnce(
      () => {
        throw new PlatformCoreCanonicalAuthorizationBuilderError(
          "INVALID_INPUT",
          "test",
        );
      },
    );

    const response =
      await POST(
        requestFor(
          envelope(),
        ),
      );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      reason: "CANONICAL_AUTHORIZATION_INVALID",
      failClosed: true,
    });
    expect(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).not.toHaveBeenCalled();
    expect(
      bootstrapRuntime,
    ).not.toHaveBeenCalled();
  });

  it("R2BI04 collapses durable Authority NOT_FOUND to generic 403", async () => {
    vi.mocked(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).mockResolvedValueOnce({
      protocol:
        "HBCE-PLATFORM-CORE-PRODUCTION-AUTHORIZATION-AUTHORITY-RESOLVER-v1",
      kind: "NOT_FOUND",
      authority: null,
      usability: null,
    });

    const response =
      await POST(
        requestFor(
          envelope(),
        ),
      );

    const body =
      await response.json();

    expect(response.status).toBe(403);
    expect(body.reason).toBe(
      "AUTHORITY_GATE_DENIED",
    );
    expect(body).not.toHaveProperty(
      "authority",
    );
    expect(body).not.toHaveProperty(
      "authorization",
    );
    expect(
      bootstrapRuntime,
    ).not.toHaveBeenCalled();
  });

  it("R2BI05 collapses durable Authority NOT_USABLE to generic 403 without reason leak", async () => {
    vi.mocked(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).mockResolvedValueOnce({
      protocol:
        "HBCE-PLATFORM-CORE-PRODUCTION-AUTHORIZATION-AUTHORITY-RESOLVER-v1",
      kind: "NOT_USABLE",
      authority: {} as any,
      usability: {
        usable: false,
        reason:
          "AUTHORITY_EXPIRED_AT_DECISION",
      } as any,
    });

    const response =
      await POST(
        requestFor(
          envelope(),
        ),
      );

    const body =
      await response.json();

    expect(response.status).toBe(403);
    expect(body.reason).toBe(
      "AUTHORITY_GATE_DENIED",
    );
    expect(
      JSON.stringify(body),
    ).not.toContain(
      "AUTHORITY_EXPIRED_AT_DECISION",
    );
    expect(body).not.toHaveProperty(
      "authority",
    );
    expect(
      bootstrapRuntime,
    ).not.toHaveBeenCalled();
  });

  it("R2BI06 fails closed with generic 500 when durable resolver throws", async () => {
    vi.mocked(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).mockRejectedValueOnce(
      new Error(
        "DATABASE_FAILURE",
      ),
    );

    const response =
      await POST(
        requestFor(
          envelope(),
        ),
      );

    const body =
      await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      failClosed: true,
      error: "RUNTIME_EXECUTION_FAILED",
    });
    expect(
      JSON.stringify(body),
    ).not.toContain(
      "DATABASE_FAILURE",
    );
    expect(
      bootstrapRuntime,
    ).not.toHaveBeenCalled();
  });

  it("R2BI07 resolves Authority then forwards exact runtimeInput and returns 200", async () => {
    const input =
      envelope();

    const response =
      await POST(
        requestFor(input),
      );

    expect(
      buildPlatformCoreCanonicalAuthorization,
    ).toHaveBeenCalledWith(
      canonicalAuthorizationSource,
    );
    expect(
      resolvePlatformCoreProductionAuthorizationAuthority,
    ).toHaveBeenCalledWith(
      canonicalAuthorization,
    );
    expect(
      bootstrapRuntime,
    ).toHaveBeenCalledWith(
      input.runtimeInput,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      execution: {
        failClosed: false,
        reason: "SUCCESS",
      },
    });
  });

  it("R2BI08 preserves runtime fail-closed as HTTP 400", async () => {
    vi.mocked(
      bootstrapRuntime,
    ).mockReturnValueOnce({
      authorized: false,
      failClosed: true,
      reason: "MISSION_NOT_AUTHORIZED",
    } as any);

    const response =
      await POST(
        requestFor(
          envelope(),
        ),
      );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      execution: {
        failClosed: true,
        reason:
          "MISSION_NOT_AUTHORIZED",
      },
    });
  });

  it("R2BI09 supplies exact endpoint method and dedicated scope to API auth", async () => {
    await POST(
      requestFor(
        envelope(),
      ),
    );

    expect(
      validateHbceApiCredential,
    ).toHaveBeenCalledTimes(1);
    expect(
      validateHbceApiCredential,
    ).toHaveBeenCalledWith({
      headers:
        expect.any(Headers),
      endpoint:
        ENDPOINT,
      method:
        "POST",
      requiredScopes: [
        SCOPE,
      ],
    });
  });
});

import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  NextRequest
} from "next/server";


const mocks = vi.hoisted(() => ({
  resolveSession:
    vi.fn(),

  resolveClientIp:
    vi.fn(),

  inspectAsync:
    vi.fn(),

  recordFailureAsync:
    vi.fn(),

  resetIprIpAfterSuccessAsync:
    vi.fn(),

  resolveReadOnly:
    vi.fn(),

  inspectPhysicalSchema:
    vi.fn()

}));


vi.mock(
  "@/lib/ipr-auth-session-resolver",
  () => ({
    resolveIprAccountSessionFromRequestAsync:
      mocks.resolveSession,

    resolveIprAuthSessionReadOnly:
      mocks.resolveReadOnly
  })
);


vi.mock(
  "@/lib/ipr-database-physical-proof",
  () => ({
    inspectIprDatabasePhysicalSchema:
      mocks.inspectPhysicalSchema
  })
);


vi.mock(
  "@/lib/ipr-auth-rate-limit-store",
  () => ({
    IPR_AUTH_RATE_LIMIT_BOUNDARY: {
      revision:
        "HBCE-IPR-AUTH-RATE-LIMIT-v1_0",

      schemaVersion:
        "HBCE-IPR-DB-v1.12",

      table:
        "ipr_auth_rate_limit_buckets",

      ipPolicy: {
        maxFailedAttempts: 20,
        windowSeconds: 900,
        blockSeconds: 900
      },

      iprIpPolicy: {
        maxFailedAttempts: 5,
        windowSeconds: 900,
        blockSeconds: 900
      },

      globalIpResetOnSuccessfulLogin:
        false,

      iprIpResetOnSuccessfulLogin:
        true,

      rawIpPersistence:
        false,

      rawHumanIprPersistence:
        false,

      rawUserAgentPersistence:
        false,

      sessionCreationAuthority:
        false,

      runtimeAuthorizationAuthority:
        false,

      credentialBypassAuthority:
        false,

      legalCertification:
        false
    },

    resolveIprAuthRateLimitClientIp:
      mocks.resolveClientIp,

    getDefaultIprAuthRateLimitStore:
      () => ({
        inspectAsync:
          mocks.inspectAsync,

        recordFailureAsync:
          mocks.recordFailureAsync,

        resetIprIpAfterSuccessAsync:
          mocks.resetIprIpAfterSuccessAsync
      })
  })
);


import {
  GET
} from "./route";


function authenticatedResolution() {
  return {
    ok: true,
    authenticated: true,
    sessionAuthenticated: true,
    runtimeAuthorized: true,

    reason:
      "SESSION_ACTIVE",

    access: {
      decision:
        "ACCESS_GRANTED",

      scope:
        "JOKER_C2_ACCESS",

      identityBinding:
        "IPR_VERIFIED_BIOLOGICAL_SUBJECT",

      humanIpr:
        "IPR-TEST-C5X"
    },

    session: {
      humanIpr:
        "IPR-TEST-C5X"
    }
  };
}


function unauthenticatedResolution() {
  return {
    ok: true,
    authenticated: false,
    sessionAuthenticated: false,
    runtimeAuthorized: false,

    reason:
      "SESSION_COOKIE_MISSING",

    access: {
      decision:
        "AUTHENTICATION_REQUIRED",

      scope:
        "NONE",

      identityBinding:
        "NONE"
    },

    session:
      null
  };
}


function request(): NextRequest {
  return new NextRequest(
    "https://hbce.example/api/v1/runtime/diagnostics?mode=auth-rate-limit-runtime-proof",
    {
      method: "GET",
      headers: {
        "x-forwarded-for":
          "198.51.100.77"
      }
    }
  );
}


describe(
  "HBCE C5X authenticated runtime diagnostic",
  () => {

    beforeEach(() => {
      vi.clearAllMocks();

      mocks.resolveClientIp
        .mockReturnValue(
          "198.51.100.77"
        );
    });


    it(
      "requires an authenticated runtime session",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            unauthenticatedResolution()
          );

        const response =
          await GET(
            request()
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(401);

        expect(
          body.reason
        ).toBe(
          "AUTHENTICATION_REQUIRED"
        );

        expect(
          mocks.inspectAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed when the request network source cannot be resolved",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.resolveClientIp
          .mockReturnValue(
            null
          );

        const response =
          await GET(
            request()
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          body.reason
        ).toBe(
          "AUTH_RATE_LIMIT_CLIENT_IP_UNRESOLVED"
        );

        expect(
          mocks.inspectAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "returns only sanitized read-only C5X state",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.inspectAsync
          .mockResolvedValue({
            blocked: false,

            blockedKinds: [],

            blockedUntil: null,

            ip: {
              bucketKind:
                "IP",

              failedAttempts:
                7,

              windowStartedAt:
                "2026-08-28T10:00:00.000Z",

              lastFailedAt:
                "2026-08-28T10:05:00.000Z",

              blockedUntil:
                null,

              currentlyBlocked:
                false,

              legalCertification:
                false
            },

            iprIp: {
              bucketKind:
                "IPR_IP",

              failedAttempts:
                2,

              windowStartedAt:
                "2026-08-28T10:00:00.000Z",

              lastFailedAt:
                "2026-08-28T10:05:00.000Z",

              blockedUntil:
                null,

              currentlyBlocked:
                false,

              legalCertification:
                false
            },

            legalCertification:
              false
          });

        const response =
          await GET(
            request()
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(200);

        expect(
          body.ok
        ).toBe(true);

        expect(
          body.status
        ).toBe("PASS");

        expect(
          body.mode
        ).toBe(
          "AUTH_RATE_LIMIT_RUNTIME_PROOF"
        );

        expect(
          body.operationalState
        ).toBe(
          "AVAILABLE"
        );

        expect(
          body.proof.globalIp.failedAttempts
        ).toBe(7);

        expect(
          body.proof.authenticatedPair.failedAttempts
        ).toBe(2);

        expect(
          body.proof.databaseReadOnly
        ).toBe(true);

        expect(
          body.proof.autoSchema
        ).toBe(
          "NO_AUTO_SCHEMA"
        );

        expect(
          body.boundary.performsDatabaseMutation
        ).toBe(false);

        expect(
          body.boundary.rateLimitStateMutation
        ).toBe(false);

        expect(
          body.boundary.rawIpExposed
        ).toBe(false);

        expect(
          body.boundary.rawHumanIprExposed
        ).toBe(false);

        expect(
          body.boundary.bucketHashExposed
        ).toBe(false);

        expect(
          body.legalCertification
        ).toBe(false);


        const serialized =
          JSON.stringify(body);

        expect(
          serialized
        ).not.toContain(
          "198.51.100.77"
        );

        expect(
          serialized
        ).not.toContain(
          "IPR-TEST-C5X"
        );

        expect(
          serialized
        ).not.toContain(
          "hmac-sha256:"
        );

        expect(
          mocks.inspectAsync
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.inspectAsync
        ).toHaveBeenCalledWith({
          humanIpr:
            "IPR-TEST-C5X",

          clientIp:
            "198.51.100.77"
        });

        expect(
          mocks.recordFailureAsync
        ).not.toHaveBeenCalled();

        expect(
          mocks.resetIprIpAfterSuccessAsync
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "reports a blocked persistent bucket without mutating it",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.inspectAsync
          .mockResolvedValue({
            blocked: true,

            blockedKinds: [
              "IP"
            ],

            blockedUntil:
              "2026-08-28T10:30:00.000Z",

            ip: {
              bucketKind:
                "IP",

              failedAttempts:
                20,

              windowStartedAt:
                "2026-08-28T10:00:00.000Z",

              lastFailedAt:
                "2026-08-28T10:15:00.000Z",

              blockedUntil:
                "2026-08-28T10:30:00.000Z",

              currentlyBlocked:
                true,

              legalCertification:
                false
            },

            iprIp:
              null,

            legalCertification:
              false
          });

        const response =
          await GET(
            request()
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(200);

        expect(
          body.operationalState
        ).toBe(
          "THROTTLED"
        );

        expect(
          body.proof.blocked
        ).toBe(true);

        expect(
          body.proof.blockedKinds
        ).toEqual([
          "IP"
        ]);

        expect(
          body.proof.globalIp.failedAttempts
        ).toBe(20);

        expect(
          body.proof.globalIp.currentlyBlocked
        ).toBe(true);

        expect(
          body.proof.authenticatedPair.present
        ).toBe(false);

        expect(
          mocks.recordFailureAsync
        ).not.toHaveBeenCalled();

        expect(
          mocks.resetIprIpAfterSuccessAsync
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "fails closed without exposing internal store errors",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.inspectAsync
          .mockRejectedValue(
            new Error(
              "SECRET_DATABASE_INTERNAL_DETAIL"
            )
          );

        const response =
          await GET(
            request()
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          body.reason
        ).toBe(
          "AUTH_RATE_LIMIT_RUNTIME_PROOF_UNAVAILABLE"
        );

        expect(
          JSON.stringify(body)
        ).not.toContain(
          "SECRET_DATABASE_INTERNAL_DETAIL"
        );

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );
  }
);


describe(
  "physical-schema-proof dedicated read-only auth integration",
  () => {
    function resetPhysicalAuthMocks() {
      mocks.resolveSession.mockReset();
      mocks.resolveReadOnly.mockReset();
      mocks.inspectPhysicalSchema.mockReset();
    }

    function physicalRequest() {
      return new NextRequest(
        "https://hbce.example/api/v1/runtime/diagnostics?mode=physical-schema-proof",
        { method: "GET" }
      );
    }

    function physicalProof() {
      return {
        ok: true,
        status: "PHYSICAL_SCHEMA_PROOF_PASS",
        revision: "HBCE-IPR-DATABASE-PHYSICAL-PROOF-v1_0",
        targetSchemaVersion: "HBCE-IPR-DB-v1.11",
        targetTable:
          "ipr_onboarding_pre_profile_policy_records",
        queryMode: "NO_AUTO_SCHEMA",
        checkedAt: "2026-09-12T00:00:00.000Z",
        checks: [],
        failedChecks: [],
        authority: "PHYSICAL_SCHEMA_EVIDENCE_ONLY",
        databaseMutation: false,
        sessionCreated: false,
        runtimeAuthorized: false,
        profilePersisted: false,
        routeActivated: false,
        legalCertification: false
      };
    }

    it(
      "uses dedicated read-only resolver only for physical-schema-proof",
      async () => {
        resetPhysicalAuthMocks();
        mocks.resolveReadOnly.mockResolvedValue(
          authenticatedResolution()
        );
        mocks.resolveSession.mockRejectedValue(
          new Error(
            "HBCE_TEST_GENERIC_RESOLVER_MUST_NOT_RUN"
          )
        );
        mocks.inspectPhysicalSchema.mockResolvedValue(
          physicalProof()
        );

        const request=physicalRequest();
        const response=await GET(request);

        expect(response.status).toBe(200);
        expect(mocks.resolveReadOnly).toHaveBeenCalledTimes(1);
        expect(mocks.resolveReadOnly).toHaveBeenCalledWith(request);
        expect(mocks.resolveSession).not.toHaveBeenCalled();
        expect(mocks.inspectPhysicalSchema).toHaveBeenCalledTimes(1);
      }
    );

    it(
      "fails physical-schema-proof closed with 401 before proof execution",
      async () => {
        resetPhysicalAuthMocks();
        mocks.resolveReadOnly.mockResolvedValue({
          runtimeAuthorized: false
        });

        const response=await GET(physicalRequest());
        const body=await response.json();

        expect(response.status).toBe(401);
        expect(body.reason).toBe("AUTHENTICATION_REQUIRED");
        expect(mocks.resolveSession).not.toHaveBeenCalled();
        expect(mocks.inspectPhysicalSchema).not.toHaveBeenCalled();
      }
    );

    it(
      "keeps a supported non-physical mode on the generic resolver only",
      async () => {
        resetPhysicalAuthMocks();
        mocks.resolveSession.mockRejectedValueOnce(
          new Error(
            "HBCE_TEST_GENERIC_NON_PHYSICAL_SELECTED"
          )
        );

        const request=new NextRequest(
          "https://hbce.example/api/v1/runtime/diagnostics?mode=auth-rate-limit-runtime-proof",
          { method: "GET" }
        );

        await expect(GET(request)).rejects.toThrow(
          "HBCE_TEST_GENERIC_NON_PHYSICAL_SELECTED"
        );

        expect(mocks.resolveSession).toHaveBeenCalledTimes(1);
        expect(mocks.resolveReadOnly).not.toHaveBeenCalled();
        expect(mocks.inspectPhysicalSchema).not.toHaveBeenCalled();
      }
    );

    it(
      "keeps default mode on the generic resolver only",
      async () => {
        resetPhysicalAuthMocks();
        mocks.resolveSession.mockRejectedValueOnce(
          new Error(
            "HBCE_TEST_GENERIC_DEFAULT_SELECTED"
          )
        );

        const request=new NextRequest(
          "https://hbce.example/api/v1/runtime/diagnostics",
          { method: "GET" }
        );

        await expect(GET(request)).rejects.toThrow(
          "HBCE_TEST_GENERIC_DEFAULT_SELECTED"
        );

        expect(mocks.resolveSession).toHaveBeenCalledTimes(1);
        expect(mocks.resolveReadOnly).not.toHaveBeenCalled();
        expect(mocks.inspectPhysicalSchema).not.toHaveBeenCalled();
      }
    );

    it(
      "preserves generic authentication before unsupported mode returns 400",
      async () => {
        resetPhysicalAuthMocks();
        mocks.resolveSession.mockResolvedValue(
          authenticatedResolution()
        );

        const request=new NextRequest(
          "https://hbce.example/api/v1/runtime/diagnostics?mode=unsupported-test-mode",
          { method: "GET" }
        );

        const response=await GET(request);
        const body=await response.json();

        expect(mocks.resolveSession).toHaveBeenCalledTimes(1);
        expect(mocks.resolveReadOnly).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(body.reason).toBe("UNSUPPORTED_DIAGNOSTIC_MODE");
        expect(mocks.inspectPhysicalSchema).not.toHaveBeenCalled();
      }
    );
  }
);

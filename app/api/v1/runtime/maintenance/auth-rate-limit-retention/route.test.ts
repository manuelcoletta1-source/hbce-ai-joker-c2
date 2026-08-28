import {
  afterEach,
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

  inspectRetentionEligibilityAsync:
    vi.fn(),

  pruneStaleBucketsAsync:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-auth-session-resolver",
  () => ({
    resolveIprAccountSessionFromRequestAsync:
      mocks.resolveSession
  })
);


vi.mock(
  "@/lib/ipr-auth-rate-limit-store",
  () => ({
    IPR_AUTH_RATE_LIMIT_BOUNDARY: {
      retentionPolicy: {
        staleAfterSeconds:
          86400,

        automaticPruning:
          false,

        pruningMode:
          "EXPLICIT_MAINTENANCE_ONLY"
      },

      legalCertification:
        false
    },

    getDefaultIprAuthRateLimitStore:
      () => ({
        inspectRetentionEligibilityAsync:
          mocks.inspectRetentionEligibilityAsync,

        pruneStaleBucketsAsync:
          mocks.pruneStaleBucketsAsync
      })
  })
);


import {
  GET,
  POST
} from "./route";


const ENV_NAME =
  "HBCE_AUTH_RATE_LIMIT_MAINTENANCE_SECRET";

const VALID_SECRET =
  "HBCE-C5X-R2-MAINTENANCE-SECRET-0123456789ABCDEF";

const originalSecret =
  process.env[ENV_NAME];


function authenticatedResolution() {
  return {
    ok:
      true,

    authenticated:
      true,

    sessionAuthenticated:
      true,

    runtimeAuthorized:
      true,

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
        "IPR-TEST-C5XR2"
    },

    session: {
      humanIpr:
        "IPR-TEST-C5XR2"
    }
  };
}


function unauthenticatedResolution() {
  return {
    ok:
      true,

    authenticated:
      false,

    sessionAuthenticated:
      false,

    runtimeAuthorized:
      false,

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


function request(
  secret?: string,
  body?: Record<string, unknown>
): NextRequest {

  const headers:
    Record<string, string> = {};

  if (secret !== undefined) {
    headers[
      "x-hbce-maintenance-secret"
    ] = secret;
  }

  if (body) {
    headers[
      "content-type"
    ] = "application/json";
  }

  return new NextRequest(
    "https://hbce.example/api/v1/runtime/maintenance/auth-rate-limit-retention",
    {
      method:
        "POST",

      headers,

      body:
        body
          ? JSON.stringify(body)
          : undefined
    }
  );
}


function preflightRequest(
  secret?: string
): NextRequest {

  const headers:
    Record<string, string> = {};

  if (secret !== undefined) {
    headers[
      "x-hbce-maintenance-secret"
    ] = secret;
  }

  return new NextRequest(
    "https://hbce.example/api/v1/runtime/maintenance/auth-rate-limit-retention",
    {
      method:
        "GET",

      headers
    }
  );
}


describe(
  "HBCE C5X-R2 auth rate limit retention maintenance",
  () => {

    beforeEach(() => {
      vi.clearAllMocks();

      process.env[
        ENV_NAME
      ] = VALID_SECRET;
    });


    afterEach(() => {
      if (
        originalSecret ===
        undefined
      ) {
        delete process.env[
          ENV_NAME
        ];
      } else {
        process.env[
          ENV_NAME
        ] = originalSecret;
      }
    });


    it(
      "requires authentication for retention preflight",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            unauthenticatedResolution()
          );

        const response =
          await GET(
            preflightRequest(
              VALID_SECRET
            )
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
          mocks.inspectRetentionEligibilityAsync
        ).not.toHaveBeenCalled();

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed when preflight maintenance authority is unavailable",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        delete process.env[
          ENV_NAME
        ];

        const response =
          await GET(
            preflightRequest()
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          body.reason
        ).toBe(
          "MAINTENANCE_AUTHORITY_UNAVAILABLE"
        );

        expect(
          mocks.inspectRetentionEligibilityAsync
        ).not.toHaveBeenCalled();

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "rejects an invalid preflight maintenance secret",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        const response =
          await GET(
            preflightRequest(
              "WRONG-MAINTENANCE-SECRET"
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(403);

        expect(
          body.reason
        ).toBe(
          "MAINTENANCE_AUTHORITY_DENIED"
        );

        expect(
          mocks.inspectRetentionEligibilityAsync
        ).not.toHaveBeenCalled();

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "executes only read-only retention preflight",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.inspectRetentionEligibilityAsync
          .mockResolvedValue({
            eligibleBuckets:
              7,

            staleAfterSeconds:
              86400,

            databaseReadOnly:
              true,

            legalCertification:
              false
          });

        const response =
          await GET(
            preflightRequest(
              VALID_SECRET
            )
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
          "AUTH_RATE_LIMIT_RETENTION_PREFLIGHT"
        );

        expect(
          body.result.eligibleBuckets
        ).toBe(7);

        expect(
          body.result.staleAfterSeconds
        ).toBe(86400);

        expect(
          body.result.databaseReadOnly
        ).toBe(true);

        expect(
          body.boundary.operation
        ).toBe(
          "INSPECT_STALE_AUTH_RATE_LIMIT_BUCKETS"
        );

        expect(
          body.boundary.performsDatabaseRead
        ).toBe(true);

        expect(
          body.boundary.performsDatabaseMutation
        ).toBe(false);

        expect(
          body.boundary.performsSchemaMutation
        ).toBe(false);

        expect(
          body.boundary.operationParameterized
        ).toBe(false);

        expect(
          body.boundary.acceptsClientHumanIpr
        ).toBe(false);

        expect(
          body.boundary.acceptsClientIp
        ).toBe(false);

        expect(
          body.boundary.acceptsRetentionOverride
        ).toBe(false);

        expect(
          mocks.inspectRetentionEligibilityAsync
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.inspectRetentionEligibilityAsync
        ).toHaveBeenCalledWith();

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed without exposing preflight database errors",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.inspectRetentionEligibilityAsync
          .mockRejectedValue(
            new Error(
              "SECRET_PREFLIGHT_DATABASE_DETAIL"
            )
          );

        const response =
          await GET(
            preflightRequest(
              VALID_SECRET
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          body.reason
        ).toBe(
          "AUTH_RATE_LIMIT_RETENTION_PREFLIGHT_FAILED"
        );

        expect(
          JSON.stringify(body)
        ).not.toContain(
          "SECRET_PREFLIGHT_DATABASE_DETAIL"
        );

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "requires an authenticated runtime session",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            unauthenticatedResolution()
          );

        const response =
          await POST(
            request(
              VALID_SECRET
            )
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
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed when maintenance authority is not configured",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        delete process.env[
          ENV_NAME
        ];

        const response =
          await POST(
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
          "MAINTENANCE_AUTHORITY_UNAVAILABLE"
        );

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "rejects an invalid maintenance secret",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        const response =
          await POST(
            request(
              "WRONG-MAINTENANCE-SECRET"
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(403);

        expect(
          body.reason
        ).toBe(
          "MAINTENANCE_AUTHORITY_DENIED"
        );

        expect(
          mocks.pruneStaleBucketsAsync
        ).not.toHaveBeenCalled();

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "executes only the fixed explicit retention operation",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.pruneStaleBucketsAsync
          .mockResolvedValue({
            deletedBuckets:
              3,

            staleAfterSeconds:
              86400,

            legalCertification:
              false
          });

        const response =
          await POST(
            request(
              VALID_SECRET,
              {
                humanIpr:
                  "IPR-CLIENT-MUST-NOT-CONTROL",

                clientIp:
                  "203.0.113.99",

                staleAfterSeconds:
                  1,

                deleteAll:
                  true
              }
            )
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
          "AUTH_RATE_LIMIT_RETENTION_MAINTENANCE"
        );

        expect(
          body.result.deletedBuckets
        ).toBe(3);

        expect(
          body.result.staleAfterSeconds
        ).toBe(86400);

        expect(
          body.boundary.operation
        ).toBe(
          "PRUNE_STALE_AUTH_RATE_LIMIT_BUCKETS"
        );

        expect(
          body.boundary.operationParameterized
        ).toBe(false);

        expect(
          body.boundary.acceptsClientHumanIpr
        ).toBe(false);

        expect(
          body.boundary.acceptsClientIp
        ).toBe(false);

        expect(
          body.boundary.acceptsRetentionOverride
        ).toBe(false);

        expect(
          body.boundary.performsDatabaseMutation
        ).toBe(true);

        expect(
          body.boundary.performsSchemaMutation
        ).toBe(false);

        expect(
          body.boundary.retentionPolicy
            .automaticPruning
        ).toBe(false);

        expect(
          body.boundary.retentionPolicy
            .pruningMode
        ).toBe(
          "EXPLICIT_MAINTENANCE_ONLY"
        );

        expect(
          mocks.pruneStaleBucketsAsync
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.pruneStaleBucketsAsync
        ).toHaveBeenCalledWith();

        const serialized =
          JSON.stringify(body);

        expect(
          serialized
        ).not.toContain(
          VALID_SECRET
        );

        expect(
          serialized
        ).not.toContain(
          "203.0.113.99"
        );

        expect(
          serialized
        ).not.toContain(
          "IPR-CLIENT-MUST-NOT-CONTROL"
        );

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed without exposing internal pruning errors",
      async () => {

        mocks.resolveSession
          .mockResolvedValue(
            authenticatedResolution()
          );

        mocks.pruneStaleBucketsAsync
          .mockRejectedValue(
            new Error(
              "SECRET_DATABASE_INTERNAL_DETAIL"
            )
          );

        const response =
          await POST(
            request(
              VALID_SECRET
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          body.reason
        ).toBe(
          "AUTH_RATE_LIMIT_RETENTION_MAINTENANCE_FAILED"
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

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";


const mocks = vi.hoisted(() => ({
  auth:
    vi.fn(),

  authError:
    vi.fn(),

  ingress:
    vi.fn(),

  replay:
    vi.fn(),

  marker:
    vi.fn(),

  policy:
    vi.fn(),

  projection:
    vi.fn(),

  persistence:
    vi.fn(),

  transaction:
    vi.fn(),
}));


vi.mock(
  "@/lib/api-auth",
  () => ({
    validateHbceApiCredential:
      mocks.auth,

    buildHbceApiAuthErrorBody:
      mocks.authError,
  }),
);


vi.mock(
  "@/lib/ipr-onboarding-trusted-ingress",
  () => ({
    validateIprOnboardingTrustedIngress:
      mocks.ingress,
  }),
);


vi.mock(
  "@/lib/ipr-onboarding-replay-store",
  () => ({
    evaluateAndRecordIprOnboardingReplay:
      mocks.replay,

    markIprOnboardingReplayProfilePersisted:
      mocks.marker,
  }),
);


vi.mock(
  "@/lib/ipr-onboarding-authority-policy",
  () => ({
    resolveIprOnboardingPreProfileAuthorityPolicy:
      mocks.policy,
  }),
);


vi.mock(
  "@/lib/ipr-onboarding-server-projection",
  () => ({
    projectVerifiedOnboardingToIprAccountProfile:
      mocks.projection,
  }),
);


vi.mock(
  "@/lib/ipr-account-store",
  () => ({
    persistIprAccountProfileInTransaction:
      mocks.persistence,
  }),
);


vi.mock(
  "@/lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      mocks.transaction,
  }),
);


import {
  POST,
} from "@/app/api/internal/ipr/onboarding-projection/route";


const SHA_A =
  "a".repeat(64);

const SHA_B =
  "b".repeat(64);

const SHA_C =
  "c".repeat(64);

const SHA_D =
  "d".repeat(64);

const SHA_E =
  "e".repeat(64);


const evidence = {
  iprId:
    "IPR-3",

  subjectId:
    "SUBJECT-WP02-TEST",

  iprStatus:
    "IPR_VERIFIED",

  iprCardStatus:
    "ACTIVE",

  certificateStatus:
    "ACTIVE",

  revocationState:
    "CLEAR",

  jokerC2AccessStatus:
    "ENABLED",

  latestPhaseNumber:
    9,

  latestPhaseCertificateHash:
    SHA_A,

  certificateId:
    "CERT09-WP02",

  certificateHash:
    SHA_B,

  certificateScope: [
    "JOKER_C2_ACCESS",
  ],

  cardSerial:
    "CARD-WP02",
};


const grantedAuth = {
  ok: true as const,

  status:
    "API_AUTH_GRANTED" as const,

  revision:
    "test",

  authMode:
    "PILOT_REQUIRED",

  credentialKind:
    "API_KEY",

  credential: {
    credentialId:
      "credential-wp02",

    apiKeyId:
      "api-key-wp02",

    keyPrefix:
      "hbce",

    secretLast4:
      "0001",

    credentialType:
      "API_KEY",

    environment:
      "B2G_PILOT",

    status:
      "ACTIVE",

    tenantId:
      "HBCE-TENANT-SELF-PILOT",

    workspaceId:
      "HBCE-WORKSPACE-RND",

    accountId:
      "HBCE-ACCOUNT-WP02",

    subscriptionId:
      null,

    scopes: [
      "internal:ipr-onboarding:project",
    ],

    allowedEndpoints: [
      "/api/internal/ipr/onboarding-projection",
    ],

    allowedSourceSets: [],

    rateLimitProfileId:
      null,

    expiresAt:
      null,

    revokedAt:
      null,

    lastUsedAt:
      null,

    legalCertification:
      false as const,
  },

  endpoint:
    "/api/internal/ipr/onboarding-projection",

  method:
    "POST",

  requiredScopes: [
    "internal:ipr-onboarding:project",
  ],

  policy: {
    decision:
      "ALLOW" as const,

    tenantScope:
      "PASS" as const,

    workspaceScope:
      "PASS" as const,

    endpointScope:
      "PASS" as const,

    sourceSetScope:
      "NOT_REQUESTED" as const,
  },

  boundary:
    "test",

  legalCertification:
    false as const,
};


const validatedIngress = {
  ok: true as const,

  status:
    "TRUSTED_INGRESS_VALIDATED" as const,

  runtimeAuthorized:
    false as const,

  sessionAuthenticated:
    false as const,

  profilePersistenceAuthorized:
    false as const,

  authority:
    "TRANSPORT_EVIDENCE_ONLY" as const,

  service: {
    credentialId:
      "credential-wp02",

    tenantId:
      "HBCE-TENANT-SELF-PILOT",

    workspaceId:
      "HBCE-WORKSPACE-RND",
  },

  issuedAt:
    "2026-11-13T18:00:00.000Z",

  nonceHash:
    SHA_C,

  payloadHash:
    SHA_D,

  projectionKey:
    SHA_E,

  replay: {
    status:
      "NOT_EVALUATED" as const,
  },

  evidence,

  legalCertification:
    false as const,
};


const newReplay = {
  ok: true as const,

  status:
    "NEW_PROJECTION_RESERVED" as const,

  replayDecision:
    "NEW_PROJECTION" as const,

  projectionStatus:
    "PENDING" as const,

  replayCount: 0,

  nextAction:
    "EVALUATE_SERVER_PROJECTION" as const,

  transactionId:
    "tx-wp02",

  projectionKey:
    SHA_E,

  payloadHash:
    SHA_D,

  nonceHash:
    SHA_C,

  credentialIdHash:
    SHA_A,

  humanIprHash:
    SHA_B,

  tenantId:
    "HBCE-TENANT-SELF-PILOT",

  workspaceId:
    "HBCE-WORKSPACE-RND",

  runtimeAuthorized:
    false as const,

  sessionAuthenticated:
    false as const,

  profilePersistenceAuthorized:
    false as const,

  legalCertification:
    false as const,
};


const idempotentReplay = {
  ...newReplay,

  status:
    "IDEMPOTENT_REPLAY_ACCEPTED" as const,

  replayDecision:
    "IDEMPOTENT_REPLAY" as const,

  projectionStatus:
    "PROFILE_PERSISTED" as const,

  replayCount: 1,

  nextAction:
    "NO_PROFILE_WRITE_REQUIRED" as const,
};


const grantedPolicy = {
  ok: true as const,

  status:
    "PRE_PROFILE_POLICY_GRANTED" as const,

  decision:
    "GRANT" as const,

  policyRecordId:
    SHA_A,

  profilePersistenceAuthorized:
    true as const,

  serverPolicy: {
    allowJokerC2Access:
      true as const,

    verifiedBiologicalSubject:
      true as const,

    matrixActive:
      true as const,

    iprBoundMemory:
      true as const,
  },

  runtimeAuthorized:
    false as const,

  sessionAuthenticated:
    false as const,

  legalCertification:
    false as const,

  boundary:
    "test",
};


const projected = {
  ok: true as const,

  status:
    "PROFILE_CANDIDATE_ELIGIBLE" as const,

  runtimeAuthorized:
    false as const,

  authority:
    "PROFILE_CANDIDATE_ONLY" as const,

  legalCertification:
    false as const,

  evidenceHash:
    SHA_C,

  handoffHash:
    SHA_D,

  profileInput: {
    humanIpr:
      "IPR-3",

    entity:
      "WP02 Test Entity",

    subjectKind:
      "IPR_VERIFIED_BIOLOGICAL_SUBJECT",

    tenantId:
      "HBCE-TENANT-SELF-PILOT",

    workspaceId:
      "HBCE-WORKSPACE-RND",

    accountId:
      "HBCE-ACCOUNT-WP02",

    certificateId:
      "CERT09-WP02",

    certificateKind:
      "CERTIFICATE_09_OPERATIONAL",

    certificateStatus:
      "ACTIVE",

    certificateScope: [
      "JOKER_C2_ACCESS",
    ],

    cardSerial:
      "CARD-WP02",

    certificateHash:
      SHA_B,

    accessDecision:
      "ACCESS_GRANTED",

    accessScope:
      "JOKER_C2_ACCESS",

    identityBinding:
      "IPR_VERIFIED_BIOLOGICAL_SUBJECT",

    matrixState:
      "MATRIX_ACTIVE",

    semanticMemoryScope:
      "IPR_BOUND",

    source:
      "HBCE_IPR_ONBOARDING_SERVER_PROJECTION",

    handoffHash:
      SHA_D,

    profilePayload: {
      evidenceHash:
        SHA_C,
    },
  },
};


const persistence = {
  profile: {
    profileHash:
      SHA_E,
  },

  transactionScoped:
    true as const,

  subjectPersisted:
    true as const,

  profilePersisted:
    true as const,

  processFallbackMutated:
    false as const,

  sessionCreated:
    false as const,

  runtimeAuthorized:
    false as const,

  legalCertification:
    false as const,
};


const marker = {
  ok: true as const,

  status:
    "PROFILE_PERSISTENCE_RECORDED" as const,

  transactionId:
    "tx-wp02",

  projectionKey:
    SHA_E,

  payloadHash:
    SHA_D,

  projectionStatus:
    "PROFILE_PERSISTED" as const,

  replayCount: 0,

  alreadyPersisted:
    false,

  runtimeAuthorized:
    false as const,

  sessionAuthenticated:
    false as const,

  profilePersistenceAuthorized:
    false as const,

  legalCertification:
    false as const,
};


function request() {
  return new Request(
    "http://localhost/api/internal/ipr/onboarding-projection",
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",

        authorization:
          "Bearer test",
      },

      body:
        JSON.stringify({
          version:
            "test",
        }),
    },
  );
}


function committed<T>(
  value: T,
) {
  return {
    ok: true as const,

    transactionId:
      "tx-wp02",

    state:
      "COMMITTED" as const,

    startedAt:
      "2026-11-13T18:00:00.000Z",

    completedAt:
      "2026-11-13T18:00:00.010Z",

    durationMs: 10,

    value,
  };
}


function rolledBack(
  error: string,
) {
  return {
    ok: false as const,

    transactionId:
      "tx-wp02",

    state:
      "ROLLED_BACK" as const,

    startedAt:
      "2026-11-13T18:00:00.000Z",

    completedAt:
      "2026-11-13T18:00:00.010Z",

    durationMs: 10,

    error,

    rollbackError:
      null,
  };
}


async function json(
  response: Response,
) {
  return await response.json() as
    Record<string, unknown>;
}


function installTransactionalExecutor() {
  mocks.transaction.mockImplementation(
    async (
      operation:
        (
          context: {
            transactionId: string;
            query: ReturnType<typeof vi.fn>;
          },
        ) => Promise<unknown>,
      options: unknown,
    ) => {
      expect(options).toMatchObject({
        isolationLevel:
          "SERIALIZABLE",
      });

      const context = {
        transactionId:
          "tx-wp02",

        query:
          vi.fn(),
      };

      try {
        const value =
          await operation(
            context,
          );

        return committed(
          value,
        );
      } catch (error) {
        return rolledBack(
          error instanceof Error
            ? error.message
            : String(error),
        );
      }
    },
  );
}


describe(
  "WP02 onboarding projection route behavior",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      process.env.HBCE_IPR_ONBOARDING_PROJECTION_ENTITY =
        "WP02 Test Entity";

      mocks.auth.mockResolvedValue(
        grantedAuth,
      );

      mocks.authError.mockReturnValue({
        ok: false,
        status:
          "API_AUTH_DENIED",
      });

      mocks.ingress.mockReturnValue(
        validatedIngress,
      );

      mocks.replay.mockResolvedValue(
        newReplay,
      );

      mocks.policy.mockResolvedValue(
        grantedPolicy,
      );

      mocks.projection.mockReturnValue(
        projected,
      );

      mocks.persistence.mockResolvedValue(
        persistence,
      );

      mocks.marker.mockResolvedValue(
        marker,
      );

      installTransactionalExecutor();
    });


    it(
      "does not start a transaction when API authentication fails",
      async () => {
        mocks.auth.mockResolvedValue({
          ok: false,

          status:
            "API_AUTH_DENIED",

          httpStatus: 401,

          endpoint:
            "/api/internal/ipr/onboarding-projection",

          method:
            "POST",

          requiredScopes: [
            "internal:ipr-onboarding:project",
          ],

          message:
            "denied",

          failReason:
            "INVALID_CREDENTIAL",

          policy: {
            decision:
              "FAIL_CLOSED",

            tenantScope:
              "NOT_CHECKED",

            workspaceScope:
              "NOT_CHECKED",

            endpointScope:
              "NOT_CHECKED",

            sourceSetScope:
              "NOT_CHECKED",
          },

          legalCertification:
            false,
        });

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(401);

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();

        expect(
          response.headers.get(
            "set-cookie",
          ),
        ).toBeNull();
      },
    );


    it(
      "does not start a transaction when trusted ingress fails",
      async () => {
        mocks.ingress.mockReturnValue({
          ok: false,

          status:
            "TRUSTED_INGRESS_DENIED",

          reason:
            "FORBIDDEN_AUTHORITY_MATERIAL",

          runtimeAuthorized:
            false,

          sessionAuthenticated:
            false,

          profilePersistenceAuthorized:
            false,

          authority:
            "TRANSPORT_EVIDENCE_ONLY",

          legalCertification:
            false,
        });

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(403);

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();

        const body =
          await json(response);

        expect(
          body.runtimeAuthorized,
        ).toBe(false);

        expect(
          body.sessionAuthenticated,
        ).toBe(false);
      },
    );


    it(
      "rolls back when policy denies after replay reservation",
      async () => {
        mocks.policy.mockResolvedValue({
          ok: false,

          status:
            "PRE_PROFILE_POLICY_DENIED",

          decision:
            "DENY",

          reason:
            "POLICY_NOT_FOUND",

          profilePersistenceAuthorized:
            false,

          serverPolicy: {
            allowJokerC2Access:
              false,

            verifiedBiologicalSubject:
              false,

            matrixActive:
              false,

            iprBoundMemory:
              false,
          },

          runtimeAuthorized:
            false,

          sessionAuthenticated:
            false,

          legalCertification:
            false,
        });

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(403);

        expect(
          mocks.replay,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.persistence,
        ).not.toHaveBeenCalled();

        expect(
          mocks.marker,
        ).not.toHaveBeenCalled();

        const body =
          await json(response);

        expect(
          body.transactionState,
        ).toBe("ROLLED_BACK");

        expect(
          body.runtimeAuthorized,
        ).toBe(false);
      },
    );


    it(
      "rolls back when server projection denies",
      async () => {
        mocks.projection.mockReturnValue({
          ok: false,

          status:
            "PROJECTION_DENIED",

          reason:
            "MISSING_SUBJECT_ID",

          runtimeAuthorized:
            false,

          authority:
            "PROFILE_CANDIDATE_ONLY",

          legalCertification:
            false,
        });

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(403);

        expect(
          mocks.persistence,
        ).not.toHaveBeenCalled();

        expect(
          mocks.marker,
        ).not.toHaveBeenCalled();

        expect(
          (await json(response))
            .transactionState,
        ).toBe("ROLLED_BACK");
      },
    );


    it(
      "rolls back when profile persistence throws",
      async () => {
        mocks.persistence.mockRejectedValue(
          new Error(
            "DATABASE_WRITE_FAILED",
          ),
        );

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(500);

        expect(
          mocks.marker,
        ).not.toHaveBeenCalled();

        expect(
          (await json(response))
            .transactionState,
        ).toBe("ROLLED_BACK");
      },
    );


    it(
      "rolls back when persisted marker fails",
      async () => {
        mocks.marker.mockResolvedValue({
          ok: false,

          status:
            "PROFILE_PERSISTENCE_MARKER_FAILED",
        });

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(500);

        expect(
          mocks.persistence,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.marker,
        ).toHaveBeenCalledTimes(1);

        expect(
          (await json(response))
            .transactionState,
        ).toBe("ROLLED_BACK");
      },
    );


    it(
      "commits a valid new projection and still grants no runtime session authority",
      async () => {
        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(201);

        const body =
          await json(response);

        expect(
          body.status,
        ).toBe(
          "PROFILE_PERSISTED",
        );

        expect(
          body.projectionStatus,
        ).toBe(
          "PROFILE_PERSISTED",
        );

        expect(
          body.runtimeAuthorized,
        ).toBe(false);

        expect(
          body.sessionAuthenticated,
        ).toBe(false);

        expect(
          body.profilePersistenceAuthorized,
        ).toBe(false);

        expect(
          body.legalCertification,
        ).toBe(false);

        expect(
          response.headers.get(
            "set-cookie",
          ),
        ).toBeNull();

        expect(
          mocks.replay,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.policy,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.persistence,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.marker,
        ).toHaveBeenCalledTimes(1);
      },
    );


    it(
      "accepts an idempotent persisted replay without another policy or profile write",
      async () => {
        mocks.replay.mockResolvedValue(
          idempotentReplay,
        );

        const response =
          await POST(
            request() as never,
          );

        expect(
          response.status,
        ).toBe(200);

        const body =
          await json(response);

        expect(
          body.status,
        ).toBe(
          "IDEMPOTENT_REPLAY_ACCEPTED",
        );

        expect(
          body.projectionStatus,
        ).toBe(
          "PROFILE_PERSISTED",
        );

        expect(
          body.runtimeAuthorized,
        ).toBe(false);

        expect(
          body.sessionAuthenticated,
        ).toBe(false);

        expect(
          mocks.policy,
        ).not.toHaveBeenCalled();

        expect(
          mocks.projection,
        ).not.toHaveBeenCalled();

        expect(
          mocks.persistence,
        ).not.toHaveBeenCalled();

        expect(
          mocks.marker,
        ).not.toHaveBeenCalled();

        expect(
          response.headers.get(
            "set-cookie",
          ),
        ).toBeNull();
      },
    );
  },
);

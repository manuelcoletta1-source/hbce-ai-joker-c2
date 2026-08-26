import {
  describe,
  expect,
  it
} from "vitest";

import {
  HBCE_API_AUTH_BOUNDARY,
  type HbceApiAuthResult
} from "@/lib/api-auth";

import {
  IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT,
  IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE,
  IPR_ONBOARDING_TRUSTED_INGRESS_VERSION,
  validateIprOnboardingTrustedIngress
} from "@/lib/ipr-onboarding-trusted-ingress";

const NOW =
  new Date(
    "2026-08-26T13:30:00.000Z"
  );

function validEvidence() {
  return {
    iprId:
      "IPR-TEST-SUBJECT-001",

    subjectId:
      "SUBJECT-TEST-001",

    iprStatus:
      "verified",

    iprCardStatus:
      "issued",

    certificateStatus:
      "active",

    revocationState:
      "clear",

    jokerC2AccessStatus:
      "enabled",

    latestPhaseNumber:
      9,

    latestPhaseCertificateHash:
      "sha256:phase-final",

    certificateId:
      "CERT-HBCE-TEST-001",

    certificateHash:
      "sha256:certificate",

    certificateScope: [
      "JOKER-C2-GOVERNED-RUNTIME"
    ],

    cardSerial:
      "IPR-CARD-TEST-001"
  };
}

function validEnvelope() {
  return {
    version:
      IPR_ONBOARDING_TRUSTED_INGRESS_VERSION,

    issuedAt:
      "2026-08-26T13:29:30.000Z",

    nonce:
      "nonce-0123456789abcdef",

    evidence:
      validEvidence()
  };
}

function grantedAuth(
  input: {
    endpoint?: string;
    method?: string;
    requiredScopes?: string[];
    credentialScopes?: string[];
    tenantId?: string;
    workspaceId?: string;
  } = {}
): HbceApiAuthResult {
  return {
    ok: true,

    status:
      "API_AUTH_GRANTED",

    revision:
      "HBCE-API-AUTH-v0.1-CONTROLLED_B2G_PILOT_GATE",

    authMode:
      "PILOT_REQUIRED",

    credentialKind:
      "API_KEY",

    credential: {
      credentialId:
        "CRED-ONBOARDING-001",

      apiKeyId:
        "KEY-ONBOARDING-001",

      keyPrefix:
        "hbce_test",

      secretLast4:
        "1234",

      credentialType:
        "API_KEY",

      environment:
        "PRODUCTION",

      status:
        "ACTIVE",

      tenantId:
        input.tenantId ??
        "TENANT-001",

      workspaceId:
        input.workspaceId ??
        "WORKSPACE-001",

      accountId:
        null,

      subscriptionId:
        null,

      scopes:
        input.credentialScopes ??
        [
          IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
        ],

      allowedEndpoints: [
        IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT
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
        false
    },

    endpoint:
      input.endpoint ??
      IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT,

    method:
      input.method ??
      "POST",

    requiredScopes:
      input.requiredScopes ??
      [
        IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
      ],

    policy: {
      decision:
        "ALLOW",

      tenantScope:
        "PASS",

      workspaceScope:
        "PASS",

      endpointScope:
        "PASS",

      sourceSetScope:
        "NOT_REQUESTED"
    },

    boundary:
      HBCE_API_AUTH_BOUNDARY,

    legalCertification:
      false
  } as HbceApiAuthResult;
}

describe(
  "IPR onboarding trusted ingress",
  () => {
    it(
      "validates transport evidence without creating runtime authority or profile persistence authority",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result.ok).toBe(
          true
        );

        if (!result.ok) {
          throw new Error(
            result.reason
          );
        }

        expect(
          result.status
        ).toBe(
          "TRUSTED_INGRESS_VALIDATED"
        );

        expect(
          result.runtimeAuthorized
        ).toBe(false);

        expect(
          result.sessionAuthenticated
        ).toBe(false);

        expect(
          result.profilePersistenceAuthorized
        ).toBe(false);

        expect(
          result.authority
        ).toBe(
          "TRANSPORT_EVIDENCE_ONLY"
        );

        expect(
          result.replay.status
        ).toBe(
          "NOT_EVALUATED"
        );
      }
    );

    it(
      "fails closed when API authentication was denied",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth: {
              ok: false
            } as HbceApiAuthResult,

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "API_AUTH_REQUIRED",
          runtimeAuthorized:
            false
        });
      }
    );

    it(
      "fails closed when authenticated endpoint binding differs",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth({
                endpoint:
                  "/api/v1/chat"
              }),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "AUTH_ENDPOINT_MISMATCH"
        });
      }
    );

    it(
      "fails closed when authenticated method binding differs",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth({
                method:
                  "GET"
              }),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "AUTH_METHOD_MISMATCH"
        });
      }
    );

    it(
      "fails closed when auth validation did not require the dedicated projection scope",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth({
                requiredScopes: []
              }),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "AUTH_REQUIRED_SCOPE_MISSING"
        });
      }
    );

    it(
      "rejects wildcard-only credentials and requires the exact dedicated ingress scope",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth({
                credentialScopes: [
                  "*"
                ]
              }),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "CREDENTIAL_DEDICATED_SCOPE_MISSING"
        });
      }
    );

    it(
      "fails closed when tenant authority is absent",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth({
                tenantId:
                  "NO_TENANT_ID"
              }),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "TENANT_SCOPE_REQUIRED"
        });
      }
    );

    it(
      "fails closed when workspace authority is absent",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth({
                workspaceId:
                  "NO_WORKSPACE_ID"
              }),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "WORKSPACE_SCOPE_REQUIRED"
        });
      }
    );

    it(
      "fails closed on an unknown ingress contract version",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),
              version:
                "UNKNOWN"
            },

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "INGRESS_VERSION_INVALID"
        });
      }
    );

    it(
      "fails closed on a stale ingress timestamp",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),

              issuedAt:
                "2026-08-26T13:20:00.000Z"
            },

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "INGRESS_TIMESTAMP_STALE"
        });
      }
    );

    it(
      "fails closed when ingress timestamp exceeds future clock-skew allowance",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),

              issuedAt:
                "2026-08-26T13:32:00.000Z"
            },

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "INGRESS_TIMESTAMP_IN_FUTURE"
        });
      }
    );

    it(
      "fails closed on an invalid nonce",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),
              nonce:
                "short"
            },

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "INGRESS_NONCE_INVALID"
        });
      }
    );

    it(
      "rejects client-supplied core authority fields",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),

              matrixActive:
                true
            },

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "CLIENT_AUTHORITY_FIELD_FORBIDDEN"
        });
      }
    );

    it(
      "rejects raw sensitive material at the transport boundary",
      () => {
        const result =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),

              evidence: {
                ...validEvidence(),

                photo:
                  "base64-sensitive-material"
              }
            },

            now:
              NOW
          });

        expect(result).toMatchObject({
          ok: false,
          reason:
            "SENSITIVE_FIELD_FORBIDDEN"
        });
      }
    );

    it(
      "produces deterministic replay identities while separating semantic payload conflict detection from transport nonce",
      () => {
        const first =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope:
              validEnvelope(),

            now:
              NOW
          });

        const retry =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),

              issuedAt:
                "2026-08-26T13:29:45.000Z",

              nonce:
                "nonce-fedcba9876543210"
            },

            now:
              NOW
          });

        const conflict =
          validateIprOnboardingTrustedIngress({
            auth:
              grantedAuth(),

            envelope: {
              ...validEnvelope(),

              nonce:
                "nonce-0011223344556677",

              evidence: {
                ...validEvidence(),

                revocationState:
                  "under_review"
              }
            },

            now:
              NOW
          });

        expect(first.ok).toBe(
          true
        );

        expect(retry.ok).toBe(
          true
        );

        expect(conflict.ok).toBe(
          true
        );

        if (
          !first.ok ||
          !retry.ok ||
          !conflict.ok
        ) {
          throw new Error(
            "Expected valid transport contracts."
          );
        }

        expect(
          retry.projectionKey
        ).toBe(
          first.projectionKey
        );

        expect(
          retry.payloadHash
        ).toBe(
          first.payloadHash
        );

        expect(
          retry.nonceHash
        ).not.toBe(
          first.nonceHash
        );

        expect(
          conflict.projectionKey
        ).toBe(
          first.projectionKey
        );

        expect(
          conflict.payloadHash
        ).not.toBe(
          first.payloadHash
        );
      }
    );
  }
);

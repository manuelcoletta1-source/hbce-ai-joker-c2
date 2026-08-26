import {
  describe,
  expect,
  it
} from "vitest";

import {
  projectVerifiedOnboardingToIprAccountProfile,
  type IprOnboardingProjectionEvidence,
  type IprOnboardingProjectionServerContext
} from "@/lib/ipr-onboarding-server-projection";

function buildEvidence():
  IprOnboardingProjectionEvidence {
  return {
    iprId:
      "IPR-HBCE-SUBJECT-0001",
    subjectId:
      "sub_internal_0001",

    iprStatus: "verified",
    iprCardStatus: "issued",
    certificateStatus: "active",
    revocationState: "clear",
    jokerC2AccessStatus: "enabled",

    latestPhaseNumber: 9,
    latestPhaseCertificateHash:
      "sha256_phase_09_hash",

    certificateId:
      "HBCE-CERT-09-0001",
    certificateHash:
      "sha256_certificate_hash_0001",

    certificateScope:
      "JOKER-C2-GOVERNED-RUNTIME",

    cardSerial:
      "IPR-CARD-0001"
  };
}

function buildServerContext():
  IprOnboardingProjectionServerContext {
  return {
    tenantId:
      "HBCE-TENANT-0001",
    workspaceId:
      "HBCE-WORKSPACE-0001",
    accountId:
      "HBCE-ACCOUNT-0001",
    entity:
      "verified biological subject",

    allowJokerC2Access: true,
    verifiedBiologicalSubject: true,
    matrixActive: true,
    iprBoundMemory: true
  };
}

describe(
  "IPR onboarding server projection",
  () => {
    it(
      "produces only a profile candidate, never runtime authorization",
      () => {
        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence: buildEvidence(),
              server:
                buildServerContext()
            }
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason
          );
        }

        expect(result.status).toBe(
          "PROFILE_CANDIDATE_ELIGIBLE"
        );

        expect(
          result.runtimeAuthorized
        ).toBe(false);

        expect(result.authority).toBe(
          "PROFILE_CANDIDATE_ONLY"
        );
      }
    );

    it(
      "normalizes the onboarding scope to the canonical core scope",
      () => {
        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence: buildEvidence(),
              server:
                buildServerContext()
            }
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason
          );
        }

        expect(
          result.profileInput
            .certificateScope
        ).toEqual([
          "JOKER_C2_ACCESS"
        ]);

        expect(
          result.profileInput.accessScope
        ).toBe(
          "JOKER_C2_ACCESS"
        );
      }
    );

    it(
      "creates the exact core authorization candidate states only after server policy approval",
      () => {
        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence: buildEvidence(),
              server:
                buildServerContext()
            }
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason
          );
        }

        expect(
          result.profileInput
            .certificateStatus
        ).toBe("ACTIVE");

        expect(
          result.profileInput
            .accessDecision
        ).toBe("ACCESS_GRANTED");

        expect(
          result.profileInput
            .identityBinding
        ).toBe(
          "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
        );

        expect(
          result.profileInput.matrixState
        ).toBe("MATRIX_ACTIVE");

        expect(
          result.profileInput
            .semanticMemoryScope
        ).toBe("IPR_BOUND");
      }
    );

    it(
      "fails closed when revocation is not clear",
      () => {
        const evidence = {
          ...buildEvidence(),
          revocationState: "revoked"
        };

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence,
              server:
                buildServerContext()
            }
          );

        expect(result).toMatchObject({
          ok: false,
          status: "PROJECTION_DENIED",
          reason:
            "REVOCATION_NOT_CLEAR",
          runtimeAuthorized: false
        });
      }
    );

    it(
      "fails closed when final phase evidence is missing",
      () => {
        const evidence = {
          ...buildEvidence(),
          latestPhaseNumber: 8
        };

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence,
              server:
                buildServerContext()
            }
          );

        expect(result).toMatchObject({
          ok: false,
          reason:
            "FINAL_OPERATIONAL_PHASE_REQUIRED"
        });
      }
    );

    it(
      "fails closed when certificate scope is not compatible",
      () => {
        const evidence = {
          ...buildEvidence(),
          certificateScope: [
            "UNRELATED_SCOPE"
          ]
        };

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence,
              server:
                buildServerContext()
            }
          );

        expect(result).toMatchObject({
          ok: false,
          reason:
            "CERTIFICATE_SCOPE_NOT_COMPATIBLE"
        });
      }
    );

    it(
      "fails closed when tenant or workspace authority is absent",
      () => {
        const server = {
          ...buildServerContext(),
          tenantId: ""
        };

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence: buildEvidence(),
              server
            }
          );

        expect(result).toMatchObject({
          ok: false,
          reason: "TENANT_REQUIRED"
        });
      }
    );

    it(
      "fails closed when core policy has not verified biological identity",
      () => {
        const server = {
          ...buildServerContext(),
          verifiedBiologicalSubject:
            false
        };

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence: buildEvidence(),
              server
            }
          );

        expect(result).toMatchObject({
          ok: false,
          reason:
            "SERVER_POLICY_IDENTITY_REQUIRED"
        });
      }
    );

    it(
      "computes deterministic evidence and handoff hashes",
      () => {
        const input = {
          evidence: buildEvidence(),
          server:
            buildServerContext()
        };

        const first =
          projectVerifiedOnboardingToIprAccountProfile(
            input
          );

        const second =
          projectVerifiedOnboardingToIprAccountProfile(
            input
          );

        expect(first.ok).toBe(true);
        expect(second.ok).toBe(true);

        if (
          !first.ok ||
          !second.ok
        ) {
          throw new Error(
            "projection unexpectedly denied"
          );
        }

        expect(
          first.evidenceHash
        ).toBe(second.evidenceHash);

        expect(
          first.handoffHash
        ).toBe(second.handoffHash);

        expect(
          first.evidenceHash
        ).toMatch(
          /^sha256:[a-f0-9]{64}$/
        );

        expect(
          first.handoffHash
        ).toMatch(
          /^sha256:[a-f0-9]{64}$/
        );
      }
    );

    it(
      "does not propagate raw biometric, photo, video or fiscal material into profilePayload",
      () => {
        const evidence = {
          ...buildEvidence(),
          raw_photo:
            "FORBIDDEN_PHOTO",
          raw_video:
            "FORBIDDEN_VIDEO",
          biometric_template:
            "FORBIDDEN_TEMPLATE",
          fiscal_identifier:
            "FORBIDDEN_FISCAL"
        } as IprOnboardingProjectionEvidence &
          Record<string, unknown>;

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence,
              server:
                buildServerContext()
            }
          );

        expect(result.ok).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason
          );
        }

        const payload =
          JSON.stringify(
            result.profileInput
              .profilePayload
          );

        expect(payload).not.toContain(
          "FORBIDDEN_PHOTO"
        );

        expect(payload).not.toContain(
          "FORBIDDEN_VIDEO"
        );

        expect(payload).not.toContain(
          "FORBIDDEN_TEMPLATE"
        );

        expect(payload).not.toContain(
          "FORBIDDEN_FISCAL"
        );

        expect(payload).not.toContain(
          "raw_photo"
        );

        expect(payload).not.toContain(
          "biometric_template"
        );

        expect(payload).not.toContain(
          "fiscal_identifier"
        );
      }
    );
  }
);

describe(
  "IPR onboarding projection exhaustive deny matrix",
  () => {
    type Evidence =
      ReturnType<typeof buildEvidence>;

    type ServerContext =
      ReturnType<typeof buildServerContext>;

    type DenyCase = {
      name: string;
      expectedReason: string;
      mutateEvidence:
        | ((value: Evidence) => Evidence)
        | null;
      mutateServer:
        | ((value: ServerContext) => ServerContext)
        | null;
    };

    const denyCases: DenyCase[] = [
      {
        name: "missing IPR identifier",
        expectedReason: "MISSING_IPR_ID",
        mutateEvidence: (value) => ({
          ...value,
          iprId: ""
        }),
        mutateServer: null
      },
      {
        name: "missing subject identifier",
        expectedReason: "MISSING_SUBJECT_ID",
        mutateEvidence: (value) => ({
          ...value,
          subjectId: ""
        }),
        mutateServer: null
      },
      {
        name: "IPR not verified",
        expectedReason: "IPR_NOT_VERIFIED",
        mutateEvidence: (value) => ({
          ...value,
          iprStatus: "pending"
        }),
        mutateServer: null
      },
      {
        name: "IPR Card not issued",
        expectedReason: "IPR_CARD_NOT_ISSUED",
        mutateEvidence: (value) => ({
          ...value,
          iprCardStatus: "pending"
        }),
        mutateServer: null
      },
      {
        name: "certificate not active",
        expectedReason: "CERTIFICATE_NOT_ACTIVE",
        mutateEvidence: (value) => ({
          ...value,
          certificateStatus: "pending"
        }),
        mutateServer: null
      },
      {
        name: "revocation not clear",
        expectedReason: "REVOCATION_NOT_CLEAR",
        mutateEvidence: (value) => ({
          ...value,
          revocationState: "under_review"
        }),
        mutateServer: null
      },
      {
        name: "JOKER access not enabled",
        expectedReason: "JOKER_ACCESS_NOT_ENABLED",
        mutateEvidence: (value) => ({
          ...value,
          jokerC2AccessStatus: "disabled"
        }),
        mutateServer: null
      },
      {
        name: "final operational phase missing",
        expectedReason:
          "FINAL_OPERATIONAL_PHASE_REQUIRED",
        mutateEvidence: (value) => ({
          ...value,
          latestPhaseNumber: null
        }),
        mutateServer: null
      },
      {
        name: "phase certificate hash missing",
        expectedReason:
          "PHASE_CERTIFICATE_HASH_REQUIRED",
        mutateEvidence: (value) => ({
          ...value,
          latestPhaseCertificateHash: ""
        }),
        mutateServer: null
      },
      {
        name: "certificate id missing",
        expectedReason:
          "CERTIFICATE_ID_REQUIRED",
        mutateEvidence: (value) => ({
          ...value,
          certificateId: ""
        }),
        mutateServer: null
      },
      {
        name: "certificate hash missing",
        expectedReason:
          "CERTIFICATE_HASH_REQUIRED",
        mutateEvidence: (value) => ({
          ...value,
          certificateHash: ""
        }),
        mutateServer: null
      },
      {
        name: "certificate scope incompatible",
        expectedReason:
          "CERTIFICATE_SCOPE_NOT_COMPATIBLE",
        mutateEvidence: (value) => ({
          ...value,
          certificateScope: []
        }),
        mutateServer: null
      },
      {
        name: "card serial missing",
        expectedReason:
          "CARD_SERIAL_REQUIRED",
        mutateEvidence: (value) => ({
          ...value,
          cardSerial: ""
        }),
        mutateServer: null
      },
      {
        name: "tenant authority missing",
        expectedReason:
          "TENANT_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          tenantId: ""
        })
      },
      {
        name: "workspace authority missing",
        expectedReason:
          "WORKSPACE_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          workspaceId: ""
        })
      },
      {
        name: "account authority missing",
        expectedReason:
          "ACCOUNT_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          accountId: ""
        })
      },
      {
        name: "entity normalization missing",
        expectedReason:
          "ENTITY_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          entity: ""
        })
      },
      {
        name: "server access policy denied",
        expectedReason:
          "SERVER_POLICY_ACCESS_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          allowJokerC2Access: false
        })
      },
      {
        name: "server identity verification denied",
        expectedReason:
          "SERVER_POLICY_IDENTITY_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          verifiedBiologicalSubject: false
        })
      },
      {
        name: "server MATRIX policy inactive",
        expectedReason:
          "SERVER_POLICY_MATRIX_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          matrixActive: false
        })
      },
      {
        name: "server IPR-bound memory policy inactive",
        expectedReason:
          "SERVER_POLICY_MEMORY_REQUIRED",
        mutateEvidence: null,
        mutateServer: (value) => ({
          ...value,
          iprBoundMemory: false
        })
      }
    ];

    it.each(denyCases)(
      "fails closed: $name",
      ({
        expectedReason,
        mutateEvidence,
        mutateServer
      }) => {
        const baseEvidence =
          buildEvidence();

        const baseServer =
          buildServerContext();

        const evidence =
          mutateEvidence
            ? mutateEvidence(baseEvidence)
            : baseEvidence;

        const server =
          mutateServer
            ? mutateServer(baseServer)
            : baseServer;

        const result =
          projectVerifiedOnboardingToIprAccountProfile(
            {
              evidence,
              server
            }
          );

        expect(result).toMatchObject({
          ok: false,
          status: "PROJECTION_DENIED",
          reason: expectedReason,
          runtimeAuthorized: false,
          authority:
            "PROFILE_CANDIDATE_ONLY",
          legalCertification: false
        });

        expect(
          "profileInput" in result
        ).toBe(false);
      }
    );
  }
);

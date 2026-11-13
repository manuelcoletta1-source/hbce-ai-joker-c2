import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveIprOnboardingPreProfileAuthorityPolicy,
  type IprOnboardingPreProfilePolicyTransaction,
} from "../lib/ipr-onboarding-authority-policy";


type PolicyRow = {
  policy_record_id: string;
  tenant_id: string;
  workspace_id: string;
  human_ipr_hash: string;
  projection_key: string;
  payload_hash: string;
  decision: "GRANT" | "DENY" | "REVOKE";
  allow_joker_c2_access: boolean;
  verified_biological_subject: boolean;
  matrix_active: boolean;
  ipr_bound_memory: boolean;
  issuer_kind: string;
  issuer_credential_id_hash: string;
  issuer_authorization_ref_hash: string;
  issued_at: string;
  not_before: string | null;
  expires_at: string | null;
  supersedes_policy_record_id: string | null;
  revokes_policy_record_id: string | null;
  legal_certification: false;
};


const H = {
  human:
    "1".repeat(64),

  projection:
    "2".repeat(64),

  payload:
    "3".repeat(64),

  grant:
    "4".repeat(64),

  deny:
    "5".repeat(64),

  revoke:
    "6".repeat(64),

  successor:
    "7".repeat(64),

  issuer:
    "8".repeat(64),

  authorization:
    "9".repeat(64),
};


function grant(
  overrides:
    Partial<PolicyRow> = {},
): PolicyRow {
  return {
    policy_record_id:
      H.grant,

    tenant_id:
      "HBCE-TENANT-SELF-PILOT",

    workspace_id:
      "HBCE-WORKSPACE-RND",

    human_ipr_hash:
      H.human,

    projection_key:
      H.projection,

    payload_hash:
      H.payload,

    decision:
      "GRANT",

    allow_joker_c2_access:
      true,

    verified_biological_subject:
      true,

    matrix_active:
      true,

    ipr_bound_memory:
      true,

    issuer_kind:
      "HBCE_SERVER_AUTHORITY",

    issuer_credential_id_hash:
      H.issuer,

    issuer_authorization_ref_hash:
      H.authorization,

    issued_at:
      "2026-11-13T10:00:00.000Z",

    not_before:
      "2026-11-13T10:00:00.000Z",

    expires_at:
      "2026-11-13T12:00:00.000Z",

    supersedes_policy_record_id:
      null,

    revokes_policy_record_id:
      null,

    legal_certification:
      false,

    ...overrides,
  };
}


function nonGrant(
  decision:
    "DENY" | "REVOKE",

  overrides:
    Partial<PolicyRow> = {},
): PolicyRow {
  return {
    ...grant(),

    policy_record_id:
      decision === "DENY"
        ? H.deny
        : H.revoke,

    decision,

    allow_joker_c2_access:
      false,

    verified_biological_subject:
      false,

    matrix_active:
      false,

    ipr_bound_memory:
      false,

    expires_at:
      null,

    revokes_policy_record_id:
      decision === "REVOKE"
        ? H.grant
        : null,

    ...overrides,
  };
}


function transaction(
  rows:
    PolicyRow[],
): IprOnboardingPreProfilePolicyTransaction {
  return {
    transactionId:
      "tx-wp02-authority-policy",

    async query<
      Row extends import("pg").QueryResultRow =
        import("pg").QueryResultRow
    >() {
      return {
        command: "SELECT",
        rowCount:
          rows.length,
        oid: 0,
        rows:
          rows as unknown as Row[],
        fields: [],
      };
    },
  };
}


function input(
  rows:
    PolicyRow[],
) {
  return {
    transaction:
      transaction(rows),

    tenantId:
      "HBCE-TENANT-SELF-PILOT",

    workspaceId:
      "HBCE-WORKSPACE-RND",

    humanIprHash:
      H.human,

    projectionKey:
      H.projection,

    payloadHash:
      H.payload,

    issuerCredentialIdHash:
      H.issuer,

    now:
      new Date(
        "2026-11-13T11:00:00.000Z",
      ),
  };
}


describe(
  "IPR onboarding pre-profile authority policy",
  () => {
    it(
      "grants only from an active exact-bound GRANT record",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant(),
            ]),
          );

        expect(
          result.ok,
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason,
          );
        }

        expect(
          result.decision,
        ).toBe("GRANT");

        expect(
          result.serverPolicy,
        ).toEqual({
          allowJokerC2Access:
            true,

          verifiedBiologicalSubject:
            true,

          matrixActive:
            true,

          iprBoundMemory:
            true,
        });

        expect(
          result.runtimeAuthorized,
        ).toBe(false);

        expect(
          result.sessionAuthenticated,
        ).toBe(false);

        expect(
          result.profilePersistenceAuthorized,
        ).toBe(true);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );


    it(
      "fails closed when no policy exists",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected fail-closed denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_NOT_FOUND",
        );

        expect(
          result.profilePersistenceAuthorized,
        ).toBe(false);
      },
    );


    it(
      "fails closed for an expired GRANT",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant({
                expires_at:
                  "2026-11-13T10:59:59.000Z",
              }),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected expired denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_EXPIRED",
        );
      },
    );


    it(
      "fails closed before not_before",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant({
                not_before:
                  "2026-11-13T11:30:00.000Z",
              }),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected not-before denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_NOT_YET_VALID",
        );
      },
    );


    it(
      "does not allow a DENY record",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              nonGrant(
                "DENY",
              ),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected DENY.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_DENIED",
        );
      },
    );


    it(
      "rejects a GRANT that has been explicitly revoked",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant(),
              nonGrant(
                "REVOKE",
              ),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected revoked denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_REVOKED",
        );
      },
    );


    it(
      "uses an active successor instead of a superseded GRANT",
      async () => {
        const successor =
          grant({
            policy_record_id:
              H.successor,

            issued_at:
              "2026-11-13T10:30:00.000Z",

            supersedes_policy_record_id:
              H.grant,
          });

        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant(),
              successor,
            ]),
          );

        expect(
          result.ok,
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason,
          );
        }

        expect(
          result.policyRecordId,
        ).toBe(
          H.successor,
        );
      },
    );


    it(
      "fails closed when returned records do not exactly match the requested binding",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant({
                payload_hash:
                  "a".repeat(64),
              }),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected binding denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_BINDING_MISMATCH",
        );
      },
    );


    it(
      "fails closed when a GRANT does not contain all four positive flags",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant({
                matrix_active:
                  false,
              }),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected flag denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_GRANT_FLAGS_INVALID",
        );
      },
    );
  },
);


describe(
  "IPR onboarding pre-profile authority policy adversarial genealogy",
  () => {
    it(
      "does not let a future successor prematurely suppress the currently valid GRANT",
      async () => {
        const futureSuccessor =
          grant({
            policy_record_id:
              H.successor,

            issued_at:
              "2026-11-13T11:30:00.000Z",

            not_before:
              "2026-11-13T11:30:00.000Z",

            expires_at:
              "2026-11-13T13:00:00.000Z",

            supersedes_policy_record_id:
              H.grant,
          });

        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant(),
              futureSuccessor,
            ]),
          );

        expect(
          result.ok,
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason,
          );
        }

        expect(
          result.policyRecordId,
        ).toBe(
          H.grant,
        );
      },
    );


    it(
      "fails closed when a successor references a policy record absent from the returned genealogy",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant({
                policy_record_id:
                  H.successor,

                supersedes_policy_record_id:
                  "b".repeat(64),
              }),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected broken genealogy denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_RECORD_INVALID",
        );
      },
    );


    it(
      "fails closed when a REVOKE references a policy record absent from the returned genealogy",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              nonGrant(
                "REVOKE",
                {
                  revokes_policy_record_id:
                    "c".repeat(64),
                },
              ),
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected broken revocation genealogy denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_RECORD_INVALID",
        );
      },
    );


    it(
      "allows a later valid GRANT to supersede a revoked earlier GRANT only through explicit genealogy",
      async () => {
        const revokedGrant =
          grant();

        const revoke =
          nonGrant(
            "REVOKE",
            {
              issued_at:
                "2026-11-13T10:15:00.000Z",
            },
          );

        const successor =
          grant({
            policy_record_id:
              H.successor,

            issued_at:
              "2026-11-13T10:30:00.000Z",

            not_before:
              "2026-11-13T10:30:00.000Z",

            expires_at:
              "2026-11-13T12:30:00.000Z",

            supersedes_policy_record_id:
              H.grant,
          });

        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              revokedGrant,
              revoke,
              successor,
            ]),
          );

        expect(
          result.ok,
        ).toBe(true);

        if (!result.ok) {
          throw new Error(
            result.reason,
          );
        }

        expect(
          result.policyRecordId,
        ).toBe(
          H.successor,
        );
      },
    );


    it(
      "fails closed when two unsuperseded active GRANT heads exist",
      async () => {
        const competing =
          grant({
            policy_record_id:
              "d".repeat(64),

            issued_at:
              "2026-11-13T10:45:00.000Z",

            not_before:
              "2026-11-13T10:45:00.000Z",

            expires_at:
              "2026-11-13T12:45:00.000Z",
          });

        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy(
            input([
              grant(),
              competing,
            ]),
          );

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "Expected ambiguous genealogy denial.",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_RECORD_INVALID",
        );
      },
    );
  },
);


describe(
  "IPR onboarding pre-profile policy issuer binding",
  () => {
    it(
      "fails closed when the policy issuer credential hash does not match the authenticated ingress credential hash",
      async () => {
        const result =
          await resolveIprOnboardingPreProfileAuthorityPolicy({
            ...input([
              grant({
                issuer_credential_id_hash:
                  "a".repeat(64),
              }),
            ]),

            issuerCredentialIdHash:
              H.issuer,
          });

        expect(
          result.ok,
        ).toBe(false);

        if (result.ok) {
          throw new Error(
            "EXPECTED_POLICY_ISSUER_BINDING_DENIAL",
          );
        }

        expect(
          result.reason,
        ).toBe(
          "POLICY_ISSUER_CREDENTIAL_MISMATCH",
        );

        expect(
          result.profilePersistenceAuthorized,
        ).toBe(false);

        expect(
          result.runtimeAuthorized,
        ).toBe(false);

        expect(
          result.sessionAuthenticated,
        ).toBe(false);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );
  },
);

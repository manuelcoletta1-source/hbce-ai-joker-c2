import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";

import type {
  HbceTransactionContext
} from "../lib/ipr-database-transaction";

import {
  getProcessIprAccountStore,
  IPR_ACCOUNT_TRANSACTIONAL_PERSISTENCE_BOUNDARY,
  persistIprAccountProfileInTransaction
} from "../lib/ipr-account-store";


type RecordedQuery = {
  sql: string;
  parameters: readonly unknown[];
};


function buildProfileRow(
  parameters: readonly unknown[],
  legalCertification = false
) {
  return {
    human_ipr:
      String(parameters[0]),

    tenant_id:
      parameters[1] === null
        ? null
        : String(parameters[1]),

    workspace_id:
      parameters[2] === null
        ? null
        : String(parameters[2]),

    account_id:
      String(parameters[3]),

    entity:
      String(parameters[4]),

    subject_kind:
      String(parameters[5]),

    certificate_id:
      String(parameters[6]),

    certificate_kind:
      String(parameters[7]),

    certificate_status:
      String(parameters[8]),

    certificate_scope:
      JSON.parse(
        String(
          parameters[9] ?? "[]"
        )
      ),

    card_serial:
      parameters[10] === null
        ? null
        : String(parameters[10]),

    certificate_hash:
      parameters[11] === null
        ? null
        : String(parameters[11]),

    access_decision:
      String(parameters[12]),

    access_scope:
      String(parameters[13]),

    identity_binding:
      String(parameters[14]),

    matrix_state:
      String(parameters[15]),

    semantic_memory_scope:
      String(parameters[16]),

    source:
      String(parameters[17]),

    handoff_hash:
      parameters[18] === null
        ? null
        : String(parameters[18]),

    profile_hash:
      String(parameters[19]),

    created_at:
      "2026-08-26T15:30:00.000Z",

    updated_at:
      "2026-08-26T15:30:00.000Z",

    last_login_at:
      null,

    profile_payload:
      JSON.parse(
        String(
          parameters[20] ?? "{}"
        )
      ),

    legal_certification:
      legalCertification
  };
}


function createTransaction(input?: {
  profileRows?: number;
  legalCertification?: boolean;
  subjectFailure?: boolean;
}) {
  const calls:
    RecordedQuery[] = [];

  const transaction = {
    async query(
      sql: string,
      parameters:
        readonly unknown[] = []
    ) {
      const normalized =
        sql.trim();

      calls.push({
        sql:
          normalized,
        parameters:
          [...parameters]
      });

      if (
        input?.subjectFailure &&
        normalized.startsWith(
          "INSERT INTO ipr_subjects"
        )
      ) {
        throw new Error(
          "SIMULATED_SUBJECT_WRITE_FAILURE"
        );
      }

      if (
        normalized.startsWith(
          "INSERT INTO ipr_account_profiles"
        )
      ) {
        if (
          input?.profileRows ===
          0
        ) {
          return {
            rows: [],
            rowCount: 0
          };
        }

        return {
          rows: [
            buildProfileRow(
              parameters,
              input?.legalCertification ??
                false
            )
          ],
          rowCount: 1
        };
      }

      return {
        rows: [],
        rowCount: 1
      };
    }
  } as unknown as Pick<
    HbceTransactionContext,
    "query"
  >;

  return {
    transaction,
    calls
  };
}


const PROFILE_INPUT = {
  humanIpr:
    "IPR-C3B-TRANSACTION-0001",

  tenantId:
    "HBCE-TENANT-C3B",

  workspaceId:
    "HBCE-WORKSPACE-C3B",

  accountId:
    "HBCE-ACCOUNT-C3B",

  certificateId:
    "HBCE-CERT-C3B",

  certificateStatus:
    "ACTIVE" as const,

  certificateScope: [
    "JOKER_C2_ACCESS"
  ],

  source:
    "D038_C3B_TEST"
};


describe(
  "IPR account transaction-scoped persistence",
  () => {
    beforeEach(
      () => {
        getProcessIprAccountStore()
          .clear();
      }
    );


    it(
      "writes subject then profile through only the caller-owned transaction",
      async () => {
        const {
          transaction,
          calls
        } =
          createTransaction();

        const result =
          await persistIprAccountProfileInTransaction({
            transaction,
            profileInput:
              PROFILE_INPUT
          });

        expect(
          calls
        ).toHaveLength(
          2
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "INSERT INTO ipr_subjects"
        );

        expect(
          calls[1]?.sql
        ).toContain(
          "INSERT INTO ipr_account_profiles"
        );

        expect(
          result.transactionScoped
        ).toBe(
          true
        );

        expect(
          result.subjectPersisted
        ).toBe(
          true
        );

        expect(
          result.profilePersisted
        ).toBe(
          true
        );

        expect(
          result.processFallbackMutated
        ).toBe(
          false
        );

        expect(
          result.sessionCreated
        ).toBe(
          false
        );

        expect(
          result.runtimeAuthorized
        ).toBe(
          false
        );

        expect(
          result.legalCertification
        ).toBe(
          false
        );
      }
    );


    it(
      "does not mutate the process fallback before the caller commits",
      async () => {
        const {
          transaction
        } =
          createTransaction();

        await persistIprAccountProfileInTransaction({
          transaction,
          profileInput:
            PROFILE_INPUT
        });

        const fallback =
          getProcessIprAccountStore()
            .getProfile(
              PROFILE_INPUT.humanIpr
            );

        expect(
          fallback
        ).toBeNull();
      }
    );


    it(
      "preserves fail-closed profile defaults when authority fields are omitted",
      async () => {
        const {
          transaction,
          calls
        } =
          createTransaction();

        await persistIprAccountProfileInTransaction({
          transaction,
          profileInput: {
            humanIpr:
              "IPR-C3B-DEFAULTS-0001",

            tenantId:
              "HBCE-TENANT-C3B",

            workspaceId:
              "HBCE-WORKSPACE-C3B",

            accountId:
              "HBCE-ACCOUNT-C3B-DEFAULTS",

            certificateId:
              "HBCE-CERT-C3B-DEFAULTS",

            source:
              "D038_C3B_TEST"
          }
        });

        const profileWrite =
          calls[1];

        expect(
          profileWrite
        ).toBeDefined();

        expect(
          profileWrite?.parameters[12]
        ).toBe(
          "AUTHENTICATION_REQUIRED"
        );

        expect(
          profileWrite?.parameters[13]
        ).toBe(
          "NO_ACCESS_SCOPE"
        );

        expect(
          profileWrite?.parameters[14]
        ).toBe(
          "NO_AUTHENTICATED_IPR_SESSION"
        );

        expect(
          profileWrite?.parameters[15]
        ).toBe(
          "MATRIX_LIMITED"
        );

        expect(
          profileWrite?.parameters[16]
        ).toBe(
          "RUNTIME_ONLY"
        );
      }
    );


    it(
      "fails closed when the profile write returns no row",
      async () => {
        const {
          transaction
        } =
          createTransaction({
            profileRows:
              0
          });

        await expect(
          persistIprAccountProfileInTransaction({
            transaction,
            profileInput:
              PROFILE_INPUT
          })
        ).rejects.toThrow(
          "IPR_ACCOUNT_TRANSACTIONAL_PROFILE_WRITE_MISSING"
        );
      }
    );


    it(
      "fails closed if a persisted row claims legal certification",
      async () => {
        const {
          transaction
        } =
          createTransaction({
            legalCertification:
              true
          });

        await expect(
          persistIprAccountProfileInTransaction({
            transaction,
            profileInput:
              PROFILE_INPUT
          })
        ).rejects.toThrow(
          "IPR_ACCOUNT_TRANSACTIONAL_LEGAL_CERTIFICATION_FORBIDDEN"
        );
      }
    );


    it(
      "propagates transaction query failure without fallback recovery",
      async () => {
        const {
          transaction
        } =
          createTransaction({
            subjectFailure:
              true
          });

        await expect(
          persistIprAccountProfileInTransaction({
            transaction,
            profileInput:
              PROFILE_INPUT
          })
        ).rejects.toThrow(
          "SIMULATED_SUBJECT_WRITE_FAILURE"
        );

        expect(
          getProcessIprAccountStore()
            .getProfile(
              PROFILE_INPUT.humanIpr
            )
        ).toBeNull();
      }
    );


    it(
      "publishes an explicit non-authoritative transaction boundary",
      () => {
        expect(
          IPR_ACCOUNT_TRANSACTIONAL_PERSISTENCE_BOUNDARY
        ).toContain(
          "does not authenticate"
        );

        expect(
          IPR_ACCOUNT_TRANSACTIONAL_PERSISTENCE_BOUNDARY
        ).toContain(
          "only after"
        );
      }
    );
  }
);

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  HBCE_SELF_PILOT_HUMAN_IPR,
} from "../../../lib/ipr-database-schema";

import {
  PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS,
  PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_PROTOCOL,
  resolvePlatformCoreEvidenceSetOwnerBinding,
} from "./evidence-set-owner-binding-resolver";

const databaseHarness =
  vi.hoisted(
    () => ({
      configured:
        true,

      transactionFailure:
        false,

      rows:
        [] as Array<
          Record<
            string,
            unknown
          >
        >,

      transactionCalls:
        0,

      queryCalls:
        0,

      lastSql:
        "",

      lastParameters:
        [] as readonly unknown[],

      lastOptions:
        null as
          | Record<
              string,
              unknown
            >
          | null,
    }),
  );

vi.mock(
  "../../../lib/ipr-database-transaction",
  () => ({
    isHbceTransactionDatabaseConfigured:
      () =>
        databaseHarness.configured,

    withHbceDatabaseTransaction:
      async (
        operation:
          (
            transaction:
              any,
          ) =>
            Promise<unknown>,
        options:
          Record<
            string,
            unknown
          > = {},
      ) => {
        databaseHarness.transactionCalls +=
          1;

        databaseHarness.lastOptions =
          options;

        if (
          databaseHarness.transactionFailure
        ) {
          return {
            ok:
              false,

            error:
              "TEST_DATABASE_FAILURE",
          };
        }

        const value =
          await operation({
            query:
              async (
                sql:
                  string,
                parameters:
                  readonly unknown[] =
                    [],
              ) => {
                databaseHarness.queryCalls +=
                  1;

                databaseHarness.lastSql =
                  sql;

                databaseHarness.lastParameters =
                  parameters;

                return {
                  rows:
                    databaseHarness.rows,
                };
              },
          });

        return {
          ok:
            true,

          value,
        };
      },
  }),
);

function eligibleSubject(
  overrides:
    Partial<
      Record<
        | "human_ipr"
        | "subject_kind"
        | "status"
        | "legal_certification",
        unknown
      >
    > = {},
) {
  return {
    human_ipr:
      HBCE_SELF_PILOT_HUMAN_IPR,

    subject_kind:
      "BIOLOGICAL_SUBJECT",

    status:
      "ACTIVE",

    legal_certification:
      false,

    ...overrides,
  };
}

function validInput(
  overrides:
    Partial<{
      authenticatedHumanIpr:
        unknown;

      authenticatedIdentityBinding:
        unknown;

      canonicalOwnerSubjectRef:
        unknown;
    }> = {},
) {
  return {
    authenticatedHumanIpr:
      HBCE_SELF_PILOT_HUMAN_IPR,

    authenticatedIdentityBinding:
      PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_IDENTITY_CLASS,

    canonicalOwnerSubjectRef:
      HBCE_SELF_PILOT_HUMAN_IPR,

    ...overrides,
  };
}

describe(
  "Platform Core EvidenceSet owner binding resolver",
  () => {
    beforeEach(
      () => {
        databaseHarness.configured =
          true;

        databaseHarness.transactionFailure =
          false;

        databaseHarness.rows =
          [
            eligibleSubject(),
          ];

        databaseHarness.transactionCalls =
          0;

        databaseHarness.queryCalls =
          0;

        databaseHarness.lastSql =
          "";

        databaseHarness.lastParameters =
          [];

        databaseHarness.lastOptions =
          null;
      },
    );

    it(
      "B01 returns MATCH for exact verified Human IPR and eligible durable subject",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          result,
        ).toEqual({
          protocol:
            PLATFORM_CORE_EVIDENCE_SET_OWNER_BINDING_PROTOCOL,

          kind:
            "MATCH",

          reason:
            "EXACT_OWNER_MATCH",

          durableSubjectConfirmed:
            true,
        });

        expect(
          databaseHarness.transactionCalls,
        ).toBe(
          1,
        );

        expect(
          databaseHarness.queryCalls,
        ).toBe(
          1,
        );

        expect(
          databaseHarness.lastSql,
        ).toContain(
          "FROM ipr_subjects",
        );

        expect(
          databaseHarness.lastParameters,
        ).toEqual([
          HBCE_SELF_PILOT_HUMAN_IPR,
        ]);

        expect(
          databaseHarness.lastOptions,
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",

          readOnly:
            true,
        });

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "B02 returns MISMATCH when canonical owner differs exactly",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput({
              canonicalOwnerSubjectRef:
                "IPR-4",
            }),
          );

        expect(
          result.kind,
        ).toBe(
          "MISMATCH",
        );

        expect(
          result.reason,
        ).toBe(
          "EXACT_OWNER_MISMATCH",
        );

        expect(
          result.durableSubjectConfirmed,
        ).toBe(
          true,
        );
      },
    );

    it(
      "B03 returns UNRESOLVED when authenticated Human IPR is missing",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput({
              authenticatedHumanIpr:
                "",
            }),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "AUTHENTICATED_HUMAN_IPR_MISSING",

          durableSubjectConfirmed:
            false,
        });

        expect(
          databaseHarness.transactionCalls,
        ).toBe(
          0,
        );
      },
    );

    it(
      "B04 returns UNRESOLVED for the wrong authenticated identity binding class",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput({
              authenticatedIdentityBinding:
                "IPR_ACCOUNT_AUTHENTICATED",
            }),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "AUTHENTICATED_IDENTITY_BINDING_INVALID",
        });

        expect(
          databaseHarness.transactionCalls,
        ).toBe(
          0,
        );
      },
    );

    it(
      "B05 never returns MATCH when database configuration or transaction resolution fails",
      async () => {
        databaseHarness.configured =
          false;

        const notConfigured =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          notConfigured,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "DATABASE_NOT_CONFIGURED",
        });

        expect(
          databaseHarness.transactionCalls,
        ).toBe(
          0,
        );

        databaseHarness.configured =
          true;

        databaseHarness.transactionFailure =
          true;

        const failed =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          failed,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "DATABASE_FAILURE",
        });

        expect(
          failed.kind,
        ).not.toBe(
          "MATCH",
        );
      },
    );

    it(
      "B06 returns UNRESOLVED when durable subject is missing",
      async () => {
        databaseHarness.rows =
          [];

        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "DURABLE_SUBJECT_NOT_FOUND",
        });
      },
    );

    it(
      "B07 returns UNRESOLVED when durable subject is inactive",
      async () => {
        databaseHarness.rows =
          [
            eligibleSubject({
              status:
                "INACTIVE",
            }),
          ];

        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "DURABLE_SUBJECT_RECORD_INVALID",
        });
      },
    );

    it(
      "B08 returns UNRESOLVED for wrong subject kind or invalid legal certification state",
      async () => {
        databaseHarness.rows =
          [
            eligibleSubject({
              subject_kind:
                "ORGANIZATION",
            }),
          ];

        const wrongKind =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          wrongKind,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "DURABLE_SUBJECT_RECORD_INVALID",
        });

        databaseHarness.rows =
          [
            eligibleSubject({
              legal_certification:
                true,
            }),
          ];

        const wrongLegalState =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput(),
          );

        expect(
          wrongLegalState,
        ).toMatchObject({
          kind:
            "UNRESOLVED",

          reason:
            "DURABLE_SUBJECT_RECORD_INVALID",
        });
      },
    );

    it(
      "B09 does not derive client-like SUBJECT namespace references",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput({
              canonicalOwnerSubjectRef:
                `SUBJECT:${HBCE_SELF_PILOT_HUMAN_IPR}`,
            }),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "MISMATCH",

          reason:
            "EXACT_OWNER_MISMATCH",

          durableSubjectConfirmed:
            true,
        });
      },
    );

    it(
      "B10 never accepts accountId-like material as an owner binding substitute",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput({
              canonicalOwnerSubjectRef:
                "IPR-ACCOUNT-AAAAAAAAAAAAAAAAAAAAAAAA",
            }),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "MISMATCH",

          reason:
            "EXACT_OWNER_MISMATCH",
        });
      },
    );

    it(
      "B11 never accepts subjectId or hash-like material as an owner binding substitute",
      async () => {
        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            validInput({
              canonicalOwnerSubjectRef:
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            }),
          );

        expect(
          result,
        ).toMatchObject({
          kind:
            "MISMATCH",

          reason:
            "EXACT_OWNER_MISMATCH",
        });
      },
    );

    it(
      "B12 does not mutate identity input or durable subject material",
      async () => {
        const input =
          Object.freeze(
            validInput(),
          );

        const subject =
          Object.freeze(
            eligibleSubject(),
          );

        databaseHarness.rows =
          [
            subject,
          ];

        const inputBefore =
          JSON.stringify(
            input,
          );

        const subjectBefore =
          JSON.stringify(
            subject,
          );

        const result =
          await resolvePlatformCoreEvidenceSetOwnerBinding(
            input,
          );

        expect(
          result.kind,
        ).toBe(
          "MATCH",
        );

        expect(
          JSON.stringify(
            input,
          ),
        ).toBe(
          inputBefore,
        );

        expect(
          JSON.stringify(
            subject,
          ),
        ).toBe(
          subjectBefore,
        );

        expect(
          Object.isFrozen(
            input,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            subject,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);

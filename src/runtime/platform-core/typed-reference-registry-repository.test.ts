import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const transactionHarness =
  vi.hoisted(
    () => ({
      steps:
        [] as Array<any>,

      options:
        [] as Array<any>,

      queries:
        [] as Array<{
          sql:
            string;

          parameters:
            readonly unknown[];
        }>,
    }),
  );

vi.mock(
  "../../../lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      vi.fn(
        async (
          operation:
            (context: any) =>
              Promise<any>,
          options:
            any = {},
        ) => {
          transactionHarness.options.push(
            options,
          );

          const step =
            transactionHarness.steps.shift();

          if (
            step ===
              undefined
          ) {
            return {
              ok:
                false,
              error:
                new Error(
                  "HBCE_TEST_TRANSACTION_STEP_MISSING",
                ),
            };
          }

          if (
            step.kind ===
              "FAILURE"
          ) {
            return {
              ok:
                false,
              error:
                step.error,
            };
          }

          const responses =
            [
              ...step.responses,
            ];

          const context = {
            client:
              {},

            transactionId:
              "HBCE_TYPED_REFERENCE_REGISTRY_TEST_TX",

            startedAt:
              "2026-09-08T17:00:00.000Z",

            query:
              async (
                sql:
                  string,
                parameters:
                  readonly unknown[] =
                    [],
              ) => {
                transactionHarness.queries.push({
                  sql,
                  parameters,
                });

                const response =
                  responses.shift();

                if (
                  response ===
                    undefined
                ) {
                  throw new Error(
                    "HBCE_TEST_QUERY_RESPONSE_MISSING",
                  );
                }

                return {
                  rows:
                    response,

                  rowCount:
                    response.length,
                };
              },
          };

          try {
            const value =
              await operation(
                context,
              );

            if (
              responses.length !==
                0
            ) {
              throw new Error(
                "HBCE_TEST_UNUSED_QUERY_RESPONSE",
              );
            }

            return {
              ok:
                true,
              value,
            };
          } catch (
            error
          ) {
            return {
              ok:
                false,
              error,
            };
          }
        },
      ),
  }),
);

import {
  persistPlatformCoreTypedReferenceRegistration,
  readPlatformCoreTypedReferenceRegistration,
} from "./typed-reference-registry-repository";

const REGISTERED_AT_RAW =
  "2026-09-08T19:00:00+02:00";

const REGISTERED_AT_ISO =
  "2026-09-08T17:00:00.000Z";

const COMMITMENT_PROFILE =
  "HBCE-TYPED-REFERENCE-BACKING-v1";

const COMMITMENT_SHA =
  "a".repeat(
    64,
  );

type InputMaterial =
  Readonly<{
    referenceType:
      string;

    reference:
      string;

    backingCommitmentProfile:
      string;

    backingCommitmentSha256:
      string;
  }>;

function makeInput(
  overrides:
    Partial<InputMaterial> =
      {},
): InputMaterial {
  return Object.freeze({
    referenceType:
      "EVIDENCE",

    reference:
      "EVIDENCE:CASE-001",

    backingCommitmentProfile:
      COMMITMENT_PROFILE,

    backingCommitmentSha256:
      COMMITMENT_SHA,

    ...overrides,
  });
}

function rowFrom(
  input:
    InputMaterial =
      makeInput(),
  overrides:
    Record<string, unknown> =
      {},
): Record<string, unknown> {
  return {
    reference_type:
      input.referenceType,

    reference:
      input.reference,

    backing_commitment_profile:
      input.backingCommitmentProfile,

    backing_commitment_sha256:
      input.backingCommitmentSha256,

    registered_at:
      REGISTERED_AT_RAW,

    ...overrides,
  };
}

function queueTransaction(
  ...responses:
    Array<
      readonly Record<
        string,
        unknown
      >[]
    >
): void {
  transactionHarness.steps.push({
    kind:
      "TRANSACTION",

    responses,
  });
}

function queueFailure(
  message:
    string,
): void {
  transactionHarness.steps.push({
    kind:
      "FAILURE",

    error:
      new Error(
        message,
      ),
  });
}

describe(
  "Platform Core typed reference registry repository",
  () => {
    beforeEach(
      () => {
        transactionHarness.steps.length =
          0;

        transactionHarness.options.length =
          0;

        transactionHarness.queries.length =
          0;

        vi.clearAllMocks();
      },
    );

    it(
      "R01 valid first registration persists exact durable material",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
            ),
          ],
        );

        const result =
          await persistPlatformCoreTypedReferenceRegistration(
            input,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          result.registration,
        ).toEqual({
          referenceType:
            input.referenceType,

          reference:
            input.reference,

          backingCommitmentProfile:
            input.backingCommitmentProfile,

          backingCommitmentSha256:
            input.backingCommitmentSha256,

          registeredAt:
            REGISTERED_AT_ISO,
        });

        expect(
          transactionHarness.options[0],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",
        });

        expect(
          transactionHarness.queries,
        ).toHaveLength(
          1,
        );
      },
    );

    it(
      "R02 exact duplicate is an idempotent replay",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [],
          [
            rowFrom(
              input,
            ),
          ],
        );

        const result =
          await persistPlatformCoreTypedReferenceRegistration(
            input,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );

        expect(
          result.registration.reference,
        ).toBe(
          input.reference,
        );

        expect(
          transactionHarness.queries,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "R03 same typed identity with different commitment profile fails closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [],
          [
            rowFrom(
              input,
              {
                backing_commitment_profile:
                  "HBCE-TYPED-REFERENCE-BACKING-v2",
              },
            ),
          ],
        );

        await expect(
          persistPlatformCoreTypedReferenceRegistration(
            input,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICTING_DUPLICATE",
        });
      },
    );

    it(
      "R04 same typed identity with different commitment SHA fails closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [],
          [
            rowFrom(
              input,
              {
                backing_commitment_sha256:
                  "b".repeat(
                    64,
                  ),
              },
            ),
          ],
        );

        await expect(
          persistPlatformCoreTypedReferenceRegistration(
            input,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICTING_DUPLICATE",
        });
      },
    );

    it(
      "R05 unsupported reference type fails before transaction",
      async () => {
        await expect(
          persistPlatformCoreTypedReferenceRegistration({
            ...makeInput(),

            referenceType:
              "AUTHORITY",
          }),
        ).rejects.toMatchObject({
          code:
            "UNSUPPORTED_REFERENCE_TYPE",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "R06 malformed reference fails before transaction",
      async () => {
        await expect(
          persistPlatformCoreTypedReferenceRegistration({
            ...makeInput(),

            reference:
              "bad reference",
          }),
        ).rejects.toMatchObject({
          code:
            "INVALID_INPUT",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "R07 invalid commitment profiles fail before transaction",
      async () => {
        const invalidProfiles = [
          "",
          " UNTRIMMED",
          "P".repeat(
            161,
          ),
        ];

        for (
          const profile of
          invalidProfiles
        ) {
          await expect(
            persistPlatformCoreTypedReferenceRegistration({
              ...makeInput(),

              backingCommitmentProfile:
                profile,
            }),
          ).rejects.toMatchObject({
            code:
              "INVALID_INPUT",
          });
        }

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "R08 malformed commitment SHA fails before transaction",
      async () => {
        const invalidHashes = [
          "A".repeat(
            64,
          ),
          "a".repeat(
            63,
          ),
        ];

        for (
          const hash of
          invalidHashes
        ) {
          await expect(
            persistPlatformCoreTypedReferenceRegistration({
              ...makeInput(),

              backingCommitmentSha256:
                hash,
            }),
          ).rejects.toMatchObject({
            code:
              "INVALID_INPUT",
          });
        }

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "R09 exact read returns durable registration with normalized timestamp",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
            ),
          ],
        );

        const result =
          await readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          );

        expect(
          result,
        ).toEqual({
          referenceType:
            input.referenceType,

          reference:
            input.reference,

          backingCommitmentProfile:
            input.backingCommitmentProfile,

          backingCommitmentSha256:
            input.backingCommitmentSha256,

          registeredAt:
            REGISTERED_AT_ISO,
        });
      },
    );

    it(
      "R10 exact read absence returns null",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [],
        );

        const result =
          await readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          );

        expect(
          result,
        ).toBeNull();
      },
    );

    it(
      "R11 persisted invalid reference type fails closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
              {
                reference_type:
                  "AUTHORITY",
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "R12 persisted malformed reference fails closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
              {
                reference:
                  "bad reference",
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "R13 persisted malformed commitment profile fails closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
              {
                backing_commitment_profile:
                  " UNTRIMMED",
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "R14 persisted malformed commitment SHA fails closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
              {
                backing_commitment_sha256:
                  "A".repeat(
                    64,
                  ),
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "R15 write retries one serialization failure then succeeds",
      async () => {
        const input =
          makeInput();

        queueFailure(
          "serialization failure SQLSTATE 40001",
        );

        queueTransaction(
          [
            rowFrom(
              input,
            ),
          ],
        );

        const result =
          await persistPlatformCoreTypedReferenceRegistration(
            input,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "R16 write serialization retries exhaust after exactly three attempts",
      async () => {
        queueFailure(
          "SQLSTATE 40001 serialization failure",
        );

        queueFailure(
          "SQLSTATE 40001 serialization failure",
        );

        queueFailure(
          "SQLSTATE 40001 serialization failure",
        );

        await expect(
          persistPlatformCoreTypedReferenceRegistration(
            makeInput(),
          ),
        ).rejects.toMatchObject({
          code:
            "SERIALIZATION_RETRIES_EXHAUSTED",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          3,
        );
      },
    );

    it(
      "R17 ordinary write database failure does not semantic-retry",
      async () => {
        queueFailure(
          "connection lost",
        );

        await expect(
          persistPlatformCoreTypedReferenceRegistration(
            makeInput(),
          ),
        ).rejects.toMatchObject({
          code:
            "DATABASE_FAILURE",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          1,
        );
      },
    );

    it(
      "R18 read uses SERIALIZABLE read-only transaction boundary",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
            ),
          ],
        );

        await readPlatformCoreTypedReferenceRegistration(
          input.referenceType,
          input.reference,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          1,
        );

        expect(
          transactionHarness.options[0],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",

          readOnly:
            true,
        });
      },
    );

    it(
      "R19 read retries serialization failure then succeeds",
      async () => {
        const input =
          makeInput();

        queueFailure(
          "code 40001 serialization failure",
        );

        queueTransaction(
          [
            rowFrom(
              input,
            ),
          ],
        );

        const result =
          await readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          );

        expect(
          result?.reference,
        ).toBe(
          input.reference,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );

        expect(
          transactionHarness.options[1],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",

          readOnly:
            true,
        });
      },
    );

    it(
      "R20 multiple exact rows fail closed",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [
            rowFrom(
              input,
            ),

            rowFrom(
              input,
            ),
          ],
        );

        await expect(
          readPlatformCoreTypedReferenceRegistration(
            input.referenceType,
            input.reference,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "R21 registered_at is excluded from exact duplicate replay identity",
      async () => {
        const input =
          makeInput();

        queueTransaction(
          [],
          [
            rowFrom(
              input,
              {
                registered_at:
                  "2025-01-01T10:15:00+01:00",
              },
            ),
          ],
        );

        const result =
          await persistPlatformCoreTypedReferenceRegistration(
            input,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );

        expect(
          result.registration.registeredAt,
        ).toBe(
          "2025-01-01T09:15:00.000Z",
        );
      },
    );

    it(
      "R22 same backing commitment is valid for two different typed identities",
      async () => {
        const first =
          makeInput({
            referenceType:
              "EVIDENCE",

            reference:
              "EVIDENCE:CASE-A",
          });

        const second =
          makeInput({
            referenceType:
              "CONTROL",

            reference:
              "CONTROL:CASE-B",
          });

        queueTransaction(
          [
            rowFrom(
              first,
            ),
          ],
        );

        queueTransaction(
          [
            rowFrom(
              second,
            ),
          ],
        );

        const firstResult =
          await persistPlatformCoreTypedReferenceRegistration(
            first,
          );

        const secondResult =
          await persistPlatformCoreTypedReferenceRegistration(
            second,
          );

        expect(
          firstResult.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          secondResult.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          firstResult.registration.backingCommitmentSha256,
        ).toBe(
          secondResult.registration.backingCommitmentSha256,
        );

        expect(
          firstResult.registration.reference,
        ).not.toBe(
          secondResult.registration.reference,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "R23 SQL BTRIM parity preserves TAB and NBSP edges while rejecting ASCII edge space",
      async () => {
        const tabProfile =
          "\tPROFILE\t";

        const nbspProfile =
          "\u00A0PROFILE\u00A0";

        const tabInput =
          makeInput({
            backingCommitmentProfile:
              tabProfile,
          });

        const nbspInput =
          makeInput({
            reference:
              "EVIDENCE:CASE-NBSP",

            backingCommitmentProfile:
              nbspProfile,
          });

        queueTransaction(
          [
            rowFrom(
              tabInput,
            ),
          ],
        );

        queueTransaction(
          [
            rowFrom(
              nbspInput,
            ),
          ],
        );

        const tabResult =
          await persistPlatformCoreTypedReferenceRegistration(
            tabInput,
          );

        const nbspResult =
          await persistPlatformCoreTypedReferenceRegistration(
            nbspInput,
          );

        expect(
          tabResult.registration.backingCommitmentProfile,
        ).toBe(
          tabProfile,
        );

        expect(
          nbspResult.registration.backingCommitmentProfile,
        ).toBe(
          nbspProfile,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );

        await expect(
          persistPlatformCoreTypedReferenceRegistration({
            ...makeInput(),

            reference:
              "EVIDENCE:CASE-LEADING-SPACE",

            backingCommitmentProfile:
              " PROFILE",
          }),
        ).rejects.toMatchObject({
          code:
            "INVALID_INPUT",
        });

        await expect(
          persistPlatformCoreTypedReferenceRegistration({
            ...makeInput(),

            reference:
              "EVIDENCE:CASE-TRAILING-SPACE",

            backingCommitmentProfile:
              "PROFILE ",
          }),
        ).rejects.toMatchObject({
          code:
            "INVALID_INPUT",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "R24 SQL CHAR_LENGTH parity accepts 160 Unicode code points and rejects 161",
      async () => {
        const profile160 =
          "😀".repeat(
            160,
          );

        const profile161 =
          "😀".repeat(
            161,
          );

        expect(
          profile160.length,
        ).toBe(
          320,
        );

        expect(
          Array.from(
            profile160,
          ),
        ).toHaveLength(
          160,
        );

        expect(
          Array.from(
            profile161,
          ),
        ).toHaveLength(
          161,
        );

        const accepted =
          makeInput({
            reference:
              "EVIDENCE:CASE-UNICODE-160",

            backingCommitmentProfile:
              profile160,
          });

        queueTransaction(
          [
            rowFrom(
              accepted,
            ),
          ],
        );

        const result =
          await persistPlatformCoreTypedReferenceRegistration(
            accepted,
          );

        expect(
          result.registration.backingCommitmentProfile,
        ).toBe(
          profile160,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          1,
        );

        await expect(
          persistPlatformCoreTypedReferenceRegistration({
            ...makeInput(),

            reference:
              "EVIDENCE:CASE-UNICODE-161",

            backingCommitmentProfile:
              profile161,
          }),
        ).rejects.toMatchObject({
          code:
            "INVALID_INPUT",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          1,
        );
      },
    );
  },
);

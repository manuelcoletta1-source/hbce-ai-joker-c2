import {
  readFileSync,
} from "node:fs";

import {
  join,
} from "node:path";

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
      plans:
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

          const plan =
            transactionHarness.plans.shift();

          if (!plan) {
            throw new Error(
              "UNPLANNED_TRANSACTION",
            );
          }

          if (
            plan.kind ===
              "FAIL"
          ) {
            return {
              ok:
                false,

              transactionId:
                "HBCE_TEST_TX",

              state:
                "ROLLED_BACK",

              startedAt:
                "2026-09-08T10:00:00.000Z",

              completedAt:
                "2026-09-08T10:00:00.001Z",

              durationMs:
                1,

              error:
                plan.error,

              rollbackError:
                null,
            };
          }

          const context = {
            client:
              {},

            transactionId:
              "HBCE_TEST_TX",

            startedAt:
              "2026-09-08T10:00:00.000Z",

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
                  plan.responses.shift();

                if (!response) {
                  throw new Error(
                    "UNPLANNED_QUERY",
                  );
                }

                return {
                  rows:
                    response.rows,
                };
              },
          };

          try {
            const value =
              await operation(
                context,
              );

            return {
              ok:
                true,

              transactionId:
                "HBCE_TEST_TX",

              state:
                "COMMITTED",

              startedAt:
                "2026-09-08T10:00:00.000Z",

              completedAt:
                "2026-09-08T10:00:00.001Z",

              durationMs:
                1,

              value,
            };
          } catch (
            error
          ) {
            return {
              ok:
                false,

              transactionId:
                "HBCE_TEST_TX",

              state:
                "ROLLED_BACK",

              startedAt:
                "2026-09-08T10:00:00.000Z",

              completedAt:
                "2026-09-08T10:00:00.001Z",

              durationMs:
                1,

              error:
                error instanceof Error
                  ? error.message
                  : String(
                      error,
                    ),

              rollbackError:
                null,
            };
          }
        },
      ),
  }),
);

import {
  buildPlatformCoreCanonicalEvidenceSetGenesis,
  buildPlatformCoreCanonicalEvidenceSetSuccessor,
  type PlatformCoreCanonicalEvidenceSet,
} from "./canonical-evidence-set-builder";

import {
  canonicalizePlatformCorePayloadPreimage,
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  persistPlatformCoreCanonicalEvidenceSet,
  readPlatformCoreCanonicalEvidenceSet,
  type PlatformCoreEvidenceSetReferenceResolutionPort,
} from "./evidence-set-repository";

const MIGRATION_PATH =
  join(
    process.cwd(),
    "database/migrations/20260908_platform_core_evidence_sets.sql",
  );

const MIGRATION_SQL =
  readFileSync(
    MIGRATION_PATH,
    "utf8",
  );

const AUTHORITY_SHA256 =
  "a".repeat(
    64,
  );

function queueTransaction(
  ...rowsByQuery:
    Array<readonly unknown[]>
): void {
  transactionHarness.plans.push({
    kind:
      "RUN",

    responses:
      rowsByQuery.map(
        (
          rows,
        ) => ({
          rows:
            [...rows],
        }),
      ),
  });
}

function queueFailure(
  error:
    string,
): void {
  transactionHarness.plans.push({
    kind:
      "FAIL",

    error,
  });
}

function makeResolver(
  overrides:
    Partial<
      PlatformCoreEvidenceSetReferenceResolutionPort
    > =
      {},
):
  PlatformCoreEvidenceSetReferenceResolutionPort {
  return {
    resolveAuthority:
      async () =>
        true,

    resolveOwnerSubject:
      async () =>
        true,

    resolveReference:
      async () =>
        true,

    ...overrides,
  };
}

function makeGenesis(
  createdAt =
    "2026-09-08T10:00:00.000Z",
):
  PlatformCoreCanonicalEvidenceSet {
  return buildPlatformCoreCanonicalEvidenceSetGenesis({
    evidence_set_id:
      "EVS-TEST-001",

    case_id:
      "CASE:TEST:001",

    domain:
      "external_system_validation",

    target: {
      target_class:
        "controlled_system",

      target_ref:
        "TARGET:TEST:001",

      system_ref:
        "SYSTEM:TEST:001",
    },

    owner_subject_ref:
      "SUBJECT:TEST:001",

    authority_ref:
      "AUT-TEST-001",

    authority_version:
      1,

    authority_sha256:
      AUTHORITY_SHA256,

    created_at:
      createdAt,

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:TEST:001",

    control_references: [
      "CONTROL:TEST:001",
    ],

    observation_references:
      [],

    artifact_references:
      [],

    external_confirmation_references:
      [],

    event_references: [
      "EVENT:TEST:001",
    ],

    evt_reference:
      null,

    opc_reference:
      "OPC:TEST:001",

    genealogy: {
      cause:
        "TEST_GENESIS",

      evidence_reference:
        "EVIDENCE:GENEALOGY:001",

      timestamp:
        createdAt,
    },
  });
}

function makeOpenSuccessor(
  predecessor:
    PlatformCoreCanonicalEvidenceSet,
):
  PlatformCoreCanonicalEvidenceSet {
  return buildPlatformCoreCanonicalEvidenceSetSuccessor(
    predecessor,
    {
      state:
        "OPEN",

      finalized_at:
        null,

      result_reference:
        null,

      evidence_state:
        "PRESENT",

      evidence_reference:
        "EVIDENCE:TEST:002",

      control_references: [
        "CONTROL:TEST:001",
      ],

      observation_references: [
        "OBSERVATION:TEST:002",
      ],

      artifact_references:
        [],

      external_confirmation_references:
        [],

      event_references: [
        "EVENT:TEST:002",
      ],

      evt_reference:
        null,

      opc_reference:
        "OPC:TEST:002",

      genealogy: {
        cause:
          "TEST_SUCCESSOR_OPEN",

        evidence_reference:
          "EVIDENCE:GENEALOGY:002",

        timestamp:
          "2026-09-08T10:01:00.000Z",
      },
    },
  );
}

function makeClosedSuccessor(
  predecessor:
    PlatformCoreCanonicalEvidenceSet,
):
  PlatformCoreCanonicalEvidenceSet {
  return buildPlatformCoreCanonicalEvidenceSetSuccessor(
    predecessor,
    {
      state:
        "CLOSED",

      finalized_at:
        predecessor.finalized_at
        ?? "2026-09-08T10:02:00.000Z",

      result_reference:
        predecessor.result_reference
        ?? "RESULT:TEST:001",

      evidence_state:
        "PRESENT",

      evidence_reference:
        "EVIDENCE:TEST:CLOSED",

      control_references: [
        "CONTROL:TEST:001",
      ],

      observation_references: [
        "OBSERVATION:TEST:CLOSED",
      ],

      artifact_references: [
        "ARTIFACT:TEST:001",
      ],

      external_confirmation_references: [
        "EXTERNAL:CONFIRMATION:001",
      ],

      event_references: [
        "EVENT:TEST:CLOSED",
      ],

      evt_reference:
        "EVT:TEST:001",

      opc_reference:
        "OPC:TEST:CLOSED",

      genealogy: {
        cause:
          "TEST_SUCCESSOR_CLOSED",

        evidence_reference:
          "EVIDENCE:GENEALOGY:CLOSED",

        timestamp:
          predecessor.state ===
            "CLOSED"
            ? "2026-09-08T10:03:00.000Z"
            : "2026-09-08T10:02:00.000Z",
      },
    },
  );
}

function rowFrom(
  canonical:
    PlatformCoreCanonicalEvidenceSet,

  overrides:
    Record<string, unknown> =
      {},
): Record<string, unknown> {
  return {
    evidence_set_id:
      canonical.evidence_set_id,

    evidence_set_version:
      canonical.evidence_set_version,

    payload_sha256:
      canonical.payload_sha256,

    canonical_payload_preimage_utf8:
      canonicalizePlatformCorePayloadPreimage(
        canonical,
      ),

    state:
      canonical.state,

    case_id:
      canonical.case_id,

    domain:
      canonical.domain,

    owner_subject_ref:
      canonical.owner_subject_ref,

    authority_ref:
      canonical.authority_ref,

    authority_version:
      canonical.authority_version,

    authority_sha256:
      canonical.authority_sha256,

    result_reference:
      canonical.result_reference,

    finalized_at_text:
      canonical.finalized_at,

    predecessor_evidence_set_version:
      canonical.evidence_set_version ===
        1
        ? null
        : canonical.evidence_set_version -
          1,

    predecessor_payload_sha256:
      canonical.evidence_set_version ===
        1
        ? null
        : canonical.genealogy.hash,

    persisted_at:
      "2026-09-08T11:00:00.000Z",

    ...overrides,
  };
}

function mutateAndRehash(
  source:
    PlatformCoreCanonicalEvidenceSet,

  mutate:
    (
      candidate:
        Record<string, any>,
    ) =>
      void,
):
  PlatformCoreCanonicalEvidenceSet {
  const candidate =
    JSON.parse(
      JSON.stringify(
        source,
      ),
    ) as Record<string, any>;

  mutate(
    candidate,
  );

  candidate.payload_sha256 =
    computePlatformCorePayloadSha256(
      candidate,
    );

  return candidate as
    PlatformCoreCanonicalEvidenceSet;
}

beforeEach(
  () => {
    transactionHarness.plans.length =
      0;

    transactionHarness.options.length =
      0;

    transactionHarness.queries.length =
      0;

    vi.clearAllMocks();
  },
);

describe(
  "Platform Core EvidenceSet repository",
  () => {
    it(
      "P01 migration creates exact EvidenceSet table",
      () => {
        expect(
          MIGRATION_SQL,
        ).toContain(
          "CREATE TABLE public.hbce_platform_core_evidence_sets",
        );
      },
    );

    it(
      "P02 migration uses composite revision primary key",
      () => {
        expect(
          MIGRATION_SQL,
        ).toMatch(
          /PRIMARY KEY\s*\(\s*evidence_set_id\s*,\s*evidence_set_version\s*\)/s,
        );
      },
    );

    it(
      "P03 migration makes payload_sha256 unique",
      () => {
        expect(
          MIGRATION_SQL,
        ).toMatch(
          /UNIQUE\s*\(\s*payload_sha256\s*\)/s,
        );
      },
    );

    it(
      "P04 migration distinguishes genesis and successor predecessor metadata",
      () => {
        expect(
          MIGRATION_SQL,
        ).toContain(
          "evidence_set_version = 1",
        );

        expect(
          MIGRATION_SQL,
        ).toContain(
          "evidence_set_version > 1",
        );

        expect(
          MIGRATION_SQL,
        ).toContain(
          "predecessor_payload_sha256 IS NOT NULL",
        );
      },
    );

    it(
      "P05 migration self-FK binds the immediate EvidenceSet revision",
      () => {
        expect(
          MIGRATION_SQL,
        ).toMatch(
          /FOREIGN KEY\s*\(\s*evidence_set_id\s*,\s*predecessor_evidence_set_version\s*\)\s*REFERENCES public\.hbce_platform_core_evidence_sets\s*\(\s*evidence_set_id\s*,\s*evidence_set_version\s*\)/s,
        );
      },
    );

    it(
      "P06 migration rejects UPDATE",
      () => {
        expect(
          MIGRATION_SQL,
        ).toContain(
          "BEFORE UPDATE",
        );
      },
    );

    it(
      "P07 migration rejects DELETE",
      () => {
        expect(
          MIGRATION_SQL,
        ).toContain(
          "BEFORE DELETE",
        );
      },
    );

    it(
      "P08 migration contains no domain-specific persistence columns",
      () => {
        const normalized =
          MIGRATION_SQL.toLowerCase();

        for (
          const forbidden of [
            "omnilink",
            "bridge_instance_id",
            "bank_",
            "sequence_or_transaction_id",
          ]
        ) {
          expect(
            normalized,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      "P09 persists an OPEN genesis",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            makeResolver(),
          );

        expect(
          result.evidenceSet,
        ).toEqual(
          genesis,
        );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );
      },
    );

    it(
      "P10 persists an OPEN successor with durable predecessor",
      async () => {
        const genesis =
          makeGenesis();

        const successor =
          makeOpenSuccessor(
            genesis,
          );

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
          [
            rowFrom(
              successor,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalEvidenceSet(
            successor,
            makeResolver(),
          );

        expect(
          result.evidenceSet.payload_sha256,
        ).toBe(
          successor.payload_sha256,
        );
      },
    );

    it(
      "P11 persists OPEN to CLOSED successor",
      async () => {
        const genesis =
          makeGenesis();

        const closed =
          makeClosedSuccessor(
            genesis,
          );

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
          [
            rowFrom(
              closed,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalEvidenceSet(
            closed,
            makeResolver(),
          );

        expect(
          result.evidenceSet.state,
        ).toBe(
          "CLOSED",
        );
      },
    );

    it(
      "P12 persists CLOSED to CLOSED while preserving finalized Result",
      async () => {
        const genesis =
          makeGenesis();

        const closedV2 =
          makeClosedSuccessor(
            genesis,
          );

        const closedV3 =
          makeClosedSuccessor(
            closedV2,
          );

        queueTransaction(
          [
            rowFrom(
              closedV2,
            ),
          ],
          [
            rowFrom(
              closedV3,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalEvidenceSet(
            closedV3,
            makeResolver(),
          );

        expect(
          result.evidenceSet.result_reference,
        ).toBe(
          closedV2.result_reference,
        );

        expect(
          result.evidenceSet.finalized_at,
        ).toBe(
          closedV2.finalized_at,
        );
      },
    );

    it(
      "P13 exact duplicate persistence becomes idempotent replay",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [],
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            makeResolver(),
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );
      },
    );

    it(
      "P14 reads and reconstructs exact canonical EvidenceSet",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        const result =
          await readPlatformCoreCanonicalEvidenceSet(
            genesis.evidence_set_id,
            genesis.evidence_set_version,
          );

        expect(
          result,
        ).toEqual(
          genesis,
        );

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
      "P15 persistence uses SERIALIZABLE transaction isolation",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        await persistPlatformCoreCanonicalEvidenceSet(
          genesis,
          makeResolver(),
        );

        expect(
          transactionHarness.options[0],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",
        });
      },
    );

    it(
      "P16 persistence writes the existing canonicalizer preimage",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        await persistPlatformCoreCanonicalEvidenceSet(
          genesis,
          makeResolver(),
        );

        const insert =
          transactionHarness.queries.find(
            (
              query,
            ) =>
              query.sql.includes(
                "INSERT INTO",
              ),
          );

        expect(
          insert,
        ).toBeDefined();

        expect(
          insert!.parameters[3],
        ).toBe(
          canonicalizePlatformCorePayloadPreimage(
            genesis,
          ),
        );
      },
    );

    it(
      "P17 unresolved Authority fails closed before persistence",
      async () => {
        const genesis =
          makeGenesis();

        const port =
          makeResolver({
            resolveAuthority:
              vi.fn(
                async () =>
                  false,
              ),
          });

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            port,
          ),
        ).rejects.toMatchObject({
          code:
            "REFERENCE_RESOLUTION_FAILED",
        });

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "P18 unresolved owner Subject fails closed",
      async () => {
        const genesis =
          makeGenesis();

        const port =
          makeResolver({
            resolveOwnerSubject:
              vi.fn(
                async () =>
                  false,
              ),
          });

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            port,
          ),
        ).rejects.toMatchObject({
          code:
            "REFERENCE_RESOLUTION_FAILED",
        });
      },
    );

    it(
      "P19 unresolved control reference fails closed",
      async () => {
        const genesis =
          makeGenesis();

        const port =
          makeResolver({
            resolveReference:
              vi.fn(
                async (
                  input,
                ) =>
                  input.referenceType !==
                    "CONTROL",
              ),
          });

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            port,
          ),
        ).rejects.toMatchObject({
          code:
            "REFERENCE_RESOLUTION_FAILED",
        });
      },
    );

    it(
      "P20 unresolved CLOSED Result reference fails closed",
      async () => {
        const genesis =
          makeGenesis();

        const closed =
          makeClosedSuccessor(
            genesis,
          );

        const port =
          makeResolver({
            resolveReference:
              vi.fn(
                async (
                  input,
                ) =>
                  input.referenceType !==
                    "RESULT",
              ),
          });

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            closed,
            port,
          ),
        ).rejects.toMatchObject({
          code:
            "REFERENCE_RESOLUTION_FAILED",
        });
      },
    );

    it(
      "P21 missing durable predecessor is rejected",
      async () => {
        const genesis =
          makeGenesis();

        const successor =
          makeOpenSuccessor(
            genesis,
          );

        queueTransaction(
          [],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            successor,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "PREDECESSOR_NOT_FOUND",
        });
      },
    );

    it(
      "P22 predecessor payload corruption fails closed",
      async () => {
        const genesis =
          makeGenesis();

        const successor =
          makeOpenSuccessor(
            genesis,
          );

        queueTransaction(
          [
            rowFrom(
              genesis,
              {
                payload_sha256:
                  "b".repeat(
                    64,
                  ),
              },
            ),
          ],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            successor,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "P23 wrong durable predecessor binding is rejected",
      async () => {
        const genesis =
          makeGenesis();

        const successor =
          makeOpenSuccessor(
            genesis,
          );

        const alternateGenesis =
          makeGenesis(
            "2026-09-08T09:59:00.000Z",
          );

        queueTransaction(
          [
            rowFrom(
              alternateGenesis,
            ),
          ],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            successor,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "PREDECESSOR_BINDING_MISMATCH",
        });
      },
    );

    it(
      "P24 version jump without immediate predecessor is rejected",
      async () => {
        const genesis =
          makeGenesis();

        const v2 =
          makeOpenSuccessor(
            genesis,
          );

        const jumped =
          mutateAndRehash(
            v2,
            (
              candidate,
            ) => {
              candidate.evidence_set_version =
                3;

              candidate.genealogy.hash =
                genesis.payload_sha256;
            },
          );

        queueTransaction(
          [],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            jumped,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "PREDECESSOR_NOT_FOUND",
        });
      },
    );

    it(
      "P25 CLOSED to OPEN is rejected",
      async () => {
        const genesis =
          makeGenesis();

        const closed =
          makeClosedSuccessor(
            genesis,
          );

        const reopened =
          mutateAndRehash(
            closed,
            (
              candidate,
            ) => {
              candidate.evidence_set_version =
                3;

              candidate.state =
                "OPEN";

              candidate.finalized_at =
                null;

              candidate.result_reference =
                null;

              candidate.genealogy.derived_from =
                closed.evidence_set_id;

              candidate.genealogy.previous_state =
                "CLOSED";

              candidate.genealogy.new_state =
                "OPEN";

              candidate.genealogy.hash =
                closed.payload_sha256;
            },
          );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            reopened,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "STATIC_SCHEMA_VALIDATION_FAILED",
        });
      },
    );

    it(
      "P26 CLOSED Result replacement is rejected",
      async () => {
        const genesis =
          makeGenesis();

        const closedV2 =
          makeClosedSuccessor(
            genesis,
          );

        const changed =
          mutateAndRehash(
            closedV2,
            (
              candidate,
            ) => {
              candidate.evidence_set_version =
                3;

              candidate.result_reference =
                "RESULT:TEST:REPLACED";

              candidate.genealogy.derived_from =
                closedV2.evidence_set_id;

              candidate.genealogy.previous_state =
                "CLOSED";

              candidate.genealogy.new_state =
                "CLOSED";

              candidate.genealogy.hash =
                closedV2.payload_sha256;
            },
          );

        queueTransaction(
          [
            rowFrom(
              closedV2,
            ),
          ],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            changed,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "PREDECESSOR_BINDING_MISMATCH",
        });
      },
    );

    it(
      "P27 CLOSED finalized_at replacement is rejected",
      async () => {
        const genesis =
          makeGenesis();

        const closedV2 =
          makeClosedSuccessor(
            genesis,
          );

        const changed =
          mutateAndRehash(
            closedV2,
            (
              candidate,
            ) => {
              candidate.evidence_set_version =
                3;

              candidate.finalized_at =
                "2026-09-08T11:59:59.000Z";

              candidate.genealogy.derived_from =
                closedV2.evidence_set_id;

              candidate.genealogy.previous_state =
                "CLOSED";

              candidate.genealogy.new_state =
                "CLOSED";

              candidate.genealogy.hash =
                closedV2.payload_sha256;
            },
          );

        queueTransaction(
          [
            rowFrom(
              closedV2,
            ),
          ],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            changed,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "PREDECESSOR_BINDING_MISMATCH",
        });
      },
    );

    it(
      "P28 same durable revision with different content fails closed",
      async () => {
        const genesis =
          makeGenesis();

        const conflicting =
          makeGenesis(
            "2026-09-08T09:58:00.000Z",
          );

        queueTransaction(
          [],
          [
            rowFrom(
              conflicting,
            ),
          ],
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICTING_DUPLICATE",
        });
      },
    );

    it(
      "P29 persisted canonical preimage corruption fails closed",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
              {
                canonical_payload_preimage_utf8:
                  "{\"invalid\":true}",
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreCanonicalEvidenceSet(
            genesis.evidence_set_id,
            1,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "P30 persisted payload hash corruption fails closed",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
              {
                payload_sha256:
                  "b".repeat(
                    64,
                  ),
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreCanonicalEvidenceSet(
            genesis.evidence_set_id,
            1,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "P31 persisted extracted-column mismatch fails closed",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
              {
                domain:
                  "different_domain",
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreCanonicalEvidenceSet(
            genesis.evidence_set_id,
            1,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );

    it(
      "P32 retries one SQLSTATE 40001 then persists",
      async () => {
        const genesis =
          makeGenesis();

        queueFailure(
          "serialization failure SQLSTATE 40001",
        );

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            makeResolver(),
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
      "P33 serialization retry exhaustion fails closed",
      async () => {
        const genesis =
          makeGenesis();

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
          persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            makeResolver(),
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
      "P34 ordinary database failure fails closed",
      async () => {
        const genesis =
          makeGenesis();

        queueFailure(
          "database connection refused",
        );

        await expect(
          persistPlatformCoreCanonicalEvidenceSet(
            genesis,
            makeResolver(),
          ),
        ).rejects.toMatchObject({
          code:
            "DATABASE_FAILURE",
        });
      },
    );

    it(
      "P35 missing revision read returns null",
      async () => {
        queueTransaction(
          [],
        );

        const result =
          await readPlatformCoreCanonicalEvidenceSet(
            "EVS-TEST-404",
            1,
          );

        expect(
          result,
        ).toBeNull();
      },
    );

    it(
      "P36 read retries one serialization failure",
      async () => {
        const genesis =
          makeGenesis();

        queueFailure(
          "code 40001 serialization failure",
        );

        queueTransaction(
          [
            rowFrom(
              genesis,
            ),
          ],
        );

        const result =
          await readPlatformCoreCanonicalEvidenceSet(
            genesis.evidence_set_id,
            1,
          );

        expect(
          result,
        ).toEqual(
          genesis,
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
      "P37 corrupted canonical material on read fails closed",
      async () => {
        const genesis =
          makeGenesis();

        queueTransaction(
          [
            rowFrom(
              genesis,
              {
                canonical_payload_preimage_utf8:
                  "not-json",
              },
            ),
          ],
        );

        await expect(
          readPlatformCoreCanonicalEvidenceSet(
            genesis.evidence_set_id,
            1,
          ),
        ).rejects.toMatchObject({
          code:
            "PERSISTED_RECORD_INVALID",
        });
      },
    );
  },
);

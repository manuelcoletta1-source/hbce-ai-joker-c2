import {
  createHash,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PREFIX,
  PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PROFILE,
  PlatformCoreExecutionObservationEvidenceReferenceError,
  derivePlatformCoreExecutionObservationEvidenceReference,
  type PlatformCoreExecutionObservationEvidenceReferenceInput,
} from "./execution-observation-evidence-reference";

import {
  derivePlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

const STATE =
  derivePlatformCoreCanonicalObservedStateReference({
    account: {
      status:
        "ACTIVE",

      balance:
        1250,
    },
  });

const EXECUTION_SHA256 =
  "a".repeat(
    64,
  );

const OBSERVED_AT =
  "2026-09-02T18:30:00.000Z";

function input(
  overrides:
    Partial<
      PlatformCoreExecutionObservationEvidenceReferenceInput
    > = {},
): PlatformCoreExecutionObservationEvidenceReferenceInput {
  return {
    executionId:
      "EXE-D228-OBSERVATION",

    executionVersion:
      2,

    executionSha256:
      EXECUTION_SHA256,

    executionEngineRef:
      "ENGINE:HBCE:D228",

    enforcementPointRef:
      "ENFORCEMENT:HBCE:D228",

    terminalStateObserved:
      "EXECUTED",

    observationState:
      "CAPTURED",

    stateRef:
      STATE.stateRef,

    stateSha256:
      STATE.stateSha256,

    observedAt:
      OBSERVED_AT,

    ...overrides,
  };
}

function errorCode(
  error:
    unknown,
): string | null {
  return (
    error instanceof
      PlatformCoreExecutionObservationEvidenceReferenceError
  )
    ? error.code
    : null;
}

describe(
  "execution observation evidence reference",
  () => {
    it(
      "locks profile and reference prefix",
      () => {
        expect(
          PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PROFILE,
        ).toBe(
          "HBCE_PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_V1_SHA256",
        );

        expect(
          PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PREFIX,
        ).toBe(
          "HBCE:OBS:EVIDENCE:V1:SHA256:",
        );
      },
    );

    it(
      "derives the exact canonical evidence UTF-8, SHA-256 and reference",
      () => {
        const result =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const expectedCanonical =
          (
            "{"
            + "\"enforcementPointRef\":\"ENFORCEMENT:HBCE:D228\","
            + "\"executionEngineRef\":\"ENGINE:HBCE:D228\","
            + "\"executionId\":\"EXE-D228-OBSERVATION\","
            + `\"executionSha256\":\"${EXECUTION_SHA256}\",`
            + "\"executionVersion\":2,"
            + "\"observationState\":\"CAPTURED\","
            + `\"observedAt\":\"${OBSERVED_AT}\",`
            + `\"stateRef\":\"${STATE.stateRef}\",`
            + `\"stateSha256\":\"${STATE.stateSha256}\",`
            + "\"terminalStateObserved\":\"EXECUTED\""
            + "}"
          );

        const expectedSha =
          createHash(
            "sha256",
          )
            .update(
              expectedCanonical,
              "utf8",
            )
            .digest(
              "hex",
            );

        expect(
          result.canonicalEvidenceUtf8,
        ).toBe(
          expectedCanonical,
        );

        expect(
          result.evidenceSha256,
        ).toBe(
          expectedSha,
        );

        expect(
          result.evidenceReference,
        ).toBe(
          (
            "HBCE:OBS:EVIDENCE:V1:SHA256:"
            + expectedSha.toUpperCase()
          ),
        );
      },
    );

    it(
      "hashes exactly the canonicalEvidenceUtf8 returned to the caller",
      () => {
        const result =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const independentlyComputed =
          createHash(
            "sha256",
          )
            .update(
              result.canonicalEvidenceUtf8,
              "utf8",
            )
            .digest(
              "hex",
            );

        expect(
          result.evidenceSha256,
        ).toBe(
          independentlyComputed,
        );
      },
    );

    it(
      "is deterministic for an exact observation replay",
      () => {
        const first =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const second =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      "is independent of caller property insertion order",
      () => {
        const canonical =
          input();

        const reordered =
          {
            observedAt:
              canonical.observedAt,

            stateSha256:
              canonical.stateSha256,

            stateRef:
              canonical.stateRef,

            observationState:
              canonical.observationState,

            terminalStateObserved:
              canonical.terminalStateObserved,

            enforcementPointRef:
              canonical.enforcementPointRef,

            executionEngineRef:
              canonical.executionEngineRef,

            executionSha256:
              canonical.executionSha256,

            executionVersion:
              canonical.executionVersion,

            executionId:
              canonical.executionId,
          } satisfies
            PlatformCoreExecutionObservationEvidenceReferenceInput;

        expect(
          derivePlatformCoreExecutionObservationEvidenceReference(
            reordered,
          ).evidenceReference,
        ).toBe(
          derivePlatformCoreExecutionObservationEvidenceReference(
            canonical,
          ).evidenceReference,
        );
      },
    );

    it(
      "treats exact observedAt representation as hash-significant",
      () => {
        const millis =
          "2026-09-02T18:30:00Z";

        const withMilliseconds =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              observedAt:
                "2026-09-02T18:30:00.000Z",
            }),
          );

        const withoutMilliseconds =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              observedAt:
                millis,
            }),
          );

        expect(
          Date.parse(
            withMilliseconds.canonicalEvidenceUtf8.includes(
              "18:30:00.000Z",
            )
              ? "2026-09-02T18:30:00.000Z"
              : "",
          ),
        ).toBe(
          Date.parse(
            millis,
          ),
        );

        expect(
          withMilliseconds.evidenceReference,
        ).not.toBe(
          withoutMilliseconds.evidenceReference,
        );
      },
    );

    it(
      "changes evidence identity when executionId changes",
      () => {
        const first =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const second =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              executionId:
                "EXE-D228-OTHER",
            }),
          );

        expect(
          second.evidenceReference,
        ).not.toBe(
          first.evidenceReference,
        );
      },
    );

    it(
      "changes evidence identity when execution engine changes",
      () => {
        const first =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const second =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              executionEngineRef:
                "ENGINE:HBCE:OTHER",
            }),
          );

        expect(
          second.evidenceReference,
        ).not.toBe(
          first.evidenceReference,
        );
      },
    );

    it(
      "changes evidence identity when enforcement point changes",
      () => {
        const first =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const second =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              enforcementPointRef:
                "ENFORCEMENT:HBCE:OTHER",
            }),
          );

        expect(
          second.evidenceReference,
        ).not.toBe(
          first.evidenceReference,
        );
      },
    );

    it(
      "changes evidence identity when terminal state changes",
      () => {
        const executed =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const failed =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              terminalStateObserved:
                "FAILED",
            }),
          );

        expect(
          failed.evidenceReference,
        ).not.toBe(
          executed.evidenceReference,
        );
      },
    );

    it(
      "changes evidence identity when observed state changes",
      () => {
        const otherState =
          derivePlatformCoreCanonicalObservedStateReference({
            account: {
              status:
                "SUSPENDED",

              balance:
                1250,
            },
          });

        const first =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input(),
          );

        const second =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              stateRef:
                otherState.stateRef,

              stateSha256:
                otherState.stateSha256,
            }),
          );

        expect(
          second.evidenceReference,
        ).not.toBe(
          first.evidenceReference,
        );
      },
    );

    it(
      "allows FAILED with UNKNOWN and null state material",
      () => {
        const result =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              terminalStateObserved:
                "FAILED",

              observationState:
                "UNKNOWN",

              stateRef:
                null,

              stateSha256:
                null,
            }),
          );

        expect(
          result.canonicalEvidenceUtf8,
        ).toContain(
          "\"observationState\":\"UNKNOWN\"",
        );

        expect(
          result.canonicalEvidenceUtf8,
        ).toContain(
          "\"stateRef\":null",
        );
      },
    );

    it(
      "allows ABORTED with NOT_AVAILABLE and null state material",
      () => {
        const result =
          derivePlatformCoreExecutionObservationEvidenceReference(
            input({
              terminalStateObserved:
                "ABORTED",

              observationState:
                "NOT_AVAILABLE",

              stateRef:
                null,

              stateSha256:
                null,
            }),
          );

        expect(
          result.canonicalEvidenceUtf8,
        ).toContain(
          "\"observationState\":\"NOT_AVAILABLE\"",
        );
      },
    );

    it(
      "rejects EXECUTED without CAPTURED evidence",
      () => {
        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              input({
                observationState:
                  "UNKNOWN",

                stateRef:
                  null,

                stateSha256:
                  null,
              }),
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_OBSERVATION",
          }),
        );
      },
    );

    it(
      "rejects non-CAPTURED evidence carrying state material",
      () => {
        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              input({
                terminalStateObserved:
                  "FAILED",

                observationState:
                  "UNKNOWN",
              }),
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_OBSERVATION",
          }),
        );
      },
    );

    it(
      "rejects CAPTURED evidence without canonical state reference",
      () => {
        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              input({
                stateRef:
                  null,
              }),
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_OBSERVATION",
          }),
        );
      },
    );

    it(
      "rejects mismatched stateRef and stateSha256",
      () => {
        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              input({
                stateSha256:
                  "b".repeat(
                    64,
                  ),
              }),
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_OBSERVATION",
          }),
        );
      },
    );

    it(
      "rejects invalid execution SHA-256",
      () => {
        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              input({
                executionSha256:
                  "A".repeat(
                    64,
                  ),
              }),
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_INPUT",
          }),
        );
      },
    );

    it(
      "rejects invalid observedAt",
      () => {
        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              input({
                observedAt:
                  "NOT-A-TIMESTAMP",
              }),
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_INPUT",
          }),
        );
      },
    );

    it(
      "rejects unknown and missing input fields",
      () => {
        const extra =
          {
            ...input(),

            evidenceReference:
              "CALLER-SUPPLIED",
          } as unknown as
            PlatformCoreExecutionObservationEvidenceReferenceInput;

        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              extra,
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_INPUT",
          }),
        );

        const missing =
          {
            ...input(),
          } as Record<string, unknown>;

        delete missing[
          "observedAt"
        ];

        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              missing as unknown as
                PlatformCoreExecutionObservationEvidenceReferenceInput,
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_INPUT",
          }),
        );
      },
    );

    it(
      "rejects accessor properties instead of executing them",
      () => {
        const source =
          {
            ...input(),
          };

        let getterExecuted =
          false;

        Object.defineProperty(
          source,
          "executionId",
          {
            enumerable:
              true,

            configurable:
              true,

            get() {
              getterExecuted =
                true;

              return "EXE-ACCESSOR";
            },
          },
        );

        expect(
          () =>
            derivePlatformCoreExecutionObservationEvidenceReference(
              source,
            ),
        ).toThrowError(
          expect.objectContaining({
            code:
              "INVALID_INPUT",
          }),
        );

        expect(
          getterExecuted,
        ).toBe(
          false,
        );
      },
    );

    it(
      "captures every evidence data property only once",
      () => {
        const descriptorReads =
          new Map<
            PropertyKey,
            number
          >();

        const proxied =
          new Proxy(
            {
              ...input(),
            },
            {
              getOwnPropertyDescriptor(
                target,
                property,
              ) {
                const next =
                  (
                    descriptorReads.get(
                      property,
                    )
                    ?? 0
                  ) + 1;

                descriptorReads.set(
                  property,
                  next,
                );

                if (
                  next > 1
                ) {
                  throw new Error(
                    `SECOND_DESCRIPTOR_READ:${String(property)}`,
                  );
                }

                return Reflect.getOwnPropertyDescriptor(
                  target,
                  property,
                );
              },
            },
          );

        const result =
          derivePlatformCoreExecutionObservationEvidenceReference(
            proxied,
          );

        expect(
          result.evidenceReference,
        ).toMatch(
          /^HBCE:OBS:EVIDENCE:V1:SHA256:[0-9A-F]{64}$/,
        );

        expect(
          Array.from(
            descriptorReads.values(),
          ).every(
            (
              count,
            ) =>
              count === 1,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "returns a frozen result and does not mutate caller input",
      () => {
        const source =
          input();

        const before =
          JSON.stringify(
            source,
          );

        const result =
          derivePlatformCoreExecutionObservationEvidenceReference(
            source,
          );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );

        expect(
          JSON.stringify(
            source,
          ),
        ).toBe(
          before,
        );
      },
    );
  },
);

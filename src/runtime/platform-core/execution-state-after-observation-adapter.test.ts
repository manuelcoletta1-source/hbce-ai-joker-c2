import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLATFORM_CORE_EXECUTION_STATE_AFTER_OBSERVATION_ADAPTER_PROTOCOL,
  PlatformCoreExecutionStateAfterObservationAdapterError,
  buildPlatformCoreExecutionStateAfterFromObservation,
  type PlatformCoreExecutionStateAfterObservationSource,
} from "./execution-state-after-observation-adapter";

const STATE_SHA =
  "a".repeat(64);

function makeCapturedExecuted():
  PlatformCoreExecutionStateAfterObservationSource {
  return {
    terminalStateObserved:
      "EXECUTED",

    observationState:
      "CAPTURED",

    stateRef:
      "STATE:TEST:AFTER",

    stateSha256:
      STATE_SHA,
  };
}

function expectAdapterFailure(
  source:
    unknown,
  code:
    string,
): void {
  try {
    buildPlatformCoreExecutionStateAfterFromObservation(
      source as
        PlatformCoreExecutionStateAfterObservationSource,
    );

    throw new Error(
      "expected adapter failure",
    );
  } catch (error) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreExecutionStateAfterObservationAdapterError,
    );

    expect(
      (
        error as
          PlatformCoreExecutionStateAfterObservationAdapterError
      ).code,
    ).toBe(
      code,
    );
  }
}

describe(
  "Platform Core execution state-after observation adapter",
  () => {
    it(
      "locks the adapter protocol identity",
      () => {
        expect(
          PLATFORM_CORE_EXECUTION_STATE_AFTER_OBSERVATION_ADAPTER_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-EXECUTION-STATE-AFTER-OBSERVATION-ADAPTER-v1",
        );
      },
    );

    it(
      "maps EXECUTED with CAPTURED state exactly",
      () => {
        const result =
          buildPlatformCoreExecutionStateAfterFromObservation(
            makeCapturedExecuted(),
          );

        expect(
          result,
        ).toEqual({
          target_state:
            "EXECUTED",

          state_after: {
            observation_state:
              "CAPTURED",

            state_ref:
              "STATE:TEST:AFTER",

            state_sha256:
              STATE_SHA,
          },
        });
      },
    );

    it(
      "maps FAILED with CAPTURED state",
      () => {
        const result =
          buildPlatformCoreExecutionStateAfterFromObservation({
            terminalStateObserved:
              "FAILED",

            observationState:
              "CAPTURED",

            stateRef:
              "STATE:TEST:FAILED",

            stateSha256:
              "b".repeat(64),
          });

        expect(
          result.target_state,
        ).toBe(
          "FAILED",
        );

        expect(
          result.state_after.observation_state,
        ).toBe(
          "CAPTURED",
        );
      },
    );

    it(
      "maps FAILED with UNKNOWN state",
      () => {
        const result =
          buildPlatformCoreExecutionStateAfterFromObservation({
            terminalStateObserved:
              "FAILED",

            observationState:
              "UNKNOWN",

            stateRef:
              null,

            stateSha256:
              null,
          });

        expect(
          result,
        ).toEqual({
          target_state:
            "FAILED",

          state_after: {
            observation_state:
              "UNKNOWN",

            state_ref:
              null,

            state_sha256:
              null,
          },
        });
      },
    );

    it(
      "maps ABORTED with NOT_AVAILABLE state",
      () => {
        const result =
          buildPlatformCoreExecutionStateAfterFromObservation({
            terminalStateObserved:
              "ABORTED",

            observationState:
              "NOT_AVAILABLE",

            stateRef:
              null,

            stateSha256:
              null,
          });

        expect(
          result,
        ).toEqual({
          target_state:
            "ABORTED",

          state_after: {
            observation_state:
              "NOT_AVAILABLE",

            state_ref:
              null,

            state_sha256:
              null,
          },
        });
      },
    );

    it(
      "returns frozen adapter output",
      () => {
        const result =
          buildPlatformCoreExecutionStateAfterFromObservation(
            makeCapturedExecuted(),
          );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            result.state_after,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not mutate the observation source",
      () => {
        const source =
          makeCapturedExecuted();

        const before =
          JSON.stringify(
            source,
          );

        buildPlatformCoreExecutionStateAfterFromObservation(
          source,
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

    it(
      "rejects non-object observation source",
      () => {
        expectAdapterFailure(
          null,
          "INVALID_SOURCE",
        );
      },
    );

    it(
      "rejects unknown source fields",
      () => {
        expectAdapterFailure(
          {
            ...makeCapturedExecuted(),

            unexpected:
              true,
          },
          "INVALID_SOURCE",
        );
      },
    );

    it(
      "rejects invalid terminal state",
      () => {
        expectAdapterFailure(
          {
            ...makeCapturedExecuted(),

            terminalStateObserved:
              "PENDING",
          },
          "INVALID_TERMINAL_STATE",
        );
      },
    );

    it(
      "rejects invalid observation state",
      () => {
        expectAdapterFailure(
          {
            ...makeCapturedExecuted(),

            observationState:
              "OBSERVED",
          },
          "INVALID_OBSERVATION_STATE",
        );
      },
    );

    it(
      "rejects invalid captured state reference",
      () => {
        expectAdapterFailure(
          {
            ...makeCapturedExecuted(),

            stateRef:
              "invalid state ref",
          },
          "INVALID_STATE_REFERENCE",
        );
      },
    );

    it(
      "rejects invalid captured state digest",
      () => {
        expectAdapterFailure(
          {
            ...makeCapturedExecuted(),

            stateSha256:
              "ABC",
          },
          "INVALID_STATE_SHA256",
        );
      },
    );

    it(
      "rejects UNKNOWN state carrying reference or digest",
      () => {
        expectAdapterFailure(
          {
            terminalStateObserved:
              "FAILED",

            observationState:
              "UNKNOWN",

            stateRef:
              "STATE:INVALID:UNKNOWN",

            stateSha256:
              null,
          },
          "STATE_AFTER_INCONSISTENT",
        );
      },
    );

    it(
      "rejects EXECUTED without CAPTURED state",
      () => {
        expectAdapterFailure(
          {
            terminalStateObserved:
              "EXECUTED",

            observationState:
              "UNKNOWN",

            stateRef:
              null,

            stateSha256:
              null,
          },
          "STATE_AFTER_INCONSISTENT",
        );
      },
    );
  },
);

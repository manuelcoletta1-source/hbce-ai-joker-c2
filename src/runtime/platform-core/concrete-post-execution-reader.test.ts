import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  PlatformCorePostExecutionObservationRequest,
} from "./concrete-execution-observer";

import {
  PLATFORM_CORE_CONCRETE_POST_EXECUTION_READER_PROTOCOL,
  PlatformCoreConcretePostExecutionReaderError,
  createPlatformCoreConcretePostExecutionReader,
  type PlatformCoreConcretePostExecutionBackend,
  type PlatformCoreConcretePostExecutionBackendBinding,
  type PlatformCoreConcretePostExecutionBackendResult,
} from "./concrete-post-execution-reader";

const EXECUTION_SHA =
  "a".repeat(
    64,
  );

const OBSERVED_AT =
  "2026-09-02T21:30:00.000Z";

const BASE_REQUEST:
  PlatformCorePostExecutionObservationRequest =
  Object.freeze({
    executionId:
      "EXE-TEST:CONCRETE-READER",

    executionVersion:
      2,

    executionSha256:
      EXECUTION_SHA,

    executionEngineRef:
      "ENGINE:TEST",

    enforcementPointRef:
      "ENFORCEMENT:TEST",
  });

const CAPTURED_STATE =
  Object.freeze({
    account: {
      status:
        "ACTIVE",
    },

    sequence: [
      1,
      2,
      3,
    ],
  });

const BASE_CAPTURED_RESULT:
  PlatformCoreConcretePostExecutionBackendResult =
  Object.freeze({
    terminalStateObserved:
      "EXECUTED",

    observationState:
      "CAPTURED",

    observedState:
      CAPTURED_STATE,

    observedAt:
      OBSERVED_AT,
  });

function makeRequest(
  overrides:
    Partial<
      PlatformCorePostExecutionObservationRequest
    > = {},
):
  PlatformCorePostExecutionObservationRequest {
  return Object.freeze({
    ...BASE_REQUEST,
    ...overrides,
  });
}

function makeBackend(
  result:
    unknown = BASE_CAPTURED_RESULT,
): Readonly<{
  backend:
    PlatformCoreConcretePostExecutionBackend;

  read:
    ReturnType<typeof vi.fn>;
}> {
  const read =
    vi.fn(
      async (
        _request:
          PlatformCorePostExecutionObservationRequest,
      ):
        Promise<
          PlatformCoreConcretePostExecutionBackendResult
        > =>
        result as
          PlatformCoreConcretePostExecutionBackendResult,
    );

  const backend:
    PlatformCoreConcretePostExecutionBackend = {
      readPostExecutionObservation:
        read,
  };

  return Object.freeze({
    backend,
    read,
  });
}

function makeBinding(
  backend:
    PlatformCoreConcretePostExecutionBackend,
  executionEngineRef:
    string = "ENGINE:TEST",
  enforcementPointRef:
    string = "ENFORCEMENT:TEST",
):
  PlatformCoreConcretePostExecutionBackendBinding {
  return Object.freeze({
    executionEngineRef,
    enforcementPointRef,
    backend,
  });
}

function captureSyncReaderError(
  operation:
    () => unknown,
):
  PlatformCoreConcretePostExecutionReaderError {
  try {
    operation();
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreConcretePostExecutionReaderError,
    );

    return error as
      PlatformCoreConcretePostExecutionReaderError;
  }

  throw new Error(
    "Expected PlatformCoreConcretePostExecutionReaderError.",
  );
}

describe(
  "concrete post-execution reader",
  () => {
    it(
      "locks the canonical reader protocol",
      () => {
        expect(
          PLATFORM_CORE_CONCRETE_POST_EXECUTION_READER_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-CONCRETE-POST-EXECUTION-READER-v1",
        );
      },
    );

    it(
      "routes one CAPTURED observation and echoes exact execution provenance",
      async () => {
        const {
          backend,
          read,
        } =
          makeBackend();

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        const request =
          makeRequest();

        const result =
          await reader.readPostExecutionObservation(
            request,
          );

        expect(
          read,
        ).toHaveBeenCalledTimes(
          1,
        );

        const calledRequest =
          read.mock.calls[0]?.[0] as
            PlatformCorePostExecutionObservationRequest;

        expect(
          calledRequest,
        ).toEqual(
          request,
        );

        expect(
          Object.isFrozen(
            calledRequest,
          ),
        ).toBe(
          true,
        );

        expect(
          result,
        ).toEqual({
          executionId:
            request.executionId,

          executionVersion:
            request.executionVersion,

          executionSha256:
            request.executionSha256,

          executionEngineRef:
            request.executionEngineRef,

          enforcementPointRef:
            request.enforcementPointRef,

          terminalStateObserved:
            "EXECUTED",

          observationState:
            "CAPTURED",

          observedState:
            CAPTURED_STATE,

          observedAt:
            OBSERVED_AT,
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
      "resolves the exact execution-engine plus enforcement-point pair",
      async () => {
        const backendAx =
          makeBackend();

        const backendAy =
          makeBackend();

        const backendBx =
          makeBackend();

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backendAx.backend,
              "ENGINE:A",
              "ENFORCEMENT:X",
            ),

            makeBinding(
              backendAy.backend,
              "ENGINE:A",
              "ENFORCEMENT:Y",
            ),

            makeBinding(
              backendBx.backend,
              "ENGINE:B",
              "ENFORCEMENT:X",
            ),
          ]);

        await reader.readPostExecutionObservation(
          makeRequest({
            executionEngineRef:
              "ENGINE:B",

            enforcementPointRef:
              "ENFORCEMENT:X",
          }),
        );

        expect(
          backendAx.read,
        ).toHaveBeenCalledTimes(
          0,
        );

        expect(
          backendAy.read,
        ).toHaveBeenCalledTimes(
          0,
        );

        expect(
          backendBx.read,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "rejects duplicate exact backend bindings",
      () => {
        const first =
          makeBackend();

        const second =
          makeBackend();

        const error =
          captureSyncReaderError(
            () =>
              createPlatformCoreConcretePostExecutionReader([
                makeBinding(
                  first.backend,
                ),

                makeBinding(
                  second.backend,
                ),
              ]),
          );

        expect(
          error.code,
        ).toBe(
          "DUPLICATE_BINDING",
        );
      },
    );

    it(
      "fails closed when no exact backend binding resolves",
      async () => {
        const reader =
          createPlatformCoreConcretePostExecutionReader(
            [],
          );

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "UNRESOLVED_BINDING",
        });
      },
    );

    it(
      "rejects non-array reader configuration",
      () => {
        const error =
          captureSyncReaderError(
            () =>
              createPlatformCoreConcretePostExecutionReader(
                "INVALID" as unknown as
                  readonly PlatformCoreConcretePostExecutionBackendBinding[],
              ),
          );

        expect(
          error.code,
        ).toBe(
          "INVALID_CONFIGURATION",
        );
      },
    );

    it(
      "rejects invalid whitespace binding references",
      () => {
        const {
          backend,
        } =
          makeBackend();

        const invalidBinding = {
          executionEngineRef:
            " ENGINE:TEST",

          enforcementPointRef:
            "ENFORCEMENT:TEST",

          backend,
        } as
          PlatformCoreConcretePostExecutionBackendBinding;

        const error =
          captureSyncReaderError(
            () =>
              createPlatformCoreConcretePostExecutionReader([
                invalidBinding,
              ]),
          );

        expect(
          error.code,
        ).toBe(
          "INVALID_CONFIGURATION",
        );
      },
    );

    it(
      "rejects a backend without readPostExecutionObservation",
      () => {
        const invalidBackend =
          {} as
            PlatformCoreConcretePostExecutionBackend;

        const error =
          captureSyncReaderError(
            () =>
              createPlatformCoreConcretePostExecutionReader([
                makeBinding(
                  invalidBackend,
                ),
              ]),
          );

        expect(
          error.code,
        ).toBe(
          "INVALID_CONFIGURATION",
        );
      },
    );

    it(
      "wraps backend failure without retrying the external read",
      async () => {
        const cause =
          new Error(
            "backend offline",
          );

        const read =
          vi.fn(
            async (
              _request:
                PlatformCorePostExecutionObservationRequest,
            ):
              Promise<
                PlatformCoreConcretePostExecutionBackendResult
              > => {
              throw cause;
            },
          );

        const backend:
          PlatformCoreConcretePostExecutionBackend = {
          readPostExecutionObservation:
            read,
        };

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        try {
          await reader.readPostExecutionObservation(
            makeRequest(),
          );

          throw new Error(
            "Expected backend failure.",
          );
        } catch (
          error
        ) {
          expect(
            error,
          ).toBeInstanceOf(
            PlatformCoreConcretePostExecutionReaderError,
          );

          const readerError =
            error as
              PlatformCoreConcretePostExecutionReaderError;

          expect(
            readerError.code,
          ).toBe(
            "BACKEND_FAILURE",
          );

          expect(
            readerError.causeValue,
          ).toBe(
            cause,
          );
        }

        expect(
          read,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "rejects backend attempts to inject execution provenance",
      async () => {
        const result = {
          ...BASE_CAPTURED_RESULT,

          executionId:
            "EXE-INJECTED",
        };

        const {
          backend,
        } =
          makeBackend(
            result,
          );

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects accessor properties in backend results",
      async () => {
        const result:
          Record<string, unknown> = {
          terminalStateObserved:
            "EXECUTED",

          observationState:
            "CAPTURED",

          observedState:
            CAPTURED_STATE,

          observedAt:
            OBSERVED_AT,
        };

        Object.defineProperty(
          result,
          "observedAt",
          {
            enumerable:
              true,

            configurable:
              true,

            get() {
              return OBSERVED_AT;
            },
          },
        );

        const {
          backend,
        } =
          makeBackend(
            result,
          );

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects invalid terminal state",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            ...BASE_CAPTURED_RESULT,

            terminalStateObserved:
              "UNKNOWN",
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects invalid observation state",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            ...BASE_CAPTURED_RESULT,

            observationState:
              "MISSING",
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects invalid backend observedAt",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            ...BASE_CAPTURED_RESULT,

            observedAt:
              "NOT-A-DATE",
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects CAPTURED observation with undefined observedState",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            terminalStateObserved:
              "EXECUTED",

            observationState:
              "CAPTURED",

            observedState:
              undefined,

            observedAt:
              OBSERVED_AT,
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "accepts JSON null as a valid CAPTURED observed state",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            terminalStateObserved:
              "EXECUTED",

            observationState:
              "CAPTURED",

            observedState:
              null,

            observedAt:
              OBSERVED_AT,
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        const result =
          await reader.readPostExecutionObservation(
            makeRequest(),
          );

        expect(
          result.observedState,
        ).toBeNull();

        expect(
          result.observationState,
        ).toBe(
          "CAPTURED",
        );
      },
    );

    it(
      "accepts FAILED plus NOT_AVAILABLE with null observed state",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            terminalStateObserved:
              "FAILED",

            observationState:
              "NOT_AVAILABLE",

            observedState:
              null,

            observedAt:
              OBSERVED_AT,
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        const result =
          await reader.readPostExecutionObservation(
            makeRequest(),
          );

        expect(
          result.terminalStateObserved,
        ).toBe(
          "FAILED",
        );

        expect(
          result.observationState,
        ).toBe(
          "NOT_AVAILABLE",
        );

        expect(
          result.observedState,
        ).toBeNull();
      },
    );

    it(
      "accepts ABORTED plus UNKNOWN with null observed state",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            terminalStateObserved:
              "ABORTED",

            observationState:
              "UNKNOWN",

            observedState:
              null,

            observedAt:
              OBSERVED_AT,
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        const result =
          await reader.readPostExecutionObservation(
            makeRequest(),
          );

        expect(
          result.terminalStateObserved,
        ).toBe(
          "ABORTED",
        );

        expect(
          result.observationState,
        ).toBe(
          "UNKNOWN",
        );
      },
    );

    it(
      "rejects non-null state material for NOT_AVAILABLE",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            terminalStateObserved:
              "FAILED",

            observationState:
              "NOT_AVAILABLE",

            observedState: {
              unexpected:
                true,
            },

            observedAt:
              OBSERVED_AT,
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects EXECUTED without CAPTURED observation",
      async () => {
        const {
          backend,
        } =
          makeBackend({
            terminalStateObserved:
              "EXECUTED",

            observationState:
              "NOT_AVAILABLE",

            observedState:
              null,

            observedAt:
              OBSERVED_AT,
          });

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        await expect(
          reader.readPostExecutionObservation(
            makeRequest(),
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_BACKEND_RESULT",
        });
      },
    );

    it(
      "rejects invalid request provenance before backend invocation",
      async () => {
        const {
          backend,
          read,
        } =
          makeBackend();

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        const invalidRequest = {
          ...BASE_REQUEST,

          executionSha256:
            "A".repeat(
              64,
            ),
        } as unknown as
          PlatformCorePostExecutionObservationRequest;

        await expect(
          reader.readPostExecutionObservation(
            invalidRequest,
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_CONFIGURATION",
        });

        expect(
          read,
        ).toHaveBeenCalledTimes(
          0,
        );
      },
    );

    it(
      "rejects unknown request fields before backend invocation",
      async () => {
        const {
          backend,
          read,
        } =
          makeBackend();

        const reader =
          createPlatformCoreConcretePostExecutionReader([
            makeBinding(
              backend,
            ),
          ]);

        const invalidRequest = {
          ...BASE_REQUEST,

          inventedField:
            "NO",
        } as unknown as
          PlatformCorePostExecutionObservationRequest;

        await expect(
          reader.readPostExecutionObservation(
            invalidRequest,
          ),
        ).rejects.toMatchObject({
          code:
            "INVALID_CONFIGURATION",
        });

        expect(
          read,
        ).toHaveBeenCalledTimes(
          0,
        );
      },
    );
  },
);

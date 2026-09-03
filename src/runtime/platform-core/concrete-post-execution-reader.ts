import type {
  PlatformCorePostExecutionObservationReader,
  PlatformCorePostExecutionObservationRequest,
  PlatformCorePostExecutionObservationResult,
} from "./concrete-execution-observer";

export const PLATFORM_CORE_CONCRETE_POST_EXECUTION_READER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CONCRETE-POST-EXECUTION-READER-v1" as const;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

const REQUEST_FIELDS =
  Object.freeze([
    "executionId",
    "executionVersion",
    "executionSha256",
    "executionEngineRef",
    "enforcementPointRef",
  ] as const);

const BACKEND_RESULT_FIELDS =
  Object.freeze([
    "terminalStateObserved",
    "observationState",
    "observedState",
    "observedAt",
  ] as const);

const BINDING_FIELDS =
  Object.freeze([
    "executionEngineRef",
    "enforcementPointRef",
    "backend",
  ] as const);

export type PlatformCoreConcretePostExecutionReaderErrorCode =
  | "INVALID_CONFIGURATION"
  | "DUPLICATE_BINDING"
  | "UNRESOLVED_BINDING"
  | "BACKEND_FAILURE"
  | "INVALID_BACKEND_RESULT";

export class PlatformCoreConcretePostExecutionReaderError
  extends Error {
  readonly code:
    PlatformCoreConcretePostExecutionReaderErrorCode;

  readonly causeValue:
    unknown;

  constructor(input: {
    code:
      PlatformCoreConcretePostExecutionReaderErrorCode;

    message:
      string;

    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "PlatformCoreConcretePostExecutionReaderError";

    this.code =
      input.code;

    this.causeValue =
      input.causeValue;
  }
}

export type PlatformCoreConcretePostExecutionBackendResult =
  Readonly<{
    terminalStateObserved:
      "EXECUTED" | "FAILED" | "ABORTED";

    observationState:
      "CAPTURED" | "NOT_AVAILABLE" | "UNKNOWN";

    observedState:
      unknown;

    observedAt:
      string;
  }>;

export interface PlatformCoreConcretePostExecutionBackend {
  readPostExecutionObservation(
    request:
      PlatformCorePostExecutionObservationRequest,
  ): Promise<PlatformCoreConcretePostExecutionBackendResult>;
}

export type PlatformCoreConcretePostExecutionBackendBinding =
  Readonly<{
    executionEngineRef:
      string;

    enforcementPointRef:
      string;

    backend:
      PlatformCoreConcretePostExecutionBackend;
  }>;

function failClosed(
  code:
    PlatformCoreConcretePostExecutionReaderErrorCode,
  message:
    string,
  causeValue?:
    unknown,
): never {
  throw new PlatformCoreConcretePostExecutionReaderError({
    code,
    message,
    causeValue,
  });
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(
      value,
    );

  return (
    prototype === Object.prototype
    || prototype === null
  );
}

function isNonEmptyTrimmedString(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && value.trim() === value
  );
}

function isSha256(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string"
    && SHA256_PATTERN.test(
      value,
    )
  );
}

function isValidDateTime(
  value:
    unknown,
): value is string {
  if (
    !isNonEmptyTrimmedString(
      value,
    )
  ) {
    return false;
  }

  return Number.isFinite(
    Date.parse(
      value,
    ),
  );
}

function assertExactOwnDataProperties(
  value:
    Record<string, unknown>,
  expectedFields:
    readonly string[],
  context:
    string,
  errorCode:
    PlatformCoreConcretePostExecutionReaderErrorCode,
): void {
  if (
    Object.getOwnPropertySymbols(
      value,
    ).length !== 0
  ) {
    return failClosed(
      errorCode,
      `${context} must not contain symbol keys.`,
      value,
    );
  }

  const actualKeys =
    Object.getOwnPropertyNames(
      value,
    ).sort();

  const expectedKeys =
    [
      ...expectedFields,
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length
    || actualKeys.some(
      (
        key,
        index,
      ) =>
        key !==
          expectedKeys[index]
    )
  ) {
    return failClosed(
      errorCode,
      `${context} contains missing or unknown fields.`,
      {
        actualKeys,
        expectedKeys,
      },
    );
  }

  for (
    const key
    of expectedKeys
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        value,
        key,
      );

    if (
      !descriptor
      || !descriptor.enumerable
      || !(
        "value" in descriptor
      )
    ) {
      return failClosed(
        errorCode,
        `${context}.${key} must be an enumerable data property.`,
        descriptor,
      );
    }
  }
}

function captureDataProperty(
  value:
    Record<string, unknown>,
  key:
    string,
  context:
    string,
  errorCode:
    PlatformCoreConcretePostExecutionReaderErrorCode,
): unknown {
  const descriptor =
    Object.getOwnPropertyDescriptor(
      value,
      key,
    );

  if (
    !descriptor
    || !descriptor.enumerable
    || !(
      "value" in descriptor
    )
  ) {
    return failClosed(
      errorCode,
      `${context}.${key} must be an enumerable data property.`,
      descriptor,
    );
  }

  return descriptor.value;
}

function captureRequest(
  value:
    PlatformCorePostExecutionObservationRequest,
): PlatformCorePostExecutionObservationRequest {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Concrete post-execution reader requires a plain observation request.",
      value,
    );
  }

  assertExactOwnDataProperties(
    value,
    REQUEST_FIELDS,
    "request",
    "INVALID_CONFIGURATION",
  );

  const executionId =
    captureDataProperty(
      value,
      "executionId",
      "request",
      "INVALID_CONFIGURATION",
    );

  const executionVersion =
    captureDataProperty(
      value,
      "executionVersion",
      "request",
      "INVALID_CONFIGURATION",
    );

  const executionSha256 =
    captureDataProperty(
      value,
      "executionSha256",
      "request",
      "INVALID_CONFIGURATION",
    );

  const executionEngineRef =
    captureDataProperty(
      value,
      "executionEngineRef",
      "request",
      "INVALID_CONFIGURATION",
    );

  const enforcementPointRef =
    captureDataProperty(
      value,
      "enforcementPointRef",
      "request",
      "INVALID_CONFIGURATION",
    );

  if (
    !isNonEmptyTrimmedString(
      executionId,
    )
    || executionVersion !== 2
    || !isSha256(
      executionSha256,
    )
    || !isNonEmptyTrimmedString(
      executionEngineRef,
    )
    || !isNonEmptyTrimmedString(
      enforcementPointRef,
    )
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Concrete post-execution reader request has invalid execution provenance.",
      value,
    );
  }

  return Object.freeze({
    executionId,
    executionVersion:
      2,
    executionSha256,
    executionEngineRef,
    enforcementPointRef,
  });
}

function captureBackendResult(
  value:
    unknown,
): PlatformCoreConcretePostExecutionBackendResult {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    return failClosed(
      "INVALID_BACKEND_RESULT",
      "Concrete post-execution backend result must be a plain object.",
      value,
    );
  }

  assertExactOwnDataProperties(
    value,
    BACKEND_RESULT_FIELDS,
    "backendResult",
    "INVALID_BACKEND_RESULT",
  );

  const terminalStateObserved =
    captureDataProperty(
      value,
      "terminalStateObserved",
      "backendResult",
      "INVALID_BACKEND_RESULT",
    );

  const observationState =
    captureDataProperty(
      value,
      "observationState",
      "backendResult",
      "INVALID_BACKEND_RESULT",
    );

  const observedState =
    captureDataProperty(
      value,
      "observedState",
      "backendResult",
      "INVALID_BACKEND_RESULT",
    );

  const observedAt =
    captureDataProperty(
      value,
      "observedAt",
      "backendResult",
      "INVALID_BACKEND_RESULT",
    );

  if (
    terminalStateObserved !== "EXECUTED"
    && terminalStateObserved !== "FAILED"
    && terminalStateObserved !== "ABORTED"
  ) {
    return failClosed(
      "INVALID_BACKEND_RESULT",
      "terminalStateObserved must be EXECUTED, FAILED or ABORTED.",
      terminalStateObserved,
    );
  }

  if (
    observationState !== "CAPTURED"
    && observationState !== "NOT_AVAILABLE"
    && observationState !== "UNKNOWN"
  ) {
    return failClosed(
      "INVALID_BACKEND_RESULT",
      "observationState must be CAPTURED, NOT_AVAILABLE or UNKNOWN.",
      observationState,
    );
  }

  if (
    !isValidDateTime(
      observedAt,
    )
  ) {
    return failClosed(
      "INVALID_BACKEND_RESULT",
      "observedAt must be a valid date-time string supplied by the backend observation.",
      observedAt,
    );
  }

  if (
    observationState ===
      "CAPTURED"
  ) {
    if (
      observedState ===
        undefined
    ) {
      return failClosed(
        "INVALID_BACKEND_RESULT",
        "CAPTURED backend observation requires observedState; JSON null remains a valid observed state.",
        observedState,
      );
    }
  } else if (
    observedState !==
      null
  ) {
    return failClosed(
      "INVALID_BACKEND_RESULT",
      "NOT_AVAILABLE or UNKNOWN backend observation requires observedState to be null.",
      observedState,
    );
  }

  if (
    terminalStateObserved ===
      "EXECUTED"
    && observationState !==
      "CAPTURED"
  ) {
    return failClosed(
      "INVALID_BACKEND_RESULT",
      "EXECUTED requires a CAPTURED backend observation.",
      {
        terminalStateObserved,
        observationState,
      },
    );
  }

  return Object.freeze({
    terminalStateObserved,
    observationState,
    observedState,
    observedAt,
  });
}

function captureBinding(
  value:
    PlatformCoreConcretePostExecutionBackendBinding,
): PlatformCoreConcretePostExecutionBackendBinding {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Concrete post-execution backend binding must be a plain object.",
      value,
    );
  }

  assertExactOwnDataProperties(
    value,
    BINDING_FIELDS,
    "binding",
    "INVALID_CONFIGURATION",
  );

  const executionEngineRef =
    captureDataProperty(
      value,
      "executionEngineRef",
      "binding",
      "INVALID_CONFIGURATION",
    );

  const enforcementPointRef =
    captureDataProperty(
      value,
      "enforcementPointRef",
      "binding",
      "INVALID_CONFIGURATION",
    );

  const backend =
    captureDataProperty(
      value,
      "backend",
      "binding",
      "INVALID_CONFIGURATION",
    );

  if (
    !isNonEmptyTrimmedString(
      executionEngineRef,
    )
    || !isNonEmptyTrimmedString(
      enforcementPointRef,
    )
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Backend binding requires non-empty trimmed executionEngineRef and enforcementPointRef.",
      value,
    );
  }

  if (
    (
      typeof backend !== "object"
      || backend === null
    )
    && typeof backend !== "function"
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Backend binding requires an object exposing readPostExecutionObservation.",
      backend,
    );
  }

  const backendReader =
    backend as PlatformCoreConcretePostExecutionBackend;

  if (
    typeof backendReader.readPostExecutionObservation !==
      "function"
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Backend does not expose readPostExecutionObservation.",
      backend,
    );
  }

  return Object.freeze({
    executionEngineRef,
    enforcementPointRef,
    backend:
      backendReader,
  });
}

function resolveBackend(
  registry:
    ReadonlyMap<
      string,
      ReadonlyMap<
        string,
        PlatformCoreConcretePostExecutionBackend
      >
    >,
  request:
    PlatformCorePostExecutionObservationRequest,
): PlatformCoreConcretePostExecutionBackend {
  const engine =
    registry.get(
      request.executionEngineRef,
    );

  const backend =
    engine?.get(
      request.enforcementPointRef,
    );

  if (!backend) {
    return failClosed(
      "UNRESOLVED_BINDING",
      "No concrete post-execution backend is registered for the exact execution-engine and enforcement-point binding.",
      {
        executionEngineRef:
          request.executionEngineRef,
        enforcementPointRef:
          request.enforcementPointRef,
      },
    );
  }

  return backend;
}

export function createPlatformCoreConcretePostExecutionReader(
  bindings:
    readonly PlatformCoreConcretePostExecutionBackendBinding[],
): PlatformCorePostExecutionObservationReader {
  if (
    !Array.isArray(
      bindings,
    )
  ) {
    return failClosed(
      "INVALID_CONFIGURATION",
      "Concrete post-execution reader bindings must be an array.",
      bindings,
    );
  }

  const mutableRegistry =
    new Map<
      string,
      Map<
        string,
        PlatformCoreConcretePostExecutionBackend
      >
    >();

  for (
    const rawBinding
    of bindings
  ) {
    const binding =
      captureBinding(
        rawBinding,
      );

    let engine =
      mutableRegistry.get(
        binding.executionEngineRef,
      );

    if (!engine) {
      engine =
        new Map();

      mutableRegistry.set(
        binding.executionEngineRef,
        engine,
      );
    }

    if (
      engine.has(
        binding.enforcementPointRef,
      )
    ) {
      return failClosed(
        "DUPLICATE_BINDING",
        "Duplicate concrete post-execution backend binding is forbidden.",
        {
          executionEngineRef:
            binding.executionEngineRef,
          enforcementPointRef:
            binding.enforcementPointRef,
        },
      );
    }

    engine.set(
      binding.enforcementPointRef,
      binding.backend,
    );
  }

  const registry =
    new Map<
      string,
      ReadonlyMap<
        string,
        PlatformCoreConcretePostExecutionBackend
      >
    >();

  for (
    const [
      executionEngineRef,
      engine,
    ]
    of mutableRegistry
  ) {
    registry.set(
      executionEngineRef,
      new Map(
        engine,
      ),
    );
  }

  return Object.freeze({
    async readPostExecutionObservation(
      rawRequest:
        PlatformCorePostExecutionObservationRequest,
    ): Promise<PlatformCorePostExecutionObservationResult> {
      const request =
        captureRequest(
          rawRequest,
        );

      const backend =
        resolveBackend(
          registry,
          request,
        );

      let rawResult:
        PlatformCoreConcretePostExecutionBackendResult;

      try {
        /*
         * Exactly one external backend read.
         *
         * No retry is permitted here.
         */
        rawResult =
          await backend.readPostExecutionObservation(
            request,
          );
      } catch (
        error
      ) {
        return failClosed(
          "BACKEND_FAILURE",
          "Concrete post-execution backend read failed.",
          error,
        );
      }

      const result =
        captureBackendResult(
          rawResult,
        );

      return Object.freeze({
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
          result.terminalStateObserved,

        observationState:
          result.observationState,

        observedState:
          result.observedState,

        observedAt:
          result.observedAt,
      });
    },
  });
}

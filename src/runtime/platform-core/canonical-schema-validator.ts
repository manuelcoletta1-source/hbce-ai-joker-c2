import type {
  ErrorObject,
} from "ajv";

import {
  compilePlatformCoreCanonicalSchemas,
} from "./canonical-schema-compiler";

import type {
  PlatformCoreCanonicalSchemaLoadOptions,
} from "./canonical-schema-loader";

import {
  isPlatformCoreSchemaKind,
  type PlatformCoreSchemaKind,
} from "./canonical-schema-registry";

export const PLATFORM_CORE_STATIC_SCHEMA_VALIDATOR_PROTOCOL =
  "HBCE-PLATFORM-CORE-STATIC-SCHEMA-VALIDATOR-v1" as const;

export type PlatformCoreStaticValidationFailureCode =
  | "HBCE_PLATFORM_CORE_SCHEMA_KIND_UNKNOWN"
  | "HBCE_PLATFORM_CORE_SCHEMA_STRUCTURAL_INVALID"
  | "HBCE_PLATFORM_CORE_SCHEMA_VALIDATION_UNAVAILABLE";

export interface PlatformCoreStaticValidationIssue {
  readonly instancePath: string;
  readonly schemaPath: string;
  readonly keyword: string;
  readonly message: string | null;
}

export interface PlatformCoreStaticValidationSuccess {
  readonly valid: true;
  readonly kind: PlatformCoreSchemaKind;
  readonly code: null;
  readonly issues: readonly [];
}

export interface PlatformCoreStaticValidationFailure {
  readonly valid: false;

  readonly kind:
    PlatformCoreSchemaKind |
    null;

  readonly code:
    PlatformCoreStaticValidationFailureCode;

  readonly issues:
    readonly PlatformCoreStaticValidationIssue[];
}

export type PlatformCoreStaticValidationResult =
  | PlatformCoreStaticValidationSuccess
  | PlatformCoreStaticValidationFailure;

function freezeIssues(
  errors:
    ErrorObject[] |
    null |
    undefined,
): readonly PlatformCoreStaticValidationIssue[] {
  if (
    errors === null ||
    errors === undefined ||
    errors.length === 0
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    errors.map(
      (
        error,
      ): PlatformCoreStaticValidationIssue =>
        Object.freeze({
          /*
           * Do not return the submitted value itself.
           * Static validation evidence is intentionally
           * limited to structural paths and rule metadata.
           */
          instancePath:
            error.instancePath,

          schemaPath:
            error.schemaPath,

          keyword:
            error.keyword,

          message:
            error.message ??
            null,
        }),
    ),
  );
}

function makeUnknownKindFailure():
  PlatformCoreStaticValidationFailure {
  return Object.freeze({
    valid:
      false,

    kind:
      null,

    code:
      "HBCE_PLATFORM_CORE_SCHEMA_KIND_UNKNOWN",

    issues:
      Object.freeze([]),
  });
}

function makeUnavailableFailure(
  kind:
    PlatformCoreSchemaKind,
):
  PlatformCoreStaticValidationFailure {
  return Object.freeze({
    valid:
      false,

    kind,

    code:
      "HBCE_PLATFORM_CORE_SCHEMA_VALIDATION_UNAVAILABLE",

    /*
     * Compiler or loader internals are deliberately
     * not exposed through this validation result.
     */
    issues:
      Object.freeze([]),
  });
}

function makeStructuralFailure(
  kind:
    PlatformCoreSchemaKind,

  errors:
    ErrorObject[] |
    null |
    undefined,
):
  PlatformCoreStaticValidationFailure {
  return Object.freeze({
    valid:
      false,

    kind,

    code:
      "HBCE_PLATFORM_CORE_SCHEMA_STRUCTURAL_INVALID",

    issues:
      freezeIssues(
        errors,
      ),
  });
}

function makeSuccess(
  kind:
    PlatformCoreSchemaKind,
):
  PlatformCoreStaticValidationSuccess {
  return Object.freeze({
    valid:
      true,

    kind,

    code:
      null,

    issues:
      Object.freeze(
        [] as const,
      ),
  });
}

export function validatePlatformCoreCanonicalSchema(
  kind:
    unknown,

  value:
    unknown,

  options:
    PlatformCoreCanonicalSchemaLoadOptions = {},
): PlatformCoreStaticValidationResult {
  /*
   * Classification is canonical-registry based.
   * No object-ID prefix is allowed to select a schema.
   */
  if (
    !isPlatformCoreSchemaKind(
      kind,
    )
  ) {
    return makeUnknownKindFailure();
  }

  let compiled:
    ReturnType<
      typeof compilePlatformCoreCanonicalSchemas
    >;

  try {
    compiled =
      compilePlatformCoreCanonicalSchemas(
        options,
      );
  } catch {
    /*
     * Missing/tampered schemas, compiler invariant
     * failures and other trust-boundary failures are
     * all fail-closed at this public static layer.
     */
    return makeUnavailableFailure(
      kind,
    );
  }

  const validator =
    compiled.getValidator(
      kind,
    );

  let validationResult:
    boolean |
    Promise<unknown>;

  try {
    validationResult =
      validator(
        value,
      );
  } catch {
    return makeUnavailableFailure(
      kind,
    );
  }

  /*
   * This API is deliberately synchronous.
   * An asynchronous AJV result is not silently
   * coerced to truthiness.
   */
  if (
    typeof validationResult !==
    "boolean"
  ) {
    return makeUnavailableFailure(
      kind,
    );
  }

  if (
    validationResult
  ) {
    return makeSuccess(
      kind,
    );
  }

  return makeStructuralFailure(
    kind,
    validator.errors,
  );
}

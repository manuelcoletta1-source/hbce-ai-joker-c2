import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

import type {
  AnySchema,
  ValidateFunction,
} from "ajv";

import {
  loadAllPlatformCoreCanonicalSchemas,
  type PlatformCoreCanonicalSchemaLoadOptions,
} from "./canonical-schema-loader";

import {
  PLATFORM_CORE_CANONICAL_SCHEMA_COUNT,
  PLATFORM_CORE_SCHEMA_KINDS,
  type PlatformCoreSchemaKind,
} from "./canonical-schema-registry";

export const PLATFORM_CORE_CANONICAL_SCHEMA_COMPILER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-SCHEMA-COMPILER-v1" as const;

/*
 * P002-D030 compiler contract.
 *
 * All nine canonical schemas are valid JSON Schema
 * Draft 2020-12 documents.
 *
 * Five schemas use `properties` inside conditional
 * subschemas without repeating local `type: "object"`.
 * JSON Schema permits that construction, while AJV
 * strictTypes rejects it as a strict lint condition.
 *
 * Therefore:
 *
 *   strictSchema   = true
 *   strictTypes    = false
 *   strictNumbers  = true
 *   strictTuples   = true
 *   $data          = false
 *   remote loading = unavailable
 *
 * This exception does not modify canonical schema bytes.
 */
export const PLATFORM_CORE_AJV_COMPILER_CONTRACT =
  Object.freeze({
    dialect:
      "https://json-schema.org/draft/2020-12/schema",

    allErrors:
      true,

    strict:
      true,

    strictSchema:
      true,

    strictTypes:
      false,

    strictNumbers:
      true,

    strictTuples:
      true,

    validateSchema:
      true,

    dataExtension:
      false,

    remoteSchemaLoading:
      false,
  } as const);

export type PlatformCoreCanonicalSchemaCompileErrorCode =
  | "HBCE_PLATFORM_CORE_SCHEMA_META_VALIDATION_FAILED"
  | "HBCE_PLATFORM_CORE_SCHEMA_REGISTRATION_FAILED"
  | "HBCE_PLATFORM_CORE_SCHEMA_COMPILATION_FAILED"
  | "HBCE_PLATFORM_CORE_SCHEMA_VALIDATOR_MISSING"
  | "HBCE_PLATFORM_CORE_SCHEMA_COMPILER_INVARIANT_FAILED";

export class PlatformCoreCanonicalSchemaCompileError extends Error {
  readonly code:
    PlatformCoreCanonicalSchemaCompileErrorCode;

  readonly kind:
    PlatformCoreSchemaKind | null;

  constructor(params: {
    readonly code:
      PlatformCoreCanonicalSchemaCompileErrorCode;

    readonly kind?:
      PlatformCoreSchemaKind;

    readonly message:
      string;
  }) {
    super(params.message);

    this.name =
      "PlatformCoreCanonicalSchemaCompileError";

    this.code =
      params.code;

    this.kind =
      params.kind ?? null;
  }
}

export interface CompiledPlatformCoreCanonicalSchemas {
  readonly validators:
    Readonly<
      Record<
        PlatformCoreSchemaKind,
        ValidateFunction
      >
    >;

  getValidator(
    kind: PlatformCoreSchemaKind,
  ): ValidateFunction;
}

function createPlatformCoreAjv(): Ajv2020 {
  const ajv =
    new Ajv2020({
      allErrors:
        true,

      strict:
        true,

      strictSchema:
        true,

      /*
       * Explicit D030 compatibility exception.
       * Do not widen this to strict:false.
       */
      strictTypes:
        false,

      strictNumbers:
        true,

      strictTuples:
        true,

      validateSchema:
        true,

      /*
       * The compiler is synchronous and accepts only
       * byte-verified local canonical schemas.
       * No remote schema resolution is configured.
       */
      loadSchema:
        undefined,

      $data:
        false,
    });

  addFormats(ajv);

  if (
    ajv.opts.strictSchema !== true ||
    ajv.opts.strictTypes !== false ||
    ajv.opts.strictNumbers !== true ||
    ajv.opts.strictTuples !== true ||
    ajv.opts.$data === true
  ) {
    throw new PlatformCoreCanonicalSchemaCompileError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_COMPILER_INVARIANT_FAILED",

      message:
        "Platform Core AJV compiler options violated canonical compiler contract",
    });
  }

  return ajv;
}

export function getPlatformCoreCanonicalSchemaCompilerKey(
  kind: PlatformCoreSchemaKind,
): string {
  return `hbce-platform-core:${kind}`;
}

function assertPlatformCoreCompilerResultInvariant(
  validators:
    Readonly<
      Partial<
        Record<
          PlatformCoreSchemaKind,
          ValidateFunction
        >
      >
    >,
): asserts validators is Readonly<
  Record<
    PlatformCoreSchemaKind,
    ValidateFunction
  >
> {
  const keys =
    Object.keys(validators);

  if (
    keys.length !==
    PLATFORM_CORE_CANONICAL_SCHEMA_COUNT
  ) {
    throw new PlatformCoreCanonicalSchemaCompileError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_COMPILER_INVARIANT_FAILED",

      message:
        "Platform Core compiler did not produce exactly nine validators",
    });
  }

  for (
    const kind of
    PLATFORM_CORE_SCHEMA_KINDS
  ) {
    if (
      typeof validators[kind] !==
      "function"
    ) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_VALIDATOR_MISSING",

        kind,

        message:
          `Platform Core canonical validator missing: ${kind}`,
      });
    }
  }
}

export function compilePlatformCoreCanonicalSchemas(
  options:
    PlatformCoreCanonicalSchemaLoadOptions = {},
): CompiledPlatformCoreCanonicalSchemas {
  /*
   * This call is the mandatory trust boundary:
   * schemas reach AJV only after local byte identity
   * has been checked against the canonical registry.
   */
  const loadedSchemas =
    loadAllPlatformCoreCanonicalSchemas(
      options,
    );

  if (
    loadedSchemas.length !==
    PLATFORM_CORE_CANONICAL_SCHEMA_COUNT
  ) {
    throw new PlatformCoreCanonicalSchemaCompileError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_COMPILER_INVARIANT_FAILED",

      message:
        "Canonical byte loader did not return exactly nine schemas",
    });
  }

  const ajv =
    createPlatformCoreAjv();

  for (
    const loaded of
    loadedSchemas
  ) {
    let metaSchemaValidationResult:
      boolean | Promise<unknown>;

    try {
      metaSchemaValidationResult =
        ajv.validateSchema(
          loaded.schema as unknown as AnySchema,
        );
    } catch (error) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_META_VALIDATION_FAILED",

        kind:
          loaded.kind,

        message:
          `Canonical schema meta-validation threw for ${loaded.kind}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
      });
    }

    if (
      typeof metaSchemaValidationResult !==
      "boolean"
    ) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_META_VALIDATION_FAILED",

        kind:
          loaded.kind,

        message:
          `Canonical schema meta-validation returned asynchronous result for ${loaded.kind}`,
      });
    }

    if (!metaSchemaValidationResult) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_META_VALIDATION_FAILED",

        kind:
          loaded.kind,

        message:
          `Canonical schema meta-validation failed for ${loaded.kind}: ${ajv.errorsText(
            ajv.errors ?? [],
          )}`,
      });
    }

    const key =
      getPlatformCoreCanonicalSchemaCompilerKey(
        loaded.kind,
      );

    try {
      ajv.addSchema(
        loaded.schema as unknown as AnySchema,
        key,
      );
    } catch (error) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_REGISTRATION_FAILED",

        kind:
          loaded.kind,

        message:
          `Canonical schema registration failed for ${loaded.kind}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
      });
    }
  }

  const validators:
    Partial<
      Record<
        PlatformCoreSchemaKind,
        ValidateFunction
      >
    > = {};

  for (
    const kind of
    PLATFORM_CORE_SCHEMA_KINDS
  ) {
    const key =
      getPlatformCoreCanonicalSchemaCompilerKey(
        kind,
      );

    let validator:
      ValidateFunction | undefined;

    try {
      validator =
        ajv.getSchema(key);
    } catch (error) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_COMPILATION_FAILED",

        kind,

        message:
          `Canonical schema compilation failed for ${kind}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
      });
    }

    if (
      typeof validator !==
      "function"
    ) {
      throw new PlatformCoreCanonicalSchemaCompileError({
        code:
          "HBCE_PLATFORM_CORE_SCHEMA_VALIDATOR_MISSING",

        kind,

        message:
          `Canonical schema validator unavailable: ${kind}`,
      });
    }

    validators[kind] =
      validator;
  }

  assertPlatformCoreCompilerResultInvariant(
    validators,
  );

  const frozenValidators =
    Object.freeze({
      ...validators,
    });

  return Object.freeze({
    validators:
      frozenValidators,

    getValidator(
      kind: PlatformCoreSchemaKind,
    ): ValidateFunction {
      return frozenValidators[kind];
    },
  });
}

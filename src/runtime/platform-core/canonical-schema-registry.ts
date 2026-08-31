/**
 * HBCE Platform Core canonical schema registry.
 *
 * Boundary:
 * - hermeticum-bce-platform remains the canonical specification/schema root.
 * - this runtime repository contains a byte-verified snapshot only.
 * - schema kind is determined by this registry and validated structure,
 *   never by an object identifier prefix.
 * - this module does not perform JSON Schema validation.
 * - this module does not implement cross-object runtime enforcement.
 */

export const PLATFORM_CORE_CANONICAL_SOURCE_REPOSITORY =
  "hermeticum-bce-platform" as const;

export const PLATFORM_CORE_CANONICAL_SOURCE_COMMIT =
  "581c51a8f7a7f7e3fd098f79f53acca1c0353bfa" as const;

export const PLATFORM_CORE_SCHEMA_SNAPSHOT_DIRECTORY =
  "src/runtime/platform-core/schemas" as const;

export const PLATFORM_CORE_SCHEMA_KINDS = [
  "MANDATE",
  "CAPABILITY",
  "AUTHORITY",
  "AUTHORIZATION",
  "EXECUTION",
  "OUTCOME",
  "CONSEQUENCE",
  "MATRIX_STATE",
  "FEEDBACK",
] as const;

export type PlatformCoreSchemaKind =
  (typeof PLATFORM_CORE_SCHEMA_KINDS)[number];

export interface PlatformCoreCanonicalSchemaDescriptor {
  readonly kind: PlatformCoreSchemaKind;
  readonly filename: string;
  readonly sha256: string;
}

export const PLATFORM_CORE_CANONICAL_SCHEMAS = {
  MANDATE: {
    kind: "MANDATE",
    filename: "hbce-mandate.schema.json",
    sha256:
      "0bda1fb9ff2a32a3f563cac1cd7cae0a7cece93406ac3124a6c23d2df520aa48",
  },

  CAPABILITY: {
    kind: "CAPABILITY",
    filename: "hbce-capability.schema.json",
    sha256:
      "76a0e671ae8c5a0d34b35f295886a0683aaae176f4ae8dece1c04cc5ca4228b3",
  },

  AUTHORITY: {
    kind: "AUTHORITY",
    filename: "hbce-authority.schema.json",
    sha256:
      "16f087fb1d4aaa96abf34e2795b01475f2f4d30c823492fcdd255482882f8615",
  },

  AUTHORIZATION: {
    kind: "AUTHORIZATION",
    filename: "hbce-authorization.schema.json",
    sha256:
      "5dc5774c17ca905ac4a23632458a0fd5e688d5dbe86443a6f129328d6f375599",
  },

  EXECUTION: {
    kind: "EXECUTION",
    filename: "hbce-execution.schema.json",
    sha256:
      "d21dc3237a0359f8c3d35d2ed1ada68c53bb4d24726e2ec01c9c16da21fe1abd",
  },

  OUTCOME: {
    kind: "OUTCOME",
    filename: "hbce-outcome.schema.json",
    sha256:
      "570fcb71f4831b9e5aef3eafae268f0db719d46a6e66dfd06d26c6bd65d42ab7",
  },

  CONSEQUENCE: {
    kind: "CONSEQUENCE",
    filename: "hbce-consequence.schema.json",
    sha256:
      "795319f24e3312e7aaecbe2fa915d9bc25a6e3959d623c7869ea33ad196666ed",
  },

  MATRIX_STATE: {
    kind: "MATRIX_STATE",
    filename: "hbce-matrix-state.schema.json",
    sha256:
      "7bdcc7993fc83054719ce2827da8b3a4db5d8a160ed103041c277b2836d9c778",
  },

  FEEDBACK: {
    kind: "FEEDBACK",
    filename: "hbce-feedback.schema.json",
    sha256:
      "1e99b762635043b8bcde0d5b6f74f6dff092491151c9000373695dc8e696ea8b",
  },
} as const satisfies Record<
  PlatformCoreSchemaKind,
  PlatformCoreCanonicalSchemaDescriptor
>;

export const PLATFORM_CORE_CANONICAL_SCHEMA_COUNT =
  PLATFORM_CORE_SCHEMA_KINDS.length;

export function isPlatformCoreSchemaKind(
  value: unknown,
): value is PlatformCoreSchemaKind {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      PLATFORM_CORE_CANONICAL_SCHEMAS,
      value,
    )
  );
}

export function getPlatformCoreCanonicalSchema(
  kind: PlatformCoreSchemaKind,
): PlatformCoreCanonicalSchemaDescriptor {
  return PLATFORM_CORE_CANONICAL_SCHEMAS[kind];
}

export function listPlatformCoreCanonicalSchemas():
  readonly PlatformCoreCanonicalSchemaDescriptor[] {
  return PLATFORM_CORE_SCHEMA_KINDS.map(
    (kind) => PLATFORM_CORE_CANONICAL_SCHEMAS[kind],
  );
}

export function assertPlatformCoreCanonicalSchemaRegistryInvariant():
  void {
  if (PLATFORM_CORE_CANONICAL_SCHEMA_COUNT !== 9) {
    throw new Error(
      "HBCE_PLATFORM_CORE_SCHEMA_REGISTRY_COUNT_INVALID",
    );
  }

  const descriptors =
    listPlatformCoreCanonicalSchemas();

  const filenames =
    new Set(
      descriptors.map(
        (descriptor) => descriptor.filename,
      ),
    );

  if (filenames.size !== descriptors.length) {
    throw new Error(
      "HBCE_PLATFORM_CORE_SCHEMA_REGISTRY_FILENAME_COLLISION",
    );
  }

  const digests =
    new Set(
      descriptors.map(
        (descriptor) => descriptor.sha256,
      ),
    );

  if (digests.size !== descriptors.length) {
    throw new Error(
      "HBCE_PLATFORM_CORE_SCHEMA_REGISTRY_DIGEST_COLLISION",
    );
  }

  for (const descriptor of descriptors) {
    if (
      descriptor.kind.length === 0 ||
      descriptor.filename.length === 0
    ) {
      throw new Error(
        "HBCE_PLATFORM_CORE_SCHEMA_REGISTRY_DESCRIPTOR_INVALID",
      );
    }

    if (
      !/^[a-f0-9]{64}$/.test(
        descriptor.sha256,
      )
    ) {
      throw new Error(
        "HBCE_PLATFORM_CORE_SCHEMA_REGISTRY_SHA256_INVALID",
      );
    }
  }
}

assertPlatformCoreCanonicalSchemaRegistryInvariant();

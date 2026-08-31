import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";

import {
  PLATFORM_CORE_SCHEMA_SNAPSHOT_DIRECTORY,
  getPlatformCoreCanonicalSchema,
  listPlatformCoreCanonicalSchemas,
  type PlatformCoreCanonicalSchemaDescriptor,
  type PlatformCoreSchemaKind,
} from "./canonical-schema-registry";

export const PLATFORM_CORE_CANONICAL_SCHEMA_LOADER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-SCHEMA-LOADER-v1" as const;

export type PlatformCoreCanonicalSchemaLoadErrorCode =
  | "HBCE_PLATFORM_CORE_SCHEMA_PATH_BOUNDARY_VIOLATION"
  | "HBCE_PLATFORM_CORE_SCHEMA_READ_FAILED"
  | "HBCE_PLATFORM_CORE_SCHEMA_SHA256_MISMATCH"
  | "HBCE_PLATFORM_CORE_SCHEMA_JSON_PARSE_FAILED"
  | "HBCE_PLATFORM_CORE_SCHEMA_JSON_ROOT_INVALID";

export class PlatformCoreCanonicalSchemaLoadError extends Error {
  readonly code: PlatformCoreCanonicalSchemaLoadErrorCode;
  readonly kind: PlatformCoreSchemaKind;
  readonly filename: string;

  constructor(params: {
    readonly code: PlatformCoreCanonicalSchemaLoadErrorCode;
    readonly kind: PlatformCoreSchemaKind;
    readonly filename: string;
    readonly message: string;
  }) {
    super(params.message);

    this.name =
      "PlatformCoreCanonicalSchemaLoadError";

    this.code =
      params.code;

    this.kind =
      params.kind;

    this.filename =
      params.filename;
  }
}

export interface PlatformCoreCanonicalSchemaLoadOptions {
  readonly repositoryRoot?: string;
}

export interface LoadedPlatformCoreCanonicalSchema {
  readonly kind: PlatformCoreSchemaKind;
  readonly filename: string;
  readonly sha256: string;
  readonly schema: Readonly<Record<string, unknown>>;
}

function resolveRepositoryRoot(
  options: PlatformCoreCanonicalSchemaLoadOptions,
): string {
  return resolve(
    options.repositoryRoot ??
      process.cwd(),
  );
}

function resolveCanonicalSnapshotDirectory(
  options: PlatformCoreCanonicalSchemaLoadOptions,
): string {
  return resolve(
    resolveRepositoryRoot(options),
    PLATFORM_CORE_SCHEMA_SNAPSHOT_DIRECTORY,
  );
}

function resolveCanonicalSchemaPath(params: {
  readonly descriptor:
    PlatformCoreCanonicalSchemaDescriptor;
  readonly options:
    PlatformCoreCanonicalSchemaLoadOptions;
}): string {
  const snapshotDirectory =
    resolveCanonicalSnapshotDirectory(
      params.options,
    );

  const schemaPath =
    resolve(
      snapshotDirectory,
      params.descriptor.filename,
    );

  const relativePath =
    relative(
      snapshotDirectory,
      schemaPath,
    );

  if (
    relativePath.length === 0 ||
    relativePath === ".." ||
    relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(relativePath) ||
    dirname(schemaPath) !== snapshotDirectory
  ) {
    throw new PlatformCoreCanonicalSchemaLoadError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_PATH_BOUNDARY_VIOLATION",
      kind:
        params.descriptor.kind,
      filename:
        params.descriptor.filename,
      message:
        `Canonical schema path escaped snapshot boundary: ${params.descriptor.kind}`,
    });
  }

  return schemaPath;
}

function computeSha256(
  bytes: Buffer,
): string {
  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}

function deepFreezeJsonValue<T>(
  value: T,
): T {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return value;
  }

  for (
    const child of
    Object.values(
      value as Record<string, unknown>,
    )
  ) {
    deepFreezeJsonValue(child);
  }

  return Object.freeze(value);
}

function parseCanonicalSchemaJson(params: {
  readonly descriptor:
    PlatformCoreCanonicalSchemaDescriptor;
  readonly bytes: Buffer;
}): Readonly<Record<string, unknown>> {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        params.bytes.toString("utf8"),
      );
  } catch {
    throw new PlatformCoreCanonicalSchemaLoadError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_JSON_PARSE_FAILED",
      kind:
        params.descriptor.kind,
      filename:
        params.descriptor.filename,
      message:
        `Canonical schema JSON parse failed: ${params.descriptor.kind}`,
    });
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new PlatformCoreCanonicalSchemaLoadError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_JSON_ROOT_INVALID",
      kind:
        params.descriptor.kind,
      filename:
        params.descriptor.filename,
      message:
        `Canonical schema JSON root invalid: ${params.descriptor.kind}`,
    });
  }

  return deepFreezeJsonValue(
    parsed as Record<string, unknown>,
  );
}

function readCanonicalSchemaBytes(params: {
  readonly descriptor:
    PlatformCoreCanonicalSchemaDescriptor;
  readonly schemaPath: string;
}): Buffer {
  try {
    return readFileSync(
      params.schemaPath,
    );
  } catch {
    throw new PlatformCoreCanonicalSchemaLoadError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_READ_FAILED",
      kind:
        params.descriptor.kind,
      filename:
        params.descriptor.filename,
      message:
        `Canonical schema read failed: ${params.descriptor.kind}`,
    });
  }
}

function loadCanonicalSchemaDescriptor(params: {
  readonly descriptor:
    PlatformCoreCanonicalSchemaDescriptor;
  readonly options:
    PlatformCoreCanonicalSchemaLoadOptions;
}): LoadedPlatformCoreCanonicalSchema {
  const schemaPath =
    resolveCanonicalSchemaPath({
      descriptor:
        params.descriptor,
      options:
        params.options,
    });

  const bytes =
    readCanonicalSchemaBytes({
      descriptor:
        params.descriptor,
      schemaPath,
    });

  const actualSha256 =
    computeSha256(bytes);

  if (
    actualSha256 !==
    params.descriptor.sha256
  ) {
    throw new PlatformCoreCanonicalSchemaLoadError({
      code:
        "HBCE_PLATFORM_CORE_SCHEMA_SHA256_MISMATCH",
      kind:
        params.descriptor.kind,
      filename:
        params.descriptor.filename,
      message:
        `Canonical schema SHA-256 mismatch: ${params.descriptor.kind}`,
    });
  }

  const schema =
    parseCanonicalSchemaJson({
      descriptor:
        params.descriptor,
      bytes,
    });

  return Object.freeze({
    kind:
      params.descriptor.kind,
    filename:
      params.descriptor.filename,
    sha256:
      actualSha256,
    schema,
  });
}

export function loadPlatformCoreCanonicalSchema(
  kind: PlatformCoreSchemaKind,
  options:
    PlatformCoreCanonicalSchemaLoadOptions = {},
): LoadedPlatformCoreCanonicalSchema {
  return loadCanonicalSchemaDescriptor({
    descriptor:
      getPlatformCoreCanonicalSchema(kind),
    options,
  });
}

export function loadAllPlatformCoreCanonicalSchemas(
  options:
    PlatformCoreCanonicalSchemaLoadOptions = {},
): readonly LoadedPlatformCoreCanonicalSchema[] {
  const loaded =
    listPlatformCoreCanonicalSchemas()
      .map(
        (descriptor) =>
          loadCanonicalSchemaDescriptor({
            descriptor,
            options,
          }),
      );

  return Object.freeze(loaded);
}

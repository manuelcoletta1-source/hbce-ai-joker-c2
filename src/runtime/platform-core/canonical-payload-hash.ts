import { createHash } from "crypto";

export const PLATFORM_CORE_CANONICAL_PAYLOAD_HASH_PROFILE =
  "HBCE-PLATFORM-CORE-PAYLOAD-SHA256-v1" as const;

export type PlatformCoreCanonicalPayloadHashErrorCode =
  | "INVALID_ROOT"
  | "UNSUPPORTED_VALUE"
  | "CYCLIC_VALUE"
  | "INVALID_PAYLOAD_SHA256";

export class PlatformCoreCanonicalPayloadHashError extends Error {
  readonly code: PlatformCoreCanonicalPayloadHashErrorCode;

  constructor(
    code: PlatformCoreCanonicalPayloadHashErrorCode,
    message: string
  ) {
    super(message);

    this.name = "PlatformCoreCanonicalPayloadHashError";
    this.code = code;
  }
}

const SHA256_LOWER_HEX_PATTERN = /^[a-f0-9]{64}$/;

type JsonPrimitive =
  | null
  | boolean
  | number
  | string;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

function failUnsupported(
  path: string,
  detail: string
): never {
  throw new PlatformCoreCanonicalPayloadHashError(
    "UNSUPPORTED_VALUE",
    `Unsupported Platform Core canonical JSON value at ${path}: ${detail}`
  );
}

function canonicalizeJsonValue(
  value: unknown,
  path: string,
  ancestors: WeakSet<object>,
  omitOwnTopLevelPayloadSha256: boolean
): string {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "string":
      return JSON.stringify(value);

    case "boolean":
      return value ? "true" : "false";

    case "number":
      if (!Number.isFinite(value)) {
        return failUnsupported(
          path,
          "number must be finite"
        );
      }

      return JSON.stringify(value);

    case "undefined":
      return failUnsupported(
        path,
        "undefined is not canonical JSON"
      );

    case "bigint":
      return failUnsupported(
        path,
        "bigint is not canonical JSON"
      );

    case "function":
      return failUnsupported(
        path,
        "function is not canonical JSON"
      );

    case "symbol":
      return failUnsupported(
        path,
        "symbol is not canonical JSON"
      );
  }

  if (typeof value !== "object") {
    return failUnsupported(
      path,
      `unsupported type ${typeof value}`
    );
  }

  if (ancestors.has(value)) {
    throw new PlatformCoreCanonicalPayloadHashError(
      "CYCLIC_VALUE",
      `Cyclic Platform Core canonical JSON value at ${path}`
    );
  }

  if (Array.isArray(value)) {
    ancestors.add(value);

    try {
      const items = value.map(
        (item, index) =>
          canonicalizeJsonValue(
            item,
            `${path}[${index}]`,
            ancestors,
            false
          )
      );

      return `[${items.join(",")}]`;
    } finally {
      ancestors.delete(value);
    }
  }

  if (!isPlainObject(value)) {
    return failUnsupported(
      path,
      "only plain JSON objects are supported"
    );
  }

  const symbolKeys =
    Object.getOwnPropertySymbols(value);

  if (symbolKeys.length > 0) {
    return failUnsupported(
      path,
      "symbol object keys are not canonical JSON"
    );
  }

  ancestors.add(value);

  try {
    const keys =
      Object.getOwnPropertyNames(value)
        .filter((key) => {
          if (
            omitOwnTopLevelPayloadSha256 &&
            key === "payload_sha256"
          ) {
            return false;
          }

          return true;
        })
        .sort();

    const members: string[] = [];

    for (const key of keys) {
      const descriptor =
        Object.getOwnPropertyDescriptor(
          value,
          key
        );

      if (!descriptor) {
        return failUnsupported(
          `${path}.${key}`,
          "property descriptor unavailable"
        );
      }

      if (
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        return failUnsupported(
          `${path}.${key}`,
          "non-enumerable or accessor properties are not canonical JSON"
        );
      }

      const canonicalValue =
        canonicalizeJsonValue(
          descriptor.value,
          `${path}.${key}`,
          ancestors,
          false
        );

      members.push(
        `${JSON.stringify(key)}:${canonicalValue}`
      );
    }

    return `{${members.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function requireRootObject(
  value: unknown
): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new PlatformCoreCanonicalPayloadHashError(
      "INVALID_ROOT",
      "Platform Core canonical payload hash input must be a plain JSON object."
    );
  }

  return value;
}

export function canonicalizePlatformCorePayloadPreimage(
  value: unknown
): string {
  const root = requireRootObject(value);

  return canonicalizeJsonValue(
    root,
    "$",
    new WeakSet<object>(),
    true
  );
}

export function computePlatformCorePayloadSha256(
  value: unknown
): string {
  const canonical =
    canonicalizePlatformCorePayloadPreimage(
      value
    );

  return createHash("sha256")
    .update(canonical, "utf8")
    .digest("hex");
}

export function verifyPlatformCorePayloadSha256(
  value: unknown
): boolean {
  const root = requireRootObject(value);

  const declared =
    root["payload_sha256"];

  if (
    typeof declared !== "string" ||
    !SHA256_LOWER_HEX_PATTERN.test(
      declared
    )
  ) {
    throw new PlatformCoreCanonicalPayloadHashError(
      "INVALID_PAYLOAD_SHA256",
      "Platform Core payload_sha256 must be exactly 64 lowercase hexadecimal characters."
    );
  }

  const computed =
    computePlatformCorePayloadSha256(
      root
    );

  return computed === declared;
}

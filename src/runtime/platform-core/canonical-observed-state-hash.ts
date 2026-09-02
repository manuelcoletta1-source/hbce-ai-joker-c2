import {
  createHash,
} from "node:crypto";

export const PLATFORM_CORE_CANONICAL_OBSERVED_STATE_HASH_PROFILE =
  "HBCE-PLATFORM-CORE-OBSERVED-STATE-SHA256-v1" as const;

export type PlatformCoreCanonicalObservedStateHashErrorCode =
  | "UNSUPPORTED_VALUE"
  | "CYCLIC_VALUE";

export class PlatformCoreCanonicalObservedStateHashError
  extends Error {
  readonly code:
    PlatformCoreCanonicalObservedStateHashErrorCode;

  constructor(
    code:
      PlatformCoreCanonicalObservedStateHashErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreCanonicalObservedStateHashError";

    this.code =
      code;
  }
}

function failUnsupported(
  path:
    string,
  detail:
    string,
): never {
  throw new PlatformCoreCanonicalObservedStateHashError(
    "UNSUPPORTED_VALUE",
    `Unsupported Platform Core observed-state JSON value at ${path}: ${detail}`,
  );
}

function isPlainObject(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    typeof value !== "object"
    || value === null
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

function canonicalizeObservedStateValue(
  value:
    unknown,
  path:
    string,
  ancestors:
    WeakSet<object>,
): string {
  if (
    value === null
  ) {
    return "null";
  }

  switch (
    typeof value
  ) {
    case "string":
      return JSON.stringify(
        value,
      );

    case "boolean":
      return value
        ? "true"
        : "false";

    case "number":
      if (
        !Number.isFinite(
          value,
        )
      ) {
        return failUnsupported(
          path,
          "number must be finite",
        );
      }

      return JSON.stringify(
        value,
      );

    case "undefined":
      return failUnsupported(
        path,
        "undefined is not canonical JSON",
      );

    case "bigint":
      return failUnsupported(
        path,
        "bigint is not canonical JSON",
      );

    case "function":
      return failUnsupported(
        path,
        "function is not canonical JSON",
      );

    case "symbol":
      return failUnsupported(
        path,
        "symbol is not canonical JSON",
      );
  }

  if (
    typeof value !== "object"
  ) {
    return failUnsupported(
      path,
      `unsupported type ${typeof value}`,
    );
  }

  if (
    ancestors.has(
      value,
    )
  ) {
    throw new PlatformCoreCanonicalObservedStateHashError(
      "CYCLIC_VALUE",
      `Cyclic Platform Core observed-state JSON value at ${path}`,
    );
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    ancestors.add(
      value,
    );

    try {
      const items =
        value.map(
          (
            item,
            index,
          ) =>
            canonicalizeObservedStateValue(
              item,
              `${path}[${index}]`,
              ancestors,
            ),
        );

      return `[${items.join(",")}]`;
    } finally {
      ancestors.delete(
        value,
      );
    }
  }

  if (
    !isPlainObject(
      value,
    )
  ) {
    return failUnsupported(
      path,
      "only plain JSON objects are supported",
    );
  }

  const symbolKeys =
    Object.getOwnPropertySymbols(
      value,
    );

  if (
    symbolKeys.length > 0
  ) {
    return failUnsupported(
      path,
      "symbol object keys are not canonical JSON",
    );
  }

  ancestors.add(
    value,
  );

  try {
    const keys =
      Object.getOwnPropertyNames(
        value,
      ).sort();

    const members:
      string[] = [];

    for (
      const key of keys
    ) {
      const descriptor =
        Object.getOwnPropertyDescriptor(
          value,
          key,
        );

      if (
        !descriptor
      ) {
        return failUnsupported(
          `${path}.${key}`,
          "property descriptor unavailable",
        );
      }

      if (
        !descriptor.enumerable
        || !(
          "value" in descriptor
        )
      ) {
        return failUnsupported(
          `${path}.${key}`,
          "non-enumerable or accessor properties are not canonical JSON",
        );
      }

      const canonicalValue =
        canonicalizeObservedStateValue(
          descriptor.value,
          `${path}.${key}`,
          ancestors,
        );

      members.push(
        `${JSON.stringify(key)}:${canonicalValue}`,
      );
    }

    return `{${members.join(",")}}`;
  } finally {
    ancestors.delete(
      value,
    );
  }
}

/**
 * Produces the canonical UTF-8 preimage for an observed external state.
 *
 * Unlike the canonical Platform Core payload-hash profile, this function
 * never removes a property named "payload_sha256" or any other valid JSON
 * property. Every observed JSON property is state material and therefore
 * hash-significant.
 *
 * This utility does NOT:
 *
 * - execute an action;
 * - read an external system;
 * - create a state reference;
 * - persist observed state;
 * - create observation evidence;
 * - bind state to an EXECUTION;
 * - create a state_after object;
 * - create terminal EXECUTION;
 * - create OUTCOME;
 * - update MATRIX;
 * - trigger FEEDBACK.
 */
export function canonicalizePlatformCoreObservedState(
  value:
    unknown,
): string {
  return canonicalizeObservedStateValue(
    value,
    "$",
    new WeakSet<object>(),
  );
}

export function computePlatformCoreObservedStateSha256(
  value:
    unknown,
): string {
  const canonical =
    canonicalizePlatformCoreObservedState(
      value,
    );

  return createHash(
    "sha256",
  )
    .update(
      canonical,
      "utf8",
    )
    .digest(
      "hex",
    );
}

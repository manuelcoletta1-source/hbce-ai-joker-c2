import {
  createHash,
} from "node:crypto";

import {
  canonicalizePlatformCoreObservedState,
} from "./canonical-observed-state-hash";

export const PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-OBSERVED-STATE-REFERENCE-v1" as const;

export const PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PREFIX =
  "HBCE:STATE:OBSERVED:V1:SHA256:" as const;

const LOWERCASE_SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

const STATE_REFERENCE_PATTERN =
  /^[A-Z0-9_:\-.]+$/;

export type PlatformCoreCanonicalObservedStateReference =
  Readonly<{
    canonicalStateUtf8:
      string;

    stateSha256:
      string;

    stateRef:
      string;
  }>;

export type PlatformCoreCanonicalObservedStateReferenceErrorCode =
  | "INTERNAL_HASH_INVARIANT"
  | "INTERNAL_REFERENCE_INVARIANT";

export class PlatformCoreCanonicalObservedStateReferenceError
  extends Error {
  readonly code:
    PlatformCoreCanonicalObservedStateReferenceErrorCode;

  constructor(
    code:
      PlatformCoreCanonicalObservedStateReferenceErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreCanonicalObservedStateReferenceError";

    this.code =
      code;
  }
}

function failClosed(
  code:
    PlatformCoreCanonicalObservedStateReferenceErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreCanonicalObservedStateReferenceError(
    code,
    message,
  );
}

/**
 * Derives the immutable Platform Core content address for an observed state.
 *
 * The caller provides the observed state itself.
 *
 * This function deliberately does NOT accept caller-supplied stateSha256 or
 * stateRef values. It canonicalizes the observed state, recomputes its
 * canonical observed-state SHA-256, and derives the state reference from that
 * recomputed digest.
 *
 * Therefore:
 *
 * - stateSha256 commits to canonicalStateUtf8;
 * - stateRef is deterministically derived from stateSha256;
 * - identical canonical observed states reuse the same stateRef;
 * - distinct observation events may still have distinct evidenceReference
 *   values outside this utility.
 *
 * This utility does NOT:
 *
 * - execute an action;
 * - read an external system;
 * - persist canonicalStateUtf8;
 * - create an observation event;
 * - create observation evidence;
 * - create evidenceReference;
 * - bind an observation to canonical EXECUTION;
 * - create state_after;
 * - perform terminal recovery;
 * - consume authorization;
 * - create OUTCOME;
 * - update MATRIX;
 * - trigger FEEDBACK.
 */
export function derivePlatformCoreCanonicalObservedStateReference(
  observedState:
    unknown,
): PlatformCoreCanonicalObservedStateReference {
  const canonicalStateUtf8 =
    canonicalizePlatformCoreObservedState(
      observedState,
    );

  const stateSha256 =
    createHash(
      "sha256",
    )
      .update(
        canonicalStateUtf8,
        "utf8",
      )
      .digest(
        "hex",
      );

  if (
    !LOWERCASE_SHA256_PATTERN.test(
      stateSha256,
    )
  ) {
    return failClosed(
      "INTERNAL_HASH_INVARIANT",
      "Canonical observed-state SHA-256 must be lowercase 64-hex.",
    );
  }

  const stateRef =
    `${PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PREFIX}${stateSha256.toUpperCase()}`;

  if (
    stateRef.length < 3
    || stateRef.length > 160
    || !STATE_REFERENCE_PATTERN.test(
      stateRef,
    )
  ) {
    return failClosed(
      "INTERNAL_REFERENCE_INVARIANT",
      "Derived canonical observed-state reference violates Platform Core reference syntax.",
    );
  }

  return Object.freeze({
    canonicalStateUtf8,
    stateSha256,
    stateRef,
  });
}

import {
  createHash,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLATFORM_CORE_CANONICAL_OBSERVED_STATE_HASH_PROFILE,
  PlatformCoreCanonicalObservedStateHashError,
  canonicalizePlatformCoreObservedState,
  computePlatformCoreObservedStateSha256,
} from "./canonical-observed-state-hash";

function expectObservedStateHashFailure(
  value:
    unknown,
  code:
    string,
): void {
  try {
    canonicalizePlatformCoreObservedState(
      value,
    );

    throw new Error(
      "expected canonical observed-state hash failure",
    );
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreCanonicalObservedStateHashError,
    );

    expect(
      (
        error as
          PlatformCoreCanonicalObservedStateHashError
      ).code,
    ).toBe(
      code,
    );
  }
}

describe(
  "Platform Core canonical observed-state hash",
  () => {
    it(
      "locks the observed-state hash profile identity",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_OBSERVED_STATE_HASH_PROFILE,
        ).toBe(
          "HBCE-PLATFORM-CORE-OBSERVED-STATE-SHA256-v1",
        );
      },
    );

    it(
      "canonicalizes object keys lexicographically",
      () => {
        expect(
          canonicalizePlatformCoreObservedState({
            b:
              2,

            a:
              1,
          }),
        ).toBe(
          '{"a":1,"b":2}',
        );
      },
    );

    it(
      "canonicalizes nested objects while preserving array structure",
      () => {
        expect(
          canonicalizePlatformCoreObservedState({
            z: [
              {
                b:
                  2,

                a:
                  1,
              },

              null,
            ],

            a: {
              y:
                true,

              x:
                "value",
            },
          }),
        ).toBe(
          '{"a":{"x":"value","y":true},"z":[{"a":1,"b":2},null]}',
        );
      },
    );

    it(
      "preserves array order as canonical state material",
      () => {
        expect(
          canonicalizePlatformCoreObservedState([
            "b",
            "a",
            2,
            1,
          ]),
        ).toBe(
          '["b","a",2,1]',
        );
      },
    );

    it(
      "keeps payload_sha256 as hash-significant observed state",
      () => {
        const canonical =
          canonicalizePlatformCoreObservedState({
            payload_sha256:
              "observed-value",

            value:
              1,
          });

        expect(
          canonical,
        ).toBe(
          '{"payload_sha256":"observed-value","value":1}',
        );

        expect(
          computePlatformCoreObservedStateSha256({
            payload_sha256:
              "observed-value",

            value:
              1,
          }),
        ).not.toBe(
          computePlatformCoreObservedStateSha256({
            value:
              1,
          }),
        );
      },
    );

    it(
      "produces the same digest for equivalent object insertion orders",
      () => {
        const left = {
          alpha:
            1,

          beta:
            2,

          nested: {
            z:
              false,

            a:
              true,
          },
        };

        const right = {
          nested: {
            a:
              true,

            z:
              false,
          },

          beta:
            2,

          alpha:
            1,
        };

        expect(
          computePlatformCoreObservedStateSha256(
            left,
          ),
        ).toBe(
          computePlatformCoreObservedStateSha256(
            right,
          ),
        );
      },
    );

    it(
      "treats array order as digest-significant",
      () => {
        expect(
          computePlatformCoreObservedStateSha256({
            sequence: [
              1,
              2,
              3,
            ],
          }),
        ).not.toBe(
          computePlatformCoreObservedStateSha256({
            sequence: [
              3,
              2,
              1,
            ],
          }),
        );
      },
    );

    it(
      "computes SHA-256 over the exact canonical UTF-8 preimage",
      () => {
        const value = {
          payload_sha256:
            "kept",

          a:
            1,
        };

        const expectedCanonical =
          '{"a":1,"payload_sha256":"kept"}';

        const expectedDigest =
          createHash(
            "sha256",
          )
            .update(
              expectedCanonical,
              "utf8",
            )
            .digest(
              "hex",
            );

        expect(
          canonicalizePlatformCoreObservedState(
            value,
          ),
        ).toBe(
          expectedCanonical,
        );

        expect(
          computePlatformCoreObservedStateSha256(
            value,
          ),
        ).toBe(
          expectedDigest,
        );
      },
    );

    it(
      "supports valid JSON primitive and array roots",
      () => {
        expect(
          canonicalizePlatformCoreObservedState(
            null,
          ),
        ).toBe(
          "null",
        );

        expect(
          canonicalizePlatformCoreObservedState(
            true,
          ),
        ).toBe(
          "true",
        );

        expect(
          canonicalizePlatformCoreObservedState(
            42,
          ),
        ).toBe(
          "42",
        );

        expect(
          canonicalizePlatformCoreObservedState(
            "state",
          ),
        ).toBe(
          '"state"',
        );

        expect(
          canonicalizePlatformCoreObservedState([
            1,
            "two",
            false,
          ]),
        ).toBe(
          '[1,"two",false]',
        );
      },
    );

    it(
      "rejects undefined",
      () => {
        expectObservedStateHashFailure(
          undefined,
          "UNSUPPORTED_VALUE",
        );

        expectObservedStateHashFailure(
          {
            value:
              undefined,
          },
          "UNSUPPORTED_VALUE",
        );
      },
    );

    it(
      "rejects non-finite numbers",
      () => {
        expectObservedStateHashFailure(
          Number.NaN,
          "UNSUPPORTED_VALUE",
        );

        expectObservedStateHashFailure(
          Number.POSITIVE_INFINITY,
          "UNSUPPORTED_VALUE",
        );

        expectObservedStateHashFailure(
          Number.NEGATIVE_INFINITY,
          "UNSUPPORTED_VALUE",
        );
      },
    );

    it(
      "rejects bigint, function and symbol values",
      () => {
        expectObservedStateHashFailure(
          BigInt(
            1,
          ),
          "UNSUPPORTED_VALUE",
        );

        expectObservedStateHashFailure(
          () =>
            "not-json",
          "UNSUPPORTED_VALUE",
        );

        expectObservedStateHashFailure(
          Symbol(
            "not-json",
          ),
          "UNSUPPORTED_VALUE",
        );
      },
    );

    it(
      "rejects non-plain object instances",
      () => {
        expectObservedStateHashFailure(
          new Date(
            "2026-09-02T00:00:00.000Z",
          ),
          "UNSUPPORTED_VALUE",
        );
      },
    );

    it(
      "rejects cyclic state structures",
      () => {
        const cyclic:
          Record<string, unknown> = {
            value:
              1,
          };

        cyclic.self =
          cyclic;

        expectObservedStateHashFailure(
          cyclic,
          "CYCLIC_VALUE",
        );
      },
    );

    it(
      "rejects accessors, non-enumerable properties and symbol keys",
      () => {
        const accessor:
          Record<string, unknown> = {};

        Object.defineProperty(
          accessor,
          "value",
          {
            enumerable:
              true,

            get:
              () =>
                1,
          },
        );

        expectObservedStateHashFailure(
          accessor,
          "UNSUPPORTED_VALUE",
        );

        const nonEnumerable:
          Record<string, unknown> = {};

        Object.defineProperty(
          nonEnumerable,
          "hidden",
          {
            enumerable:
              false,

            value:
              1,
          },
        );

        expectObservedStateHashFailure(
          nonEnumerable,
          "UNSUPPORTED_VALUE",
        );

        const symbolKey:
          Record<string, unknown> = {
            visible:
              1,
          };

        Object.defineProperty(
          symbolKey,
          Symbol(
            "hidden",
          ),
          {
            enumerable:
              true,

            value:
              2,
          },
        );

        expectObservedStateHashFailure(
          symbolKey,
          "UNSUPPORTED_VALUE",
        );
      },
    );
  },
);

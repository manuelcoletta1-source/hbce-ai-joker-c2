import {
  createHash,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PREFIX,
  PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PROTOCOL,
  derivePlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

describe(
  "Platform Core canonical observed-state reference",
  () => {
    it(
      "locks protocol identity",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-CANONICAL-OBSERVED-STATE-REFERENCE-v1",
        );
      },
    );

    it(
      "locks immutable content-address prefix",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PREFIX,
        ).toBe(
          "HBCE:STATE:OBSERVED:V1:SHA256:",
        );
      },
    );

    it(
      "derives exact canonical UTF-8, SHA-256 and state reference",
      () => {
        const result =
          derivePlatformCoreCanonicalObservedStateReference({
            z:
              2,

            a:
              1,
          });

        const canonical =
          '{"a":1,"z":2}';

        const sha256 =
          createHash(
            "sha256",
          )
            .update(
              canonical,
              "utf8",
            )
            .digest(
              "hex",
            );

        expect(
          result.canonicalStateUtf8,
        ).toBe(
          canonical,
        );

        expect(
          result.stateSha256,
        ).toBe(
          sha256,
        );

        expect(
          result.stateRef,
        ).toBe(
          `HBCE:STATE:OBSERVED:V1:SHA256:${sha256.toUpperCase()}`,
        );
      },
    );

    it(
      "binds stateSha256 to the exact returned canonicalStateUtf8",
      () => {
        const result =
          derivePlatformCoreCanonicalObservedStateReference({
            nested: {
              b:
                false,

              a:
                true,
            },

            sequence: [
              3,
              2,
              1,
            ],
          });

        const digestFromReturnedBytes =
          createHash(
            "sha256",
          )
            .update(
              result.canonicalStateUtf8,
              "utf8",
            )
            .digest(
              "hex",
            );

        expect(
          result.stateSha256,
        ).toBe(
          digestFromReturnedBytes,
        );
      },
    );

    it(
      "canonicalizes the observed state only once",
      () => {
        const target = {
          value:
            42,
        };

        let valueDescriptorReads =
          0;

        const observedState =
          new Proxy(
            target,
            {
              getOwnPropertyDescriptor(
                object,
                property,
              ) {
                if (
                  property === "value"
                ) {
                  valueDescriptorReads +=
                    1;

                  if (
                    valueDescriptorReads > 1
                  ) {
                    throw new Error(
                      "observed state was canonicalized more than once",
                    );
                  }
                }

                return Reflect.getOwnPropertyDescriptor(
                  object,
                  property,
                );
              },
            },
          );

        const result =
          derivePlatformCoreCanonicalObservedStateReference(
            observedState,
          );

        expect(
          result.canonicalStateUtf8,
        ).toBe(
          '{"value":42}',
        );

        expect(
          valueDescriptorReads,
        ).toBe(
          1,
        );
      },
    );

    it(
      "reuses the same reference for identical canonical states",
      () => {
        const left =
          derivePlatformCoreCanonicalObservedStateReference({
            alpha:
              1,

            beta:
              2,
          });

        const right =
          derivePlatformCoreCanonicalObservedStateReference({
            beta:
              2,

            alpha:
              1,
          });

        expect(
          left.canonicalStateUtf8,
        ).toBe(
          right.canonicalStateUtf8,
        );

        expect(
          left.stateSha256,
        ).toBe(
          right.stateSha256,
        );

        expect(
          left.stateRef,
        ).toBe(
          right.stateRef,
        );
      },
    );

    it(
      "produces distinct references for distinct canonical states",
      () => {
        const left =
          derivePlatformCoreCanonicalObservedStateReference({
            value:
              1,
          });

        const right =
          derivePlatformCoreCanonicalObservedStateReference({
            value:
              2,
          });

        expect(
          left.stateSha256,
        ).not.toBe(
          right.stateSha256,
        );

        expect(
          left.stateRef,
        ).not.toBe(
          right.stateRef,
        );
      },
    );

    it(
      "preserves array order as state-significant material",
      () => {
        const left =
          derivePlatformCoreCanonicalObservedStateReference({
            sequence: [
              1,
              2,
              3,
            ],
          });

        const right =
          derivePlatformCoreCanonicalObservedStateReference({
            sequence: [
              3,
              2,
              1,
            ],
          });

        expect(
          left.stateRef,
        ).not.toBe(
          right.stateRef,
        );
      },
    );

    it(
      "keeps payload_sha256 as state-significant material",
      () => {
        const withObservedField =
          derivePlatformCoreCanonicalObservedStateReference({
            payload_sha256:
              "observed-value",

            value:
              1,
          });

        const withoutObservedField =
          derivePlatformCoreCanonicalObservedStateReference({
            value:
              1,
          });

        expect(
          withObservedField.canonicalStateUtf8,
        ).toContain(
          '"payload_sha256":"observed-value"',
        );

        expect(
          withObservedField.stateRef,
        ).not.toBe(
          withoutObservedField.stateRef,
        );
      },
    );

    it(
      "returns lowercase stateSha256 and uppercase digest material in stateRef",
      () => {
        const result =
          derivePlatformCoreCanonicalObservedStateReference({
            value:
              "case-check",
          });

        expect(
          result.stateSha256,
        ).toMatch(
          /^[0-9a-f]{64}$/,
        );

        const refDigest =
          result.stateRef.slice(
            PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PREFIX.length,
          );

        expect(
          refDigest,
        ).toMatch(
          /^[0-9A-F]{64}$/,
        );

        expect(
          refDigest.toLowerCase(),
        ).toBe(
          result.stateSha256,
        );
      },
    );

    it(
      "produces a Platform Core-compatible immutable reference syntax",
      () => {
        const result =
          derivePlatformCoreCanonicalObservedStateReference({
            value:
              "reference-check",
          });

        expect(
          result.stateRef,
        ).toMatch(
          /^[A-Z0-9_:\-.]+$/,
        );

        expect(
          result.stateRef.length,
        ).toBe(
          94,
        );

        expect(
          result.stateRef.startsWith(
            PLATFORM_CORE_CANONICAL_OBSERVED_STATE_REFERENCE_PREFIX,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "returns a frozen result",
      () => {
        const result =
          derivePlatformCoreCanonicalObservedStateReference({
            value:
              1,
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
      "does not mutate the observed input",
      () => {
        const observedState = {
          z:
            2,

          nested: {
            b:
              false,

            a:
              true,
          },

          sequence: [
            3,
            2,
            1,
          ],
        };

        const before =
          JSON.stringify(
            observedState,
          );

        derivePlatformCoreCanonicalObservedStateReference(
          observedState,
        );

        expect(
          JSON.stringify(
            observedState,
          ),
        ).toBe(
          before,
        );
      },
    );

    it(
      "supports canonical JSON primitive and array roots",
      () => {
        expect(
          derivePlatformCoreCanonicalObservedStateReference(
            null,
          ).canonicalStateUtf8,
        ).toBe(
          "null",
        );

        expect(
          derivePlatformCoreCanonicalObservedStateReference(
            true,
          ).canonicalStateUtf8,
        ).toBe(
          "true",
        );

        expect(
          derivePlatformCoreCanonicalObservedStateReference(
            42,
          ).canonicalStateUtf8,
        ).toBe(
          "42",
        );

        expect(
          derivePlatformCoreCanonicalObservedStateReference([
            1,
            "two",
            false,
          ]).canonicalStateUtf8,
        ).toBe(
          '[1,"two",false]',
        );
      },
    );

    it(
      "fails closed when the observed state is not canonical JSON",
      () => {
        expect(
          () =>
            derivePlatformCoreCanonicalObservedStateReference(
              undefined,
            ),
        ).toThrow();

        const cyclic:
          Record<string, unknown> = {
            value:
              1,
          };

        cyclic.self =
          cyclic;

        expect(
          () =>
            derivePlatformCoreCanonicalObservedStateReference(
              cyclic,
            ),
        ).toThrow();

        expect(
          () =>
            derivePlatformCoreCanonicalObservedStateReference(
              Number.POSITIVE_INFINITY,
            ),
        ).toThrow();
      },
    );
  },
);

import { createHash } from "crypto";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  PLATFORM_CORE_CANONICAL_PAYLOAD_HASH_PROFILE,
  PlatformCoreCanonicalPayloadHashError,
  canonicalizePlatformCorePayloadPreimage,
  computePlatformCorePayloadSha256,
  verifyPlatformCorePayloadSha256
} from "./canonical-payload-hash";

describe(
  "Platform Core canonical payload hash",
  () => {
    it(
      "locks the canonical profile identity",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_PAYLOAD_HASH_PROFILE
        ).toBe(
          "HBCE-PLATFORM-CORE-PAYLOAD-SHA256-v1"
        );
      }
    );

    it(
      "omits only the root payload_sha256 and recursively orders object keys",
      () => {
        const value = {
          z: 3,
          payload_sha256:
            "f".repeat(64),
          nested: {
            payload_sha256:
              "nested-value",
            k: "v"
          },
          arr: [
            {
              y: 2,
              x: 1
            },
            3,
            2,
            1
          ],
          a: {
            b: 2,
            a: 1
          }
        };

        const canonical =
          canonicalizePlatformCorePayloadPreimage(
            value
          );

        expect(canonical).toBe(
          '{"a":{"a":1,"b":2},"arr":[{"x":1,"y":2},3,2,1],"nested":{"k":"v","payload_sha256":"nested-value"},"z":3}'
        );

        expect(
          canonical.includes(
            '"payload_sha256":"nested-value"'
          )
        ).toBe(true);

        expect(
          canonical.includes(
            `"${"f".repeat(64)}"`
          )
        ).toBe(false);
      }
    );

    it(
      "does not mutate the caller object",
      () => {
        const value = {
          payload_sha256:
            "a".repeat(64),
          b: {
            z: 2,
            a: 1
          },
          a: [
            3,
            2,
            1
          ]
        };

        const before =
          JSON.stringify(value);

        computePlatformCorePayloadSha256(
          value
        );

        expect(
          JSON.stringify(value)
        ).toBe(before);

        expect(
          value.payload_sha256
        ).toBe(
          "a".repeat(64)
        );
      }
    );

    it(
      "treats object key order as insignificant",
      () => {
        const left = {
          z: 2,
          a: 1
        };

        const right = {
          a: 1,
          z: 2
        };

        expect(
          computePlatformCorePayloadSha256(
            left
          )
        ).toBe(
          computePlatformCorePayloadSha256(
            right
          )
        );
      }
    );

    it(
      "preserves array order as hash-significant",
      () => {
        const left = {
          values: [
            "A",
            "B"
          ]
        };

        const right = {
          values: [
            "B",
            "A"
          ]
        };

        expect(
          computePlatformCorePayloadSha256(
            left
          )
        ).not.toBe(
          computePlatformCorePayloadSha256(
            right
          )
        );
      }
    );

    it(
      "produces the exact SHA-256 of UTF-8 canonical JSON without prefix",
      () => {
        const value = {
          z: 2,
          a: 1
        };

        const canonical =
          '{"a":1,"z":2}';

        const expected =
          createHash("sha256")
            .update(
              canonical,
              "utf8"
            )
            .digest("hex");

        const actual =
          computePlatformCorePayloadSha256(
            value
          );

        expect(actual).toBe(expected);

        expect(actual).toMatch(
          /^[a-f0-9]{64}$/
        );

        expect(
          actual.startsWith(
            "sha256:"
          )
        ).toBe(false);
      }
    );

    it(
      "computes the same digest before and after payload_sha256 assignment",
      () => {
        const preimage = {
          authorization_id:
            "AZN-TEST:D119",
          authorization_version:
            1
        };

        const digest =
          computePlatformCorePayloadSha256(
            preimage
          );

        const finalObject = {
          ...preimage,
          payload_sha256:
            digest
        };

        expect(
          computePlatformCorePayloadSha256(
            finalObject
          )
        ).toBe(digest);

        expect(
          verifyPlatformCorePayloadSha256(
            finalObject
          )
        ).toBe(true);
      }
    );

    it(
      "fails exact verification after payload mutation",
      () => {
        const original = {
          authorization_id:
            "AZN-TEST:D119",
          state:
            "AUTHORIZED"
        };

        const digest =
          computePlatformCorePayloadSha256(
            original
          );

        const tampered = {
          ...original,
          state: "REVOKED",
          payload_sha256:
            digest
        };

        expect(
          verifyPlatformCorePayloadSha256(
            tampered
          )
        ).toBe(false);
      }
    );

    it(
      "keeps nested payload_sha256 hash-significant",
      () => {
        const left = {
          nested: {
            payload_sha256:
              "A"
          }
        };

        const right = {
          nested: {
            payload_sha256:
              "B"
          }
        };

        expect(
          computePlatformCorePayloadSha256(
            left
          )
        ).not.toBe(
          computePlatformCorePayloadSha256(
            right
          )
        );
      }
    );

    it(
      "rejects missing or malformed declared payload hashes during verification",
      () => {
        expect(() =>
          verifyPlatformCorePayloadSha256({
            a: 1
          })
        ).toThrow(
          PlatformCoreCanonicalPayloadHashError
        );

        expect(() =>
          verifyPlatformCorePayloadSha256({
            a: 1,
            payload_sha256:
              "sha256:" +
              "a".repeat(64)
          })
        ).toThrow(
          PlatformCoreCanonicalPayloadHashError
        );

        expect(() =>
          verifyPlatformCorePayloadSha256({
            a: 1,
            payload_sha256:
              "A".repeat(64)
          })
        ).toThrow(
          PlatformCoreCanonicalPayloadHashError
        );
      }
    );

    it(
      "rejects unsupported and ambiguous non-JSON runtime values",
      () => {
        const cyclic:
          Record<string, unknown> =
          {};

        cyclic.self = cyclic;

        class CustomValue {
          readonly value = 1;
        }

        const invalidValues: unknown[] = [
          {
            x: undefined
          },
          {
            x: BigInt(1)
          },
          {
            x: () => 1
          },
          {
            x: Symbol("x")
          },
          {
            x: Number.NaN
          },
          {
            x: Number.POSITIVE_INFINITY
          },
          {
            x: new Date(
              "2026-01-01T00:00:00.000Z"
            )
          },
          {
            x: new Error("x")
          },
          {
            x: new CustomValue()
          },
          cyclic
        ];

        for (
          const value of invalidValues
        ) {
          expect(() =>
            computePlatformCorePayloadSha256(
              value
            )
          ).toThrow(
            PlatformCoreCanonicalPayloadHashError
          );
        }
      }
    );

    it(
      "rejects non-object roots",
      () => {
        const invalidRoots:
          unknown[] = [
            null,
            true,
            1,
            "x",
            [
              1,
              2
            ]
          ];

        for (
          const value of invalidRoots
        ) {
          expect(() =>
            computePlatformCorePayloadSha256(
              value
            )
          ).toThrow(
            PlatformCoreCanonicalPayloadHashError
          );
        }
      }
    );
  }
);

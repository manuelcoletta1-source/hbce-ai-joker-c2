import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "./authority-repository",
  () => ({
    readPlatformCoreCanonicalAuthority:
      vi.fn(),
  }),
);

vi.mock(
  "./production-authority-usability-policy",
  () => ({
    evaluatePlatformCoreProductionAuthorityUsability:
      vi.fn(),
  }),
);

import type {
  PlatformCoreCanonicalAuthority,
} from "./canonical-authority-builder";

import type {
  PlatformCoreCanonicalAuthorization,
} from "./canonical-authorization-builder";

import {
  readPlatformCoreCanonicalAuthority,
} from "./authority-repository";

import {
  evaluatePlatformCoreProductionAuthorityUsability,
  type PlatformCoreProductionAuthorityUsabilityResult,
} from "./production-authority-usability-policy";

import {
  PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,
  resolvePlatformCoreProductionAuthorizationAuthority,
} from "./production-authorization-authority-resolver";

const AUTHORITY_REF =
  "AUT:RESOLVER:TEST";

const AUTHORITY_VERSION =
  7;

function authorization():
  PlatformCoreCanonicalAuthorization {
  return Object.freeze({
    authority_ref:
      AUTHORITY_REF,

    authority_version:
      AUTHORITY_VERSION,
  }) as unknown as
    PlatformCoreCanonicalAuthorization;
}

function authority():
  PlatformCoreCanonicalAuthority {
  return Object.freeze({
    authority_id:
      AUTHORITY_REF,

    authority_version:
      AUTHORITY_VERSION,

    payload_sha256:
      "a".repeat(
        64,
      ),

    state:
      "ACTIVE",
  }) as unknown as
    PlatformCoreCanonicalAuthority;
}

function usability(
  usable:
    boolean,
): PlatformCoreProductionAuthorityUsabilityResult {
  return Object.freeze({
    protocol:
      "HBCE-PLATFORM-CORE-PRODUCTION-AUTHORITY-USABILITY-POLICY-v1",

    usable,

    state:
      usable
        ? "PASS"
        : "FAIL",

    code:
      usable
        ? "AUTHORITY_USABLE"
        : "AUTHORITY_STATE_NOT_USABLE",
  });
}

describe(
  "resolvePlatformCoreProductionAuthorizationAuthority",
  () => {
    beforeEach(
      () => {
        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockReset();

        vi.mocked(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).mockReset();
      },
    );

    it(
      "R2AW01 reads exact durable Authority coordinates and forwards exact objects to policy",
      async () => {
        const exactAuthorization =
          authorization();

        const exactAuthority =
          authority();

        const exactUsability =
          usability(
            true,
          );

        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          exactAuthority,
        );

        vi.mocked(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).mockReturnValueOnce(
          exactUsability,
        );

        const result =
          await resolvePlatformCoreProductionAuthorizationAuthority(
            exactAuthorization,
          );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).toHaveBeenCalledWith(
          AUTHORITY_REF,
          AUTHORITY_VERSION,
        );

        expect(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).toHaveBeenCalledWith(
          exactAuthority,
          exactAuthorization,
        );

        expect(
          result.authority,
        ).toBe(
          exactAuthority,
        );

        expect(
          result.usability,
        ).toBe(
          exactUsability,
        );
      },
    );

    it(
      "R2AW02 returns frozen NOT_FOUND and does not call policy when durable Authority is absent",
      async () => {
        const exactAuthorization =
          authorization();

        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          null,
        );

        const result =
          await resolvePlatformCoreProductionAuthorizationAuthority(
            exactAuthorization,
          );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          protocol:
            PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,

          kind:
            "NOT_FOUND",

          authority:
            null,

          usability:
            null,
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
      "R2AW03 returns frozen NOT_USABLE preserving exact Authority and policy result identity",
      async () => {
        const exactAuthorization =
          authorization();

        const exactAuthority =
          authority();

        const exactUsability =
          usability(
            false,
          );

        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          exactAuthority,
        );

        vi.mocked(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).mockReturnValueOnce(
          exactUsability,
        );

        const result =
          await resolvePlatformCoreProductionAuthorizationAuthority(
            exactAuthorization,
          );

        expect(
          result.kind,
        ).toBe(
          "NOT_USABLE",
        );

        expect(
          result.protocol,
        ).toBe(
          PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,
        );

        expect(
          result.authority,
        ).toBe(
          exactAuthority,
        );

        expect(
          result.usability,
        ).toBe(
          exactUsability,
        );

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
      "R2AW04 returns frozen RESOLVED preserving exact Authority and policy result identity",
      async () => {
        const exactAuthorization =
          authorization();

        const exactAuthority =
          authority();

        const exactUsability =
          usability(
            true,
          );

        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          exactAuthority,
        );

        vi.mocked(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).mockReturnValueOnce(
          exactUsability,
        );

        const result =
          await resolvePlatformCoreProductionAuthorizationAuthority(
            exactAuthorization,
          );

        expect(
          result.kind,
        ).toBe(
          "RESOLVED",
        );

        expect(
          result.protocol,
        ).toBe(
          PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,
        );

        expect(
          result.authority,
        ).toBe(
          exactAuthority,
        );

        expect(
          result.usability,
        ).toBe(
          exactUsability,
        );

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
      "R2AW05 propagates repository failure unchanged and does not call policy",
      async () => {
        const exactAuthorization =
          authorization();

        const repositoryError =
          new Error(
            "AUTHORITY_REPOSITORY_FAILURE",
          );

        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockRejectedValueOnce(
          repositoryError,
        );

        await expect(
          resolvePlatformCoreProductionAuthorizationAuthority(
            exactAuthorization,
          ),
        ).rejects.toBe(
          repositoryError,
        );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          evaluatePlatformCoreProductionAuthorityUsability,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

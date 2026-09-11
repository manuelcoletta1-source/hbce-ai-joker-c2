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

export const PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL =
  "HBCE-PLATFORM-CORE-PRODUCTION-AUTHORIZATION-AUTHORITY-RESOLVER-v1" as const;

export type PlatformCoreProductionAuthorizationAuthorityResolutionResult =
  | Readonly<{
      protocol:
        typeof PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL;

      kind:
        "NOT_FOUND";

      authority:
        null;

      usability:
        null;
    }>
  | Readonly<{
      protocol:
        typeof PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL;

      kind:
        "NOT_USABLE";

      authority:
        PlatformCoreCanonicalAuthority;

      usability:
        PlatformCoreProductionAuthorityUsabilityResult;
    }>
  | Readonly<{
      protocol:
        typeof PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL;

      kind:
        "RESOLVED";

      authority:
        PlatformCoreCanonicalAuthority;

      usability:
        PlatformCoreProductionAuthorityUsabilityResult;
    }>;

export async function resolvePlatformCoreProductionAuthorizationAuthority(
  authorization:
    PlatformCoreCanonicalAuthorization,
): Promise<
  PlatformCoreProductionAuthorizationAuthorityResolutionResult
> {
  const authority =
    await readPlatformCoreCanonicalAuthority(
      authorization.authority_ref,
      authorization.authority_version,
    );

  if (
    authority ===
      null
  ) {
    return Object.freeze({
      protocol:
        PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,

      kind:
        "NOT_FOUND",

      authority:
        null,

      usability:
        null,
    });
  }

  const usability =
    evaluatePlatformCoreProductionAuthorityUsability(
      authority,
      authorization,
    );

  if (
    !usability.usable
  ) {
    return Object.freeze({
      protocol:
        PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,

      kind:
        "NOT_USABLE",

      authority,

      usability,
    });
  }

  return Object.freeze({
    protocol:
      PLATFORM_CORE_PRODUCTION_AUTHORIZATION_AUTHORITY_RESOLVER_PROTOCOL,

    kind:
      "RESOLVED",

    authority,

    usability,
  });
}

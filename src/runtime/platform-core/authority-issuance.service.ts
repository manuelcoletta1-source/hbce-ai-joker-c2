import {
  buildPlatformCoreCanonicalAuthorityGenesis,
  type PlatformCoreCanonicalAuthorityGenesisInput,
} from "./canonical-authority-builder";

import {
  persistPlatformCoreCanonicalAuthority,
  type PlatformCoreAuthorityPersistence,
} from "./authority-repository";

export async function issuePlatformCoreCanonicalAuthorityGenesis(
  input:
    PlatformCoreCanonicalAuthorityGenesisInput,
): Promise<PlatformCoreAuthorityPersistence> {
  const canonicalAuthority =
    buildPlatformCoreCanonicalAuthorityGenesis(
      input,
    );

  return persistPlatformCoreCanonicalAuthority(
    canonicalAuthority,
  );
}

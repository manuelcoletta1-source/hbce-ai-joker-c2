import type {
  PlatformCoreEvidenceSetReferenceResolutionPort,
} from "./evidence-set-repository";

import {
  readPlatformCoreCanonicalAuthority,
} from "./authority-repository";

import {
  resolvePlatformCoreEvidenceSetOwnerBinding,
} from "./evidence-set-owner-binding-resolver";

import {
  readPlatformCoreTypedReferenceRegistration,
} from "./typed-reference-registry-repository";

export type PlatformCoreProductionEvidenceSetReferenceResolverInput =
  Readonly<{
    authenticatedHumanIpr:
      unknown;

    authenticatedIdentityBinding:
      unknown;
  }>;

export function createPlatformCoreProductionEvidenceSetReferenceResolver(
  input:
    PlatformCoreProductionEvidenceSetReferenceResolverInput,
): PlatformCoreEvidenceSetReferenceResolutionPort {
  const authenticatedHumanIpr =
    input.authenticatedHumanIpr;

  const authenticatedIdentityBinding =
    input.authenticatedIdentityBinding;

  const resolver:
    PlatformCoreEvidenceSetReferenceResolutionPort =
      Object.freeze({
        async resolveAuthority(
          authorityInput,
        ) {
          const authority =
            await readPlatformCoreCanonicalAuthority(
              authorityInput.authorityRef,
              authorityInput.authorityVersion,
            );

          if (
            authority ===
              null
          ) {
            return false;
          }

          return (
            authority.authority_id ===
              authorityInput.authorityRef
            && authority.authority_version ===
              authorityInput.authorityVersion
            && authority.payload_sha256 ===
              authorityInput.authoritySha256
          );
        },

        async resolveOwnerSubject(
          ownerInput,
        ) {
          const binding =
            await resolvePlatformCoreEvidenceSetOwnerBinding(
              Object.freeze({
                authenticatedHumanIpr,
                authenticatedIdentityBinding,
                canonicalOwnerSubjectRef:
                  ownerInput.ownerSubjectRef,
              }),
            );

          return (
            binding.kind ===
              "MATCH"
          );
        },

        async resolveReference(
          referenceInput,
        ) {
          const registration =
            await readPlatformCoreTypedReferenceRegistration(
              referenceInput.referenceType,
              referenceInput.reference,
            );

          return (
            registration !==
              null
          );
        },
      });

  return resolver;
}

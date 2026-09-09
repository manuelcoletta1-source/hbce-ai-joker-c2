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
  "./evidence-set-owner-binding-resolver",
  () => ({
    resolvePlatformCoreEvidenceSetOwnerBinding:
      vi.fn(),
  }),
);

vi.mock(
  "./typed-reference-registry-repository",
  () => ({
    readPlatformCoreTypedReferenceRegistration:
      vi.fn(),
  }),
);

import {
  readPlatformCoreCanonicalAuthority,
} from "./authority-repository";

import {
  resolvePlatformCoreEvidenceSetOwnerBinding,
} from "./evidence-set-owner-binding-resolver";

import {
  createPlatformCoreProductionEvidenceSetReferenceResolver,
} from "./production-evidence-set-reference-resolver";

import {
  readPlatformCoreTypedReferenceRegistration,
} from "./typed-reference-registry-repository";

const AUTHENTICATED_HUMAN_IPR =
  "IPR-TEST-HUMAN";

const AUTHENTICATED_IDENTITY_BINDING =
  "IPR_VERIFIED_BIOLOGICAL_SUBJECT";

const AUTHORITY_REF =
  "AUT:TEST:AUTHORITY";

const AUTHORITY_VERSION =
  7;

const AUTHORITY_SHA256 =
  "a".repeat(
    64,
  );

const REFERENCE_TYPE =
  "CONTROL" as const;

const REFERENCE =
  "CONTROL:BRIDGE-RESTART-IDENTITY";

function canonicalAuthority(
  overrides:
    Readonly<
      Partial<{
        authority_id:
          string;

        authority_version:
          number;

        payload_sha256:
          string;
      }>
    > =
      {},
): NonNullable<
  Awaited<
    ReturnType<
      typeof readPlatformCoreCanonicalAuthority
    >
  >
> {
  return {
    authority_id:
      AUTHORITY_REF,

    authority_version:
      AUTHORITY_VERSION,

    payload_sha256:
      AUTHORITY_SHA256,

    state:
      "ACTIVE",

    ...overrides,
  } as unknown as NonNullable<
    Awaited<
      ReturnType<
        typeof readPlatformCoreCanonicalAuthority
      >
    >
  >;
}

function ownerBinding(
  kind:
    | "MATCH"
    | "MISMATCH"
    | "UNRESOLVED",
): Awaited<
  ReturnType<
    typeof resolvePlatformCoreEvidenceSetOwnerBinding
  >
> {
  if (
    kind ===
      "MATCH"
  ) {
    return {
      protocol:
        "HBCE-EVIDENCE-OWNER-HUMAN-IPR-EXACT-v1",

      kind:
        "MATCH",

      reason:
        "EXACT_OWNER_MATCH",

      durableSubjectConfirmed:
        true,
    };
  }

  if (
    kind ===
      "MISMATCH"
  ) {
    return {
      protocol:
        "HBCE-EVIDENCE-OWNER-HUMAN-IPR-EXACT-v1",

      kind:
        "MISMATCH",

      reason:
        "EXACT_OWNER_MISMATCH",

      durableSubjectConfirmed:
        true,
    };
  }

  return {
    protocol:
      "HBCE-EVIDENCE-OWNER-HUMAN-IPR-EXACT-v1",

    kind:
      "UNRESOLVED",

    reason:
      "DURABLE_SUBJECT_NOT_FOUND",

    durableSubjectConfirmed:
      false,
  };
}

function typedRegistration():
  NonNullable<
    Awaited<
      ReturnType<
        typeof readPlatformCoreTypedReferenceRegistration
      >
    >
  > {
  return {
    referenceType:
      REFERENCE_TYPE,

    reference:
      REFERENCE,

    backingCommitmentProfile:
      "TEST-COMMITMENT-v1",

    backingCommitmentSha256:
      "b".repeat(
        64,
      ),

    registeredAt:
      "2026-09-08T00:00:00.000Z",
  };
}

function createResolver() {
  return createPlatformCoreProductionEvidenceSetReferenceResolver(
    Object.freeze({
      authenticatedHumanIpr:
        AUTHENTICATED_HUMAN_IPR,

      authenticatedIdentityBinding:
        AUTHENTICATED_IDENTITY_BINDING,
    }),
  );
}

describe(
  "Platform Core production EvidenceSet reference resolver",
  () => {
    beforeEach(
      () => {
        vi.resetAllMocks();
      },
    );

    it(
      "RSL01 factory returns a frozen complete three-method resolution port",
      () => {
        const resolver =
          createResolver();

        expect(
          Object.isFrozen(
            resolver,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.keys(
            resolver,
          ).sort(),
        ).toEqual([
          "resolveAuthority",
          "resolveOwnerSubject",
          "resolveReference",
        ]);

        expect(
          typeof resolver.resolveAuthority,
        ).toBe(
          "function",
        );

        expect(
          typeof resolver.resolveOwnerSubject,
        ).toBe(
          "function",
        );

        expect(
          typeof resolver.resolveReference,
        ).toBe(
          "function",
        );
      },
    );

    it(
      "RSL02 exact Authority id version and payload SHA resolve true",
      async () => {
        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          canonicalAuthority(),
        );

        const resolved =
          await createResolver().resolveAuthority(
            Object.freeze({
              authorityRef:
                AUTHORITY_REF,

              authorityVersion:
                AUTHORITY_VERSION,

              authoritySha256:
                AUTHORITY_SHA256,
            }),
          );

        expect(
          resolved,
        ).toBe(
          true,
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
      },
    );

    it(
      "RSL03 missing Authority resolves false",
      async () => {
        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          null,
        );

        const resolved =
          await createResolver().resolveAuthority(
            Object.freeze({
              authorityRef:
                AUTHORITY_REF,

              authorityVersion:
                AUTHORITY_VERSION,

              authoritySha256:
                AUTHORITY_SHA256,
            }),
          );

        expect(
          resolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "RSL04 Authority payload SHA mismatch resolves false",
      async () => {
        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          canonicalAuthority({
            payload_sha256:
              "b".repeat(
                64,
              ),
          }),
        );

        const resolved =
          await createResolver().resolveAuthority(
            Object.freeze({
              authorityRef:
                AUTHORITY_REF,

              authorityVersion:
                AUTHORITY_VERSION,

              authoritySha256:
                AUTHORITY_SHA256,
            }),
          );

        expect(
          resolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "RSL05 Authority repository exception propagates",
      async () => {
        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockRejectedValueOnce(
          new Error(
            "authority-read-failure",
          ),
        );

        await expect(
          createResolver().resolveAuthority(
            Object.freeze({
              authorityRef:
                AUTHORITY_REF,

              authorityVersion:
                AUTHORITY_VERSION,

              authoritySha256:
                AUTHORITY_SHA256,
            }),
          ),
        ).rejects.toThrow(
          "authority-read-failure",
        );
      },
    );

    it(
      "RSL06 owner MATCH resolves true with captured authenticated context and exact owner reference",
      async () => {
        vi.mocked(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).mockResolvedValueOnce(
          ownerBinding(
            "MATCH",
          ),
        );

        const ownerSubjectRef =
          "IPR-TEST-OWNER";

        const resolved =
          await createResolver().resolveOwnerSubject(
            Object.freeze({
              ownerSubjectRef,
            }),
          );

        expect(
          resolved,
        ).toBe(
          true,
        );

        expect(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).toHaveBeenCalledWith({
          authenticatedHumanIpr:
            AUTHENTICATED_HUMAN_IPR,

          authenticatedIdentityBinding:
            AUTHENTICATED_IDENTITY_BINDING,

          canonicalOwnerSubjectRef:
            ownerSubjectRef,
        });
      },
    );

    it(
      "RSL07 owner MISMATCH resolves false",
      async () => {
        vi.mocked(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).mockResolvedValueOnce(
          ownerBinding(
            "MISMATCH",
          ),
        );

        const resolved =
          await createResolver().resolveOwnerSubject(
            Object.freeze({
              ownerSubjectRef:
                "IPR-TEST-OTHER",
            }),
          );

        expect(
          resolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "RSL08 owner UNRESOLVED resolves false",
      async () => {
        vi.mocked(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).mockResolvedValueOnce(
          ownerBinding(
            "UNRESOLVED",
          ),
        );

        const resolved =
          await createResolver().resolveOwnerSubject(
            Object.freeze({
              ownerSubjectRef:
                "IPR-TEST-OWNER",
            }),
          );

        expect(
          resolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "RSL09 exact durable typed registration resolves true",
      async () => {
        vi.mocked(
          readPlatformCoreTypedReferenceRegistration,
        ).mockResolvedValueOnce(
          typedRegistration(),
        );

        const resolved =
          await createResolver().resolveReference(
            Object.freeze({
              referenceType:
                REFERENCE_TYPE,

              reference:
                REFERENCE,
            }),
          );

        expect(
          resolved,
        ).toBe(
          true,
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).toHaveBeenCalledWith(
          REFERENCE_TYPE,
          REFERENCE,
        );
      },
    );

    it(
      "RSL10 missing generic typed registration resolves false",
      async () => {
        vi.mocked(
          readPlatformCoreTypedReferenceRegistration,
        ).mockResolvedValueOnce(
          null,
        );

        const resolved =
          await createResolver().resolveReference(
            Object.freeze({
              referenceType:
                REFERENCE_TYPE,

              reference:
                REFERENCE,
            }),
          );

        expect(
          resolved,
        ).toBe(
          false,
        );
      },
    );

    it(
      "RSL11 generic typed-reference repository exception propagates",
      async () => {
        vi.mocked(
          readPlatformCoreTypedReferenceRegistration,
        ).mockRejectedValueOnce(
          new Error(
            "typed-reference-read-failure",
          ),
        );

        await expect(
          createResolver().resolveReference(
            Object.freeze({
              referenceType:
                REFERENCE_TYPE,

              reference:
                REFERENCE,
            }),
          ),
        ).rejects.toThrow(
          "typed-reference-read-failure",
        );
      },
    );

    it(
      "RSL12 generic resolver forwards reference type and reference byte-for-byte without normalization",
      async () => {
        const exactReference =
          "CONTROL:ABC.DEF-01_TEST";

        vi.mocked(
          readPlatformCoreTypedReferenceRegistration,
        ).mockResolvedValueOnce(
          {
            ...typedRegistration(),
            reference:
              exactReference,
          },
        );

        const resolved =
          await createResolver().resolveReference(
            Object.freeze({
              referenceType:
                "CONTROL",

              reference:
                exactReference,
            }),
          );

        expect(
          resolved,
        ).toBe(
          true,
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).toHaveBeenCalledWith(
          "CONTROL",
          exactReference,
        );
      },
    );

    it(
      "RSL13 Authority and generic resolution remain dependency-separated",
      async () => {
        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          canonicalAuthority(),
        );

        await createResolver().resolveAuthority(
          Object.freeze({
            authorityRef:
              AUTHORITY_REF,

            authorityVersion:
              AUTHORITY_VERSION,

            authoritySha256:
              AUTHORITY_SHA256,
          }),
        );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).not.toHaveBeenCalled();

        vi.clearAllMocks();

        vi.mocked(
          readPlatformCoreTypedReferenceRegistration,
        ).mockResolvedValueOnce(
          typedRegistration(),
        );

        await createResolver().resolveReference(
          Object.freeze({
            referenceType:
              REFERENCE_TYPE,

            reference:
              REFERENCE,
          }),
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "RSL14 factory creation and resolution use only the three allowed read or binding dependencies",
      async () => {
        const resolver =
          createResolver();

        expect(
          readPlatformCoreCanonicalAuthority,
        ).not.toHaveBeenCalled();

        expect(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).not.toHaveBeenCalled();

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).not.toHaveBeenCalled();

        vi.mocked(
          readPlatformCoreCanonicalAuthority,
        ).mockResolvedValueOnce(
          canonicalAuthority(),
        );

        vi.mocked(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).mockResolvedValueOnce(
          ownerBinding(
            "MATCH",
          ),
        );

        vi.mocked(
          readPlatformCoreTypedReferenceRegistration,
        ).mockResolvedValueOnce(
          typedRegistration(),
        );

        await resolver.resolveAuthority(
          Object.freeze({
            authorityRef:
              AUTHORITY_REF,

            authorityVersion:
              AUTHORITY_VERSION,

            authoritySha256:
              AUTHORITY_SHA256,
          }),
        );

        await resolver.resolveOwnerSubject(
          Object.freeze({
            ownerSubjectRef:
              "IPR-TEST-OWNER",
          }),
        );

        await resolver.resolveReference(
          Object.freeze({
            referenceType:
              REFERENCE_TYPE,

            reference:
              REFERENCE,
          }),
        );

        expect(
          readPlatformCoreCanonicalAuthority,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          resolvePlatformCoreEvidenceSetOwnerBinding,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          readPlatformCoreTypedReferenceRegistration,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);

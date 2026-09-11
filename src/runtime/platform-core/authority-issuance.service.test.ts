import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const harness =
  vi.hoisted(
    () => ({
      buildAuthorityGenesis:
        vi.fn(),

      persistAuthority:
        vi.fn(),
    }),
  );

vi.mock(
  "./canonical-authority-builder",
  () => ({
    buildPlatformCoreCanonicalAuthorityGenesis:
      harness.buildAuthorityGenesis,
  }),
);

vi.mock(
  "./authority-repository",
  () => ({
    persistPlatformCoreCanonicalAuthority:
      harness.persistAuthority,
  }),
);

import type {
  PlatformCoreCanonicalAuthority,
  PlatformCoreCanonicalAuthorityGenesisInput,
} from "./canonical-authority-builder";

import type {
  PlatformCoreAuthorityPersistence,
} from "./authority-repository";

import {
  issuePlatformCoreCanonicalAuthorityGenesis,
} from "./authority-issuance.service";

describe(
  "issuePlatformCoreCanonicalAuthorityGenesis",
  () => {
    beforeEach(
      () => {
        harness.buildAuthorityGenesis.mockReset();
        harness.persistAuthority.mockReset();
      },
    );

    it(
      "forwards the exact input and persists the exact canonical authority",
      async () => {
        const input =
          Object.freeze({}) as unknown as
            PlatformCoreCanonicalAuthorityGenesisInput;

        const canonicalAuthority =
          Object.freeze({}) as unknown as
            PlatformCoreCanonicalAuthority;

        const persistence =
          Object.freeze({
            marker:
              "AUTHORITY_PERSISTENCE_TEST",
          }) as unknown as
            PlatformCoreAuthorityPersistence;

        harness.buildAuthorityGenesis.mockReturnValueOnce(
          canonicalAuthority,
        );

        harness.persistAuthority.mockResolvedValueOnce(
          persistence,
        );

        const result =
          await issuePlatformCoreCanonicalAuthorityGenesis(
            input,
          );

        expect(
          harness.buildAuthorityGenesis,
        ).toHaveBeenCalledTimes(1);

        expect(
          harness.buildAuthorityGenesis.mock.calls[0]?.[0],
        ).toBe(input);

        expect(
          harness.persistAuthority,
        ).toHaveBeenCalledTimes(1);

        expect(
          harness.persistAuthority.mock.calls[0]?.[0],
        ).toBe(canonicalAuthority);

        expect(result).toBe(persistence);
      },
    );

    it(
      "propagates builder failure unchanged and does not persist",
      async () => {
        const input =
          Object.freeze({}) as unknown as
            PlatformCoreCanonicalAuthorityGenesisInput;

        const builderError =
          new Error(
            "BUILDER_FAILURE",
          );

        harness.buildAuthorityGenesis.mockImplementationOnce(
          () => {
            throw builderError;
          },
        );

        await expect(
          issuePlatformCoreCanonicalAuthorityGenesis(
            input,
          ),
        ).rejects.toBe(builderError);

        expect(
          harness.buildAuthorityGenesis,
        ).toHaveBeenCalledTimes(1);

        expect(
          harness.persistAuthority,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates repository failure unchanged after one canonical build",
      async () => {
        const input =
          Object.freeze({}) as unknown as
            PlatformCoreCanonicalAuthorityGenesisInput;

        const canonicalAuthority =
          Object.freeze({}) as unknown as
            PlatformCoreCanonicalAuthority;

        const repositoryError =
          new Error(
            "REPOSITORY_FAILURE",
          );

        harness.buildAuthorityGenesis.mockReturnValueOnce(
          canonicalAuthority,
        );

        harness.persistAuthority.mockRejectedValueOnce(
          repositoryError,
        );

        await expect(
          issuePlatformCoreCanonicalAuthorityGenesis(
            input,
          ),
        ).rejects.toBe(repositoryError);

        expect(
          harness.buildAuthorityGenesis,
        ).toHaveBeenCalledTimes(1);

        expect(
          harness.persistAuthority,
        ).toHaveBeenCalledTimes(1);

        expect(
          harness.persistAuthority.mock.calls[0]?.[0],
        ).toBe(canonicalAuthority);
      },
    );
  },
);

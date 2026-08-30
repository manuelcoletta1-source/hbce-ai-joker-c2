import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const mocks = vi.hoisted(() => ({
  databaseConfigured: vi.fn(),
  queryDatabase: vi.fn()
}));

vi.mock(
  "@/lib/ipr-database",
  () => ({
    isHbceDatabaseConfigured:
      mocks.databaseConfigured,

    queryHbceDatabase:
      mocks.queryDatabase
  })
);

import {
  HBCE_SELF_PILOT_HUMAN_IPR
} from "@/lib/ipr-database-schema";

import {
  RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV,
  resolveRuntimePersistentHumanAuthorization
} from "./runtime-persistent-human-authorization.service";

const previousCanonicalSubject =
  process.env[
    RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
  ];

beforeEach(() => {
  vi.clearAllMocks();

  mocks.databaseConfigured
    .mockReturnValue(true);

  mocks.queryDatabase
    .mockResolvedValue({
      ok: true,
      rows: []
    });

  delete process.env[
    RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
  ];
});

afterEach(() => {
  if (
    previousCanonicalSubject === undefined
  ) {
    delete process.env[
      RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
    ];
  } else {
    process.env[
      RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
    ] = previousCanonicalSubject;
  }
});

describe(
  "runtime persistent Human authorization canonical binding",
  () => {
    it(
      "fails closed when canonical Human subject is not configured",
      async () => {
        await expect(
          resolveRuntimePersistentHumanAuthorization({
            sessionToken: "HBCE-TEST-SESSION-TOKEN"
          })
        ).rejects.toMatchObject({
          code:
            "HBCE_RUNTIME_AUTH_CANONICAL_SUBJECT_NOT_CONFIGURED",
          stage:
            "CONFIGURATION"
        });

        expect(
          mocks.queryDatabase
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "fails closed when configured Human subject is not canonical",
      async () => {
        process.env[
          RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
        ] =
          "IPR-AAAAAAAAAAAA";

        await expect(
          resolveRuntimePersistentHumanAuthorization({
            sessionToken: "HBCE-TEST-SESSION-TOKEN"
          })
        ).rejects.toMatchObject({
          code:
            "HBCE_RUNTIME_AUTH_CANONICAL_SUBJECT_MISCONFIGURED",
          stage:
            "CONFIGURATION"
        });

        expect(
          mocks.queryDatabase
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "accepts canonical Human subject configuration and proceeds to persistent lookup",
      async () => {
        process.env[
          RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
        ] =
          HBCE_SELF_PILOT_HUMAN_IPR;

        await expect(
          resolveRuntimePersistentHumanAuthorization({
            sessionToken: "HBCE-TEST-SESSION-TOKEN"
          })
        ).rejects.toMatchObject({
          code:
            "HBCE_RUNTIME_AUTH_SESSION_NOT_FOUND",
          stage:
            "SESSION_LOOKUP"
        });

        expect(
          mocks.queryDatabase
        ).toHaveBeenCalledTimes(1);
      }
    );
  }
);

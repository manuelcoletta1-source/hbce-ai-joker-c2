import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const mocks = vi.hoisted(() => ({
  isDatabaseConfigured:
    vi.fn(),

  queryDatabase:
    vi.fn(),

  describeRecoveryStore:
    vi.fn(),

  describeRecoveryAuthority:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-database",
  () => ({
    isHbceDatabaseConfigured:
      mocks.isDatabaseConfigured,

    queryHbceDatabaseWithoutSchemaInitialization:
      mocks.queryDatabase
  })
);


vi.mock(
  "@/lib/ipr-password-recovery-store",
  () => ({
    describeIprPasswordRecoveryStore:
      mocks.describeRecoveryStore
  })
);


vi.mock(
  "@/lib/ipr-password-recovery-authority",
  () => ({
    describeIprPasswordRecoveryAuthority:
      mocks.describeRecoveryAuthority
  })
);


import {
  HBCE_SELF_PILOT_HUMAN_IPR
} from "@/lib/ipr-database-schema";

import {
  IPR_PASSWORD_RECOVERY_PREFLIGHT_BOUNDARY,
  runSelfPilotPasswordRecoveryPreflight
} from "@/lib/ipr-password-recovery-preflight";


function configuredStore() {
  return {
    databaseConfigured:
      true,

    hashSecretConfigured:
      true,

    legalCertification:
      false
  };
}


function configuredAuthority() {
  return {
    enabled:
      true,

    secretConfigured:
      true,

    authorityReferenceConfigured:
      true,

    secretValueExposed:
      false,

    authorityReferenceValueExposed:
      false,

    legalCertification:
      false
  };
}


function persistentReadyRow() {
  return {
    persistent_subject_exists:
      true,

    persistent_profile_exists:
      true,

    persistent_credential_exists:
      true,

    profile_legal_certification_false:
      true,

    credential_legal_certification_false:
      true
  };
}


beforeEach(() => {
  vi.clearAllMocks();

  mocks.isDatabaseConfigured
    .mockReturnValue(
      true
    );

  mocks.describeRecoveryStore
    .mockReturnValue(
      configuredStore()
    );

  mocks.describeRecoveryAuthority
    .mockReturnValue(
      configuredAuthority()
    );

  mocks.queryDatabase
    .mockResolvedValue({
      ok:
        true,

      status:
        "AVAILABLE",

      rows: [
        persistentReadyRow()
      ],

      rowCount:
        1,

      error:
        null,

      sqlHash:
        "TEST_SQL_HASH",

      durationMs:
        1
    });
});


describe(
  "HBCE self-pilot password recovery persistence preflight",
  () => {

    it(
      "declares a read-only fixed-subject boundary with no recovery mutation authority",
      () => {

        expect(
          IPR_PASSWORD_RECOVERY_PREFLIGHT_BOUNDARY
        ).toMatchObject({
          mode:
            "SELF_PILOT_PERSISTENT_RECOVERY_READ_ONLY_PREFLIGHT",

          subjectSource:
            "SERVER_CANONICAL_SELF_PILOT",

          acceptsClientHumanIpr:
            false,

          databaseReadOnly:
            true,

          schemaMutation:
            false,

          credentialMutation:
            false,

          recoveryGrantIssuance:
            false,

          passwordRotation:
            false,

          sessionCreation:
            false,

          secretValueExposure:
            false,

          passwordMaterialExposure:
            false,

          credentialHashExposure:
            false,

          profilePayloadExposure:
            false,

          legalCertification:
            false
        });
      }
    );


    it(
      "fails closed before database lookup when a recovery prerequisite is missing",
      async () => {

        mocks.describeRecoveryStore
          .mockReturnValue({
            ...configuredStore(),

            hashSecretConfigured:
              false
          });

        const result =
          await runSelfPilotPasswordRecoveryPreflight();

        expect(
          result.ok
        ).toBe(false);

        expect(
          result.status
        ).toBe(
          "FAIL_CLOSED"
        );

        expect(
          result.recoveryHashSecretConfigured
        ).toBe(false);

        expect(
          result.readyForGovernedGrantIssuance
        ).toBe(false);

        expect(
          mocks.queryDatabase
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "queries only the canonical self-pilot subject and returns PASS when persistent recovery evidence exists",
      async () => {

        const result =
          await runSelfPilotPasswordRecoveryPreflight();

        expect(
          mocks.queryDatabase
        ).toHaveBeenCalledTimes(
          1
        );

        const [
          sql,
          params
        ] =
          mocks.queryDatabase.mock.calls[0];

        expect(
          params
        ).toEqual([
          HBCE_SELF_PILOT_HUMAN_IPR
        ]);

        expect(
          sql
        ).toContain(
          "FROM ipr_subjects"
        );

        expect(
          sql
        ).toContain(
          "FROM ipr_account_profiles"
        );

        expect(
          sql
        ).toContain(
          "FROM ipr_auth_credentials"
        );

        expect(
          sql
        ).not.toContain(
          "password_hash"
        );

        expect(
          sql
        ).not.toContain(
          "password_salt"
        );

        expect(
          sql
        ).not.toContain(
          "credential_payload"
        );

        expect(
          sql
        ).not.toContain(
          "profile_payload"
        );

        expect(
          result
        ).toMatchObject({
          ok:
            true,

          status:
            "PASS",

          canonicalSubject:
            true,

          databaseConfigured:
            true,

          recoveryStoreDatabaseConfigured:
            true,

          recoveryHashSecretConfigured:
            true,

          recoveryAuthorityEnabled:
            true,

          recoveryAuthoritySecretConfigured:
            true,

          recoveryAuthorityReferenceConfigured:
            true,

          persistentSubjectExists:
            true,

          persistentProfileExists:
            true,

          persistentCredentialExists:
            true,

          profileLegalCertificationFalse:
            true,

          credentialLegalCertificationFalse:
            true,

          databaseReadOnly:
            true,

          schemaMutation:
            false,

          readyForGovernedGrantIssuance:
            true,

          legalCertification:
            false
        });
      }
    );


    it(
      "fails closed when the persistent credential does not exist",
      async () => {

        mocks.queryDatabase
          .mockResolvedValue({
            ok:
              true,

            status:
              "AVAILABLE",

            rows: [
              {
                ...persistentReadyRow(),

                persistent_credential_exists:
                  false
              }
            ],

            rowCount:
              1,

            error:
              null,

            sqlHash:
              "TEST_SQL_HASH",

            durationMs:
              1
          });

        const result =
          await runSelfPilotPasswordRecoveryPreflight();

        expect(
          result.ok
        ).toBe(false);

        expect(
          result.status
        ).toBe(
          "FAIL_CLOSED"
        );

        expect(
          result.persistentCredentialExists
        ).toBe(false);

        expect(
          result.readyForGovernedGrantIssuance
        ).toBe(false);
      }
    );


    it(
      "fails closed when the database query cannot prove the persistent state",
      async () => {

        mocks.queryDatabase
          .mockResolvedValue({
            ok:
              false,

            status:
              "QUERY_FAILED",

            rows:
              [],

            rowCount:
              0,

            error:
              "INTERNAL_TEST_ERROR",

            sqlHash:
              null,

            durationMs:
              1
          });

        const result =
          await runSelfPilotPasswordRecoveryPreflight();

        expect(
          result.ok
        ).toBe(false);

        expect(
          result.status
        ).toBe(
          "FAIL_CLOSED"
        );

        expect(
          result.persistentSubjectExists
        ).toBe(false);

        expect(
          result.persistentProfileExists
        ).toBe(false);

        expect(
          result.persistentCredentialExists
        ).toBe(false);

        expect(
          result.readyForGovernedGrantIssuance
        ).toBe(false);
      }
    );


    it(
      "fails closed if persisted recovery records violate the legalCertification false invariant",
      async () => {

        mocks.queryDatabase
          .mockResolvedValue({
            ok:
              true,

            status:
              "AVAILABLE",

            rows: [
              {
                ...persistentReadyRow(),

                credential_legal_certification_false:
                  false
              }
            ],

            rowCount:
              1,

            error:
              null,

            sqlHash:
              "TEST_SQL_HASH",

            durationMs:
              1
          });

        const result =
          await runSelfPilotPasswordRecoveryPreflight();

        expect(
          result.ok
        ).toBe(false);

        expect(
          result.credentialLegalCertificationFalse
        ).toBe(false);

        expect(
          result.readyForGovernedGrantIssuance
        ).toBe(false);

        expect(
          result.legalCertification
        ).toBe(false);
      }
    );
  }
);

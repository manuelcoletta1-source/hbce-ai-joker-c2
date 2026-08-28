import {
  createHash
} from "node:crypto";

import type {
  HbceTransactionContext
} from "@/lib/ipr-database-transaction";

import {
  IPR_PASSWORD_RECOVERY_BOUNDARY,
  consumeLockedIprPasswordRecoveryGrant,
  deriveIprPasswordRecoveryAuthorityHash,
  deriveIprPasswordRecoveryGrantHash,
  deriveIprPasswordRecoverySubjectHash,
  describeIprPasswordRecoveryStore,
  lockValidIprPasswordRecoveryGrant,
  type LockedIprPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-store";


const ORIGINAL_RECOVERY_SECRET =
  process.env.HBCE_PASSWORD_RECOVERY_HASH_SECRET;

const TEST_SECRET_A =
  "HBCE-RECOVERY-TEST-SECRET-A-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const TEST_SECRET_B =
  "HBCE-RECOVERY-TEST-SECRET-B-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const TEST_HUMAN_IPR =
  "IPR-1234567890AB";

const TEST_AUTHORITY_REF =
  "HBCE-TEST-RECOVERY-AUTHORITY-0001";

const TEST_TOKEN =
  "test-recovery-token-with-sufficient-random-looking-material";


function restoreRecoverySecret(): void {
  if (
    ORIGINAL_RECOVERY_SECRET ===
    undefined
  ) {
    delete process.env
      .HBCE_PASSWORD_RECOVERY_HASH_SECRET;

    return;
  }

  process.env
    .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
      ORIGINAL_RECOVERY_SECRET;
}


function buildTransaction(
  queryImplementation:
    (
      sql: string,
      parameters:
        readonly unknown[]
    ) => Promise<unknown>
): HbceTransactionContext {

  return {
    client:
      {} as HbceTransactionContext["client"],

    transactionId:
      "HBCE-TX-RECOVERY-TEST",

    startedAt:
      new Date().toISOString(),

    query:
      queryImplementation as
        HbceTransactionContext["query"]
  };
}


afterEach(() => {
  restoreRecoverySecret();
});


describe(
  "HBCE password recovery cryptographic boundary",
  () => {

    it(
      "fails closed when recovery hash secret is missing",
      () => {

        delete process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET;

        expect(
          () =>
            deriveIprPasswordRecoverySubjectHash(
              TEST_HUMAN_IPR
            )
        ).toThrow(
          "HBCE_PASSWORD_RECOVERY_HASH_SECRET_REQUIRED"
        );
      }
    );


    it(
      "fails closed when recovery hash secret is too short",
      () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            "too-short";

        expect(
          () =>
            deriveIprPasswordRecoveryAuthorityHash(
              TEST_AUTHORITY_REF
            )
        ).toThrow(
          "HBCE_PASSWORD_RECOVERY_HASH_SECRET_REQUIRED"
        );
      }
    );


    it(
      "normalizes Human IPR before subject HMAC derivation",
      () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const canonical =
          deriveIprPasswordRecoverySubjectHash(
            TEST_HUMAN_IPR
          );

        const normalizedEquivalent =
          deriveIprPasswordRecoverySubjectHash(
            " ipr_1234567890ab "
          );

        expect(
          normalizedEquivalent
        ).toBe(
          canonical
        );

        expect(
          canonical
        ).toMatch(
          /^[0-9a-f]{64}$/
        );
      }
    );


    it(
      "uses domain separation between subject and authority bindings",
      () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const sameRawValue =
          TEST_HUMAN_IPR;

        const subjectHash =
          deriveIprPasswordRecoverySubjectHash(
            sameRawValue
          );

        const authorityHash =
          deriveIprPasswordRecoveryAuthorityHash(
            sameRawValue
          );

        expect(
          subjectHash
        ).not.toBe(
          authorityHash
        );
      }
    );


    it(
      "changes HMAC bindings when the server recovery secret changes",
      () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const first =
          deriveIprPasswordRecoverySubjectHash(
            TEST_HUMAN_IPR
          );

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_B;

        const second =
          deriveIprPasswordRecoverySubjectHash(
            TEST_HUMAN_IPR
          );

        expect(
          first
        ).not.toBe(
          second
        );
      }
    );


    it(
      "hashes high-entropy recovery tokens with deterministic SHA-256 independent of server HMAC secret",
      () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const first =
          deriveIprPasswordRecoveryGrantHash(
            TEST_TOKEN
          );

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_B;

        const second =
          deriveIprPasswordRecoveryGrantHash(
            TEST_TOKEN
          );

        const expected =
          createHash(
            "sha256"
          )
            .update(
              TEST_TOKEN,
              "utf8"
            )
            .digest(
              "hex"
            );

        expect(first).toBe(expected);
        expect(second).toBe(expected);

        expect(first).toMatch(
          /^[0-9a-f]{64}$/
        );
      }
    );
  }
);


describe(
  "HBCE password recovery declared authority boundary",
  () => {

    it(
      "does not claim session, credential, runtime or legal authority",
      () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const description =
          describeIprPasswordRecoveryStore();

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .sessionCreationAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .credentialCreationAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .runtimeAuthorizationAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .automaticLoginAfterRecovery
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .authorityVerificationPerformedHere
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .requiresServerVerifiedAuthorityBeforeIssuance
        ).toBe(true);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .arbitraryGrantPayloadPersistence
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .recoveryTokenLoggingAllowed
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_BOUNDARY
            .legalCertification
        ).toBe(false);

        expect(
          description
            .sessionCreationAuthority
        ).toBe(false);

        expect(
          description
            .credentialCreationAuthority
        ).toBe(false);

        expect(
          description
            .runtimeAuthorizationAuthority
        ).toBe(false);

        expect(
          description
            .legalCertification
        ).toBe(false);
      }
    );
  }
);


describe(
  "HBCE password recovery transaction primitives",
  () => {

    it(
      "locks only the expected subject-bound PASSWORD_ROTATION grant using FOR UPDATE",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const grantHash =
          deriveIprPasswordRecoveryGrantHash(
            TEST_TOKEN
          );

        const subjectHash =
          deriveIprPasswordRecoverySubjectHash(
            TEST_HUMAN_IPR
          );

        const authorityHash =
          deriveIprPasswordRecoveryAuthorityHash(
            TEST_AUTHORITY_REF
          );

        const now =
          Date.now();

        let observedSql =
          "";

        let observedParameters:
          readonly unknown[] =
            [];

        const transaction =
          buildTransaction(
            async (
              sql,
              parameters
            ) => {

              observedSql =
                sql;

              observedParameters =
                parameters;

              return {
                rowCount:
                  1,

                rows: [
                  {
                    grant_hash:
                      grantHash,

                    human_ipr_hash:
                      subjectHash,

                    scope:
                      "PASSWORD_ROTATION",

                    status:
                      "ISSUED",

                    issued_at:
                      new Date(
                        now - 60_000
                      ).toISOString(),

                    not_before:
                      new Date(
                        now - 30_000
                      ).toISOString(),

                    expires_at:
                      new Date(
                        now + 300_000
                      ).toISOString(),

                    consumed_at:
                      null,

                    revoked_at:
                      null,

                    issuer_kind:
                      "HBCE_SERVER_RECOVERY_AUTHORITY",

                    issuer_authority_ref_hash:
                      authorityHash,

                    legal_certification:
                      false
                  }
                ]
              };
            }
          );

        const locked =
          await lockValidIprPasswordRecoveryGrant(
            transaction,
            {
              humanIpr:
                TEST_HUMAN_IPR,

              recoveryToken:
                TEST_TOKEN
            }
          );

        expect(
          observedSql
        ).toContain(
          "FOR UPDATE"
        );

        expect(
          observedParameters
        ).toEqual(
          [
            grantHash,
            subjectHash
          ]
        );

        expect(
          locked.status
        ).toBe(
          "ISSUED"
        );

        expect(
          locked.scope
        ).toBe(
          "PASSWORD_ROTATION"
        );

        expect(
          locked.legalCertification
        ).toBe(false);
      }
    );


    it(
      "rejects consumed grants with the generic invalid-grant boundary",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const transaction =
          buildTransaction(
            async () => ({
              rowCount:
                1,

              rows: [
                {
                  grant_hash:
                    deriveIprPasswordRecoveryGrantHash(
                      TEST_TOKEN
                    ),

                  human_ipr_hash:
                    deriveIprPasswordRecoverySubjectHash(
                      TEST_HUMAN_IPR
                    ),

                  scope:
                    "PASSWORD_ROTATION",

                  status:
                    "CONSUMED",

                  issued_at:
                    new Date(
                      Date.now() -
                        60_000
                    ).toISOString(),

                  not_before:
                    new Date(
                      Date.now() -
                        60_000
                    ).toISOString(),

                  expires_at:
                    new Date(
                      Date.now() +
                        300_000
                    ).toISOString(),

                  consumed_at:
                    new Date().toISOString(),

                  revoked_at:
                    null,

                  issuer_kind:
                    "HBCE_SERVER_RECOVERY_AUTHORITY",

                  issuer_authority_ref_hash:
                    deriveIprPasswordRecoveryAuthorityHash(
                      TEST_AUTHORITY_REF
                    ),

                  legal_certification:
                    false
                }
              ]
            })
          );

        await expect(
          lockValidIprPasswordRecoveryGrant(
            transaction,
            {
              humanIpr:
                TEST_HUMAN_IPR,

              recoveryToken:
                TEST_TOKEN
            }
          )
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
        );
      }
    );


    it(
      "rejects expired grants with the generic invalid-grant boundary",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const now =
          Date.now();

        const transaction =
          buildTransaction(
            async () => ({
              rowCount:
                1,

              rows: [
                {
                  grant_hash:
                    deriveIprPasswordRecoveryGrantHash(
                      TEST_TOKEN
                    ),

                  human_ipr_hash:
                    deriveIprPasswordRecoverySubjectHash(
                      TEST_HUMAN_IPR
                    ),

                  scope:
                    "PASSWORD_ROTATION",

                  status:
                    "ISSUED",

                  issued_at:
                    new Date(
                      now - 300_000
                    ).toISOString(),

                  not_before:
                    new Date(
                      now - 300_000
                    ).toISOString(),

                  expires_at:
                    new Date(
                      now - 1_000
                    ).toISOString(),

                  consumed_at:
                    null,

                  revoked_at:
                    null,

                  issuer_kind:
                    "HBCE_SERVER_RECOVERY_AUTHORITY",

                  issuer_authority_ref_hash:
                    deriveIprPasswordRecoveryAuthorityHash(
                      TEST_AUTHORITY_REF
                    ),

                  legal_certification:
                    false
                }
              ]
            })
          );

        await expect(
          lockValidIprPasswordRecoveryGrant(
            transaction,
            {
              humanIpr:
                TEST_HUMAN_IPR,

              recoveryToken:
                TEST_TOKEN
            }
          )
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
        );
      }
    );


    it(
      "rejects not-yet-active grants",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const now =
          Date.now();

        const transaction =
          buildTransaction(
            async () => ({
              rowCount:
                1,

              rows: [
                {
                  grant_hash:
                    deriveIprPasswordRecoveryGrantHash(
                      TEST_TOKEN
                    ),

                  human_ipr_hash:
                    deriveIprPasswordRecoverySubjectHash(
                      TEST_HUMAN_IPR
                    ),

                  scope:
                    "PASSWORD_ROTATION",

                  status:
                    "ISSUED",

                  issued_at:
                    new Date(
                      now
                    ).toISOString(),

                  not_before:
                    new Date(
                      now + 60_000
                    ).toISOString(),

                  expires_at:
                    new Date(
                      now + 300_000
                    ).toISOString(),

                  consumed_at:
                    null,

                  revoked_at:
                    null,

                  issuer_kind:
                    "HBCE_SERVER_RECOVERY_AUTHORITY",

                  issuer_authority_ref_hash:
                    deriveIprPasswordRecoveryAuthorityHash(
                      TEST_AUTHORITY_REF
                    ),

                  legal_certification:
                    false
                }
              ]
            })
          );

        await expect(
          lockValidIprPasswordRecoveryGrant(
            transaction,
            {
              humanIpr:
                TEST_HUMAN_IPR,

              recoveryToken:
                TEST_TOKEN
            }
          )
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GRANT_INVALID"
        );
      }
    );


    it(
      "consumes an already locked valid grant exactly once at the persistence boundary",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const grantHash =
          deriveIprPasswordRecoveryGrantHash(
            TEST_TOKEN
          );

        const locked:
          LockedIprPasswordRecoveryGrant = {
            grantHash,

            humanIprHash:
              deriveIprPasswordRecoverySubjectHash(
                TEST_HUMAN_IPR
              ),

            scope:
              "PASSWORD_ROTATION",

            status:
              "ISSUED",

            issuedAt:
              new Date(
                Date.now() -
                  60_000
              ).toISOString(),

            notBefore:
              new Date(
                Date.now() -
                  30_000
              ).toISOString(),

            expiresAt:
              new Date(
                Date.now() +
                  300_000
              ).toISOString(),

            issuerKind:
              "HBCE_SERVER_RECOVERY_AUTHORITY",

            issuerAuthorityRefHash:
              deriveIprPasswordRecoveryAuthorityHash(
                TEST_AUTHORITY_REF
              ),

            legalCertification:
              false
          };

        let observedSql =
          "";

        let observedParameters:
          readonly unknown[] =
            [];

        const transaction =
          buildTransaction(
            async (
              sql,
              parameters
            ) => {

              observedSql =
                sql;

              observedParameters =
                parameters;

              return {
                rowCount:
                  1,

                rows: [
                  {
                    grant_hash:
                      grantHash,

                    status:
                      "CONSUMED",

                    consumed_at:
                      new Date().toISOString(),

                    legal_certification:
                      false
                  }
                ]
              };
            }
          );

        const consumed =
          await consumeLockedIprPasswordRecoveryGrant(
            transaction,
            locked
          );

        expect(
          observedSql
        ).toContain(
          "status ="
        );

        expect(
          observedSql
        ).toContain(
          "'CONSUMED'"
        );

        expect(
          observedSql
        ).toContain(
          "status ="
        );

        expect(
          observedSql
        ).toContain(
          "'ISSUED'"
        );

        expect(
          observedParameters
        ).toEqual(
          [
            grantHash,
            locked.humanIprHash
          ]
        );

        expect(
          observedSql
        ).toContain(
          "human_ipr_hash = $2"
        );

        expect(
          consumed.status
        ).toBe(
          "CONSUMED"
        );

        expect(
          consumed.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed when persistence cannot consume the grant, covering replay or concurrent consumption",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
            TEST_SECRET_A;

        const locked:
          LockedIprPasswordRecoveryGrant = {
            grantHash:
              deriveIprPasswordRecoveryGrantHash(
                TEST_TOKEN
              ),

            humanIprHash:
              deriveIprPasswordRecoverySubjectHash(
                TEST_HUMAN_IPR
              ),

            scope:
              "PASSWORD_ROTATION",

            status:
              "ISSUED",

            issuedAt:
              new Date(
                Date.now() -
                  60_000
              ).toISOString(),

            notBefore:
              new Date(
                Date.now() -
                  30_000
              ).toISOString(),

            expiresAt:
              new Date(
                Date.now() +
                  300_000
              ).toISOString(),

            issuerKind:
              "HBCE_SERVER_RECOVERY_AUTHORITY",

            issuerAuthorityRefHash:
              deriveIprPasswordRecoveryAuthorityHash(
                TEST_AUTHORITY_REF
              ),

            legalCertification:
              false
          };

        const transaction =
          buildTransaction(
            async () => ({
              rowCount:
                0,

              rows:
                []
            })
          );

        await expect(
          consumeLockedIprPasswordRecoveryGrant(
            transaction,
            locked
          )
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GRANT_CONSUME_FAILED"
        );
      }
    );
  }
);

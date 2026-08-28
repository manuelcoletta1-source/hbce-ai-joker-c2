import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const {
  mockPoolConnect,
  mockPoolEnd,
  mockPoolOn,
  mockClientQuery,
  mockClientRelease,
  mockSynchronizeProcessFallback,
  mockClearProcessStore
} = vi.hoisted(() => ({
  mockPoolConnect:
    vi.fn(),

  mockPoolEnd:
    vi.fn(),

  mockPoolOn:
    vi.fn(),

  mockClientQuery:
    vi.fn(),

  mockClientRelease:
    vi.fn(),

  mockSynchronizeProcessFallback:
    vi.fn(),

  mockClearProcessStore:
    vi.fn()
}));


vi.mock(
  "@neondatabase/serverless",
  () => ({
    Pool:
      class MockPool {
        connect =
          mockPoolConnect;

        end =
          mockPoolEnd;

        on =
          mockPoolOn;
      }
  })
);


vi.mock(
  "@/lib/ipr-session-store",
  () => ({
    synchronizeIprAuthRecoveryProcessFallback:
      mockSynchronizeProcessFallback,

    clearProcessIprAuthStore:
      mockClearProcessStore
  })
);


import {
  closeHbceTransactionPool
} from "@/lib/ipr-database-transaction";

import {
  executeIprPasswordRecovery,
  IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY
} from "@/lib/ipr-password-recovery-transaction";


const ORIGINAL_DATABASE_URL =
  process.env.DATABASE_URL;

const ORIGINAL_RECOVERY_SECRET =
  process.env
    .HBCE_PASSWORD_RECOVERY_HASH_SECRET;


const HUMAN_IPR =
  "IPR-AAAAAAAAAAAA";

const RECOVERY_TOKEN =
  "HBCE_RECOVERY_TRANSACTION_TEST_TOKEN_0123456789";

const NEW_PASSWORD =
  "Secure#Rotation2026!Alpha";

const ORIGINAL_PASSWORD_CREATED_AT =
  "2026-01-19T15:30:00.000Z";


let credentialExists =
  true;

let consumeSucceeds =
  true;

let revokedPersistentSessions =
  2;


function queryResult(
  rows:
    Record<string, unknown>[] = [],
  rowCount:
    number = rows.length
) {
  return {
    command:
      "",

    rowCount,

    oid:
      0,

    rows,

    fields:
      []
  };
}


function normalizeSql(
  sql:
    unknown
): string {
  return String(sql)
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function getSqlCalls(): string[] {
  return mockClientQuery
    .mock
    .calls
    .map(
      ([sql]) =>
        normalizeSql(
          sql
        )
    );
}


function indexOfSql(
  calls:
    string[],
  fragment:
    string
): number {
  return calls.findIndex(
    (sql) =>
      sql.includes(
        fragment
      )
  );
}


beforeEach(() => {
  process.env.DATABASE_URL =
    "postgresql://hbce-recovery-transaction-test.invalid/hbce";

  process.env
    .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
      "HBCE-RECOVERY-TRANSACTION-TEST-SECRET-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  credentialExists =
    true;

  consumeSucceeds =
    true;

  revokedPersistentSessions =
    2;

  mockPoolConnect.mockReset();
  mockPoolEnd.mockReset();
  mockPoolOn.mockReset();
  mockClientQuery.mockReset();
  mockClientRelease.mockReset();

  mockSynchronizeProcessFallback
    .mockReset();

  mockClearProcessStore
    .mockReset();

  mockClientRelease
    .mockReturnValue(
      undefined
    );

  mockPoolEnd
    .mockResolvedValue(
      undefined
    );

  mockSynchronizeProcessFallback
    .mockImplementation(
      (credential) => ({
        humanIpr:
          credential.humanIpr,

        credentialReplaced:
          true,

        revokedSessions:
          3,

        databaseWritePerformed:
          false,

        sessionCreationAuthority:
          false,

        runtimeAuthorizationAuthority:
          false,

        legalCertification:
          false
      })
    );

  mockClientQuery
    .mockImplementation(
      async (
        sql:
          unknown,
        parameters:
          readonly unknown[] = []
      ) => {

        const normalized =
          normalizeSql(
            sql
          );

        /*
         * Recovery grant lock.
         */
        if (
          normalized.includes(
            "FROM ipr_password_recovery_grants"
          ) &&
          normalized.includes(
            "FOR UPDATE"
          )
        ) {
          return queryResult([
            {
              grant_hash:
                parameters[0],

              human_ipr_hash:
                parameters[1],

              scope:
                "PASSWORD_ROTATION",

              status:
                "ISSUED",

              issued_at:
                new Date(
                  Date.now() -
                    60_000
                ).toISOString(),

              not_before:
                new Date(
                  Date.now() -
                    30_000
                ).toISOString(),

              expires_at:
                new Date(
                  Date.now() +
                    600_000
                ).toISOString(),

              consumed_at:
                null,

              revoked_at:
                null,

              issuer_kind:
                "HBCE_SERVER_RECOVERY_AUTHORITY",

              issuer_authority_ref_hash:
                "a".repeat(64),

              legal_certification:
                false
            }
          ]);
        }

        /*
         * Existing credential rotation.
         */
        if (
          normalized.startsWith(
            "UPDATE ipr_auth_credentials"
          )
        ) {
          if (
            !credentialExists
          ) {
            return queryResult(
              [],
              0
            );
          }

          return queryResult([
            {
              human_ipr:
                parameters[0],

              password_algorithm:
                parameters[1],

              password_hash:
                parameters[2],

              password_salt:
                parameters[3],

              password_key_length:
                parameters[4],

              password_created_at:
                ORIGINAL_PASSWORD_CREATED_AT,

              password_updated_at:
                "2026-08-28T20:45:00.000Z",

              password_last_verified_at:
                null,

              failed_attempts:
                0,

              locked_until:
                null,

              credential_payload: {
                source:
                  "HBCE_RECOVERY_TRANSACTION_TEST"
              },

              legal_certification:
                false
            }
          ]);
        }

        /*
         * Subject-wide persistent session revocation.
         */
        if (
          normalized.startsWith(
            "UPDATE ipr_sessions"
          )
        ) {
          return queryResult(
            Array.from(
              {
                length:
                  revokedPersistentSessions
              },
              (
                _,
                index
              ) => ({
                session_id:
                  `IPR-SESSION-TEST-${index + 1}`
              })
            ),
            revokedPersistentSessions
          );
        }

        /*
         * One-use recovery grant consumption.
         */
        if (
          normalized.startsWith(
            "UPDATE ipr_password_recovery_grants"
          ) &&
          normalized.includes(
            "'CONSUMED'"
          )
        ) {
          if (
            !consumeSucceeds
          ) {
            return queryResult(
              [],
              0
            );
          }

          return queryResult([
            {
              grant_hash:
                parameters[0],

              status:
                "CONSUMED",

              consumed_at:
                "2026-08-28T20:45:01.000Z",

              legal_certification:
                false
            }
          ]);
        }

        /*
         * BEGIN / COMMIT / ROLLBACK / SET LOCAL.
         */
        return queryResult();
      }
    );

  mockPoolConnect
    .mockResolvedValue({
      query:
        mockClientQuery,

      release:
        mockClientRelease
    });
});


afterEach(
  async () => {

    await closeHbceTransactionPool();

    if (
      typeof ORIGINAL_DATABASE_URL ===
        "string"
    ) {
      process.env.DATABASE_URL =
        ORIGINAL_DATABASE_URL;
    } else {
      delete process.env.DATABASE_URL;
    }

    if (
      typeof ORIGINAL_RECOVERY_SECRET ===
        "string"
    ) {
      process.env
        .HBCE_PASSWORD_RECOVERY_HASH_SECRET =
          ORIGINAL_RECOVERY_SECRET;
    } else {
      delete process.env
        .HBCE_PASSWORD_RECOVERY_HASH_SECRET;
    }
  }
);


describe(
  "HBCE atomic password recovery transaction",
  () => {

    it(
      "commits grant lock, existing credential rotation, persistent session revocation and grant consumption in the required order",
      async () => {

        const result =
          await executeIprPasswordRecovery({
            humanIpr:
              HUMAN_IPR,

            recoveryToken:
              RECOVERY_TOKEN,

            newPassword:
              NEW_PASSWORD
          });

        expect(
          result
        ).toMatchObject({
          humanIpr:
            HUMAN_IPR,

          passwordUpdatedAt:
            "2026-08-28T20:45:00.000Z",

          revokedPersistentSessions:
            2,

          revokedProcessSessions:
            3,

          processFallbackSynchronization:
            "SYNCHRONIZED",

          processFallbackCleared:
            false,

          grantConsumed:
            true,

          sessionCreated:
            false,

          automaticLogin:
            false,

          transactionCommitted:
            true,

          legalCertification:
            false
        });

        expect(
          IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY
            .credentialMutation
        ).toBe(
          "UPDATE_EXISTING_ONLY"
        );

        expect(
          IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY
            .isolationLevel
        ).toBe(
          "SERIALIZABLE"
        );

        expect(
          IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY
            .credentialInsertAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY
            .credentialUpsertAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY
            .automaticLoginAfterRecovery
        ).toBe(false);

        const calls =
          getSqlCalls();

        const beginIndex =
          indexOfSql(
            calls,
            "BEGIN ISOLATION LEVEL SERIALIZABLE"
          );

        const lockIndex =
          indexOfSql(
            calls,
            "FROM ipr_password_recovery_grants"
          );

        const credentialIndex =
          indexOfSql(
            calls,
            "UPDATE ipr_auth_credentials"
          );

        const sessionIndex =
          indexOfSql(
            calls,
            "UPDATE ipr_sessions"
          );

        const consumeIndex =
          calls.findIndex(
            (
              sql,
              index
            ) =>
              index >
                lockIndex &&
              sql.startsWith(
                "UPDATE ipr_password_recovery_grants"
              ) &&
              sql.includes(
                "'CONSUMED'"
              )
          );

        const commitIndex =
          calls.lastIndexOf(
            "COMMIT"
          );

        expect(
          beginIndex
        ).toBeGreaterThanOrEqual(
          0
        );

        expect(
          lockIndex
        ).toBeGreaterThan(
          beginIndex
        );

        expect(
          credentialIndex
        ).toBeGreaterThan(
          lockIndex
        );

        expect(
          sessionIndex
        ).toBeGreaterThan(
          credentialIndex
        );

        expect(
          consumeIndex
        ).toBeGreaterThan(
          sessionIndex
        );

        expect(
          commitIndex
        ).toBeGreaterThan(
          consumeIndex
        );

        expect(calls).not.toContain(
          "ROLLBACK"
        );

        expect(
          calls.some(
            (sql) =>
              sql.includes(
                "INSERT INTO ipr_auth_credentials"
              )
          )
        ).toBe(false);

        expect(
          calls.some(
            (sql) =>
              sql.includes(
                "ON CONFLICT"
              ) &&
              sql.includes(
                "ipr_auth_credentials"
              )
          )
        ).toBe(false);

        expect(
          mockSynchronizeProcessFallback
        ).toHaveBeenCalledTimes(
          1
        );

        const synchronizedCredential =
          mockSynchronizeProcessFallback
            .mock
            .calls[0][0];

        expect(
          synchronizedCredential
            .passwordCreatedAt
        ).toBe(
          ORIGINAL_PASSWORD_CREATED_AT
        );

        expect(
          synchronizedCredential
            .failedAttempts
        ).toBe(0);

        expect(
          synchronizedCredential
            .lockedUntil
        ).toBeNull();

        expect(
          mockClearProcessStore
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "rolls back and never creates an account when the existing credential does not exist",
      async () => {

        credentialExists =
          false;

        await expect(
          executeIprPasswordRecovery({
            humanIpr:
              HUMAN_IPR,

            recoveryToken:
              RECOVERY_TOKEN,

            newPassword:
              NEW_PASSWORD
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_TRANSACTION_FAILED"
        );

        const calls =
          getSqlCalls();

        expect(
          calls
        ).toContain(
          "ROLLBACK"
        );

        expect(
          calls
        ).not.toContain(
          "COMMIT"
        );

        expect(
          indexOfSql(
            calls,
            "UPDATE ipr_auth_credentials"
          )
        ).toBeGreaterThanOrEqual(
          0
        );

        expect(
          indexOfSql(
            calls,
            "UPDATE ipr_sessions"
          )
        ).toBe(
          -1
        );

        expect(
          calls.some(
            (sql) =>
              sql.startsWith(
                "UPDATE ipr_password_recovery_grants"
              ) &&
              sql.includes(
                "'CONSUMED'"
              )
          )
        ).toBe(false);

        expect(
          calls.some(
            (sql) =>
              sql.includes(
                "INSERT INTO ipr_auth_credentials"
              )
          )
        ).toBe(false);

        expect(
          mockSynchronizeProcessFallback
        ).not.toHaveBeenCalled();

        expect(
          mockClearProcessStore
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "rolls back credential and session mutations when one-use grant consumption fails",
      async () => {

        consumeSucceeds =
          false;

        revokedPersistentSessions =
          1;

        await expect(
          executeIprPasswordRecovery({
            humanIpr:
              HUMAN_IPR,

            recoveryToken:
              RECOVERY_TOKEN,

            newPassword:
              NEW_PASSWORD
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_TRANSACTION_FAILED"
        );

        const calls =
          getSqlCalls();

        expect(
          indexOfSql(
            calls,
            "UPDATE ipr_auth_credentials"
          )
        ).toBeGreaterThanOrEqual(
          0
        );

        expect(
          indexOfSql(
            calls,
            "UPDATE ipr_sessions"
          )
        ).toBeGreaterThanOrEqual(
          0
        );

        expect(
          calls.some(
            (sql) =>
              sql.startsWith(
                "UPDATE ipr_password_recovery_grants"
              ) &&
              sql.includes(
                "'CONSUMED'"
              )
          )
        ).toBe(true);

        expect(
          calls
        ).toContain(
          "ROLLBACK"
        );

        expect(
          calls
        ).not.toContain(
          "COMMIT"
        );

        expect(
          mockSynchronizeProcessFallback
        ).not.toHaveBeenCalled();

        expect(
          mockClearProcessStore
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "keeps the committed database recovery authoritative and clears volatile auth state when post-commit fallback synchronization fails",
      async () => {

        mockSynchronizeProcessFallback
          .mockImplementationOnce(
            () => {
              throw new Error(
                "HBCE_TEST_POST_COMMIT_SYNC_FAILURE"
              );
            }
          );

        const result =
          await executeIprPasswordRecovery({
            humanIpr:
              HUMAN_IPR,

            recoveryToken:
              RECOVERY_TOKEN,

            newPassword:
              NEW_PASSWORD
          });

        expect(
          result
        ).toMatchObject({
          humanIpr:
            HUMAN_IPR,

          revokedPersistentSessions:
            2,

          revokedProcessSessions:
            null,

          processFallbackSynchronization:
            "CLEARED_FAIL_CLOSED",

          processFallbackCleared:
            true,

          grantConsumed:
            true,

          sessionCreated:
            false,

          automaticLogin:
            false,

          transactionCommitted:
            true,

          legalCertification:
            false
        });

        const calls =
          getSqlCalls();

        expect(
          calls
        ).toContain(
          "COMMIT"
        );

        expect(
          calls
        ).not.toContain(
          "ROLLBACK"
        );

        expect(
          mockSynchronizeProcessFallback
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mockClearProcessStore
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);

import type {
  QueryResultRow
} from "@neondatabase/serverless";

import {
  assertValidHumanIpr,
  hashIprPassword
} from "@/lib/ipr-auth";

import {
  isHbceTransactionDatabaseConfigured,
  withHbceDatabaseTransaction
} from "@/lib/ipr-database-transaction";

import {
  consumeLockedIprPasswordRecoveryGrant,
  lockValidIprPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-store";

import {
  clearProcessIprAuthStore,
  synchronizeIprAuthRecoveryProcessFallback,
  type IprAuthStoredCredential
} from "@/lib/ipr-session-store";


export const IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-TRANSACTION-v1_0",

  isolationLevel:
    "SERIALIZABLE",

  credentialMutation:
    "UPDATE_EXISTING_ONLY",

  credentialInsertAuthority:
    false,

  credentialUpsertAuthority:
    false,

  sessionCreationAuthority:
    false,

  automaticLoginAfterRecovery:
    false,

  subjectSessionRevocation:
    "ALL_ACTIVE_SESSIONS",

  grantConsumption:
    "SAME_TRANSACTION",

  processFallbackSynchronization:
    "POST_COMMIT_ONLY",

  processFallbackFailurePolicy:
    "CLEAR_PROCESS_STORE_FAIL_CLOSED",

  persistentDatabaseRemainsAuthoritativeAfterCommit:
    true,

  plaintextPasswordPersistence:
    false,

  recoveryTokenPersistence:
    false,

  legalCertification:
    false
} as const;


export type ExecuteIprPasswordRecoveryInput = {
  humanIpr:
    string;

  recoveryToken:
    string;

  newPassword:
    string;
};


export type ExecuteIprPasswordRecoveryResult = {
  humanIpr:
    string;

  passwordUpdatedAt:
    string;

  revokedPersistentSessions:
    number;

  revokedProcessSessions:
    number | null;

  processFallbackSynchronization:
    "SYNCHRONIZED" |
    "CLEARED_FAIL_CLOSED";

  processFallbackCleared:
    boolean;

  grantConsumed:
    true;

  sessionCreated:
    false;

  automaticLogin:
    false;

  transactionCommitted:
    true;

  legalCertification:
    false;
};


type RecoveryCredentialRow =
  QueryResultRow & {
    human_ipr?: unknown;
    password_algorithm?: unknown;
    password_hash?: unknown;
    password_salt?: unknown;
    password_key_length?: unknown;
    password_created_at?: unknown;
    password_updated_at?: unknown;
    password_last_verified_at?: unknown;
    failed_attempts?: unknown;
    locked_until?: unknown;
    credential_payload?: unknown;
    legal_certification?: unknown;
  };


type RevokedSessionRow =
  QueryResultRow & {
    session_id?: unknown;
  };


function requireString(
  value:
    unknown,
  errorCode:
    string
): string {

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      errorCode
    );
  }

  return value.trim();
}


function toIso(
  value:
    unknown,
  errorCode:
    string
): string {

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  const candidate =
    requireString(
      value,
      errorCode
    );

  const parsed =
    new Date(
      candidate
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      errorCode
    );
  }

  return parsed.toISOString();
}


function toIsoOrNull(
  value:
    unknown
): string | null {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return toIso(
    value,
    "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_TIMESTAMP"
  );
}


function toJsonRecord(
  value:
    unknown
): Record<string, unknown> {

  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value as
      Record<string, unknown>;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    try {
      const parsed =
        JSON.parse(
          value
        );

      if (
        parsed &&
        typeof parsed ===
          "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as
          Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return {};
}


function credentialFromRow(
  row:
    RecoveryCredentialRow
): IprAuthStoredCredential {

  if (
    row.legal_certification !==
      false
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_LEGAL_CERTIFICATION_BOUNDARY_VIOLATED"
    );
  }

  const failedAttempts =
    Number(
      row.failed_attempts
    );

  if (
    !Number.isFinite(
      failedAttempts
    ) ||
    failedAttempts !==
      0
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_CREDENTIAL_STATE_INVALID"
    );
  }

  if (
    row.locked_until !==
      null &&
    row.locked_until !==
      undefined
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_CREDENTIAL_STATE_INVALID"
    );
  }

  const passwordKeyLength =
    Number(
      row.password_key_length
    );

  if (
    !Number.isInteger(
      passwordKeyLength
    ) ||
    passwordKeyLength <=
      0
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_RECORD"
    );
  }

  return {
    humanIpr:
      assertValidHumanIpr(
        requireString(
          row.human_ipr,
          "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_RECORD"
        )
      ),

    passwordAlgorithm:
      requireString(
        row.password_algorithm,
        "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_RECORD"
      ),

    passwordHash:
      requireString(
        row.password_hash,
        "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_RECORD"
      ),

    passwordSalt:
      requireString(
        row.password_salt,
        "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_RECORD"
      ),

    passwordKeyLength,

    passwordCreatedAt:
      toIso(
        row.password_created_at,
        "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_TIMESTAMP"
      ),

    passwordUpdatedAt:
      toIso(
        row.password_updated_at,
        "HBCE_PASSWORD_RECOVERY_INVALID_CREDENTIAL_TIMESTAMP"
      ),

    passwordLastVerifiedAt:
      toIsoOrNull(
        row.password_last_verified_at
      ),

    failedAttempts:
      0,

    lockedUntil:
      null,

    credentialPayload:
      toJsonRecord(
        row.credential_payload
      ),

    legalCertification:
      false
  };
}


const UPDATE_EXISTING_CREDENTIAL_SQL = `
UPDATE ipr_auth_credentials
SET
  password_algorithm =
    $2,

  password_hash =
    $3,

  password_salt =
    $4,

  password_key_length =
    $5,

  password_updated_at =
    now(),

  password_last_verified_at =
    NULL,

  failed_attempts =
    0,

  locked_until =
    NULL,

  legal_certification =
    false

WHERE
  human_ipr =
    $1

RETURNING
  human_ipr,
  password_algorithm,
  password_hash,
  password_salt,
  password_key_length,
  password_created_at,
  password_updated_at,
  password_last_verified_at,
  failed_attempts,
  locked_until,
  credential_payload,
  legal_certification
`.trim();


const REVOKE_SUBJECT_ACTIVE_SESSIONS_SQL = `
UPDATE ipr_sessions
SET
  status =
    'REVOKED',

  revoked_at =
    now(),

  legal_certification =
    false

WHERE
  human_ipr =
    $1

  AND status =
    'ACTIVE'

  AND revoked_at IS NULL

RETURNING
  session_id
`.trim();


export function describeIprPasswordRecoveryTransaction() {
  return {
    ...IPR_PASSWORD_RECOVERY_TRANSACTION_BOUNDARY,

    databaseConfigured:
      isHbceTransactionDatabaseConfigured()
  };
}


export async function executeIprPasswordRecovery(
  input:
    ExecuteIprPasswordRecoveryInput
): Promise<
  ExecuteIprPasswordRecoveryResult
> {

  if (
    !isHbceTransactionDatabaseConfigured()
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_DATABASE_NOT_CONFIGURED"
    );
  }

  const humanIpr =
    assertValidHumanIpr(
      input.humanIpr
    );

  /*
   * Password policy + salt generation + scrypt happen before
   * opening the database transaction.
   *
   * This avoids holding database locks while performing the
   * intentionally expensive password KDF.
   */
  const newCredentialMaterial =
    await hashIprPassword({
      humanIpr,
      password:
        input.newPassword
    });

  const transaction =
    await withHbceDatabaseTransaction(
      async (
        transactionContext
      ) => {

        /*
         * 1. Lock and validate the one-use recovery grant.
         */
        const lockedGrant =
          await lockValidIprPasswordRecoveryGrant(
            transactionContext,
            {
              humanIpr,
              recoveryToken:
                input.recoveryToken
            }
          );

        /*
         * 2. Rotate an EXISTING credential only.
         *
         * There is deliberately no INSERT and no UPSERT here.
         * A recovery grant cannot create an account.
         */
        const credentialResult =
          await transactionContext.query<
            RecoveryCredentialRow
          >(
            UPDATE_EXISTING_CREDENTIAL_SQL,
            [
              humanIpr,
              newCredentialMaterial
                .passwordAlgorithm,
              newCredentialMaterial
                .passwordHash,
              newCredentialMaterial
                .passwordSalt,
              newCredentialMaterial
                .passwordKeyLength
            ]
          );

        if (
          credentialResult.rowCount !==
            1 ||
          !credentialResult.rows[0]
        ) {
          throw new Error(
            "HBCE_PASSWORD_RECOVERY_EXISTING_CREDENTIAL_REQUIRED"
          );
        }

        const credential =
          credentialFromRow(
            credentialResult.rows[0]
          );

        if (
          credential.humanIpr !==
            humanIpr
        ) {
          throw new Error(
            "HBCE_PASSWORD_RECOVERY_CREDENTIAL_SUBJECT_MISMATCH"
          );
        }

        /*
         * 3. Revoke every ACTIVE persistent session belonging
         * to the recovered Human IPR.
         */
        const sessionResult =
          await transactionContext.query<
            RevokedSessionRow
          >(
            REVOKE_SUBJECT_ACTIVE_SESSIONS_SQL,
            [
              humanIpr
            ]
          );

        const revokedPersistentSessions =
          Math.max(
            0,
            Number(
              sessionResult.rowCount ||
                0
            )
          );

        /*
         * 4. Consume the same subject-bound grant.
         *
         * If this fails, credential rotation and session
         * revocation are rolled back with the transaction.
         */
        const consumedGrant =
          await consumeLockedIprPasswordRecoveryGrant(
            transactionContext,
            lockedGrant
          );

        if (
          consumedGrant.status !==
            "CONSUMED" ||
          consumedGrant.legalCertification !==
            false
        ) {
          throw new Error(
            "HBCE_PASSWORD_RECOVERY_GRANT_CONSUMPTION_INVALID"
          );
        }

        return {
          credential,
          revokedPersistentSessions
        };
      },
      {
        isolationLevel:
          "SERIALIZABLE",

        readOnly:
          false,

        statementTimeoutMs:
          30_000,

        lockTimeoutMs:
          10_000,

        idleInTransactionSessionTimeoutMs:
          30_000
      }
    );

  if (!transaction.ok) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_TRANSACTION_FAILED"
    );
  }

  /*
   * Database COMMIT has succeeded.
   *
   * Only now may the process fallback be synchronized.
   * This function performs no database writes.
   */
  let revokedProcessSessions:
    number | null =
      null;

  let processFallbackSynchronization:
    "SYNCHRONIZED" |
    "CLEARED_FAIL_CLOSED";

  let processFallbackCleared =
    false;

  try {
    const fallbackSync =
      synchronizeIprAuthRecoveryProcessFallback(
        transaction.value
          .credential
      );

    if (
      fallbackSync.humanIpr !==
        humanIpr ||
      fallbackSync.credentialReplaced !==
        true ||
      fallbackSync.databaseWritePerformed !==
        false ||
      fallbackSync.sessionCreationAuthority !==
        false ||
      fallbackSync.runtimeAuthorizationAuthority !==
        false ||
      fallbackSync.legalCertification !==
        false
    ) {
      throw new Error(
        "HBCE_PASSWORD_RECOVERY_POST_COMMIT_SYNC_INVALID"
      );
    }

    revokedProcessSessions =
      fallbackSync
        .revokedSessions;

    processFallbackSynchronization =
      "SYNCHRONIZED";
  } catch {
    /*
     * The database transaction has ALREADY COMMITTED.
     *
     * Never report this as a rolled-back password recovery.
     * Instead remove all volatile auth state from the current
     * process so stale sessions cannot survive locally.
     *
     * Persistent database state remains authoritative.
     */
    clearProcessIprAuthStore();

    processFallbackSynchronization =
      "CLEARED_FAIL_CLOSED";

    processFallbackCleared =
      true;

    revokedProcessSessions =
      null;
  }

  return {
    humanIpr,

    passwordUpdatedAt:
      transaction.value
        .credential
        .passwordUpdatedAt,

    revokedPersistentSessions:
      transaction.value
        .revokedPersistentSessions,

    revokedProcessSessions,

    processFallbackSynchronization,

    processFallbackCleared,

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
  };
}

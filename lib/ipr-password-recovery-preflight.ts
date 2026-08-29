import {
  isHbceDatabaseConfigured,
  queryHbceDatabaseWithoutSchemaInitialization
} from "@/lib/ipr-database";

import {
  HBCE_SELF_PILOT_HUMAN_IPR
} from "@/lib/ipr-database-schema";

import {
  describeIprPasswordRecoveryAuthority
} from "@/lib/ipr-password-recovery-authority";

import {
  describeIprPasswordRecoveryStore
} from "@/lib/ipr-password-recovery-store";


export const IPR_PASSWORD_RECOVERY_PREFLIGHT_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-PREFLIGHT-v1_0",

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
} as const;


type RecoveryPersistenceRow = {
  persistent_subject_exists:
    boolean;

  persistent_profile_exists:
    boolean;

  persistent_credential_exists:
    boolean;

  profile_legal_certification_false:
    boolean;

  credential_legal_certification_false:
    boolean;
};


export type IprPasswordRecoveryPreflightResult = {
  ok:
    boolean;

  status:
    "PASS" |
    "FAIL_CLOSED";

  revision:
    typeof IPR_PASSWORD_RECOVERY_PREFLIGHT_BOUNDARY.revision;

  canonicalSubject:
    true;

  databaseConfigured:
    boolean;

  recoveryStoreDatabaseConfigured:
    boolean;

  recoveryHashSecretConfigured:
    boolean;

  recoveryAuthorityEnabled:
    boolean;

  recoveryAuthoritySecretConfigured:
    boolean;

  recoveryAuthorityReferenceConfigured:
    boolean;

  persistentSubjectExists:
    boolean;

  persistentProfileExists:
    boolean;

  persistentCredentialExists:
    boolean;

  profileLegalCertificationFalse:
    boolean;

  credentialLegalCertificationFalse:
    boolean;

  databaseReadOnly:
    true;

  schemaMutation:
    false;

  readyForGovernedGrantIssuance:
    boolean;

  legalCertification:
    false;
};


function failClosedBase():
  IprPasswordRecoveryPreflightResult {

  const store =
    describeIprPasswordRecoveryStore();

  const authority =
    describeIprPasswordRecoveryAuthority();

  return {
    ok:
      false,

    status:
      "FAIL_CLOSED",

    revision:
      IPR_PASSWORD_RECOVERY_PREFLIGHT_BOUNDARY
        .revision,

    canonicalSubject:
      true,

    databaseConfigured:
      isHbceDatabaseConfigured(),

    recoveryStoreDatabaseConfigured:
      store.databaseConfigured,

    recoveryHashSecretConfigured:
      store.hashSecretConfigured,

    recoveryAuthorityEnabled:
      authority.enabled,

    recoveryAuthoritySecretConfigured:
      authority.secretConfigured,

    recoveryAuthorityReferenceConfigured:
      authority.authorityReferenceConfigured,

    persistentSubjectExists:
      false,

    persistentProfileExists:
      false,

    persistentCredentialExists:
      false,

    profileLegalCertificationFalse:
      false,

    credentialLegalCertificationFalse:
      false,

    databaseReadOnly:
      true,

    schemaMutation:
      false,

    readyForGovernedGrantIssuance:
      false,

    legalCertification:
      false
  };
}


export async function runSelfPilotPasswordRecoveryPreflight():
  Promise<IprPasswordRecoveryPreflightResult> {

  const base =
    failClosedBase();

  if (
    !base.databaseConfigured ||
    !base.recoveryStoreDatabaseConfigured ||
    !base.recoveryHashSecretConfigured ||
    !base.recoveryAuthorityEnabled ||
    !base.recoveryAuthoritySecretConfigured ||
    !base.recoveryAuthorityReferenceConfigured
  ) {
    return base;
  }

  const result =
    await queryHbceDatabaseWithoutSchemaInitialization<
      RecoveryPersistenceRow
    >(
      `
        SELECT
          EXISTS (
            SELECT 1
            FROM ipr_subjects
            WHERE human_ipr = $1
          ) AS persistent_subject_exists,

          EXISTS (
            SELECT 1
            FROM ipr_account_profiles
            WHERE human_ipr = $1
          ) AS persistent_profile_exists,

          EXISTS (
            SELECT 1
            FROM ipr_auth_credentials
            WHERE human_ipr = $1
          ) AS persistent_credential_exists,

          NOT EXISTS (
            SELECT 1
            FROM ipr_account_profiles
            WHERE human_ipr = $1
              AND legal_certification <> false
          ) AS profile_legal_certification_false,

          NOT EXISTS (
            SELECT 1
            FROM ipr_auth_credentials
            WHERE human_ipr = $1
              AND legal_certification <> false
          ) AS credential_legal_certification_false
      `.trim(),
      [
        HBCE_SELF_PILOT_HUMAN_IPR
      ]
    );

  if (
    !result.ok ||
    result.rowCount !== 1 ||
    !result.rows[0]
  ) {
    return base;
  }

  const row =
    result.rows[0];

  const persistentReady =
    row.persistent_subject_exists ===
      true &&
    row.persistent_profile_exists ===
      true &&
    row.persistent_credential_exists ===
      true &&
    row.profile_legal_certification_false ===
      true &&
    row.credential_legal_certification_false ===
      true;

  return {
    ...base,

    ok:
      persistentReady,

    status:
      persistentReady
        ? "PASS"
        : "FAIL_CLOSED",

    persistentSubjectExists:
      row.persistent_subject_exists ===
        true,

    persistentProfileExists:
      row.persistent_profile_exists ===
        true,

    persistentCredentialExists:
      row.persistent_credential_exists ===
        true,

    profileLegalCertificationFalse:
      row.profile_legal_certification_false ===
        true,

    credentialLegalCertificationFalse:
      row.credential_legal_certification_false ===
        true,

    readyForGovernedGrantIssuance:
      persistentReady,

    legalCertification:
      false
  };
}

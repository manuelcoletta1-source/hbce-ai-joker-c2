import {
  clearProcessIprAuthStore,
  getProcessIprAuthStore,
  synchronizeIprAuthRecoveryProcessFallback,
  type IprAuthStoredCredential
} from "@/lib/ipr-session-store";


const HUMAN_IPR_A =
  "IPR-AAAAAAAAAAAA";

const HUMAN_IPR_B =
  "IPR-BBBBBBBBBBBB";

const SESSION_A1_TOKEN =
  "HBCE-RECOVERY-TEST-SESSION-A1";

const SESSION_A2_TOKEN =
  "HBCE-RECOVERY-TEST-SESSION-A2";

const SESSION_A_REVOKED_TOKEN =
  "HBCE-RECOVERY-TEST-SESSION-A-REVOKED";

const SESSION_B_TOKEN =
  "HBCE-RECOVERY-TEST-SESSION-B";


function futureExpiry(): string {
  return new Date(
    Date.now() +
      60 * 60 * 1000
  ).toISOString();
}


function createCredential(
  humanIpr: string,
  passwordHash: string
) {
  return getProcessIprAuthStore()
    .setCredential({
      humanIpr,
      passwordAlgorithm:
        "scrypt-sha256-v1",
      passwordHash,
      passwordSalt:
        "0123456789abcdef".repeat(4),
      passwordKeyLength:
        64,
      credentialPayload: {
        source:
          "HBCE_RECOVERY_PROCESS_FALLBACK_TEST",
        legalCertification:
          false
      }
    });
}


beforeEach(() => {
  clearProcessIprAuthStore();
});


afterEach(() => {
  clearProcessIprAuthStore();
});


describe(
  "HBCE recovery process fallback synchronization",
  () => {

    it(
      "replaces only the recovered subject credential and revokes all and only its active process sessions",
      () => {

        const store =
          getProcessIprAuthStore();

        const oldCredentialA =
          createCredential(
            HUMAN_IPR_A,
            "OLD_HASH_A"
          );

        const oldCredentialB =
          createCredential(
            HUMAN_IPR_B,
            "OLD_HASH_B"
          );

        const sessionA1 =
          store.createSession({
            sessionId:
              "IPR-SESSION-RECOVERY-A1",
            humanIpr:
              HUMAN_IPR_A,
            token:
              SESSION_A1_TOKEN,
            expiresAt:
              futureExpiry()
          });

        const sessionA2 =
          store.createSession({
            sessionId:
              "IPR-SESSION-RECOVERY-A2",
            humanIpr:
              HUMAN_IPR_A,
            token:
              SESSION_A2_TOKEN,
            expiresAt:
              futureExpiry()
          });

        const alreadyRevokedA =
          store.createSession({
            sessionId:
              "IPR-SESSION-RECOVERY-A3",
            humanIpr:
              HUMAN_IPR_A,
            token:
              SESSION_A_REVOKED_TOKEN,
            status:
              "REVOKED",
            revokedAt:
              new Date().toISOString(),
            expiresAt:
              futureExpiry()
          });

        const sessionB =
          store.createSession({
            sessionId:
              "IPR-SESSION-RECOVERY-B1",
            humanIpr:
              HUMAN_IPR_B,
            token:
              SESSION_B_TOKEN,
            expiresAt:
              futureExpiry()
          });

        expect(
          store.verifySessionToken(
            SESSION_A1_TOKEN
          ).authenticated
        ).toBe(true);

        expect(
          store.verifySessionToken(
            SESSION_A2_TOKEN
          ).authenticated
        ).toBe(true);

        expect(
          store.verifySessionToken(
            SESSION_B_TOKEN
          ).authenticated
        ).toBe(true);

        const recoveredCredential:
          IprAuthStoredCredential = {
            ...oldCredentialA,

            passwordHash:
              "NEW_RECOVERY_HASH_A",

            passwordSalt:
              "abcdef0123456789".repeat(4),

            passwordUpdatedAt:
              new Date().toISOString(),

            passwordLastVerifiedAt:
              null,

            failedAttempts:
              0,

            lockedUntil:
              null,

            credentialPayload: {
              source:
                "HBCE_PASSWORD_RECOVERY",
              legalCertification:
                false
            },

            legalCertification:
              false
          };

        const result =
          synchronizeIprAuthRecoveryProcessFallback(
            recoveredCredential
          );

        expect(result).toEqual({
          humanIpr:
            HUMAN_IPR_A,
          credentialReplaced:
            true,
          revokedSessions:
            2,
          databaseWritePerformed:
            false,
          sessionCreationAuthority:
            false,
          runtimeAuthorizationAuthority:
            false,
          legalCertification:
            false
        });

        const storedCredentialA =
          store.getCredential(
            HUMAN_IPR_A
          );

        const storedCredentialB =
          store.getCredential(
            HUMAN_IPR_B
          );

        expect(
          storedCredentialA
            ?.passwordHash
        ).toBe(
          "NEW_RECOVERY_HASH_A"
        );

        expect(
          storedCredentialA
            ?.failedAttempts
        ).toBe(0);

        expect(
          storedCredentialA
            ?.lockedUntil
        ).toBeNull();

        expect(
          storedCredentialB
            ?.passwordHash
        ).toBe(
          oldCredentialB.passwordHash
        );

        const verifiedA1 =
          store.verifySessionToken(
            SESSION_A1_TOKEN
          );

        const verifiedA2 =
          store.verifySessionToken(
            SESSION_A2_TOKEN
          );

        const verifiedAlreadyRevokedA =
          store.verifySessionToken(
            SESSION_A_REVOKED_TOKEN
          );

        const verifiedB =
          store.verifySessionToken(
            SESSION_B_TOKEN
          );

        expect(
          verifiedA1.authenticated
        ).toBe(false);

        expect(
          verifiedA1.reason
        ).toBe(
          "SESSION_REVOKED"
        );

        expect(
          verifiedA2.authenticated
        ).toBe(false);

        expect(
          verifiedA2.reason
        ).toBe(
          "SESSION_REVOKED"
        );

        expect(
          verifiedAlreadyRevokedA
            .authenticated
        ).toBe(false);

        expect(
          verifiedAlreadyRevokedA
            .reason
        ).toBe(
          "SESSION_REVOKED"
        );

        expect(
          verifiedB.authenticated
        ).toBe(true);

        expect(
          sessionA1.humanIpr
        ).toBe(
          HUMAN_IPR_A
        );

        expect(
          sessionA2.humanIpr
        ).toBe(
          HUMAN_IPR_A
        );

        expect(
          alreadyRevokedA.humanIpr
        ).toBe(
          HUMAN_IPR_A
        );

        expect(
          sessionB.humanIpr
        ).toBe(
          HUMAN_IPR_B
        );
      }
    );


    it(
      "fails closed on a recovered credential with non-reset login failure state and performs no fallback mutation",
      () => {

        const store =
          getProcessIprAuthStore();

        const original =
          createCredential(
            HUMAN_IPR_A,
            "ORIGINAL_HASH_A"
          );

        store.createSession({
          sessionId:
            "IPR-SESSION-RECOVERY-FAIL-A1",
          humanIpr:
            HUMAN_IPR_A,
          token:
            SESSION_A1_TOKEN,
          expiresAt:
            futureExpiry()
        });

        const invalidRecovered:
          IprAuthStoredCredential = {
            ...original,

            passwordHash:
              "SHOULD_NOT_BE_PERSISTED",

            failedAttempts:
              1,

            lockedUntil:
              null,

            legalCertification:
              false
          };

        expect(
          () =>
            synchronizeIprAuthRecoveryProcessFallback(
              invalidRecovered
            )
        ).toThrow(
          "IPR_AUTH_RECOVERY_CREDENTIAL_STATE_INVALID"
        );

        expect(
          store.getCredential(
            HUMAN_IPR_A
          )?.passwordHash
        ).toBe(
          "ORIGINAL_HASH_A"
        );

        expect(
          store.verifySessionToken(
            SESSION_A1_TOKEN
          ).authenticated
        ).toBe(true);
      }
    );


    it(
      "fails closed before mutation when legal certification boundary is violated",
      () => {

        const store =
          getProcessIprAuthStore();

        const original =
          createCredential(
            HUMAN_IPR_A,
            "ORIGINAL_HASH_A"
          );

        store.createSession({
          sessionId:
            "IPR-SESSION-RECOVERY-LEGAL-A1",
          humanIpr:
            HUMAN_IPR_A,
          token:
            SESSION_A1_TOKEN,
          expiresAt:
            futureExpiry()
        });

        const invalidRecovered = {
          ...original,

          passwordHash:
            "FORBIDDEN_HASH",

          legalCertification:
            true
        } as unknown as
          IprAuthStoredCredential;

        expect(
          () =>
            synchronizeIprAuthRecoveryProcessFallback(
              invalidRecovered
            )
        ).toThrow(
          "IPR_AUTH_RECOVERY_LEGAL_CERTIFICATION_BOUNDARY_VIOLATED"
        );

        expect(
          store.getCredential(
            HUMAN_IPR_A
          )?.passwordHash
        ).toBe(
          "ORIGINAL_HASH_A"
        );

        expect(
          store.verifySessionToken(
            SESSION_A1_TOKEN
          ).authenticated
        ).toBe(true);
      }
    );
  }
);

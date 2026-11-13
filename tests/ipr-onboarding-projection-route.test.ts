import {
  describe,
  expect,
  it,
} from "vitest";

import {
  existsSync,
  readFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";


const ROUTE =
  resolve(
    process.cwd(),
    "app/api/internal/ipr/onboarding-projection/route.ts",
  );


function source(): string {
  expect(
    existsSync(ROUTE),
    "WP02 composition route must exist",
  ).toBe(true);

  return readFileSync(
    ROUTE,
    "utf8",
  );
}


describe(
  "WP02 internal IPR onboarding projection route contract",
  () => {
    it(
      "exists only as the dedicated internal POST projection boundary",
      () => {
        const text =
          source();

        expect(
          text,
        ).toContain(
          '"/api/internal/ipr/onboarding-projection"',
        );

        expect(
          text,
        ).toContain(
          '"internal:ipr-onboarding:project"',
        );

        expect(
          text,
        ).toMatch(
          /export\s+async\s+function\s+POST/,
        );
      },
    );


    it(
      "authenticates the service credential before trusted ingress",
      () => {
        const text =
          source();

        const auth =
          text.indexOf(
            "validateHbceApiCredential",
          );

        const ingress =
          text.indexOf(
            "validateIprOnboardingTrustedIngress",
          );

        expect(auth).toBeGreaterThanOrEqual(0);
        expect(ingress).toBeGreaterThan(auth);
      },
    );


    it(
      "uses one SERIALIZABLE transaction for replay, policy, profile persistence and persisted marker",
      () => {
        const text =
          source();

        expect(
          text,
        ).toContain(
          "withHbceDatabaseTransaction",
        );

        expect(
          text,
        ).toMatch(
          /isolationLevel\s*:\s*"SERIALIZABLE"/,
        );

        expect(
          text,
        ).toContain(
          "evaluateAndRecordIprOnboardingReplay",
        );

        expect(
          text,
        ).toContain(
          "resolveIprOnboardingPreProfileAuthorityPolicy",
        );

        expect(
          text,
        ).toContain(
          "persistIprAccountProfileInTransaction",
        );

        expect(
          text,
        ).toContain(
          "markIprOnboardingReplayProfilePersisted",
        );

        const replay =
          text.indexOf(
            "await evaluateAndRecordIprOnboardingReplay",
          );

        const policy =
          text.indexOf(
            "await resolveIprOnboardingPreProfileAuthorityPolicy",
          );

        const persistence =
          text.indexOf(
            "await persistIprAccountProfileInTransaction",
          );

        const marker =
          text.indexOf(
            "await markIprOnboardingReplayProfilePersisted",
          );

        expect(policy).toBeGreaterThan(replay);
        expect(persistence).toBeGreaterThan(policy);
        expect(marker).toBeGreaterThan(persistence);
      },
    );


    it(
      "does not create browser, session or runtime authority",
      () => {
        const text =
          source();

        expect(
          text,
        ).not.toMatch(
          /createAuthenticatedSession/,
        );

        expect(
          text,
        ).not.toMatch(
          /Set-Cookie/i,
        );

        expect(
          text,
        ).not.toMatch(
          /cookies\s*\(/,
        );

        expect(
          text,
        ).not.toMatch(
          /runtimeAuthorized\s*:\s*true/,
        );

        expect(
          text,
        ).not.toMatch(
          /sessionAuthenticated\s*:\s*true/,
        );

        expect(
          text,
        ).not.toMatch(
          /legalCertification\s*:\s*true/,
        );
      },
    );


    it(
      "does not issue or mutate pre-profile authority policy",
      () => {
        const text =
          source();

        expect(
          text,
        ).not.toMatch(
          /INSERT\s+INTO\s+ipr_onboarding_pre_profile_policy_records/i,
        );

        expect(
          text,
        ).not.toMatch(
          /UPDATE\s+ipr_onboarding_pre_profile_policy_records/i,
        );

        expect(
          text,
        ).not.toMatch(
          /DELETE\s+FROM\s+ipr_onboarding_pre_profile_policy_records/i,
        );
      },
    );


    it(
      "does not import session creation or runtime execution surfaces",
      () => {
        const text =
          source();

        expect(
          text,
        ).not.toMatch(
          /ipr-auth-session/i,
        );

        expect(
          text,
        ).not.toMatch(
          /api\/chat/,
        );

        expect(
          text,
        ).not.toMatch(
          /runtime\/execute/,
        );
      },
    );
  },
);

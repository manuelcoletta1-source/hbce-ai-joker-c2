import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import { NextRequest } from "next/server";

import {
  getProcessIprAuthStore
} from "@/lib/ipr-session-store";

import {
  getProcessIprAccountStore
} from "@/lib/ipr-account-store";

const {
  mockWithHbceDatabaseTransaction
} = vi.hoisted(() => ({
  mockWithHbceDatabaseTransaction:
    vi.fn()
}));

vi.mock(
  "@/lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      mockWithHbceDatabaseTransaction
  })
);

import { POST } from "./route";

const AUTH_STORE_KIND_ENV =
  "IPR_AUTH_STORE_KIND";

const ACCOUNT_STORE_KIND_ENV =
  "IPR_ACCOUNT_STORE_KIND";

const BOOTSTRAP_ENABLED_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_ENABLED";

const BOOTSTRAP_SECRET_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_SECRET";

const CANONICAL_HUMAN_IPR_ENV =
  "HBCE_RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR";

const CERTIFICATE_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_CERTIFICATE_ID";

const originalEnv = {
  authStoreKind:
    process.env[AUTH_STORE_KIND_ENV],
  accountStoreKind:
    process.env[ACCOUNT_STORE_KIND_ENV],
  bootstrapEnabled:
    process.env[BOOTSTRAP_ENABLED_ENV],
  bootstrapSecret:
    process.env[BOOTSTRAP_SECRET_ENV],
  canonicalHumanIpr:
    process.env[CANONICAL_HUMAN_IPR_ENV],
  certificateId:
    process.env[CERTIFICATE_ID_ENV]
};

function restoreEnv(
  key: string,
  value: string | undefined
) {
  if (typeof value === "string") {
    process.env[key] = value;
  } else {
    delete process.env[key];
  }
}

beforeEach(() => {
  process.env[AUTH_STORE_KIND_ENV] =
    "PROCESS_AUTH_STORE_MVP";

  process.env[ACCOUNT_STORE_KIND_ENV] =
    "PROCESS_ACCOUNT_STORE_MVP";

  process.env[BOOTSTRAP_ENABLED_ENV] =
    "true";

  process.env[BOOTSTRAP_SECRET_ENV] =
    "Expected-Canonical-Secret-2026";

  process.env[CANONICAL_HUMAN_IPR_ENV] =
    "IPR-3";

  process.env[CERTIFICATE_ID_ENV] =
    "CERTIFICATE-09-OPERATIONAL-TEST";

  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();

  mockWithHbceDatabaseTransaction
    .mockReset();
});

afterEach(() => {
  restoreEnv(
    AUTH_STORE_KIND_ENV,
    originalEnv.authStoreKind
  );

  restoreEnv(
    ACCOUNT_STORE_KIND_ENV,
    originalEnv.accountStoreKind
  );

  restoreEnv(
    BOOTSTRAP_ENABLED_ENV,
    originalEnv.bootstrapEnabled
  );

  restoreEnv(
    BOOTSTRAP_SECRET_ENV,
    originalEnv.bootstrapSecret
  );

  restoreEnv(
    CANONICAL_HUMAN_IPR_ENV,
    originalEnv.canonicalHumanIpr
  );

  restoreEnv(
    CERTIFICATE_ID_ENV,
    originalEnv.certificateId
  );

  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();
});

describe(
  "POST /api/auth/ipr-login transaction mapping",
  () => {
    it(
      "maps canonical credential race conflict to 409",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockResolvedValue({
            ok: false,
            transactionId:
              "HBCE-TX-TEST-CREDENTIAL-RACE",
            state: "ROLLED_BACK",
            startedAt:
              "2026-08-10T13:23:00.000Z",
            completedAt:
              "2026-08-10T13:23:00.001Z",
            durationMs: 1,
            error:
              "IPR_CANONICAL_BOOTSTRAP_ALREADY_COMPLETED",
            rollbackError: null
          });

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          409
        );

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          reason:
            "IPR_CANONICAL_BOOTSTRAP_ALREADY_COMPLETED",
          detail:
            "A persistent credential already exists for the canonical Human IPR. Bootstrap did not modify it.",
          legalCertification: false
        });

        const [
          operation,
          options
        ] =
          mockWithHbceDatabaseTransaction
            .mock.calls[0];

        expect(
          typeof operation
        ).toBe("function");

        expect(options).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",
          readOnly: false,
          statementTimeoutMs:
            30000,
          lockTimeoutMs:
            10000,
          idleInTransactionSessionTimeoutMs:
            30000
        });
      }
    );

    it(
      "maps canonical profile race conflict to 409",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockResolvedValue({
            ok: false,
            transactionId:
              "HBCE-TX-TEST-PROFILE-RACE",
            state: "ROLLED_BACK",
            startedAt:
              "2026-08-10T13:27:00.000Z",
            completedAt:
              "2026-08-10T13:27:00.001Z",
            durationMs: 1,
            error:
              "IPR_CANONICAL_BOOTSTRAP_PROFILE_ALREADY_EXISTS",
            rollbackError: null
          });

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          409
        );

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          reason:
            "IPR_CANONICAL_BOOTSTRAP_PROFILE_ALREADY_EXISTS",
          detail:
            "A persistent canonical Human IPR profile already exists. The bootstrap transaction was rolled back.",
          legalCertification: false
        });
      }
    );
  }
);

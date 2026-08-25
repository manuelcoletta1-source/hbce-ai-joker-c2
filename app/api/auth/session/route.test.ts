import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it
} from "vitest";

import { NextRequest } from "next/server";

import {
  IPR_AUTH_COOKIE_NAME
} from "@/lib/ipr-auth";

import {
  getProcessIprAuthStore
} from "@/lib/ipr-session-store";

import {
  getProcessIprAccountStore
} from "@/lib/ipr-account-store";

import { GET } from "./route";

const AUTH_STORE_KIND_ENV =
  "IPR_AUTH_STORE_KIND";

const ACCOUNT_STORE_KIND_ENV =
  "IPR_ACCOUNT_STORE_KIND";

const originalAuthStoreKind =
  process.env[AUTH_STORE_KIND_ENV];

const originalAccountStoreKind =
  process.env[ACCOUNT_STORE_KIND_ENV];

function restoreEnv(
  name: string,
  value: string | undefined
) {
  if (typeof value === "string") {
    process.env[name] = value;
  } else {
    delete process.env[name];
  }
}

function buildSessionRequest(
  token?: string
): NextRequest {
  return new NextRequest(
    "http://localhost/api/auth/session",
    token
      ? {
          method: "GET",
          headers: {
            cookie:
              `${IPR_AUTH_COOKIE_NAME}=${token}`
          }
        }
      : {
          method: "GET"
        }
  );
}

async function createTestSession(
  token: string
) {
  return getProcessIprAuthStore()
    .createSessionAsync({
      token,
      humanIpr: "IPR-3",
      runtimeIpr: "IPR-AI-0001",
      expiresAt:
        "2099-01-19T15:30:00.000Z",
      deviceLabel:
        "A013-M036 session presence test",
      sessionPayload: {
        source:
          "A013-M036_SESSION_PRESENCE_TEST",
        legalCertification: false
      }
    });
}

beforeEach(() => {
  process.env[AUTH_STORE_KIND_ENV] =
    "PROCESS_AUTH_STORE_MVP";

  process.env[ACCOUNT_STORE_KIND_ENV] =
    "PROCESS_ACCOUNT_STORE_MVP";

  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();
});

afterEach(() => {
  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();

  restoreEnv(
    AUTH_STORE_KIND_ENV,
    originalAuthStoreKind
  );

  restoreEnv(
    ACCOUNT_STORE_KIND_ENV,
    originalAccountStoreKind
  );
});

describe(
  "GET /api/auth/session session presence contract",
  () => {
    it(
      "reports no authenticated session when cookie is missing",
      async () => {
        const response =
          await GET(buildSessionRequest());

        const payload =
          await response.json();

        expect(response.status).toBe(401);

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          sessionAuthenticated: false,
          reason: "SESSION_COOKIE_MISSING",
          access: {
            decision:
              "AUTHENTICATION_REQUIRED"
          },
          legalCertification: false
        });
      }
    );

    it(
      "preserves session presence when profile is missing",
      async () => {
        const token =
          `IPRSESS_${"B".repeat(64)}`;

        await createTestSession(token);

        const verification =
          await getProcessIprAuthStore()
            .verifySessionTokenAsync(token);

        expect(verification).toMatchObject({
          ok: true,
          authenticated: true,
          reason: "SESSION_ACTIVE"
        });

        const response =
          await GET(
            buildSessionRequest(token)
          );

        const payload =
          await response.json();

        expect(response.status).toBe(409);

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          sessionAuthenticated: true,
          reason:
            "IPR_ACCOUNT_PROFILE_NOT_FOUND",
          session: {
            humanIpr: "IPR-3",
            runtimeIpr: "IPR-AI-0001",
            status: "ACTIVE"
          },
          access: {
            decision:
              "ACCOUNT_PROFILE_REQUIRED",
            identityBinding:
              "SESSION_WITHOUT_IPR_ACCOUNT_PROFILE"
          },
          legalCertification: false
        });

        expect(payload).not.toHaveProperty(
          "authorized"
        );
      }
    );

    it(
      "reports authenticated and runtime-authorized state for complete profile",
      async () => {
        const token =
          `IPRSESS_${"C".repeat(64)}`;

        await createTestSession(token);

        await getProcessIprAccountStore()
          .upsertProfileAsync({
            humanIpr: "IPR-3",
            certificateId:
              "CERTIFICATE-A013-M036",
            accountId:
              "ACCOUNT-IPR-3-A013-M036",
            tenantId:
              "HBCE-TENANT-TEST",
            workspaceId:
              "HBCE-WORKSPACE-TEST",
            certificateStatus:
              "ACTIVE",
            certificateScope: [
              "JOKER_C2_ACCESS"
            ],
            accessDecision:
              "ACCESS_GRANTED",
            accessScope:
              "JOKER_C2_ACCESS",
            identityBinding:
              "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
            matrixState:
              "MATRIX_ACTIVE",
            semanticMemoryScope:
              "IPR_BOUND",
            source:
              "A013-M036_SESSION_PRESENCE_TEST",
            profilePayload: {
              legalCertification: false
            }
          });

        const response =
          await GET(
            buildSessionRequest(token)
          );

        const payload =
          await response.json();

        expect(response.status).toBe(200);

        expect(payload).toMatchObject({
          ok: true,
          authenticated: true,
          sessionAuthenticated: true,
          authorized: true,
          reason: "SESSION_ACTIVE",
          session: {
            humanIpr: "IPR-3",
            runtimeIpr: "IPR-AI-0001",
            status: "ACTIVE"
          },
          accountProfile: {
            humanIpr: "IPR-3",
            tenantId:
              "HBCE-TENANT-TEST",
            workspaceId:
              "HBCE-WORKSPACE-TEST",
            accessDecision:
              "ACCESS_GRANTED",
            matrixState:
              "MATRIX_ACTIVE",
            semanticMemoryScope:
              "IPR_BOUND"
          },
          access: {
            decision: "ACCESS_GRANTED",
            identityBinding:
              "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
          },
          memory: {
            expectedAuthority:
              "SERVER_RUNTIME_VALIDATED",
            expectedScope:
              "IPR_BOUND"
          },
          legalCertification: false
        });
      }
    );
  }
);

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential
} from "@/lib/api-auth";

import {
  IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT,
  IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE,
  IPR_ONBOARDING_TRUSTED_INGRESS_VERSION
} from "@/lib/ipr-onboarding-trusted-ingress";

vi.mock("@/lib/api-auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/api-auth")>(
      "@/lib/api-auth"
    );

  return {
    ...actual,
    validateHbceApiCredential: vi.fn(),
    buildHbceApiAuthErrorBody: vi.fn()
  };
});

import { POST } from "./route";

const grantedAuth = {
  ok: true,
  status: "API_AUTH_GRANTED",
  credential: {
    credentialId: "CRED-ONBOARDING-001",
    tenantId: "TENANT-001",
    workspaceId: "WORKSPACE-001",
    scopes: [
      IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
    ]
  },
  endpoint:
    IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT,
  method: "POST",
  requiredScopes: [
    IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
  ]
} as any;

const deniedAuth = {
  ok: false,
  status: "API_AUTH_DENIED",
  failReason: "API_CREDENTIAL_REQUIRED",
  httpStatus: 401
} as any;

function validEnvelope() {
  return {
    version:
      IPR_ONBOARDING_TRUSTED_INGRESS_VERSION,
    issuedAt: new Date().toISOString(),
    nonce: "NONCE-ONBOARDING-0001",
    evidence: {
      iprId: "IPR-TEST-001",
      subjectId: "SUBJECT-TEST-001",
      iprStatus: "verified",
      iprCardStatus: "issued",
      certificateStatus: "active",
      revocationState: "clear",
      jokerC2AccessStatus: "enabled",
      latestPhaseNumber: 9,
      latestPhaseCertificateHash:
        "sha256:phase-test",
      certificateId: "CERT-TEST-001",
      certificateHash: "sha256:cert-test",
      certificateScope: [
        "JOKER_C2_ACCESS"
      ],
      cardSerial: "CARD-TEST-001"
    }
  };
}

function requestFor(body: unknown) {
  return new NextRequest(
    "http://localhost/api/internal/ipr/onboarding-projection",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(
    validateHbceApiCredential
  ).mockResolvedValue(grantedAuth);

  vi.mocked(
    buildHbceApiAuthErrorBody
  ).mockReturnValue({
    ok: false,
    status: "API_AUTH_DENIED",
    failReason:
      "API_CREDENTIAL_REQUIRED",
    legalCertification: false
  });
});

describe(
  "POST /api/internal/ipr/onboarding-projection",
  () => {
    it(
      "fails closed when service authentication is denied",
      async () => {
        vi.mocked(
          validateHbceApiCredential
        ).mockResolvedValueOnce(deniedAuth);

        const response =
          await POST(
            requestFor(validEnvelope())
          );

        expect(response.status).toBe(401);
        expect(
          await response.json()
        ).toMatchObject({
          ok: false,
          status: "API_AUTH_DENIED",
          failReason:
            "API_CREDENTIAL_REQUIRED"
        });
      }
    );

    it(
      "accepts transport evidence without granting authority",
      async () => {
        const response =
          await POST(
            requestFor(validEnvelope())
          );

        const payload =
          await response.json();

        expect(response.status).toBe(202);

        expect(payload).toMatchObject({
          ok: true,
          status:
            "TRUSTED_INGRESS_VALIDATED",
          runtimeAuthorized: false,
          sessionAuthenticated: false,
          profilePersistenceAuthorized: false,
          authority:
            "TRANSPORT_EVIDENCE_ONLY",
          nextAction:
            "REPLAY_AND_SERVER_PROJECTION_NOT_YET_EXECUTED",
          legalCertification: false
        });

        expect(payload).not.toHaveProperty(
          "verifiedSubject"
        );
      }
    );

    it(
      "rejects authority-bearing client material",
      async () => {
        const envelope = validEnvelope();

        const response =
          await POST(
            requestFor({
              ...envelope,
              evidence: {
                ...envelope.evidence,
                verifiedSubject: true
              }
            })
          );

        expect(response.status).toBe(400);
        expect(
          await response.json()
        ).toMatchObject({
          ok: false,
          reason:
            "CLIENT_AUTHORITY_FIELD_FORBIDDEN",
          runtimeAuthorized: false,
          sessionAuthenticated: false,
          profilePersistenceAuthorized: false
        });
      }
    );

    it(
      "rejects malformed JSON before projection",
      async () => {
        const request =
          new NextRequest(
            "http://localhost/api/internal/ipr/onboarding-projection",
            {
              method: "POST",
              body: "{"
            }
          );

        const response =
          await POST(request);

        expect(response.status).toBe(400);
        expect(
          await response.json()
        ).toMatchObject({
          ok: false,
          reason:
            "INGRESS_ENVELOPE_REQUIRED",
          authority:
            "TRANSPORT_EVIDENCE_ONLY",
          runtimeAuthorized: false,
          sessionAuthenticated: false,
          profilePersistenceAuthorized: false
        });
      }
    );
  }
);

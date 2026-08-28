import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { getProcessIprAuthStore } from "@/lib/ipr-session-store";
import { getProcessIprAccountStore } from "@/lib/ipr-account-store";

import { GET, POST } from "./route";

const AUTH_STORE_KIND_ENV =
  "IPR_AUTH_STORE_KIND";

const ACCOUNT_STORE_KIND_ENV =
  "IPR_ACCOUNT_STORE_KIND";

const BOOTSTRAP_ENABLED_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_ENABLED";

const BOOTSTRAP_SECRET_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_SECRET";

const originalAuthStoreKind =
  process.env[AUTH_STORE_KIND_ENV];

const originalAccountStoreKind =
  process.env[ACCOUNT_STORE_KIND_ENV];

const originalBootstrapEnabled =
  process.env[BOOTSTRAP_ENABLED_ENV];

const CANONICAL_HUMAN_IPR_ENV =
  "HBCE_RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR";

const originalBootstrapSecret =
  process.env[BOOTSTRAP_SECRET_ENV];

const CERTIFICATE_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_CERTIFICATE_ID";

const TENANT_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_TENANT_ID";

const WORKSPACE_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_WORKSPACE_ID";

const originalCanonicalHumanIpr =
  process.env[CANONICAL_HUMAN_IPR_ENV];

const originalCertificateId =
  process.env[CERTIFICATE_ID_ENV];

const originalTenantId =
  process.env[TENANT_ID_ENV];

const originalWorkspaceId =
  process.env[WORKSPACE_ID_ENV];

beforeEach(() => {
  process.env[TENANT_ID_ENV] =
    "HBCE-TENANT-TEST";

  process.env[WORKSPACE_ID_ENV] =
    "HBCE-WORKSPACE-TEST";
});

afterEach(() => {
  if (typeof originalBootstrapEnabled === "string") {
    process.env[BOOTSTRAP_ENABLED_ENV] =
      originalBootstrapEnabled;
  } else {
    delete process.env[BOOTSTRAP_ENABLED_ENV];
  }

  if (typeof originalBootstrapSecret === "string") {
    process.env[BOOTSTRAP_SECRET_ENV] =
      originalBootstrapSecret;
  } else {
    delete process.env[BOOTSTRAP_SECRET_ENV];
  }

  if (typeof originalCanonicalHumanIpr === "string") {
    process.env[CANONICAL_HUMAN_IPR_ENV] =
      originalCanonicalHumanIpr;
  } else {
    delete process.env[CANONICAL_HUMAN_IPR_ENV];
  }

  if (typeof originalCertificateId === "string") {
    process.env[CERTIFICATE_ID_ENV] =
      originalCertificateId;
  } else {
    delete process.env[CERTIFICATE_ID_ENV];
  }

  if (typeof originalTenantId === "string") {
    process.env[TENANT_ID_ENV] =
      originalTenantId;
  } else {
    delete process.env[TENANT_ID_ENV];
  }

  if (typeof originalWorkspaceId === "string") {
    process.env[WORKSPACE_ID_ENV] =
      originalWorkspaceId;
  } else {
    delete process.env[WORKSPACE_ID_ENV];
  }

  if (typeof originalAuthStoreKind === "string") {
    process.env[AUTH_STORE_KIND_ENV] =
      originalAuthStoreKind;
  } else {
    delete process.env[AUTH_STORE_KIND_ENV];
  }

  if (typeof originalAccountStoreKind === "string") {
    process.env[ACCOUNT_STORE_KIND_ENV] =
      originalAccountStoreKind;
  } else {
    delete process.env[ACCOUNT_STORE_KIND_ENV];
  }

  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();
});

describe("POST /api/auth/ipr-login canonical bootstrap", () => {
  it("fails closed when canonical bootstrap is disabled", async () => {
    delete process.env[BOOTSTRAP_ENABLED_ENV];

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "Canonical-Test-Password-Only-2026!"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(403);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "IPR_CANONICAL_BOOTSTRAP_DISABLED",
      detail: "Canonical Human IPR bootstrap is disabled.",
      legalCertification: false
    });
  });

  it("fails closed when bootstrap secret is not configured", async () => {
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    delete process.env[BOOTSTRAP_SECRET_ENV];

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "Canonical-Test-Password-Only-2026!"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "IPR_CANONICAL_BOOTSTRAP_NOT_CONFIGURED",
      detail:
        "Canonical Human IPR bootstrap secret is not configured.",
      legalCertification: false
    });
  });

  it("fails closed when bootstrap secret is invalid", async () => {
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Wrong-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "Canonical-Test-Password-Only-2026!"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(403);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "IPR_CANONICAL_BOOTSTRAP_SECRET_INVALID",
      detail:
        "Canonical Human IPR bootstrap authorization failed.",
      legalCertification: false
    });
  });

  it("fails closed when canonical runtime authority is misconfigured", async () => {
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";
    process.env[CANONICAL_HUMAN_IPR_ENV] = "IPR-999";

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "Canonical-Test-Password-Only-2026!"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason:
        "IPR_CANONICAL_BOOTSTRAP_AUTHORITY_MISCONFIGURED",
      detail:
        "Canonical runtime Human IPR must resolve to IPR-3.",
      legalCertification: false
    });
  });

  it("fails closed when requested canonical subject does not match", async () => {
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";
    process.env[CANONICAL_HUMAN_IPR_ENV] = "IPR-3";

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-999",
          password: "Canonical-Test-Password-Only-2026!"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(403);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "IPR_CANONICAL_BOOTSTRAP_SUBJECT_MISMATCH",
      legalCertification: false
    });
  });


  it("fails closed when canonical certificate ID is not configured", async () => {
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";
    process.env[CANONICAL_HUMAN_IPR_ENV] = "IPR-3";
    delete process.env[CERTIFICATE_ID_ENV];

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "Canonical-Test-Password-Only-2026!"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason:
        "IPR_CANONICAL_BOOTSTRAP_CERTIFICATE_NOT_CONFIGURED",
      detail:
        "Canonical bootstrap requires an explicit server-side operational certificate ID.",
      legalCertification: false
    });
  });

  it("fails closed when canonical bootstrap password violates policy", async () => {
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";
    process.env[CANONICAL_HUMAN_IPR_ENV] = "IPR-3";
    process.env[CERTIFICATE_ID_ENV] =
      "CERTIFICATE-09-OPERATIONAL-TEST";

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "short"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "IPR_PASSWORD_POLICY_FAILED",
      detail:
        "The supplied password does not satisfy the HBCE IPR password policy.",
      legalCertification: false
    });
  });

  it("fails closed when canonical credential already exists", async () => {
    process.env[AUTH_STORE_KIND_ENV] =
      "PROCESS_AUTH_STORE_MVP";
    process.env[ACCOUNT_STORE_KIND_ENV] =
      "PROCESS_ACCOUNT_STORE_MVP";
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";
    process.env[CANONICAL_HUMAN_IPR_ENV] = "IPR-3";
    process.env[CERTIFICATE_ID_ENV] =
      "CERTIFICATE-09-OPERATIONAL-TEST";

    const authStore = getProcessIprAuthStore();

    authStore.clear();

    await authStore.setCredentialAsync({
      humanIpr: "IPR-3",
      passwordAlgorithm: "test-existing-credential-v1",
      passwordHash: "existing-hash",
      passwordSalt: "existing-salt",
      passwordKeyLength: 64,
      credentialPayload: {
        source: "HBCE_TEST_EXISTING_CREDENTIAL"
      }
    });

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "C4n0nical!ZetaFlux27"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(409);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "IPR_CANONICAL_BOOTSTRAP_ALREADY_COMPLETED",
      detail:
        "A persistent credential already exists for the canonical Human IPR. Bootstrap will not overwrite it.",
      legalCertification: false
    });
  });

  it("fails closed when canonical profile already exists without credential", async () => {
    process.env[AUTH_STORE_KIND_ENV] =
      "PROCESS_AUTH_STORE_MVP";
    process.env[ACCOUNT_STORE_KIND_ENV] =
      "PROCESS_ACCOUNT_STORE_MVP";
    process.env[BOOTSTRAP_ENABLED_ENV] = "true";
    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";
    process.env[CANONICAL_HUMAN_IPR_ENV] = "IPR-3";
    process.env[CERTIFICATE_ID_ENV] =
      "CERTIFICATE-09-OPERATIONAL-TEST";

    const authStore = getProcessIprAuthStore();
    const accountStore = getProcessIprAccountStore();

    authStore.clear();
    accountStore.clear();

    await accountStore.upsertProfileAsync({
      humanIpr: "IPR-3",
      certificateId:
        "CERTIFICATE-09-OPERATIONAL-TEST",
      source: "HBCE_TEST_EXISTING_PROFILE",
      profilePayload: {
        source: "HBCE_TEST_EXISTING_PROFILE",
        legalCertification: false
      }
    });

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "C4n0nical!ZetaFlux27"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(409);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason:
        "IPR_CANONICAL_BOOTSTRAP_PROFILE_ALREADY_EXISTS",
      detail:
        "A persistent canonical Human IPR profile already exists without a bootstrap credential. Manual reconciliation is required.",
      legalCertification: false
    });
  });

});


describe("HBCE password rotation containment", () => {
  it("publishes SET_PASSWORD as disabled fail-closed", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);

    expect(payload.modes).toEqual([
      "LOGIN"
    ]);

    expect(payload.disabledModes).toEqual([
      "SET_PASSWORD"
    ]);

    expect(
      payload.flow.setPassword
    ).toBe(
      "DISABLED_FAIL_CLOSED_PENDING_SERVER_VERIFIED_RECOVERY_AUTHORITY"
    );

    expect(
      payload.legalCertification
    ).toBe(false);
  });

  it(
    "rejects client-crafted SET_PASSWORD without mutating the existing credential",
    async () => {
      process.env[AUTH_STORE_KIND_ENV] =
        "PROCESS_AUTH_STORE_MVP";

      process.env[ACCOUNT_STORE_KIND_ENV] =
        "PROCESS_ACCOUNT_STORE_MVP";

      const authStore =
        getProcessIprAuthStore();

      authStore.clear();

      await authStore.setCredentialAsync({
        humanIpr: "IPR-3",
        passwordAlgorithm:
          "test-existing-credential-v1",
        passwordHash:
          "existing-hash",
        passwordSalt:
          "existing-salt",
        passwordKeyLength:
          64,
        credentialPayload: {
          source:
            "HBCE_TEST_EXISTING_CREDENTIAL"
        }
      });

      const before =
        await authStore.getCredentialAsync(
          "IPR-3"
        );

      expect(before).not.toBeNull();

      const request = new NextRequest(
        "http://localhost/api/auth/ipr-login",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            mode: "SET_PASSWORD",
            humanIpr: "IPR-3",
            password:
              "Attacker-Chosen-Password-2026!",
            iprHandoff: {
              subject: {
                ipr: "IPR-3",
                entity:
                  "CLIENT_ASSERTED_ENTITY"
              },
              certificate: {
                certificateId:
                  "CLIENT_ASSERTED_CERTIFICATE",
                certificateStatus:
                  "ACTIVE",
                certificateScope: [
                  "JOKER_C2_ACCESS"
                ]
              },
              access: {
                scope:
                  "JOKER_C2_ACCESS",
                decision:
                  "ACCESS_GRANTED",
                identityBinding:
                  "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
              },
              matrix: {
                state:
                  "MATRIX_ACTIVE"
              },
              memory: {
                semanticMemoryScope:
                  "IPR_BOUND"
              },
              source:
                "CLIENT_ASSERTED_HANDOFF"
            }
          })
        }
      );

      const response =
        await POST(request);

      const payload =
        await response.json();

      expect(response.status).toBe(503);

      expect(payload).toMatchObject({
        ok: false,
        authenticated: false,
        reason:
          "IPR_PASSWORD_ROTATION_DISABLED",
        legalCertification: false
      });

      expect(
        response.headers.get(
          "set-cookie"
        )
      ).toBeNull();

      const after =
        await authStore.getCredentialAsync(
          "IPR-3"
        );

      expect(after).not.toBeNull();

      expect(
        after?.passwordAlgorithm
      ).toBe(
        before?.passwordAlgorithm
      );

      expect(
        after?.passwordHash
      ).toBe(
        before?.passwordHash
      );

      expect(
        after?.passwordSalt
      ).toBe(
        before?.passwordSalt
      );

      expect(
        after?.failedAttempts
      ).toBe(
        before?.failedAttempts
      );

      expect(
        after?.lockedUntil
      ).toBe(
        before?.lockedUntil
      );
    }
  );
});

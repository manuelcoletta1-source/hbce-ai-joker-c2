import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";

const BOOTSTRAP_ENABLED_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_ENABLED";

const BOOTSTRAP_SECRET_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_SECRET";

const originalBootstrapEnabled =
  process.env[BOOTSTRAP_ENABLED_ENV];

const CANONICAL_HUMAN_IPR_ENV =
  "HBCE_RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR";

const originalBootstrapSecret =
  process.env[BOOTSTRAP_SECRET_ENV];

const originalCanonicalHumanIpr =
  process.env[CANONICAL_HUMAN_IPR_ENV];

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


});

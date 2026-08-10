import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";

const BOOTSTRAP_ENABLED_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_ENABLED";

const originalBootstrapEnabled =
  process.env[BOOTSTRAP_ENABLED_ENV];

afterEach(() => {
  if (typeof originalBootstrapEnabled === "string") {
    process.env[BOOTSTRAP_ENABLED_ENV] =
      originalBootstrapEnabled;
  } else {
    delete process.env[BOOTSTRAP_ENABLED_ENV];
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
});

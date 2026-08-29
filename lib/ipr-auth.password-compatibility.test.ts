import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  hashIprPassword,
  verifyIprPassword
} from "./ipr-auth";

describe("HBCE IPR password algorithm compatibility", () => {
  it("produces scrypt-sha256-v1 credentials compatible with the login-route semantics", async () => {
    const humanIpr = "IPR-123456789ABC";
    const password =
      "Recovery-Compatibility-2026!A9";

    const credential =
      await hashIprPassword({
        humanIpr,
        password,
        now: "2026-08-29T00:00:00.000Z"
      });

    const expectedHash = scryptSync(
      password,
      credential.passwordSalt,
      credential.passwordKeyLength
    ).toString("hex");

    expect(
      credential.passwordAlgorithm
    ).toBe("scrypt-sha256-v1");

    expect(
      credential.passwordHash.toLowerCase()
    ).toBe(expectedHash.toLowerCase());

    expect(
      credential.humanIpr
    ).toBe(humanIpr);
  });

  it("accepts an existing scrypt-sha256-v1 credential produced with the login-route semantics", async () => {
    const humanIpr = "IPR-123456789ABC";
    const password =
      "Recovery-Compatibility-2026!A9";

    /*
     * Historical / production LOGIN semantics:
     *
     *   scrypt(password, salt, keyLength)
     *
     * The algorithm identifier is:
     *
     *   scrypt-sha256-v1
     *
     * Recovery must remain compatible with credentials
     * carrying this existing algorithm identifier.
     */
    const passwordSalt =
      "00112233445566778899aabbccddeeff0011223344556677";

    const passwordKeyLength = 64;

    const passwordHash = scryptSync(
      password,
      passwordSalt,
      passwordKeyLength
    ).toString("hex");

    const result = await verifyIprPassword({
      humanIpr,
      password,
      credential: {
        humanIpr,
        passwordAlgorithm:
          "scrypt-sha256-v1",
        passwordHash,
        passwordSalt,
        passwordKeyLength,
        createdAt:
          "2026-08-29T00:00:00.000Z",
        updatedAt:
          "2026-08-29T00:00:00.000Z"
      }
    });

    expect(result).toMatchObject({
      ok: true,
      humanIpr,
      reason: "PASSWORD_VERIFIED"
    });
  });
});

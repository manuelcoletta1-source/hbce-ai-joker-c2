import {
  describe,
  expect,
  it
} from "vitest";

import {
  NextRequest
} from "next/server";

import {
  POST
} from "./route";


describe(
  "HBCE auth logout contract",
  () => {

    it(
      "keeps legalCertification false explicitly in the public response",
      async () => {

        const request =
          new NextRequest(
            "https://hbce.example/api/auth/logout",
            {
              method: "POST"
            }
          );

        const response =
          await POST(
            request
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(200);

        expect(
          body.ok
        ).toBe(true);

        expect(
          body.authenticated
        ).toBe(false);

        expect(
          body.reason
        ).toBe(
          "SESSION_COOKIE_MISSING"
        );

        expect(
          body.legalCertification
        ).toBe(false);

        expect(
          body.boundary.legalCertification
        ).toBe(false);
      }
    );
  }
);

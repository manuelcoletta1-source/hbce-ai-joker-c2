import { describe, expect, it } from "vitest";

import { getRequiredScopesForEndpoint } from "./api-auth";

describe("HBCE API auth runtime execute scope catalog", () => {
  it("maps POST exact runtime execute endpoint to v1:runtime:execute", () => {
    expect(
      getRequiredScopesForEndpoint("/api/v1/runtime/execute", "POST")
    ).toEqual(["v1:runtime:execute"]);
  });

  it("maps POST trailing-slash runtime execute endpoint to v1:runtime:execute", () => {
    expect(
      getRequiredScopesForEndpoint("/api/v1/runtime/execute/", "POST")
    ).toEqual(["v1:runtime:execute"]);
  });

  it("does not map GET runtime execute endpoint", () => {
    expect(
      getRequiredScopesForEndpoint("/api/v1/runtime/execute", "GET")
    ).toEqual([]);
  });

  it("preserves the existing GET health mapping", () => {
    expect(
      getRequiredScopesForEndpoint("/api/v1/health", "GET")
    ).toEqual(["v1:health:read"]);
  });
});

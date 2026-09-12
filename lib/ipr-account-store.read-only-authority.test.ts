import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  configured: vi.fn(),
  describe: vi.fn(),
  normal: vi.fn(),
  readOnly: vi.fn()
}));

vi.mock("@/lib/ipr-database", () => ({
  isHbceDatabaseConfigured: mocks.configured,
  describeDefaultHbceDatabase: mocks.describe,
  queryHbceDatabase: mocks.normal,
  queryHbceDatabaseWithoutSchemaInitialization: mocks.readOnly
}));

import { getDatabasePersistentIprAccountProfileReadOnly } from "@/lib/ipr-account-store";

const row = {
  human_ipr: "IPR-3",
  tenant_id: "HBCE-TENANT-TEST",
  workspace_id: "HBCE-WORKSPACE-TEST",
  account_id: "HBCE-ACCOUNT-TEST",
  entity: "HUMAN",
  subject_kind: "HUMAN",
  certificate_id: "HBCE-CERTIFICATE-TEST",
  certificate_kind: "IPR",
  certificate_status: "ACTIVE",
  certificate_scope: [],
  card_serial: "HBCE-CARD-TEST",
  certificate_hash: null,
  access_decision: "ALLOW",
  access_scope: "TEST",
  identity_binding: "BOUND",
  matrix_state: "ACTIVE",
  semantic_memory_scope: "NONE",
  source: "HBCE_TEST",
  handoff_hash: null,
  profile_hash: "HBCE-PROFILE-HASH-TEST",
  created_at: "2026-08-26T15:30:00.000Z",
  updated_at: "2026-08-26T15:30:00.000Z",
  last_login_at: null,
  profile_payload: {},
  legal_certification: false
};

const ok = (rows: Record<string, unknown>[]) => ({
  ok: true,
  status: "AVAILABLE",
  rows,
  rowCount: rows.length,
  error: null,
  sqlHash: "TEST_SQL_HASH",
  durationMs: 1
});

const assertSelectOnly = (sql: unknown) => {
  const s = String(sql).trim();
  expect(s).toMatch(/^SELECT\b/i);
  expect(s).not.toMatch(/\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE)\b/i);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.describe.mockReturnValue({ configured: true });
});

describe("DATABASE_PERSISTENT read-only account profile authority", () => {
  it("uses no-auto-schema SELECT-only authority", async () => {
    mocks.readOnly.mockResolvedValue(ok([row]));
    const profile = await getDatabasePersistentIprAccountProfileReadOnly({
      strategy: "humanIpr",
      value: "IPR-3"
    });
    expect(profile?.humanIpr).toBe("IPR-3");
    expect(mocks.normal).not.toHaveBeenCalled();
    const [sql, params] = mocks.readOnly.mock.calls[0];
    assertSelectOnly(sql);
    expect(String(sql)).toContain("WHERE human_ipr = $1");
    expect(params).toEqual(["IPR-3"]);
  });

  it("maps profileId to account_id and treats miss as authoritative", async () => {
    mocks.readOnly.mockResolvedValue(ok([]));
    const profile = await getDatabasePersistentIprAccountProfileReadOnly({
      strategy: "profileId",
      value: "HBCE-ACCOUNT-TEST"
    });
    expect(profile).toBeNull();
    expect(mocks.normal).not.toHaveBeenCalled();
    const [sql, params] = mocks.readOnly.mock.calls[0];
    assertSelectOnly(sql);
    expect(String(sql)).toContain("WHERE account_id = $1");
    expect(params).toEqual(["HBCE-ACCOUNT-TEST"]);
  });

  it("fails closed on database error", async () => {
    mocks.readOnly.mockResolvedValue({
      ok: false,
      status: "DEGRADED",
      rows: [],
      rowCount: 0,
      error: "HBCE_TEST_READ_ONLY_PROFILE_DATABASE_FAILURE",
      sqlHash: "TEST_SQL_HASH",
      durationMs: 1
    });
    await expect(
      getDatabasePersistentIprAccountProfileReadOnly({
        strategy: "humanIpr",
        value: "IPR-3"
      })
    ).rejects.toThrow("HBCE_TEST_READ_ONLY_PROFILE_DATABASE_FAILURE");
    expect(mocks.normal).not.toHaveBeenCalled();
    assertSelectOnly(mocks.readOnly.mock.calls[0][0]);
  });
});

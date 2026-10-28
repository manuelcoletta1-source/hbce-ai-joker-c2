import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  query: vi.fn(async (_sql: string, _values: unknown[]) => ({
    ok: true,
    rows: [],
    error: null
  }))
}));

vi.mock("./ipr-database", () => ({
  isHbceDatabaseConfigured: () => true,
  isHbceDatabaseAvailable: () => true,
  queryHbceDatabase: db.query
}));

import {
  buildRuntimeAuditHash,
  createRuntimeAuditLogRecord,
  persistRuntimeAuditLogRecord
} from "./runtime-audit-log";

describe("HBCE Runtime Audit Hash Integrity", () => {
  it("preserves hashed fields after successful persistence", async () => {
    const record = createRuntimeAuditLogRecord({
      source: "API_CHAT",
      persistenceMode: "DATABASE_PERSISTENT"
    });

    const initialHash = record.auditHash;
    const initialStatus = record.status;
    const initialBoundary = record.persistenceBoundary;

    expect(buildRuntimeAuditHash(record)).toBe(initialHash);

    const result = await persistRuntimeAuditLogRecord(record);

    expect(result.ok).toBe(true);
    expect(result.status).toBe("PERSISTED");
    expect(record.status).toBe(initialStatus);
    expect(record.persistenceBoundary).toBe(initialBoundary);
    expect(record.auditHash).toBe(initialHash);
    expect(buildRuntimeAuditHash(record)).toBe(initialHash);

    expect(db.query).toHaveBeenCalledOnce();

    const values = db.query.mock.calls[0][1];
    const payload = JSON.parse(String(values[values.length - 1]));

    expect(payload.status).toBe(initialStatus);
    expect(payload.persistenceBoundary).toBe(initialBoundary);
    expect(payload.auditHash).toBe(initialHash);
  });
});

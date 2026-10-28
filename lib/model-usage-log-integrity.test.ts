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
  buildModelUsageHash,
  createModelUsageLogRecord,
  persistModelUsageLogRecord
} from "./model-usage-log";

describe("HBCE Model Usage Hash Integrity", () => {
  it("preserves the hashed record after successful persistence", async () => {
    const record = createModelUsageLogRecord({
      provider: "OPENAI",
      selectedModel: "mock-model",
      persistenceMode: "DATABASE_PERSISTENT",
      inputTokens: 11,
      outputTokens: 5,
      totalTokens: 16
    });

    const initialStatus = record.status;
    const initialHash = record.usageHash;

    expect(initialStatus).toBe("DATABASE_PERSISTENT_TARGET");

    const result = await persistModelUsageLogRecord(record);

    expect(result.ok).toBe(true);
    expect(result.status).toBe("PERSISTED");
    expect(record.status).toBe(initialStatus);
    expect(record.usageHash).toBe(initialHash);
    expect(buildModelUsageHash(record)).toBe(initialHash);
    expect(record.persistenceBoundary).toBe("DATABASE_PERSISTENT");

    expect(db.query).toHaveBeenCalledTimes(1);
    const values = db.query.mock.calls[0][1];
    const payload = JSON.parse(String(values[values.length - 1]));

    expect(payload.status).toBe(initialStatus);
    expect(payload.usageHash).toBe(initialHash);
  });
});

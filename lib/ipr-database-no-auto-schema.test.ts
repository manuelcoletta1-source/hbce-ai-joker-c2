import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const {
  mockNeon,
  mockNeonQuery
} = vi.hoisted(() => ({
  mockNeon: vi.fn(),
  mockNeonQuery: vi.fn()
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: mockNeon
}));

import {
  getDefaultHbceDatabase,
  queryHbceDatabase,
  queryHbceDatabaseWithoutSchemaInitialization,
  resetDefaultHbceDatabaseForTests
} from "@/lib/ipr-database";

const ORIGINAL_DATABASE_URL =
  process.env.DATABASE_URL;

const ORIGINAL_HBCE_AUTO_SCHEMA =
  process.env.HBCE_DATABASE_AUTO_SCHEMA;

const ORIGINAL_JOKER_AUTO_SCHEMA =
  process.env.JOKER_DATABASE_AUTO_SCHEMA;

function restoreEnvironment(
  key: string,
  value: string | undefined
): void {
  if (typeof value === "string") {
    process.env[key] = value;
  } else {
    delete process.env[key];
  }
}

function successfulInitializationResult() {
  return {
    ok: true,
    status: "AVAILABLE" as const,
    rows: [],
    rowCount: 0,
    error: null,
    sqlHash: null,
    durationMs: 0
  };
}

beforeEach(() => {
  process.env.DATABASE_URL =
    "postgresql://hbce-no-auto-schema-test.invalid/hbce";

  /*
   * Deliberatamente TRUE.
   *
   * Il test deve dimostrare che il nuovo percorso
   * NO_AUTO_SCHEMA ignora la possibilità di inizializzazione
   * automatica anche quando essa sarebbe normalmente abilitata.
   */
  process.env.HBCE_DATABASE_AUTO_SCHEMA =
    "true";

  delete process.env.JOKER_DATABASE_AUTO_SCHEMA;

  resetDefaultHbceDatabaseForTests();

  mockNeon.mockReset();
  mockNeonQuery.mockReset();

  mockNeonQuery.mockResolvedValue([
    {
      hbce_probe: 1
    }
  ]);

  mockNeon.mockReturnValue({
    query: mockNeonQuery
  });
});

afterEach(() => {
  vi.restoreAllMocks();

  resetDefaultHbceDatabaseForTests();

  restoreEnvironment(
    "DATABASE_URL",
    ORIGINAL_DATABASE_URL
  );

  restoreEnvironment(
    "HBCE_DATABASE_AUTO_SCHEMA",
    ORIGINAL_HBCE_AUTO_SCHEMA
  );

  restoreEnvironment(
    "JOKER_DATABASE_AUTO_SCHEMA",
    ORIGINAL_JOKER_AUTO_SCHEMA
  );
});

describe(
  "HBCE database NO_AUTO_SCHEMA execution boundary",
  () => {
    it(
      "executes the requested query without invoking schema initialization",
      async () => {
        const adapter =
          getDefaultHbceDatabase();

        const initializeSchemaSpy =
          vi.spyOn(
            adapter,
            "initializeSchema"
          ).mockResolvedValue(
            successfulInitializationResult()
          );

        const result =
          await queryHbceDatabaseWithoutSchemaInitialization<{
            hbce_probe?: unknown;
          }>(
            "SELECT 1 AS hbce_probe"
          );

        expect(result.ok).toBe(true);
        expect(result.status).toBe("AVAILABLE");

        expect(
          result.rows
        ).toEqual([
          {
            hbce_probe: 1
          }
        ]);

        expect(
          initializeSchemaSpy
        ).not.toHaveBeenCalled();

        expect(
          mockNeonQuery
        ).toHaveBeenCalledTimes(1);

        expect(
          mockNeonQuery
        ).toHaveBeenCalledWith(
          "SELECT 1 AS hbce_probe",
          []
        );
      }
    );

    it(
      "preserves legacy auto-schema-compatible behavior",
      async () => {
        const adapter =
          getDefaultHbceDatabase();

        const initializeSchemaSpy =
          vi.spyOn(
            adapter,
            "initializeSchema"
          ).mockResolvedValue(
            successfulInitializationResult()
          );

        const result =
          await queryHbceDatabase<{
            hbce_probe?: unknown;
          }>(
            "SELECT 1 AS hbce_probe"
          );

        expect(result.ok).toBe(true);

        expect(
          initializeSchemaSpy
        ).toHaveBeenCalledTimes(1);

        expect(
          mockNeonQuery
        ).toHaveBeenCalledTimes(1);

        expect(
          mockNeonQuery
        ).toHaveBeenCalledWith(
          "SELECT 1 AS hbce_probe",
          []
        );
      }
    );

    it(
      "keeps direct adapter query source-compatible with the legacy mode",
      async () => {
        const adapter =
          getDefaultHbceDatabase();

        const initializeSchemaSpy =
          vi.spyOn(
            adapter,
            "initializeSchema"
          ).mockResolvedValue(
            successfulInitializationResult()
          );

        const result =
          await adapter.query<{
            hbce_probe?: unknown;
          }>(
            "SELECT 1 AS hbce_probe"
          );

        expect(result.ok).toBe(true);

        expect(
          initializeSchemaSpy
        ).toHaveBeenCalledTimes(1);

        expect(
          mockNeonQuery
        ).toHaveBeenCalledTimes(1);
      }
    );
  }
);

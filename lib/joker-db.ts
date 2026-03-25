import { sql } from "@vercel/postgres";

export type JokerPersistentMemoryRecord = {
  id: string;
  key: string;
  normalized_key: string;
  value: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

function mapRow(row: Record<string, unknown>): JokerPersistentMemoryRecord {
  return {
    id: String(row.id),
    key: String(row.key),
    normalized_key: String(row.normalized_key),
    value: String(row.value),
    category: String(row.category),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

/**
 * =========================
 * CONFIG CHECK
 * =========================
 */

export function dbIsConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

function assertDbConfigured() {
  if (!dbIsConfigured()) {
    throw new Error("POSTGRES_URL not configured");
  }
}

/**
 * =========================
 * CORE MEMORY OPERATIONS
 * =========================
 * NOTE:
 * - NO schema creation here
 * - NO CREATE TABLE
 * - NO CREATE INDEX
 * - DB must be pre-initialized via migration/script
 */

export async function dbSaveMemoryRecord(input: {
  key: string;
  value: string;
  category?: string;
}): Promise<JokerPersistentMemoryRecord> {
  assertDbConfigured();

  const key = input.key.trim();
  const normalizedKey = normalizeKey(input.key);
  const value = input.value.trim();
  const category = (input.category || "general").trim();

  if (!key) {
    throw new Error("Memory key is required");
  }

  if (!value) {
    throw new Error("Memory value is required");
  }

  const result = await sql`
    INSERT INTO joker_persistent_memory (
      key,
      normalized_key,
      value,
      category
    )
    VALUES (
      ${key},
      ${normalizedKey},
      ${value},
      ${category}
    )
    ON CONFLICT (key)
    DO UPDATE SET
      normalized_key = EXCLUDED.normalized_key,
      value = EXCLUDED.value,
      category = EXCLUDED.category,
      updated_at = NOW()
    RETURNING
      id,
      key,
      normalized_key,
      value,
      category,
      created_at,
      updated_at;
  `;

  return mapRow(result.rows[0]);
}

export async function dbGetMemoryByKey(
  key: string
): Promise<JokerPersistentMemoryRecord | null> {
  assertDbConfigured();

  const normalizedKey = normalizeKey(key);

  const result = await sql`
    SELECT
      id,
      key,
      normalized_key,
      value,
      category,
      created_at,
      updated_at
    FROM joker_persistent_memory
    WHERE normalized_key = ${normalizedKey}
    ORDER BY updated_at DESC
    LIMIT 1;
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function dbDeleteMemoryByKey(key: string): Promise<boolean> {
  assertDbConfigured();

  const normalizedKey = normalizeKey(key);

  const result = await sql`
    DELETE FROM joker_persistent_memory
    WHERE normalized_key = ${normalizedKey};
  `;

  return (result.rowCount || 0) > 0;
}

export async function dbListMemoryRecords(): Promise<JokerPersistentMemoryRecord[]> {
  assertDbConfigured();

  const result = await sql`
    SELECT
      id,
      key,
      normalized_key,
      value,
      category,
      created_at,
      updated_at
    FROM joker_persistent_memory
    ORDER BY updated_at DESC, id DESC;
  `;

  return result.rows.map(mapRow);
}

export async function dbSearchMemory(
  query: string
): Promise<JokerPersistentMemoryRecord[]> {
  assertDbConfigured();

  const q = query.trim();

  if (!q) {
    return dbListMemoryRecords();
  }

  const likeValue = `%${q}%`;
  const normalizedLikeValue = `%${q.toLowerCase()}%`;

  const result = await sql`
    SELECT
      id,
      key,
      normalized_key,
      value,
      category,
      created_at,
      updated_at
    FROM joker_persistent_memory
    WHERE
      normalized_key LIKE ${normalizedLikeValue}
      OR key LIKE ${likeValue}
      OR value LIKE ${likeValue}
      OR category LIKE ${likeValue}
    ORDER BY updated_at DESC, id DESC
    LIMIT 25;
  `;

  return result.rows.map(mapRow);
}

import { sql } from "@vercel/postgres";

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL not configured");
  }

  console.log("Connecting to DB...");

  await sql`SELECT 1;`;

  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS evt_registry (
      evt TEXT PRIMARY KEY,
      prev TEXT NULL,
      t TIMESTAMPTZ NOT NULL,
      monthly_hash TEXT NOT NULL,
      payload_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS joker_persistent_memory (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      normalized_key TEXT NOT NULL,
      value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log("DB READY.");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});

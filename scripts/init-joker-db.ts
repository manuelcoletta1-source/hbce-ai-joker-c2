import { sql } from "@vercel/postgres";

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL not configured");
  }

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

  await sql`
    CREATE INDEX IF NOT EXISTS joker_persistent_memory_normalized_key_idx
    ON joker_persistent_memory (normalized_key);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS joker_persistent_memory_category_idx
    ON joker_persistent_memory (category);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evt_registry (
      evt TEXT PRIMARY KEY,
      prev TEXT NULL,
      t TIMESTAMPTZ NOT NULL,
      monthly_hash TEXT NOT NULL,
      payload_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT evt_registry_prev_fk
        FOREIGN KEY (prev)
        REFERENCES evt_registry(evt)
        ON DELETE RESTRICT
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS evt_registry_prev_idx
    ON evt_registry (prev);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS evt_registry_created_at_idx
    ON evt_registry (created_at);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS evt_registry_t_idx
    ON evt_registry (t);
  `;

  console.log("HBCE Joker DB schema initialized successfully.");
}

main().catch((error) => {
  console.error("Schema initialization failed:", error);
  process.exit(1);
});

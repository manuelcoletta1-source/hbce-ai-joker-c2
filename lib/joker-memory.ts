import { promises as fs } from "fs";
import path from "path";

export type JokerMemoryRecord = {
  id: string;
  key: string;
  value: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type JokerMemoryStore = {
  records: JokerMemoryRecord[];
};

const MEMORY_DIR = path.join(process.cwd(), "runtime", "memory");
const MEMORY_FILE = path.join(MEMORY_DIR, "joker-memory.json");

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureStore(): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true });

  try {
    await fs.access(MEMORY_FILE);
  } catch {
    const initial: JokerMemoryStore = {
      records: []
    };

    await fs.writeFile(
      MEMORY_FILE,
      JSON.stringify(initial, null, 2),
      "utf-8"
    );
  }
}

async function readStore(): Promise<JokerMemoryStore> {
  await ensureStore();

  const raw = await fs.readFile(MEMORY_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Partial<JokerMemoryStore>;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : []
  };
}

async function writeStore(store: JokerMemoryStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(
    MEMORY_FILE,
    JSON.stringify(store, null, 2),
    "utf-8"
  );
}

export async function listMemoryRecords(): Promise<JokerMemoryRecord[]> {
  const store = await readStore();

  return [...store.records].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1
  );
}

export async function getMemoryByKey(
  key: string
): Promise<JokerMemoryRecord | null> {
  const normalizedKey = key.trim().toLowerCase();
  if (!normalizedKey) return null;

  const store = await readStore();

  const found = store.records.find(
    (record) => record.key.trim().toLowerCase() === normalizedKey
  );

  return found ?? null;
}

export async function saveMemoryRecord(input: {
  key: string;
  value: string;
  category?: string;
}): Promise<JokerMemoryRecord> {
  const key = input.key.trim();
  const value = input.value.trim();
  const category = (input.category || "general").trim() || "general";

  if (!key) {
    throw new Error("Memory key is required");
  }

  if (!value) {
    throw new Error("Memory value is required");
  }

  const store = await readStore();
  const existingIndex = store.records.findIndex(
    (record) => record.key.trim().toLowerCase() === key.toLowerCase()
  );

  if (existingIndex >= 0) {
    const updated: JokerMemoryRecord = {
      ...store.records[existingIndex],
      value,
      category,
      updatedAt: nowIso()
    };

    store.records[existingIndex] = updated;
    await writeStore(store);
    return updated;
  }

  const created: JokerMemoryRecord = {
    id: makeId(),
    key,
    value,
    category,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  store.records.push(created);
  await writeStore(store);
  return created;
}

export async function deleteMemoryByKey(key: string): Promise<boolean> {
  const normalizedKey = key.trim().toLowerCase();
  if (!normalizedKey) return false;

  const store = await readStore();
  const nextRecords = store.records.filter(
    (record) => record.key.trim().toLowerCase() !== normalizedKey
  );

  if (nextRecords.length === store.records.length) {
    return false;
  }

  await writeStore({
    records: nextRecords
  });

  return true;
}

export async function searchMemory(
  query: string
): Promise<JokerMemoryRecord[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const store = await readStore();

  return store.records.filter((record) => {
    const haystack = [
      record.key,
      record.value,
      record.category
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

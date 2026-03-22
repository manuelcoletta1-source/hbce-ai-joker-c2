import {
  dbDeleteMemoryByKey,
  dbGetMemoryByKey,
  dbIsConfigured,
  dbListMemoryRecords,
  dbSaveMemoryRecord,
  dbSearchMemory,
  type JokerPersistentMemoryRecord
} from "@/lib/joker-db";

export type HBCENodeMemoryRecord = {
  id: string;
  key: string;
  normalized_key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type HBCENodeMemorySummary = {
  enabled: boolean;
  total_records: number;
  latest_record_key: string | null;
  latest_updated_at: string | null;
};

function mapMemoryRecord(
  record: JokerPersistentMemoryRecord
): HBCENodeMemoryRecord {
  return {
    id: record.id,
    key: record.key,
    normalized_key: record.normalized_key,
    value: record.value,
    category: record.category,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

export function nodeMemoryIsConfigured(): boolean {
  return dbIsConfigured();
}

export async function nodeSaveMemory(input: {
  key: string;
  value: string;
  category?: string;
}): Promise<HBCENodeMemoryRecord | null> {
  if (!dbIsConfigured()) {
    return null;
  }

  const saved = await dbSaveMemoryRecord({
    key: input.key,
    value: input.value,
    category: input.category || "general"
  });

  return mapMemoryRecord(saved);
}

export async function nodeGetMemoryByKey(
  key: string
): Promise<HBCENodeMemoryRecord | null> {
  if (!dbIsConfigured()) {
    return null;
  }

  const found = await dbGetMemoryByKey(key);
  return found ? mapMemoryRecord(found) : null;
}

export async function nodeDeleteMemoryByKey(key: string): Promise<boolean> {
  if (!dbIsConfigured()) {
    return false;
  }

  return dbDeleteMemoryByKey(key);
}

export async function nodeListMemories(): Promise<HBCENodeMemoryRecord[]> {
  if (!dbIsConfigured()) {
    return [];
  }

  const records = await dbListMemoryRecords();
  return records.map(mapMemoryRecord);
}

export async function nodeSearchMemories(
  query: string
): Promise<HBCENodeMemoryRecord[]> {
  if (!dbIsConfigured()) {
    return [];
  }

  const results = await dbSearchMemory(query);
  return results.map(mapMemoryRecord);
}

export async function nodeGetMemorySummary(): Promise<HBCENodeMemorySummary> {
  if (!dbIsConfigured()) {
    return {
      enabled: false,
      total_records: 0,
      latest_record_key: null,
      latest_updated_at: null
    };
  }

  const records = await dbListMemoryRecords();
  const latest = records[0] ?? null;

  return {
    enabled: true,
    total_records: records.length,
    latest_record_key: latest?.key ?? null,
    latest_updated_at: latest?.updatedAt ?? null
  };
}

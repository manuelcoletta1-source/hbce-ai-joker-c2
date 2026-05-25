import type { IprBoundMemoryRecord } from "./ipr-bound-memory";

export type IprBoundMemoryStoreKind =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type IprBoundMemoryStoreStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DEGRADED";

export type IprBoundMemoryStoreDescription = {
  name: string;
  kind: IprBoundMemoryStoreKind;
  status: IprBoundMemoryStoreStatus;
  durable: boolean;
  runtimeScoped: boolean;
  recordCount: number;
  boundary: string;
};

export type IprBoundMemoryStoreAdapter = {
  name: string;
  kind: IprBoundMemoryStoreKind;
  durable: boolean;
  runtimeScoped: boolean;

  describe(): IprBoundMemoryStoreDescription;

  get(memoryKey: string): IprBoundMemoryRecord | undefined;
  set(memoryKey: string, record: IprBoundMemoryRecord): IprBoundMemoryRecord;
  has(memoryKey: string): boolean;
  delete(memoryKey: string): boolean;
  clear(): void;
  size(): number;
  values(): IprBoundMemoryRecord[];
  findByMemoryKeyHash(memoryKeyHash: string): IprBoundMemoryRecord | null;
};

const PROCESS_MEMORY_STORE_BOUNDARY =
  "This adapter stores IPR-bound memory in server-side process memory only. It is valid for MVP runtime demonstrations, but it is not durable enterprise storage and may reset on redeploy, cold start, instance recycling or runtime migration.";

const DATABASE_PLACEHOLDER_BOUNDARY =
  "This adapter placeholder declares a future durable database persistence layer. It is not active until a real database implementation, access control, retention policy, encryption strategy and audit backend are connected.";

type HbceJokerC2GlobalMemoryStore = typeof globalThis & {
  __HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__?: Map<
    string,
    IprBoundMemoryRecord
  >;
};

const globalMemoryStore = globalThis as HbceJokerC2GlobalMemoryStore;

const processMemoryMap =
  globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__ ??
  new Map<string, IprBoundMemoryRecord>();

globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__ =
  processMemoryMap;

function normalizeMemoryKey(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMemoryKeyHash(value: string): string {
  return value.replace(/\s+/g, "").trim().toUpperCase();
}

function assertMemoryKey(memoryKey: string): string {
  const normalized = normalizeMemoryKey(memoryKey);

  if (!normalized) {
    throw new Error("IPR_BOUND_MEMORY_STORE_EMPTY_MEMORY_KEY");
  }

  return normalized;
}

function assertMemoryRecord(record: IprBoundMemoryRecord): IprBoundMemoryRecord {
  if (!record || typeof record !== "object") {
    throw new Error("IPR_BOUND_MEMORY_STORE_INVALID_RECORD");
  }

  if (!record.memoryKey || !record.memoryKeyHash || !record.memoryId) {
    throw new Error("IPR_BOUND_MEMORY_STORE_INCOMPLETE_RECORD");
  }

  return record;
}

export function createProcessMemoryStoreAdapter(
  store: Map<string, IprBoundMemoryRecord> = processMemoryMap
): IprBoundMemoryStoreAdapter {
  return {
    name: "HBCE_JOKER_C2_PROCESS_MEMORY_STORE",
    kind: "PROCESS_MEMORY_MVP",
    durable: false,
    runtimeScoped: true,

    describe(): IprBoundMemoryStoreDescription {
      return {
        name: this.name,
        kind: this.kind,
        status: "AVAILABLE",
        durable: this.durable,
        runtimeScoped: this.runtimeScoped,
        recordCount: store.size,
        boundary: PROCESS_MEMORY_STORE_BOUNDARY
      };
    },

    get(memoryKey: string): IprBoundMemoryRecord | undefined {
      return store.get(assertMemoryKey(memoryKey));
    },

    set(
      memoryKey: string,
      record: IprBoundMemoryRecord
    ): IprBoundMemoryRecord {
      const normalizedKey = assertMemoryKey(memoryKey);
      const safeRecord = assertMemoryRecord(record);

      if (safeRecord.memoryKey !== normalizedKey) {
        throw new Error("IPR_BOUND_MEMORY_STORE_KEY_RECORD_MISMATCH");
      }

      store.set(normalizedKey, safeRecord);

      return safeRecord;
    },

    has(memoryKey: string): boolean {
      return store.has(assertMemoryKey(memoryKey));
    },

    delete(memoryKey: string): boolean {
      return store.delete(assertMemoryKey(memoryKey));
    },

    clear(): void {
      store.clear();
    },

    size(): number {
      return store.size;
    },

    values(): IprBoundMemoryRecord[] {
      return Array.from(store.values());
    },

    findByMemoryKeyHash(memoryKeyHash: string): IprBoundMemoryRecord | null {
      const normalizedHash = normalizeMemoryKeyHash(memoryKeyHash);

      if (!normalizedHash) {
        return null;
      }

      for (const record of store.values()) {
        if (normalizeMemoryKeyHash(record.memoryKeyHash) === normalizedHash) {
          return record;
        }
      }

      return null;
    }
  };
}

export function createDatabaseReadyPlaceholderAdapter(): IprBoundMemoryStoreAdapter {
  return {
    name: "HBCE_JOKER_C2_DATABASE_READY_PLACEHOLDER",
    kind: "DATABASE_READY",
    durable: true,
    runtimeScoped: false,

    describe(): IprBoundMemoryStoreDescription {
      return {
        name: this.name,
        kind: this.kind,
        status: "NOT_CONFIGURED",
        durable: this.durable,
        runtimeScoped: this.runtimeScoped,
        recordCount: 0,
        boundary: DATABASE_PLACEHOLDER_BOUNDARY
      };
    },

    get(): IprBoundMemoryRecord | undefined {
      throw new Error("IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED");
    },

    set(): IprBoundMemoryRecord {
      throw new Error("IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED");
    },

    has(): boolean {
      throw new Error("IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED");
    },

    delete(): boolean {
      throw new Error("IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED");
    },

    clear(): void {
      throw new Error("IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED");
    },

    size(): number {
      return 0;
    },

    values(): IprBoundMemoryRecord[] {
      return [];
    },

    findByMemoryKeyHash(): IprBoundMemoryRecord | null {
      throw new Error("IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED");
    }
  };
}

export const processIprBoundMemoryStore =
  createProcessMemoryStoreAdapter(processMemoryMap);

export const databaseReadyIprBoundMemoryStore =
  createDatabaseReadyPlaceholderAdapter();

export function getDefaultIprBoundMemoryStore(): IprBoundMemoryStoreAdapter {
  return processIprBoundMemoryStore;
}

export function getProcessIprBoundMemoryStore(): IprBoundMemoryStoreAdapter {
  return processIprBoundMemoryStore;
}

export function getDatabaseReadyIprBoundMemoryStore(): IprBoundMemoryStoreAdapter {
  return databaseReadyIprBoundMemoryStore;
}

export function describeDefaultIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDefaultIprBoundMemoryStore().describe();
}

export function getRuntimeMemoryStoreSize(): number {
  return getDefaultIprBoundMemoryStore().size();
}

export function getRuntimeMemoryByKeyHash(
  memoryKeyHash: string
): IprBoundMemoryRecord | null {
  return getDefaultIprBoundMemoryStore().findByMemoryKeyHash(memoryKeyHash);
}

export function clearProcessRuntimeMemory(): void {
  processIprBoundMemoryStore.clear();
}

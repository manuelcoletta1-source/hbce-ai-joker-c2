export type IprBoundMemoryStoreKind =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type IprBoundMemoryStoreStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DEGRADED";

export type IprBoundMemoryStoreRecord = {
  memoryId: string;
  memoryKey: string;
  memoryKeyHash: string;
  [key: string]: unknown;
};

export type IprBoundMemoryStoreDescription = {
  name: string;
  kind: IprBoundMemoryStoreKind;
  status: IprBoundMemoryStoreStatus;
  durable: boolean;
  runtimeScoped: boolean;
  recordCount: number;
  boundary: string;
};

export type IprBoundMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
> = {
  name: string;
  kind: IprBoundMemoryStoreKind;
  durable: boolean;
  runtimeScoped: boolean;

  describe(): IprBoundMemoryStoreDescription;

  get(memoryKey: string): TRecord | undefined;
  set(memoryKey: string, record: TRecord): TRecord;
  has(memoryKey: string): boolean;
  delete(memoryKey: string): boolean;
  clear(): void;
  size(): number;
  values(): TRecord[];
  findByMemoryKeyHash(memoryKeyHash: string): TRecord | null;
};

const PROCESS_MEMORY_STORE_BOUNDARY =
  "This adapter stores IPR-bound memory in server-side process memory only. It is valid for MVP runtime demonstrations, but it is not durable enterprise storage and may reset on redeploy, cold start, instance recycling or runtime migration.";

const DATABASE_READY_BOUNDARY =
  "This adapter declares that the codebase is prepared for a future database memory layer. It is not an active durable store until a real database implementation, access control, retention policy, encryption strategy and audit backend are connected.";

const DATABASE_PERSISTENT_BOUNDARY =
  "This adapter declares the required target state for durable SaaS memory. DATABASE_PERSISTENT requires real database storage, tenant and workspace scoping, access control, encryption, audit logging, retention, deletion, backup, recovery and operational monitoring before use.";

const EXTERNAL_ADAPTER_BOUNDARY =
  "This adapter declares support for an external memory adapter supplied by the runtime. External adapters must enforce HBCE memory boundaries, IPR scoping, auditability, fail-closed behavior and legalCertification=false unless a valid regulated certification layer is later integrated.";

const STORE_NOT_CONFIGURED_ERROR =
  "IPR_BOUND_MEMORY_DATABASE_STORE_NOT_CONFIGURED";

type HbceJokerC2GlobalMemoryStore = typeof globalThis & {
  __HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__?: Map<
    string,
    IprBoundMemoryStoreRecord
  >;
};

const globalMemoryStore = globalThis as HbceJokerC2GlobalMemoryStore;

const processMemoryMap =
  globalMemoryStore.__HBCE_JOKER_C2_IPR_BOUND_MEMORY_STORE_V1__ ??
  new Map<string, IprBoundMemoryStoreRecord>();

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

function assertMemoryKeyHash(memoryKeyHash: string): string {
  const normalized = normalizeMemoryKeyHash(memoryKeyHash);

  if (!normalized) {
    throw new Error("IPR_BOUND_MEMORY_STORE_EMPTY_MEMORY_KEY_HASH");
  }

  return normalized;
}

function assertMemoryRecord<TRecord extends IprBoundMemoryStoreRecord>(
  record: TRecord
): TRecord {
  if (!record || typeof record !== "object") {
    throw new Error("IPR_BOUND_MEMORY_STORE_INVALID_RECORD");
  }

  if (!record.memoryId || !record.memoryKey || !record.memoryKeyHash) {
    throw new Error("IPR_BOUND_MEMORY_STORE_INCOMPLETE_RECORD");
  }

  return record;
}

function buildStoreDescription(input: {
  name: string;
  kind: IprBoundMemoryStoreKind;
  status: IprBoundMemoryStoreStatus;
  durable: boolean;
  runtimeScoped: boolean;
  recordCount: number;
  boundary: string;
}): IprBoundMemoryStoreDescription {
  return {
    name: input.name,
    kind: input.kind,
    status: input.status,
    durable: input.durable,
    runtimeScoped: input.runtimeScoped,
    recordCount: input.recordCount,
    boundary: input.boundary
  };
}

function throwStoreNotConfigured(): never {
  throw new Error(STORE_NOT_CONFIGURED_ERROR);
}

export function createProcessMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(
  store: Map<string, TRecord> = processMemoryMap as Map<string, TRecord>
): IprBoundMemoryStoreAdapter<TRecord> {
  return {
    name: "HBCE_JOKER_C2_PROCESS_MEMORY_STORE",
    kind: "PROCESS_MEMORY_MVP",
    durable: false,
    runtimeScoped: true,

    describe(): IprBoundMemoryStoreDescription {
      return buildStoreDescription({
        name: this.name,
        kind: this.kind,
        status: "AVAILABLE",
        durable: this.durable,
        runtimeScoped: this.runtimeScoped,
        recordCount: store.size,
        boundary: PROCESS_MEMORY_STORE_BOUNDARY
      });
    },

    get(memoryKey: string): TRecord | undefined {
      return store.get(assertMemoryKey(memoryKey));
    },

    set(memoryKey: string, record: TRecord): TRecord {
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

    values(): TRecord[] {
      return Array.from(store.values());
    },

    findByMemoryKeyHash(memoryKeyHash: string): TRecord | null {
      const normalizedHash = assertMemoryKeyHash(memoryKeyHash);

      for (const record of store.values()) {
        if (normalizeMemoryKeyHash(record.memoryKeyHash) === normalizedHash) {
          return record;
        }
      }

      return null;
    }
  };
}

function createUnavailableMemoryStoreAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(input: {
  name: string;
  kind: IprBoundMemoryStoreKind;
  durable: boolean;
  runtimeScoped: boolean;
  boundary: string;
}): IprBoundMemoryStoreAdapter<TRecord> {
  return {
    name: input.name,
    kind: input.kind,
    durable: input.durable,
    runtimeScoped: input.runtimeScoped,

    describe(): IprBoundMemoryStoreDescription {
      return buildStoreDescription({
        name: this.name,
        kind: this.kind,
        status: "NOT_CONFIGURED",
        durable: this.durable,
        runtimeScoped: this.runtimeScoped,
        recordCount: 0,
        boundary: input.boundary
      });
    },

    get(memoryKey: string): TRecord | undefined {
      void memoryKey;
      return throwStoreNotConfigured();
    },

    set(memoryKey: string, record: TRecord): TRecord {
      void memoryKey;
      void record;
      return throwStoreNotConfigured();
    },

    has(memoryKey: string): boolean {
      void memoryKey;
      return throwStoreNotConfigured();
    },

    delete(memoryKey: string): boolean {
      void memoryKey;
      return throwStoreNotConfigured();
    },

    clear(): void {
      throwStoreNotConfigured();
    },

    size(): number {
      return 0;
    },

    values(): TRecord[] {
      return [];
    },

    findByMemoryKeyHash(memoryKeyHash: string): TRecord | null {
      void memoryKeyHash;
      return throwStoreNotConfigured();
    }
  };
}

export function createDatabaseReadyPlaceholderAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return createUnavailableMemoryStoreAdapter<TRecord>({
    name: "HBCE_JOKER_C2_DATABASE_READY_PLACEHOLDER",
    kind: "DATABASE_READY",
    durable: true,
    runtimeScoped: false,
    boundary: DATABASE_READY_BOUNDARY
  });
}

export function createDatabasePersistentPlaceholderAdapter<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return createUnavailableMemoryStoreAdapter<TRecord>({
    name: "HBCE_JOKER_C2_DATABASE_PERSISTENT_PLACEHOLDER",
    kind: "DATABASE_PERSISTENT",
    durable: true,
    runtimeScoped: false,
    boundary: DATABASE_PERSISTENT_BOUNDARY
  });
}

export function createExternalAdapterPlaceholder<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return createUnavailableMemoryStoreAdapter<TRecord>({
    name: "HBCE_JOKER_C2_EXTERNAL_MEMORY_ADAPTER_PLACEHOLDER",
    kind: "EXTERNAL_ADAPTER",
    durable: true,
    runtimeScoped: false,
    boundary: EXTERNAL_ADAPTER_BOUNDARY
  });
}

export const processIprBoundMemoryStore =
  createProcessMemoryStoreAdapter<IprBoundMemoryStoreRecord>(
    processMemoryMap
  );

export const databaseReadyIprBoundMemoryStore =
  createDatabaseReadyPlaceholderAdapter<IprBoundMemoryStoreRecord>();

export const databasePersistentIprBoundMemoryStore =
  createDatabasePersistentPlaceholderAdapter<IprBoundMemoryStoreRecord>();

export const externalIprBoundMemoryStore =
  createExternalAdapterPlaceholder<IprBoundMemoryStoreRecord>();

export function getDefaultIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return processIprBoundMemoryStore as unknown as IprBoundMemoryStoreAdapter<TRecord>;
}

export function getProcessIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return processIprBoundMemoryStore as unknown as IprBoundMemoryStoreAdapter<TRecord>;
}

export function getDatabaseReadyIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return databaseReadyIprBoundMemoryStore as unknown as IprBoundMemoryStoreAdapter<TRecord>;
}

export function getDatabasePersistentIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return databasePersistentIprBoundMemoryStore as unknown as IprBoundMemoryStoreAdapter<TRecord>;
}

export function getExternalIprBoundMemoryStore<
  TRecord extends IprBoundMemoryStoreRecord = IprBoundMemoryStoreRecord
>(): IprBoundMemoryStoreAdapter<TRecord> {
  return externalIprBoundMemoryStore as unknown as IprBoundMemoryStoreAdapter<TRecord>;
}

export function describeDefaultIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDefaultIprBoundMemoryStore().describe();
}

export function describeProcessIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getProcessIprBoundMemoryStore().describe();
}

export function describeDatabaseReadyIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDatabaseReadyIprBoundMemoryStore().describe();
}

export function describeDatabasePersistentIprBoundMemoryStore(): IprBoundMemoryStoreDescription {
  return getDatabasePersistentIprBoundMemoryStore().describe();
}

export function getRuntimeMemoryStoreSize(): number {
  return getDefaultIprBoundMemoryStore().size();
}

export function getRuntimeMemoryByKeyHash(
  memoryKeyHash: string
): IprBoundMemoryStoreRecord | null {
  return getDefaultIprBoundMemoryStore().findByMemoryKeyHash(memoryKeyHash);
}

export function clearProcessRuntimeMemory(): void {
  processIprBoundMemoryStore.clear();
}

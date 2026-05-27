import { NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  getHbceDatabaseBoundary,
  initializeHbceDatabaseSchema,
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "@/lib/ipr-database";

import {
  HBCE_DATABASE_SCHEMA_TABLES,
  HBCE_DATABASE_SCHEMA_VERSION
} from "@/lib/ipr-database-schema";

import { getC2DefensePolicyHealth } from "@/lib/c2-defense-policy";

import { getRuntimeAuditLogHealth } from "@/lib/runtime-audit-log";

import { getModelUsageLogHealth } from "@/lib/model-usage-log";

import {
  HBCE_CORE,
  HBCE_ORGANIZATION,
  HBCE_SAAS_PROJECT,
  HBCE_SAAS_SOURCE_EVENT,
  HBCE_SAAS_SOURCE_EVENT_AI,
  HBCE_SAAS_TARGET_CHECKPOINT,
  HBCE_SAAS_TARGET_RELEASE,
  RUNTIME_BOUNDARY_SUMMARY,
  RUNTIME_ENTITY,
  RUNTIME_IPR
} from "@/lib/saas-tier-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthStatus = "OK" | "DEGRADED";

type DatabaseTableHealth = {
  tableName: string;
  required: true;
  present: boolean;
  status: "PRESENT" | "MISSING" | "UNKNOWN";
  error: string | null;
};

type DatabaseHealth = {
  configured: boolean;
  available: boolean;
  schemaReady: boolean;
  schemaVersion: typeof HBCE_DATABASE_SCHEMA_VERSION;
  mode: "DATABASE_PERSISTENT" | "PROCESS_MEMORY_MVP";
  description: unknown;
  boundary: unknown;
  initialization: {
    attempted: boolean;
    ok: boolean;
    status: string;
    rowCount: number;
    durationMs: number;
    error: string | null;
  };
  tables: DatabaseTableHealth[];
  missingTables: string[];
  requiredRuntimeTables: {
    evtRecords: boolean;
    opcProofs: boolean;
    runtimeAuditLogs: boolean;
    modelUsage: boolean;
  };
  error: string | null;
};

type ComponentHealth = {
  name: string;
  status: HealthStatus;
  configured: boolean;
  available: boolean;
  mode: string;
  boundary: string;
};

type InformationSchemaTableRow = Record<string, unknown> & {
  table_name?: string;
};

function readEnv(name: string, fallback = ""): string {
  const value = process.env[name];

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed || fallback;
}

function isEnvConfigured(name: string): boolean {
  return Boolean(readEnv(name));
}

function redactEnv(name: string): {
  name: string;
  configured: boolean;
  value: "CONFIGURED" | "MISSING";
} {
  const configured = isEnvConfigured(name);

  return {
    name,
    configured,
    value: configured ? "CONFIGURED" : "MISSING"
  };
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function getModelConfig() {
  const defaultModel = readEnv("JOKER_MODEL", "gpt-4o-mini");
  const baseModel = readEnv("JOKER_MODEL_BASE", defaultModel);
  const standardModel = readEnv(
    "JOKER_MODEL_STANDARD",
    readEnv("JOKER_STANDARD_MODEL", defaultModel)
  );
  const enhancedModel = readEnv(
    "JOKER_MODEL_ENHANCED",
    readEnv("JOKER_ENHANCED_MODEL", "gpt-4o")
  );
  const deepModel = readEnv(
    "JOKER_MODEL_DEEP",
    readEnv("JOKER_DEEP_MODEL", enhancedModel)
  );
  const frontierModel = readEnv(
    "JOKER_MODEL_FRONTIER",
    readEnv("JOKER_FRONTIER_MODEL", deepModel)
  );
  const emergencyModel = readEnv(
    "JOKER_MODEL_EMERGENCY",
    readEnv("JOKER_C2_MODEL", frontierModel)
  );

  return {
    defaultModel,
    baseModel,
    standardModel,
    enhancedModel,
    deepModel,
    frontierModel,
    emergencyModel,
    c2Model: emergencyModel
  };
}

function getOpenAIHealth() {
  const configured = isEnvConfigured("OPENAI_API_KEY");
  const models = getModelConfig();

  return {
    provider: "OpenAI",
    configured,
    available: configured,
    apiMode: "chat.completions",
    apiKey: redactEnv("OPENAI_API_KEY"),
    model: models.defaultModel,
    models,
    boundary: configured
      ? "OpenAI provider configured. JOKER-C2 may call the model through governed runtime policy."
      : "OpenAI provider missing. Runtime model calls must degrade safely until OPENAI_API_KEY is configured."
  };
}

function buildRequiredTablesSql(): string {
  const tableList = HBCE_DATABASE_SCHEMA_TABLES
    .map((tableName) => sqlLiteral(tableName))
    .join(", ");

  return `
SELECT table_name
FROM information_schema.tables
WHERE table_schema IN ('public', current_schema())
  AND table_name IN (${tableList})
ORDER BY table_name;
`.trim();
}

function buildUnknownTableHealth(error: string): DatabaseTableHealth[] {
  return HBCE_DATABASE_SCHEMA_TABLES.map(
    (tableName): DatabaseTableHealth => ({
      tableName,
      required: true,
      present: false,
      status: "UNKNOWN",
      error
    })
  );
}

async function readRequiredDatabaseTables(): Promise<{
  tables: DatabaseTableHealth[];
  missingTables: string[];
  error: string | null;
}> {
  const result = await queryHbceDatabase<InformationSchemaTableRow>(
    buildRequiredTablesSql()
  );

  if (!result.ok) {
    const error = result.error || "DATABASE_TABLE_HEALTH_QUERY_FAILED";

    return {
      tables: buildUnknownTableHealth(error),
      missingTables: [...HBCE_DATABASE_SCHEMA_TABLES],
      error
    };
  }

  const presentTables = new Set(
    result.rows
      .map((row) => row.table_name)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );

  const tables: DatabaseTableHealth[] = HBCE_DATABASE_SCHEMA_TABLES.map(
    (tableName): DatabaseTableHealth => {
      const present = presentTables.has(tableName);

      return {
        tableName,
        required: true,
        present,
        status: present ? "PRESENT" : "MISSING",
        error: present ? null : `Required table ${tableName} is missing.`
      };
    }
  );

  return {
    tables,
    missingTables: tables
      .filter((table) => !table.present)
      .map((table) => table.tableName),
    error: null
  };
}

async function readDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const configured = isHbceDatabaseConfigured();
    const available = isHbceDatabaseAvailable();
    const description = describeDefaultHbceDatabase();
    const boundary = getHbceDatabaseBoundary();

    if (!configured || !available) {
      const error = configured
        ? "HBCE database adapter is not available."
        : "DATABASE_URL is not configured.";

      return {
        configured,
        available,
        schemaReady: false,
        schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
        mode: "PROCESS_MEMORY_MVP",
        description,
        boundary,
        initialization: {
          attempted: false,
          ok: false,
          status: configured ? "DATABASE_NOT_AVAILABLE" : "DATABASE_NOT_CONFIGURED",
          rowCount: 0,
          durationMs: 0,
          error
        },
        tables: buildUnknownTableHealth("Database unavailable during health check."),
        missingTables: [...HBCE_DATABASE_SCHEMA_TABLES],
        requiredRuntimeTables: {
          evtRecords: false,
          opcProofs: false,
          runtimeAuditLogs: false,
          modelUsage: false
        },
        error
      };
    }

    const initialization = await initializeHbceDatabaseSchema();
    const tableHealth = await readRequiredDatabaseTables();

    const schemaReady =
      initialization.ok &&
      !tableHealth.error &&
      tableHealth.missingTables.length === 0;

    const presentTableNames = new Set(
      tableHealth.tables
        .filter((table) => table.present)
        .map((table) => table.tableName)
    );

    return {
      configured,
      available,
      schemaReady,
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      mode: schemaReady ? "DATABASE_PERSISTENT" : "PROCESS_MEMORY_MVP",
      description,
      boundary,
      initialization: {
        attempted: true,
        ok: initialization.ok,
        status: initialization.status,
        rowCount: initialization.rowCount,
        durationMs: initialization.durationMs,
        error: initialization.error
      },
      tables: tableHealth.tables,
      missingTables: tableHealth.missingTables,
      requiredRuntimeTables: {
        evtRecords: presentTableNames.has("evt_records"),
        opcProofs: presentTableNames.has("opc_proofs"),
        runtimeAuditLogs: presentTableNames.has("runtime_audit_logs"),
        modelUsage: presentTableNames.has("model_usage")
      },
      error:
        initialization.error ||
        tableHealth.error ||
        (schemaReady
          ? null
          : `HBCE database schema is not ready. Missing tables: ${tableHealth.missingTables.join(", ")}`)
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "UNKNOWN_DATABASE_HEALTH_ERROR";

    return {
      configured: false,
      available: false,
      schemaReady: false,
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      mode: "PROCESS_MEMORY_MVP",
      description: null,
      boundary:
        "Database health check failed. Runtime must remain in PROCESS_MEMORY_MVP boundary and must not claim durable SaaS persistence.",
      initialization: {
        attempted: true,
        ok: false,
        status: "DATABASE_HEALTH_FAILED",
        rowCount: 0,
        durationMs: 0,
        error: errorMessage
      },
      tables: buildUnknownTableHealth(errorMessage),
      missingTables: [...HBCE_DATABASE_SCHEMA_TABLES],
      requiredRuntimeTables: {
        evtRecords: false,
        opcProofs: false,
        runtimeAuditLogs: false,
        modelUsage: false
      },
      error: errorMessage
    };
  }
}

function deriveHealthStatus(input: {
  openAIConfigured: boolean;
  database: DatabaseHealth;
}): HealthStatus {
  if (!input.openAIConfigured) {
    return "DEGRADED";
  }

  if (input.database.error) {
    return "DEGRADED";
  }

  if (!input.database.configured || !input.database.available || !input.database.schemaReady) {
    return "DEGRADED";
  }

  return "OK";
}

function buildRuntimeState(status: HealthStatus): string {
  if (status === "OK") {
    return "JOKER_C2_SAAS_CORE_HEALTHY";
  }

  return "JOKER_C2_SAAS_CORE_DEGRADED";
}

function buildPersistenceHealth(database: DatabaseHealth) {
  return {
    target: "DATABASE_PERSISTENT",
    activeMode: database.mode,
    databaseConfigured: database.configured,
    databaseAvailable: database.available,
    schemaReady: database.schemaReady,
    schemaVersion: database.schemaVersion,
    schemaInitialization: database.initialization,
    missingTables: database.missingTables,
    requiredRuntimeTables: database.requiredRuntimeTables,
    processMemoryMvp: database.mode === "PROCESS_MEMORY_MVP",
    databasePersistent: database.mode === "DATABASE_PERSISTENT",
    durableClaimAllowed: database.mode === "DATABASE_PERSISTENT" && database.schemaReady,
    boundary:
      database.mode === "DATABASE_PERSISTENT" && database.schemaReady
        ? "DATABASE_PERSISTENT is available and HBCE schema is ready. Runtime may expose durable persistence only for records actually written to persistent storage."
        : "PROCESS_MEMORY_MVP is active or schema is incomplete. Runtime must not claim durable SaaS continuity across serverless cold starts or deployments."
  };
}

function buildIdentityHealth() {
  return {
    runtimeEntity: RUNTIME_ENTITY,
    runtimeIpr: RUNTIME_IPR,
    humanIpr: "NOT_VERIFIED",
    accessDecision: "SERVER_VALIDATION_REQUIRED",
    matrixState: "MATRIX_LIMITED",
    semanticMemoryScope: "RUNTIME_ONLY",
    identityBinding: "NO_VERIFIED_BIOLOGICAL_SUBJECT",
    boundary:
      "GET /api/health does not authenticate a biological subject. Biological recognition requires server-side IPR account session validation or a valid HBCE IPR handoff during POST /api/chat."
  };
}

function buildProjectHealth() {
  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    sourceEvent: HBCE_SAAS_SOURCE_EVENT,
    sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
    targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
    organization: HBCE_ORGANIZATION,
    core: HBCE_CORE,
    state: "SAAS_CORE_V0_1_PREPARATION"
  };
}

function buildComponentHealth(input: {
  name: string;
  configured: boolean;
  available: boolean;
  mode: string;
  boundary: string;
}): ComponentHealth {
  return {
    name: input.name,
    status: input.configured && input.available ? "OK" : "DEGRADED",
    configured: input.configured,
    available: input.available,
    mode: input.mode,
    boundary: input.boundary
  };
}

function buildBoundaryHealth(database: DatabaseHealth) {
  return {
    ...RUNTIME_BOUNDARY_SUMMARY,
    legalCertification: false,
    identity:
      "IPR is an operational identity record inside HBCE/JOKER-C2. It does not replace CIE, SPID, passport, tax code, EUDI Wallet or qualified eIDAS trust services.",
    evt:
      "EVT supports operational event continuity and audit reconstruction. It is not legal certification.",
    opc:
      "OPC is a technical proof receipt for audit and governance review. It is not legal certification.",
    memory:
      "Memory does not authenticate identity, does not authorize future unsafe requests, does not lower cyber risk and does not bypass runtime policy.",
    audit:
      "Runtime audit logs support operational reconstruction, SaaS governance and review. They are not legal certification.",
    modelUsage:
      "Model usage logs support SaaS accounting, operational reconstruction and model cost visibility. They are not legal certification.",
    c2Defense:
      "C2 Defense is restricted to verified defensive cyber use inside an authorized perimeter. Payment alone does not grant C2 access.",
    persistence:
      database.mode === "DATABASE_PERSISTENT" && database.schemaReady
        ? "Database persistence and HBCE schema are available. Durable claims still require actual persistent record writes."
        : "Database persistence unavailable, schema incomplete or not configured. PROCESS_MEMORY_MVP boundary active.",
    provider:
      "OpenAI provides the cognitive model. JOKER-C2 provides identity, governance, policy, EVT, OPC, memory, audit and SaaS accounting boundary logic."
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const openAI = getOpenAIHealth();
  const database = await readDatabaseHealth();
  const persistence = buildPersistenceHealth(database);
  const c2Defense = getC2DefensePolicyHealth();
  const runtimeAuditLog = getRuntimeAuditLogHealth();
  const modelUsageLog = getModelUsageLogHealth();

  const status = deriveHealthStatus({
    openAIConfigured: openAI.configured,
    database
  });

  const componentHealth = {
    provider: buildComponentHealth({
      name: "OpenAI Provider",
      configured: openAI.configured,
      available: openAI.available,
      mode: openAI.apiMode,
      boundary: openAI.boundary
    }),
    database: buildComponentHealth({
      name: "HBCE Database",
      configured: database.configured,
      available: database.available && database.schemaReady,
      mode: database.mode,
      boundary:
        database.schemaReady
          ? "HBCE database schema is initialized and required runtime tables are present."
          : database.error || "HBCE database schema is not ready."
    }),
    runtimeAuditLog: buildComponentHealth({
      name: "Runtime Audit Log",
      configured: true,
      available: database.requiredRuntimeTables.runtimeAuditLogs,
      mode:
        typeof runtimeAuditLog.mode === "string"
          ? runtimeAuditLog.mode
          : "PROCESS_MEMORY_MVP",
      boundary:
        typeof runtimeAuditLog.boundary === "string"
          ? runtimeAuditLog.boundary
          : "Runtime audit log health boundary unavailable."
    }),
    modelUsageLog: buildComponentHealth({
      name: "Model Usage Log",
      configured: true,
      available: database.requiredRuntimeTables.modelUsage,
      mode:
        typeof modelUsageLog.mode === "string"
          ? modelUsageLog.mode
          : "PROCESS_MEMORY_MVP",
      boundary:
        typeof modelUsageLog.boundary === "string"
          ? modelUsageLog.boundary
          : "Model usage log health boundary unavailable."
    }),
    evtLedger: buildComponentHealth({
      name: "EVT Records",
      configured: true,
      available: database.requiredRuntimeTables.evtRecords,
      mode: database.requiredRuntimeTables.evtRecords
        ? "DATABASE_PERSISTENT_TARGET"
        : "PROCESS_MEMORY_MVP",
      boundary: database.requiredRuntimeTables.evtRecords
        ? "evt_records table is present."
        : "evt_records table is missing or schema initialization failed."
    }),
    opcProofs: buildComponentHealth({
      name: "OPC Proofs",
      configured: true,
      available: database.requiredRuntimeTables.opcProofs,
      mode: database.requiredRuntimeTables.opcProofs
        ? "DATABASE_PERSISTENT_TARGET"
        : "PROCESS_MEMORY_MVP",
      boundary: database.requiredRuntimeTables.opcProofs
        ? "opc_proofs table is present."
        : "opc_proofs table is missing or schema initialization failed."
    })
  };

  const payload = {
    ok: true,
    status,
    runtime: "AI_JOKER-C2",
    runtimeEntity: RUNTIME_ENTITY,
    runtimeIpr: RUNTIME_IPR,
    runtimeLevel: "C2_SUPERIOR_RUNTIME",
    state: buildRuntimeState(status),
    timestamp,

    project: buildProjectHealth(),

    provider: openAI,

    models: openAI.models,

    database,

    schema: {
      version: HBCE_DATABASE_SCHEMA_VERSION,
      ready: database.schemaReady,
      initialization: database.initialization,
      requiredTables: database.tables,
      missingTables: database.missingTables,
      requiredRuntimeTables: database.requiredRuntimeTables,
      legalCertification: false
    },

    persistence,

    components: componentHealth,

    identity: buildIdentityHealth(),

    access: {
      decision: "SERVER_VALIDATION_REQUIRED",
      matrixState: "MATRIX_LIMITED",
      semanticMemoryScope: "RUNTIME_ONLY",
      identityBinding: "NO_VERIFIED_BIOLOGICAL_SUBJECT",
      source: "HEALTH_CHECK",
      modelEscalationAllowed: false,
      quantumEmergencyAllowed: false,
      reason:
        "GET /api/health is a runtime configuration check. It does not grant biological IPR access."
    },

    memory: {
      scope: "RUNTIME_ONLY",
      authority: "RUNTIME_HEALTH_CHECK",
      persistenceMode: persistence.activeMode,
      targetPersistence: persistence.target,
      databaseConfigured: database.configured,
      databaseAvailable: database.available,
      schemaReady: database.schemaReady,
      durableClaimAllowed: persistence.durableClaimAllowed,
      boundary:
        "Health endpoint does not create or update IPR-bound memory. Memory state for real operations is evaluated during POST /api/chat."
    },

    matrix: {
      state: "MATRIX_LIMITED",
      active: false,
      reason:
        "MATRIX_ACTIVE requires verified biological IPR context. GET /api/health exposes runtime readiness only."
    },

    saasCore: {
      project: HBCE_SAAS_PROJECT,
      release: HBCE_SAAS_TARGET_RELEASE,
      sourceEvent: HBCE_SAAS_SOURCE_EVENT,
      sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
      targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
      status,
      runtimeReady: status === "OK",
      providerReady: openAI.configured,
      databaseReady: database.configured && database.available,
      schemaReady: database.schemaReady,
      evtReady: database.requiredRuntimeTables.evtRecords,
      opcReady: database.requiredRuntimeTables.opcProofs,
      auditReady: database.requiredRuntimeTables.runtimeAuditLogs,
      modelUsageReady: database.requiredRuntimeTables.modelUsage,
      legalCertification: false,
      boundary:
        "SaaS Core v0.1 requires governed runtime execution, OpenAI provider configuration, database persistence target, runtime audit logs, model usage logs, EVT continuity and OPC proof receipts."
    },

    c2Defense,

    runtimeAuditLog,

    modelUsageLog,

    operationalContext: {
      project: HBCE_SAAS_PROJECT,
      release: HBCE_SAAS_TARGET_RELEASE,
      sourceEvent: HBCE_SAAS_SOURCE_EVENT,
      sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
      targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
      runtimeEntity: RUNTIME_ENTITY,
      runtimeIpr: RUNTIME_IPR,
      provider: "OpenAI",
      openAIConfigured: openAI.configured,
      persistenceMode: persistence.activeMode,
      databaseConfigured: database.configured,
      databaseAvailable: database.available,
      schemaReady: database.schemaReady,
      missingTables: database.missingTables,
      auditLogConfigured: true,
      modelUsageLogConfigured: true,
      legalCertification: false
    },

    endpoints: {
      health: {
        method: "GET",
        path: "/api/health",
        status: "ACTIVE"
      },
      chat: {
        method: "POST",
        path: "/api/chat",
        status: "ACTIVE_RUNTIME_ENDPOINT",
        expectedOutputs: [
          "answer",
          "runtime",
          "identity",
          "memory",
          "evt",
          "opc",
          "audit",
          "modelUsage",
          "saas",
          "diagnostics"
        ]
      },
      opc: {
        methods: ["GET", "POST"],
        path: "/api/opc",
        status: "EXPECTED_PROOF_ENDPOINT"
      },
      files: {
        methods: ["POST", "DELETE"],
        path: "/api/files",
        status: "EXPECTED_FILE_CONTEXT_ENDPOINT"
      },
      interface: {
        method: "GET",
        path: "/interface",
        status: "EXPECTED_RUNTIME_INTERFACE"
      }
    },

    dashboard: {
      requiredPanels: [
        "Runtime Identity",
        "Provider Configuration",
        "IPR Access",
        "SaaS Core",
        "Persistence",
        "Database Schema",
        "Memory",
        "MATRIX",
        "C2 Defense",
        "Runtime Audit Log",
        "Model Usage Log",
        "EVT",
        "OPC",
        "Boundary"
      ],
      requiredRuntimeFields: [
        "runtimeEntity",
        "runtimeIpr",
        "humanIpr",
        "accessDecision",
        "identityBinding",
        "matrixState",
        "semanticMemoryScope",
        "openAIConfigured",
        "persistenceMode",
        "databaseConfigured",
        "databaseAvailable",
        "schemaReady",
        "missingTables",
        "c2Defense",
        "runtimeAuditLog",
        "modelUsageLog",
        "legalCertification"
      ]
    },

    boundary: buildBoundaryHealth(database)
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-HBCE-Runtime": "AI_JOKER-C2",
      "X-HBCE-Target-Release": "SaaS Core v0.1",
      "X-HBCE-Legal-Certification": "false"
    }
  });
}

export async function OPTIONS() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/health",
      methods: ["GET", "OPTIONS"],
      runtime: "AI_JOKER-C2",
      legalCertification: false,
      boundary:
        "Health endpoint exposes runtime configuration only. It does not authenticate biological IPR, does not create legal certification and does not grant C2 Defense access."
    },
    {
      status: 200,
      headers: {
        Allow: "GET, OPTIONS",
        "Cache-Control": "no-store, max-age=0",
        "X-HBCE-Runtime": "AI_JOKER-C2",
        "X-HBCE-Legal-Certification": "false"
      }
    }
  );
}

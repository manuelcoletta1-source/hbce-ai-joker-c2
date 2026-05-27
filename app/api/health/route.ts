import { NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  getHbceDatabaseBoundary,
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured
} from "@/lib/ipr-database";

import {
  getC2DefensePolicyHealth
} from "@/lib/c2-defense-policy";

import {
  getRuntimeAuditLogHealth
} from "@/lib/runtime-audit-log";

import {
  getModelUsageLogHealth
} from "@/lib/model-usage-log";

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

type DatabaseHealth = {
  configured: boolean;
  available: boolean;
  mode: "DATABASE_PERSISTENT" | "PROCESS_MEMORY_MVP";
  description: unknown;
  boundary: unknown;
  error: string | null;
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

function getModelConfig() {
  const defaultModel = readEnv("JOKER_MODEL", "gpt-4o-mini");
  const baseModel = readEnv("JOKER_MODEL_BASE", defaultModel);
  const standardModel = readEnv("JOKER_MODEL_STANDARD", readEnv("JOKER_STANDARD_MODEL", defaultModel));
  const enhancedModel = readEnv("JOKER_MODEL_ENHANCED", readEnv("JOKER_ENHANCED_MODEL", "gpt-4o"));
  const deepModel = readEnv("JOKER_MODEL_DEEP", readEnv("JOKER_DEEP_MODEL", enhancedModel));
  const frontierModel = readEnv("JOKER_MODEL_FRONTIER", readEnv("JOKER_FRONTIER_MODEL", deepModel));
  const emergencyModel = readEnv("JOKER_MODEL_EMERGENCY", readEnv("JOKER_C2_MODEL", frontierModel));

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
    apiMode: "responses",
    apiKey: redactEnv("OPENAI_API_KEY"),
    model: models.defaultModel,
    models,
    boundary: configured
      ? "OpenAI provider configured. JOKER-C2 may call the model through governed runtime policy."
      : "OpenAI provider missing. Runtime model calls must degrade safely until OPENAI_API_KEY is configured."
  };
}

function readDatabaseHealth(): DatabaseHealth {
  try {
    const configured = isHbceDatabaseConfigured();
    const available = isHbceDatabaseAvailable();

    return {
      configured,
      available,
      mode: configured && available ? "DATABASE_PERSISTENT" : "PROCESS_MEMORY_MVP",
      description: describeDefaultHbceDatabase(),
      boundary: getHbceDatabaseBoundary(),
      error: null
    };
  } catch (error) {
    return {
      configured: false,
      available: false,
      mode: "PROCESS_MEMORY_MVP",
      description: null,
      boundary:
        "Database health check failed. Runtime must remain in PROCESS_MEMORY_MVP boundary and must not claim durable SaaS persistence.",
      error: error instanceof Error ? error.message : "UNKNOWN_DATABASE_HEALTH_ERROR"
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
    processMemoryMvp: database.mode === "PROCESS_MEMORY_MVP",
    databasePersistent: database.mode === "DATABASE_PERSISTENT",
    durableClaimAllowed: database.mode === "DATABASE_PERSISTENT",
    boundary:
      database.mode === "DATABASE_PERSISTENT"
        ? "DATABASE_PERSISTENT is available. Runtime may expose durable persistence only for records actually written to persistent storage."
        : "PROCESS_MEMORY_MVP is active. Runtime must not claim durable SaaS continuity across serverless cold starts or deployments."
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
    c2Defense:
      "C2 Defense is restricted to verified defensive cyber use inside an authorized perimeter. Payment alone does not grant C2 access.",
    persistence:
      database.mode === "DATABASE_PERSISTENT"
        ? "Database persistence available. Durable claims still require actual persistent record writes."
        : "Database persistence unavailable or not configured. PROCESS_MEMORY_MVP boundary active.",
    provider:
      "OpenAI provides the cognitive model. JOKER-C2 provides identity, governance, policy, EVT, OPC, memory and audit boundary logic."
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const openAI = getOpenAIHealth();
  const database = readDatabaseHealth();
  const persistence = buildPersistenceHealth(database);

  const status = deriveHealthStatus({
    openAIConfigured: openAI.configured,
    database
  });

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

    persistence,

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

    c2Defense: getC2DefensePolicyHealth(),

    runtimeAuditLog: getRuntimeAuditLogHealth(),

    modelUsageLog: getModelUsageLogHealth(),

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
        status: "EXPECTED_RUNTIME_ENDPOINT"
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

import { NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  getHbceDatabaseBoundary,
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured
} from "@/lib/ipr-database";

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

import {
  evaluateSaasTierPolicy,
  toPublicSaasTierPolicyResult
} from "@/lib/saas-tier-policy";

import {
  evaluateRuntimeRiskPolicy,
  toPublicRuntimeRiskPolicyResult
} from "@/lib/runtime-risk-policy";

import {
  evaluateC2DefensePolicy,
  toPublicC2DefensePolicyResult
} from "@/lib/c2-defense-policy";

import {
  routeRuntimeModelFromSaasPolicy,
  toPublicRuntimeModelRoutingResult
} from "@/lib/runtime-model-router";

import { getRuntimeAuditLogHealth } from "@/lib/runtime-audit-log";
import { getModelUsageLogHealth } from "@/lib/model-usage-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthStatus = "OK" | "DEGRADED" | "ERROR";

type DatabaseHealth = {
  configured: boolean;
  available: boolean;
  persistenceMode: "PROCESS_MEMORY_MVP" | "DATABASE_PERSISTENT";
  boundary: string;
  description: unknown;
  error: string | null;
};

function readEnvString(name: string, fallback = ""): string {
  const value = process.env[name];

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed || fallback;
}

function readEnvBoolean(name: string): boolean {
  return Boolean(readEnvString(name));
}

function redactConfiguredSecret(name: string): {
  name: string;
  configured: boolean;
  value: "CONFIGURED" | "MISSING";
} {
  const configured = readEnvBoolean(name);

  return {
    name,
    configured,
    value: configured ? "CONFIGURED" : "MISSING"
  };
}

function getRuntimeModelConfig() {
  const defaultModel = readEnvString("JOKER_MODEL", "gpt-4o-mini");
  const standardModel = readEnvString("JOKER_STANDARD_MODEL", defaultModel);
  const enhancedModel = readEnvString("JOKER_ENHANCED_MODEL", "gpt-4o");
  const advancedModel = readEnvString("JOKER_ADVANCED_MODEL", "gpt-5.5-thinking");
  const c2Model = readEnvString("JOKER_C2_MODEL", advancedModel);

  return {
    defaultModel,
    standardModel,
    enhancedModel,
    advancedModel,
    c2Model
  };
}

function getOpenAIHealth() {
  const configured = readEnvBoolean("OPENAI_API_KEY");
  const modelConfig = getRuntimeModelConfig();

  return {
    provider: "OpenAI",
    configured,
    apiKey: redactConfiguredSecret("OPENAI_API_KEY"),
    apiMode: configured ? "LIVE_PROVIDER_CONFIGURED" : "PROVIDER_NOT_CONFIGURED",
    model: modelConfig.defaultModel,
    defaultModel: modelConfig.defaultModel,
    standardModel: modelConfig.standardModel,
    enhancedModel: modelConfig.enhancedModel,
    advancedModel: modelConfig.advancedModel,
    c2Model: modelConfig.c2Model,
    boundary: configured
      ? "OpenAI provider is configured. Runtime may call the configured provider through governed JOKER-C2 policy."
      : "OpenAI provider is not configured. Runtime chat execution requiring provider access must remain degraded or fail safely."
  };
}

async function safeReadDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const configured = Boolean(await Promise.resolve(isHbceDatabaseConfigured()));
    const available = Boolean(await Promise.resolve(isHbceDatabaseAvailable()));
    const boundary = String(await Promise.resolve(getHbceDatabaseBoundary()));
    const description = await Promise.resolve(describeDefaultHbceDatabase());

    return {
      configured,
      available,
      persistenceMode:
        configured && available ? "DATABASE_PERSISTENT" : "PROCESS_MEMORY_MVP",
      boundary,
      description,
      error: null
    };
  } catch (error) {
    return {
      configured: false,
      available: false,
      persistenceMode: "PROCESS_MEMORY_MVP",
      boundary:
        "Database health check failed. Runtime must declare PROCESS_MEMORY_MVP and avoid pretending database persistence exists.",
      description: null,
      error: error instanceof Error ? error.message : "Unknown database health error."
    };
  }
}

function deriveHealthStatus(input: {
  openAIConfigured: boolean;
  databaseError: string | null;
}): HealthStatus {
  if (!input.openAIConfigured) {
    return "DEGRADED";
  }

  if (input.databaseError) {
    return "DEGRADED";
  }

  return "OK";
}

function deriveHealthOk(status: HealthStatus): boolean {
  return status === "OK" || status === "DEGRADED";
}

function buildHealthBoundary(input: {
  status: HealthStatus;
  openAIConfigured: boolean;
  database: DatabaseHealth;
}): string {
  const openAIBoundary = input.openAIConfigured
    ? "OpenAI provider configured."
    : "OpenAI provider missing.";

  const databaseBoundary =
    input.database.persistenceMode === "DATABASE_PERSISTENT"
      ? "Database persistence available."
      : "Database persistence unavailable or not configured; PROCESS_MEMORY_MVP boundary active.";

  return [
    `Runtime health status: ${input.status}.`,
    openAIBoundary,
    databaseBoundary,
    "IPR is an operational identity record only.",
    "EVT is an operational continuity record only.",
    "OPC is a technical proof receipt only.",
    "C2 Defense is restricted to authorized defensive cyber use.",
    "legalCertification = false."
  ].join(" ");
}

function buildPolicySamples(database: DatabaseHealth) {
  const baseSaasPolicy = evaluateSaasTierPolicy({
    requestedTier: "BASE",
    identityState: "NOT_VERIFIED",
    organizationState: "NOT_REQUIRED",
    workspaceState: "NOT_REQUIRED",
    certificateActive: false,
    cyberRelevance: "NONE",
    contextClass: "RUNTIME",
    dataClassification: "PUBLIC",
    operationalValue: "LOW",
    proofRequirement: "NONE",
    databaseConfigured: database.configured,
    databaseAvailable: database.available
  });

  const iprSaasPolicy = evaluateSaasTierPolicy({
    requestedTier: "IPR",
    identityState: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    organizationState: "NOT_REQUIRED",
    workspaceState: "NOT_REQUIRED",
    certificateActive: true,
    cyberRelevance: "NONE",
    contextClass: "RUNTIME",
    dataClassification: "INTERNAL",
    operationalValue: "MEDIUM",
    proofRequirement: "EVT",
    databaseConfigured: database.configured,
    databaseAvailable: database.available
  });

  const c2SaasPolicy = evaluateSaasTierPolicy({
    requestedTier: "C2_DEFENSE",
    identityState: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    organizationState: "ACTIVE",
    workspaceState: "ACTIVE",
    certificateActive: true,
    hasAuthorizedPerimeter: true,
    defensivePurpose: true,
    cyberRelevance: "C2_RELEVANT",
    contextClass: "CYBER_DEFENSE",
    dataClassification: "RESTRICTED",
    operationalValue: "HIGH",
    proofRequirement: "EVT_OPC",
    databaseConfigured: database.configured,
    databaseAvailable: database.available
  });

  const riskPolicy = evaluateRuntimeRiskPolicy({
    message: "GET /api/health SaaS Core v0.1 diagnostic sample",
    requestedTier: "IPR",
    identityState: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    organizationState: "NOT_REQUIRED",
    workspaceState: "NOT_REQUIRED",
    certificateActive: true,
    contextClass: "RUNTIME",
    dataClassification: "INTERNAL",
    operationalValue: "MEDIUM",
    cyberRelevance: "NONE",
    proofRequirement: "EVT",
    databaseConfigured: database.configured,
    databaseAvailable: database.available
  });

  const c2Policy = evaluateC2DefensePolicy({
    message: "GET /api/health authorized defensive C2 boundary diagnostic sample",
    requestedTier: "C2_DEFENSE",
    identityState: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    organizationState: "ACTIVE",
    workspaceState: "ACTIVE",
    certificateActive: true,
    hasAuthorizedPerimeter: true,
    defensivePurpose: true,
    cyberRelevance: "C2_RELEVANT",
    forceC2Evaluation: true,
    organizationVerified: true,
    workspaceActive: true
  });

  const modelRouting = routeRuntimeModelFromSaasPolicy(iprSaasPolicy, getRuntimeModelConfig());

  return {
    base: toPublicSaasTierPolicyResult(baseSaasPolicy),
    ipr: toPublicSaasTierPolicyResult(iprSaasPolicy),
    c2Defense: toPublicSaasTierPolicyResult(c2SaasPolicy),
    runtimeRisk: toPublicRuntimeRiskPolicyResult(riskPolicy),
    c2DefensePolicy: toPublicC2DefensePolicyResult(c2Policy),
    modelRouting: toPublicRuntimeModelRoutingResult(modelRouting)
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const openAI = getOpenAIHealth();
  const database = await safeReadDatabaseHealth();

  const status = deriveHealthStatus({
    openAIConfigured: openAI.configured,
    databaseError: database.error
  });

  const runtimeAuditLogHealth = getRuntimeAuditLogHealth();
  const modelUsageLogHealth = getModelUsageLogHealth();
  const policySamples = buildPolicySamples(database);

  const response = {
    ok: deriveHealthOk(status),
    status,
    runtime: "nodejs",
    state:
      status === "OK"
        ? "JOKER_C2_SAAS_CORE_HEALTHY"
        : "JOKER_C2_SAAS_CORE_DEGRADED",
    timestamp,

    project: {
      name: HBCE_SAAS_PROJECT,
      targetRelease: HBCE_SAAS_TARGET_RELEASE,
      sourceEvent: HBCE_SAAS_SOURCE_EVENT,
      sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
      targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
      organization: HBCE_ORGANIZATION,
      core: HBCE_CORE,
      commercialState: "SAAS_CORE_V0_1_PREPARATION"
    },

    identity: {
      runtimeEntity: RUNTIME_ENTITY,
      runtimeIpr: RUNTIME_IPR,
      defaultHumanIpr: "NOT_VERIFIED",
      defaultAccess: "SERVER_VALIDATION_REQUIRED",
      boundary:
        "Runtime identity is operational. Biological subject recognition must come from server-side IPR validation, not from prompt text."
    },

    provider: openAI,

    database,

    persistence: {
      mode: database.persistenceMode,
      databaseConfigured: database.configured,
      databaseAvailable: database.available,
      processMemoryMvp:
        database.persistenceMode === "PROCESS_MEMORY_MVP",
      databasePersistent:
        database.persistenceMode === "DATABASE_PERSISTENT",
      boundary:
        database.persistenceMode === "DATABASE_PERSISTENT"
          ? "Persistence mode: DATABASE_PERSISTENT. Boundary: operational persistence enabled."
          : "Persistence mode: PROCESS_MEMORY_MVP. Boundary: non-persistent serverless memory."
    },

    policies: {
      samples: policySamples,
      boundary:
        "SaaS Core v0.1 health exposes policy samples only. Authoritative runtime decisions are produced inside POST /api/chat for each request."
    },

    logs: {
      runtimeAudit: runtimeAuditLogHealth,
      modelUsage: modelUsageLogHealth
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
        status: "EXPECTED_DASHBOARD"
      }
    },

    dashboard: {
      requiredPanels: [
        "Runtime Identity",
        "IPR Access",
        "SaaS Tier",
        "Model Escalation",
        "Memory State",
        "EVT Chain",
        "OPC Receipt",
        "Risk and Policy State",
        "C2 Defense Boundary",
        "Health and Configuration",
        "Runtime Audit Log",
        "Model Usage Log"
      ],
      requiredFields: [
        "project",
        "currentEvent",
        "targetCheckpoint",
        "runtimeEntity",
        "runtimeIpr",
        "humanIpr",
        "certificateId",
        "certificateStatus",
        "accessDecision",
        "identityBinding",
        "saasTier",
        "modelLevel",
        "selectedModel",
        "matrixState",
        "memoryScope",
        "persistenceMode",
        "lastEvt",
        "lastOpc",
        "riskState",
        "auditState",
        "c2DefenseBoundary",
        "openAIConfigured",
        "databaseConfigured"
      ]
    },

    boundaries: {
      ...RUNTIME_BOUNDARY_SUMMARY,
      legalCertification: false,
      provider:
        "OpenAI provides the cognitive model. JOKER-C2 provides IPR, SaaS policy, runtime governance, EVT, OPC, audit and boundary logic.",
      memory:
        "Memory does not authorize future unsafe requests, does not bypass policy review and does not create legal certification.",
      c2:
        "C2 Defense is restricted to verified defensive cyber use inside an authorized perimeter. Payment alone does not grant C2 access.",
      persistence:
        database.persistenceMode === "DATABASE_PERSISTENT"
          ? "Database persistence is available for operational continuity."
          : "Database persistence is unavailable or not configured; runtime must declare PROCESS_MEMORY_MVP.",
      health: buildHealthBoundary({
        status,
        openAIConfigured: openAI.configured,
        database
      })
    }
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-HBCE-Runtime": "AI_JOKER",
      "X-HBCE-Target-Release": "SaaS Core v0.1",
      "X-HBCE-Legal-Certification": "false"
    }
  });
}

export async function OPTIONS() {
  return NextResponse.json(
    {
      ok: true,
      methods: ["GET", "OPTIONS"],
      endpoint: "/api/health",
      boundary:
        "Health endpoint exposes runtime configuration and SaaS Core v0.1 governance status. legalCertification = false."
    },
    {
      status: 200,
      headers: {
        Allow: "GET, OPTIONS",
        "Cache-Control": "no-store, max-age=0",
        "X-HBCE-Runtime": "AI_JOKER",
        "X-HBCE-Legal-Certification": "false"
      }
    }
  );
}

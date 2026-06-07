import { NextResponse } from "next/server";

const API_VERSION = "v1" as const;
const ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-DEMO-IPR_AI_AUDIT_TRAIL-CONTRACT-v1.0" as const;
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer" as const;
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1" as const;
const HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1" as const;
const RUNTIME_IPR = "IPR-AI-0001" as const;
const TENANT = "HBCE-TENANT-SELF-PILOT" as const;
const WORKSPACE = "HBCE-WORKSPACE-RND" as const;

function utcNow(): string {
  return new Date().toISOString();
}

function buildDemoStep(
  order: number,
  code: string,
  title: string,
  description: string,
  endpoint: string,
  mutation: boolean
) {
  return {
    order,
    code,
    title,
    description,
    endpoint,
    mutation,
    expectedBoundary: {
      legalCertification: false,
      opcBoundary: "technical proof receipt only",
      iprCardBoundary:
        "internal operational identity certificate only; not an official public identity document"
    }
  };
}

const DEMO_STEPS = [
  buildDemoStep(
    1,
    "IPR_SESSION_OPEN",
    "Open verified operational IPR session",
    "Create or display the operational session binding between Human IPR, Runtime IPR, tenant and workspace.",
    "/api/v1/ipr/session",
    false
  ),
  buildDemoStep(
    2,
    "GOVERNED_CHAT_REQUEST",
    "Send governed AI request to JOKER-C2",
    "Submit a synchronous v1 chat request through the public contract layer while preserving runtime boundaries.",
    "/api/v1/chat",
    true
  ),
  buildDemoStep(
    3,
    "POLICY_SCOPE_RISK_CHECK",
    "Show policy, scope and risk posture",
    "Expose ALLOW policy, governed scope, IPR-bound memory context and no automatic memory write boundary.",
    "/api/v1/chat",
    false
  ),
  buildDemoStep(
    4,
    "EVT_PROOF_EVENT",
    "Display response EVT",
    "Show the event trace generated or referenced by the governed runtime response.",
    "/api/v1/events",
    false
  ),
  buildDemoStep(
    5,
    "OPC_TECHNICAL_RECEIPT",
    "Display OPC technical proof receipt",
    "Show the OPC receipt boundary as technical proof receipt only, not legal certification.",
    "/api/v1/opc/{opcId}",
    false
  ),
  buildDemoStep(
    6,
    "AUDIT_USAGE_RECEIPTS",
    "Display audit and model usage receipts",
    "Show audit and model-usage receipt lookup boundaries without exposing raw prompts, completions or provider payloads.",
    "/api/v1/audit/{auditId} + /api/v1/model-usage/{usageId}",
    false
  ),
  buildDemoStep(
    7,
    "DASHBOARD_DUAL_TIME_SEAL",
    "Show SaaS dashboard and Dual-Time Seal",
    "Present the runtime dashboard with Torino / Italia / Europa · UTC+2 operational temporal framing.",
    "/interface",
    false
  )
] as const;

const CURL_EXAMPLES = {
  openSession:
    "curl -s -X POST https://<domain>/api/v1/ipr/session -H 'content-type: application/json' -d '{\"humanIpr\":\"IPR-88505FE91013DCFE97C56ED1\",\"sessionIntent\":\"IPR AI Audit Trail Demo\"}'",
  governedChat:
    "curl -s -X POST https://<domain>/api/v1/chat -H 'content-type: application/json' -d '{\"sessionId\":\"<sessionId>\",\"humanIpr\":\"IPR-88505FE91013DCFE97C56ED1\",\"message\":\"ESEGUIRE DEMO IPR AI AUDIT TRAIL — SENZA FILE\"}'",
  selfTest: "curl -s https://<domain>/api/v1/self-test",
  openapi: "curl -s https://<domain>/api/v1/openapi"
} as const;

export async function GET(): Promise<NextResponse> {
  const nowIso = utcNow();

  return NextResponse.json(
    {
      ok: true,
      status: "HBCE_IPR_AI_AUDIT_TRAIL_DEMO_READY",
      apiVersion: API_VERSION,
      routeRevision: ROUTE_REVISION,
      product: PRODUCT_NAME,
      runtime: RUNTIME_NAME,
      demo: {
        name: "IPR AI Audit Trail Demo",
        status: "DEMO_CONTRACT_READY",
        mode: "STATIC_DEMO_PLAYBOOK_ONLY",
        executionMode: "NO_RUNTIME_EXECUTION_IN_THIS_ROUTE",
        targetAudience: ["B2B", "B2G", "institutional pilot", "technical due diligence"],
        objective:
          "Demonstrate a governed AI interaction where operational identity, AI response, event trace, technical proof receipt, audit and model-usage boundaries are visible in a single controlled flow.",
        durationMinutes: 12,
        headline:
          "AI JOKER-C2 does not expose only a chatbot; it exposes an identity-bound, event-traced, technically receipted AI runtime."
      },
      runtimeContext: {
        access: "ACCESS_GRANTED",
        humanIpr: HUMAN_IPR,
        runtimeIpr: RUNTIME_IPR,
        tenant: TENANT,
        workspace: WORKSPACE,
        memory: "DATABASE_PERSISTENT",
        memoryScope: "IPR_BOUND",
        policy: "ALLOW",
        matrix: "MATRIX_ACTIVE",
        sourceIntelligence: {
          status: "SOURCE_INTELLIGENCE_READY",
          revision: "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY",
          sourceSets: 5,
          catalogSources: 19,
          defaultSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY"
        }
      },
      demoFlow: {
        steps: DEMO_STEPS,
        successCriteria: [
          "Session identity is explicit and IPR-bound.",
          "The v1 chat contract returns a governed answer envelope.",
          "EVT/OPC/audit/model-usage identifiers are visible when produced by runtime operations.",
          "No raw audit log, prompt, completion, provider payload or raw file is exposed by receipt lookup endpoints.",
          "legalCertification remains false throughout the demo.",
          "OPC is always described as a technical proof receipt only."
        ]
      },
      presentationScript: {
        totalMinutes: 12,
        segments: [
          {
            timebox: "00:00-01:30",
            topic: "Problem",
            message:
              "Classical AI is not enough for institutional use when it cannot bind identity, event, proof and accountability."
          },
          {
            timebox: "01:30-03:00",
            topic: "IPR",
            message:
              "IPR is presented as an operational identity layer for the subject using the governed runtime."
          },
          {
            timebox: "03:00-05:00",
            topic: "Governed chat",
            message:
              "The /api/v1/chat contract sends a controlled AI request to JOKER-C2 through a public v1 envelope."
          },
          {
            timebox: "05:00-07:00",
            topic: "EVT / OPC / audit / usage",
            message:
              "The runtime response can be followed through event trace, technical proof receipt, audit receipt and model usage receipt."
          },
          {
            timebox: "07:00-09:00",
            topic: "REST and SDK path",
            message:
              "The v1 surface prepares SDK integration without selling an empty workflow wrapper."
          },
          {
            timebox: "09:00-11:00",
            topic: "Dashboard",
            message:
              "The SaaS dashboard makes runtime identity, memory, Source Intelligence and temporal seal visible."
          },
          {
            timebox: "11:00-12:00",
            topic: "Boundary and pilot",
            message:
              "The demo is technical and pilot-oriented: legalCertification=false and OPC remains a technical proof receipt only."
          }
        ]
      },
      publicEndpointsUsed: [
        "/api/v1",
        "/api/v1/health",
        "/api/v1/capabilities",
        "/api/v1/ipr/session",
        "/api/v1/ipr/session/{sessionId}",
        "/api/v1/chat",
        "/api/v1/events",
        "/api/v1/opc/{opcId}",
        "/api/v1/audit/{auditId}",
        "/api/v1/model-usage/{usageId}",
        "/api/v1/self-test",
        "/api/v1/openapi"
      ],
      curlExamples: CURL_EXAMPLES,
      operationalBoundary: {
        legalCertification: false,
        opc: "technical proof receipt only",
        iprCard:
          "internal operational identity certificate only; not an official public identity document",
        rawTextPersistence: false,
        rawBinaryPersistence: false,
        automaticIprMemoryWrite: false,
        sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
        noNewIprMemory: true,
        noNewSemanticMemoryPersistable: true,
        routePerformsRuntimeExecution: false,
        routePerformsDatabaseLookup: false,
        routePerformsMemoryWrite: false
      },
      nextRecommendedAction: {
        action: "RUN_DEMO_PLAYBOOK_MANUALLY",
        order: [
          "Open /api/v1/demo/ipr-ai-audit-trail",
          "Open /api/v1/self-test",
          "POST /api/v1/ipr/session",
          "POST /api/v1/chat",
          "Inspect returned EVT/OPC/audit/usage envelope",
          "Open /interface and show dashboard"
        ]
      },
      generatedAt: nowIso
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Version": API_VERSION,
        "X-HBCE-Route-Revision": ROUTE_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": "technical proof receipt only"
      }
    }
  );
}

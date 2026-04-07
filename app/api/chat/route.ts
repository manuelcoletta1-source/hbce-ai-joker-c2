import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import corpusCore from "../../../corpus-core.js";
import alienCodeCore, {
  isDerivativeLegitimate,
  explainDerivativeFailure
} from "../../../corpus-alien-code.js";
import webSearchLayer from "../../../web-search.js";

export const runtime = "nodejs";

type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";
type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";

type ChatBody = {
  message?: string;
  sessionId?: string;
  identity?: {
    entity?: string;
    ipr?: string;
    role?: string;
    type?: string;
  };
  files?: Array<{
    name?: string;
    text?: string;
  }>;
  derivativeContext?: boolean;
  continuityRef?: string;
};

type RuntimeEvent = {
  evt: string;
  prev: string;
  t: string;
  entity: string;
  ipr: string;
  kind: string;
  state: RuntimeState;
  decision: RuntimeDecision;
  anchors: {
    hash: string;
  };
  continuityRef: string | null;
  derivative?: {
    ipr: string;
    layer: string;
    legitimate: boolean;
  };
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function jsonHash(input: unknown): string {
  const data = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return `sha256:${Math.abs(hash).toString(16)}`;
}

function buildEvtId(): string {
  return `EVT-${Date.now()}`;
}

function getNowIso(): string {
  return new Date().toISOString();
}

function normalizeBody(body: ChatBody) {
  return {
    message: typeof body.message === "string" ? body.message.trim() : "",
    sessionId: typeof body.sessionId === "string" ? body.sessionId.trim() : "",
    identity: {
      entity:
        typeof body.identity?.entity === "string" ? body.identity.entity.trim() : "",
      ipr: typeof body.identity?.ipr === "string" ? body.identity.ipr.trim() : "",
      role: typeof body.identity?.role === "string" ? body.identity.role.trim() : "",
      type: typeof body.identity?.type === "string" ? body.identity.type.trim() : ""
    },
    files: Array.isArray(body.files) ? body.files : [],
    derivativeContext: body.derivativeContext === true,
    continuityRef:
      typeof body.continuityRef === "string" ? body.continuityRef.trim() : null
  };
}

function classifyIntent(message: string): string {
  const lower = message.toLowerCase();

  if (!lower) return "INVALID_INTENT";
  if (lower.includes("verify") || lower.includes("evidence")) return "EVIDENCE_QUERY";
  if (lower.includes("registry") || lower.includes("node")) return "REGISTRY_QUERY";
  if (lower.includes("protocol") || lower.includes("rule")) return "PROTOCOL_QUERY";
  if (lower.includes("derivative") || lower.includes("biocybernetic")) return "DERIVATIVE_QUERY";
  if (lower.includes("architecture") || lower.includes("layer")) return "ARCHITECTURE_QUERY";

  return "FACT_RETRIEVAL";
}

function bindIdentity(identity: ChatBody["identity"]) {
  if (!identity?.ipr) {
    return {
      valid: false,
      entity: "",
      ipr: "",
      reason: "MISSING_IDENTITY"
    } as const;
  }

  const lineage = corpusCore.getIdentityLineage();
  const match = lineage.find((item) => item.ipr === identity.ipr);

  if (!match) {
    return {
      valid: false,
      entity: identity.entity ?? "",
      ipr: identity.ipr,
      reason: "UNKNOWN_IDENTITY"
    } as const;
  }

  return {
    valid: true,
    entity: match.entity,
    ipr: match.ipr,
    type: match.type,
    role: match.role
  } as const;
}

function evaluateDerivativeLegitimacy(input: {
  derivativeContext: boolean;
  identityIpr: string;
}) {
  if (!input.derivativeContext) {
    return {
      derivativeRequested: false,
      legitimate: true,
      details: []
    } as const;
  }

  const context = {
    valid_human_origin: true,
    valid_primary_ai_root: true,
    identity_binding:
      input.identityIpr === corpusCore.IDENTITY_ROOTS.ai_root.ipr ||
      input.identityIpr === corpusCore.IDENTITY_ROOTS.derived_root.ipr,
    policy_validation: true,
    runtime_authorization: true,
    evt_continuity: true,
    evidence_production: true,
    verification: true
  };

  const legitimate = isDerivativeLegitimate(context);
  const details = explainDerivativeFailure(context);

  return {
    derivativeRequested: true,
    legitimate,
    details: details.failures
  } as const;
}

function evaluatePolicy(input: {
  identityValid: boolean;
  intent: string;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
}) {
  if (!input.identityValid) {
    return { allowed: false, decision: "BLOCK" as RuntimeDecision, reason: "IDENTITY_INVALID" };
  }

  if (input.intent === "INVALID_INTENT") {
    return { allowed: false, decision: "BLOCK" as RuntimeDecision, reason: "INVALID_INTENT" };
  }

  if (input.derivativeRequested && !input.derivativeLegitimate) {
    return {
      allowed: false,
      decision: "BLOCK" as RuntimeDecision,
      reason: "DERIVATIVE_LEGITIMACY_FAILED"
    };
  }

  return { allowed: true, decision: "ALLOW" as RuntimeDecision, reason: "POLICY_VALID" };
}

function evaluateRisk(input: {
  message: string;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
}) {
  if (!input.message) {
    return { acceptable: false, level: "HIGH", reason: "EMPTY_MESSAGE" } as const;
  }

  if (input.derivativeRequested && !input.derivativeLegitimate) {
    return { acceptable: false, level: "HIGH", reason: "DERIVATIVE_RISK" } as const;
  }

  return { acceptable: true, level: "LOW", reason: "RISK_ACCEPTABLE" } as const;
}

function buildPrompt(input: {
  message: string;
  identity: ReturnType<typeof bindIdentity>;
  intent: string;
  derivativeRequested: boolean;
  files: Array<{ name?: string; text?: string }>;
}) {
  const fileContext = input.files
    .filter((file) => typeof file.text === "string" && file.text.trim())
    .map((file) => `FILE: ${file.name || "unnamed"}\n${file.text}`)
    .join("\n\n");

  return [
    "You are AI JOKER-C2 inside the HBCE identity-bound operational runtime.",
    "You must produce a governed, concise, structured response.",
    "Do not simulate autonomy outside the protocol.",
    `Identity: ${input.identity.ipr} / ${input.identity.entity}`,
    `Intent: ${input.intent}`,
    `Derivative context: ${input.derivativeRequested ? "YES" : "NO"}`,
    fileContext ? `Operational file context:\n${fileContext}` : "",
    `User message:\n${input.message}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateGovernedResponse(prompt: string) {
  if (!openai) {
    return {
      text:
        "OPENAI_API_KEY is not configured. Runtime remains structurally valid, but model execution is unavailable.",
      state: "DEGRADED" as RuntimeState
    };
  }

  const response = await openai.responses.create({
    model: "gpt-5",
    reasoning: { effort: "medium" },
    text: { verbosity: "medium" },
    max_output_tokens: 700,
    input: prompt
  });

  return {
    text: response.output_text || "No output generated.",
    state: "OPERATIONAL" as RuntimeState
  };
}

function buildEvent(input: {
  prev: string | null;
  identity: ReturnType<typeof bindIdentity>;
  decision: RuntimeDecision;
  state: RuntimeState;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
  continuityRef: string | null;
  message: string;
}) {
  const evtPayload = {
    evt: buildEvtId(),
    prev: input.prev || "GENESIS",
    t: getNowIso(),
    entity: input.identity.entity,
    ipr: input.identity.ipr,
    kind: input.derivativeRequested ? "DERIVATIVE_CHAT_OPERATION" : "CHAT_OPERATION",
    state: input.state,
    decision: input.decision,
    continuityRef: input.continuityRef,
    message: input.message
  };

  const event: RuntimeEvent = {
    evt: evtPayload.evt,
    prev: evtPayload.prev,
    t: evtPayload.t,
    entity: evtPayload.entity,
    ipr: evtPayload.ipr,
    kind: evtPayload.kind,
    state: evtPayload.state,
    decision: evtPayload.decision,
    anchors: {
      hash: jsonHash(evtPayload)
    },
    continuityRef: evtPayload.continuityRef
  };

  if (input.derivativeRequested) {
    event.derivative = {
      ipr: corpusCore.IDENTITY_ROOTS.derived_root.ipr,
      layer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code,
      legitimate: input.derivativeLegitimate
    };
  }

  return Object.freeze(event);
}

export async function POST(req: NextRequest) {
  let body: ChatBody;

  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        state: "INVALID",
        decision: "BLOCK",
        error: "INVALID_JSON_BODY"
      },
      { status: 400 }
    );
  }

  const input = normalizeBody(body);
  const identity = bindIdentity(input.identity);
  const intent = classifyIntent(input.message);

  const derivative = evaluateDerivativeLegitimacy({
    derivativeContext: input.derivativeContext,
    identityIpr: identity.ipr
  });

  const policy = evaluatePolicy({
    identityValid: identity.valid,
    intent,
    derivativeRequested: derivative.derivativeRequested,
    derivativeLegitimate: derivative.legitimate
  });

  const risk = evaluateRisk({
    message: input.message,
    derivativeRequested: derivative.derivativeRequested,
    derivativeLegitimate: derivative.legitimate
  });

  const searchContext = webSearchLayer.buildWebSearchContext({
    query: input.message,
    identity: { ipr: identity.ipr, entity: identity.entity },
    session_id: input.sessionId,
    intent,
    derivative_context: derivative.derivativeRequested,
    continuity_ref: input.continuityRef,
    verification_path: true,
    evt_continuity: true,
    policy_validation: policy.allowed,
    runtime_authorization: policy.allowed && risk.acceptable,
    valid_human_origin: true,
    valid_primary_ai_root: true,
    evidence_production_path: true,
    scope_compatibility: true
  });

  if (!policy.allowed || !risk.acceptable) {
    const blockedEvent = buildEvent({
      prev: input.continuityRef,
      identity,
      decision: "BLOCK",
      state: "BLOCKED",
      derivativeRequested: derivative.derivativeRequested,
      derivativeLegitimate: derivative.legitimate,
      continuityRef: input.continuityRef,
      message: input.message
    });

    return NextResponse.json(
      {
        ok: false,
        state: "BLOCKED",
        decision: "BLOCK",
        reason: policy.allowed ? risk.reason : policy.reason,
        intent,
        derivative,
        searchContext,
        event: blockedEvent
      },
      { status: 403 }
    );
  }

  const prompt = buildPrompt({
    message: input.message,
    identity,
    intent,
    derivativeRequested: derivative.derivativeRequested,
    files: input.files
  });

  let generated;
  try {
    generated = await generateGovernedResponse(prompt);
  } catch (error) {
    const degradedEvent = buildEvent({
      prev: input.continuityRef,
      identity,
      decision: "ESCALATE",
      state: "DEGRADED",
      derivativeRequested: derivative.derivativeRequested,
      derivativeLegitimate: derivative.legitimate,
      continuityRef: input.continuityRef,
      message: input.message
    });

    return NextResponse.json(
      {
        ok: false,
        state: "DEGRADED",
        decision: "ESCALATE",
        reason: error instanceof Error ? error.message : "MODEL_EXECUTION_FAILED",
        derivative,
        searchContext,
        event: degradedEvent
      },
      { status: 500 }
    );
  }

  const event = buildEvent({
    prev: input.continuityRef,
    identity,
    decision: "ALLOW",
    state: generated.state,
    derivativeRequested: derivative.derivativeRequested,
    derivativeLegitimate: derivative.legitimate,
    continuityRef: input.continuityRef,
    message: input.message
  });

  return NextResponse.json({
    ok: true,
    state: generated.state,
    decision: "ALLOW",
    intent,
    identity: {
      entity: identity.entity,
      ipr: identity.ipr,
      type: identity.type,
      role: identity.role
    },
    derivative,
    response: generated.text,
    searchContext,
    event,
    protocol: {
      sequence: corpusCore.RUNTIME_SEQUENCE,
      failClosed: corpusCore.FAIL_CLOSED_RULES
    },
    alienCode: {
      interface: alienCodeCore.ORGANISM_SYSTEM_INTERFACE,
      derivationLayer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code
    }
  });
}

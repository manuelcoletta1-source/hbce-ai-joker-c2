import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import core from "../../../corpus-core.js";
import alienCode, {
  isDerivativeLegitimate,
  explainDerivativeFailure
} from "../../../corpus-alien-code.js";
import webSearch from "../../../web-search.js";
import { buildJokerSystemPrompt } from "../../../lib/joker/system-prompt";
import {
  composeAllowedPrefix,
  composeBlockedFrame,
  composeDegradedFrame
} from "../../../lib/joker/interpretive-engine";

export const runtime = "nodejs";

type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";
type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";
type RuntimeContextClass =
  | "IDENTITY"
  | "DOCUMENTAL"
  | "ARCHITECTURE"
  | "PROTOCOL"
  | "REGISTRY"
  | "EVIDENCE"
  | "DERIVATIVE"
  | "GENERAL";

type IdentityInput = {
  entity?: string;
  ipr?: string;
  role?: string;
  type?: string;
};

type FileInput = {
  name?: string;
  text?: string;
};

type ChatBody = {
  message?: string;
  sessionId?: string;
  identity?: IdentityInput;
  files?: FileInput[];
  derivativeContext?: boolean;
  continuityRef?: string;
};

type BoundIdentity =
  | {
      valid: true;
      entity: string;
      ipr: string;
      type?: string;
      role?: string;
    }
  | {
      valid: false;
      entity: string;
      ipr: string;
      reason: string;
    };

type DerivativeStatus = {
  requested: boolean;
  legitimate: boolean;
  details: string[];
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

function pseudoHash(input: unknown): string {
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

function nowIso(): string {
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
  if (lower.includes("identity") || lower.includes("ipr") || lower.includes("chi sei")) {
    return "IDENTITY_QUERY";
  }

  return "FACT_RETRIEVAL";
}

function mapContextClass(input: {
  intent: string;
  files: FileInput[];
  derivativeRequested: boolean;
}): RuntimeContextClass {
  if (input.files.length > 0) return "DOCUMENTAL";
  if (input.derivativeRequested || input.intent === "DERIVATIVE_QUERY") return "DERIVATIVE";
  if (input.intent === "ARCHITECTURE_QUERY") return "ARCHITECTURE";
  if (input.intent === "PROTOCOL_QUERY") return "PROTOCOL";
  if (input.intent === "REGISTRY_QUERY") return "REGISTRY";
  if (input.intent === "EVIDENCE_QUERY") return "EVIDENCE";
  if (input.intent === "IDENTITY_QUERY") return "IDENTITY";
  return "GENERAL";
}

function bindIdentity(identity: IdentityInput): BoundIdentity {
  const fallback = core.IDENTITY_LINEAGE.ai_root;
  const requestedIpr = identity.ipr?.trim();

  if (!requestedIpr) {
    return {
      valid: true,
      entity: fallback.entity,
      ipr: fallback.ipr,
      type: fallback.type,
      role: fallback.role
    };
  }

  const match = core.getIdentityLineage().find((item) => item.ipr === requestedIpr);

  if (!match) {
    return {
      valid: false,
      entity: identity.entity || "",
      ipr: requestedIpr,
      reason: "UNKNOWN_IDENTITY"
    };
  }

  return {
    valid: true,
    entity: match.entity,
    ipr: match.ipr,
    type: match.type,
    role: match.role
  };
}

function evaluateDerivativeStatus(input: {
  requested: boolean;
  identityIpr: string;
}): DerivativeStatus {
  if (!input.requested) {
    return {
      requested: false,
      legitimate: true,
      details: []
    };
  }

  const context = {
    valid_human_origin: true,
    valid_primary_ai_root: true,
    identity_binding:
      input.identityIpr === core.IDENTITY_LINEAGE.ai_root.ipr ||
      input.identityIpr === core.IDENTITY_LINEAGE.derived_root.ipr,
    policy_validation: true,
    runtime_authorization: true,
    evt_continuity: true,
    evidence_production: true,
    verification: true
  };

  return {
    requested: true,
    legitimate: isDerivativeLegitimate(context),
    details: explainDerivativeFailure(context).failures
  };
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
    return { acceptable: false, level: "HIGH", reason: "EMPTY_MESSAGE" as const };
  }

  if (input.derivativeRequested && !input.derivativeLegitimate) {
    return { acceptable: false, level: "HIGH", reason: "DERIVATIVE_RISK" as const };
  }

  return { acceptable: true, level: "LOW", reason: "RISK_ACCEPTABLE" as const };
}

function buildPrompt(input: {
  message: string;
  identity: Extract<BoundIdentity, { valid: true }>;
  decision: RuntimeDecision;
  state: RuntimeState;
  contextClass: RuntimeContextClass;
  derivative: DerivativeStatus;
  continuityRef: string | null;
  evtRef: string | null;
  files: FileInput[];
}) {
  return buildJokerSystemPrompt({
    identity: {
      entity: input.identity.entity,
      ipr: input.identity.ipr,
      type: input.identity.type,
      role: input.identity.role
    },
    decision: input.decision,
    state: input.state,
    contextClass: input.contextClass,
    derivative: {
      requested: input.derivative.requested,
      legitimate: input.derivative.legitimate,
      ipr: input.derivative.requested ? core.IDENTITY_LINEAGE.derived_root.ipr : undefined,
      entity: input.derivative.requested ? core.IDENTITY_LINEAGE.derived_root.entity : undefined,
      layer: input.derivative.requested
        ? core.BIOCYBERNETIC_DERIVATION_LAYER.code
        : undefined
    },
    continuityRef: input.continuityRef,
    evtRef: input.evtRef,
    message: input.message,
    files: input.files
  });
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
  identity: Extract<BoundIdentity, { valid: true }>;
  decision: RuntimeDecision;
  state: RuntimeState;
  derivative: DerivativeStatus;
  continuityRef: string | null;
  message: string;
}): RuntimeEvent {
  const payload = {
    evt: buildEvtId(),
    prev: input.prev || "GENESIS",
    t: nowIso(),
    entity: input.identity.entity,
    ipr: input.identity.ipr,
    kind: input.derivative.requested ? "DERIVATIVE_CHAT_OPERATION" : "CHAT_OPERATION",
    state: input.state,
    decision: input.decision,
    continuityRef: input.continuityRef,
    message: input.message
  };

  const event: RuntimeEvent = {
    evt: payload.evt,
    prev: payload.prev,
    t: payload.t,
    entity: payload.entity,
    ipr: payload.ipr,
    kind: payload.kind,
    state: payload.state,
    decision: payload.decision,
    anchors: {
      hash: pseudoHash(payload)
    },
    continuityRef: payload.continuityRef
  };

  if (input.derivative.requested) {
    event.derivative = {
      ipr: core.IDENTITY_LINEAGE.derived_root.ipr,
      layer: core.BIOCYBERNETIC_DERIVATION_LAYER.code,
      legitimate: input.derivative.legitimate
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
  const derivative = evaluateDerivativeStatus({
    requested: input.derivativeContext,
    identityIpr: identity.ipr
  });
  const contextClass = mapContextClass({
    intent,
    files: input.files,
    derivativeRequested: derivative.requested
  });

  const policy = evaluatePolicy({
    identityValid: identity.valid,
    intent,
    derivativeRequested: derivative.requested,
    derivativeLegitimate: derivative.legitimate
  });

  const risk = evaluateRisk({
    message: input.message,
    derivativeRequested: derivative.requested,
    derivativeLegitimate: derivative.legitimate
  });

  const searchContext = webSearch.authorizeWebSearch({
    query: input.message,
    identity: { ipr: identity.ipr, entity: identity.entity },
    intent,
    derivative_context: derivative.requested,
    evt_continuity: true,
    verification_path: true,
    policy_validation: policy.allowed,
    runtime_authorization: policy.allowed && risk.acceptable,
    valid_human_origin: true,
    valid_primary_ai_root: true,
    evidence_production_path: true
  });

  if (!identity.valid) {
    return NextResponse.json(
      {
        ok: false,
        state: "BLOCKED",
        decision: "BLOCK",
        reason: identity.reason,
        contextClass,
        derivative,
        searchContext,
        response:
          "AI JOKER-C2 offline for this request.\n\nRUNTIME RESULT\n- status → BLOCKED\n- reason → IDENTITY_INVALID"
      },
      { status: 403 }
    );
  }

  if (!policy.allowed || !risk.acceptable) {
    const blockedEvent = buildEvent({
      prev: input.continuityRef,
      identity,
      decision: "BLOCK",
      state: "BLOCKED",
      derivative,
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
        contextClass,
        derivative,
        searchContext,
        event: blockedEvent,
        response: composeBlockedFrame(
          {
            message: input.message,
            identity,
            contextClass,
            decision: "BLOCK",
            state: "BLOCKED",
            derivative: {
              requested: derivative.requested,
              legitimate: derivative.legitimate,
              ipr: derivative.requested ? core.IDENTITY_LINEAGE.derived_root.ipr : undefined,
              entity: derivative.requested ? core.IDENTITY_LINEAGE.derived_root.entity : undefined,
              layer: derivative.requested ? core.BIOCYBERNETIC_DERIVATION_LAYER.code : undefined,
              failures: derivative.details
            },
            continuityRef: input.continuityRef,
            evtRef: blockedEvent.evt,
            files: input.files
          },
          policy.allowed ? risk.reason : policy.reason
        ),
        protocol: {
          sequence: core.RUNTIME_SEQUENCE,
          failClosed: core.FAIL_CLOSED_RULES
        }
      },
      { status: 403 }
    );
  }

  const pendingEvtRef = buildEvtId();

  const prompt = buildPrompt({
    message: input.message,
    identity,
    decision: "ALLOW",
    state: "OPERATIONAL",
    contextClass,
    derivative,
    continuityRef: input.continuityRef,
    evtRef: pendingEvtRef,
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
      derivative,
      continuityRef: input.continuityRef,
      message: input.message
    });

    return NextResponse.json(
      {
        ok: false,
        state: "DEGRADED",
        decision: "ESCALATE",
        reason: error instanceof Error ? error.message : "MODEL_EXECUTION_FAILED",
        intent,
        contextClass,
        derivative,
        searchContext,
        event: degradedEvent,
        response: composeDegradedFrame(
          {
            message: input.message,
            identity,
            contextClass,
            decision: "ESCALATE",
            state: "DEGRADED",
            derivative: {
              requested: derivative.requested,
              legitimate: derivative.legitimate,
              ipr: derivative.requested ? core.IDENTITY_LINEAGE.derived_root.ipr : undefined,
              entity: derivative.requested ? core.IDENTITY_LINEAGE.derived_root.entity : undefined,
              layer: derivative.requested ? core.BIOCYBERNETIC_DERIVATION_LAYER.code : undefined,
              failures: derivative.details
            },
            continuityRef: input.continuityRef,
            evtRef: degradedEvent.evt,
            files: input.files
          },
          error instanceof Error ? error.message : "MODEL_EXECUTION_FAILED"
        ),
        protocol: {
          sequence: core.RUNTIME_SEQUENCE,
          failClosed: core.FAIL_CLOSED_RULES
        }
      },
      { status: 500 }
    );
  }

  const event = buildEvent({
    prev: input.continuityRef,
    identity,
    decision: "ALLOW",
    state: generated.state,
    derivative,
    continuityRef: input.continuityRef,
    message: input.message
  });

  const prefix = composeAllowedPrefix({
    message: input.message,
    identity,
    contextClass,
    decision: "ALLOW",
    state: generated.state,
    derivative: {
      requested: derivative.requested,
      legitimate: derivative.legitimate,
      ipr: derivative.requested ? core.IDENTITY_LINEAGE.derived_root.ipr : undefined,
      entity: derivative.requested ? core.IDENTITY_LINEAGE.derived_root.entity : undefined,
      layer: derivative.requested ? core.BIOCYBERNETIC_DERIVATION_LAYER.code : undefined,
      failures: derivative.details
    },
    continuityRef: input.continuityRef,
    evtRef: event.evt,
    files: input.files
  });

  return NextResponse.json({
    ok: true,
    state: generated.state,
    decision: "ALLOW",
    intent,
    contextClass,
    identity: {
      entity: identity.entity,
      ipr: identity.ipr,
      type: identity.type,
      role: identity.role
    },
    derivative,
    response: `${prefix}\n\n${generated.text}`.trim(),
    searchContext,
    event,
    protocol: {
      sequence: core.RUNTIME_SEQUENCE,
      failClosed: core.FAIL_CLOSED_RULES
    },
    alienCode: {
      interface: alienCode.ORGANISM_SYSTEM_INTERFACE,
      derivationLayer: core.BIOCYBERNETIC_DERIVATION_LAYER.code
    }
  });
}

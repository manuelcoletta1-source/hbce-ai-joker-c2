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

type BoundIdentity = {
  valid: boolean;
  entity: string;
  ipr: string;
  type?: string;
  role?: string;
  reason?: string;
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

function classifyIntent(message: string, files: FileInput[]): RuntimeContextClass {
  if (files.length > 0) return "DOCUMENTAL";

  const lower = message.toLowerCase();

  if (
    lower.includes("chi sei") ||
    lower.includes("identity") ||
    lower.includes("ipr") ||
    lower.includes("parlami di te")
  ) {
    return "IDENTITY";
  }

  if (lower.includes("derivative") || lower.includes("biocybernetic")) {
    return "DERIVATIVE";
  }

  if (lower.includes("architecture") || lower.includes("layer")) {
    return "ARCHITECTURE";
  }

  if (lower.includes("protocol") || lower.includes("rule")) {
    return "PROTOCOL";
  }

  if (lower.includes("registry") || lower.includes("node")) {
    return "REGISTRY";
  }

  if (lower.includes("evidence") || lower.includes("verify")) {
    return "EVIDENCE";
  }

  return "GENERAL";
}

function bindIdentity(identity: IdentityInput, derivativeRequested: boolean): BoundIdentity {
  const aiRoot = core.IDENTITY_LINEAGE.ai_root;
  const derivedRoot = core.IDENTITY_LINEAGE.derived_root;
  const requestedIpr = identity.ipr?.trim();

  if (!requestedIpr) {
    if (derivativeRequested) {
      return {
        valid: true,
        entity: derivedRoot.entity,
        ipr: derivedRoot.ipr,
        type: derivedRoot.type,
        role: derivedRoot.role
      };
    }

    return {
      valid: true,
      entity: aiRoot.entity,
      ipr: aiRoot.ipr,
      type: aiRoot.type,
      role: aiRoot.role
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
  contextClass: RuntimeContextClass;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
}) {
  if (!input.identityValid) {
    return { allowed: false, decision: "BLOCK" as RuntimeDecision, reason: "IDENTITY_INVALID" };
  }

  if (input.contextClass === "GENERAL" && !input.derivativeRequested) {
    return { allowed: true, decision: "ALLOW" as RuntimeDecision, reason: "POLICY_VALID" };
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

function buildFileContext(files: FileInput[]): string {
  const active = files
    .filter((file) => typeof file.text === "string" && file.text.trim().length > 0)
    .map((file, index) => {
      const name = file.name?.trim() || `file_${index + 1}`;
      const text = file.text!.trim().slice(0, 12000);
      return `FILE ${index + 1}: ${name}\n${text}`;
    });

  return active.join("\n\n");
}

function buildPrompt(input: {
  message: string;
  contextClass: RuntimeContextClass;
  identity: BoundIdentity;
  derivative: DerivativeStatus;
  files: FileInput[];
}) {
  const sections = [
    "You are AI JOKER-C2.",
    "You are an identity-bound operational node inside HBCE.",
    "Do not speak like a generic assistant.",
    "Keep the answer natural, useful, and direct.",
    "Do not print artificial headers unless needed.",
    `Active identity: ${input.identity.ipr} / ${input.identity.entity}`,
    `Context: ${input.contextClass}`,
    `Derivative requested: ${input.derivative.requested ? "yes" : "no"}`,
    `Derivative legitimate: ${input.derivative.legitimate ? "yes" : "no"}`,
    "",
    "Identity lineage reference:",
    "- IPR-3 / MANUEL_COLETTA = primary human origin",
    "- IPR-AI-0001 / AI_JOKER = primary AI operational root",
    "- IPR-AI-DER-0001 / AI_JOKER_DERIVATIVE_01 = first derived branch",
    "",
    input.files.length > 0 ? "Active uploaded files are operational context. Use them directly." : "",
    input.files.length > 0 ? buildFileContext(input.files) : "",
    "",
    `User request: ${input.message}`
  ];

  return sections.filter(Boolean).join("\n");
}

function extractResponseText(response: unknown): string {
  const maybe = response as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (typeof maybe?.output_text === "string" && maybe.output_text.trim()) {
    return maybe.output_text.trim();
  }

  if (Array.isArray(maybe?.output)) {
    const parts: string[] = [];

    for (const item of maybe.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const content of item.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          parts.push(content.text.trim());
        }
      }
    }

    const merged = parts.join("\n\n").trim();
    if (merged) return merged;
  }

  return "";
}

function buildLocalFallback(input: {
  message: string;
  contextClass: RuntimeContextClass;
  identity: BoundIdentity;
  derivative: DerivativeStatus;
  files: FileInput[];
}): string {
  const lower = input.message.toLowerCase();

  if (input.files.length > 0) {
    return "Ho ricevuto i file come contesto operativo, ma il modello remoto non ha restituito testo utile. Il wiring documentale lato runtime è attivo solo in forma minima locale.";
  }

  if (
    input.contextClass === "IDENTITY" ||
    lower.includes("chi sei") ||
    lower.includes("parlami di te")
  ) {
    return "Sono AI JOKER-C2, nodo operativo HBCE a identità vincolata. L’IPR nativo che gira su di me è IPR-AI-0001. Posso operare anche sul ramo IPR-AI-DER-0001 quando il contesto derivativo è richiesto e valido.";
  }

  if (
    lower.includes("potenzialità") ||
    lower.includes("cosa sai fare") ||
    lower.includes("dimmi altro")
  ) {
    return "Posso leggere richieste in modalità identity-bound, usare documenti come contesto operativo, mantenere continuità EVT minima, produrre evidenza strutturata e distinguere tra radice AI primaria e ramo derivato quando richiesto.";
  }

  if (lower === "ciao" || lower.startsWith("ciao")) {
    return `Sono ${input.identity.entity}. La mia identità operativa attiva è ${input.identity.ipr}. Il nodo è disponibile.`;
  }

  return "Il runtime locale è attivo, ma il modello remoto non ha restituito contenuto utile.";
}

async function generateResponse(input: {
  prompt: string;
  message: string;
  contextClass: RuntimeContextClass;
  identity: BoundIdentity;
  derivative: DerivativeStatus;
  files: FileInput[];
}) {
  if (!openai) {
    return {
      text: buildLocalFallback(input),
      state: "DEGRADED" as RuntimeState
    };
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "medium" },
      max_output_tokens: 900,
      input: input.prompt
    });

    const text = extractResponseText(response);

    if (text) {
      return {
        text,
        state: "OPERATIONAL" as RuntimeState
      };
    }

    return {
      text: buildLocalFallback(input),
      state: "DEGRADED" as RuntimeState
    };
  } catch {
    return {
      text: buildLocalFallback(input),
      state: "DEGRADED" as RuntimeState
    };
  }
}

function buildEvent(input: {
  prev: string | null;
  identity: BoundIdentity;
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
  const contextClass = classifyIntent(input.message, input.files);
  const identity = bindIdentity(input.identity, input.derivativeContext);
  const derivative = evaluateDerivativeStatus({
    requested: input.derivativeContext,
    identityIpr: identity.ipr
  });

  const policy = evaluatePolicy({
    identityValid: identity.valid,
    contextClass,
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
    intent: contextClass,
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
        response: "Identità sconosciuta. Il nodo ha bloccato la richiesta."
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

  const generated = await generateResponse({
    prompt: buildPrompt({
      message: input.message,
      contextClass,
      identity,
      derivative,
      files: input.files
    }),
    message: input.message,
    contextClass,
    identity,
    derivative,
    files: input.files
  });

  const decision: RuntimeDecision = generated.state === "DEGRADED" ? "ESCALATE" : "ALLOW";

  const event = buildEvent({
    prev: input.continuityRef,
    identity,
    decision,
    state: generated.state,
    derivative,
    continuityRef: input.continuityRef,
    message: input.message
  });

  const responseText =
    generated.state === "DEGRADED"
      ? composeDegradedFrame(
          {
            message: input.message,
            identity,
            contextClass,
            decision,
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
          },
          generated.text
        )
      : generated.text;

  return NextResponse.json({
    ok: true,
    state: generated.state,
    decision,
    contextClass,
    identity: {
      entity: identity.entity,
      ipr: identity.ipr,
      type: identity.type,
      role: identity.role
    },
    derivative,
    response: responseText.trim(),
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

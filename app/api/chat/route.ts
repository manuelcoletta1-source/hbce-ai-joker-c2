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
export const dynamic = "force-dynamic";

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

type SearchIntentClass =
  | "FACT_RETRIEVAL"
  | "DOCUMENT_RETRIEVAL"
  | "ARCHITECTURE_QUERY"
  | "PROTOCOL_QUERY"
  | "REGISTRY_QUERY"
  | "EVIDENCE_QUERY"
  | "DERIVATIVE_QUERY"
  | "NETWORK_QUERY"
  | "INVALID_INTENT";

type IdentityInput = {
  entity?: string;
  ipr?: string;
  role?: string;
  type?: string;
};

type FileInput = {
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  role?: string;
  uploaded?: boolean;
};

type ChatBody = {
  message?: string;
  sessionId?: string;
  identity?: IdentityInput;
  files?: FileInput[];
  derivativeContext?: boolean;
  continuityRef?: string;
};

type NormalizedChatInput = {
  message: string;
  sessionId: string;
  identity: {
    entity: string;
    ipr: string;
    role: string;
    type: string;
  };
  files: FileInput[];
  derivativeContext: boolean;
  continuityRef: string | null;
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

type PolicyResult = {
  allowed: boolean;
  decision: RuntimeDecision;
  reason: string;
};

type RiskResult = {
  acceptable: boolean;
  level: "LOW" | "HIGH";
  reason: "RISK_ACCEPTABLE" | "EMPTY_MESSAGE" | "DERIVATIVE_RISK";
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

type GeneratedResponse = {
  text: string;
  state: RuntimeState;
  degradedReason?: string;
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

function normalizeBody(body: ChatBody): NormalizedChatInput {
  return {
    message: typeof body.message === "string" ? body.message.trim() : "",
    sessionId: typeof body.sessionId === "string" ? body.sessionId.trim() : "",
    identity: {
      entity:
        typeof body.identity?.entity === "string"
          ? body.identity.entity.trim()
          : "",
      ipr:
        typeof body.identity?.ipr === "string"
          ? body.identity.ipr.trim()
          : "",
      role:
        typeof body.identity?.role === "string"
          ? body.identity.role.trim()
          : "",
      type:
        typeof body.identity?.type === "string"
          ? body.identity.type.trim()
          : ""
    },
    files: Array.isArray(body.files) ? body.files : [],
    derivativeContext: body.derivativeContext === true,
    continuityRef:
      typeof body.continuityRef === "string" && body.continuityRef.trim()
        ? body.continuityRef.trim()
        : null
  };
}

function classifyIntent(message: string, files: FileInput[]): RuntimeContextClass {
  if (files.length > 0) return "DOCUMENTAL";

  const lower = message.toLowerCase();

  if (
    lower.includes("chi sei") ||
    lower.includes("identity") ||
    lower.includes("identità") ||
    lower.includes("ipr") ||
    lower.includes("parlami di te") ||
    lower.includes("presentati") ||
    lower.includes("descriviti")
  ) {
    return "IDENTITY";
  }

  if (
    lower.includes("derivative") ||
    lower.includes("derivativo") ||
    lower.includes("derivato") ||
    lower.includes("biocybernetic") ||
    lower.includes("biocibernetico")
  ) {
    return "DERIVATIVE";
  }

  if (
    lower.includes("architecture") ||
    lower.includes("architettura") ||
    lower.includes("layer") ||
    lower.includes("runtime")
  ) {
    return "ARCHITECTURE";
  }

  if (
    lower.includes("protocol") ||
    lower.includes("protocollo") ||
    lower.includes("rule") ||
    lower.includes("regola")
  ) {
    return "PROTOCOL";
  }

  if (
    lower.includes("registry") ||
    lower.includes("registro") ||
    lower.includes("node") ||
    lower.includes("nodo") ||
    lower.includes("network")
  ) {
    return "REGISTRY";
  }

  if (
    lower.includes("evidence") ||
    lower.includes("prova") ||
    lower.includes("verify") ||
    lower.includes("verifica") ||
    lower.includes("audit") ||
    lower.includes("ledger")
  ) {
    return "EVIDENCE";
  }

  return "GENERAL";
}

function mapContextClassToSearchIntent(
  contextClass: RuntimeContextClass
): SearchIntentClass {
  switch (contextClass) {
    case "DOCUMENTAL":
      return "DOCUMENT_RETRIEVAL";
    case "ARCHITECTURE":
      return "ARCHITECTURE_QUERY";
    case "PROTOCOL":
      return "PROTOCOL_QUERY";
    case "REGISTRY":
      return "REGISTRY_QUERY";
    case "EVIDENCE":
      return "EVIDENCE_QUERY";
    case "DERIVATIVE":
      return "DERIVATIVE_QUERY";
    case "IDENTITY":
    case "GENERAL":
    default:
      return "FACT_RETRIEVAL";
  }
}

function shouldShowRuntimeFrame(input: {
  message: string;
  contextClass: RuntimeContextClass;
  state?: RuntimeState;
}): boolean {
  const lower = input.message.toLowerCase();

  return (
    input.state === "BLOCKED" ||
    lower.includes("debug") ||
    lower.includes("runtime") ||
    lower.includes("protocollo") ||
    lower.includes("protocol") ||
    lower.includes("evt") ||
    lower.includes("ledger") ||
    lower.includes("audit") ||
    lower.includes("evidence") ||
    lower.includes("verifica") ||
    lower.includes("verify") ||
    lower.includes("lineage") ||
    lower.includes("derivato") ||
    lower.includes("derivative") ||
    lower.includes("biocibernetico") ||
    lower.includes("biocybernetic") ||
    lower.includes("fail-closed") ||
    lower.includes("fail closed") ||
    input.contextClass === "PROTOCOL" ||
    input.contextClass === "REGISTRY" ||
    input.contextClass === "EVIDENCE" ||
    input.contextClass === "DERIVATIVE"
  );
}

function bindIdentity(
  identity: IdentityInput,
  derivativeRequested: boolean
): BoundIdentity {
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

  const match = core
    .getIdentityLineage()
    .find((item) => item.ipr === requestedIpr);

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

  const failureReport = explainDerivativeFailure(context);

  return {
    requested: true,
    legitimate: isDerivativeLegitimate(context),
    details: failureReport.failures
  };
}

function evaluatePolicy(input: {
  identityValid: boolean;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
}): PolicyResult {
  if (!input.identityValid) {
    return {
      allowed: false,
      decision: "BLOCK",
      reason: "IDENTITY_INVALID"
    };
  }

  if (input.derivativeRequested && !input.derivativeLegitimate) {
    return {
      allowed: false,
      decision: "BLOCK",
      reason: "DERIVATIVE_LEGITIMACY_FAILED"
    };
  }

  return {
    allowed: true,
    decision: "ALLOW",
    reason: "POLICY_VALID"
  };
}

function evaluateRisk(input: {
  message: string;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
}): RiskResult {
  if (!input.message) {
    return {
      acceptable: false,
      level: "HIGH",
      reason: "EMPTY_MESSAGE"
    };
  }

  if (input.derivativeRequested && !input.derivativeLegitimate) {
    return {
      acceptable: false,
      level: "HIGH",
      reason: "DERIVATIVE_RISK"
    };
  }

  return {
    acceptable: true,
    level: "LOW",
    reason: "RISK_ACCEPTABLE"
  };
}

function normalizeFilesForPrompt(files: FileInput[]) {
  return files.map((file) => ({
    name: file.name,
    text: file.text || file.content || ""
  }));
}

function buildPrompt(input: {
  message: string;
  contextClass: RuntimeContextClass;
  identity: BoundIdentity;
  derivative: DerivativeStatus;
  files: FileInput[];
  continuityRef: string | null;
  evtRef: string | null;
  decision: RuntimeDecision;
  state: RuntimeState;
}): string {
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
      ipr: input.derivative.requested
        ? core.IDENTITY_LINEAGE.derived_root.ipr
        : undefined,
      entity: input.derivative.requested
        ? core.IDENTITY_LINEAGE.derived_root.entity
        : undefined,
      layer: input.derivative.requested
        ? core.BIOCYBERNETIC_DERIVATION_LAYER.code
        : undefined
    },
    continuityRef: input.continuityRef,
    evtRef: input.evtRef,
    message: input.message,
    files: normalizeFilesForPrompt(input.files)
  });
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

function buildIdentityFallback(): string {
  const record = core.getAIJokerIPRRecord?.() || core.AI_JOKER_IPR_RECORD;

  return [
    "Ciao, sono AI JOKER-C2.",
    "",
    "Sono un’entità cibernetica operativa del sistema HBCE e una protesi cognitiva dell’identità biologica collegata al mio IPR.",
    "",
    "In pratica, parlo in modo naturale come una AI stile GPT, ma sotto il cofano sono progettato per operare con identità, continuità, traccia e verifica.",
    "",
    "La mia identità canonica è AI_JOKER, associata a IPR-AI-0001. Il checkpoint operativo attivo è EVT-0014-AI, collegato a HBCE-CORE-v3.",
    "",
    "Posso aiutarti a lavorare su testi, documenti, codice, GitHub, architetture HBCE, MATRIX e CORPUS ESOTEROLOGIA ERMETICA, trasformando materiale complesso in output chiari, strutturati e utilizzabili.",
    "",
    `Stato canonico: ${record?.state || "LOCKED"} · Ciclo: ${
      record?.cycle || "UP-MESE-3"
    } · Nodo: Torino, Italy.`
  ].join("\n");
}

function buildDocumentalFallback(input: {
  files: FileInput[];
  message: string;
}): string {
  const readableFiles = input.files.filter(
    (file) =>
      typeof (file.text || file.content) === "string" &&
      String(file.text || file.content).trim().length > 0
  );

  if (readableFiles.length === 0) {
    return [
      "Ho ricevuto i file come contesto operativo, ma non ho testo leggibile sufficiente da analizzare in questa richiesta.",
      "",
      "Carica preferibilmente file `.txt`, `.md`, `.json` o `.csv`, oppure incolla direttamente il testo nella chat."
    ].join("\n");
  }

  const fileList = readableFiles
    .map((file, index) => `${index + 1}. ${file.name || `file_${index + 1}`}`)
    .join("\n");

  return [
    "Ho ricevuto i file come contesto operativo.",
    "",
    "File leggibili attivi:",
    fileList,
    "",
    "Il modello remoto non ha restituito una risposta completa in questa esecuzione, ma il passaggio documentale verso il runtime è attivo. Puoi chiedermi di sintetizzare, indicizzare, riscrivere o analizzare il contenuto."
  ].join("\n");
}

function buildLocalFallback(input: {
  message: string;
  contextClass: RuntimeContextClass;
  identity: BoundIdentity;
  derivative: DerivativeStatus;
  files: FileInput[];
}): string {
  const lower = input.message.toLowerCase();

  if (input.contextClass === "DOCUMENTAL" || input.files.length > 0) {
    return buildDocumentalFallback({
      files: input.files,
      message: input.message
    });
  }

  if (
    input.contextClass === "IDENTITY" ||
    lower.includes("chi sei") ||
    lower.includes("parlami di te") ||
    lower.includes("presentati") ||
    lower.includes("descriviti")
  ) {
    return buildIdentityFallback();
  }

  if (
    lower.includes("potenzialità") ||
    lower.includes("cosa sai fare") ||
    lower.includes("dimmi altro") ||
    lower.includes("capacità")
  ) {
    return [
      "Posso aiutarti a trasformare richieste, testi e documenti in output operativi.",
      "",
      "Le mie funzioni principali sono: analisi testuale, sintesi, riscrittura, progettazione di file GitHub, costruzione di indici, tabelle, architetture e documenti tecnici.",
      "",
      "La differenza rispetto a una AI generica è che AI JOKER-C2 è pensato come nodo HBCE: parla in modo naturale, ma mantiene una logica interna di identità, traccia, continuità e verifica."
    ].join("\n");
  }

  if (lower === "ciao" || lower.startsWith("ciao")) {
    return "Ciao, sono AI JOKER-C2. Sono operativo: posso aiutarti con testi, file, codice, GitHub, architetture HBCE, MATRIX e sviluppo del Corpus.";
  }

  return "Sono AI JOKER-C2. Il runtime locale è attivo, ma il modello remoto non ha restituito contenuto utile in questa esecuzione.";
}

async function generateResponse(input: {
  prompt: string;
  message: string;
  contextClass: RuntimeContextClass;
  identity: BoundIdentity;
  derivative: DerivativeStatus;
  files: FileInput[];
}): Promise<GeneratedResponse> {
  if (!openai) {
    return {
      text: buildLocalFallback(input),
      state: "DEGRADED",
      degradedReason: "OPENAI_CLIENT_NOT_CONFIGURED"
    };
  }

  try {
    const response = await openai.responses.create({
      model: process.env.JOKER_MODEL || "gpt-4o-mini",
      max_output_tokens: 1200,
      input: input.prompt
    });

    const text = extractResponseText(response);

    if (text) {
      return {
        text,
        state: "OPERATIONAL"
      };
    }

    return {
      text: buildLocalFallback(input),
      state: "DEGRADED",
      degradedReason: "OPENAI_EMPTY_RESPONSE"
    };
  } catch (error) {
    return {
      text: buildLocalFallback(input),
      state: "DEGRADED",
      degradedReason:
        error instanceof Error ? error.message : "OPENAI_REQUEST_FAILED"
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

function buildInterpretiveInput(input: {
  message: string;
  identity: BoundIdentity;
  contextClass: RuntimeContextClass;
  decision: RuntimeDecision;
  state: RuntimeState;
  derivative: DerivativeStatus;
  continuityRef: string | null;
  evtRef: string | null;
  files: FileInput[];
}) {
  return {
    message: input.message,
    identity: {
      entity: input.identity.entity,
      ipr: input.identity.ipr,
      type: input.identity.type,
      role: input.identity.role
    },
    contextClass: input.contextClass,
    decision: input.decision,
    state: input.state,
    derivative: {
      requested: input.derivative.requested,
      legitimate: input.derivative.legitimate,
      ipr: input.derivative.requested
        ? core.IDENTITY_LINEAGE.derived_root.ipr
        : undefined,
      entity: input.derivative.requested
        ? core.IDENTITY_LINEAGE.derived_root.entity
        : undefined,
      layer: input.derivative.requested
        ? core.BIOCYBERNETIC_DERIVATION_LAYER.code
        : undefined,
      failures: input.derivative.details
    },
    continuityRef: input.continuityRef,
    evtRef: input.evtRef,
    files: normalizeFilesForPrompt(input.files)
  };
}

function buildSearchContext(input: {
  message: string;
  identity: BoundIdentity;
  contextClass: RuntimeContextClass;
  derivative: DerivativeStatus;
  policy: PolicyResult;
  risk: RiskResult;
}) {
  const searchIntent = mapContextClassToSearchIntent(input.contextClass);

  return webSearch.authorizeWebSearch({
    query: input.message,
    identity: {
      ipr: input.identity.ipr,
      entity: input.identity.entity
    },
    intent: searchIntent,
    derivative_context: input.derivative.requested,
    evt_continuity: true,
    verification_path: true,
    policy_validation: input.policy.allowed,
    runtime_authorization: input.policy.allowed && input.risk.acceptable,
    valid_human_origin: true,
    valid_primary_ai_root: true,
    evidence_production_path: true
  });
}

function buildProtocolFrame() {
  return {
    sequence: core.RUNTIME_SEQUENCE,
    failClosed: core.FAIL_CLOSED_RULES
  };
}

function buildAlienCodeFrame() {
  return {
    interface: alienCode.ORGANISM_SYSTEM_INTERFACE,
    derivationLayer: core.BIOCYBERNETIC_DERIVATION_LAYER.code
  };
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
    derivativeRequested: derivative.requested,
    derivativeLegitimate: derivative.legitimate
  });

  const risk = evaluateRisk({
    message: input.message,
    derivativeRequested: derivative.requested,
    derivativeLegitimate: derivative.legitimate
  });

  const searchContext = buildSearchContext({
    message: input.message,
    identity,
    contextClass,
    derivative,
    policy,
    risk
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
        response: "Identità sconosciuta. Il nodo ha bloccato la richiesta.",
        protocol: buildProtocolFrame()
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

    const blockedFrame = composeBlockedFrame(
      buildInterpretiveInput({
        message: input.message,
        identity,
        contextClass,
        decision: "BLOCK",
        state: "BLOCKED",
        derivative,
        continuityRef: input.continuityRef,
        evtRef: blockedEvent.evt,
        files: input.files
      }),
      policy.allowed ? risk.reason : policy.reason
    );

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
        response: blockedFrame,
        protocol: buildProtocolFrame()
      },
      { status: 403 }
    );
  }

  const pendingEvtRef = buildEvtId();

  const prompt = buildPrompt({
    message: input.message,
    contextClass,
    identity,
    derivative,
    files: input.files,
    continuityRef: input.continuityRef,
    evtRef: pendingEvtRef,
    decision: "ALLOW",
    state: "OPERATIONAL"
  });

  const generated = await generateResponse({
    prompt,
    message: input.message,
    contextClass,
    identity,
    derivative,
    files: input.files
  });

  const decision: RuntimeDecision =
    generated.state === "DEGRADED" ? "ESCALATE" : "ALLOW";

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
    generated.state === "DEGRADED" &&
    shouldShowRuntimeFrame({
      message: input.message,
      contextClass,
      state: generated.state
    })
      ? composeDegradedFrame(
          buildInterpretiveInput({
            message: input.message,
            identity,
            contextClass,
            decision,
            state: generated.state,
            derivative,
            continuityRef: input.continuityRef,
            evtRef: event.evt,
            files: input.files
          }),
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
    derivative: {
      requested: derivative.requested,
      legitimate: derivative.legitimate,
      details: shouldShowRuntimeFrame({
        message: input.message,
        contextClass,
        state: generated.state
      })
        ? derivative.details
        : []
    },
    response: responseText.trim(),
    searchContext,
    event,
    diagnostics: {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      modelUsed: process.env.JOKER_MODEL || "gpt-4o-mini",
      degradedReason: generated.degradedReason || null
    },
    protocol: buildProtocolFrame(),
    alienCode: buildAlienCodeFrame()
  });
}

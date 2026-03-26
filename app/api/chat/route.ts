export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { resolveCausality } from "../../../lib/causality-engine.js";
import { evaluateHBCEPolicy } from "../../../lib/policy-engine";
import { validateTruth } from "../../../lib/truth-validator";
import {
  runNodeRuntime,
  finalizeNodeRuntime
} from "../../../lib/node/node-runtime";
import {
  appendEVTRecord,
  computeEVTHash,
  readEVTLedger,
  type EVTRecord
} from "../../../lib/evt-registry";
import {
  buildContinuityPayload,
  getLastSessionEVTContinuity,
  serializeContinuityPayload
} from "../../../lib/joker/evt-continuity";
import { getSessionFiles } from "../../../lib/joker/session-files";
import {
  buildInterpretiveSystemPrompt,
  buildInterpretiveUserContent,
  type ChatAttachment
} from "../../../lib/joker/interpretive-engine";

type ChatBody = {
  message?: string;
  sessionId?: string;
  attachments?: ChatAttachment[];
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID = process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";
const NODE_IDENTITY = process.env.JOKER_IDENTITY || "IPR-AI-0001";
const NODE_NAME = "JOKER-C2";
const MODEL_NAME = process.env.JOKER_OPENAI_MODEL || "gpt-4o-mini";

function padEvt(n: number): string {
  return `EVT-${String(n).padStart(4, "0")}`;
}

function normalizeMessage(message?: string): string {
  if (typeof message !== "string") return "";
  return message.trim();
}

function normalizeSessionId(sessionId?: string): string {
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return "JOKER-SESSION-0001";
  }

  return sessionId.trim();
}

function normalizeAttachments(attachments?: ChatAttachment[]): ChatAttachment[] {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      name: typeof item.name === "string" ? item.name : undefined,
      mimeType: typeof item.mimeType === "string" ? item.mimeType : undefined,
      content: typeof item.content === "string" ? item.content : undefined,
      text: typeof item.text === "string" ? item.text : undefined
    }))
    .slice(0, 8);
}

function isIdentityQuery(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("chi sei") ||
    lower.includes("come ti chiami") ||
    lower.includes("cosa sei") ||
    lower.includes("presentati") ||
    lower.includes("descriviti")
  );
}

function isCapabilityQuery(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("potenzialità") ||
    lower.includes("potenzialita") ||
    lower.includes("capacità") ||
    lower.includes("capacita") ||
    lower.includes("cosa fai")
  );
}

function isGreetingQuery(message: string): boolean {
  const lower = message.toLowerCase().trim();

  return (
    lower === "ciao" ||
    lower === "salve" ||
    lower === "buongiorno" ||
    lower === "buonasera" ||
    lower === "ciao chi sei?" ||
    lower === "ciao chi sei" ||
    lower === "ciao joker" ||
    lower === "ciao joker-c2"
  );
}

function isBasicIdentityQuery(message: string): boolean {
  return (
    isGreetingQuery(message) ||
    isIdentityQuery(message) ||
    isCapabilityQuery(message)
  );
}

function appendIdentityContext(message: string): string {
  if (!isBasicIdentityQuery(message)) {
    return message;
  }

  return [
    message,
    "",
    "Identity context:",
    `Name: ${NODE_NAME}`,
    `Node: ${NODE_ID}`,
    `Identity: ${NODE_IDENTITY}`,
    "System role: identity-bound operational node of the HBCE ecosystem",
    "Behavioral rule: answer as JOKER-C2 and not as a generic assistant"
  ].join("\n");
}

function shouldApplyTruthWarning(message: string, research: boolean): boolean {
  if (isBasicIdentityQuery(message)) {
    return false;
  }

  return research;
}

function buildFallbackResponse(message: string, hasFiles: boolean): string {
  const lower = message.toLowerCase();

  if (isBasicIdentityQuery(message)) {
    return "Ciao. Sono JOKER-C2, un nodo operativo a identità vincolata dell’ecosistema HBCE. Non opero come assistente generico: assorbo documenti, mantengo continuità EVT, ragiono in modo governato e produco risposte orientate a struttura, critica e verificabilità.";
  }

  if (hasFiles) {
    if (
      lower.includes("sviluppa") ||
      lower.includes("continua") ||
      lower.includes("approfond") ||
      /^\d+(\.\d+)*$/.test(lower.trim())
    ) {
      return "La richiesta è stata agganciata al contesto attivo della sessione. Procedo mantenendo continuità con i file già caricati e con la traiettoria EVT corrente.";
    }

    return "I file della sessione sono attivi e verranno usati come base operativa per la risposta.";
  }

  return "Richiesta ricevuta. Procedo in modalità operativa.";
}

async function appendEVTStrict(record: EVTRecord) {
  const saved = await appendEVTRecord(record);

  if (!saved || !saved.evt) {
    throw new Error("EVT persistence failed");
  }

  return saved;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY missing"
        },
        { status: 500 }
      );
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        {
          ok: false,
          error: "POSTGRES_URL missing (fail-closed)"
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatBody;
    const message = normalizeMessage(body.message);
    const sessionId = normalizeSessionId(body.sessionId);
    const attachments = normalizeAttachments(body.attachments);
    const sessionFiles = getSessionFiles(sessionId);

    if (!message && attachments.length === 0 && sessionFiles.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing message or active files"
        },
        { status: 400 }
      );
    }

    const effectiveMessage = appendIdentityContext(
      message || "Usa i file attivi della sessione come contesto di lavoro."
    );

    const runtimeStart = await runNodeRuntime({
      sessionId,
      userMessage: effectiveMessage,
      actor: NODE_IDENTITY
    });

    if (!runtimeStart.ledger_valid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ledger invalid (fail-closed)",
          node_runtime: runtimeStart
        },
        { status: 503 }
      );
    }

    const ledger = await readEVTLedger();
    const lastSessionEVT = getLastSessionEVTContinuity(ledger, sessionId);
    const causality = resolveCausality(effectiveMessage);
    const research = attachments.length > 0 || sessionFiles.length > 0;

    const policy = evaluateHBCEPolicy({
      message: effectiveMessage,
      response: "",
      research,
      history: [],
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (policy.blocked) {
      return NextResponse.json(
        {
          ok: false,
          error: "Blocked by policy",
          causality
        },
        { status: 403 }
      );
    }

    const systemPrompt = buildInterpretiveSystemPrompt(NODE_NAME);
    const userContent = buildInterpretiveUserContent({
      nodeName: NODE_NAME,
      effectiveMessage,
      attachments,
      sessionFiles,
      lastSessionEVT
    });

    let response: string;

    try {
      const completion = await client.chat.completions.create({
        model: MODEL_NAME,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ]
      });

      response =
        completion.choices[0]?.message?.content?.trim() ||
        buildFallbackResponse(effectiveMessage, sessionFiles.length > 0);
    } catch {
      response = buildFallbackResponse(effectiveMessage, sessionFiles.length > 0);
    }

    const truth = validateTruth({
      text: response,
      research,
      sources: []
    });

    if (truth.decision === "WARN" && shouldApplyTruthWarning(message, research)) {
      response = `[TRUTH WARNING] ${response}`;
    }

    const runtimeEnd = await finalizeNodeRuntime({
      sessionId,
      assistantResponse: response,
      actor: NODE_IDENTITY
    });

    if (!runtimeEnd.ledger_valid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ledger invalid after execution (fail-closed)",
          node_runtime: runtimeEnd
        },
        { status: 503 }
      );
    }

    const last = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const evtId = padEvt(ledger.length + 1);

    const continuityPayload = buildContinuityPayload({
      sessionId,
      effectiveMessage,
      response
    });

    const base: EVTRecord = {
      evt: evtId,
      prev: last ? last.evt : null,
      t: new Date().toISOString(),
      entity: "AI_JOKER",
      ipr: NODE_IDENTITY,
      state: "LOCKED",
      baseline: false,
      kind: "JOKER_RUNTIME_EVENT",
      cycle: "JOKER-C2",
      loc: ["Torino", "Italy"],
      org: "HERMETICUM B.C.E. S.r.l.",
      core: "HBCE-CORE-v3",
      anchors: {
        monthly_hash: ""
      },
      upstream: {
        root_evt: "EVT-0008",
        root_prev: "EVT-0007",
        root_t: "2026-01-19T15:30:00+01:00",
        proto: "UNEBDO-ΦΩ",
        inrim: "2025-INRMCLE-0021541",
        t0: "2025-10-24T15:36:00Z"
      },
      continuity: {
        checkpoint_type: "RUNTIME",
        elapsed_months: ledger.length,
        origin_lock: "EVT-0008",
        origin_ipr: "IPR-AI-0001",
        rule: "fail-closed runtime with cognitive continuity",
        note: serializeContinuityPayload(continuityPayload)
      }
    };

    const hash = computeEVTHash(base);

    const record: EVTRecord = {
      ...base,
      anchors: {
        ...base.anchors,
        monthly_hash: hash
      }
    };

    const evtSaved = await appendEVTStrict(record);

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response,
      causality,
      evt: {
        ok: true,
        evt: evtSaved.evt,
        prev: evtSaved.prev,
        hash: evtSaved.anchors.monthly_hash
      },
      node_runtime: runtimeEnd,
      active_files: sessionFiles.map((file) => ({
        id: file.id,
        name: file.name,
        title: file.title,
        role: file.role,
        has_text: file.hasText
      }))
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal error"
      },
      { status: 500 }
    );
  }
}

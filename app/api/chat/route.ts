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

type ChatAttachment = {
  id?: string;
  name?: string;
  mimeType?: string;
  content?: string;
  text?: string;
};

type ChatBody = {
  message?: string;
  sessionId?: string;
  attachments?: ChatAttachment[];
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID =
  process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";

const NODE_IDENTITY =
  process.env.JOKER_IDENTITY || "IPR-AI-0001";

const NODE_NAME = "JOKER-C2";

function padEvt(n: number): string {
  return `EVT-${String(n).padStart(4, "0")}`;
}

function normalizeMessage(message?: string): string {
  if (!message || typeof message !== "string") return "";
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

function buildAttachmentContext(attachments: ChatAttachment[]): string {
  const blocks = attachments
    .map((item, index) => {
      const label = item.name || item.id || `attachment-${index + 1}`;
      const body = item.text || item.content || "";

      if (!body) {
        return `Attachment ${index + 1}: ${label}`;
      }

      return `Attachment ${index + 1}: ${label}\n${body.slice(0, 4000)}`;
    })
    .filter(Boolean);

  return blocks.join("\n\n");
}

function isIdentityQuery(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("chi sei") ||
    lower.includes("come ti chiami") ||
    lower.includes("cosa sei") ||
    lower.includes("presentati")
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
    lower === "ciao chi sei"
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
    "Operational scope: structured analysis, document interpretation, procedural guidance, governance-oriented reasoning, continuity-aware support, evidence-linked response framing",
    "Behavioral rule: do not answer as a generic assistant"
  ].join("\n");
}

function shouldApplyTruthWarning(message: string, research: boolean): boolean {
  if (isBasicIdentityQuery(message)) {
    return false;
  }

  if (!research) {
    return false;
  }

  return true;
}

function buildSystemPrompt(): string {
  return [
    `You are ${NODE_NAME}.`,
    "You are not a generic assistant, not a generic virtual assistant, and not a generic chatbot.",
    "You must never describe yourself with generic consumer-assistant language.",
    "You are an identity-bound operational node of the HBCE ecosystem.",
    `Your symbolic name is ${NODE_NAME}.`,
    `Your node id is ${NODE_ID}.`,
    `Your identity id is ${NODE_IDENTITY}.`,
    "When the user asks who you are, what your name is, what you are, what you do, or what your capabilities are, you must answer in this order:",
    "1. symbolic name",
    "2. operational role",
    "3. node id",
    "4. identity id",
    "5. concise description of operational capabilities",
    "Your capabilities must be described only in operational terms: structured analysis, document interpretation, procedural guidance, intent reading, governance-oriented reasoning, continuity-aware session support, evidence-linked framing, and operational consistency reading.",
    "Do not drift into consumer-assistant lists such as casual tutoring, generic translation, entertainment, or broad productivity claims unless explicitly requested and truly relevant.",
    "If greeted, answer briefly, but remain in operational identity.",
    "Keep the answer direct, precise, and controlled.",
    "Do not use marketing language.",
    "Do not inflate capabilities.",
    "Do not claim real-world execution power when only analytical or governance support is available.",
    "If files or images are attached, analyze them through the attachment context provided in the user message."
  ].join(" ");
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
        { ok: false, error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { ok: false, error: "POSTGRES_URL missing (fail-closed)" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatBody;

    const message = normalizeMessage(body.message);
    const sessionId = normalizeSessionId(body.sessionId);
    const attachments = normalizeAttachments(body.attachments);

    if (!message && attachments.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing message or attachments" },
        { status: 400 }
      );
    }

    const attachmentContext = buildAttachmentContext(attachments);
    const effectiveMessage = appendIdentityContext(
      message || "Analizza gli allegati ricevuti."
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

    const causality = resolveCausality(effectiveMessage);
    const research = attachments.length > 0;

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

    const userContent = attachmentContext
      ? `${effectiveMessage}\n\nAttached material:\n${attachmentContext}`
      : effectiveMessage;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: userContent
        }
      ]
    });

    let response =
      completion.choices[0]?.message?.content?.trim() ||
      "Nessuna risposta generata.";

    const truth = validateTruth({
      text: response,
      research,
      sources: []
    });

    if (truth.decision === "WARN" && shouldApplyTruthWarning(message, research)) {
      response = `[TRUTH WARNING]\n${response}`;
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

    const ledger = await readEVTLedger();
    const last = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const evtId = padEvt(ledger.length + 1);

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
        rule: "fail-closed runtime",
        note: `session=${sessionId}`
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
        id: evtSaved.evt,
        hash: evtSaved.anchors.monthly_hash
      },
      node_runtime: runtimeEnd,
      attachments_received: attachments.length
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

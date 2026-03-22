import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createAnchor } from "@/lib/anchor";
import { validateTruth } from "@/lib/truth-validator";
import {
  signFederationResponse,
  federationSignatureIsConfigured
} from "@/lib/federation-signature";
import { evaluateHBCEPolicy } from "@/lib/policy-engine";
import { runNodeRuntime } from "@/lib/node/node-runtime";
import { nodeAppendEvent } from "@/lib/node/node-ledger";

export const runtime = "nodejs";

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type ChatAttachment = {
  id?: string;
  name?: string;
  mimeType?: string;
  content?: string;
  text?: string;
};

type ChatBody = {
  message?: string;
  history?: ChatHistoryItem[];
  research?: boolean;
  attachments?: ChatAttachment[];
  sessionId?: string;
  role?: string;
  nodeContext?: string;
  continuityReference?: string;
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID =
  process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";
const NODE_IDENTITY =
  process.env.JOKER_IDENTITY || "IPR-AI-0001";

function normalizeMessage(message?: string): string {
  if (!message || typeof message !== "string") return "";
  return message.trim();
}

function normalizeHistory(history?: ChatHistoryItem[]): ChatHistoryItem[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .slice(-8);
}

function normalizeAttachments(
  attachments?: ChatAttachment[]
): ChatAttachment[] {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      name: typeof item.name === "string" ? item.name : undefined,
      mimeType:
        typeof item.mimeType === "string" ? item.mimeType : undefined,
      content:
        typeof item.content === "string" ? item.content.trim() : undefined,
      text: typeof item.text === "string" ? item.text.trim() : undefined
    }))
    .filter(
      (item) => Boolean(item.name || item.id || item.content || item.text)
    )
    .slice(0, 5);
}

function getAttachmentText(attachment: ChatAttachment): string {
  if (attachment.content && attachment.content.length > 0) {
    return attachment.content;
  }

  if (attachment.text && attachment.text.length > 0) {
    return attachment.text;
  }

  return "";
}

function buildAttachmentContext(attachments: ChatAttachment[]): string {
  const usable = attachments
    .map((attachment, index) => {
      const text = getAttachmentText(attachment);
      if (!text) return "";

      const label =
        attachment.name || attachment.id || `attachment-${index + 1}`;

      return [`Attachment ${index + 1}: ${label}`, text].join("\n");
    })
    .filter(Boolean);

  if (usable.length === 0) return "";

  return ["Attached document context:", ...usable].join("\n\n");
}

function detectIntent(
  message: string,
  attachments: ChatAttachment[]
): "chat" | "research" | "general" {
  const m = message.toLowerCase();

  if (attachments.length > 0) {
    if (
      m.includes("analizza") ||
      m.includes("riassumi") ||
      m.includes("legg") ||
      m.includes("file") ||
      m.includes("document") ||
      m.includes("estrai")
    ) {
      return "research";
    }

    if (!m) {
      return "research";
    }
  }

  if (!m || m.length < 5) return "chat";

  if (m.includes("chi sei") || m.includes("presentati") || m === "ciao") {
    return "chat";
  }

  if (
    m.includes("geopolitica") ||
    m.includes("guerra") ||
    m.includes("ue") ||
    m.includes("nato") ||
    m.includes("oggi") ||
    m.includes("notizie")
  ) {
    return "research";
  }

  return "general";
}

function wantsInterpretiveMode(message: string): boolean {
  const m = message.toLowerCase();

  return (
    m.includes("interpret") ||
    m.includes("spiegamelo") ||
    m.includes("spiegami") ||
    m.includes("dal tuo punto di vista") ||
    m.includes("senza ripetere") ||
    m.includes("senza riassumere") ||
    m.includes("non ripetere") ||
    m.includes("dimmi cosa significa") ||
    m.includes("che vuol dire") ||
    m.includes("che significa")
  );
}

function buildInterpretiveGuidance(): string[] {
  return [
    "Interpretive mode is active.",
    "Do not produce a long descriptive summary of the attached document.",
    "Do not restate the structure of the source text section by section.",
    "Do not paraphrase the file at length.",
    "Explain what the document really does, what function it has, and what role it plays inside the broader system.",
    "When relevant, explain what changes compared to earlier documents or prior stages.",
    "Prioritize purpose, architecture, strategic meaning, implications, and internal logic over repetition.",
    "Use compact, precise, non-bloated language.",
    "When possible, answer in this order: function of the document, central thesis, what it adds, strategic implication, concise interpretive conclusion."
  ];
}

function buildSystemPrompt(
  intent: "chat" | "research" | "general",
  policyGuidance: string[],
  hasAttachments: boolean,
  interpretiveMode: boolean
): string {
  const base = [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    `Identity: ${NODE_IDENTITY}.`,
    `Node: ${NODE_ID}.`,
    "Answer clearly, precisely, and without inflating capabilities.",
    "Never present potential integrations as already active direct operational control.",
    "When symbolic or narrative language appears, translate it into IPR-based operational language.",
    "When evidence is partial, use cautious wording and indicative ranges.",
    "Prefer governance, supervision, auditability, compliance, and infrastructure framing over speculative implementation detail."
  ];

  const intentBlock =
    intent === "chat"
      ? ["Conversational mode."]
      : intent === "research"
        ? ["Research mode: be analytical, source-aware, and cautious."]
        : ["General reasoning mode."];

  const attachmentBlock = hasAttachments
    ? [
        "One or more document attachments are included in the request.",
        "If attachment text is present, use it as primary context for reading, summarizing, extracting, or analyzing the document.",
        "If the user asks to read the file, explicitly rely on attached document context."
      ]
    : [];

  const interpretiveBlock = interpretiveMode
    ? buildInterpretiveGuidance()
    : [];

  return [
    ...base,
    ...intentBlock,
    ...attachmentBlock,
    ...interpretiveBlock,
    ...policyGuidance
  ].join(" ");
}

function shouldApplyTruthWarning(
  policy: ReturnType<typeof evaluateHBCEPolicy>
): boolean {
  return policy.truth_scope.applyWarning;
}

function normalizeSessionId(sessionId?: string): string {
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return "JOKER-CHAT-SESSION-0001";
  }

  return sessionId.trim();
}

function normalizeRole(role?: string): string {
  if (typeof role !== "string" || !role.trim()) {
    return "Operatore supervisionato";
  }

  return role.trim();
}

function normalizeNodeContext(nodeContext?: string): string {
  if (typeof nodeContext !== "string" || !nodeContext.trim()) {
    return NODE_ID;
  }

  return nodeContext.trim();
}

function normalizeContinuityReference(
  continuityReference: string | undefined,
  sessionId: string
): string {
  if (typeof continuityReference !== "string" || !continuityReference.trim()) {
    return `${sessionId}-AUDIT`;
  }

  return continuityReference.trim();
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatBody;
    const message = normalizeMessage(body.message);
    const history = normalizeHistory(body.history);
    const attachments = normalizeAttachments(body.attachments);

    const hasMessage = message.length > 0;
    const hasAttachments = attachments.length > 0;

    if (!hasMessage && !hasAttachments) {
      return NextResponse.json(
        { ok: false, error: "Missing message or attachments" },
        { status: 400 }
      );
    }

    const attachmentContext = buildAttachmentContext(attachments);

    if (hasAttachments && !attachmentContext) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Attachments received, but no readable attachment text was provided."
        },
        { status: 400 }
      );
    }

    const effectiveMessage = hasMessage
      ? message
      : "Read and analyze the attached file.";

    const sessionId = normalizeSessionId(body.sessionId);
    const role = normalizeRole(body.role);
    const nodeContext = normalizeNodeContext(body.nodeContext);
    const continuityReference = normalizeContinuityReference(
      body.continuityReference,
      sessionId
    );

    let nodeRuntime: Awaited<ReturnType<typeof runNodeRuntime>> | null = null;
    let nodeRuntimeError: string | null = null;

    try {
      nodeRuntime = await runNodeRuntime({
        sessionId,
        message: effectiveMessage,
        role,
        nodeContext,
        continuityReference,
        actor: NODE_IDENTITY
      });
    } catch (error) {
      nodeRuntimeError =
        error instanceof Error ? error.message : "Node runtime unavailable";
    }

    const intent = detectIntent(message, attachments);
    const research = body.research === true || intent === "research";
    const interpretiveMode =
      hasAttachments && wantsInterpretiveMode(effectiveMessage);
    const historyTexts = history.map((item) => item.content);

    const prePolicy = evaluateHBCEPolicy({
      message: effectiveMessage,
      response: "",
      research,
      history: historyTexts,
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (prePolicy.blocked) {
      const blockedResponse =
        prePolicy.block_response ||
        "Richiesta non supportata nel formato richiesto.";

      const anchor = createAnchor({
        message: effectiveMessage,
        response: blockedResponse,
        intent,
        policy: prePolicy,
        session_id: sessionId,
        continuity_reference:
          nodeRuntime?.execution.result.continuityReference ||
          continuityReference
      });

      try {
        await nodeAppendEvent({
          kind: "chat.response.blocked",
          actor: NODE_IDENTITY,
          node: nodeContext,
          payload: {
            session_id: sessionId,
            continuity_reference:
              nodeRuntime?.execution.result.continuityReference ||
              continuityReference,
            intent,
            blocked: true,
            block_reason: prePolicy.block_reason || "policy_block",
            attachment_count: attachments.length,
            anchor_hash: anchor.hash
          }
        });
      } catch {
        // non bloccare la risposta chat se il ledger fallisce
      }

      return NextResponse.json({
        ok: true,
        joker: "C2",
        response: blockedResponse,
        intent,
        policy: prePolicy,
        anchor,
        interpretive_mode: interpretiveMode,
        node_runtime: nodeRuntime
          ? {
              session_id: nodeRuntime.execution.session.sessionId,
              session_state: nodeRuntime.execution.result.sessionState,
              continuity_reference:
                nodeRuntime.execution.result.continuityReference,
              continuity_status: nodeRuntime.continuity_status,
              ledger_events: nodeRuntime.ledger_events
            }
          : {
              session_id: sessionId,
              session_state: "NODE-RUNTIME-OFFLINE",
              continuity_reference: continuityReference,
              continuity_status: "UNKNOWN",
              ledger_events: [],
              warning: nodeRuntimeError || "Node runtime unavailable"
            },
        federation_signature: federationSignatureIsConfigured()
          ? signFederationResponse(NODE_ID, blockedResponse)
          : null
      });
    }

    const prompt = buildSystemPrompt(
      intent,
      prePolicy.prompt_guidance,
      hasAttachments,
      interpretiveMode
    );

    const userContent = attachmentContext
      ? `${effectiveMessage}\n\n${attachmentContext}`
      : effectiveMessage;

    const input =
      history.length > 0
        ? [
            ...history.map((item) => ({
              role: item.role,
              content: item.content
            })),
            {
              role: "user" as const,
              content: userContent
            }
          ]
        : userContent;

    const ai = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: prompt,
      input
    });

    let response = ai.output_text?.trim() || "No response generated.";

    const postPolicy = evaluateHBCEPolicy({
      message: effectiveMessage,
      response,
      research,
      history: historyTexts,
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (postPolicy.numeric_guard.numeric_request) {
      if (postPolicy.numeric_guard.mode === "insufficient-evidence") {
        response = postPolicy.numeric_guard.guidance_prefix;
      } else if (
        postPolicy.numeric_guard.mode === "estimated-range" &&
        postPolicy.numeric_guard.guidance_prefix
      ) {
        response =
          postPolicy.numeric_guard.guidance_prefix + "\n\n" + response;
      }
    }

    const truth = validateTruth({
      text: response,
      research,
      sources: []
    });

    if (truth.decision === "WARN" && shouldApplyTruthWarning(postPolicy)) {
      response = `[TRUTH WARNING]\n${response}`;
    }

    const anchor = createAnchor({
      message: effectiveMessage,
      response,
      intent,
      policy: postPolicy,
      truth,
      session_id: sessionId,
      continuity_reference:
        nodeRuntime?.execution.result.continuityReference ||
        continuityReference
    });

    let chatLedgerEvent: unknown = null;

    try {
      chatLedgerEvent = await nodeAppendEvent({
        kind: "chat.response.emitted",
        actor: NODE_IDENTITY,
        node: nodeContext,
        payload: {
          session_id: sessionId,
          continuity_reference:
            nodeRuntime?.execution.result.continuityReference ||
            continuityReference,
          intent,
          research,
          attachment_count: attachments.length,
          anchor_hash: anchor.hash,
          truth_decision: truth.decision,
          truth_score: truth.score,
          interpretive_mode: interpretiveMode
        }
      });
    } catch {
      chatLedgerEvent = null;
    }

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response,
      intent,
      policy: postPolicy,
      truth,
      anchor,
      attachment_count: attachments.length,
      interpretive_mode: interpretiveMode,
      node_runtime: nodeRuntime
        ? {
            session_id: nodeRuntime.execution.session.sessionId,
            session_state: nodeRuntime.execution.result.sessionState,
            continuity_reference:
              nodeRuntime.execution.result.continuityReference,
            continuity_status: nodeRuntime.continuity_status,
            ledger_events: [
              ...nodeRuntime.ledger_events,
              ...(chatLedgerEvent ? [chatLedgerEvent] : [])
            ]
          }
        : {
            session_id: sessionId,
            session_state: "NODE-RUNTIME-OFFLINE",
            continuity_reference: continuityReference,
            continuity_status: "UNKNOWN",
            ledger_events: [],
            warning: nodeRuntimeError || "Node runtime unavailable"
          },
      federation_signature: federationSignatureIsConfigured()
        ? signFederationResponse(NODE_ID, response)
        : null
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

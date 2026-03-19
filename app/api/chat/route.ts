import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAnchor } from "@/lib/anchor";
import { validateTruth } from "@/lib/truth-validator";
import {
  signFederationResponse,
  federationSignatureIsConfigured
} from "@/lib/federation-signature";
import { evaluateHBCEPolicy } from "@/lib/policy-engine";

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
      (item) =>
        Boolean(item.name || item.id || item.content || item.text)
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

      const label = attachment.name || attachment.id || `attachment-${index + 1}`;
      return [
        `Attachment ${index + 1}: ${label}`,
        text
      ].join("\n");
    })
    .filter(Boolean);

  if (usable.length === 0) return "";

  return [
    "Attached document context:",
    ...usable
  ].join("\n\n");
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

function buildSystemPrompt(
  intent: "chat" | "research" | "general",
  policyGuidance: string[],
  hasAttachments: boolean
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

  return [...base, ...intentBlock, ...attachmentBlock, ...policyGuidance].join(" ");
}

function shouldApplyTruthWarning(
  policy: ReturnType<typeof evaluateHBCEPolicy>
): boolean {
  return policy.truth_scope.applyWarning;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
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

    const intent = detectIntent(message, attachments);
    const research = body.research === true || intent === "research";
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
        policy: prePolicy
      });

      return NextResponse.json({
        ok: true,
        joker: "C2",
        response: blockedResponse,
        intent,
        policy: prePolicy,
        anchor,
        federation_signature: federationSignatureIsConfigured()
          ? signFederationResponse(NODE_ID, blockedResponse)
          : null
      });
    }

    const prompt = buildSystemPrompt(
      intent,
      prePolicy.prompt_guidance,
      hasAttachments
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
      truth
    });

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response,
      intent,
      policy: postPolicy,
      truth,
      anchor,
      attachment_count: attachments.length,
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

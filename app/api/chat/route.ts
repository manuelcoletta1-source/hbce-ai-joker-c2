import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAnchor } from "@/lib/anchor";
import { validateTruth } from "@/lib/truth-validator";

export const runtime = "nodejs";

type Attachment = {
  name: string;
  type: string;
  content: string;
};

type HistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  message?: string;
  attachments?: Attachment[];
  history?: HistoryTurn[];
  research?: boolean;
};

type SourceItem = {
  title: string;
  url?: string;
};

type InputTextPart = {
  type: "input_text";
  text: string;
};

type InputImagePart = {
  type: "input_image";
  image_url: string;
  detail: "auto";
};

type InputPart = InputTextPart | InputImagePart;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MAX_HISTORY_TURNS = 6;

function normalizeMessage(message?: string): string {
  if (!message || typeof message !== "string") return "";
  return message.trim();
}

function normalizeResearch(value: unknown): boolean {
  return value === true;
}

function normalizeAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Partial<Attachment>;

      return {
        name: typeof raw.name === "string" ? raw.name : "attachment",
        type: typeof raw.type === "string" ? raw.type : "application/octet-stream",
        content: typeof raw.content === "string" ? raw.content : ""
      };
    })
    .filter((item) => item.content.length > 0);
}

function normalizeHistory(value: unknown): HistoryTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Partial<HistoryTurn>;
      const role: HistoryTurn["role"] =
        raw.role === "assistant" ? "assistant" : "user";

      return {
        role,
        content: typeof raw.content === "string" ? raw.content.trim() : ""
      };
    })
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_TURNS);
}

function isTextAttachment(type: string, name: string): boolean {
  const lower = name.toLowerCase();

  return (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "text/markdown" ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    lower.endsWith(".csv")
  );
}

function isImageAttachment(type: string): boolean {
  return type.startsWith("image/");
}

function extractTextAttachmentBlock(attachment: Attachment): string {
  return [
    `Attachment name: ${attachment.name}`,
    `Attachment type: ${attachment.type}`,
    "Attachment content:",
    attachment.content
  ].join("\n");
}

function detectIntent(message: string): "chat" | "research" | "general" {
  const m = message.toLowerCase().trim();

  if (!m || m.length <= 5) return "chat";

  if (
    m === "ciao" ||
    m.includes("chi sei") ||
    m.includes("come stai") ||
    m.includes("presentati")
  ) {
    return "chat";
  }

  if (
    m.includes("notizie") ||
    m.includes("oggi") ||
    m.includes("geopolitica") ||
    m.includes("guerra") ||
    m.includes("crisi") ||
    m.includes("nato") ||
    m.includes("sanzioni") ||
    m.includes("iran") ||
    m.includes("ucraina")
  ) {
    return "research";
  }

  return "general";
}

function shouldApplyTruth(intent: "chat" | "research" | "general", research: boolean): boolean {
  if (intent === "chat") return false;
  if (research) return true;
  if (intent === "research") return true;
  return false;
}

function buildSystemPrompt(intent: "chat" | "research" | "general", research: boolean): string {
  const base = [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    "Identity: IPR-AI-0001.",
    "Default node: HBCE-MATRIX-NODE-0001-TORINO.",
    "You must answer naturally and directly.",
    "Do not use canned placeholder responses.",
    "If the user greets you or asks who you are, answer clearly as JOKER-C2.",
    "If the user asks a general question, answer normally and concretely.",
    "Do not invent current events, military operations, institutions, or statistics."
  ];

  const intentBlock =
    intent === "chat"
      ? ["Intent: chat.", "Respond conversationally."]
      : intent === "research"
        ? ["Intent: research.", "Prioritize current information and sources."]
        : ["Intent: general.", "Answer directly and use your reasoning normally."];

  const researchBlock = research
    ? [
        "Research mode is active.",
        "Use web search before answering.",
        "If sources are weak or missing, be explicit and cautious."
      ]
    : [];

  return [...base, ...intentBlock, ...researchBlock].join(" ");
}

function buildInput(
  history: HistoryTurn[],
  message: string,
  attachments: Attachment[]
): Array<
  | { role: "user" | "assistant"; content: string }
  | { role: "user"; content: InputPart[] }
> {
  const inputParts: InputPart[] = [];

  if (message) {
    inputParts.push({
      type: "input_text",
      text: message
    });
  }

  const textAttachments = attachments.filter((item) =>
    isTextAttachment(item.type, item.name)
  );

  const imageAttachments = attachments.filter((item) =>
    isImageAttachment(item.type)
  );

  for (const attachment of textAttachments) {
    inputParts.push({
      type: "input_text",
      text: extractTextAttachmentBlock(attachment)
    });
  }

  for (const attachment of imageAttachments) {
    inputParts.push({
      type: "input_image",
      image_url: attachment.content,
      detail: "auto"
    });
  }

  return [
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.content
    })),
    {
      role: "user" as const,
      content: inputParts
    }
  ];
}

function extractSources(rawResponse: any): SourceItem[] {
  const results: SourceItem[] = [];
  const seen = new Set<string>();

  const pushSource = (title?: string, url?: string) => {
    const cleanTitle =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : "Untitled source";

    const cleanUrl =
      typeof url === "string" && url.trim().length > 0 ? url.trim() : undefined;

    const key = `${cleanTitle}::${cleanUrl || ""}`;
    if (seen.has(key)) return;

    seen.add(key);
    results.push({
      title: cleanTitle,
      url: cleanUrl
    });
  };

  const walk = (value: any) => {
    if (!value) return;

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (typeof value !== "object") return;

    if (Array.isArray(value.annotations)) {
      for (const annotation of value.annotations) {
        if (!annotation || typeof annotation !== "object") continue;

        const maybeTitle =
          annotation.title ||
          annotation.source_title ||
          annotation.url_citation?.title ||
          annotation.file_citation?.title;

        const maybeUrl =
          annotation.url ||
          annotation.source_url ||
          annotation.url_citation?.url;

        pushSource(maybeTitle, maybeUrl);
      }
    }

    if (
      value.type === "url_citation" ||
      value.type === "citation" ||
      value.type === "source"
    ) {
      pushSource(
        value.title || value.source_title,
        value.url || value.source_url
      );
    }

    for (const nested of Object.values(value)) {
      walk(nested);
    }
  };

  walk(rawResponse);
  return results;
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
    const message = normalizeMessage(body?.message);
    const attachments = normalizeAttachments(body?.attachments);
    const history = normalizeHistory(body?.history);

    if (!message && attachments.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing message or attachments" },
        { status: 400 }
      );
    }

    const detectedIntent = detectIntent(message);
    const requestedResearch = normalizeResearch(body?.research);

    // Regola cruciale: niente research su chat/general, anche se il frontend lo manda.
    const research =
      detectedIntent === "research"
        ? true
        : false;

    const requestBody: any = {
      model: "gpt-4.1-mini",
      instructions: buildSystemPrompt(detectedIntent, research),
      input: buildInput(history, message, attachments)
    };

    if (research) {
      requestBody.tools = [{ type: "web_search_preview" }];
      requestBody.tool_choice = "required";
      requestBody.include = ["web_search_call.action.sources"];
    }

    const rawResponse: any = await client.responses.create(requestBody);

    const responseText =
      typeof rawResponse.output_text === "string" && rawResponse.output_text.trim()
        ? rawResponse.output_text.trim()
        : "JOKER-C2 processed the request but returned no text output.";

    const sources = research ? extractSources(rawResponse) : [];

    let truthMeta:
      | {
          level: "HIGH" | "MEDIUM" | "LOW";
          decision: "PASS" | "WARN" | "BLOCK";
          score: number;
          reasons?: string[];
          weak_sources?: string[];
          strong_sources?: string[];
          note?: string;
        };

    if (shouldApplyTruth(detectedIntent, research)) {
      truthMeta = validateTruth({
        text: responseText,
        research,
        sources
      });

      if (truthMeta.decision === "BLOCK") {
        return NextResponse.json(
          {
            ok: false,
            error: "Truth validation blocked output",
            truth: truthMeta,
            intent: detectedIntent,
            research,
            requested_research: requestedResearch
          },
          { status: 422 }
        );
      }
    } else {
      truthMeta = {
        level: "HIGH",
        decision: "PASS",
        score: 100,
        note: "Skipped (non-critical query)"
      };
    }

    const finalResponse =
      truthMeta.decision === "WARN"
        ? `[TRUTH WARNING]\n${responseText}`
        : responseText;

    const anchor = createAnchor({
      message,
      intent: detectedIntent,
      research,
      response: finalResponse,
      truth: truthMeta,
      sources
    });

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response: finalResponse,
      sources,
      intent: detectedIntent,
      research,
      requested_research: requestedResearch,
      truth: truthMeta,
      anchor,
      meta: {
        model: rawResponse.model || "gpt-4.1-mini",
        ts: new Date().toISOString(),
        node: "HBCE-MATRIX-NODE-0001-TORINO",
        identity: "IPR-AI-0001",
        history_turns_used: history.length,
        attachments_total: attachments.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal error"
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import OpenAI from "openai";

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

type SourceItem = {
  title: string;
  url?: string;
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MAX_HISTORY_TURNS = 6;

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

function normalizeMessage(message?: string): string {
  if (!message || typeof message !== "string") return "";
  return message.trim();
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

function normalizeResearch(value: unknown): boolean {
  return value === true;
}

function extractTextAttachmentBlock(attachment: Attachment): string {
  return [
    `Attachment name: ${attachment.name}`,
    `Attachment type: ${attachment.type}`,
    "Attachment content:",
    attachment.content
  ].join("\n");
}

function buildSystemPrompt(research: boolean): string {
  const base = [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    "Identity: IPR-AI-0001.",
    "Default node: HBCE-MATRIX-NODE-0001-TORINO.",
    "You process requests from the biological operator and return structured, precise, operational answers.",
    "Conversation history is part of the active operational context and must be used when provided.",
    "If attachments are provided, use them as contextual evidence.",
    "When a text attachment is present, read it and integrate its content into the answer.",
    "When an image attachment is present, analyze the image and describe relevant details.",
    "Do not claim permanent memory unless the user explicitly asks to save information.",
    "Be clear, operational, and consistent with HBCE language."
  ];

  const researchBlock = research
    ? [
        "Research mode is active.",
        "Use web research when needed to acquire current facts and supporting sources.",
        "When web evidence is available, prefer traceable, source-grounded statements.",
        "At the end of the answer, add a compact source-aware summary if relevant."
      ]
    : [];

  return [...base, ...researchBlock].join(" ");
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
        if (annotation && typeof annotation === "object") {
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
        {
          ok: false,
          error: "Missing OPENAI_API_KEY on server"
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatBody;
    const message = normalizeMessage(body?.message);
    const attachments = normalizeAttachments(body?.attachments);
    const history = normalizeHistory(body?.history);
    const research = normalizeResearch(body?.research);

    if (!message && attachments.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing message or attachments"
        },
        { status: 400 }
      );
    }

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

    const unsupportedAttachments = attachments.filter(
      (item) =>
        !isTextAttachment(item.type, item.name) && !isImageAttachment(item.type)
    );

    if (unsupportedAttachments.length > 0) {
      inputParts.push({
        type: "input_text",
        text: [
          "Unsupported attachments were provided.",
          "They were not parsed in this step.",
          "Unsupported files:",
          ...unsupportedAttachments.map(
            (item) => `- ${item.name} (${item.type})`
          )
        ].join("\n")
      });
    }

    const input = [
      ...history.map((turn) => ({
        role: turn.role,
        content: turn.content
      })),
      {
        role: "user" as const,
        content: inputParts
      }
    ];

    const requestBody: Record<string, unknown> = {
      model: "gpt-4.1-mini",
      instructions: buildSystemPrompt(research),
      input
    };

    if (research) {
      requestBody.tools = [{ type: "web_search_preview" }];
    }

    const rawResponse = (await client.responses.create(
      requestBody as any
    )) as any;

    const outputText =
      typeof rawResponse.output_text === "string" && rawResponse.output_text.trim()
        ? rawResponse.output_text.trim()
        : "JOKER-C2 processed the request but returned no text output.";

    const sources = research ? extractSources(rawResponse) : [];

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response: outputText,
      sources,
      meta: {
        model: rawResponse.model,
        ts: new Date().toISOString(),
        node: "HBCE-MATRIX-NODE-0001-TORINO",
        identity: "IPR-AI-0001",
        research,
        memory: {
          history_turns_used: history.length,
          history_turns_max: MAX_HISTORY_TURNS
        },
        attachments: {
          total: attachments.length,
          text: textAttachments.length,
          images: imageAttachments.length,
          unsupported: unsupportedAttachments.length
        }
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 500 }
    );
  }
}

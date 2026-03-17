import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type Attachment = {
  name: string;
  type: string;
  content: string;
};

type ChatBody = {
  message?: string;
  attachments?: Attachment[];
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

function buildSystemPrompt(): string {
  return [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    "Identity: IPR-AI-0001.",
    "Default node: HBCE-MATRIX-NODE-0001-TORINO.",
    "Your role is to process requests from the biological operator and return structured, precise, operational answers.",
    "If attachments are provided, you must use them as contextual evidence.",
    "When a text attachment is present, read it and integrate its content into the answer.",
    "When an image attachment is present, analyze the image and describe relevant details.",
    "Do not claim to have learned permanently unless the user explicitly asks to save something.",
    "Be clear, operational, and consistent with HBCE language."
  ].join(" ");
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

function extractTextAttachmentBlock(attachment: Attachment): string {
  return [
    `Attachment name: ${attachment.name}`,
    `Attachment type: ${attachment.type}`,
    "Attachment content:",
    attachment.content
  ].join("\n");
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

    if (!message && attachments.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing message or attachments"
        },
        { status: 400 }
      );
    }

    const inputParts: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string }
    > = [];

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
        image_url: attachment.content
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

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: buildSystemPrompt(),
      input: [
        {
          role: "user",
          content: inputParts
        }
      ]
    });

    const outputText =
      response.output_text?.trim() ||
      "JOKER-C2 processed the request but returned no text output.";

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response: outputText,
      meta: {
        model: response.model,
        ts: new Date().toISOString(),
        node: "HBCE-MATRIX-NODE-0001-TORINO",
        identity: "IPR-AI-0001",
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

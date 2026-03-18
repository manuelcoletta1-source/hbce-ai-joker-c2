import { NextResponse } from "next/server";

import {
  getMemoryByKey,
  listMemoryRecords,
  saveMemoryRecord,
  searchMemory
} from "@/lib/joker-memory";
import { appendLedgerEvent } from "@/lib/joker-ledger";
import {
  dbAppendLedgerEvent,
  dbGetMemoryByKey,
  dbIsConfigured,
  dbListMemoryRecords,
  dbSaveMemoryRecord,
  dbSearchMemory
} from "@/lib/joker-db";
import {
  signJokerPayload,
  signatureIsConfigured
} from "@/lib/joker-signature";
import {
  buildIPRPromptBlock,
  buildIPRResponseMeta
} from "@/lib/joker-ipr";
import { routeJokerModel } from "@/lib/model-router";
import { executeWithFallback } from "@/lib/model-executor";

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

type MemoryInstruction = {
  key: string;
  value: string;
  category: string;
} | null;

type LedgerEventLike = {
  id: string;
  hash: string;
  prev_hash: string;
};

type MemoryRecordLike = {
  key: string;
  value: string;
  category: string;
};

const MAX_HISTORY_TURNS = 6;
const MAX_MEMORY_MATCHES = 5;

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

function buildSystemPrompt(research: boolean, mode: string): string {
  const base = [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    "Identity: IPR-AI-0001.",
    "Default node: HBCE-MATRIX-NODE-0001-TORINO.",
    `Operational mode: ${mode}.`,
    "You process requests from the biological operator and return structured, precise, operational answers.",
    "Conversation history is part of the active operational context and must be used when provided.",
    "Server-side memory is part of the operational context when available.",
    "IPR binding context is authoritative and must be preserved in reasoning and outputs.",
    "If attachments are provided, use them as contextual evidence.",
    "When a text attachment is present, read it and integrate its content into the answer.",
    "When an image attachment is present, analyze the image and describe relevant details.",
    "If memory context is provided, use it directly and consistently.",
    "Do not claim permanent memory unless the memory layer actually saved the information.",
    "Be clear, operational, and consistent with HBCE language."
  ];

  const researchBlock = research
    ? [
        "Research mode is active.",
        "You must perform current web research before answering when the question asks for latest, current, recent, news, laws, regulations, standards, dates, or sources.",
        "Do not answer from stale internal knowledge when research mode is active.",
        "Return a concise answer first, then a compact source list."
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

function buildInput(
  history: HistoryTurn[],
  message: string,
  attachments: Attachment[],
  memoryContext: string,
  iprContext: string
): Array<
  | { role: "user" | "assistant"; content: string }
  | { role: "user"; content: InputPart[] }
> {
  const inputParts: InputPart[] = [];

  if (iprContext) {
    inputParts.push({
      type: "input_text",
      text: iprContext
    });
  }

  if (memoryContext) {
    inputParts.push({
      type: "input_text",
      text: memoryContext
    });
  }

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

function extractMemoryInstruction(message: string): MemoryInstruction {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("ricorda:")) {
    const value = trimmed.slice("ricorda:".length).trim();
    if (!value) return null;

    return {
      key: value,
      value,
      category: "operator-memory"
    };
  }

  if (lower.startsWith("ricorda che ")) {
    const value = trimmed.slice("ricorda che ".length).trim();
    if (!value) return null;

    return {
      key: value,
      value,
      category: "operator-memory"
    };
  }

  const namedPattern =
    /^ricorda(?:\s+che)?\s+(.+?)\s+(?:si chiama|è)\s+(.+)$/i;
  const match = trimmed.match(namedPattern);

  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();

    if (key && value) {
      return {
        key,
        value,
        category: "named-fact"
      };
    }
  }

  return null;
}

function isMemoryListingRequest(message: string): boolean {
  const lower = message.trim().toLowerCase();

  return (
    lower === "cosa ricordi?" ||
    lower === "cosa ricordi" ||
    lower === "mostra memoria" ||
    lower === "mostra la memoria" ||
    lower === "elenca memoria" ||
    lower === "elenca la memoria"
  );
}

async function persistentGetMemoryByKey(
  key: string
): Promise<MemoryRecordLike | null> {
  if (dbIsConfigured()) {
    return dbGetMemoryByKey(key);
  }

  return getMemoryByKey(key);
}

async function persistentSearchMemory(
  query: string
): Promise<MemoryRecordLike[]> {
  if (dbIsConfigured()) {
    return dbSearchMemory(query);
  }

  return searchMemory(query);
}

async function persistentListMemoryRecords(): Promise<MemoryRecordLike[]> {
  if (dbIsConfigured()) {
    return dbListMemoryRecords();
  }

  return listMemoryRecords();
}

async function persistentSaveMemoryRecord(input: {
  key: string;
  value: string;
  category?: string;
}): Promise<MemoryRecordLike> {
  if (dbIsConfigured()) {
    return dbSaveMemoryRecord(input);
  }

  return saveMemoryRecord(input);
}

async function persistentAppendLedgerEvent(input: {
  kind: string;
  actor?: string;
  node?: string;
  payload?: Record<string, unknown>;
}): Promise<LedgerEventLike> {
  if (dbIsConfigured()) {
    return dbAppendLedgerEvent(input);
  }

  return appendLedgerEvent(input);
}

async function buildMemoryContext(message: string): Promise<string> {
  const direct = await persistentGetMemoryByKey(message);
  const matches = direct ? [direct] : await persistentSearchMemory(message);

  const selected = matches.slice(0, MAX_MEMORY_MATCHES);

  if (selected.length === 0) return "";

  return [
    "Server-side memory context:",
    ...selected.map(
      (record, index) =>
        `${index + 1}. [${record.category}] ${record.key} => ${record.value}`
    )
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

    const hasImages = attachments.some((item) => isImageAttachment(item.type));
    const routing = routeJokerModel({
      message,
      hasImages,
      research
    });

    const iprMeta = buildIPRResponseMeta();
    const iprPromptBlock = buildIPRPromptBlock();

    await persistentAppendLedgerEvent({
      kind: "USER_REQUEST",
      payload: {
        message,
        attachments_count: attachments.length,
        history_count: history.length,
        research,
        storage: dbIsConfigured() ? "redis" : "runtime",
        ipr_subject: iprMeta.subject_id,
        ipr_operator: iprMeta.operator_id,
        ipr_node: iprMeta.node_id,
        routed_provider: routing.provider,
        routed_model: routing.model,
        routed_mode: routing.mode
      }
    });

    if (isMemoryListingRequest(message)) {
      const records = await persistentListMemoryRecords();
      const response =
        records.length === 0
          ? "JOKER-C2 memory is currently empty."
          : [
              "JOKER-C2 memory records:",
              ...records.map(
                (record, index) =>
                  `${index + 1}. [${record.category}] ${record.key} => ${record.value}`
              )
            ].join("\n");

      const ledgerEvent = await persistentAppendLedgerEvent({
        kind: "MEMORY_LIST",
        payload: {
          records_count: records.length,
          ipr_subject: iprMeta.subject_id,
          ipr_operator: iprMeta.operator_id
        }
      });

      const signablePayload = {
        joker: "C2",
        response,
        node: iprMeta.node_id,
        identity: iprMeta.subject_id,
        operator_id: iprMeta.operator_id,
        ipr: iprMeta,
        routing,
        ledger: {
          event_id: ledgerEvent.id,
          hash: ledgerEvent.hash,
          prev_hash: ledgerEvent.prev_hash
        }
      };

      const signature = signatureIsConfigured()
        ? signJokerPayload(signablePayload)
        : null;

      return NextResponse.json({
        ok: true,
        joker: "C2",
        response,
        sources: [],
        ledger: {
          event_id: ledgerEvent.id,
          hash: ledgerEvent.hash,
          prev_hash: ledgerEvent.prev_hash
        },
        signature,
        ipr: iprMeta,
        routing,
        meta: {
          model: "memory-layer",
          ts: new Date().toISOString(),
          node: iprMeta.node_id,
          identity: iprMeta.subject_id,
          operator_id: iprMeta.operator_id,
          research: false,
          memory: {
            history_turns_used: history.length,
            history_turns_max: MAX_HISTORY_TURNS,
            persistent_records: records.length,
            backend: dbIsConfigured() ? "redis" : "runtime"
          },
          attachments: {
            total: attachments.length,
            text: 0,
            images: 0,
            unsupported: 0
          }
        }
      });
    }

    const memoryInstruction = extractMemoryInstruction(message);

    if (memoryInstruction) {
      const saved = await persistentSaveMemoryRecord(memoryInstruction);

      await persistentAppendLedgerEvent({
        kind: "MEMORY_WRITE",
        payload: {
          key: memoryInstruction.key,
          category: memoryInstruction.category,
          ipr_subject: iprMeta.subject_id,
          ipr_operator: iprMeta.operator_id
        }
      });

      const ledgerEvent = await persistentAppendLedgerEvent({
        kind: "JOKER_RESPONSE",
        payload: {
          response_length: saved.value.length,
          model: "memory-layer",
          memory_write: true,
          ipr_subject: iprMeta.subject_id,
          ipr_operator: iprMeta.operator_id,
          routed_provider: routing.provider,
          routed_model: routing.model,
          routed_mode: routing.mode
        }
      });

      const response = `Memory saved. ${saved.key} => ${saved.value}`;

      const signablePayload = {
        joker: "C2",
        response,
        node: iprMeta.node_id,
        identity: iprMeta.subject_id,
        operator_id: iprMeta.operator_id,
        ipr: iprMeta,
        routing,
        ledger: {
          event_id: ledgerEvent.id,
          hash: ledgerEvent.hash,
          prev_hash: ledgerEvent.prev_hash
        }
      };

      const signature = signatureIsConfigured()
        ? signJokerPayload(signablePayload)
        : null;

      return NextResponse.json({
        ok: true,
        joker: "C2",
        response,
        sources: [],
        ledger: {
          event_id: ledgerEvent.id,
          hash: ledgerEvent.hash,
          prev_hash: ledgerEvent.prev_hash
        },
        signature,
        ipr: iprMeta,
        routing,
        meta: {
          model: "memory-layer",
          ts: new Date().toISOString(),
          node: iprMeta.node_id,
          identity: iprMeta.subject_id,
          operator_id: iprMeta.operator_id,
          research: false,
          memory: {
            history_turns_used: history.length,
            history_turns_max: MAX_HISTORY_TURNS,
            persistent_records: 1,
            backend: dbIsConfigured() ? "redis" : "runtime"
          },
          attachments: {
            total: attachments.length,
            text: 0,
            images: 0,
            unsupported: 0
          }
        }
      });
    }

    const memoryContext = await buildMemoryContext(message);
    const input = buildInput(
      history,
      message,
      attachments,
      memoryContext,
      iprPromptBlock
    );

    const textAttachments = attachments.filter((item) =>
      isTextAttachment(item.type, item.name)
    );
    const imageAttachments = attachments.filter((item) =>
      isImageAttachment(item.type)
    );
    const unsupportedAttachments = attachments.filter(
      (item) =>
        !isTextAttachment(item.type, item.name) && !isImageAttachment(item.type)
    );

    const requestBody: any = {
      model: routing.model,
      instructions: buildSystemPrompt(research, routing.mode),
      input
    };

    if (research) {
      requestBody.tools = [{ type: "web_search_preview" }];
      requestBody.tool_choice = "required";
      requestBody.include = ["web_search_call.action.sources"];
    }

    const exec = await executeWithFallback({
      routing,
      requestBody
    });

    if (!exec.ok) {
      throw new Error(exec.error || "Model execution failed");
    }

    const rawResponse: any = exec.data;

    const outputText =
      typeof rawResponse.output_text === "string" && rawResponse.output_text.trim()
        ? rawResponse.output_text.trim()
        : "JOKER-C2 processed the request but returned no text output.";

    const sources = research ? extractSources(rawResponse) : [];

    const ledgerEvent = await persistentAppendLedgerEvent({
      kind: "JOKER_RESPONSE",
      payload: {
        response_length: outputText.length,
        model: rawResponse.model,
        research,
        sources_count: sources.length,
        ipr_subject: iprMeta.subject_id,
        ipr_operator: iprMeta.operator_id,
        ipr_node: iprMeta.node_id,
        routed_provider: routing.provider,
        routed_model: routing.model,
        routed_mode: routing.mode,
        routed_reason: routing.reason,
        executed_provider: exec.provider,
        executed_model: exec.model
      }
    });

    const signablePayload = {
      joker: "C2",
      response: outputText,
      sources,
      node: iprMeta.node_id,
      identity: iprMeta.subject_id,
      operator_id: iprMeta.operator_id,
      ipr: iprMeta,
      routing,
      execution: {
        provider: exec.provider,
        model: exec.model
      },
      ledger: {
        event_id: ledgerEvent.id,
        hash: ledgerEvent.hash,
        prev_hash: ledgerEvent.prev_hash
      }
    };

    const signature = signatureIsConfigured()
      ? signJokerPayload(signablePayload)
      : null;

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response: outputText,
      sources,
      ledger: {
        event_id: ledgerEvent.id,
        hash: ledgerEvent.hash,
        prev_hash: ledgerEvent.prev_hash
      },
      signature,
      ipr: iprMeta,
      routing,
      execution: {
        provider: exec.provider,
        model: exec.model
      },
      meta: {
        model: rawResponse.model,
        ts: new Date().toISOString(),
        node: iprMeta.node_id,
        identity: iprMeta.subject_id,
        operator_id: iprMeta.operator_id,
        research,
        memory: {
          history_turns_used: history.length,
          history_turns_max: MAX_HISTORY_TURNS,
          persistent_matches_used: memoryContext ? 1 : 0,
          backend: dbIsConfigured() ? "redis" : "runtime"
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

    await persistentAppendLedgerEvent({
      kind: "JOKER_ERROR",
      payload: {
        message
      }
    }).catch(() => null);

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 500 }
    );
  }
}

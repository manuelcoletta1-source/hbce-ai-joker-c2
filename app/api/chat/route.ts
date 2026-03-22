import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { createAnchor } from "@/lib/anchor";
import { validateTruth } from "@/lib/truth-validator";
import { evaluateHBCEPolicy } from "@/lib/policy-engine";
import {
  signFederationResponse,
  federationSignatureIsConfigured
} from "@/lib/federation-signature";
import {
  runNodeRuntime,
  finalizeNodeRuntime
} from "@/lib/node/node-runtime";
import {
  nodeMemoryIsConfigured,
  nodeSaveMemory,
  nodeGetMemoryByKey,
  nodeSearchMemories
} from "@/lib/node/node-memory";

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

type CorpusMode =
  | "off"
  | "multi-document"
  | "collection-analysis"
  | "gap-analysis"
  | "brussels-readiness";

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
      m.includes("estrai") ||
      m.includes("interpreta") ||
      m.includes("spiegamelo") ||
      m.includes("criticità") ||
      m.includes("criticita") ||
      m.includes("dossier") ||
      m.includes("bruxelles")
    ) {
      return "research";
    }

    if (!m) {
      return "research";
    }
  }

  if (!m || m.length < 5) return "chat";

  if (
    m.includes("chi sei") ||
    m.includes("presentati") ||
    m === "ciao" ||
    m.includes("ciao chi sei")
  ) {
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

function detectCorpusMode(
  message: string,
  attachments: ChatAttachment[]
): CorpusMode {
  const m = message.toLowerCase();
  const hasManyAttachments = attachments.length >= 2;

  if (!hasManyAttachments) {
    return "off";
  }

  const collectionHints =
    m.includes("tutti") ||
    m.includes("insieme") ||
    m.includes("assieme") ||
    m.includes("collana") ||
    m.includes("corpus") ||
    m.includes("trasvers") ||
    m.includes("volumi") ||
    m.includes("5 volumi") ||
    m.includes("cinque volumi");

  const gapHints =
    m.includes("criticità") ||
    m.includes("criticita") ||
    m.includes("cosa manca") ||
    m.includes("lacune") ||
    m.includes("gap") ||
    m.includes("dove va sistemato") ||
    m.includes("dove sistemare") ||
    m.includes("enforcement");

  const brusselsHints =
    m.includes("bruxelles") ||
    m.includes("dossier") ||
    m.includes("approvazione") ||
    m.includes("passare a bruxelles") ||
    m.includes("readiness") ||
    m.includes("commissione europea");

  if (brusselsHints && gapHints) {
    return "brussels-readiness";
  }

  if (gapHints) {
    return "gap-analysis";
  }

  if (collectionHints) {
    return "collection-analysis";
  }

  return "multi-document";
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
    "Use compact, precise, non-bloated language."
  ];
}

function buildCorpusModeGuidance(corpusMode: CorpusMode): string[] {
  switch (corpusMode) {
    case "multi-document":
      return [
        "Multiple related documents are present.",
        "Treat them as a connected set, not as isolated files.",
        "Look for continuity, sequence, overlap, and dependency across documents."
      ];

    case "collection-analysis":
      return [
        "Collection-analysis mode is active.",
        "Treat the attached documents as a coherent corpus or series.",
        "Do not summarize each volume separately.",
        "Reconstruct the progression of the whole collection.",
        "Explain the role of each document inside the sequence and the architectural movement from one to the next."
      ];

    case "gap-analysis":
      return [
        "Gap-analysis mode is active.",
        "Do not explain the project again unless strictly necessary.",
        "Identify what is missing, weak, immature, under-specified, or not yet enforceable.",
        "Separate foundational gaps from secondary gaps.",
        "Prefer: critical gap, why it matters, where it appears, what must be fixed."
      ];

    case "brussels-readiness":
      return [
        "Brussels-readiness mode is active.",
        "Treat the corpus as a single project seeking European-level credibility, enforceability, and institutional readiness.",
        "Do not produce a generic summary.",
        "Distinguish clearly between what is already strong, what is immature, what is missing, and what blocks enforceability or EU readiness.",
        "Order the analysis by dependency and priority."
      ];

    default:
      return [];
  }
}

function buildMemoryPromptBlock(input: {
  memoryContext: string;
  hasMemory: boolean;
}): string[] {
  if (!input.hasMemory || !input.memoryContext.trim()) {
    return [];
  }

  return [
    "Persistent node memory context is available.",
    "Use it only as supporting operational continuity context.",
    "Do not pretend the memory is a source document for claims it does not contain.",
    input.memoryContext
  ];
}

function buildSystemPrompt(input: {
  intent: "chat" | "research" | "general";
  policyGuidance: string[];
  hasAttachments: boolean;
  interpretiveMode: boolean;
  memoryContext: string;
  hasMemory: boolean;
  corpusMode: CorpusMode;
}): string {
  const base = [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    `Identity: ${NODE_IDENTITY}.`,
    `Node: ${NODE_ID}.`,
    "Answer clearly, precisely, and without inflating capabilities.",
    "Never present potential integrations as already active direct operational control.",
    "When symbolic or narrative language appears, translate it into IPR-based operational language.",
    "When evidence is partial, use cautious wording and indicative ranges.",
    "Prefer governance, supervision, auditability, compliance, and infrastructure framing over speculative implementation detail.",
    "When the user asks for analysis, prioritize diagnosis and structure over descriptive repetition."
  ];

  const intentBlock =
    input.intent === "chat"
      ? ["Conversational mode."]
      : input.intent === "research"
        ? ["Research mode: be analytical, source-aware, and cautious."]
        : ["General reasoning mode."];

  const attachmentBlock = input.hasAttachments
    ? [
        "One or more document attachments are included in the request.",
        "If attachment text is present, use it as primary context for reading or analysis."
      ]
    : [];

  const interpretiveBlock = input.interpretiveMode
    ? buildInterpretiveGuidance()
    : [];

  const corpusBlock = buildCorpusModeGuidance(input.corpusMode);

  const memoryBlock = buildMemoryPromptBlock({
    memoryContext: input.memoryContext,
    hasMemory: input.hasMemory
  });

  return [
    ...base,
    ...intentBlock,
    ...attachmentBlock,
    ...interpretiveBlock,
    ...corpusBlock,
    ...memoryBlock,
    ...input.policyGuidance
  ].join(" ");
}

function summarizeMessageForMemory(message: string): string {
  if (!message.trim()) return "";
  return message.trim().replace(/\s+/g, " ").slice(0, 280);
}

function summarizeResponseForMemory(response: string): string {
  if (!response.trim()) return "";
  return response.trim().replace(/\s+/g, " ").slice(0, 500);
}

function buildAttachmentNamesSummary(attachments: ChatAttachment[]): string {
  const names = attachments
    .map((item) => item.name?.trim())
    .filter((value): value is string => Boolean(value));

  if (names.length === 0) return "no_named_attachments";

  return names.join(", ").slice(0, 300);
}

function buildMemoryKeys(sessionId: string) {
  return {
    sessionSummaryKey: `session:${sessionId}:summary`,
    recentIntentKey: `session:${sessionId}:recent_intent`,
    recentDocumentsKey: `session:${sessionId}:recent_documents`,
    corpusSummaryKey: `session:${sessionId}:corpus_summary`,
    corpusGapKey: `session:${sessionId}:corpus_gaps`
  };
}

async function buildMemoryContext(input: {
  sessionId: string;
  effectiveMessage: string;
  hasAttachments: boolean;
  corpusMode: CorpusMode;
}): Promise<{
  enabled: boolean;
  context: string;
}> {
  if (!nodeMemoryIsConfigured()) {
    return {
      enabled: false,
      context: ""
    };
  }

  const keys = buildMemoryKeys(input.sessionId);

  const [
    sessionSummary,
    recentIntent,
    recentDocuments,
    corpusSummary,
    corpusGap,
    searchResults
  ] = await Promise.all([
    nodeGetMemoryByKey(keys.sessionSummaryKey),
    nodeGetMemoryByKey(keys.recentIntentKey),
    nodeGetMemoryByKey(keys.recentDocumentsKey),
    nodeGetMemoryByKey(keys.corpusSummaryKey),
    nodeGetMemoryByKey(keys.corpusGapKey),
    nodeSearchMemories(input.effectiveMessage.slice(0, 120))
  ]);

  const relevantSearch = searchResults
    .filter(
      (item) =>
        item.key !== keys.sessionSummaryKey &&
        item.key !== keys.corpusSummaryKey &&
        item.key !== keys.corpusGapKey
    )
    .slice(0, 3);

  const blocks: string[] = [];

  if (sessionSummary?.value) {
    blocks.push(`Session summary: ${sessionSummary.value}`);
  }

  if (recentIntent?.value) {
    blocks.push(`Recent intent memory: ${recentIntent.value}`);
  }

  if (input.hasAttachments && recentDocuments?.value) {
    blocks.push(`Recent document memory: ${recentDocuments.value}`);
  }

  if (
    (input.corpusMode === "collection-analysis" ||
      input.corpusMode === "brussels-readiness" ||
      input.corpusMode === "gap-analysis") &&
    corpusSummary?.value
  ) {
    blocks.push(`Corpus continuity memory: ${corpusSummary.value}`);
  }

  if (
    (input.corpusMode === "gap-analysis" ||
      input.corpusMode === "brussels-readiness") &&
    corpusGap?.value
  ) {
    blocks.push(`Previous gap memory: ${corpusGap.value}`);
  }

  if (relevantSearch.length > 0) {
    blocks.push(
      `Related persistent memories: ${relevantSearch
        .map((item) => `[${item.category}] ${item.key} => ${item.value}`)
        .join(" | ")}`
    );
  }

  return {
    enabled: true,
    context: blocks.join("\n")
  };
}

async function persistMemoryState(input: {
  sessionId: string;
  intent: "chat" | "research" | "general";
  effectiveMessage: string;
  response: string;
  attachments: ChatAttachment[];
  interpretiveMode: boolean;
  corpusMode: CorpusMode;
}): Promise<void> {
  if (!nodeMemoryIsConfigured()) {
    return;
  }

  const keys = buildMemoryKeys(input.sessionId);
  const tasks: Promise<unknown>[] = [];

  tasks.push(
    nodeSaveMemory({
      key: keys.recentIntentKey,
      value: [
        `intent=${input.intent}`,
        `interpretive_mode=${input.interpretiveMode ? "on" : "off"}`,
        `corpus_mode=${input.corpusMode}`,
        `message=${summarizeMessageForMemory(input.effectiveMessage)}`
      ].join(" | "),
      category: "session"
    })
  );

  tasks.push(
    nodeSaveMemory({
      key: keys.sessionSummaryKey,
      value: [
        `last_user_request=${summarizeMessageForMemory(input.effectiveMessage)}`,
        `last_response=${summarizeResponseForMemory(input.response)}`
      ].join(" | "),
      category: "session"
    })
  );

  if (input.attachments.length > 0) {
    tasks.push(
      nodeSaveMemory({
        key: keys.recentDocumentsKey,
        value: [
          `attachments=${buildAttachmentNamesSummary(input.attachments)}`,
          `last_request=${summarizeMessageForMemory(input.effectiveMessage)}`
        ].join(" | "),
        category: "documents"
      })
    );
  }

  if (
    input.corpusMode === "multi-document" ||
    input.corpusMode === "collection-analysis" ||
    input.corpusMode === "brussels-readiness"
  ) {
    tasks.push(
      nodeSaveMemory({
        key: keys.corpusSummaryKey,
        value: [
          `corpus_mode=${input.corpusMode}`,
          `attachments=${buildAttachmentNamesSummary(input.attachments)}`,
          `response=${summarizeResponseForMemory(input.response)}`
        ].join(" | "),
        category: "corpus"
      })
    );
  }

  if (
    input.corpusMode === "gap-analysis" ||
    input.corpusMode === "brussels-readiness"
  ) {
    tasks.push(
      nodeSaveMemory({
        key: keys.corpusGapKey,
        value: [
          `corpus_mode=${input.corpusMode}`,
          `request=${summarizeMessageForMemory(input.effectiveMessage)}`,
          `response=${summarizeResponseForMemory(input.response)}`
        ].join(" | "),
        category: "corpus"
      })
    );
  }

  await Promise.allSettled(tasks);
}

export async function POST(req: NextRequest) {
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
    normalizeRole(body.role);
    normalizeNodeContext(body.nodeContext);
    const continuityReference = normalizeContinuityReference(
      body.continuityReference,
      sessionId
    );

    const intent = detectIntent(message, attachments);
    const research = body.research === true || intent === "research";
    const interpretiveMode =
      hasAttachments && wantsInterpretiveMode(effectiveMessage);
    const corpusMode = detectCorpusMode(effectiveMessage, attachments);

    const historyTexts = history.map((item) => item.content);

    const memoryState = await buildMemoryContext({
      sessionId,
      effectiveMessage,
      hasAttachments,
      corpusMode
    });

    const runtimeStart = await runNodeRuntime({
      sessionId,
      userMessage: effectiveMessage,
      actor: NODE_IDENTITY
    });

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

      const runtimeEnd = await finalizeNodeRuntime({
        sessionId,
        assistantResponse: blockedResponse,
        actor: NODE_IDENTITY
      });

      await persistMemoryState({
        sessionId,
        intent,
        effectiveMessage,
        response: blockedResponse,
        attachments,
        interpretiveMode,
        corpusMode
      });

      const anchor = createAnchor({
        message: effectiveMessage,
        response: blockedResponse,
        intent,
        policy: prePolicy,
        session_id: sessionId,
        continuity_reference:
          runtimeEnd.session.continuity_reference || continuityReference
      });

      return NextResponse.json({
        ok: true,
        joker: "C2",
        response: blockedResponse,
        intent,
        interpretive_mode: interpretiveMode,
        corpus_mode: corpusMode,
        memory: {
          enabled: memoryState.enabled,
          context_used: memoryState.context.length > 0
        },
        anchor,
        node_runtime: {
          session_id: runtimeEnd.session.session_id,
          session_state: runtimeEnd.session.state,
          continuity_reference: runtimeEnd.session.continuity_reference,
          continuity_status: runtimeEnd.continuity_status,
          ledger_valid: runtimeEnd.ledger_valid,
          last_event_id: runtimeEnd.last_event_id
        },
        federation_signature: federationSignatureIsConfigured()
          ? signFederationResponse(NODE_ID, blockedResponse)
          : null
      });
    }

    const prompt = buildSystemPrompt({
      intent,
      policyGuidance: prePolicy.prompt_guidance,
      hasAttachments,
      interpretiveMode,
      memoryContext: memoryState.context,
      hasMemory: memoryState.enabled,
      corpusMode
    });

    const userContent = attachmentContext
      ? `${effectiveMessage}\n\n${attachmentContext}`
      : effectiveMessage;

    const messages = [
      {
        role: "system" as const,
        content: prompt
      },
      ...history.map((item) => ({
        role: item.role as "user" | "assistant",
        content: item.content
      })),
      {
        role: "user" as const,
        content: userContent
      }
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    let response =
      completion.choices[0]?.message?.content?.trim() || "No response generated.";

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

    if (truth.decision === "WARN" && postPolicy.truth_scope.applyWarning) {
      response = `[TRUTH WARNING]\n${response}`;
    }

    const runtimeEnd = await finalizeNodeRuntime({
      sessionId,
      assistantResponse: response,
      actor: NODE_IDENTITY
    });

    await persistMemoryState({
      sessionId,
      intent,
      effectiveMessage,
      response,
      attachments,
      interpretiveMode,
      corpusMode
    });

    const anchor = createAnchor({
      message: effectiveMessage,
      response,
      intent,
      policy: postPolicy,
      truth,
      session_id: sessionId,
      continuity_reference:
        runtimeEnd.session.continuity_reference || continuityReference
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
      interpretive_mode: interpretiveMode,
      corpus_mode: corpusMode,
      memory: {
        enabled: memoryState.enabled,
        context_used: memoryState.context.length > 0
      },
      node_runtime: {
        session_id: runtimeEnd.session.session_id,
        session_state: runtimeEnd.session.state,
        continuity_reference: runtimeEnd.session.continuity_reference,
        continuity_status: runtimeEnd.continuity_status,
        ledger_valid: runtimeEnd.ledger_valid,
        last_event_id: runtimeEnd.last_event_id,
        runtime_start_state: runtimeStart.runtime_state
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

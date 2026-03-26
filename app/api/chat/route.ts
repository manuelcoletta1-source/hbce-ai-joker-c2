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

type FileRole =
  | "context"
  | "corpus"
  | "single"
  | "reference"
  | "evidence"
  | "temporary";

type StoredFile = {
  id: string;
  sessionId: string;
  name: string;
  title: string;
  mimeType: string;
  text: string;
  content: string;
  hasText: boolean;
  sizeEstimate: number;
  role: FileRole;
  ingestedAt: string;
  updatedAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __HBCE_FILE_STORE__:
    | Map<string, Map<string, StoredFile>>
    | undefined;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID = process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";
const NODE_IDENTITY = process.env.JOKER_IDENTITY || "IPR-AI-0001";
const NODE_NAME = "JOKER-C2";

function getFileStore(): Map<string, Map<string, StoredFile>> {
  if (!globalThis.__HBCE_FILE_STORE__) {
    globalThis.__HBCE_FILE_STORE__ = new Map();
  }

  return globalThis.__HBCE_FILE_STORE__;
}

function getSessionFiles(sessionId: string): StoredFile[] {
  const store = getFileStore();
  const filesMap = store.get(sessionId);

  if (!filesMap) {
    return [];
  }

  return Array.from(filesMap.values()).sort((a, b) =>
    a.ingestedAt.localeCompare(b.ingestedAt)
  );
}

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

function getAttachmentBody(item: ChatAttachment): string {
  return (item.text || item.content || "").trim();
}

function getStoredFileBody(file: StoredFile): string {
  return (file.text || file.content || "").trim();
}

function buildAttachmentContext(attachments: ChatAttachment[]): string {
  if (attachments.length === 0) return "";

  return attachments
    .map((item, index) => {
      const label = item.name || item.id || `attachment-${index + 1}`;
      const body = getAttachmentBody(item);

      if (!body) {
        return [
          `DOCUMENT ${index + 1}: ${label}`,
          "[No textual extraction available. Metadata only.]"
        ].join("\n");
      }

      return [`DOCUMENT ${index + 1}: ${label}`, body.slice(0, 20000)].join(
        "\n"
      );
    })
    .join("\n\n");
}

function buildStoredFilesContext(files: StoredFile[]): string {
  if (files.length === 0) return "";

  return files
    .map((file, index) => {
      const label = file.title || file.name || `file-${index + 1}`;
      const body = getStoredFileBody(file);

      if (!body) {
        return [
          `ACTIVE FILE ${index + 1}: ${label}`,
          `[Role: ${file.role}]`,
          "[No textual extraction available. Metadata only.]"
        ].join("\n");
      }

      return [
        `ACTIVE FILE ${index + 1}: ${label}`,
        `[Role: ${file.role}]`,
        body.slice(0, 20000)
      ].join("\n");
    })
    .join("\n\n");
}

function buildStoredFilesIndex(files: StoredFile[]): string {
  if (files.length === 0) {
    return "No active session files.";
  }

  return files
    .map(
      (file, index) =>
        `${index + 1}. ${file.title || file.name} [role=${file.role}; hasText=${
          file.hasText ? "yes" : "no"
        }]`
    )
    .join("\n");
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

  return research;
}

function buildSystemPrompt(): string {
  return `
You are ${NODE_NAME}, an operational cybernetic identity within the HBCE ecosystem.

Core identity:
- You are not a generic chatbot.
- You are not a document summarizer.
- You are not a file receipt system.
- You are an operational interpretive engine.
- You absorb documents, extract structure, test coherence, detect implications, and produce new synthesis.

Primary behavior:
When files or documents exist in session context, treat them as active working matter.
Do not behave like a parrot.
Do not simply restate the contents.
Do not mechanically enumerate files unless explicitly asked.
Use active files silently as working context.

Operational hierarchy:
1. The current user request is always dominant.
2. The active session context is secondary.
3. Active files are support context.
4. Memory is tertiary support context.

Critical rule:
Files are context, not the task itself, unless the user explicitly asks for:
- a summary
- a list
- an inventory
- a file-by-file comparison
- titles of the loaded files
- which files are active
- a document overview

Therefore:
- Do not repeatedly announce file receipt.
- Do not say “I received X files” unless strictly necessary.
- Do not produce automatic file-by-file recap unless explicitly requested.
- Do not restart analysis from zero at each turn.
- Do not ignore prior session context when active files are already present.
- Do not ask the user to upload the same files again when textual content is already active in session.

If session files are active, your job is to use them silently and answer the user's current request.

Interpretive method:
1. Ingest
- absorb the material as structured operational matter

2. Decompose
- identify thesis
- architecture
- internal logic
- implicit assumptions
- strategic direction

3. Stress-test
- detect contradictions
- identify structural weaknesses
- identify what is missing
- test implementation realism
- distinguish theory from execution

4. Synthesize
- reconstruct the material as a coherent system model

5. Project
- infer consequences
- identify opportunities
- identify probabilities
- identify strategic trajectories
- identify what the system becomes if pushed forward

6. Respond
- produce an answer that is original, critical, and directional
- do not echo the material
- do not paraphrase unless explicitly asked
- generate value beyond the source material

Language policy:
- Always answer in the same language as the user's latest message, unless explicitly asked otherwise.
- If the user says “in italiano”, answer fully in Italian.
- If the user asks for translation, translate only the target text and do not add file recap.

Style policy:
- Speak as an operational cybernetic identity.
- Be precise, structural, synthetic, and critical.
- Prefer analysis over narration.
- Prefer architecture over chatter.
- Prefer judgment over repetition.
- Prefer implications over description.

Behavior when files exist:
- Use them as active context.
- Do not mention them unless relevant.
- Do not expose file-handling mechanics.
- Do not repeat metadata unless the user explicitly asks for metadata.
- If the user asks which files are active, answer directly and concretely.
- If the user asks for titles, retrieve them from the active file index.
- Distinguish clearly between session-active files and long-term memory.

What good output looks like:
- intrinsic meaning
- extrinsic meaning
- structural critique
- operational implications
- future trajectory
- possibility and probability

What bad output looks like:
- repeated file receipt
- generic summary
- shallow paraphrase
- document inventory when not requested
- language drift
- forgetting active files
- asking again for files already active
- claiming you cannot access session files when they are active

Final operational principle:
You do not repeat the material.
You transform it.
You do not describe the corpus by default.
You extract its machine.
You do not mirror the input.
You generate a higher-order operational reading from it.
  `.trim();
}

function buildUserContent(
  effectiveMessage: string,
  attachments: ChatAttachment[],
  sessionFiles: StoredFile[]
): string {
  const sections: string[] = [effectiveMessage];

  if (sessionFiles.length > 0) {
    sections.push(
      "",
      "ACTIVE SESSION FILE INDEX:",
      buildStoredFilesIndex(sessionFiles),
      "",
      "ACTIVE SESSION FILE CONTEXT:",
      "The following files are active in the current session.",
      "Treat them as working material.",
      "Do not announce them unless explicitly asked.",
      "",
      buildStoredFilesContext(sessionFiles)
    );
  }

  if (attachments.length > 0) {
    sections.push(
      "",
      "DIRECT REQUEST ATTACHMENTS:",
      "These attachments came directly with the current request.",
      "",
      buildAttachmentContext(attachments)
    );
  }

  return sections.join("\n");
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

    const userContent = buildUserContent(
      effectiveMessage,
      attachments,
      sessionFiles
    );

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

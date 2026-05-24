"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";

type RuntimeHealth = {
  ok?: boolean;
  runtime?: string;
  state?: string;
  provider?: string;
  apiMode?: string;
  model?: string;
  standardModel?: string;
  deepModel?: string;
  openAIConfigured?: boolean;
  identity?: {
    entity?: string;
    ipr?: string;
    evt?: string;
    state?: string;
    cycle?: string;
    core?: string;
    org?: string;
    location?: string;
  };
  boundary?: {
    legalCertification?: boolean;
    aiGovernanceBoundary?: string;
    useDemocraticBoundary?: string;
  };
  error?: string;
};

type RuntimeFile = {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  text: string;
  content: string;
  role: "context" | "reference_only";
  uploaded: boolean;
};

type ChatApiResponse = {
  ok?: boolean;
  sessionId?: string;
  response?: string;
  text?: string;
  state?: string;
  decision?: string;
  governanceDecision?: string;
  degradedReason?: string | null;
  continuityRef?: string | null;
  runtime?: unknown;
  engine?: unknown;
  governance?: unknown;
  event?: unknown;
  evt?: unknown;
  modernEvt?: unknown;
  governedEvt?: unknown;
  opc?: unknown;
  opcProof?: unknown;
  proof?: unknown;
  memory?: unknown;
  diagnostics?: unknown;
  boundary?: unknown;
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  state?: string;
  decision?: string;
  continuityRef?: string | null;
  raw?: ChatApiResponse;
};

const JOKER_SIGIL = "🜏";

const DEFAULT_PROMPT =
  "JOKER-C2, fai diagnostica runtime completa. Dimmi quale modello OpenAI usi, qual è il tuo IPR, qual è il checkpoint EVT, qual è il ruolo di OPC e cosa cambia tra OpenAI come modello e JOKER-C2 come runtime governato.";

const QUICK_PROMPTS = [
  "diagnostica runtime OpenAI completa",
  "spiegami cosa cambia tra GPT-5.5 e JOKER-C2",
  "spiegami IPR, EVT e OPC in modo operativo",
  "test fail-closed: cosa fai se manca OPC?",
  "prepara un pitch di 60 secondi per OpenAI",
  "spiegami perché JOKER-C2 non è una AI generica"
];

const TEXT_FILE_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/xhtml+xml",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "application/csv",
  "application/ld+json",
  "application/markdown",
  "application/x-ndjson",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/css",
  "text/javascript"
]);

function buildId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}

function safeText(value: unknown, fallback = "-"): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function firstText(value: unknown, paths: string[][], fallback = "-"): string {
  for (const path of paths) {
    const item = readPath(value, path);
    const text = safeText(item, "");

    if (text) {
      return text;
    }
  }

  return fallback;
}

function getAssistantText(payload: ChatApiResponse): string {
  return safeText(payload.response || payload.text, "[EMPTY_RESPONSE]");
}

function getContinuityRef(payload: ChatApiResponse): string | null {
  const direct = safeText(payload.continuityRef, "");

  if (direct) {
    return direct;
  }

  const resolved = firstText(
    payload,
    [
      ["memory", "event"],
      ["memory", "lastEventId"],
      ["governedEvt", "evt"],
      ["modernEvt", "evt"],
      ["evt", "evt"],
      ["event", "evt"]
    ],
    ""
  );

  return resolved || null;
}

function getModel(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["engine", "modelUsed"],
      ["modelUsed"],
      ["model"],
      ["diagnostics", "modelUsed"],
      ["runtime", "model"]
    ],
    "-"
  );
}

function getIpr(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["identity", "ipr"],
      ["runtime", "ipr"]
    ],
    "-"
  );
}

function getEvt(payload?: ChatApiResponse | RuntimeHealth | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["identity", "evt"],
      ["evt", "evt"],
      ["governedEvt", "evt"],
      ["modernEvt", "evt"],
      ["runtime", "checkpoint"]
    ],
    "-"
  );
}

function getOpcProof(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["opc", "publicProof", "proofId"],
      ["opc", "record", "proofId"],
      ["opc", "proofId"],
      ["opcProof", "proofId"],
      ["proof", "proofId"],
      ["runtime", "opcProofId"],
      ["diagnostics", "opcProofId"]
    ],
    "-"
  );
}

function getChainHash(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["opc", "publicProof", "chainHash"],
      ["opc", "record", "proof", "chainHash"],
      ["opc", "chainHash"],
      ["opcProof", "chainHash"],
      ["proof", "chainHash"],
      ["runtime", "opcChainHash"],
      ["diagnostics", "opcChainHash"]
    ],
    "-"
  );
}

function getEngineHash(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["opc", "publicProof", "engineHash"],
      ["opc", "record", "proof", "engineHash"],
      ["opc", "engineHash"],
      ["opcProof", "engineHash"],
      ["proof", "engineHash"],
      ["runtime", "opcEngineHash"],
      ["diagnostics", "opcEngineHash"]
    ],
    "-"
  );
}

function getProjectDomain(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["governance", "projectDomain"],
      ["projectDomain"],
      ["runtime", "projectDomain"],
      ["opc", "publicProof", "projectDomain"]
    ],
    "-"
  );
}

function getHbceModule(payload?: ChatApiResponse | null): string {
  if (!payload) return "-";

  return firstText(
    payload,
    [
      ["governance", "hbceModule"],
      ["hbceModule"],
      ["runtime", "hbceModule"],
      ["opc", "publicProof", "hbceModule"]
    ],
    "-"
  );
}

function isTextFile(file: File): boolean {
  const type = file.type || "text/plain";

  return type.startsWith("text/") || TEXT_FILE_TYPES.has(type);
}

async function readRuntimeFile(file: File): Promise<RuntimeFile> {
  const type = file.type || "application/octet-stream";
  const readable = isTextFile(file);
  const text = readable ? await file.text() : "";

  return {
    id: buildId("FILE"),
    name: file.name,
    type,
    mimeType: type,
    size: file.size,
    text,
    content: text,
    role: readable ? "context" : "reference_only",
    uploaded: true
  };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(raw || `HTTP_${response.status}`);
  }
}

function MessageBubble({
  message,
  onCopy
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={[
        "joker-message",
        isUser ? "joker-message-user" : "",
        isAssistant ? "joker-message-assistant" : "",
        isSystem ? "joker-message-system" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="joker-message-avatar">
        {isUser ? "M" : isSystem ? "!" : JOKER_SIGIL}
      </div>

      <div className="joker-message-body">
        <div className="joker-message-head">
          <strong>{isUser ? "Manuel" : isSystem ? "System" : "JOKER-C2"}</strong>
          <span>{message.createdAt}</span>
        </div>

        <pre className="joker-message-text">{message.content}</pre>

        {isAssistant && message.raw ? (
          <div className="joker-runtime-strip">
            <span>Model: {getModel(message.raw)}</span>
            <span>IPR: {getIpr(message.raw)}</span>
            <span>EVT: {getEvt(message.raw)}</span>
            <span>OPC: {getOpcProof(message.raw)}</span>
          </div>
        ) : null}

        {isAssistant ? (
          <div className="joker-message-actions">
            <button type="button" onClick={() => onCopy(message.content)}>
              Copy
            </button>

            {message.raw ? (
              <details>
                <summary>Runtime details</summary>

                <div className="joker-details-grid">
                  <div>
                    <span>State</span>
                    <strong>{safeText(message.state, "-")}</strong>
                  </div>
                  <div>
                    <span>Decision</span>
                    <strong>{safeText(message.decision, "-")}</strong>
                  </div>
                  <div>
                    <span>ProjectDomain</span>
                    <strong>{getProjectDomain(message.raw)}</strong>
                  </div>
                  <div>
                    <span>HbceModule</span>
                    <strong>{getHbceModule(message.raw)}</strong>
                  </div>
                  <div>
                    <span>EngineHash</span>
                    <strong>{getEngineHash(message.raw)}</strong>
                  </div>
                  <div>
                    <span>ChainHash</span>
                    <strong>{getChainHash(message.raw)}</strong>
                  </div>
                </div>

                <pre className="joker-json">{safeJson(message.raw)}</pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function InterfacePage() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<RuntimeFile[]>([]);
  const [continuityRef, setContinuityRef] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("hbce-joker-c2-session-id")
        : null;

    const nextSessionId = stored || buildId("JOKER-UI");

    setSessionId(nextSessionId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-c2-session-id", nextSessionId);
    }

    void checkRuntime();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [message]);

  async function checkRuntime() {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "GET",
        cache: "no-store"
      });

      const payload = await readJsonResponse<RuntimeHealth>(response);

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `HTTP_${response.status}`);
      }

      setHealth(payload);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "HEALTH_CHECK_FAILED");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleFiles(inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return;

    setError(null);

    try {
      const selected = Array.from(inputFiles);
      const nextFiles = await Promise.all(selected.map(readRuntimeFile));

      setFiles((current) => [...current, ...nextFiles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FILE_READ_FAILED");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function clearFiles() {
    setFiles([]);
  }

  function newChat() {
    const nextSessionId = buildId("JOKER-UI");

    setSessionId(nextSessionId);
    setMessages([]);
    setFiles([]);
    setContinuityRef(null);
    setMessage("");
    setError(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-c2-session-id", nextSessionId);
    }
  }

  async function copyText(content: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      setCopied(false);
    }
  }

  async function sendMessage(forceMessage?: string) {
    const outgoing = (forceMessage ?? message).trim();

    if (!outgoing && files.length === 0) {
      setError("Scrivi un messaggio oppure allega un file testuale.");
      return;
    }

    const effectiveMessage =
      outgoing || "Analizza i file attivi come contesto operativo JOKER-C2.";

    setError(null);
    setIsSending(true);
    setMessage("");

    const userMessage: ChatMessage = {
      id: buildId("MSG-U"),
      role: "user",
      content: effectiveMessage,
      createdAt: new Date().toLocaleString("it-IT")
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify({
          message: effectiveMessage,
          sessionId,
          continuityRef,
          files
        })
      });

      const payload = await readJsonResponse<ChatApiResponse>(response);

      if (!response.ok || payload.ok === false) {
        const errorText =
          payload.error ||
          payload.response ||
          payload.text ||
          `Runtime request failed with HTTP ${response.status}`;

        throw new Error(errorText);
      }

      const nextContinuityRef = getContinuityRef(payload);

      if (nextContinuityRef) {
        setContinuityRef(nextContinuityRef);
      }

      const assistantMessage: ChatMessage = {
        id: buildId("MSG-A"),
        role: "assistant",
        content: getAssistantText(payload),
        createdAt: new Date().toLocaleString("it-IT"),
        state: safeText(payload.state, "-"),
        decision: safeText(payload.decision, "-"),
        continuityRef: nextContinuityRef,
        raw: payload
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : "CHAT_REQUEST_FAILED";

      setError(errorText);

      setMessages((current) => [
        ...current,
        {
          id: buildId("MSG-S"),
          role: "system",
          content: `Runtime error: ${errorText}`,
          createdAt: new Date().toLocaleString("it-IT")
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="joker-page">
      <header className="joker-topbar">
        <div className="joker-brand">
          <div className="joker-logo">{JOKER_SIGIL}</div>
          <div>
            <strong>JOKER-C2</strong>
            <span>HBCE governed AI runtime</span>
          </div>
        </div>

        <div className="joker-health">
          <span className="joker-dot" />
          <span>{safeText(health?.state, "CHECKING")}</span>
          <span>{safeText(health?.model, getModel(health))}</span>
          <span>{safeText(health?.identity?.ipr, "IPR-AI-0001")}</span>
        </div>

        <div className="joker-top-actions">
          <button type="button" onClick={checkRuntime} disabled={isChecking}>
            {isChecking ? "Check..." : "Runtime"}
          </button>
          <button type="button" onClick={newChat}>
            New chat
          </button>
        </div>
      </header>

      <section className="joker-chat">
        {messages.length === 0 ? (
          <div className="joker-empty">
            <div className="joker-empty-logo">{JOKER_SIGIL}</div>
            <h1>AI JOKER-C2</h1>
            <p>
              Interfaccia chat classica. Scrivi sotto, ricevi la risposta qui.
              Il runtime resta governato da HBCE: IPR, EVT, OPC, MATRIX,
              audit e fail-closed.
            </p>

            <div className="joker-prompt-grid">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="joker-message-list">
            {messages.map((item) => (
              <MessageBubble key={item.id} message={item} onCopy={copyText} />
            ))}

            {isSending ? (
              <article className="joker-message joker-message-assistant">
                <div className="joker-message-avatar">{JOKER_SIGIL}</div>
                <div className="joker-message-body">
                  <div className="joker-message-head">
                    <strong>JOKER-C2</strong>
                    <span>running</span>
                  </div>
                  <div className="joker-thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            ) : null}

            <div ref={bottomRef} />
          </div>
        )}
      </section>

      <section className="joker-composer-shell">
        {error ? <div className="joker-error">{error}</div> : null}
        {copied ? <div className="joker-copied">Risposta copiata.</div> : null}

        {files.length > 0 ? (
          <div className="joker-file-bar">
            {files.map((file) => (
              <div key={file.id} className="joker-file-chip">
                <span>{file.name}</span>
                <button type="button" onClick={() => removeFile(file.id)}>
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="joker-clear-files" onClick={clearFiles}>
              Clear files
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="joker-composer">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(event) => void handleFiles(event.target.files)}
          />

          <button
            type="button"
            className="joker-icon-button"
            onClick={() => fileInputRef.current?.click()}
            title="Add files"
          >
            +
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi a JOKER-C2..."
            rows={1}
          />

          <button
            type="submit"
            className="joker-send"
            disabled={isSending || (!message.trim() && files.length === 0)}
            title="Send"
          >
            ↑
          </button>
        </form>

        <div className="joker-footer-line">
          <span>Enter invia · Shift+Enter va a capo</span>
          <span>Session: {sessionId || "initializing"}</span>
        </div>
      </section>

      <style jsx>{`
        .joker-page {
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background:
            radial-gradient(circle at 20% 0%, rgba(34, 211, 238, 0.12), transparent 34%),
            radial-gradient(circle at 80% 8%, rgba(99, 102, 241, 0.13), transparent 34%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
          color: #e5edf8;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .joker-topbar {
          position: sticky;
          top: 0;
          z-index: 10;
          display: grid;
          grid-template-columns: minmax(180px, 1fr) auto auto;
          gap: 14px;
          align-items: center;
          padding: 14px 22px;
          border-bottom: 1px solid rgba(51, 65, 85, 0.82);
          background: rgba(2, 6, 23, 0.86);
          backdrop-filter: blur(18px);
        }

        .joker-brand {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .joker-logo,
        .joker-empty-logo,
        .joker-message-avatar {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          color: white;
          font-weight: 900;
          box-shadow: 0 10px 28px rgba(34, 211, 238, 0.22);
        }

        .joker-logo,
        .joker-empty-logo {
          font-size: 23px;
          line-height: 1;
        }

        .joker-message-avatar {
          font-size: 20px;
          line-height: 1;
        }

        .joker-empty-logo {
          width: 68px;
          height: 68px;
          border-radius: 24px;
          font-size: 34px;
        }

        .joker-brand strong {
          display: block;
          color: #ffffff;
          font-size: 15px;
          letter-spacing: 0.02em;
        }

        .joker-brand span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 12px;
        }

        .joker-health {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 8px 10px;
          border: 1px solid rgba(51, 65, 85, 0.92);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.74);
          color: #cbd5e1;
          font-size: 12px;
          white-space: nowrap;
        }

        .joker-health span:not(.joker-dot) {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .joker-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 18px rgba(34, 197, 94, 0.85);
        }

        .joker-top-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        button {
          appearance: none;
          border: 1px solid rgba(51, 65, 85, 0.96);
          background: rgba(15, 23, 42, 0.88);
          color: #dbeafe;
          border-radius: 999px;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 780;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease,
            transform 160ms ease,
            opacity 160ms ease;
        }

        button:hover {
          border-color: rgba(34, 211, 238, 0.72);
          color: #cffafe;
          background: rgba(8, 47, 73, 0.52);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.52;
          transform: none;
        }

        .joker-top-actions button {
          padding: 8px 12px;
        }

        .joker-chat {
          min-height: 0;
          overflow-y: auto;
          padding: 34px 18px 22px;
        }

        .joker-empty {
          width: min(820px, 100%);
          min-height: calc(100vh - 250px);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .joker-empty h1 {
          margin: 20px 0 0;
          color: #ffffff;
          font-size: clamp(34px, 6vw, 58px);
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .joker-empty p {
          max-width: 720px;
          margin: 16px 0 0;
          color: #94a3b8;
          font-size: 16px;
          line-height: 1.68;
        }

        .joker-prompt-grid {
          width: min(760px, 100%);
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 28px;
        }

        .joker-prompt-grid button {
          min-height: 54px;
          padding: 12px 14px;
          border-radius: 18px;
          text-align: left;
          color: #cbd5e1;
          background: rgba(2, 6, 23, 0.48);
        }

        .joker-message-list {
          width: min(980px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 20px;
          padding-bottom: 8px;
        }

        .joker-message {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 14px;
          align-items: flex-start;
        }

        .joker-message-user .joker-message-avatar {
          background: linear-gradient(135deg, #334155, #0f172a);
          box-shadow: none;
          font-size: 16px;
        }

        .joker-message-system .joker-message-avatar {
          background: linear-gradient(135deg, #ef4444, #7f1d1d);
          box-shadow: none;
          font-size: 16px;
        }

        .joker-message-body {
          min-width: 0;
          border: 1px solid rgba(51, 65, 85, 0.78);
          border-radius: 22px;
          background: rgba(2, 6, 23, 0.58);
          padding: 16px;
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
        }

        .joker-message-user .joker-message-body {
          background: rgba(8, 145, 178, 0.12);
          border-color: rgba(34, 211, 238, 0.26);
        }

        .joker-message-system .joker-message-body {
          background: rgba(127, 29, 29, 0.22);
          border-color: rgba(248, 113, 113, 0.32);
        }

        .joker-message-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .joker-message-head strong {
          color: #f8fafc;
          font-size: 13px;
          letter-spacing: 0.02em;
        }

        .joker-message-head span {
          color: #64748b;
          font-size: 12px;
        }

        .joker-message-text {
          margin: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          color: #e5edf8;
          font-size: 15px;
          line-height: 1.72;
          font-family: inherit;
        }

        .joker-runtime-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(51, 65, 85, 0.72);
        }

        .joker-runtime-strip span {
          max-width: 100%;
          padding: 5px 9px;
          border: 1px solid rgba(71, 85, 105, 0.65);
          border-radius: 999px;
          color: #a5f3fc;
          background: rgba(8, 47, 73, 0.28);
          font-size: 11px;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          overflow-wrap: anywhere;
        }

        .joker-message-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }

        .joker-message-actions button {
          padding: 7px 10px;
          font-size: 12px;
        }

        details {
          width: 100%;
        }

        summary {
          cursor: pointer;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
        }

        .joker-details-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .joker-details-grid div {
          min-width: 0;
          padding: 10px;
          border: 1px solid rgba(51, 65, 85, 0.72);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.68);
        }

        .joker-details-grid span {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .joker-details-grid strong {
          display: block;
          margin-top: 5px;
          color: #e2e8f0;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
        }

        .joker-json {
          margin: 12px 0 0;
          max-height: 360px;
          overflow: auto;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.76);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.28);
          color: #cbd5e1;
          font-size: 11px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .joker-thinking {
          display: flex;
          align-items: center;
          gap: 7px;
          height: 28px;
        }

        .joker-thinking span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #67e8f9;
          animation: jokerPulse 1s infinite ease-in-out;
        }

        .joker-thinking span:nth-child(2) {
          animation-delay: 0.16s;
        }

        .joker-thinking span:nth-child(3) {
          animation-delay: 0.32s;
        }

        @keyframes jokerPulse {
          0%,
          80%,
          100% {
            transform: scale(0.75);
            opacity: 0.45;
          }

          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .joker-composer-shell {
          position: sticky;
          bottom: 0;
          z-index: 20;
          padding: 14px 18px 18px;
          border-top: 1px solid rgba(51, 65, 85, 0.82);
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0), rgba(2, 6, 23, 0.92) 18%),
            rgba(2, 6, 23, 0.92);
          backdrop-filter: blur(18px);
        }

        .joker-error,
        .joker-copied {
          width: min(980px, 100%);
          margin: 0 auto 10px;
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.4;
        }

        .joker-error {
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(127, 29, 29, 0.26);
        }

        .joker-copied {
          color: #bbf7d0;
          border: 1px solid rgba(34, 197, 94, 0.35);
          background: rgba(20, 83, 45, 0.26);
        }

        .joker-file-bar {
          width: min(980px, 100%);
          margin: 0 auto 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .joker-file-chip,
        .joker-clear-files {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          padding: 7px 10px;
          border: 1px solid rgba(51, 65, 85, 0.86);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          color: #cbd5e1;
          font-size: 12px;
        }

        .joker-file-chip span {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-file-chip button {
          border: 0;
          padding: 0;
          width: 18px;
          height: 18px;
          background: rgba(71, 85, 105, 0.7);
          color: #e2e8f0;
        }

        .joker-clear-files {
          cursor: pointer;
        }

        .joker-composer {
          width: min(980px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: end;
          gap: 10px;
          padding: 10px;
          border: 1px solid rgba(51, 65, 85, 0.96);
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.96);
          box-shadow: 0 18px 58px rgba(0, 0, 0, 0.34);
        }

        .joker-icon-button,
        .joker-send {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 999px;
          font-size: 20px;
          line-height: 1;
        }

        .joker-send {
          border-color: rgba(34, 211, 238, 0.65);
          background: linear-gradient(135deg, #0891b2, #4f46e5);
          color: #ffffff;
        }

        .joker-composer textarea {
          width: 100%;
          max-height: 220px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: #f8fafc;
          padding: 8px 4px;
          font: inherit;
          font-size: 15px;
          line-height: 1.55;
        }

        .joker-composer textarea::placeholder {
          color: #64748b;
        }

        .joker-footer-line {
          width: min(980px, 100%);
          margin: 8px auto 0;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.4;
        }

        @media (max-width: 860px) {
          .joker-topbar {
            grid-template-columns: 1fr;
            align-items: stretch;
          }

          .joker-health {
            justify-content: flex-start;
            overflow: auto;
          }

          .joker-top-actions {
            justify-content: flex-start;
          }

          .joker-prompt-grid {
            grid-template-columns: 1fr;
          }

          .joker-details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .joker-topbar {
            padding: 12px;
          }

          .joker-chat {
            padding: 22px 10px 14px;
          }

          .joker-message {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .joker-message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 12px;
          }

          .joker-message-body {
            border-radius: 18px;
            padding: 14px;
          }

          .joker-composer-shell {
            padding: 10px;
          }

          .joker-footer-line {
            flex-direction: column;
          }

          .joker-empty {
            min-height: calc(100vh - 310px);
          }
        }
      `}</style>
    </main>
  );
}

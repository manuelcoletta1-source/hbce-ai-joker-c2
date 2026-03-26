"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  evt?: {
    ok?: boolean;
    evt?: string;
    hash?: string;
    prev?: string | null;
    error?: string;
  };
};

type SelectedAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  text?: string;
  content?: string;
  note?: string;
};

type ApiResponse = {
  ok: boolean;
  response?: string;
  error?: string;
  sources?: Array<{
    title: string;
    url?: string;
  }>;
  interpretive_mode?: boolean;
  corpus_mode?:
    | "off"
    | "multi-document"
    | "collection-analysis"
    | "gap-analysis"
    | "brussels-readiness";
  memory?: {
    enabled?: boolean;
    context_used?: boolean;
    stored?: boolean;
    key?: string | null;
  };
  evt?: {
    ok?: boolean;
    evt?: string;
    hash?: string;
    prev?: string | null;
    error?: string;
  };
  node_runtime?: {
    session_id?: string;
    session_state?: string;
    continuity_reference?: string;
    continuity_status?: string;
    ledger_valid?: boolean;
    last_event_id?: string | null;
    runtime_start_state?: string;
    warning?: string;
  };
};

const STORAGE_KEY = "hbce-joker-c2-interface-v6";
const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeSessionId() {
  return `JOKER-UI-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

type PersistedState = {
  messages: ChatMessage[];
  sessionId: string;
};

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    return {
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.filter(
            (item): item is ChatMessage =>
              !!item &&
              typeof item.id === "string" &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
        : [],
      sessionId:
        typeof parsed.sessionId === "string" && parsed.sessionId.trim()
          ? parsed.sessionId
          : makeSessionId()
    };
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function cleanAssistantResponse(text: string) {
  if (!text) return "Nessuna risposta ricevuta.";

  const runtimeMarker = "[Node Runtime]";
  if (text.includes(runtimeMarker)) {
    return text.split(runtimeMarker)[0].trim();
  }

  return text.trim();
}

function formatSources(
  sources?: Array<{
    title: string;
    url?: string;
  }>
) {
  if (!sources || sources.length === 0) return "";

  return [
    "",
    "Fonti:",
    ...sources.map((source, index) =>
      source.url
        ? `${index + 1}. ${source.title} — ${source.url}`
        : `${index + 1}. ${source.title}`
    )
  ].join("\n");
}

function formatCorpusMode(
  mode:
    | "off"
    | "multi-document"
    | "collection-analysis"
    | "gap-analysis"
    | "brussels-readiness"
    | undefined
) {
  switch (mode) {
    case "multi-document":
      return "MULTI-DOCUMENT";
    case "collection-analysis":
      return "COLLECTION-ANALYSIS";
    case "gap-analysis":
      return "GAP-ANALYSIS";
    case "brussels-readiness":
      return "BRUSSELS-READINESS";
    case "off":
    default:
      return "OFF";
  }
}

function shortenHash(value?: string | null, start = 12, end = 10) {
  if (!value) return "-";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextReadableFile(file: File) {
  const name = (file.name || "").toLowerCase();

  return (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".json") ||
    file.type.startsWith("text/")
  );
}

async function mapSelectedFile(file: File): Promise<SelectedAttachment> {
  const base = {
    id: makeId(),
    name: file.name,
    type: file.type || "unknown",
    size: file.size
  };

  if (!isTextReadableFile(file)) {
    return {
      ...base,
      text: "",
      content: "",
      note: "Metadata only. Text extraction not available in client runtime."
    };
  }

  try {
    const text = await file.text();

    return {
      ...base,
      text,
      content: text
    };
  } catch {
    return {
      ...base,
      text: "",
      content: "",
      note: "Read failed in client runtime."
    };
  }
}

export default function InterfacePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: "assistant",
      content:
        "JOKER-C2 online. Invia una richiesta operativa, una domanda o un testo da analizzare."
    }
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);

  const [status, setStatus] = useState("Ready");
  const [sessionState, setSessionState] = useState("-");
  const [continuityReference, setContinuityReference] = useState("-");
  const [continuityStatus, setContinuityStatus] = useState("-");
  const [interpretiveMode, setInterpretiveMode] = useState("OFF");
  const [corpusMode, setCorpusMode] = useState("OFF");
  const [memoryEnabled, setMemoryEnabled] = useState("OFF");
  const [memoryContextUsed, setMemoryContextUsed] = useState("NO");
  const [ledgerValid, setLedgerValid] = useState("-");
  const [lastEventId, setLastEventId] = useState("-");
  const [runtimeStartState, setRuntimeStartState] = useState("-");
  const [lastEvt, setLastEvt] = useState("-");
  const [lastEvtPrev, setLastEvtPrev] = useState("-");
  const [lastEvtHash, setLastEvtHash] = useState("-");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = loadState();
    if (!stored) return;

    if (stored.messages.length > 0) {
      setMessages(stored.messages);
    }

    setSessionId(stored.sessionId);
  }, []);

  useEffect(() => {
    saveState({
      messages,
      sessionId
    });
  }, [messages, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const turns = useMemo(() => messages.length, [messages]);
  const activeCorpusLabel =
    attachments.length > 0
      ? `Corpus attivo: ${attachments.length} document${
          attachments.length === 1 ? "o" : "i"
        }`
      : "Corpus attivo: nessun documento";

  function clearConversation() {
    const newSession = makeSessionId();

    setMessages([
      {
        id: makeId(),
        role: "assistant",
        content:
          "JOKER-C2 online. Nuova sessione inizializzata. Invia una richiesta operativa."
      }
    ]);
    setInput("");
    setAttachments([]);
    setSessionId(newSession);
    setStatus("Ready");
    setSessionState("-");
    setContinuityReference("-");
    setContinuityStatus("-");
    setInterpretiveMode("OFF");
    setCorpusMode("OFF");
    setMemoryEnabled("OFF");
    setMemoryContextUsed("NO");
    setLedgerValid("-");
    setLastEventId("-");
    setRuntimeStartState("-");
    setLastEvt("-");
    setLastEvtPrev("-");
    setLastEvtHash("-");
    localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const mapped = await Promise.all(files.map(mapSelectedFile));
    setAttachments((prev) => [...prev, ...mapped]);
    event.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  async function sendMessage() {
    const message = input.trim();
    if ((!message && attachments.length === 0) || sending) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content:
        attachments.length > 0
          ? `${message || "[Allegati selezionati]"}\n\nAllegati attivi:\n${attachments
              .map((item) => `- ${item.name} (${formatBytes(item.size)})`)
              .join("\n")}`
          : message
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setStatus("Processing");

    try {
      console.log("ATTACHMENTS DEBUG", attachments);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          message: message || "Analizza gli allegati attivi della sessione.",
          sessionId,
          role: "Operatore supervisionato",
          nodeContext: DEFAULT_NODE,
          continuityReference: `${sessionId}-AUDIT`,
          attachments: attachments.map((item) => ({
            id: item.id,
            name: item.name,
            mimeType: item.type,
            text: item.text || "",
            content: item.content || ""
          }))
        })
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Risposta non JSON: ${text.slice(0, 200)}`);
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Execution error");
      }

      const cleaned = cleanAssistantResponse(data.response || "");
      const corpusNotice =
        attachments.length > 0
          ? `\n\n[Corpus attivo nella sessione: ${attachments.length} document${
              attachments.length === 1 ? "o" : "i"
            }]`
          : "";
      const assistantText = `${cleaned}${corpusNotice}${formatSources(data.sources)}`;

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: assistantText,
        evt: data.evt
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("Ready");
      setSessionState(data.node_runtime?.session_state || "-");
      setContinuityReference(
        data.node_runtime?.continuity_reference || `${sessionId}-AUDIT`
      );
      setContinuityStatus(data.node_runtime?.continuity_status || "-");
      setInterpretiveMode(data.interpretive_mode ? "ON" : "OFF");
      setCorpusMode(formatCorpusMode(data.corpus_mode));
      setMemoryEnabled(data.memory?.enabled ? "ON" : "OFF");
      setMemoryContextUsed(data.memory?.context_used ? "YES" : "NO");
      setLedgerValid(
        typeof data.node_runtime?.ledger_valid === "boolean"
          ? data.node_runtime.ledger_valid
            ? "TRUE"
            : "FALSE"
          : "-"
      );
      setLastEventId(data.node_runtime?.last_event_id || "-");
      setRuntimeStartState(data.node_runtime?.runtime_start_state || "-");
      setLastEvt(data.evt?.evt || "-");
      setLastEvtPrev(data.evt?.prev || "-");
      setLastEvtHash(shortenHash(data.evt?.hash));
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content:
            error instanceof Error
              ? `Errore: ${error.message}`
              : "Errore imprevisto di esecuzione."
        }
      ]);
      setStatus("Error");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div>
              <div style={styles.sidebarKicker}>HBCE Research</div>
              <div style={styles.sidebarTitle}>JOKER-C2</div>
            </div>

            <button onClick={clearConversation} style={styles.newChatButton}>
              Nuova sessione
            </button>
          </div>

          <section style={styles.sidebarCard}>
            <div style={styles.cardTitle}>Execution Context</div>

            <div style={styles.metaGrid}>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Default Node</div>
                <div style={styles.metaValue}>{DEFAULT_NODE}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Session ID</div>
                <div style={styles.metaValue}>{sessionId}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Session State</div>
                <div style={styles.metaValue}>{sessionState}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Runtime Start State</div>
                <div style={styles.metaValue}>{runtimeStartState}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Continuity Reference</div>
                <div style={styles.metaValue}>{continuityReference}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Continuity Status</div>
                <div style={styles.metaValue}>{continuityStatus}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Interpretive Mode</div>
                <div style={styles.metaValue}>{interpretiveMode}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Corpus Mode</div>
                <div style={styles.metaValue}>{corpusMode}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Node Memory</div>
                <div style={styles.metaValue}>{memoryEnabled}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Memory Context Used</div>
                <div style={styles.metaValue}>{memoryContextUsed}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Ledger Valid</div>
                <div style={styles.metaValue}>{ledgerValid}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Last Runtime Event</div>
                <div style={styles.metaValue}>{lastEventId}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Last EVT</div>
                <div style={styles.metaValue}>{lastEvt}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Last EVT Prev</div>
                <div style={styles.metaValue}>{lastEvtPrev}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Last EVT Hash</div>
                <div style={styles.metaValue}>{lastEvtHash}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Active Attachments</div>
                <div style={styles.metaValue}>{String(attachments.length)}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Status</div>
                <div style={styles.metaValue}>
                  {sending ? "Sending..." : status}
                </div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Conversation Turns</div>
                <div style={styles.metaValue}>{String(turns)}</div>
              </div>
            </div>
          </section>

          <section style={styles.sidebarCard}>
            <div style={styles.cardTitle}>Runtime Model</div>
            <div style={styles.infoText}>
              request → session → continuity → memory → corpus reasoning →
              response → audit → evt
            </div>
          </section>
        </aside>

        <section style={styles.chatArea}>
          <header style={styles.chatHeader}>
            <div>
              <div style={styles.chatKicker}>Operational Interface</div>
              <h1 style={styles.chatTitle}>AI JOKER-C2</h1>
              <p style={styles.chatSubtitle}>
                Interfaccia conversazionale operativa collegata al nodo Torino.
              </p>
              <div style={styles.corpusBanner}>{activeCorpusLabel}</div>
            </div>
          </header>

          <div style={styles.messagesWrap}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start"
                }}
              >
                <article
                  style={{
                    ...styles.messageBubble,
                    ...(message.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble)
                  }}
                >
                  <div style={styles.messageRole}>
                    {message.role === "user" ? "You" : "AI JOKER-C2"}
                  </div>
                  <div style={styles.messageText}>{message.content}</div>

                  {message.role === "assistant" && message.evt?.evt && (
                    <div style={styles.evtBox}>
                      <div style={styles.evtTitle}>EVT Chain</div>

                      <div style={styles.evtRow}>
                        <span style={styles.evtLabel}>EVT</span>
                        <span style={styles.evtValue}>{message.evt.evt}</span>
                      </div>

                      <div style={styles.evtRow}>
                        <span style={styles.evtLabel}>Prev</span>
                        <span style={styles.evtValue}>
                          {message.evt.prev || "-"}
                        </span>
                      </div>

                      <div style={styles.evtRow}>
                        <span style={styles.evtLabel}>Hash</span>
                        <span style={styles.evtValue}>
                          {shortenHash(message.evt.hash, 16, 12)}
                        </span>
                      </div>
                    </div>
                  )}

                  {message.role === "assistant" &&
                    message.evt &&
                    !message.evt.ok &&
                    message.evt.error && (
                      <div style={styles.evtError}>
                        EVT error: {message.evt.error}
                      </div>
                    )}
                </article>
              </div>
            ))}

            {sending && (
              <div style={styles.messageRow}>
                <article
                  style={{
                    ...styles.messageBubble,
                    ...styles.assistantBubble
                  }}
                >
                  <div style={styles.messageRole}>AI JOKER-C2</div>
                  <div style={styles.messageText}>Elaborazione in corso...</div>
                </article>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          <div style={styles.composerShell}>
            <div style={styles.composerInner}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.json,.csv"
                onChange={handleFilesSelected}
                style={{ display: "none" }}
              />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi la tua richiesta a JOKER-C2..."
                style={styles.textarea}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />

              {attachments.length > 0 && (
                <div style={styles.attachmentsWrap}>
                  {attachments.map((item) => (
                    <div key={item.id} style={styles.attachmentChip}>
                      <span style={styles.attachmentName}>{item.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(item.id)}
                        style={styles.attachmentRemove}
                        aria-label={`Rimuovi ${item.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.composerBottom}>
                <div style={styles.composerLeft}>
                  <button
                    type="button"
                    style={styles.attachButton}
                    title="Allega file o foto"
                    aria-label="Allega file o foto"
                    onClick={handleOpenFilePicker}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.44 11.05l-8.49 8.49a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 115.66 5.66l-9.2 9.19a2 2 0 01-2.82-2.83l8.48-8.48" />
                    </svg>
                  </button>

                  <div style={styles.composerHint}>
                    Enter invia · Shift + Enter va a capo
                  </div>
                </div>

                <button
                  onClick={() => void sendMessage()}
                  disabled={sending || (!input.trim() && attachments.length === 0)}
                  style={{
                    ...styles.sendButton,
                    opacity:
                      sending || (!input.trim() && attachments.length === 0)
                        ? 0.6
                        : 1
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(0,194,255,0.12), transparent 30%), linear-gradient(180deg, #071018 0%, #0b1220 100%)",
    color: "#e8eef7",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)"
  },
  sidebar: {
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  sidebarHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  sidebarKicker: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#7dd3fc",
    marginBottom: 6
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.1
  },
  newChatButton: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#eef6ff",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: 600
  },
  sidebarCard: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.20)",
    borderRadius: 18,
    padding: 14
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 12,
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: "0.12em"
  },
  metaGrid: {
    display: "grid",
    gap: 10
  },
  metaItem: {
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    padding: 12
  },
  metaLabel: {
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(232,238,247,0.45)",
    marginBottom: 6
  },
  metaValue: {
    color: "#edf4ff",
    lineHeight: 1.55,
    wordBreak: "break-word",
    fontSize: 13
  },
  infoText: {
    color: "#edf4ff",
    lineHeight: 1.7,
    fontSize: 14
  },
  chatArea: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    minHeight: "100vh"
  },
  chatHeader: {
    padding: "24px 28px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)"
  },
  chatKicker: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#7dd3fc",
    marginBottom: 8
  },
  chatTitle: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1
  },
  chatSubtitle: {
    marginTop: 10,
    marginBottom: 0,
    color: "rgba(232,238,247,0.70)",
    fontSize: 14
  },
  corpusBanner: {
    marginTop: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(125,211,252,0.22)",
    background: "rgba(125,211,252,0.08)",
    color: "#cfefff",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  },
  messagesWrap: {
    padding: "24px 28px 140px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  messageBubble: {
    maxWidth: 820,
    borderRadius: 18,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.08)"
  },
  userBubble: {
    background: "rgba(34,211,238,0.12)"
  },
  assistantBubble: {
    background: "rgba(255,255,255,0.05)"
  },
  messageRole: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "rgba(232,238,247,0.48)",
    marginBottom: 8
  },
  messageText: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
    fontSize: 15,
    color: "#edf4ff"
  },
  evtBox: {
    marginTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 12,
    display: "grid",
    gap: 8
  },
  evtTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#7dd3fc"
  },
  evtRow: {
    display: "grid",
    gridTemplateColumns: "64px minmax(0,1fr)",
    gap: 8,
    alignItems: "start"
  },
  evtLabel: {
    fontSize: 12,
    color: "rgba(232,238,247,0.55)",
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  },
  evtValue: {
    fontSize: 13,
    color: "#edf4ff",
    wordBreak: "break-word",
    lineHeight: 1.5
  },
  evtError: {
    marginTop: 12,
    fontSize: 13,
    color: "#fca5a5"
  },
  composerShell: {
    position: "sticky",
    bottom: 0,
    padding: "16px 24px 24px",
    background:
      "linear-gradient(180deg, rgba(7,16,24,0) 0%, rgba(7,16,24,0.85) 30%, rgba(7,16,24,1) 100%)"
  },
  composerInner: {
    maxWidth: 920,
    margin: "0 auto",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    borderRadius: 22,
    padding: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    maxHeight: 220,
    border: "none",
    background: "transparent",
    color: "#eef6ff",
    padding: 8,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    fontSize: 15,
    lineHeight: 1.6
  },
  attachmentsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "6px 8px 10px"
  },
  attachmentChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#e8eef7",
    padding: "6px 10px",
    fontSize: 12,
    maxWidth: "100%"
  },
  attachmentName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 220
  },
  attachmentRemove: {
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: 0
  },
  composerBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingTop: 8
  },
  composerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  composerHint: {
    fontSize: 13,
    color: "rgba(232,238,247,0.60)"
  },
  attachButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "#d7e8f8",
    cursor: "pointer"
  },
  sendButton: {
    border: "none",
    background: "#22d3ee",
    color: "#071018",
    borderRadius: 14,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700
  }
};

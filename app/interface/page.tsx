"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
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
  memory?: {
    enabled?: boolean;
    context_used?: boolean;
  };
  node_runtime?: {
    session_id?: string;
    session_state?: string;
    continuity_reference?: string;
    continuity_status?: string;
    warning?: string;
  };
};

const STORAGE_KEY = "hbce-joker-c2-interface-v4";
const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeSessionId() {
  return `JOKER-UI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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

  const [status, setStatus] = useState("Ready");
  const [sessionState, setSessionState] = useState("-");
  const [continuityReference, setContinuityReference] = useState("-");
  const [continuityStatus, setContinuityStatus] = useState("-");
  const [interpretiveMode, setInterpretiveMode] = useState("OFF");
  const [memoryEnabled, setMemoryEnabled] = useState("OFF");
  const [memoryContextUsed, setMemoryContextUsed] = useState("NO");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    setSessionId(newSession);
    setStatus("Ready");
    setSessionState("-");
    setContinuityReference("-");
    setContinuityStatus("-");
    setInterpretiveMode("OFF");
    setMemoryEnabled("OFF");
    setMemoryContextUsed("NO");
    localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  }

  async function sendMessage() {
    const message = input.trim();
    if (!message || sending) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: message
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setStatus("Processing");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          message,
          sessionId,
          role: "Operatore supervisionato",
          nodeContext: DEFAULT_NODE,
          continuityReference: `${sessionId}-AUDIT`
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
      const assistantText = `${cleaned}${formatSources(data.sources)}`;

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: assistantText
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("Ready");
      setSessionState(data.node_runtime?.session_state || "-");
      setContinuityReference(
        data.node_runtime?.continuity_reference || `${sessionId}-AUDIT`
      );
      setContinuityStatus(data.node_runtime?.continuity_status || "-");
      setInterpretiveMode(data.interpretive_mode ? "ON" : "OFF");
      setMemoryEnabled(data.memory?.enabled ? "ON" : "OFF");
      setMemoryContextUsed(data.memory?.context_used ? "YES" : "NO");
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
                <div style={styles.metaLabel}>Node Memory</div>
                <div style={styles.metaValue}>{memoryEnabled}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Memory Context Used</div>
                <div style={styles.metaValue}>{memoryContextUsed}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Status</div>
                <div style={styles.metaValue}>{sending ? "Sending..." : status}</div>
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
              request → session → continuity → memory → response → audit
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

              <div style={styles.composerBottom}>
                <div style={styles.composerHint}>
                  Enter invia · Shift + Enter va a capo
                </div>

                <button
                  onClick={() => void sendMessage()}
                  disabled={sending || !input.trim()}
                  style={{
                    ...styles.sendButton,
                    opacity: sending || !input.trim() ? 0.6 : 1
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
  composerBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingTop: 8
  },
  composerHint: {
    fontSize: 13,
    color: "rgba(232,238,247,0.60)"
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

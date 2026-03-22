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
  node_runtime?: {
    session_id?: string;
    session_state?: string;
    continuity_reference?: string;
    continuity_status?: string;
    node?: string;
  };
};

const STORAGE_KEY = "hbce-joker-c2-interface-v1";
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

  if (text.includes("[Node Runtime]")) {
    return text.split("[Node Runtime]")[0].trim();
  }

  return text.trim();
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
    localStorage.removeItem(STORAGE_KEY);
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

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: cleanAssistantResponse(data.response || "")
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("Ready");
      setSessionState(data.node_runtime?.session_state || "-");
      setContinuityReference(
        data.node_runtime?.continuity_reference || `${sessionId}-AUDIT`
      );
      setContinuityStatus(data.node_runtime?.continuity_status || "-");
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
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.chatPane}>
          <header style={styles.chatHeader}>
            <div>
              <div style={styles.kicker}>HBCE Research</div>
              <h1 style={styles.title}>AI JOKER-C2 Interface</h1>
              <p style={styles.subtitle}>
                Interfaccia operativa collegata al nodo Torino del sistema HBCE.
              </p>
            </div>

            <button onClick={clearConversation} style={styles.secondaryButton}>
              Clear conversation
            </button>
          </header>

          <div style={styles.statusBar}>
            <span style={styles.statusDot} />
            <span>{sending ? "Sending..." : status}</span>
          </div>

          <div style={styles.messages}>
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
                    ...styles.bubble,
                    ...(message.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble)
                  }}
                >
                  <div style={styles.roleLabel}>
                    {message.role === "user" ? "You" : "AI JOKER-C2"}
                  </div>
                  <div style={styles.messageText}>{message.content}</div>
                </article>
              </div>
            ))}

            {sending && (
              <div style={styles.messageRow}>
                <article style={{ ...styles.bubble, ...styles.assistantBubble }}>
                  <div style={styles.roleLabel}>AI JOKER-C2</div>
                  <div style={styles.messageText}>Elaborazione in corso...</div>
                </article>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          <div style={styles.composer}>
            <textarea
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
              <div style={styles.hint}>
                Enter invia. Shift + Enter va a capo.
              </div>

              <button
                onClick={() => void sendMessage()}
                disabled={sending || !input.trim()}
                style={{
                  ...styles.primaryButton,
                  opacity: sending || !input.trim() ? 0.6 : 1
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </section>

        <aside style={styles.sidebar}>
          <section style={styles.card}>
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
                <div style={styles.metaLabel}>Continuity Reference</div>
                <div style={styles.metaValue}>{continuityReference}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Session State</div>
                <div style={styles.metaValue}>{sessionState}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Continuity Status</div>
                <div style={styles.metaValue}>{continuityStatus}</div>
              </div>

              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Conversation Turns</div>
                <div style={styles.metaValue}>{String(turns)}</div>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardTitle}>Runtime Model</div>
            <div style={styles.infoText}>
              request → session → continuity → response → audit
            </div>
          </section>
        </aside>
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
    padding: 24,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  shell: {
    maxWidth: 1440,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) 340px",
    gap: 24
  },
  chatPane: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gap: 16,
    minHeight: "calc(100vh - 48px)"
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap"
  },
  kicker: {
    fontSize: 11,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#7dd3fc",
    marginBottom: 10
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 0,
    color: "rgba(232,238,247,0.72)",
    fontSize: 14
  },
  statusBar: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 14,
    width: "fit-content"
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22d3ee",
    boxShadow: "0 0 10px rgba(34,211,238,0.8)"
  },
  messages: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.22)",
    borderRadius: 20,
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 420,
    maxHeight: "58vh"
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.08)"
  },
  userBubble: {
    background: "rgba(34,211,238,0.12)"
  },
  assistantBubble: {
    background: "rgba(255,255,255,0.05)"
  },
  roleLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "rgba(232,238,247,0.50)",
    marginBottom: 8
  },
  messageText: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: 14,
    color: "#edf4ff"
  },
  composer: {
    display: "grid",
    gap: 12
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
    color: "#eef6ff",
    padding: 14,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    fontSize: 14
  },
  composerBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  hint: {
    fontSize: 13,
    color: "rgba(232,238,247,0.60)"
  },
  primaryButton: {
    border: "none",
    background: "#22d3ee",
    color: "#071018",
    borderRadius: 16,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#eef6ff",
    borderRadius: 16,
    padding: "10px 14px",
    cursor: "pointer"
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  card: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 14,
    color: "#e8eef7"
  },
  metaGrid: {
    display: "grid",
    gap: 12
  },
  metaItem: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.22)",
    borderRadius: 18,
    padding: 14
  },
  metaLabel: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(232,238,247,0.45)",
    marginBottom: 8
  },
  metaValue: {
    color: "#edf4ff",
    lineHeight: 1.6,
    wordBreak: "break-word",
    fontSize: 14
  },
  infoText: {
    color: "#edf4ff",
    lineHeight: 1.7,
    fontSize: 14
  }
};

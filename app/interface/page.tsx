"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

type ApiResponse = {
  ok?: boolean;
  reply?: string | { content?: string };
  mode?: string;
  request_id?: string;
  matrix?: {
    request_id?: string;
    mode?: string;
    execution?: {
      matrix_node?: {
        node_id?: string;
      };
      verification_reference?: string;
    };
    reply?: {
      content?: string;
    };
  };
  error?: string;
};

const STORAGE_KEY = "joker-c2-conversation";
const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_IDENTITY = "IPR-AI-0001";

export default function InterfacePage() {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Ready");
  const [sending, setSending] = useState(false);

  const [mode, setMode] = useState("analysis");
  const [actorIdentity, setActorIdentity] = useState(DEFAULT_IDENTITY);
  const [nodeId, setNodeId] = useState(DEFAULT_NODE);

  const [requestId, setRequestId] = useState("-");
  const [metaMode, setMetaMode] = useState("-");
  const [metaNode, setMetaNode] = useState(DEFAULT_NODE);
  const [verification, setVerification] = useState("-");

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const safe = parsed.filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim().length > 0
        );
        setConversation(safe);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  }, [conversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const turns = useMemo(() => conversation.length, [conversation]);

  function addMessage(role: Role, content: string) {
    setConversation((prev) => [...prev, { role, content }]);
  }

  function clearChat() {
    setConversation([]);
    localStorage.removeItem(STORAGE_KEY);
    setStatus("Ready");
    setRequestId("-");
    setMetaMode("-");
    setMetaNode(DEFAULT_NODE);
    setVerification("-");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || sending) return;

    addMessage("user", message);
    setInput("");
    setSending(true);
    setStatus("Sending...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          mode,
          actor_identity: actorIdentity,
          entity: "AI_JOKER-C2",
          nodeId,
          conversation
        })
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.ok) {
        addMessage("assistant", data.error || "Execution error.");
        setStatus("Error");
        return;
      }

      const reply =
        typeof data.reply === "string"
          ? data.reply
          : data.reply?.content ||
            data.matrix?.reply?.content ||
            "Joker-C2 completed the request.";

      addMessage("assistant", reply);

      setRequestId(data.request_id || data.matrix?.request_id || "-");
      setMetaMode(data.mode || data.matrix?.mode || "-");
      setMetaNode(data.matrix?.execution?.matrix_node?.node_id || nodeId);
      setVerification(
        data.matrix?.execution?.verification_reference || "-"
      );

      setStatus("Completed");
    } catch {
      addMessage("assistant", "Execution failed. API not reachable.");
      setStatus("Offline");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="hbce-page">
      <div className="hbce-wrap" style={styles.layout}>
        <section style={styles.mainColumn}>
          <header className="hbce-card" style={styles.header}>
            <div>
              <div className="hbce-kicker" style={styles.kickerSpacing}>
                HBCE Research
              </div>

              <h1 style={styles.title}>AI JOKER-C2 Interface</h1>

              <p className="hbce-muted" style={styles.subtitle}>
                Conversational shell connected to the Torino Matrix node.
              </p>
            </div>

            <div style={styles.headerActions}>
              <button
                type="button"
                className="hbce-button-secondary"
                onClick={clearChat}
              >
                Clear conversation
              </button>

              <div style={styles.status}>
                <span style={styles.dot} />
                <span>{status}</span>
              </div>
            </div>
          </header>

          <section className="hbce-card" style={styles.chatShell}>
            <div style={styles.chatTop}>
              <h2 style={styles.chatTitle}>Operational Chat</h2>
              <p className="hbce-muted" style={styles.chatSubtitle}>
                Direct interaction first. Metadata remains available in the side
                panel.
              </p>
            </div>

            <div style={styles.messages}>
              {conversation.length === 0 ? (
                <div className="hbce-muted" style={styles.welcome}>
                  Joker-C2 ready. Default node: Torino.
                </div>
              ) : (
                conversation.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    style={{
                      ...styles.messageRow,
                      justifyContent:
                        item.role === "user" ? "flex-end" : "flex-start"
                    }}
                  >
                    <div
                      style={{
                        ...styles.bubble,
                        ...(item.role === "user"
                          ? styles.userBubble
                          : styles.assistantBubble)
                      }}
                    >
                      <div className="hbce-kicker" style={styles.role}>
                        {item.role === "user" ? "You" : "AI JOKER-C2"}
                      </div>
                      <div style={styles.messageText}>{item.content}</div>
                    </div>
                  </div>
                ))
              )}

              <div ref={endRef} />
            </div>
          </section>

          <form className="hbce-card" style={styles.composer} onSubmit={onSubmit}>
            <textarea
              className="hbce-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send request to Joker-C2..."
              style={styles.textarea}
            />

            <div style={styles.composerBottom}>
              <details style={styles.details}>
                <summary className="hbce-muted" style={styles.summary}>
                  Advanced execution settings
                </summary>

                <div style={styles.advancedGrid}>
                  <select
                    className="hbce-select"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="analysis">analysis</option>
                    <option value="verification">verification</option>
                  </select>

                  <input
                    className="hbce-input"
                    value={actorIdentity}
                    onChange={(e) => setActorIdentity(e.target.value)}
                    placeholder="Actor identity"
                  />

                  <input
                    className="hbce-input"
                    value={nodeId}
                    onChange={(e) => setNodeId(e.target.value)}
                    placeholder="Node ID"
                  />
                </div>
              </details>

              <button
                type="submit"
                className="hbce-button-primary"
                disabled={sending}
                style={styles.sendButton}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </section>

        <aside style={styles.sidebar}>
          <section className="hbce-card" style={styles.sideCard}>
            <div className="hbce-kicker" style={styles.sideLabel}>
              Execution Context
            </div>

            <div style={styles.metaList}>
              <div style={styles.metaItem}>
                <div className="hbce-kicker">Default Node</div>
                <div style={styles.metaValue}>{DEFAULT_NODE}</div>
              </div>

              <div style={styles.metaItem}>
                <div className="hbce-kicker">Identity Layer</div>
                <div style={styles.metaValue}>{DEFAULT_IDENTITY}</div>
              </div>

              <div style={styles.metaItem}>
                <div className="hbce-kicker">Execution Model</div>
                <div style={styles.metaValue}>
                  request → identity → evidence → verification
                </div>
              </div>
            </div>
          </section>

          <section className="hbce-card" style={styles.sideCard}>
            <div className="hbce-kicker" style={styles.sideLabel}>
              Live Execution Metadata
            </div>

            <div style={styles.metaList}>
              <div style={styles.metaItem}>
                <div className="hbce-kicker">Request ID</div>
                <div style={styles.metaValue}>{requestId}</div>
              </div>

              <div style={styles.metaItem}>
                <div className="hbce-kicker">Mode</div>
                <div style={styles.metaValue}>{metaMode}</div>
              </div>

              <div style={styles.metaItem}>
                <div className="hbce-kicker">Node</div>
                <div style={styles.metaValue}>{metaNode}</div>
              </div>

              <div style={styles.metaItem}>
                <div className="hbce-kicker">Verification</div>
                <div style={styles.metaValue}>{verification}</div>
              </div>

              <div style={styles.metaItem}>
                <div className="hbce-kicker">Conversation Turns</div>
                <div style={styles.metaValue}>{turns}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) 340px",
    gap: 20
  },
  mainColumn: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: 16,
    minWidth: 0
  },
  header: {
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap"
  },
  kickerSpacing: {
    marginBottom: 8
  },
  title: {
    margin: "0 0 6px",
    fontSize: 24
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6
  },
  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap"
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,.02)",
    color: "var(--muted)",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--accent)",
    boxShadow: "0 0 12px rgba(125,211,252,.7)"
  },
  chatShell: {
    minHeight: "62vh",
    display: "grid",
    gridTemplateRows: "auto 1fr"
  },
  chatTop: {
    padding: "18px 20px",
    borderBottom: "1px solid var(--line-2)"
  },
  chatTitle: {
    margin: "0 0 6px",
    fontSize: 22
  },
  chatSubtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6
  },
  messages: {
    padding: 20,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minHeight: 0
  },
  welcome: {
    fontSize: 14,
    lineHeight: 1.6
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  bubble: {
    maxWidth: "86%",
    padding: "14px 16px",
    borderRadius: 22
  },
  userBubble: {
    background:
      "linear-gradient(180deg, rgba(56,189,248,.18), rgba(56,189,248,.11))",
    border: "1px solid rgba(56,189,248,.30)"
  },
  assistantBubble: {
    background: "rgba(255,255,255,.03)",
    border: "1px solid var(--line)"
  },
  role: {
    marginBottom: 8,
    letterSpacing: "0.08em"
  },
  messageText: {
    lineHeight: 1.7,
    fontSize: 15,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  composer: {
    padding: 14,
    display: "grid",
    gap: 12
  },
  textarea: {
    minHeight: 110
  },
  composerBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    flexWrap: "wrap"
  },
  details: {
    flex: 1
  },
  summary: {
    cursor: "pointer",
    fontSize: 13
  },
  advancedGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12
  },
  sendButton: {
    minWidth: 160
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0
  },
  sideCard: {
    padding: 18
  },
  sideLabel: {
    marginBottom: 12
  },
  metaList: {
    display: "grid",
    gap: 10
  },
  metaItem: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,.02)",
    border: "1px solid rgba(255,255,255,.06)"
  },
  metaValue: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.5,
    color: "var(--text)",
    wordBreak: "break-word"
  }
};

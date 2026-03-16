"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChatItem = {
  role: "user" | "assistant" | "system";
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
  [key: string]: unknown;
};

const STORAGE_KEY = "joker-c2-next-conversation-v1";
const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_IDENTITY = "IPR-AI-0001";

export default function InterfacePage() {
  const [conversation, setConversation] = useState<ChatItem[]>([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("analysis");
  const [actorIdentity, setActorIdentity] = useState(DEFAULT_IDENTITY);
  const [nodeId, setNodeId] = useState(DEFAULT_NODE);
  const [status, setStatus] = useState("Ready");
  const [isSending, setIsSending] = useState(false);
  const [rawResponse, setRawResponse] = useState("No response yet.");
  const [requestId, setRequestId] = useState("Not executed yet");
  const [metaMode, setMetaMode] = useState("-");
  const [metaNode, setMetaNode] = useState(DEFAULT_NODE);
  const [verificationReference, setVerificationReference] = useState("-");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const safeConversation = parsed.filter((item) => {
        return (
          item &&
          (item.role === "user" ||
            item.role === "assistant" ||
            item.role === "system") &&
          typeof item.content === "string" &&
          item.content.trim().length > 0
        );
      });

      setConversation(safeConversation);
    } catch {
      setConversation([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const turns = useMemo(() => {
    return conversation.filter(
      (item) => item.role === "user" || item.role === "assistant"
    ).length;
  }, [conversation]);

  function pushMessage(role: ChatItem["role"], content: string) {
    setConversation((prev) => [...prev, { role, content }]);
  }

  function clearConversation() {
    setConversation([]);
    window.localStorage.removeItem(STORAGE_KEY);
    setStatus("Ready");
    setRawResponse("No response yet.");
    setRequestId("Not executed yet");
    setMetaMode("-");
    setMetaNode(DEFAULT_NODE);
    setVerificationReference("-");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    pushMessage("user", trimmed);
    setMessage("");
    setStatus("Sending...");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          mode,
          actor_identity: actorIdentity,
          entity: "AI_JOKER-C2",
          nodeId,
          conversation
        })
      });

      const data: ApiResponse = await response.json();
      setRawResponse(JSON.stringify(data, null, 2));

      if (!response.ok || !data.ok) {
        const errorText = `Request failed: ${data.error || "Unknown error"}`;
        pushMessage("assistant", errorText);
        setStatus("Error");
        return;
      }

      const replyText =
        typeof data.reply === "string"
          ? data.reply
          : data.reply?.content ||
            data.matrix?.reply?.content ||
            "Joker-C2 completed the request.";

      pushMessage("assistant", replyText);

      setRequestId(data.request_id || data.matrix?.request_id || "-");
      setMetaMode(data.mode || data.matrix?.mode || mode || "-");
      setMetaNode(data.matrix?.execution?.matrix_node?.node_id || nodeId || "-");
      setVerificationReference(
        data.matrix?.execution?.verification_reference || "-"
      );
      setStatus("Completed");
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : "Unknown client error";

      pushMessage(
        "assistant",
        `Request failed before Joker-C2 execution. ${errorText}`
      );
      setRawResponse(String(errorText));
      setStatus("Offline / Missing API");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.app}>
        <section style={styles.mainColumn}>
          <header style={styles.topbar}>
            <div>
              <div style={styles.kicker}>HBCE Research</div>
              <h1 style={styles.title}>AI JOKER-C2 Interface</h1>
              <p style={styles.subtitle}>
                Conversational shell connected to the Torino Matrix node.
              </p>
            </div>

            <div style={styles.topbarActions}>
              <a href="/index.html" style={styles.ghostLink}>
                Back to portal
              </a>
              <button
                type="button"
                onClick={clearConversation}
                style={styles.ghostButton}
              >
                Clear conversation
              </button>
              <div style={styles.status}>
                <span style={styles.dot} />
                <span>{status}</span>
              </div>
            </div>
          </header>

          <section style={styles.chatCard}>
            <div style={styles.chatHeader}>
              <h2 style={styles.chatTitle}>Operational Chat</h2>
              <p style={styles.chatSubtitle}>
                Direct conversation first. Technical telemetry stays in the side
                panel.
              </p>
            </div>

            <div style={styles.messages}>
              {conversation.length === 0 ? (
                <div style={styles.welcome}>
                  Joker-C2 interface initialized. Default Matrix Europa node:
                  Torino.
                </div>
              ) : (
                conversation.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    style={{
                      ...styles.row,
                      justifyContent:
                        item.role === "user" ? "flex-end" : "flex-start"
                    }}
                  >
                    <div
                      style={{
                        ...styles.bubble,
                        ...(item.role === "user"
                          ? styles.userBubble
                          : item.role === "assistant"
                            ? styles.assistantBubble
                            : styles.systemBubble)
                      }}
                    >
                      <div style={styles.roleTag}>
                        {item.role === "user"
                          ? "You"
                          : item.role === "assistant"
                            ? "AI JOKER-C2"
                            : "System"}
                      </div>
                      <div>{item.content}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </section>

          <form onSubmit={handleSubmit} style={styles.composer}>
            <div style={styles.composerRow}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Send a request to Joker-C2..."
                style={styles.textarea}
              />
              <button type="submit" disabled={isSending} style={styles.sendButton}>
                {isSending ? "Sending..." : "Send to Joker-C2"}
              </button>
            </div>

            <details style={styles.details}>
              <summary style={styles.summary}>Advanced execution settings</summary>
              <div style={styles.advancedGrid}>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  style={styles.field}
                >
                  <option value="analysis">analysis</option>
                  <option value="verification">verification</option>
                </select>

                <input
                  value={actorIdentity}
                  onChange={(event) => setActorIdentity(event.target.value)}
                  placeholder="Actor identity"
                  style={styles.field}
                />

                <input
                  value={nodeId}
                  onChange={(event) => setNodeId(event.target.value)}
                  placeholder="Node ID"
                  style={styles.field}
                />
              </div>
            </details>
          </form>
        </section>

        <aside style={styles.sidebar}>
          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Execution Context</h3>
            <div style={styles.stack}>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Default node</div>
                <div style={styles.kvVal}>{DEFAULT_NODE}</div>
              </div>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Identity layer</div>
                <div style={styles.kvVal}>{DEFAULT_IDENTITY}</div>
              </div>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Execution model</div>
                <div style={styles.kvVal}>
                  request → identity → evidence → verification
                </div>
              </div>
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Live Execution Metadata</h3>
            <div style={styles.stack}>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Request ID</div>
                <div style={styles.kvVal}>{requestId}</div>
              </div>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Mode</div>
                <div style={styles.kvVal}>{metaMode}</div>
              </div>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Node</div>
                <div style={styles.kvVal}>{metaNode}</div>
              </div>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Verification Reference</div>
                <div style={styles.kvVal}>{verificationReference}</div>
              </div>
              <div style={styles.kvItem}>
                <div style={styles.kvKey}>Conversation Turns</div>
                <div style={styles.kvVal}>{String(turns)}</div>
              </div>
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Last Raw Response</h3>
            <pre style={styles.pre}>{rawResponse}</pre>
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
      "radial-gradient(circle at top left, rgba(56,189,248,.10), transparent 30%), radial-gradient(circle at bottom right, rgba(125,211,252,.08), transparent 30%), #0b0f14",
    color: "#e8eef7",
    fontFamily:
      "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif"
  },
  app: {
    width: "min(100%, 1400px)",
    margin: "0 auto",
    padding: 20,
    display: "grid",
    gridTemplateColumns: "minmax(0,1.65fr) 340px",
    gap: 20
  },
  mainColumn: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: 16,
    minWidth: 0
  },
  topbar: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap"
  },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8fa3b8"
  },
  title: {
    margin: "4px 0 6px",
    fontSize: 24
  },
  subtitle: {
    margin: 0,
    color: "#8fa3b8",
    fontSize: 14,
    lineHeight: 1.6
  },
  topbarActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap"
  },
  ghostLink: {
    textDecoration: "none",
    color: "#e8eef7",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 999,
    padding: "9px 13px",
    background: "rgba(255,255,255,.02)"
  },
  ghostButton: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 999,
    padding: "9px 13px",
    background: "rgba(255,255,255,.02)",
    color: "#e8eef7",
    cursor: "pointer"
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.02)",
    color: "#8fa3b8",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#7dd3fc",
    boxShadow: "0 0 12px rgba(125,211,252,.7)"
  },
  chatCard: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    minHeight: "65vh",
    display: "grid",
    gridTemplateRows: "auto 1fr"
  },
  chatHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,.05)"
  },
  chatTitle: {
    margin: "0 0 6px",
    fontSize: 22
  },
  chatSubtitle: {
    margin: 0,
    color: "#8fa3b8",
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
    border: "1px dashed rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.02)",
    color: "#8fa3b8",
    borderRadius: 18,
    padding: "16px 18px",
    lineHeight: 1.6,
    fontSize: 14
  },
  row: {
    display: "flex",
    width: "100%"
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: 22,
    padding: "14px 16px",
    lineHeight: 1.7,
    fontSize: 15,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  userBubble: {
    background:
      "linear-gradient(180deg, rgba(56,189,248,.18), rgba(56,189,248,.11))",
    border: "1px solid rgba(56,189,248,.30)"
  },
  assistantBubble: {
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.08)"
  },
  systemBubble: {
    background: "rgba(255,255,255,.02)",
    border: "1px dashed rgba(255,255,255,.08)",
    color: "#8fa3b8"
  },
  roleTag: {
    display: "block",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "#8fa3b8"
  },
  composer: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: 14
  },
  composerRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "end"
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.02)",
    color: "#e8eef7",
    padding: 14,
    resize: "vertical"
  },
  sendButton: {
    border: "none",
    borderRadius: 16,
    padding: "14px 18px",
    minWidth: 180,
    fontWeight: 700,
    cursor: "pointer",
    background: "linear-gradient(180deg, #7dd3fc, #38bdf8)",
    color: "#06121a"
  },
  details: {
    marginTop: 12
  },
  summary: {
    cursor: "pointer",
    color: "#8fa3b8",
    fontSize: 13
  },
  advancedGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12
  },
  field: {
    width: "100%",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    background: "rgba(255,255,255,.02)",
    color: "#e8eef7",
    padding: "12px 14px"
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0
  },
  sideCard: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: 18
  },
  sideTitle: {
    margin: "0 0 12px",
    fontSize: 16
  },
  stack: {
    display: "grid",
    gap: 10
  },
  kvItem: {
    padding: "12px 14px",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    background: "rgba(255,255,255,.02)"
  },
  kvKey: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#8fa3b8",
    marginBottom: 6
  },
  kvVal: {
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word"
  },
  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 12,
    lineHeight: 1.55,
    color: "#cfe8ff"
  }
};

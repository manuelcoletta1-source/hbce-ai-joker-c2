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

  /* ---------------- persistence ---------------- */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setConversation(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  }, [conversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const turns = useMemo(() => {
    return conversation.length;
  }, [conversation]);

  /* ---------------- chat logic ---------------- */

  function add(role: Role, content: string) {
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

  async function send(e: React.FormEvent) {
    e.preventDefault();

    const msg = input.trim();
    if (!msg || sending) return;

    add("user", msg);
    setInput("");
    setSending(true);
    setStatus("Sending...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msg,
          mode,
          actor_identity: actorIdentity,
          entity: "AI_JOKER-C2",
          nodeId,
          conversation
        })
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        add("assistant", data.error || "Execution error.");
        setStatus("Error");
        return;
      }

      const reply =
        typeof data.reply === "string"
          ? data.reply
          : data.reply?.content ||
            data.matrix?.reply?.content ||
            "Joker-C2 completed the request.";

      add("assistant", reply);

      setRequestId(data.request_id || data.matrix?.request_id || "-");
      setMetaMode(data.mode || data.matrix?.mode || "-");
      setMetaNode(data.matrix?.execution?.matrix_node?.node_id || nodeId);
      setVerification(
        data.matrix?.execution?.verification_reference || "-"
      );

      setStatus("Completed");
    } catch {
      add("assistant", "Execution failed. API not reachable.");
      setStatus("Offline");
    } finally {
      setSending(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <main style={styles.page}>
      <div style={styles.layout}>
        <section style={styles.chatArea}>
          <header style={styles.header}>
            <div>
              <div style={styles.kicker}>HBCE Research</div>
              <h1 style={styles.title}>AI JOKER-C2</h1>
              <p style={styles.subtitle}>
                Conversational interface connected to the Torino Matrix node.
              </p>
            </div>

            <div style={styles.headerActions}>
              <button onClick={clearChat} style={styles.ghostBtn}>
                Clear
              </button>

              <div style={styles.status}>
                <span style={styles.dot} />
                {status}
              </div>
            </div>
          </header>

          <div style={styles.messages}>
            {conversation.length === 0 ? (
              <div style={styles.welcome}>
                Joker-C2 ready. Default node: Torino.
              </div>
            ) : (
              conversation.map((m, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.row,
                    justifyContent:
                      m.role === "user" ? "flex-end" : "flex-start"
                  }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      ...(m.role === "user"
                        ? styles.user
                        : styles.assistant)
                    }}
                  >
                    <div style={styles.role}>
                      {m.role === "user" ? "You" : "AI JOKER-C2"}
                    </div>
                    {m.content}
                  </div>
                </div>
              ))
            )}

            <div ref={endRef} />
          </div>

          <form onSubmit={send} style={styles.composer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send request to Joker-C2..."
              style={styles.textarea}
            />

            <button disabled={sending} style={styles.send}>
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </section>

        <aside style={styles.sidebar}>
          <h3 style={styles.sideTitle}>Execution Context</h3>

          <div style={styles.meta}>
            <div>
              <b>Node</b>
              <div>{metaNode}</div>
            </div>

            <div>
              <b>Mode</b>
              <div>{metaMode}</div>
            </div>

            <div>
              <b>Request ID</b>
              <div>{requestId}</div>
            </div>

            <div>
              <b>Verification</b>
              <div>{verification}</div>
            </div>

            <div>
              <b>Conversation Turns</b>
              <div>{turns}</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b0f14",
    color: "#e8eef7",
    fontFamily: "system-ui"
  },

  layout: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 20,
    padding: 20
  },

  chatArea: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  kicker: {
    fontSize: 12,
    color: "#8fa3b8"
  },

  title: {
    margin: 0
  },

  subtitle: {
    margin: 0,
    color: "#8fa3b8"
  },

  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center"
  },

  ghostBtn: {
    padding: "6px 12px"
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },

  dot: {
    width: 8,
    height: 8,
    background: "#7dd3fc",
    borderRadius: 4
  },

  messages: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  welcome: {
    color: "#8fa3b8"
  },

  row: {
    display: "flex"
  },

  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 14
  },

  user: {
    background: "#38bdf8"
  },

  assistant: {
    background: "#1f2933"
  },

  role: {
    fontSize: 11,
    marginBottom: 4
  },

  composer: {
    display: "flex",
    gap: 10
  },

  textarea: {
    flex: 1,
    minHeight: 60
  },

  send: {
    padding: "10px 16px"
  },

  sidebar: {
    borderLeft: "1px solid rgba(255,255,255,0.1)",
    paddingLeft: 20
  },

  sideTitle: {
    marginTop: 0
  },

  meta: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  }
};

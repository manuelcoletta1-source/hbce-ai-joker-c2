"use client";

import { useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  ok: boolean;
  request_id?: string;
  reply?: {
    role: "assistant";
    content: string;
  };
  matrix?: {
    verification_reference?: string;
    mode?: string;
    execution?: {
      verification_reference?: string;
    };
  };
  error?: string;
};

export default function JokerInterfacePage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Joker-C2 interface initialized. Default Matrix Europa node: Torino."
    }
  ]);
  const [requestId, setRequestId] = useState("-");
  const [mode, setMode] = useState("analysis");
  const [node] = useState("HBCE-MATRIX-NODE-0001-TORINO");
  const [verificationReference, setVerificationReference] = useState("-");
  const [rawResponse, setRawResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => {
    return message.trim().length > 0 && !loading;
  }, [message, loading]);

  async function sendRequest() {
    const trimmed = message.trim();

    if (!trimmed || loading) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmed
      }
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          mode,
          nodeId: node
        })
      });

      const data = (await response.json()) as ApiResponse;

      setRawResponse(JSON.stringify(data, null, 2));
      setRequestId(data.request_id || "-");

      const derivedVerificationReference =
        data?.matrix?.execution?.verification_reference ||
        data?.matrix?.verification_reference ||
        "-";

      setVerificationReference(derivedVerificationReference);

      if (data.ok && data.reply?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply?.content || "Joker-C2 returned no response."
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "Joker-C2 returned an unknown error."
          }
        ]);
      }
    } catch (error) {
      console.error(error);

      const fallback = {
        ok: false,
        error: "Network or runtime error while contacting /api/chat."
      };

      setRawResponse(JSON.stringify(fallback, null, 2));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network or runtime error while contacting /api/chat."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendRequest();
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "#e8eef7",
        fontFamily:
          "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif",
        padding: "32px"
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#8fa3b8" }}>
              HBCE Research
            </div>
            <h1 style={{ margin: "6px 0 8px 0" }}>AI JOKER-C2 Interface</h1>
            <div style={{ color: "#8fa3b8" }}>
              Identity-Bound Operational AI Application · Torino Matrix Node
              Enabled
            </div>
          </div>

          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e8eef7",
              textDecoration: "none",
              background: "rgba(255,255,255,0.03)"
            }}
          >
            Back to portal
          </a>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            background: "rgba(17,24,33,0.9)",
            padding: "24px",
            marginBottom: "24px"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
            Joker-C2 console linked to the Torino experimental node.
          </h2>

          <p style={{ lineHeight: 1.7, color: "#8fa3b8", marginBottom: "20px" }}>
            This interface routes user prompts to the Joker-C2 application
            layer through the internal chat API, binds execution to the Matrix
            Europa territorial context, and returns a node-aware operational
            response.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px"
            }}
          >
            <InfoCard label="Default node" value="HBCE-MATRIX-NODE-0001-TORINO" />
            <InfoCard label="Identity layer" value="IPR-AI-0001" />
            <InfoCard
              label="Execution model"
              value="request → identity → evidence → verification"
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 0.9fr",
            gap: "24px"
          }}
        >
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              background: "rgba(17,24,33,0.9)",
              padding: "24px"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Operational Chat</h2>
            <p style={{ color: "#8fa3b8", marginBottom: "16px" }}>
              Send a request to Joker-C2 through the internal API route.
            </p>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.02)",
                padding: "16px",
                minHeight: "360px",
                maxHeight: "520px",
                overflowY: "auto",
                marginBottom: "16px"
              }}
            >
              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "14px",
                    alignItems: "flex-start"
                  }}
                >
                  <div
                    style={{
                      minWidth: "46px",
                      height: "46px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      background:
                        item.role === "user"
                          ? "rgba(125,211,252,0.18)"
                          : "rgba(255,255,255,0.06)",
                      color:
                        item.role === "user" ? "#7dd3fc" : "#e8eef7",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    {item.role === "user" ? "YOU" : "AI"}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      padding: "14px"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#8fa3b8",
                        marginBottom: "8px",
                        fontWeight: 600
                      }}
                    >
                      {item.role === "user" ? "User" : "Joker-C2"}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                      {item.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "12px",
                flexWrap: "wrap"
              }}
            >
              <ModeButton
                label="analysis"
                active={mode === "analysis"}
                onClick={() => setMode("analysis")}
              />
              <ModeButton
                label="verification"
                active={mode === "verification"}
                onClick={() => setMode("verification")}
              />
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send to Joker-C2"
              style={{
                width: "100%",
                minHeight: "120px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: "#e8eef7",
                padding: "16px",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                fontSize: "15px",
                marginBottom: "16px"
              }}
            />

            <button
              onClick={() => void sendRequest()}
              disabled={!canSend}
              style={{
                display: "inline-block",
                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",
                background: canSend ? "#7dd3fc" : "#5f7280",
                color: "#06121a",
                fontWeight: 700,
                cursor: canSend ? "pointer" : "not-allowed"
              }}
            >
              {loading ? "Processing..." : "Send to Joker-C2"}
            </button>
          </section>

          <aside
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              background: "rgba(17,24,33,0.9)",
              padding: "24px"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Live Execution Metadata</h2>

            <MetaRow label="Request ID" value={requestId} />
            <MetaRow label="Mode" value={mode} />
            <MetaRow label="Node" value={node} />
            <MetaRow
              label="Verification Reference"
              value={verificationReference}
            />

            <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>
              Last Raw Response
            </h3>

            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "12px",
                lineHeight: 1.55,
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: "14px",
                color: "#8fa3b8",
                minHeight: "220px"
              }}
            >
              {rawResponse || "No response yet."}
            </pre>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)"
      }}
    >
      <div style={{ fontSize: "12px", color: "#8fa3b8", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "12px", color: "#8fa3b8", marginBottom: "4px" }}>
        {label}
      </div>
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          wordBreak: "break-word"
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: active ? "#7dd3fc" : "rgba(255,255,255,0.03)",
        color: active ? "#06121a" : "#e8eef7",
        fontWeight: 700,
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );
}

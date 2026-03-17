"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

type PreparedAttachment = {
  name: string;
  type: string;
  content: string;
};

type SourceItem = {
  title: string;
  url?: string;
};

type ApiResponse = {
  ok: boolean;
  joker?: string;
  response?: string;
  error?: string;
  sources?: SourceItem[];
  meta?: {
    model?: string;
    ts?: string;
    node?: string;
    identity?: string;
    research?: boolean;
    memory?: {
      history_turns_used: number;
      history_turns_max: number;
    };
    attachments?: {
      total: number;
      text: number;
      images: number;
      unsupported: number;
    };
  };
};

const MAX_TEXT_FILE_SIZE = 1024 * 1024 * 2;
const MAX_IMAGE_FILE_SIZE = 1024 * 1024 * 5;
const MEMORY_KEY = "hbce-joker-c2-memory-v1";
const MAX_HISTORY_TURNS = 6;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read file: ${file.name}`));

    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read image: ${file.name}`));

    reader.readAsDataURL(file);
  });
}

function isTextFile(file: File) {
  const lower = file.name.toLowerCase();

  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    file.type === "text/markdown" ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    lower.endsWith(".csv")
  );
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

async function prepareAttachment(file: File): Promise<PreparedAttachment | null> {
  if (isTextFile(file)) {
    if (file.size > MAX_TEXT_FILE_SIZE) {
      throw new Error(`Text file too large: ${file.name}`);
    }

    const content = await readFileAsText(file);

    return {
      name: file.name,
      type: file.type || "text/plain",
      content
    };
  }

  if (isImageFile(file)) {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      throw new Error(`Image file too large: ${file.name}`);
    }

    const content = await readFileAsDataUrl(file);

    return {
      name: file.name,
      type: file.type || "image/*",
      content
    };
  }

  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    content: "UNSUPPORTED_ATTACHMENT"
  };
}

function getDefaultMessages(): ChatMessage[] {
  return [
    {
      id: makeId(),
      role: "assistant",
      content: "JOKER-C2 online. Send a request, document, image, or research query."
    }
  ];
}

type PersistedState = {
  messages: ChatMessage[];
  status: string;
  requestId: string;
  mode: string;
  verification: string;
  turns: number;
  input: string;
  researchEnabled: boolean;
};

function loadMemory(): PersistedState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    if (!Array.isArray(parsed.messages)) return null;

    return {
      messages: parsed.messages.filter(
        (item): item is ChatMessage =>
          !!item &&
          typeof item.id === "string" &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
      ),
      status: typeof parsed.status === "string" ? parsed.status : "Ready",
      requestId: typeof parsed.requestId === "string" ? parsed.requestId : "-",
      mode: typeof parsed.mode === "string" ? parsed.mode : "-",
      verification: typeof parsed.verification === "string" ? parsed.verification : "-",
      turns: typeof parsed.turns === "number" ? parsed.turns : 1,
      input: typeof parsed.input === "string" ? parsed.input : "",
      researchEnabled: parsed.researchEnabled === true
    };
  } catch {
    return null;
  }
}

function saveMemory(state: PersistedState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEMORY_KEY, JSON.stringify(state));
}

function buildOperationalHistory(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-MAX_HISTORY_TURNS)
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
}

function formatSources(sources: SourceItem[]) {
  if (sources.length === 0) return "";

  return [
    "",
    "Sources:",
    ...sources.map((source, index) =>
      source.url
        ? `${index + 1}. ${source.title} — ${source.url}`
        : `${index + 1}. ${source.title}`
    )
  ].join("\n");
}

export default function InterfacePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(getDefaultMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [status, setStatus] = useState("Ready");
  const [requestId, setRequestId] = useState("-");
  const [mode, setMode] = useState("-");
  const [verification, setVerification] = useState("-");
  const [turns, setTurns] = useState(1);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [researchEnabled, setResearchEnabled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = loadMemory();

    if (stored) {
      setMessages(stored.messages.length > 0 ? stored.messages : getDefaultMessages());
      setStatus(stored.status);
      setRequestId(stored.requestId);
      setMode(stored.mode);
      setVerification(stored.verification);
      setTurns(stored.turns);
      setInput(stored.input);
      setResearchEnabled(stored.researchEnabled);
    }

    setMemoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!memoryLoaded) return;

    saveMemory({
      messages,
      status,
      requestId,
      mode,
      verification,
      turns,
      input,
      researchEnabled
    });
  }, [
    messages,
    status,
    requestId,
    mode,
    verification,
    turns,
    input,
    researchEnabled,
    memoryLoaded
  ]);

  const attachmentSummary = useMemo(() => {
    if (attachments.length === 0) return "No attachments";
    return attachments.map((file) => file.name).join(", ");
  }, [attachments]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function clearConversation() {
    const defaultMessages = getDefaultMessages();

    setMessages(defaultMessages);
    setInput("");
    setAttachments([]);
    setStatus("Ready");
    setRequestId("-");
    setMode("-");
    setVerification("-");
    setTurns(1);
    setResearchEnabled(false);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MEMORY_KEY);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    setAttachments(files);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSending) return;
    if (!input.trim() && attachments.length === 0) return;

    const trimmedInput = input.trim();

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: trimmedInput || "[attachments only]"
    };

    const history = buildOperationalHistory(messages);

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setStatus("Processing");
    setRequestId(makeId());
    setMode(
      researchEnabled
        ? attachments.length > 0
          ? "research+attachments"
          : "research"
        : attachments.length > 0
          ? "message+attachments"
          : "message"
    );
    setVerification("pending");

    try {
      const preparedAttachments = (
        await Promise.all(attachments.map((file) => prepareAttachment(file)))
      ).filter(Boolean) as PreparedAttachment[];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmedInput,
          attachments: preparedAttachments,
          history,
          research: researchEnabled
        })
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unknown chat error");
      }

      const sourceBlock = formatSources(data.sources || []);
      const assistantText = `${data.response || "No response received."}${sourceBlock}`;

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: assistantText
        }
      ]);

      setStatus("Ready");
      setVerification("ok");
      setTurns((prev) => prev + 2);
      setInput("");
      setAttachments([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected interface error";

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: `ERROR: ${message}`
        }
      ]);

      setStatus("Error");
      setVerification("failed");
      setTurns((prev) => prev + 2);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(0, 194, 255, 0.14), transparent 30%), linear-gradient(180deg, #071018 0%, #0b1220 100%)",
        color: "#e8eef7",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.7fr)",
          gap: "24px"
        }}
      >
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "18px"
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#7dd3fc",
                  marginBottom: "10px"
                }}
              >
                HBCE Research
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.1
                }}
              >
                AI JOKER-C2 Interface
              </h1>

              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  color: "rgba(232,238,247,0.72)",
                  fontSize: "14px"
                }}
              >
                Conversational shell connected to the Torino Matrix node.
              </p>
            </div>

            <button
              type="button"
              onClick={clearConversation}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#e8eef7",
                borderRadius: "16px",
                padding: "10px 14px",
                cursor: "pointer"
              }}
            >
              Clear conversation
            </button>
          </div>

          <div
            style={{
              marginBottom: "18px",
              background: "rgba(52, 211, 153, 0.12)",
              border: "1px solid rgba(52, 211, 153, 0.18)",
              color: "#bbf7d0",
              padding: "12px 14px",
              borderRadius: "16px",
              fontSize: "14px"
            }}
          >
            {status}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px"
              }}
            >
              Operational Chat
            </h2>
            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "rgba(232,238,247,0.62)",
                fontSize: "14px"
              }}
            >
              Direct interaction first. Metadata remains available in the side panel.
            </p>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.22)",
              borderRadius: "20px",
              padding: "14px",
              minHeight: "420px",
              maxHeight: "58vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px"
            }}
          >
            {messages.map((message) => (
              <article
                key={message.id}
                style={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  width: "84%",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    message.role === "user"
                      ? "rgba(34,211,238,0.12)"
                      : "rgba(255,255,255,0.05)",
                  borderRadius: "18px",
                  padding: "14px"
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "rgba(232,238,247,0.48)",
                    marginBottom: "8px"
                  }}
                >
                  {message.role === "user" ? "You" : "AI JOKER-C2"}
                </div>

                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.65,
                    fontSize: "14px",
                    color: "#edf4ff"
                  }}
                >
                  {message.content}
                </div>
              </article>
            ))}
          </div>

          <form onSubmit={onSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Write your request to Joker-C2..."
              style={{
                width: "100%",
                minHeight: "120px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.22)",
                color: "#eef6ff",
                padding: "14px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontSize: "14px"
              }}
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,image/*"
              onChange={onFilesSelected}
              style={{ display: "none" }}
            />

            <div
              style={{
                marginTop: "14px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.22)",
                padding: "14px",
                fontSize: "14px",
                color: "rgba(232,238,247,0.76)"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(232,238,247,0.45)",
                  marginBottom: "8px"
                }}
              >
                Attachments
              </div>
              <div>{attachmentSummary}</div>
            </div>

            <div
              style={{
                marginTop: "14px",
                borderRadius: "18px",
                border: "1px solid rgba(125,211,252,0.14)",
                background: "rgba(125,211,252,0.07)",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px"
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#7dd3fc",
                    marginBottom: "8px"
                  }}
                >
                  Research Mode
                </div>
                <div
                  style={{
                    color: "#edf4ff",
                    fontSize: "14px",
                    lineHeight: 1.6
                  }}
                >
                  Enable web acquisition and source-aware answers.
                </div>
              </div>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  color: "#edf4ff",
                  fontSize: "14px"
                }}
              >
                <input
                  type="checkbox"
                  checked={researchEnabled}
                  onChange={(event) => setResearchEnabled(event.target.checked)}
                />
                Research
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "14px"
              }}
            >
              <button
                type="button"
                onClick={openPicker}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#eef6ff",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  cursor: "pointer"
                }}
              >
                Insert document / photo
              </button>

              <button
                type="submit"
                disabled={isSending}
                style={{
                  border: "none",
                  background: isSending ? "rgba(34,211,238,0.5)" : "#22d3ee",
                  color: "#071018",
                  borderRadius: "16px",
                  padding: "12px 18px",
                  cursor: isSending ? "not-allowed" : "pointer",
                  fontWeight: 700
                }}
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </section>

        <aside
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "20px" }}>
            Execution Context
          </h2>

          <div style={{ display: "grid", gap: "14px" }}>
            {[
              ["Default Node", "HBCE-MATRIX-NODE-0001-TORINO"],
              ["Identity Layer", "IPR-AI-0001"],
              ["Execution Model", "request → identity → evidence → verification"]
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.22)",
                  borderRadius: "18px",
                  padding: "14px"
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(232,238,247,0.45)",
                    marginBottom: "8px"
                  }}
                >
                  {label}
                </div>
                <div style={{ color: "#edf4ff", lineHeight: 1.6 }}>{value}</div>
              </div>
            ))}

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
                borderRadius: "18px",
                padding: "14px"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(232,238,247,0.45)",
                  marginBottom: "12px"
                }}
              >
                Live Execution Metadata
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px"
                }}
              >
                {[
                  ["Request ID", requestId],
                  ["Mode", mode],
                  ["Node", "HBCE-MATRIX-NODE-0001-TORINO"],
                  ["Verification", verification],
                  ["Conversation Turns", String(turns)]
                ].map(([label, value]) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(232,238,247,0.45)",
                        marginBottom: "4px"
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: "#edf4ff",
                        wordBreak: "break-word"
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
                borderRadius: "18px",
                padding: "14px"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(232,238,247,0.45)",
                  marginBottom: "8px"
                }}
              >
                Advanced execution settings
              </div>
              <div style={{ color: "#edf4ff", lineHeight: 1.7 }}>analysis</div>
              <div style={{ color: "#edf4ff", lineHeight: 1.7 }}>verification</div>
            </div>

            <div
              style={{
                border: "1px solid rgba(125,211,252,0.14)",
                background: "rgba(125,211,252,0.07)",
                borderRadius: "18px",
                padding: "14px"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#7dd3fc",
                  marginBottom: "8px"
                }}
              >
                Memory Layer
              </div>
              <div style={{ color: "#edf4ff", lineHeight: 1.7 }}>
                Local browser memory active. Last 6 turns are sent to the route as
                operational context.
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(125,211,252,0.14)",
                background: "rgba(125,211,252,0.07)",
                borderRadius: "18px",
                padding: "14px"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#7dd3fc",
                  marginBottom: "8px"
                }}
              >
                Research Layer
              </div>
              <div style={{ color: "#edf4ff", lineHeight: 1.7 }}>
                Web research can be enabled to acquire current data and source-aware
                answers when needed.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

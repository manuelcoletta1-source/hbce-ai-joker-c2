"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

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

type ApiResponse = {
  ok: boolean;
  joker?: string;
  response?: string;
  error?: string;
  meta?: {
    model?: string;
    ts?: string;
    node?: string;
    identity?: string;
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

export default function InterfacePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: "assistant",
      content: "JOKER-C2 online. Send a request, document, or image."
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [status, setStatus] = useState("Ready");
  const [requestId, setRequestId] = useState("-");
  const [mode, setMode] = useState("-");
  const [verification, setVerification] = useState("-");
  const [turns, setTurns] = useState(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const attachmentSummary = useMemo(() => {
    if (attachments.length === 0) return "No attachments";

    return attachments.map((file) => file.name).join(", ");
  }, [attachments]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function clearConversation() {
    setMessages([
      {
        id: makeId(),
        role: "assistant",
        content: "JOKER-C2 online. Send a request, document, or image."
      }
    ]);
    setInput("");
    setAttachments([]);
    setStatus("Ready");
    setRequestId("-");
    setMode("-");
    setVerification("-");
    setTurns(1);
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    setAttachments(files);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSending) return;
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: input.trim() || "[attachments only]"
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setStatus("Processing");
    setRequestId(makeId());
    setMode(attachments.length > 0 ? "message+attachments" : "message");
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
          message: input.trim(),
          attachments: preparedAttachments
        })
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unknown chat error");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: data.response || "No response received."
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
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:grid lg:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                HBCE Research
              </div>
              <h1 className="mt-2 text-2xl font-semibold">AI JOKER-C2 Interface</h1>
              <p className="mt-2 text-sm text-white/70">
                Conversational shell connected to the Torino Matrix node.
              </p>
            </div>

            <button
              type="button"
              onClick={clearConversation}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Clear conversation
            </button>
          </div>

          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {status}
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-medium">Operational Chat</h2>
            <p className="mt-1 text-sm text-white/60">
              Direct interaction first. Metadata remains available in the side panel.
            </p>
          </div>

          <div className="mb-4 flex max-h-[55vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto w-[85%] border border-cyan-400/20 bg-cyan-400/10"
                    : "mr-auto w-[85%] border border-white/10 bg-white/5"
                }`}
              >
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">
                  {message.role === "user" ? "You" : "AI JOKER-C2"}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-6 text-white/90">
                  {message.content}
                </div>
              </article>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Write your request to Joker-C2..."
              className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,image/*"
              onChange={onFilesSelected}
              className="hidden"
            />

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Attachments
              </div>
              <div className="mt-2">{attachmentSummary}</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openPicker}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90 transition hover:bg-white/10"
              >
                Insert document / photo
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl">
          <h2 className="text-lg font-medium">Execution Context</h2>

          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Default Node
              </div>
              <div className="mt-2 text-white/90">HBCE-MATRIX-NODE-0001-TORINO</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Identity Layer
              </div>
              <div className="mt-2 text-white/90">IPR-AI-0001</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Execution Model
              </div>
              <div className="mt-2 text-white/90">
                request → identity → evidence → verification
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Live Execution Metadata
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-white/85">
                <div>
                  <div className="text-xs text-white/45">Request ID</div>
                  <div className="mt-1 break-all">{requestId}</div>
                </div>

                <div>
                  <div className="text-xs text-white/45">Mode</div>
                  <div className="mt-1">{mode}</div>
                </div>

                <div>
                  <div className="text-xs text-white/45">Node</div>
                  <div className="mt-1">HBCE-MATRIX-NODE-0001-TORINO</div>
                </div>

                <div>
                  <div className="text-xs text-white/45">Verification</div>
                  <div className="mt-1">{verification}</div>
                </div>

                <div>
                  <div className="text-xs text-white/45">Conversation Turns</div>
                  <div className="mt-1">{turns}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Advanced execution settings
              </div>
              <div className="mt-2 text-white/80">analysis</div>
              <div className="mt-1 text-white/80">verification</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

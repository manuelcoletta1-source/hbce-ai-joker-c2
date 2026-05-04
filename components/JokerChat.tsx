"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

import {
  buildJokerRuntimeFooter,
  clearJokerClientSession,
  getJokerClientState,
  sendJokerChatRequest,
  type JokerChatResponse,
  type JokerClientFile
} from "../lib/joker-client-session";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  runtime?: string;
};

function createMessageId(): string {
  const entropy =
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `msg-${entropy}`;
}

async function readFileAsText(file: File): Promise<JokerClientFile> {
  const text = await file.text();

  return {
    id: `file-${crypto.randomUUID()}`,
    name: file.name,
    type: file.type || "text/plain",
    size: file.size,
    role: "context",
    text
  };
}

function buildInitialMessages(): ChatMessage[] {
  return [
    {
      id: createMessageId(),
      role: "system",
      content:
        "AI JOKER-C2 online. Nuova sessione inizializzata. Invia una richiesta operativa."
    }
  ];
}

function renderRuntimeDiagnostics(response: JokerChatResponse): string {
  const lines = [
    response.state ? `Runtime OpenAI: ${response.state}` : "",
    response.decision ? `Decision: ${response.decision}` : "",
    response.governanceDecision
      ? `GovernanceDecision: ${response.governanceDecision}`
      : "",
    response.projectDomain ? `ProjectDomain: ${response.projectDomain}` : "",
    response.contextClass ? `Context: ${response.contextClass}` : "",
    response.documentFamily
      ? `DocumentFamily: ${response.documentFamily}`
      : "",
    typeof response.evtIprMemoryUsed === "boolean"
      ? `EvtIprMemoryUsed: ${response.evtIprMemoryUsed}`
      : "",
    response.memorySource ? `MemorySource: ${response.memorySource}` : "",
    response.governedEvt?.evt ? `Governed EVT: ${response.governedEvt.evt}` : "",
    response.memory?.event ? `Memory EVT: ${response.memory.event}` : "",
    response.memory?.appendStatus
      ? `MemoryAppend: ${response.memory.appendStatus}`
      : "",
    response.diagnostics?.modelUsed ? `Model: ${response.diagnostics.modelUsed}` : "",
    response.diagnostics?.degradedReason
      ? `DegradedReason: ${response.diagnostics.degradedReason}`
      : ""
  ].filter(Boolean);

  return lines.join("\n");
}

export default function JokerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(buildInitialMessages);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<JokerClientFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showRuntime, setShowRuntime] = useState(true);
  const [clientStateVersion, setClientStateVersion] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clientState = useMemo(() => {
    clientStateVersion;

    return getJokerClientState();
  }, [clientStateVersion]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const readableFiles = await Promise.all(selectedFiles.map(readFileAsText));

    setFiles((current) => [...current, ...readableFiles]);
    setClientStateVersion((value) => value + 1);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function resetSession() {
    clearJokerClientSession();
    setMessages(buildInitialMessages());
    setFiles([]);
    setClientStateVersion((value) => value + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage && files.length === 0) {
      return;
    }

    setIsSending(true);

    const userText =
      trimmedMessage ||
      "Usa i file attivi come contesto operativo.";

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: userText
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");

    try {
      const response = await sendJokerChatRequest({
        message: userText,
        files
      });

      const assistantContent =
        response.response ||
        response.error ||
        "AI JOKER-C2 non ha restituito una risposta leggibile.";

      const runtimeFooter = buildJokerRuntimeFooter(response);

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantContent,
        runtime: showRuntime
          ? [runtimeFooter, renderRuntimeDiagnostics(response)]
              .filter(Boolean)
              .join("\n")
          : runtimeFooter
      };

      setMessages((current) => [...current, assistantMessage]);
      setClientStateVersion((value) => value + 1);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content:
          error instanceof Error
            ? `Errore runtime: ${error.message}`
            : "Errore runtime sconosciuto."
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6">
        <header className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                HERMETICUM B.C.E. S.r.l.
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                AI JOKER-C2
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Runtime cognitivo-operativo con sessionId stabile, memoria
                EVT/IPR-bound, governed EVT e ledger semantico.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs leading-5 text-zinc-400">
              <div>
                <span className="text-zinc-500">Sessione:</span>{" "}
                {clientState.sessionId || "non inizializzata"}
              </div>
              <div>
                <span className="text-zinc-500">Continuity:</span>{" "}
                {clientState.continuityRef || "none"}
              </div>
              <div>
                <span className="text-zinc-500">Memory EVT:</span>{" "}
                {clientState.lastMemoryEvt || "none"}
              </div>
              <div>
                <span className="text-zinc-500">Governed EVT:</span>{" "}
                {clientState.lastGovernedEvt || "none"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowRuntime((value) => !value)}
              className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600"
            >
              {showRuntime ? "Nascondi runtime" : "Mostra runtime"}
            </button>

            <button
              type="button"
              onClick={resetSession}
              className="rounded-xl border border-red-950/80 px-3 py-2 text-xs text-red-300 transition hover:border-red-700"
            >
              Reset sessione locale
            </button>
          </div>
        </header>

        <section className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          {messages.map((item) => (
            <article
              key={item.id}
              className={[
                "rounded-2xl border p-4",
                item.role === "user"
                  ? "ml-auto max-w-3xl border-zinc-700 bg-zinc-900"
                  : item.role === "assistant"
                    ? "mr-auto max-w-4xl border-zinc-800 bg-black/40"
                    : "mx-auto max-w-4xl border-zinc-900 bg-zinc-950 text-center"
              ].join(" ")}
            >
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                {item.role === "user"
                  ? "You"
                  : item.role === "assistant"
                    ? "AI JOKER-C2"
                    : "System"}
              </div>

              <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-100">
                {item.content}
              </div>

              {item.runtime ? (
                <pre className="mt-4 overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950 p-3 text-xs leading-5 text-zinc-500">
                  {item.runtime}
                </pre>
              ) : null}
            </article>
          ))}
        </section>

        {files.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
              File attivi
            </div>

            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-zinc-200">
                      {file.name || `file-${index + 1}`}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {file.type || "unknown"} · {file.size || 0} byte
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:border-zinc-600"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Invia una richiesta operativa a AI JOKER-C2..."
            className="min-h-32 w-full resize-y rounded-2xl border border-zinc-800 bg-black/60 p-4 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.json,.ts,.tsx,.js,.jsx,.css,.html,.xml,.yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600"
              >
                Aggiungi file
              </button>

              <button
                type="button"
                onClick={() => setFiles([])}
                disabled={files.length === 0}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Pulisci file
              </button>
            </div>

            <button
              type="submit"
              disabled={isSending || (!message.trim() && files.length === 0)}
              className="rounded-xl bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSending ? "Esecuzione..." : "Invia"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

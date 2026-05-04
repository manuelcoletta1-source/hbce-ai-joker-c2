"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID" | string;
type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE" | string;

type FileInput = {
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  role?: string;
  uploaded?: boolean;
};

type RuntimeIdentity = {
  entity?: string;
  ipr?: string;
  evt?: string;
  state?: string;
  cycle?: string;
  core?: string;
};

type PublicEvt = {
  ok?: boolean;
  evt?: string;
  prev?: string;
  hash?: string;
  publicHash?: string;
  fullHash?: string;
};

type GovernedEvt = {
  ok?: boolean;
  evt?: string;
  prev?: string;
  project?: string;
  activeDomains?: string[];
  hash?: string;
  appendStatus?: string;
  appendReason?: string;
};

type OpcPublicProof = {
  proofId?: string;
  chainHash?: string;
  auditStatus?: string;
  verificationStatus?: string;
  appendStatus?: string;
  appendReason?: string;
  publicProof?: unknown;
};

type MemoryInfo = {
  used?: boolean;
  source?: string;
  lastEventId?: string | null;
  event?: string;
  appendStatus?: string;
  appendReason?: string;
  governedEvt?: string;
  governedHash?: string;
};

type GovernanceInfo = {
  projectDomain?: string;
  activeDomains?: string[];
  domainType?: string;
  domainConfidence?: number;
  dataClass?: string;
  containsSecret?: boolean;
  containsPersonalData?: boolean;
  containsSecuritySensitiveData?: boolean;
  policyStatus?: string;
  policyReference?: string;
  riskClass?: string;
  riskScore?: number;
  oversight?: string;
  requiredRole?: string;
  failClosed?: boolean;
  evtRequired?: boolean;
  auditRequired?: boolean;
  filePolicy?: {
    allowed?: boolean;
    allowedCount?: number;
    rejectedCount?: number;
    reasons?: string[];
  };
};

type DiagnosticsInfo = {
  openaiConfigured?: boolean;
  modelUsed?: string;
  degradedReason?: string | null;
  evtIprMemoryUsed?: boolean;
  memorySource?: string;
  memoryEvent?: string;
  memoryAppendStatus?: string;
  opcProofId?: string;
  opcAppendStatus?: string;
  opcVerificationStatus?: string;
  structuredFormat?: boolean;
};

type ChatApiResponse = {
  ok: boolean;
  sessionId?: string;
  response?: string;
  state?: RuntimeState;
  decision?: RuntimeDecision;
  governanceDecision?: string;
  projectDomain?: string;
  activeDomains?: string[];
  domainType?: string;
  contextClass?: string;
  legacyContextClass?: string;
  intentClass?: string;
  documentMode?: string;
  documentFamily?: string;
  evtIprMemoryUsed?: boolean;
  memorySource?: string;
  structuredFormat?: boolean;
  activeFiles?: string[];
  identity?: RuntimeIdentity;
  evt?: PublicEvt;
  governedEvt?: GovernedEvt;
  opc?: OpcPublicProof;
  memory?: MemoryInfo;
  governance?: GovernanceInfo;
  diagnostics?: DiagnosticsInfo;
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  runtime?: ChatApiResponse;
};

const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_SESSION_PREFIX = "JOKER-UI";

function buildClientId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatBool(value: boolean | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "-";
}

function formatList(values?: string[]): string {
  if (!values || values.length === 0) return "-";
  return values.join(", ");
}

function normalizeStatus(value?: string | null): string {
  return value && value.trim() ? value.trim() : "-";
}

function statusTone(value?: string | null): string {
  const normalized = normalizeStatus(value).toUpperCase();

  if (
    normalized === "OPERATIONAL" ||
    normalized === "ALLOW" ||
    normalized === "ALLOWED" ||
    normalized === "APPENDED" ||
    normalized === "VERIFIABLE" ||
    normalized === "READY" ||
    normalized === "NOT_REQUIRED" ||
    normalized === "COMPLETED" ||
    normalized === "PERMIT"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (
    normalized === "DEGRADED" ||
    normalized === "AUDIT" ||
    normalized === "ESCALATE" ||
    normalized === "ESCALATED" ||
    normalized === "RECOMMENDED" ||
    normalized === "RESTRICTED"
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (
    normalized === "BLOCKED" ||
    normalized === "BLOCK" ||
    normalized === "FAILED" ||
    normalized === "REJECTED" ||
    normalized === "INVALID" ||
    normalized === "PROHIBITED"
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-200";
}

function StatusBadge({
  value,
  title
}: {
  value?: string | null;
  title?: string;
}) {
  const safeValue = normalizeStatus(value);

  return (
    <span
      title={title || safeValue}
      className={classNames(
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        "whitespace-normal break-words leading-tight",
        statusTone(safeValue)
      )}
    >
      {safeValue}
    </span>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
  badge = false,
  title
}: {
  label: string;
  value?: string | number | boolean | null;
  mono?: boolean;
  badge?: boolean;
  title?: string;
}) {
  const rendered =
    typeof value === "boolean" ? formatBool(value) : value === 0 ? "0" : value || "-";

  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-b border-slate-800/80 py-2 last:border-b-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div
        title={title || String(rendered)}
        className={classNames(
          "min-w-0 text-sm leading-relaxed text-slate-200",
          mono && "font-mono text-xs",
          !badge && "break-words whitespace-normal"
        )}
      >
        {badge ? <StatusBadge value={String(rendered)} title={title} /> : rendered}
      </div>
    </div>
  );
}

function RuntimeCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/20">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <article
      className={classNames(
        "rounded-2xl border p-4 shadow-lg shadow-black/15",
        isUser
          ? "border-cyan-500/25 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950/75"
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div
          className={classNames(
            "text-xs font-semibold uppercase tracking-[0.18em]",
            isUser ? "text-cyan-200" : "text-slate-400"
          )}
        >
          {isUser ? "You" : "AI JOKER-C2"}
        </div>
        <time className="text-xs text-slate-600">{message.createdAt}</time>
      </div>

      <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-100">
        {message.content}
      </div>

      {!isUser && message.runtime ? (
        <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-3">
          <MiniProofCard
            title="EVT Chain"
            rows={[
              ["EVT", message.runtime.evt?.evt],
              ["Prev", message.runtime.evt?.prev],
              ["Public", message.runtime.evt?.publicHash || message.runtime.evt?.hash],
              ["Full", message.runtime.evt?.fullHash]
            ]}
          />

          <MiniProofCard
            title="Governed EVT"
            rows={[
              ["EVT", message.runtime.governedEvt?.evt],
              ["Prev", message.runtime.governedEvt?.prev],
              ["Project", message.runtime.governedEvt?.project],
              ["Append", message.runtime.governedEvt?.appendStatus]
            ]}
            statusLabels={["Append"]}
          />

          <MiniProofCard
            title="OPC Proof Record"
            rows={[
              ["Proof", message.runtime.opc?.proofId],
              ["Chain", message.runtime.opc?.chainHash],
              ["Audit", message.runtime.opc?.auditStatus],
              ["Verify", message.runtime.opc?.verificationStatus],
              ["Append", message.runtime.opc?.appendStatus]
            ]}
            statusLabels={["Audit", "Verify", "Append"]}
          />
        </div>
      ) : null}
    </article>
  );
}

function MiniProofCard({
  title,
  rows,
  statusLabels = []
}: {
  title: string;
  rows: Array<[string, string | undefined | null]>;
  statusLabels?: string[];
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800/90 bg-black/20 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <div className="grid gap-1.5">
        {rows.map(([label, value]) => {
          const isStatus = statusLabels.includes(label);
          const safeValue = normalizeStatus(value);

          return (
            <div
              key={`${title}-${label}`}
              className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)] items-start gap-2"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {label}
              </div>

              <div className="min-w-0 overflow-visible">
                {isStatus ? (
                  <StatusBadge value={safeValue} />
                ) : (
                  <div
                    title={safeValue}
                    className="min-w-0 break-words whitespace-normal font-mono text-[11px] leading-5 text-slate-300"
                  >
                    {safeValue}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilesPanel({
  files,
  onRemoveFile,
  onClearFiles
}: {
  files: FileInput[];
  onRemoveFile: (id: string | undefined) => void;
  onClearFiles: () => void;
}) {
  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
        Nessun file attivo. Puoi caricare file testuali per inserirli nel contesto runtime.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Active Files
        </h2>
        <button
          type="button"
          onClick={onClearFiles}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-red-400 hover:text-red-200"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-2">
        {files.map((file) => (
          <div
            key={file.id || file.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-800 bg-black/20 p-3"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-200">
                {file.name || "unnamed"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {file.type || "unknown"} · {file.size || 0} bytes
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-red-400 hover:text-red-200"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InterfacePage() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileInput[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastRuntime, setLastRuntime] = useState<ChatApiResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("hbce-joker-session-id")
        : null;

    const nextSessionId = stored || buildClientId(DEFAULT_SESSION_PREFIX);

    setSessionId(nextSessionId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-session-id", nextSessionId);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const runtimeSummary = useMemo(() => {
    return {
      state: lastRuntime?.state || "Ready",
      decision: lastRuntime?.decision || "-",
      projectDomain: lastRuntime?.projectDomain || "-",
      contextClass: lastRuntime?.contextClass || "-",
      intentClass: lastRuntime?.intentClass || "-",
      documentFamily: lastRuntime?.documentFamily || "-",
      memoryUsed: lastRuntime?.evtIprMemoryUsed,
      memorySource: lastRuntime?.memorySource || "-",
      opcAppendStatus: lastRuntime?.opc?.appendStatus || "-",
      opcVerificationStatus: lastRuntime?.opc?.verificationStatus || "-",
      opcAuditStatus: lastRuntime?.opc?.auditStatus || "-"
    };
  }, [lastRuntime]);

  async function handleFileChange(inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) {
      return;
    }

    const nextFiles: FileInput[] = [];

    for (const file of Array.from(inputFiles)) {
      const text = await file.text();

      nextFiles.push({
        id: buildClientId("FILE"),
        name: file.name,
        type: file.type || "text/plain",
        size: file.size,
        role: "context",
        text,
        uploaded: true
      });
    }

    setFiles((current) => [...current, ...nextFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(id: string | undefined) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function clearFiles() {
    setFiles([]);
  }

  function newSession() {
    const nextSessionId = buildClientId(DEFAULT_SESSION_PREFIX);

    setSessionId(nextSessionId);
    setMessages([]);
    setLastRuntime(null);
    setRuntimeError(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("hbce-joker-session-id", nextSessionId);
    }
  }

  async function sendMessage(forceMessage?: string) {
    const outgoing = (forceMessage || message).trim();

    if (!outgoing && files.length === 0) {
      return;
    }

    setRuntimeError(null);
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: buildClientId("MSG-U"),
      role: "user",
      content: outgoing || "Usa i file attivi come contesto operativo.",
      createdAt: new Date().toLocaleString("it-IT")
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: outgoing,
          sessionId,
          files,
          continuityRef: lastRuntime?.memory?.event || lastRuntime?.evt?.evt || null
        })
      });

      const payload = (await response.json()) as ChatApiResponse;

      if (!response.ok || !payload.ok) {
        const errorMessage =
          payload.error ||
          payload.response ||
          `Runtime request failed with HTTP ${response.status}`;

        throw new Error(errorMessage);
      }

      setLastRuntime(payload);

      const assistantMessage: ChatMessage = {
        id: buildClientId("MSG-A"),
        role: "assistant",
        content: payload.response || "",
        createdAt: new Date().toLocaleString("it-IT"),
        runtime: payload
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : "Unknown runtime error.";

      setRuntimeError(errorText);

      setMessages((current) => [
        ...current,
        {
          id: buildClientId("MSG-S"),
          role: "system",
          content: `Runtime error: ${errorText}`,
          createdAt: new Date().toLocaleString("it-IT")
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex min-h-[calc(100vh-3rem)] min-w-0 flex-col rounded-3xl border border-slate-800 bg-slate-900/40 shadow-2xl shadow-black/30">
          <header className="border-b border-slate-800 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  AI JOKER-C2
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Governed Runtime Interface
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Chat operativa con identità IPR, memoria EVT, prova OPC e governance
                  HBCE/MATRIX. Gli stati tecnici vengono mostrati integralmente.
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Session ID
                </div>
                <div className="mt-1 break-all font-mono text-xs text-slate-300">
                  {sessionId || "initializing"}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center">
                <div className="max-w-xl">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    JOKER-C2 online
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-100">
                    Nuova sessione inizializzata. Invia una richiesta operativa.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[
                      "joker cosa è IPR?",
                      "che differenza c’è tra IPR, EVT e OPC?",
                      "diagnostica runtime"
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => void sendMessage(sample)}
                        className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {messages.map((item) => (
                  <MessageBubble key={item.id} message={item} />
                ))}

                {isSending ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                    AI JOKER-C2 sta generando risposta, EVT e OPC proof record.
                  </div>
                ) : null}

                <div ref={scrollRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-800 p-5">
            {runtimeError ? (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {runtimeError}
              </div>
            ) : null}

            <div className="grid gap-3">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Invia una richiesta operativa..."
                rows={4}
                className="min-h-[112px] resize-y rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-100 outline-none ring-0 placeholder:text-slate-600 focus:border-cyan-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => void handleFileChange(event.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                  >
                    Add files
                  </button>

                  <button
                    type="button"
                    onClick={newSession}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-amber-400 hover:text-amber-200"
                  >
                    New session
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSending || (!message.trim() && files.length === 0)}
                  className="rounded-full border border-cyan-400/60 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
                >
                  {isSending ? "Running..." : "Send"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="grid h-fit gap-4">
          <RuntimeCard title="Execution Context">
            <FieldRow label="Node" value={DEFAULT_NODE} mono />
            <FieldRow label="Session" value={sessionId || "-"} mono />
            <FieldRow label="State" value={runtimeSummary.state} badge />
            <FieldRow label="Decision" value={runtimeSummary.decision} badge />
            <FieldRow label="Domain" value={runtimeSummary.projectDomain} />
            <FieldRow label="Context" value={runtimeSummary.contextClass} />
            <FieldRow label="Intent" value={runtimeSummary.intentClass} />
            <FieldRow label="Family" value={runtimeSummary.documentFamily} />
          </RuntimeCard>

          <RuntimeCard title="Identity">
            <FieldRow label="Entity" value={lastRuntime?.identity?.entity || "-"} mono />
            <FieldRow label="IPR" value={lastRuntime?.identity?.ipr || "-"} mono />
            <FieldRow label="EVT" value={lastRuntime?.identity?.evt || "-"} mono />
            <FieldRow label="Cycle" value={lastRuntime?.identity?.cycle || "-"} mono />
            <FieldRow label="Core" value={lastRuntime?.identity?.core || "-"} mono />
          </RuntimeCard>

          <RuntimeCard title="OPC Proof Record">
            <FieldRow label="Proof" value={lastRuntime?.opc?.proofId || "-"} mono />
            <FieldRow label="Chain" value={lastRuntime?.opc?.chainHash || "-"} mono />
            <FieldRow label="Audit" value={runtimeSummary.opcAuditStatus} badge />
            <FieldRow label="Verify" value={runtimeSummary.opcVerificationStatus} badge />
            <FieldRow label="Append" value={runtimeSummary.opcAppendStatus} badge />
            <FieldRow
              label="Reason"
              value={lastRuntime?.opc?.appendReason || "-"}
            />
          </RuntimeCard>

          <RuntimeCard title="EVT Chain">
            <FieldRow label="EVT" value={lastRuntime?.evt?.evt || "-"} mono />
            <FieldRow label="Prev" value={lastRuntime?.evt?.prev || "-"} mono />
            <FieldRow
              label="Public"
              value={lastRuntime?.evt?.publicHash || lastRuntime?.evt?.hash || "-"}
              mono
            />
            <FieldRow label="Full" value={lastRuntime?.evt?.fullHash || "-"} mono />
          </RuntimeCard>

          <RuntimeCard title="Governed EVT">
            <FieldRow label="EVT" value={lastRuntime?.governedEvt?.evt || "-"} mono />
            <FieldRow label="Prev" value={lastRuntime?.governedEvt?.prev || "-"} mono />
            <FieldRow label="Project" value={lastRuntime?.governedEvt?.project || "-"} />
            <FieldRow
              label="Domains"
              value={formatList(lastRuntime?.governedEvt?.activeDomains)}
            />
            <FieldRow label="Hash" value={lastRuntime?.governedEvt?.hash || "-"} mono />
            <FieldRow
              label="Append"
              value={lastRuntime?.governedEvt?.appendStatus || "-"}
              badge
            />
          </RuntimeCard>

          <RuntimeCard title="Memory">
            <FieldRow label="Used" value={runtimeSummary.memoryUsed} />
            <FieldRow label="Source" value={runtimeSummary.memorySource} />
            <FieldRow label="Event" value={lastRuntime?.memory?.event || "-"} mono />
            <FieldRow
              label="Append"
              value={lastRuntime?.memory?.appendStatus || "-"}
              badge
            />
            <FieldRow
              label="Governed"
              value={lastRuntime?.memory?.governedEvt || "-"}
              mono
            />
          </RuntimeCard>

          <RuntimeCard title="Governance">
            <FieldRow
              label="Data"
              value={lastRuntime?.governance?.dataClass || "-"}
              badge
            />
            <FieldRow
              label="Policy"
              value={lastRuntime?.governance?.policyStatus || "-"}
              badge
            />
            <FieldRow
              label="Risk"
              value={lastRuntime?.governance?.riskClass || "-"}
              badge
            />
            <FieldRow
              label="Score"
              value={lastRuntime?.governance?.riskScore ?? "-"}
            />
            <FieldRow
              label="Oversight"
              value={lastRuntime?.governance?.oversight || "-"}
              badge
            />
            <FieldRow
              label="FailClosed"
              value={lastRuntime?.governance?.failClosed}
            />
            <FieldRow
              label="AuditReq"
              value={lastRuntime?.governance?.auditRequired}
            />
          </RuntimeCard>

          <RuntimeCard title="Files">
            <FilesPanel
              files={files}
              onRemoveFile={removeFile}
              onClearFiles={clearFiles}
            />
          </RuntimeCard>

          <RuntimeCard title="Diagnostics">
            <FieldRow
              label="OpenAI"
              value={lastRuntime?.diagnostics?.openaiConfigured}
            />
            <FieldRow
              label="Model"
              value={lastRuntime?.diagnostics?.modelUsed || "-"}
              mono
            />
            <FieldRow
              label="Degraded"
              value={lastRuntime?.diagnostics?.degradedReason || "none"}
            />
            <FieldRow
              label="OPC"
              value={lastRuntime?.diagnostics?.opcAppendStatus || "-"}
              badge
            />
          </RuntimeCard>
        </aside>
      </div>
    </main>
  );
}

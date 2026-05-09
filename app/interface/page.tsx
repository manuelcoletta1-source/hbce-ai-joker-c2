"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type RuntimeState =
  | "OPERATIONAL"
  | "DEGRADED"
  | "BLOCKED"
  | "INVALID"
  | "AUDIT_ONLY"
  | "MAINTENANCE"
  | string;

type RuntimeDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "DEGRADE"
  | "AUDIT"
  | "NOOP"
  | string;

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
  runtimeRole?: string;
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
  memoryHash?: string;
  auditStatus?: string;
  verificationStatus?: string;
  legalCertification?: false;
  appendStatus?: string;
  appendReason?: string;
  publicProof?: unknown;
};

type MemoryInfo = {
  used?: boolean;
  source?: string;
  lastEventId?: string | null;
  event?: string;
  memoryHash?: string;
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
  containsCivicSensitiveData?: boolean;
  containsDemocraticChoiceData?: boolean;
  policyStatus?: string;
  policyOutcome?: string;
  policyReference?: string;
  riskClass?: string;
  riskScore?: number;
  oversight?: string;
  requiredRole?: string;
  iprBinding?: boolean;
  evtRequired?: boolean;
  memoryRequired?: boolean;
  opcRequired?: boolean;
  auditRequired?: boolean;
  failClosed?: boolean;
  civicBoundary?: string;
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
  memoryHash?: string;
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
const USE_DEMOCRATIC_BOUNDARY =
  "Identity verified first. Choice separated after. Vote anonymized. Process auditable.";

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
    normalized === "PERMIT" ||
    normalized === "TRUE"
  ) {
    return "joker-badge--ok";
  }

  if (
    normalized === "DEGRADED" ||
    normalized === "AUDIT" ||
    normalized === "ESCALATE" ||
    normalized === "ESCALATED" ||
    normalized === "RECOMMENDED" ||
    normalized === "RESTRICTED" ||
    normalized === "REQUIRE_AUDIT" ||
    normalized === "REQUIRE_REVIEW" ||
    normalized === "PENDING" ||
    normalized === "PARTIAL"
  ) {
    return "joker-badge--warn";
  }

  if (
    normalized === "BLOCKED" ||
    normalized === "BLOCK" ||
    normalized === "FAILED" ||
    normalized === "REJECTED" ||
    normalized === "INVALID" ||
    normalized === "PROHIBITED" ||
    normalized === "CRITICAL" ||
    normalized === "FALSE"
  ) {
    return "joker-badge--bad";
  }

  return "joker-badge--neutral";
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
      className={classNames("joker-badge", statusTone(safeValue))}
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
    <div className="joker-field-row">
      <div className="joker-field-label">{label}</div>
      <div
        title={title || String(rendered)}
        className={classNames("joker-field-value", mono && "joker-mono")}
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
  children: ReactNode;
}) {
  return (
    <section className="joker-card">
      <h2 className="joker-card-title">{title}</h2>
      <div>{children}</div>
    </section>
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
    <div className="joker-proof-card">
      <div className="joker-proof-title">{title}</div>

      <div className="joker-proof-rows">
        {rows.map(([label, value]) => {
          const isStatus = statusLabels.includes(label);
          const safeValue = normalizeStatus(value);

          return (
            <div key={`${title}-${label}`} className="joker-proof-row">
              <div className="joker-proof-label">{label}</div>
              <div className="joker-proof-value">
                {isStatus ? (
                  <StatusBadge value={safeValue} />
                ) : (
                  <span title={safeValue} className="joker-mono joker-proof-text">
                    {safeValue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <article
      className={classNames(
        "joker-message",
        isUser && "joker-message--user",
        !isUser && !isSystem && "joker-message--assistant",
        isSystem && "joker-message--system"
      )}
    >
      <div className="joker-message-head">
        <div className={classNames("joker-message-role", isUser && "joker-message-role--user")}>
          {isUser ? "You" : isSystem ? "System" : "AI JOKER-C2"}
        </div>
        <time className="joker-message-time">{message.createdAt}</time>
      </div>

      <div className="joker-message-content">{message.content}</div>

      {!isUser && !isSystem && message.runtime ? (
        <div className="joker-mini-grid">
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
            title="EVT/IPR Memory"
            rows={[
              ["Event", message.runtime.memory?.event],
              ["Hash", message.runtime.memory?.memoryHash],
              ["Source", message.runtime.memory?.source],
              ["Append", message.runtime.memory?.appendStatus]
            ]}
            statusLabels={["Append"]}
          />

          <MiniProofCard
            title="OPC Proof Receipt"
            rows={[
              ["Proof", message.runtime.opc?.proofId],
              ["Chain", message.runtime.opc?.chainHash],
              ["Memory", message.runtime.opc?.memoryHash],
              ["Audit", message.runtime.opc?.auditStatus],
              ["Verify", message.runtime.opc?.verificationStatus],
              ["Legal", String(message.runtime.opc?.legalCertification ?? false)]
            ]}
            statusLabels={["Audit", "Verify", "Legal"]}
          />
        </div>
      ) : null}
    </article>
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
      <div className="joker-empty-files">
        Nessun file attivo. Puoi caricare file testuali per inserirli nel contesto runtime.
      </div>
    );
  }

  return (
    <div className="joker-files-box">
      <div className="joker-files-head">
        <h2>Active Files</h2>
        <button type="button" onClick={onClearFiles} className="joker-small-btn joker-small-btn--danger">
          Clear
        </button>
      </div>

      <div className="joker-files-list">
        {files.map((file) => (
          <div key={file.id || file.name} className="joker-file-row">
            <div className="joker-file-main">
              <div className="joker-file-name">{file.name || "unnamed"}</div>
              <div className="joker-file-meta">
                {file.type || "unknown"} · {file.size || 0} bytes
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="joker-small-btn joker-small-btn--danger"
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
      governanceDecision: lastRuntime?.governanceDecision || "-",
      projectDomain: lastRuntime?.projectDomain || "-",
      contextClass: lastRuntime?.contextClass || "-",
      intentClass: lastRuntime?.intentClass || "-",
      documentFamily: lastRuntime?.documentFamily || "-",
      memoryUsed: lastRuntime?.evtIprMemoryUsed,
      memorySource: lastRuntime?.memorySource || "-",
      memoryHash: lastRuntime?.memory?.memoryHash || "-",
      opcAppendStatus: lastRuntime?.opc?.appendStatus || "-",
      opcVerificationStatus: lastRuntime?.opc?.verificationStatus || "-",
      opcAuditStatus: lastRuntime?.opc?.auditStatus || "-",
      legalCertification: lastRuntime?.opc?.legalCertification ?? false
    };
  }, [lastRuntime]);

  async function handleFileChange(inputFiles: FileList | null) {
    if (!inputFiles || inputFiles.length === 0) return;

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

    if (!outgoing && files.length === 0) return;

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
      const errorText = error instanceof Error ? error.message : "Unknown runtime error.";

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
    <main className="joker-interface">
      <style jsx global>{`
        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #020617;
          color: #e5edf8;
        }

        * {
          box-sizing: border-box;
        }

        .joker-interface {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(circle at 20% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
            radial-gradient(circle at 85% 10%, rgba(99, 102, 241, 0.11), transparent 30%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
          color: #e5edf8;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .joker-shell {
          width: min(1440px, 100%);
          margin: 0 auto;
          display: grid;
          min-height: 100vh;
          gap: 24px;
          padding: 24px;
          grid-template-columns: minmax(0, 1fr) 390px;
        }

        .joker-main-panel {
          min-width: 0;
          min-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.62);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.38);
          backdrop-filter: blur(16px);
        }

        .joker-header {
          padding: 22px;
          border-bottom: 1px solid rgba(51, 65, 85, 0.9);
        }

        .joker-header-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .joker-kicker {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .joker-title {
          margin: 8px 0 0;
          color: #ffffff;
          font-size: clamp(24px, 4vw, 34px);
          font-weight: 760;
          letter-spacing: -0.035em;
          line-height: 1.05;
        }

        .joker-lead {
          max-width: 760px;
          margin: 10px 0 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.65;
        }

        .joker-session-box {
          min-width: min(100%, 290px);
          max-width: 420px;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.80);
        }

        .joker-session-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-session-id {
          margin-top: 6px;
          color: #cbd5e1;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .joker-chat-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 22px;
        }

        .joker-empty {
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          text-align: center;
          border: 1px dashed rgba(51, 65, 85, 0.95);
          border-radius: 28px;
          background: rgba(2, 6, 23, 0.35);
        }

        .joker-empty-inner {
          max-width: 620px;
        }

        .joker-empty-kicker {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-empty-title {
          margin: 12px 0 0;
          color: #f8fafc;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.25;
        }

        .joker-samples {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .joker-sample-btn,
        .joker-small-btn,
        .joker-action-btn,
        .joker-send-btn {
          appearance: none;
          border: 1px solid rgba(51, 65, 85, 0.98);
          background: rgba(15, 23, 42, 0.9);
          color: #cbd5e1;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
          transition:
            border-color 160ms ease,
            color 160ms ease,
            background 160ms ease,
            transform 160ms ease;
        }

        .joker-sample-btn:hover,
        .joker-small-btn:hover,
        .joker-action-btn:hover,
        .joker-send-btn:hover {
          border-color: rgba(34, 211, 238, 0.65);
          color: #a5f3fc;
          background: rgba(8, 47, 73, 0.45);
        }

        .joker-sample-btn {
          padding: 9px 14px;
          font-size: 14px;
        }

        .joker-message-list {
          display: grid;
          gap: 16px;
        }

        .joker-message {
          min-width: 0;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          background: rgba(2, 6, 23, 0.62);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
        }

        .joker-message--user {
          border-color: rgba(34, 211, 238, 0.26);
          background: rgba(8, 145, 178, 0.12);
        }

        .joker-message--assistant {
          border-color: rgba(51, 65, 85, 0.95);
        }

        .joker-message--system {
          border-color: rgba(248, 113, 113, 0.35);
          background: rgba(127, 29, 29, 0.24);
        }

        .joker-message-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .joker-message-role {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-message-role--user {
          color: #a5f3fc;
        }

        .joker-message-time {
          color: #64748b;
          font-size: 12px;
        }

        .joker-message-content {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          color: #f1f5f9;
          font-size: 15px;
          line-height: 1.72;
        }

        .joker-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(51, 65, 85, 0.9);
        }

        .joker-proof-card {
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.90);
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.24);
        }

        .joker-proof-title {
          margin-bottom: 10px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-proof-rows {
          display: grid;
          gap: 8px;
        }

        .joker-proof-row {
          min-width: 0;
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 8px;
          align-items: flex-start;
        }

        .joker-proof-label {
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .joker-proof-value {
          min-width: 0;
        }

        .joker-proof-text {
          display: block;
          color: #cbd5e1;
          font-size: 11px;
          line-height: 1.45;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .joker-submit {
          padding: 22px;
          border-top: 1px solid rgba(51, 65, 85, 0.9);
        }

        .joker-error {
          margin-bottom: 14px;
          padding: 12px;
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(127, 29, 29, 0.22);
          border-radius: 16px;
          font-size: 14px;
        }

        .joker-form-grid {
          display: grid;
          gap: 12px;
        }

        .joker-input {
          width: 100%;
          min-height: 118px;
          resize: vertical;
          padding: 15px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          outline: none;
          background: rgba(2, 6, 23, 0.90);
          color: #f8fafc;
          font-size: 14px;
          line-height: 1.65;
          font-family: inherit;
        }

        .joker-input::placeholder {
          color: #475569;
        }

        .joker-input:focus {
          border-color: rgba(34, 211, 238, 0.75);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
        }

        .joker-form-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .joker-left-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .joker-action-btn,
        .joker-send-btn {
          padding: 9px 16px;
          font-size: 14px;
        }

        .joker-action-btn--warn:hover {
          border-color: rgba(251, 191, 36, 0.65);
          color: #fde68a;
          background: rgba(120, 53, 15, 0.35);
        }

        .joker-send-btn {
          border-color: rgba(34, 211, 238, 0.65);
          background: rgba(34, 211, 238, 0.10);
          color: #cffafe;
        }

        .joker-send-btn:disabled {
          cursor: not-allowed;
          border-color: rgba(30, 41, 59, 0.95);
          background: rgba(15, 23, 42, 0.75);
          color: #475569;
        }

        .joker-sidebar {
          display: grid;
          align-content: start;
          gap: 16px;
          min-width: 0;
        }

        .joker-card {
          min-width: 0;
          padding: 16px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.64);
          box-shadow: 0 14px 44px rgba(0, 0, 0, 0.20);
        }

        .joker-card-title {
          margin: 0 0 12px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-field-row {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr);
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(30, 41, 59, 0.85);
        }

        .joker-field-row:last-child {
          border-bottom: 0;
        }

        .joker-field-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .joker-field-value {
          min-width: 0;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.55;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .joker-mono {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 12px;
        }

        .joker-badge {
          display: inline-flex;
          max-width: 100%;
          align-items: center;
          padding: 4px 10px;
          border: 1px solid rgba(71, 85, 105, 0.7);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1.35;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .joker-badge--ok {
          color: #a7f3d0;
          border-color: rgba(16, 185, 129, 0.34);
          background: rgba(16, 185, 129, 0.11);
        }

        .joker-badge--warn {
          color: #fde68a;
          border-color: rgba(245, 158, 11, 0.34);
          background: rgba(245, 158, 11, 0.11);
        }

        .joker-badge--bad {
          color: #fecaca;
          border-color: rgba(239, 68, 68, 0.34);
          background: rgba(239, 68, 68, 0.11);
        }

        .joker-badge--neutral {
          color: #cbd5e1;
          border-color: rgba(71, 85, 105, 0.46);
          background: rgba(71, 85, 105, 0.11);
        }

        .joker-empty-files {
          padding: 16px;
          border: 1px dashed rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.35);
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .joker-files-box {
          padding: 14px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.64);
        }

        .joker-files-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .joker-files-head h2 {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .joker-files-list {
          display: grid;
          gap: 8px;
        }

        .joker-file-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(51, 65, 85, 0.85);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.20);
        }

        .joker-file-main {
          min-width: 0;
        }

        .joker-file-name {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .joker-file-meta {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .joker-small-btn {
          padding: 6px 10px;
          font-size: 12px;
        }

        .joker-small-btn--danger:hover {
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.66);
          background: rgba(127, 29, 29, 0.26);
        }

        @media (max-width: 1280px) {
          .joker-mini-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1120px) {
          .joker-shell {
            grid-template-columns: 1fr;
          }

          .joker-main-panel {
            min-height: auto;
          }

          .joker-sidebar {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .joker-shell {
            padding: 12px;
            gap: 12px;
          }

          .joker-header,
          .joker-chat-scroll,
          .joker-submit {
            padding: 16px;
          }

          .joker-main-panel {
            border-radius: 20px;
          }

          .joker-mini-grid {
            grid-template-columns: 1fr;
          }

          .joker-sidebar {
            grid-template-columns: 1fr;
          }

          .joker-form-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .joker-left-actions,
          .joker-send-btn {
            width: 100%;
          }

          .joker-action-btn,
          .joker-send-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="joker-shell">
        <section className="joker-main-panel">
          <header className="joker-header">
            <div className="joker-header-grid">
              <div>
                <div className="joker-kicker">AI JOKER-C2</div>
                <h1 className="joker-title">IPR Runtime Demonstrator</h1>
                <p className="joker-lead">
                  Chat operativa con identità IPR, EVT, memoria EVT/IPR-bound, proof receipt OPC e governance HBCE/MATRIX.
                  Il runtime espone continuità, audit, verifica, fail-closed e salvaguardie U.S.E. quando pertinenti.
                </p>
              </div>

              <div className="joker-session-box">
                <div className="joker-session-label">Session ID</div>
                <div className="joker-session-id">{sessionId || "initializing"}</div>
              </div>
            </div>
          </header>

          <div className="joker-chat-scroll">
            {messages.length === 0 ? (
              <div className="joker-empty">
                <div className="joker-empty-inner">
                  <div className="joker-empty-kicker">JOKER-C2 online</div>
                  <p className="joker-empty-title">
                    Nuova sessione inizializzata. Invia una richiesta operativa.
                  </p>
                  <div className="joker-samples">
                    {[
                      "joker cosa è IPR?",
                      "che differenza c’è tra IPR, EVT e OPC?",
                      "diagnostica runtime",
                      "spiegami U.S.E. e voto digitale federato"
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => void sendMessage(sample)}
                        className="joker-sample-btn"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="joker-message-list">
                {messages.map((item) => (
                  <MessageBubble key={item.id} message={item} />
                ))}

                {isSending ? (
                  <div className="joker-message joker-message--assistant">
                    AI JOKER-C2 sta generando risposta, EVT, memoria EVT/IPR e OPC proof receipt.
                  </div>
                ) : null}

                <div ref={scrollRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="joker-submit">
            {runtimeError ? <div className="joker-error">{runtimeError}</div> : null}

            <div className="joker-form-grid">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Invia una richiesta operativa..."
                rows={4}
                className="joker-input"
              />

              <div className="joker-form-actions">
                <div className="joker-left-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    style={{ display: "none" }}
                    onChange={(event) => void handleFileChange(event.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="joker-action-btn"
                  >
                    Add files
                  </button>

                  <button
                    type="button"
                    onClick={newSession}
                    className="joker-action-btn joker-action-btn--warn"
                  >
                    New session
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSending || (!message.trim() && files.length === 0)}
                  className="joker-send-btn"
                >
                  {isSending ? "Running..." : "Send"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="joker-sidebar">
          <RuntimeCard title="Execution Context">
            <FieldRow label="Node" value={DEFAULT_NODE} mono />
            <FieldRow label="Session" value={sessionId || "-"} mono />
            <FieldRow label="State" value={runtimeSummary.state} badge />
            <FieldRow label="Decision" value={runtimeSummary.decision} badge />
            <FieldRow label="GovDec" value={runtimeSummary.governanceDecision} badge />
            <FieldRow label="Domain" value={runtimeSummary.projectDomain} />
            <FieldRow label="Domains" value={formatList(lastRuntime?.activeDomains)} />
            <FieldRow label="Context" value={runtimeSummary.contextClass} />
            <FieldRow label="Intent" value={runtimeSummary.intentClass} />
            <FieldRow label="Family" value={runtimeSummary.documentFamily} />
          </RuntimeCard>

          <RuntimeCard title="IPR Runtime">
            <FieldRow label="Entity" value={lastRuntime?.identity?.entity || "-"} mono />
            <FieldRow label="IPR" value={lastRuntime?.identity?.ipr || "-"} mono />
            <FieldRow label="Role" value={lastRuntime?.identity?.runtimeRole || "-"} />
            <FieldRow label="EVT" value={lastRuntime?.identity?.evt || "-"} mono />
            <FieldRow label="Cycle" value={lastRuntime?.identity?.cycle || "-"} mono />
            <FieldRow label="Core" value={lastRuntime?.identity?.core || "-"} mono />
          </RuntimeCard>

          <RuntimeCard title="OPC Proof Receipt">
            <FieldRow label="Proof" value={lastRuntime?.opc?.proofId || "-"} mono />
            <FieldRow label="Chain" value={lastRuntime?.opc?.chainHash || "-"} mono />
            <FieldRow label="Memory" value={lastRuntime?.opc?.memoryHash || "-"} mono />
            <FieldRow label="Audit" value={runtimeSummary.opcAuditStatus} badge />
            <FieldRow label="Verify" value={runtimeSummary.opcVerificationStatus} badge />
            <FieldRow label="Append" value={runtimeSummary.opcAppendStatus} badge />
            <FieldRow label="Legal" value={runtimeSummary.legalCertification} badge />
            <FieldRow label="Reason" value={lastRuntime?.opc?.appendReason || "-"} />
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
            <FieldRow label="Domains" value={formatList(lastRuntime?.governedEvt?.activeDomains)} />
            <FieldRow label="Hash" value={lastRuntime?.governedEvt?.hash || "-"} mono />
            <FieldRow label="Append" value={lastRuntime?.governedEvt?.appendStatus || "-"} badge />
          </RuntimeCard>

          <RuntimeCard title="EVT/IPR Memory">
            <FieldRow label="Used" value={runtimeSummary.memoryUsed} />
            <FieldRow label="Source" value={runtimeSummary.memorySource} />
            <FieldRow label="Event" value={lastRuntime?.memory?.event || "-"} mono />
            <FieldRow label="Hash" value={runtimeSummary.memoryHash} mono />
            <FieldRow label="Append" value={lastRuntime?.memory?.appendStatus || "-"} badge />
            <FieldRow label="Governed" value={lastRuntime?.memory?.governedEvt || "-"} mono />
          </RuntimeCard>

          <RuntimeCard title="Governance">
            <FieldRow label="Data" value={lastRuntime?.governance?.dataClass || "-"} badge />
            <FieldRow label="Civic" value={lastRuntime?.governance?.containsCivicSensitiveData} />
            <FieldRow label="Choice" value={lastRuntime?.governance?.containsDemocraticChoiceData} />
            <FieldRow label="Policy" value={lastRuntime?.governance?.policyStatus || "-"} badge />
            <FieldRow label="Outcome" value={lastRuntime?.governance?.policyOutcome || "-"} badge />
            <FieldRow label="Risk" value={lastRuntime?.governance?.riskClass || "-"} badge />
            <FieldRow label="Score" value={lastRuntime?.governance?.riskScore ?? "-"} />
            <FieldRow label="Oversight" value={lastRuntime?.governance?.oversight || "-"} badge />
            <FieldRow label="Role" value={lastRuntime?.governance?.requiredRole || "-"} />
            <FieldRow label="FailClosed" value={lastRuntime?.governance?.failClosed} />
          </RuntimeCard>

          <RuntimeCard title="Runtime Requirements">
            <FieldRow label="IPR" value={lastRuntime?.governance?.iprBinding} />
            <FieldRow label="EVT" value={lastRuntime?.governance?.evtRequired} />
            <FieldRow label="Memory" value={lastRuntime?.governance?.memoryRequired} />
            <FieldRow label="OPC" value={lastRuntime?.governance?.opcRequired} />
            <FieldRow label="Audit" value={lastRuntime?.governance?.auditRequired} />
          </RuntimeCard>

          {lastRuntime?.governance?.civicBoundary ? (
            <RuntimeCard title="U.S.E. Boundary">
              <FieldRow label="Rule" value={lastRuntime.governance.civicBoundary} />
            </RuntimeCard>
          ) : null}

          <RuntimeCard title="Files">
            <FilesPanel files={files} onRemoveFile={removeFile} onClearFiles={clearFiles} />
          </RuntimeCard>

          <RuntimeCard title="Diagnostics">
            <FieldRow label="OpenAI" value={lastRuntime?.diagnostics?.openaiConfigured} />
            <FieldRow label="Model" value={lastRuntime?.diagnostics?.modelUsed || "-"} mono />
            <FieldRow label="Degraded" value={lastRuntime?.diagnostics?.degradedReason || "none"} />
            <FieldRow label="Memory" value={lastRuntime?.diagnostics?.memoryAppendStatus || "-"} badge />
            <FieldRow label="OPC" value={lastRuntime?.diagnostics?.opcAppendStatus || "-"} badge />
            <FieldRow label="Verify" value={lastRuntime?.diagnostics?.opcVerificationStatus || "-"} badge />
          </RuntimeCard>
        </aside>
      </div>
    </main>
  );
}

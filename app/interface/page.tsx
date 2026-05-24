"use client";

import { FormEvent, useEffect, useState } from "react";

type RuntimeHealth = {
  ok?: boolean;
  runtime?: string;
  state?: string;
  provider?: string;
  apiMode?: string;
  model?: string;
  standardModel?: string;
  deepModel?: string;
  openAIConfigured?: boolean;
  identity?: {
    entity?: string;
    ipr?: string;
    evt?: string;
    state?: string;
    cycle?: string;
    core?: string;
    org?: string;
    location?: string;
  };
  boundary?: {
    legalCertification?: boolean;
    aiGovernanceBoundary?: string;
    useDemocraticBoundary?: string;
  };
  error?: string;
};

type ChatResponse = {
  ok?: boolean;
  sessionId?: string;
  response?: string;
  text?: string;
  state?: string;
  decision?: string;
  degradedReason?: string | null;
  continuityRef?: string | null;
  runtime?: unknown;
  engine?: unknown;
  governance?: unknown;
  event?: unknown;
  evt?: unknown;
  modernEvt?: unknown;
  governedEvt?: unknown;
  opc?: unknown;
  opcProof?: unknown;
  proof?: unknown;
  boundary?: unknown;
  error?: string;
};

type ChatTurn = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  raw?: ChatResponse;
};

const DEFAULT_PROMPT =
  "JOKER-C2, fai diagnostica runtime completa. Dimmi quale modello OpenAI usi, qual è il tuo IPR, qual è il checkpoint EVT, qual è il ruolo di OPC e cosa cambia tra OpenAI come modello e JOKER-C2 come runtime governato.";

function safeText(value: unknown, fallback = "-"): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export default function InterfacePage() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState(DEFAULT_PROMPT);
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [continuityRef, setContinuityRef] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextSessionId = `JOKER-UI-${Date.now()}`;
    setSessionId(nextSessionId);
    void checkRuntime();
  }, []);

  async function checkRuntime() {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "GET",
        cache: "no-store"
      });

      const payload = (await response.json()) as RuntimeHealth;

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `HTTP_${response.status}`);
      }

      setHealth(payload);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "HEALTH_CHECK_FAILED");
    } finally {
      setIsChecking(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const outgoing = message.trim();

    if (!outgoing) {
      setError("Inserisci un messaggio.");
      return;
    }

    setIsSending(true);
    setError(null);

    setTurns((current) => [
      ...current,
      {
        id: buildId("user"),
        role: "user",
        content: outgoing
      }
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify({
          message: outgoing,
          sessionId,
          continuityRef,
          files: []
        })
      });

      const payload = (await response.json()) as ChatResponse;

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || payload.response || `HTTP_${response.status}`);
      }

      if (typeof payload.continuityRef === "string" && payload.continuityRef.trim()) {
        setContinuityRef(payload.continuityRef);
      }

      setTurns((current) => [
        ...current,
        {
          id: buildId("assistant"),
          role: "assistant",
          content: safeText(payload.response || payload.text, "[EMPTY_RESPONSE]"),
          raw: payload
        }
      ]);
    } catch (err) {
      const text = err instanceof Error ? err.message : "CHAT_REQUEST_FAILED";

      setError(text);

      setTurns((current) => [
        ...current,
        {
          id: buildId("system"),
          role: "system",
          content: `Runtime error: ${text}`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="joker-page">
      <section className="joker-shell">
        <header className="joker-header">
          <p className="joker-kicker">HERMETICUM B.C.E. · AI JOKER-C2</p>
          <h1>JOKER-C2 Emergency Interface</h1>
          <p>
            Interfaccia minima di emergenza per testare il runtime senza far
            esplodere React con oggetti annidati. Roba noiosa, quindi utile.
          </p>
        </header>

        <section className="joker-card">
          <div className="joker-row">
            <strong>Runtime</strong>
            <span>{safeText(health?.runtime, "unknown")}</span>
          </div>
          <div className="joker-row">
            <strong>State</strong>
            <span>{safeText(health?.state, "unknown")}</span>
          </div>
          <div className="joker-row">
            <strong>Provider</strong>
            <span>{safeText(health?.provider, "OpenAI")}</span>
          </div>
          <div className="joker-row">
            <strong>Model</strong>
            <span>{safeText(health?.model, "unknown")}</span>
          </div>
          <div className="joker-row">
            <strong>OpenAI configured</strong>
            <span>{safeText(health?.openAIConfigured, "unknown")}</span>
          </div>
          <div className="joker-row">
            <strong>IPR</strong>
            <span>{safeText(health?.identity?.ipr, "unknown")}</span>
          </div>
          <div className="joker-row">
            <strong>EVT</strong>
            <span>{safeText(health?.identity?.evt, "unknown")}</span>
          </div>

          <button type="button" onClick={checkRuntime} disabled={isChecking}>
            {isChecking ? "Checking..." : "Check runtime"}
          </button>
        </section>

        <section className="joker-card">
          <form onSubmit={sendMessage}>
            <label htmlFor="joker-message">Messaggio</label>
            <textarea
              id="joker-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              placeholder="Scrivi a JOKER-C2..."
            />

            <div className="joker-actions">
              <button type="submit" disabled={isSending}>
                {isSending ? "Running..." : "Send"}
              </button>

              <button
                type="button"
                onClick={() => setMessage(DEFAULT_PROMPT)}
                disabled={isSending}
              >
                Prompt diagnostico
              </button>
            </div>
          </form>

          {error ? <div className="joker-error">{error}</div> : null}
        </section>

        <section className="joker-card">
          <h2>Conversation</h2>

          {turns.length === 0 ? (
            <p className="joker-muted">Nessun messaggio ancora inviato.</p>
          ) : (
            <div className="joker-turns">
              {turns.map((turn) => (
                <article key={turn.id} className={`joker-turn joker-turn-${turn.role}`}>
                  <strong>{turn.role.toUpperCase()}</strong>
                  <pre>{turn.content}</pre>

                  {turn.raw ? (
                    <details>
                      <summary>Raw JSON</summary>
                      <pre>{safeJson(turn.raw)}</pre>
                    </details>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style jsx>{`
        .joker-page {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at 20% 0%, rgba(34, 211, 238, 0.12), transparent 32%),
            radial-gradient(circle at 85% 10%, rgba(99, 102, 241, 0.12), transparent 30%),
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
          width: min(980px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .joker-header,
        .joker-card {
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 22px;
          background: rgba(2, 6, 23, 0.72);
          box-shadow: 0 18px 58px rgba(0, 0, 0, 0.24);
        }

        .joker-header {
          padding: 24px;
        }

        .joker-card {
          padding: 18px;
        }

        .joker-kicker {
          margin: 0;
          color: #67e8f9;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        h1 {
          margin: 10px 0 0;
          color: #ffffff;
          font-size: clamp(28px, 5vw, 44px);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        h2 {
          margin: 0 0 12px;
          color: #ffffff;
          font-size: 20px;
        }

        p {
          color: #94a3b8;
          line-height: 1.6;
        }

        .joker-row {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(51, 65, 85, 0.7);
        }

        .joker-row:last-of-type {
          border-bottom: 0;
        }

        .joker-row strong {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .joker-row span {
          color: #e5edf8;
          overflow-wrap: anywhere;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 13px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        textarea {
          width: 100%;
          resize: vertical;
          padding: 14px;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 16px;
          outline: none;
          background: rgba(15, 23, 42, 0.92);
          color: #f8fafc;
          font-size: 14px;
          line-height: 1.6;
          font-family: inherit;
        }

        textarea:focus {
          border-color: rgba(34, 211, 238, 0.72);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
        }

        button {
          appearance: none;
          margin-top: 14px;
          border: 1px solid rgba(34, 211, 238, 0.55);
          background: rgba(34, 211, 238, 0.12);
          color: #cffafe;
          border-radius: 999px;
          padding: 10px 15px;
          cursor: pointer;
          font-weight: 800;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .joker-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .joker-error {
          margin-top: 14px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(127, 29, 29, 0.22);
          color: #fecaca;
        }

        .joker-muted {
          color: #64748b;
        }

        .joker-turns {
          display: grid;
          gap: 14px;
        }

        .joker-turn {
          border: 1px solid rgba(51, 65, 85, 0.8);
          border-radius: 16px;
          padding: 14px;
          background: rgba(15, 23, 42, 0.68);
        }

        .joker-turn-user {
          border-color: rgba(34, 211, 238, 0.34);
        }

        .joker-turn-system {
          border-color: rgba(239, 68, 68, 0.34);
        }

        .joker-turn strong {
          display: block;
          margin-bottom: 8px;
          color: #67e8f9;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        pre {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          margin: 0;
          color: #e5edf8;
          font-size: 14px;
          line-height: 1.6;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
        }

        details {
          margin-top: 12px;
        }

        summary {
          cursor: pointer;
          color: #94a3b8;
          font-weight: 800;
        }

        @media (max-width: 720px) {
          .joker-page {
            padding: 12px;
          }

          .joker-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
      `}</style>
    </main>
  );
}

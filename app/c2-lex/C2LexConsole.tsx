"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import scenarios from "@/public/data/c2-lex-scenarios.json";

type ScenarioRecord = {
  id: string;
  title: string;
  category: string;
  role: string;
  nodeContext: string;
  continuityReference: string;
  message: string;
};

type EngineCheckStatus = "passed" | "limited" | "blocked" | "insufficient";
type EngineRisk = "ordinary" | "sensitive" | "elevated";

type EngineResult = {
  sessionId: string;
  sessionState: string;
  intentClass: string;
  outcomeClass: string;
  policyScope: string;
  continuityReference: string;
  summary: string;
  nextStep: string;
  response: string;
  governanceChecks: {
    origin: EngineCheckStatus;
    role: EngineCheckStatus;
    intent: EngineCheckStatus;
    context: EngineCheckStatus;
    policy: EngineCheckStatus;
    admissibility: EngineCheckStatus;
    risk: EngineRisk;
    traceability: EngineCheckStatus;
  };
};

type ApiResponse =
  | {
      ok: true;
      input: {
        sessionId: string;
        role: string;
        nodeContext: string;
        continuityReference: string;
        message: string;
      };
      result: EngineResult;
    }
  | {
      ok: false;
      error: string;
    };

export default function C2LexConsole() {
  const searchParams = useSearchParams();
  const dataset = scenarios as ScenarioRecord[];

  const requestedScenarioId = searchParams.get("scenario");
  const selectedScenario = useMemo(
    () =>
      dataset.find((scenario) => scenario.id === requestedScenarioId) ?? dataset[0],
    [dataset, requestedScenarioId]
  );

  const [sessionId, setSessionId] = useState(selectedScenario.id);
  const [role, setRole] = useState(selectedScenario.role);
  const [nodeContext, setNodeContext] = useState(selectedScenario.nodeContext);
  const [continuityReference, setContinuityReference] = useState(
    selectedScenario.continuityReference
  );
  const [message, setMessage] = useState(selectedScenario.message);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSessionId(selectedScenario.id);
    setRole(selectedScenario.role);
    setNodeContext(selectedScenario.nodeContext);
    setContinuityReference(selectedScenario.continuityReference);
    setMessage(selectedScenario.message);

    void submitToEngine({
      sessionId: selectedScenario.id,
      role: selectedScenario.role,
      nodeContext: selectedScenario.nodeContext,
      continuityReference: selectedScenario.continuityReference,
      message: selectedScenario.message
    });
  }, [selectedScenario]);

  async function submitToEngine(payload: {
    sessionId: string;
    role: string;
    nodeContext: string;
    continuityReference: string;
    message: string;
  }) {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/c2-lex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        setResult(null);
        setError(data.ok ? "Errore inatteso del motore C2-Lex." : data.error);
        return;
      }

      setResult(data.result);
    } catch {
      setResult(null);
      setError("Impossibile contattare il motore C2-Lex.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitToEngine({
      sessionId,
      role,
      nodeContext,
      continuityReference,
      message
    });
  }

  const checks = result
    ? [
        ["Origine", formatCheck(result.governanceChecks.origin)],
        ["Ruolo", formatCheck(result.governanceChecks.role)],
        ["Intento", formatCheck(result.governanceChecks.intent)],
        ["Contesto", formatCheck(result.governanceChecks.context)],
        ["Policy", formatCheck(result.governanceChecks.policy)],
        ["Ammissibilità", formatCheck(result.governanceChecks.admissibility)],
        ["Rischio", formatRisk(result.governanceChecks.risk)],
        ["Tracciabilità", formatCheck(result.governanceChecks.traceability)]
      ]
    : [];

  return (
    <main className="h-screen overflow-hidden bg-[#212121] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#171717] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="text-sm font-semibold">C2-Lex</div>
            <div className="mt-1 text-xs text-neutral-400">
              Semantic command console
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {dataset.map((scenario) => {
                const isActive = scenario.id === selectedScenario.id;

                return (
                  <a
                    key={scenario.id}
                    href={`/c2-lex?scenario=${encodeURIComponent(scenario.id)}`}
                    className={`block rounded-xl px-3 py-3 text-sm transition ${
                      isActive
                        ? "bg-[#2f2f2f] text-white"
                        : "bg-transparent text-neutral-300 hover:bg-[#242424]"
                    }`}
                  >
                    <div className="truncate font-medium">{scenario.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {formatLabel(scenario.category)}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#212121]">
          <header className="shrink-0 border-b border-white/10 bg-[#212121] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {selectedScenario.title}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {result
                    ? `${formatLabel(result.sessionState)} · ${formatLabel(
                        result.outcomeClass
                      )}`
                    : "Inizializzazione"}
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <HeaderPill label="Ruolo" value={role} />
                <HeaderPill
                  label="Nodo"
                  value={shorten(nodeContext, 22)}
                />
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                  <div className="space-y-6">
                    <ChatMessage
                      roleLabel="Input operatore"
                      tone="user"
                      body={message}
                    />

                    {error ? (
                      <ChatMessage
                        roleLabel="Errore C2-Lex"
                        tone="error"
                        body={error}
                      />
                    ) : (
                      <ChatMessage
                        roleLabel="C2-Lex"
                        tone="assistant"
                        body={
                          result
                            ? result.response
                            : "In attesa di elaborazione del motore."
                        }
                      />
                    )}

                    <section className="rounded-2xl border border-white/10 bg-[#171717] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Esito rapido
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <StatLine
                          label="Intent class"
                          value={result ? formatLabel(result.intentClass) : "In attesa"}
                        />
                        <StatLine
                          label="Policy scope"
                          value={result ? result.policyScope : "In attesa"}
                        />
                        <StatLine
                          label="Session state"
                          value={result ? formatLabel(result.sessionState) : "In attesa"}
                        />
                        <StatLine
                          label="Outcome class"
                          value={result ? formatLabel(result.outcomeClass) : "In attesa"}
                        />
                        <StatLine
                          label="Next step"
                          value={result ? result.nextStep : "Non disponibile"}
                        />
                        <StatLine
                          label="Continuity"
                          value={continuityReference}
                        />
                      </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#171717] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Configurazione sessione
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InlineField
                          label="Session ID"
                          value={sessionId}
                          onChange={setSessionId}
                        />
                        <InlineField label="Ruolo" value={role} onChange={setRole} />
                        <InlineField
                          label="Nodo"
                          value={nodeContext}
                          onChange={setNodeContext}
                        />
                        <InlineField
                          label="Continuity reference"
                          value={continuityReference}
                          onChange={setContinuityReference}
                        />
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-[#212121] px-4 py-4">
                <div className="mx-auto w-full max-w-3xl">
                  <form onSubmit={handleSubmit}>
                    <div className="rounded-[28px] border border-white/10 bg-[#2f2f2f] p-3">
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        className="min-h-[110px] w-full resize-none border-none bg-transparent px-3 py-3 text-sm leading-7 text-white outline-none placeholder:text-neutral-500"
                        placeholder="Scrivi l’input per C2-Lex..."
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-neutral-400">
                          Motore governato · intent classification · governance checks
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Elaborazione..." : "Invia"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <aside className="hidden w-[320px] shrink-0 border-l border-white/10 bg-[#171717] xl:flex xl:flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <RightPanel title="Governance checks">
                    {checks.length > 0 ? (
                      <div className="space-y-2">
                        {checks.map(([label, value]) => (
                          <RightRow key={label} label={label} value={value} />
                        ))}
                      </div>
                    ) : (
                      <EmptyBox text="In attesa dei controlli del motore." />
                    )}
                  </RightPanel>

                  <RightPanel title="Sintesi operativa">
                    <div className="space-y-3 text-sm text-neutral-300">
                      <p>{result ? result.summary : "Nessun esito disponibile."}</p>
                    </div>
                  </RightPanel>

                  <RightPanel title="Stato tecnico">
                    <div className="space-y-2">
                      <RightRow
                        label="Scenario"
                        value={selectedScenario.title}
                      />
                      <RightRow
                        label="Categoria"
                        value={formatLabel(selectedScenario.category)}
                      />
                      <RightRow
                        label="Session ref"
                        value={sessionId}
                      />
                      <RightRow
                        label="Audit mode"
                        value={
                          result
                            ? result.governanceChecks.traceability === "passed"
                              ? "Session-linked"
                              : "Limited"
                            : "In attesa"
                        }
                      />
                    </div>
                  </RightPanel>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function HeaderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-[#2f2f2f] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-xs text-neutral-200">{value}</div>
    </div>
  );
}

function ChatMessage({
  roleLabel,
  body,
  tone
}: {
  roleLabel: string;
  body: string;
  tone: "user" | "assistant" | "error";
}) {
  const wrapper =
    tone === "user"
      ? "bg-transparent"
      : tone === "error"
      ? "rounded-2xl border border-red-500/20 bg-[#2a1616] p-4"
      : "rounded-2xl border border-white/10 bg-[#171717] p-4";

  return (
    <section className={wrapper}>
      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {roleLabel}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-100">
        {body}
      </p>
    </section>
  );
}

function RightPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#1c1c1c] px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-sm text-neutral-200">{value}</div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-[#1c1c1c] px-3 py-3 text-sm text-neutral-400">
      {text}
    </div>
  );
}

function InlineField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-xl bg-[#1c1c1c] px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border-none bg-transparent text-sm text-neutral-100 outline-none"
      />
    </label>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#1c1c1c] px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-sm text-neutral-200">{value}</div>
    </div>
  );
}

function formatCheck(value: string): string {
  switch (value) {
    case "passed":
      return "Superato";
    case "limited":
      return "Limitato";
    case "blocked":
      return "Bloccato";
    case "insufficient":
      return "Insufficiente";
    default:
      return value;
  }
}

function formatRisk(value: string): string {
  switch (value) {
    case "ordinary":
      return "Ordinario";
    case "sensitive":
      return "Sensibile";
    case "elevated":
      return "Elevato";
    default:
      return value;
  }
}

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function shorten(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

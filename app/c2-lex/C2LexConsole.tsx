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
  const [error, setError] = useState<string>("");
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

  const governanceItems = result
    ? [
        { label: "Origine", value: formatCheck(result.governanceChecks.origin) },
        { label: "Ruolo", value: formatCheck(result.governanceChecks.role) },
        { label: "Intento", value: formatCheck(result.governanceChecks.intent) },
        { label: "Contesto", value: formatCheck(result.governanceChecks.context) },
        { label: "Policy", value: formatCheck(result.governanceChecks.policy) },
        {
          label: "Ammissibilità",
          value: formatCheck(result.governanceChecks.admissibility)
        },
        { label: "Rischio", value: formatRisk(result.governanceChecks.risk) },
        {
          label: "Tracciabilità",
          value: formatCheck(result.governanceChecks.traceability)
        }
      ]
    : [];

  return (
    <main className="h-screen overflow-hidden bg-black text-neutral-100">
      <div className="flex h-full">
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-[#0a0a0a] xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
              HBCE Research
            </div>
            <div className="mt-2 text-lg font-semibold text-white">C2-Lex</div>
            <div className="mt-1 text-sm text-neutral-400">
              Semantic command console
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="mb-3 px-2 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              Scenari
            </div>

            <div className="space-y-2">
              {dataset.map((scenario) => {
                const isActive = scenario.id === selectedScenario.id;

                return (
                  <a
                    key={scenario.id}
                    href={`/c2-lex?scenario=${encodeURIComponent(scenario.id)}`}
                    className={`block rounded-2xl border px-3 py-3 transition ${
                      isActive
                        ? "border-white/15 bg-[#171717]"
                        : "border-transparent bg-transparent hover:border-white/10 hover:bg-[#111111]"
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      {scenario.id}
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {scenario.title}
                    </div>
                    <div className="mt-1 text-xs text-neutral-400">
                      {formatLabel(scenario.category)}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#0f0f0f]">
          <header className="shrink-0 border-b border-white/10 bg-[#0f0f0f]/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                  AI JOKER-C2 / IPR / HBCE
                </div>
                <div className="mt-1 truncate text-lg font-semibold text-white">
                  {selectedScenario.title}
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <TopBadge
                  label="Sessione"
                  value={result ? formatLabel(result.sessionState) : "Init"}
                />
                <TopBadge
                  label="Esito"
                  value={result ? formatLabel(result.outcomeClass) : "Pending"}
                />
                <TopBadge label="Ruolo" value={role} />
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                  <section className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      Contesto operativo
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoRow label="Scenario" value={selectedScenario.title} />
                      <InfoRow
                        label="Categoria"
                        value={formatLabel(selectedScenario.category)}
                      />
                      <InfoRow
                        label="Intent class"
                        value={result ? formatLabel(result.intentClass) : "In attesa"}
                      />
                      <InfoRow
                        label="Policy scope"
                        value={result ? result.policyScope : "In attesa"}
                      />
                      <InfoRow label="Session ref" value={sessionId} />
                      <InfoRow
                        label="Continuity reference"
                        value={continuityReference}
                      />
                    </div>
                  </section>

                  <section className="space-y-5">
                    <MessageBlock
                      title="Input operatore"
                      kind="input"
                      body={message}
                    />

                    {error ? (
                      <MessageBlock
                        title="Errore C2-Lex"
                        kind="blocked"
                        body={error}
                      />
                    ) : result ? (
                      <MessageBlock
                        title="Esito C2-Lex"
                        kind={result.outcomeClass === "blocked" ? "blocked" : "output"}
                        body={result.response}
                      />
                    ) : (
                      <MessageBlock
                        title="Esito C2-Lex"
                        kind="output"
                        body="In attesa di elaborazione del motore."
                      />
                    )}

                    <section className="grid gap-3 sm:grid-cols-3">
                      <MetricCard
                        label="Classe"
                        value={result ? formatLabel(result.outcomeClass) : "In attesa"}
                      />
                      <MetricCard
                        label="Stato"
                        value={result ? formatLabel(result.sessionState) : "In attesa"}
                      />
                      <MetricCard
                        label="Next step"
                        value={result ? result.nextStep : "Non disponibile"}
                      />
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                        Esito operativo
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <OutcomeCard
                          title="Sintesi"
                          body={result ? result.summary : "Nessun esito disponibile."}
                        />
                        <OutcomeCard
                          title="Risposta qualificata"
                          body={
                            result
                              ? result.response
                              : "Il motore non ha ancora restituito una risposta."
                          }
                        />
                        <OutcomeCard
                          title="Policy scope"
                          body={result ? result.policyScope : "Non disponibile"}
                        />
                        <OutcomeCard
                          title="Passo successivo"
                          body={result ? result.nextStep : "Non disponibile"}
                        />
                      </div>
                    </section>
                  </section>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-[#0f0f0f]">
                <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <InputField
                        label="Session ID"
                        value={sessionId}
                        onChange={setSessionId}
                      />
                      <InputField
                        label="Ruolo"
                        value={role}
                        onChange={setRole}
                      />
                      <InputField
                        label="Nodo"
                        value={nodeContext}
                        onChange={setNodeContext}
                      />
                      <InputField
                        label="Continuity reference"
                        value={continuityReference}
                        onChange={setContinuityReference}
                      />
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#111111] p-3">
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-4 text-sm leading-7 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-white/20"
                        placeholder="Scrivi l’input da inviare al motore governato C2-Lex..."
                      />
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-neutral-400">
                          Motore governato con intent classification, governance
                          checks, session state e outcome class.
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Elaborazione..." : "Invia a C2-Lex"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <aside className="hidden w-[360px] shrink-0 border-l border-white/10 bg-[#0b0b0b] lg:flex lg:flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  <SidePanel title="Stato della sessione">
                    <div className="space-y-3">
                      <TimelineItem
                        step="01"
                        title="OPEN"
                        body="Sessione aperta in contesto governato."
                        active={result?.sessionState === "OPEN"}
                      />
                      <TimelineItem
                        step="02"
                        title="INTERPRETING"
                        body={`Intento classificato come ${
                          result ? formatLabel(result.intentClass) : "in attesa"
                        }.`}
                        active={result?.sessionState === "INTERPRETING"}
                      />
                      <TimelineItem
                        step="03"
                        title="VALIDATING"
                        body="Verifica di ruolo, contesto, policy e ammissibilità."
                        active={result?.sessionState === "VALIDATING"}
                      />
                      <TimelineItem
                        step="04"
                        title={result?.sessionState ?? "PENDING"}
                        body={`Esito finale della sessione: ${
                          result ? formatLabel(result.outcomeClass) : "in attesa"
                        }.`}
                        active
                      />
                    </div>
                  </SidePanel>

                  <SidePanel title="Governance checks">
                    <div className="space-y-2">
                      {governanceItems.length > 0 ? (
                        governanceItems.map((item) => (
                          <CheckRow
                            key={item.label}
                            label={item.label}
                            value={item.value}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-[#111111] px-3 py-3 text-sm text-neutral-400">
                          In attesa dei controlli del motore.
                        </div>
                      )}
                    </div>
                  </SidePanel>

                  <SidePanel title="Continuità ed evidenza">
                    <div className="space-y-2">
                      <CheckRow
                        label="Session state"
                        value={result ? formatLabel(result.sessionState) : "In attesa"}
                      />
                      <CheckRow
                        label="Outcome class"
                        value={result ? formatLabel(result.outcomeClass) : "In attesa"}
                      />
                      <CheckRow
                        label="Audit mode"
                        value={
                          result
                            ? result.governanceChecks.traceability === "passed"
                              ? "Session-linked"
                              : "Limited"
                            : "In attesa"
                        }
                      />
                      <CheckRow
                        label="Continuity reference"
                        value={continuityReference}
                      />
                    </div>
                  </SidePanel>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function TopBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-[#171717] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-xs font-medium text-white">{value}</div>
    </div>
  );
}

function SidePanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-4">
      <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        {title}
      </div>
      {children}
    </section>
  );
}

function CheckRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-sm text-neutral-200">{value}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border-none bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
      />
    </label>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-sm text-neutral-200">{value}</div>
    </div>
  );
}

function MessageBlock({
  title,
  body,
  kind
}: {
  title: string;
  body: string;
  kind: "input" | "output" | "blocked";
}) {
  const tone =
    kind === "input"
      ? "border-white/10 bg-[#111111]"
      : kind === "blocked"
      ? "border-red-500/20 bg-[#170d0d]"
      : "border-white/10 bg-[#141414]";

  return (
    <section className={`rounded-3xl border p-5 ${tone}`}>
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        {title}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-100">
        {body}
      </p>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function OutcomeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-4">
      <div className="mb-2 text-sm font-medium text-white">{title}</div>
      <p className="text-sm leading-6 text-neutral-300">{body}</p>
    </div>
  );
}

function TimelineItem({
  step,
  title,
  body,
  active
}: {
  step: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        active
          ? "border-white/15 bg-[#171717]"
          : "border-white/10 bg-[#111111]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black text-xs text-neutral-300">
          {step}
        </div>
        <div className="text-sm font-medium text-white">{title}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-300">{body}</p>
    </div>
  );
}

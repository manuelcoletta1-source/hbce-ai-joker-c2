import scenarios from "@/public/data/c2-lex-scenarios.json";
import { runC2LexEngine } from "@/lib/c2-lex-engine";

type ScenarioRecord = {
  id: string;
  title: string;
  category: string;
  role: string;
  nodeContext: string;
  continuityReference: string;
  message: string;
};

export default function C2LexPage({
  searchParams
}: {
  searchParams?: { scenario?: string };
}) {
  const dataset = scenarios as ScenarioRecord[];
  const requestedScenarioId = searchParams?.scenario;
  const selectedScenario =
    dataset.find((scenario) => scenario.id === requestedScenarioId) ?? dataset[0];

  const result = runC2LexEngine({
    sessionId: selectedScenario.id,
    message: selectedScenario.message,
    role: selectedScenario.role,
    nodeContext: selectedScenario.nodeContext,
    continuityReference: selectedScenario.continuityReference
  });

  const governanceItems = [
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
  ];

  return (
    <main className="min-h-screen bg-[#0b0f14] text-[#e8eef7]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
                HBCE Research
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                C2-Lex
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Console semantica di comando dell’ambiente IPR/HBCE.
                Superficie conversazionale-operativa governata, progettata per
                rendere leggibili contesto, stato, vincoli, esiti e continuità
                dell’interazione.
              </p>
            </div>

            <div className="grid min-w-[280px] grid-cols-1 gap-3 sm:grid-cols-2">
              <StatusCard
                label="Stato sessione"
                value={formatLabel(result.sessionState)}
              />
              <StatusCard
                label="Classe esito"
                value={formatLabel(result.outcomeClass)}
              />
              <StatusCard label="Ruolo" value={selectedScenario.role} />
              <StatusCard label="Nodo" value={selectedScenario.nodeContext} />
            </div>
          </div>
        </header>

        <Panel title="Selettore scenari">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dataset.map((scenario) => {
              const isActive = scenario.id === selectedScenario.id;

              return (
                <a
                  key={scenario.id}
                  href={`/c2-lex?scenario=${encodeURIComponent(scenario.id)}`}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-cyan-400/30 bg-cyan-400/10"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {scenario.id}
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">
                    {scenario.title}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {formatLabel(scenario.category)}
                  </div>
                </a>
              );
            })}
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <Panel title="Contesto operativo">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Scenario" value={selectedScenario.title} />
                <InfoRow label="Categoria" value={formatLabel(selectedScenario.category)} />
                <InfoRow
                  label="Intent class"
                  value={formatLabel(result.intentClass)}
                />
                <InfoRow label="Policy scope" value={result.policyScope} />
                <InfoRow label="Session ref" value={result.sessionId} />
                <InfoRow
                  label="Continuity reference"
                  value={result.continuityReference}
                />
              </div>
            </Panel>

            <Panel title="Interazione C2-Lex">
              <div className="space-y-4">
                <MessageBubble
                  kind="input"
                  title="Input operatore"
                  body={selectedScenario.message}
                />

                <MessageBubble
                  kind={result.outcomeClass === "blocked" ? "blocked" : "qualified"}
                  title="Esito C2-Lex"
                  body={result.response}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniBadge
                    label="Classe"
                    value={formatLabel(result.outcomeClass)}
                  />
                  <MiniBadge
                    label="Stato"
                    value={formatLabel(result.sessionState)}
                  />
                  <MiniBadge label="Next step" value={result.nextStep} />
                </div>
              </div>
            </Panel>

            <Panel title="Esito operativo">
              <div className="grid gap-4 sm:grid-cols-2">
                <OutcomeCard title="Sintesi" body={result.summary} />
                <OutcomeCard title="Risposta qualificata" body={result.response} />
                <OutcomeCard
                  title="Policy scope"
                  body={result.policyScope}
                />
                <OutcomeCard title="Passo successivo" body={result.nextStep} />
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Stato della sessione">
              <div className="space-y-3">
                <TimelineItem
                  step="01"
                  title="OPEN"
                  body="Sessione aperta in contesto governato."
                  active={result.sessionState === "OPEN"}
                />
                <TimelineItem
                  step="02"
                  title="INTERPRETING"
                  body={`Intento classificato come ${formatLabel(result.intentClass)}.`}
                  active={result.sessionState === "INTERPRETING"}
                />
                <TimelineItem
                  step="03"
                  title="VALIDATING"
                  body="Verifica di ruolo, contesto, policy e ammissibilità."
                  active={result.sessionState === "VALIDATING"}
                />
                <TimelineItem
                  step="04"
                  title={result.sessionState}
                  body={`Esito finale della sessione: ${formatLabel(
                    result.outcomeClass
                  )}.`}
                  active
                />
              </div>
            </Panel>

            <Panel title="Controlli di governance">
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                {governanceItems.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <span className="font-medium text-white">{item.label}</span>
                    <div>{item.value}</div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Continuità ed evidenza">
              <div className="space-y-3 text-sm leading-6 text-slate-300">
                <InfoRow
                  label="Session state"
                  value={formatLabel(result.sessionState)}
                />
                <InfoRow
                  label="Outcome class"
                  value={formatLabel(result.outcomeClass)}
                />
                <InfoRow
                  label="Audit mode"
                  value={
                    result.governanceChecks.traceability === "passed"
                      ? "Session-linked"
                      : "Limited"
                  }
                />
                <InfoRow
                  label="Continuity reference"
                  value={result.continuityReference}
                />
              </div>
            </Panel>
          </div>
        </section>

        <footer className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm text-slate-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>HERMETICUM B.C.E. S.r.l.</div>
            <div>HBCE Research · C2-Lex semantic command console</div>
          </div>
        </footer>
      </section>
    </main>
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

function Panel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
      <div className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300/80">
        {title}
      </div>
      {children}
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm text-slate-200">{value}</div>
    </div>
  );
}

function MessageBubble({
  kind,
  title,
  body
}: {
  kind: "input" | "qualified" | "blocked";
  title: string;
  body: string;
}) {
  const bubbleClass =
    kind === "input"
      ? "border-white/10 bg-black/20"
      : kind === "blocked"
      ? "border-red-400/20 bg-red-400/10"
      : "border-cyan-400/20 bg-cyan-400/10";

  return (
    <div className={`rounded-3xl border p-4 ${bubbleClass}`}>
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <p className="text-sm leading-7 text-slate-100">{body}</p>
    </div>
  );
}

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function OutcomeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2 text-sm font-medium text-white">{title}</div>
      <p className="text-sm leading-6 text-slate-300">{body}</p>
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
          ? "border-cyan-400/30 bg-cyan-400/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs text-slate-300">
          {step}
        </div>
        <div className="text-sm font-medium text-white">{title}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

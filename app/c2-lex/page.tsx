export default function C2LexPage() {
  const sessionState = "CONTEXTUALIZING";
  const intentClass = "Consultazione operativa";
  const policyScope = "HBCE / Governed Interaction";
  const roleProfile = "Operatore supervisionato";
  const nodeContext = "HBCE-MATRIX-NODE-0001-TORINO";
  const continuityRef = "C2L-SESSION-DEMO-0001";
  const outcomeClass = "Risposta qualificata";
  const governanceCheck = "Ruolo verificato · contesto coerente · nessuna attivazione implicita";

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
              <StatusCard label="Stato sessione" value={sessionState} />
              <StatusCard label="Classe esito" value={outcomeClass} />
              <StatusCard label="Ruolo" value={roleProfile} />
              <StatusCard label="Nodo" value={nodeContext} />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <Panel title="Contesto operativo">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Intent class" value={intentClass} />
                <InfoRow label="Policy scope" value={policyScope} />
                <InfoRow label="Session ref" value={continuityRef} />
                <InfoRow label="Governance check" value={governanceCheck} />
              </div>
            </Panel>

            <Panel title="Interazione C2-Lex">
              <div className="space-y-4">
                <MessageBubble
                  kind="input"
                  title="Input operatore"
                  body="Mostrami lo stato corrente del modulo C2-Lex e chiarisci se questa sessione è in semplice consultazione oppure in attivazione operativa."
                />

                <MessageBubble
                  kind="qualified"
                  title="Esito C2-Lex"
                  body="La sessione corrente è classificata come consultazione operativa. Il contesto è stato associato correttamente al nodo HBCE-MATRIX-NODE-0001-TORINO e il ruolo risulta compatibile con la visibilità dello stato. Nessuna attivazione implicita è stata eseguita."
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniBadge label="Classe" value="Informativa" />
                  <MiniBadge label="Vincolo" value="No action" />
                  <MiniBadge label="Next step" value="Richiesta guida" />
                </div>
              </div>
            </Panel>

            <Panel title="Esito operativo">
              <div className="grid gap-4 sm:grid-cols-2">
                <OutcomeCard
                  title="Stato osservato"
                  body="Sessione leggibile, contesto disponibile, ruolo coerente, policy di sola consultazione attiva."
                />
                <OutcomeCard
                  title="Qualificazione"
                  body="Output informativo contestualizzato, non equivalente a comando, procedura o transizione di stato."
                />
                <OutcomeCard
                  title="Vincolo"
                  body="La distinzione tra consultazione e attivazione resta preservata. Nessun workflow è stato avviato."
                />
                <OutcomeCard
                  title="Passo successivo"
                  body="L’operatore può richiedere spiegazione, guida procedurale o verifica ulteriore entro il perimetro consentito."
                />
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
                />
                <TimelineItem
                  step="02"
                  title="INTERPRETING"
                  body="Intento classificato come consultazione."
                />
                <TimelineItem
                  step="03"
                  title="CONTEXTUALIZING"
                  body="Associazione a ruolo, nodo e policy scope."
                  active
                />
                <TimelineItem
                  step="04"
                  title="RESPONDING"
                  body="Esito qualificato pronto alla restituzione."
                />
              </div>
            </Panel>

            <Panel title="Controlli di governance">
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="font-medium text-white">Origine</span>
                  <div>Risolta e coerente con la sessione corrente.</div>
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="font-medium text-white">Ruolo</span>
                  <div>Compatibile con consultazione e lettura dello stato.</div>
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="font-medium text-white">Policy</span>
                  <div>Nessuna attivazione ammessa senza richiesta qualificata.</div>
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="font-medium text-white">Esito</span>
                  <div>Informativo, attribuibile, auditabile.</div>
                </li>
              </ul>
            </Panel>

            <Panel title="Continuità ed evidenza">
              <div className="space-y-3 text-sm leading-6 text-slate-300">
                <InfoRow label="Continuity reference" value={continuityRef} />
                <InfoRow label="Audit mode" value="Session-linked" />
                <InfoRow label="Escalation state" value="Assente" />
                <InfoRow label="Confirmation state" value="Non richiesta" />
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
  kind: "input" | "qualified";
  title: string;
  body: string;
}) {
  const bubbleClass =
    kind === "input"
      ? "border-white/10 bg-black/20"
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

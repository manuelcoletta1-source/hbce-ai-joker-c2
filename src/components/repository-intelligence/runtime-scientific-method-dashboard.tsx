"use client";

/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Method Dashboard
 *
 * Presentation-only component.
 *
 * Read Only: true
 * Automatic Execution: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  RuntimeScientificMethodDashboardTone,
  RuntimeScientificMethodDashboardViewModel,
} from "../../runtime/orchestration/runtime-scientific-method.view-model";

export interface RuntimeScientificMethodDashboardProps {
  readonly model:
    RuntimeScientificMethodDashboardViewModel;
}

function toneClassName(
  tone: RuntimeScientificMethodDashboardTone,
): string {
  switch (tone) {
    case "SUCCESS":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";

    case "WARNING":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";

    case "DANGER":
      return "border-red-500/40 bg-red-500/10 text-red-200";

    case "NEUTRAL":
    default:
      return "border-slate-700 bg-slate-900/70 text-slate-200";
  }
}

function statusLabel(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /(^|\s)\S/g,
      (character) =>
        character.toUpperCase(),
    );
}

export function RuntimeScientificMethodDashboard({
  model,
}: RuntimeScientificMethodDashboardProps) {
  return (
    <section
      aria-labelledby="runtime-scientific-method-title"
      className="space-y-6"
    >
      <header className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              HERMETICUM B.C.E. · AI JOKER-C2
            </p>

            <h1
              id="runtime-scientific-method-title"
              className="text-3xl font-semibold tracking-tight text-white"
            >
              {model.title}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Proiezione governata del repository, degli esperimenti,
              dell&apos;integrazione, della conoscenza e della causalità.
            </p>
          </div>

          <div
            className={[
              "inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold",
              toneClassName(
                model.statusTone,
              ),
            ].join(" ")}
          >
            {statusLabel(
              model.status,
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Repository
            </dt>

            <dd className="mt-2 break-all text-sm font-medium text-white">
              {model.repository.name}
            </dd>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Branch
            </dt>

            <dd className="mt-2 text-sm font-medium text-white">
              {model.repository.branch}
            </dd>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Commit
            </dt>

            <dd className="mt-2 break-all font-mono text-sm text-cyan-200">
              {model.repository.commit}
            </dd>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Generated At
            </dt>

            <dd className="mt-2 text-sm font-medium text-white">
              {model.generatedAt}
            </dd>
          </div>
        </dl>
      </header>

      <section
        aria-label="Runtime metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {model.metrics.map(
          (metric) => (
            <article
              key={metric.id}
              className={[
                "rounded-2xl border p-5",
                toneClassName(
                  metric.tone,
                ),
              ].join(" ")}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {metric.label}
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {metric.value}
              </p>
            </article>
          ),
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              Scientific Method Stages
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Stato dei gate deterministici e fail-closed.
            </p>
          </div>

          <ol className="space-y-3">
            {model.stages.map(
              (
                stage,
                index,
              ) => (
                <li
                  key={stage.id}
                  className={[
                    "rounded-xl border p-4",
                    toneClassName(
                      stage.tone,
                    ),
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">
                        Stage {index + 1}
                      </p>

                      <h3 className="mt-1 font-semibold">
                        {stage.label}
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-current/30 px-3 py-1 text-xs font-semibold">
                      {statusLabel(
                        stage.status,
                      )}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 opacity-80">
                    {stage.description}
                  </p>
                </li>
              ),
            )}
          </ol>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">
              Recommended Experiment
            </h2>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Decision
                </dt>

                <dd className="mt-1 text-sm font-semibold text-cyan-200">
                  {statusLabel(
                    model.recommendation.decision,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Candidate
                </dt>

                <dd className="mt-1 break-all text-sm text-white">
                  {model.recommendation.candidateId ??
                    "Not selected"}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Hypothesis
                </dt>

                <dd className="mt-1 break-all text-sm text-white">
                  {model.recommendation.hypothesisId ??
                    "Not available"}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Score
                </dt>

                <dd className="mt-1 text-sm text-white">
                  {model.recommendation.score ===
                  undefined
                    ? "Not scored"
                    : `${model.recommendation.score}/100`}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Proposed Action
                </dt>

                <dd className="mt-1 text-sm leading-6 text-slate-300">
                  {model.recommendation.summary}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">
              Causal Knowledge
            </h2>

            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Decision
                </dt>

                <dd className="mt-1 text-sm text-white">
                  {statusLabel(
                    model.causalKnowledge
                      .decision,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Relation
                </dt>

                <dd className="mt-1 text-sm text-white">
                  {model.causalKnowledge
                    .relation ??
                    "Not derived"}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Confidence
                </dt>

                <dd className="mt-1 text-sm text-white">
                  {model.causalKnowledge
                    .confidence ??
                    "Not available"}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">
                  Score
                </dt>

                <dd className="mt-1 text-sm text-white">
                  {model.causalKnowledge
                    .confidenceScore ===
                  undefined
                    ? "Not available"
                    : `${model.causalKnowledge.confidenceScore}/100`}
                </dd>
              </div>
            </dl>

            {model.causalKnowledge.ruleId !==
              undefined && (
              <p className="mt-4 break-all rounded-lg border border-slate-800 bg-slate-900/70 p-3 font-mono text-xs text-cyan-200">
                {
                  model.causalKnowledge
                    .ruleId
                }
              </p>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white">
          Repository Inspection
        </h2>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-900/70 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Files
            </dt>

            <dd className="mt-2 text-2xl font-semibold text-white">
              {model.repository.fileCount}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-900/70 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Directories
            </dt>

            <dd className="mt-2 text-2xl font-semibold text-white">
              {model.repository.directoryCount}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-900/70 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Inspected Files
            </dt>

            <dd className="mt-2 text-2xl font-semibold text-white">
              {
                model.repository
                  .inspectedFileCount
              }
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white">
          Governance Boundary
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Read Only",
              model.governance.readOnly,
            ],
            [
              "Deterministic",
              model.governance
                .deterministic,
            ],
            [
              "Human Authorization",
              model.governance
                .humanAuthorizationRequired,
            ],
            [
              "Operator Authorized",
              model.governance
                .operatorAuthorized,
            ],
            [
              "Automatic Execution",
              model.governance
                .automaticExecution,
            ],
            [
              "Automatic Persistence",
              model.governance
                .automaticPersistence,
            ],
            [
              "Automatic Recall",
              model.governance
                .automaticRecall,
            ],
            [
              "Legal Certification",
              model.governance
                .legalCertification,
            ],
          ].map(
            ([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
              >
                <span className="text-sm text-slate-400">
                  {String(label)}
                </span>

                <span
                  className={[
                    "rounded-full px-2 py-1 text-xs font-semibold",
                    value
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-slate-700/60 text-slate-300",
                  ].join(" ")}
                >
                  {value
                    ? "TRUE"
                    : "FALSE"}
                </span>
              </div>
            ),
          )}
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          OPC remains a technical proof receipt only.
          legalCertification=false. No automatic repository mutation is
          permitted.
        </p>
      </section>
    </section>
  );
}

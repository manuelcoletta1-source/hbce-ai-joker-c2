"use client";

/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain Dashboard
 *
 * Manual, operator-governed interface for:
 *
 * RuntimeSelfState
 * → POST /api/runtime/brain
 * → Runtime Brain Result
 * → Scientific Cycle
 * → Knowledge Evolution
 * → Improvement Roadmap
 *
 * The page does not:
 * - inspect GitHub directly;
 * - generate a fake RuntimeSelfState;
 * - approve proposals automatically;
 * - persist results automatically;
 * - execute roadmap steps;
 * - modify repository files;
 * - claim legal certification.
 *
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  useMemo,
  useState,
} from "react";

type UnknownRecord =
  Record<string, unknown>;

type RequestStatus =
  | "IDLE"
  | "RUNNING"
  | "SUCCESS"
  | "ERROR";

const DEFAULT_RUNTIME_SELF_STATE = `{
  "revision": "PASTE-RUNTIME-SELF-STATE-HERE",
  "generatedAt": "2026-08-06T21:30:00+02:00",
  "runtimeVersion": "AI_JOKER_C2_SAAS_CORE_v0_1",
  "repository": {
    "repository": "hbce-ai-joker-c2",
    "branch": "main",
    "commit": "REPLACE_WITH_REAL_COMMIT",
    "fileCount": 0,
    "directoryCount": 0,
    "inspectedFileCount": 0,
    "buildPassed": true,
    "testsPassed": true
  },
  "evolution": {
    "enabled": true,
    "addedFiles": 0,
    "removedFiles": 0,
    "modifiedFiles": 0,
    "unchangedFiles": 0
  },
  "integration": {
    "available": true,
    "plannerAvailable": true,
    "validatorAvailable": true,
    "operatorAuthorized": true
  },
  "knowledge": {
    "available": true,
    "operatorAuthorized": true,
    "automaticPersistence": false,
    "automaticRecall": false
  },
  "capabilities": [],
  "capabilityRegistry": {
    "revision": "REPLACE_WITH_REAL_REGISTRY_REVISION",
    "capabilities": [],
    "capabilityIds": [],
    "totalCapabilities": 0,
    "operatorAuthorized": true,
    "humanAuthorizationRequired": true,
    "automaticDiscovery": false,
    "automaticPersistence": false,
    "automaticRecall": false,
    "legalCertification": false
  },
  "capabilityAnalysis": {
    "revision": "REPLACE_WITH_REAL_CAPABILITY_ANALYSIS_REVISION",
    "totalCapabilities": 0,
    "averageScore": 0,
    "operationalCapabilities": 0,
    "degradedCapabilities": 0,
    "blockedCapabilities": 0,
    "gaps": [],
    "recommendations": [],
    "operationalStatus": "BLOCKED",
    "legalCertification": false
  },
  "operationalStatus": "BLOCKED",
  "operatorAuthorized": true,
  "humanAuthorizationRequired": true,
  "automaticPersistence": false,
  "automaticRecall": false,
  "legalCertification": false
}`;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRecord(
  source: unknown,
  key: string,
): UnknownRecord | undefined {
  if (!isRecord(source)) {
    return undefined;
  }

  const value =
    source[key];

  return isRecord(value)
    ? value
    : undefined;
}

function readArray(
  source: unknown,
  key: string,
): readonly unknown[] {
  if (!isRecord(source)) {
    return [];
  }

  const value =
    source[key];

  return Array.isArray(value)
    ? value
    : [];
}

function readString(
  source: unknown,
  key: string,
  fallback = "—",
): string {
  if (!isRecord(source)) {
    return fallback;
  }

  const value =
    source[key];

  return typeof value === "string" &&
    value.trim().length > 0
    ? value
    : fallback;
}

function readNumber(
  source: unknown,
  key: string,
  fallback = 0,
): number {
  if (!isRecord(source)) {
    return fallback;
  }

  const value =
    source[key];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function readBoolean(
  source: unknown,
  key: string,
): boolean | undefined {
  if (!isRecord(source)) {
    return undefined;
  }

  const value =
    source[key];

  return typeof value === "boolean"
    ? value
    : undefined;
}

function toneClass(
  value: string,
): string {
  switch (value) {
    case "OPERATIONAL":
    case "PLAN_READY":
    case "COMPLETED":
    case "PASS":
    case "PROPOSE":
    case "EVOLUTION_CONFIRMED":
    case "IMPROVEMENT":
    case "STRONG_IMPROVEMENT":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";

    case "REVIEW_REQUIRED":
    case "STABLE":
    case "INCONCLUSIVE":
    case "SKIPPED":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";

    case "BLOCKED":
    case "REJECTED":
    case "REJECT":
    case "FAIL":
    case "REGRESSION":
    case "STRONG_REGRESSION":
      return "border-red-500/40 bg-red-500/10 text-red-200";

    default:
      return "border-slate-700 bg-slate-900 text-slate-300";
  }
}

function StatusBadge({
  value,
}: {
  readonly value: string;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        toneClass(value),
      ].join(" ")}
    >
      {value}
    </span>
  );
}

function MetricCard({
  label,
  value,
  suffix,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly suffix?: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold text-white">
        {value}
        {suffix ?? ""}
      </p>
    </article>
  );
}

function Section({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>

        {description !== undefined && (
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

export default function RuntimeBrainPage() {
  const [runtimeSelfJson, setRuntimeSelfJson] =
    useState(
      DEFAULT_RUNTIME_SELF_STATE,
    );

  const [
    previousCycleJson,
    setPreviousCycleJson,
  ] = useState("");

  const [
    hypothesesPerFinding,
    setHypothesesPerFinding,
  ] = useState(3);

  const [
    acceptedByOperator,
    setAcceptedByOperator,
  ] = useState(false);

  const [status, setStatus] =
    useState<RequestStatus>("IDLE");

  const [result, setResult] =
    useState<unknown>(null);

  const [error, setError] =
    useState<string | null>(null);

  const parsedResult =
    useMemo(
      () =>
        isRecord(result)
          ? result
          : undefined,
      [result],
    );

  const brainResult =
    readRecord(
      parsedResult,
      "result",
    );

  const capabilities =
    readRecord(
      brainResult,
      "capabilities",
    );

  const researchDevelopment =
    readRecord(
      brainResult,
      "researchDevelopment",
    );

  const scientificCycle =
    readRecord(
      researchDevelopment,
      "scientificCycle",
    );

  const scientificSummary =
    readRecord(
      scientificCycle,
      "summary",
    );

  const scientificDecision =
    readRecord(
      scientificCycle,
      "scientificDecision",
    );

  const knowledgeEvolution =
    readRecord(
      researchDevelopment,
      "knowledgeEvolution",
    );

  const evolutionSummary =
    readRecord(
      knowledgeEvolution,
      "summary",
    );

  const improvementPlan =
    readRecord(
      researchDevelopment,
      "improvementPlan",
    );

  const improvementSummary =
    readRecord(
      improvementPlan,
      "summary",
    );

  const boundary =
    readRecord(
      brainResult,
      "boundary",
    );

  const roadmapSteps =
    readArray(
      improvementPlan,
      "steps",
    );

  const stages =
    readArray(
      researchDevelopment,
      "stages",
    );

  const reasons =
    readArray(
      brainResult,
      "reasons",
    );

  async function executeBrain(): Promise<void> {
    setStatus("RUNNING");
    setError(null);
    setResult(null);

    try {
      const runtimeSelfState: unknown =
        JSON.parse(
          runtimeSelfJson,
        );

      let previousScientificCycle:
        unknown = undefined;

      if (
        previousCycleJson
          .trim()
          .length > 0
      ) {
        previousScientificCycle =
          JSON.parse(
            previousCycleJson,
          );
      }

      const generatedAt =
        new Date().toISOString();

      const response =
        await fetch(
          "/api/runtime/brain",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify({
                executionId:
                  `HBCE-RUNTIME-BRAIN-${crypto.randomUUID()}`,

                generatedAt,

                runtimeSelfState,

                previousScientificCycle,

                hypothesesPerFinding,

                operatorAuthorized:
                  true,

                acceptedByOperator,

                humanAuthorizationRequired:
                  true,

                legalCertification:
                  false,
              }),
          },
        );

      const payload: unknown =
        await response.json();

      if (!response.ok) {
        const apiError =
          readString(
            payload,
            "error",
            `Runtime Brain request failed with HTTP ${response.status}.`,
          );

        throw new Error(
          apiError,
        );
      }

      setResult(payload);
      setStatus("SUCCESS");
    } catch (
      caughtError: unknown
    ) {
      setStatus("ERROR");

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unknown Runtime Brain error.",
      );
    }
  }

  function resetDashboard(): void {
    setResult(null);
    setError(null);
    setStatus("IDLE");
    setAcceptedByOperator(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-7 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                HERMETICUM B.C.E. · AI JOKER-C2
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                Runtime Brain
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Plancia operativa del ciclo scientifico
                governato HBCE. Il Runtime analizza,
                formula ipotesi, classifica esperimenti e
                produce una roadmap. Non esegue modifiche
                e non si autorizza da solo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatusBadge
                value={
                  readString(
                    brainResult,
                    "status",
                    status,
                  )
                }
              />

              <StatusBadge
                value={
                  readString(
                    brainResult,
                    "decision",
                    "NO_RESULT",
                  )
                }
              />
            </div>
          </div>
        </header>

        <Section
          title="Runtime Input"
          description="Inserisci un RuntimeSelfState reale. Il modello fornito è soltanto una struttura di partenza e non rappresenta una scansione effettiva del repository."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <label
                htmlFor="runtime-self-state"
                className="text-sm font-semibold text-slate-200"
              >
                RuntimeSelfState
              </label>

              <textarea
                id="runtime-self-state"
                value={runtimeSelfJson}
                onChange={
                  (
                    event,
                  ) =>
                    setRuntimeSelfJson(
                      event.target.value,
                    )
                }
                spellCheck={false}
                className="mt-3 min-h-[520px] w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-200 outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="previous-cycle"
                  className="text-sm font-semibold text-slate-200"
                >
                  Previous Scientific Cycle
                  <span className="ml-2 font-normal text-slate-500">
                    opzionale
                  </span>
                </label>

                <textarea
                  id="previous-cycle"
                  value={previousCycleJson}
                  onChange={
                    (
                      event,
                    ) =>
                      setPreviousCycleJson(
                        event.target.value,
                      )
                  }
                  placeholder="Incolla qui un precedente RuntimeScientificCycleResult per calcolare Knowledge Evolution."
                  spellCheck={false}
                  className="mt-3 min-h-[300px] w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-200 outline-none transition focus:border-cyan-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <label
                  htmlFor="hypotheses"
                  className="text-sm font-semibold text-slate-200"
                >
                  Ipotesi per finding
                </label>

                <input
                  id="hypotheses"
                  type="number"
                  min={2}
                  max={5}
                  value={
                    hypothesesPerFinding
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setHypothesesPerFinding(
                        Math.max(
                          2,
                          Math.min(
                            5,
                            Number(
                              event.target.value,
                            ) || 3,
                          ),
                        ),
                      )
                  }
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />

                <label className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <input
                    type="checkbox"
                    checked={
                      acceptedByOperator
                    }
                    onChange={
                      (
                        event,
                      ) =>
                        setAcceptedByOperator(
                          event.target.checked,
                        )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-amber-100">
                      Accettazione esplicita della proposta
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-amber-200/70">
                      Consente al planner di marcare la
                      roadmap come pronta. Non esegue
                      codice, commit o mutazioni.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={executeBrain}
                  disabled={
                    status === "RUNNING"
                  }
                  className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "RUNNING"
                    ? "Runtime Brain in esecuzione..."
                    : "Execute Runtime Brain"}
                </button>

                <button
                  type="button"
                  onClick={resetDashboard}
                  disabled={
                    status === "RUNNING"
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </Section>

        {error !== null && (
          <section
            role="alert"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6"
          >
            <h2 className="font-semibold text-red-100">
              Runtime Brain failure
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-200">
              {error}
            </p>
          </section>
        )}

        {status === "RUNNING" && (
          <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-sm text-cyan-100">
            Il Runtime Brain sta elaborando il ciclo
            R&amp;D governato.
          </section>
        )}

        {brainResult !== undefined && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Capability Score"
                value={
                  readNumber(
                    capabilities,
                    "capabilityScore",
                  )
                }
                suffix="/100"
              />

              <MetricCard
                label="Capabilities"
                value={
                  readNumber(
                    capabilities,
                    "registeredCapabilities",
                  )
                }
              />

              <MetricCard
                label="Capability Gaps"
                value={
                  readNumber(
                    capabilities,
                    "capabilityGaps",
                  )
                }
              />

              <MetricCard
                label="Findings"
                value={
                  readNumber(
                    capabilities,
                    "findings",
                  )
                }
              />

              <MetricCard
                label="Hypotheses"
                value={
                  readNumber(
                    capabilities,
                    "scientificHypotheses",
                  )
                }
              />

              <MetricCard
                label="Experiments"
                value={
                  readNumber(
                    capabilities,
                    "experimentCandidates",
                  )
                }
              />

              <MetricCard
                label="Experiment Score"
                value={
                  readNumber(
                    capabilities,
                    "selectedExperimentScore",
                  )
                }
                suffix="/100"
              />

              <MetricCard
                label="Roadmap Steps"
                value={
                  readNumber(
                    capabilities,
                    "roadmapSteps",
                  )
                }
              />
            </section>

            <Section
              title="R&D Pipeline"
              description="Stato delle fasi principali del ciclo di ricerca e sviluppo."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                {stages.map(
                  (
                    item,
                    index,
                  ) => {
                    const stageRecord =
                      isRecord(item)
                        ? item
                        : {};

                    const stageStatus =
                      readString(
                        stageRecord,
                        "status",
                      );

                    return (
                      <article
                        key={
                          readString(
                            stageRecord,
                            "stage",
                            `stage-${index}`,
                          )
                        }
                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold text-white">
                            {readString(
                              stageRecord,
                              "stage",
                            )}
                          </h3>

                          <StatusBadge
                            value={
                              stageStatus
                            }
                          />
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          {readString(
                            stageRecord,
                            "description",
                          )}
                        </p>
                      </article>
                    );
                  },
                )}
              </div>
            </Section>

            <div className="grid gap-8 xl:grid-cols-2">
              <Section
                title="Scientific Decision"
                description="Risultato della selezione governata degli esperimenti."
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">
                      Decision
                    </span>

                    <StatusBadge
                      value={
                        readString(
                          scientificDecision,
                          "decision",
                        )
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">
                      Status
                    </span>

                    <StatusBadge
                      value={
                        readString(
                          scientificDecision,
                          "status",
                        )
                      }
                    />
                  </div>

                  <dl className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">
                        Candidate
                      </dt>

                      <dd className="break-all text-right text-slate-200">
                        {readString(
                          scientificSummary,
                          "selectedCandidateId",
                        )}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">
                        Hypothesis
                      </dt>

                      <dd className="break-all text-right text-slate-200">
                        {readString(
                          scientificSummary,
                          "selectedHypothesisId",
                        )}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">
                        Score
                      </dt>

                      <dd className="text-slate-200">
                        {readNumber(
                          scientificSummary,
                          "selectedExperimentScore",
                        )}
                        /100
                      </dd>
                    </div>
                  </dl>
                </div>
              </Section>

              <Section
                title="Knowledge Evolution"
                description="Confronto con il ciclo precedente, quando fornito esplicitamente."
              >
                {knowledgeEvolution === undefined ? (
                  <p className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-slate-400">
                    Nessun ciclo precedente fornito.
                    Knowledge Evolution non è stata
                    eseguita.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-slate-400">
                        Trend
                      </span>

                      <StatusBadge
                        value={
                          readString(
                            knowledgeEvolution,
                            "trend",
                          )
                        }
                      />
                    </div>

                    <MetricCard
                      label="Evolution Score"
                      value={
                        readNumber(
                          evolutionSummary,
                          "evolutionScore",
                        )
                      }
                      suffix="/100"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard
                        label="Resolved"
                        value={
                          readNumber(
                            evolutionSummary,
                            "resolvedFindings",
                          )
                        }
                      />

                      <MetricCard
                        label="New Findings"
                        value={
                          readNumber(
                            evolutionSummary,
                            "newFindings",
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </Section>
            </div>

            <Section
              title="Improvement Roadmap"
              description="Piano tecnico descrittivo. Nessuno step viene eseguito automaticamente."
            >
              <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Estimated Files"
                  value={
                    readNumber(
                      improvementSummary,
                      "totalEstimatedChangedFiles",
                    )
                  }
                />

                <MetricCard
                  label="Estimated Lines"
                  value={
                    readNumber(
                      improvementSummary,
                      "totalEstimatedChangedLines",
                    )
                  }
                />

                <MetricCard
                  label="Build Runs"
                  value={
                    readNumber(
                      improvementSummary,
                      "totalEstimatedBuildExecutions",
                    )
                  }
                />

                <MetricCard
                  label="Operator Minutes"
                  value={
                    readNumber(
                      improvementSummary,
                      "totalEstimatedOperatorMinutes",
                    )
                  }
                />
              </div>

              {roadmapSteps.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                  Nessuna roadmap disponibile.
                </p>
              ) : (
                <div className="space-y-4">
                  {roadmapSteps.map(
                    (
                      item,
                      index,
                    ) => {
                      const stepRecord =
                        isRecord(item)
                          ? item
                          : {};

                      return (
                        <article
                          key={
                            readString(
                              stepRecord,
                              "id",
                              `roadmap-step-${index}`,
                            )
                          }
                          className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                Step{" "}
                                {readNumber(
                                  stepRecord,
                                  "sequence",
                                  index + 1,
                                )}{" "}
                                ·{" "}
                                {readString(
                                  stepRecord,
                                  "type",
                                )}
                              </p>

                              <h3 className="mt-2 text-lg font-semibold text-white">
                                {readString(
                                  stepRecord,
                                  "title",
                                )}
                              </h3>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <StatusBadge
                                value={
                                  readString(
                                    stepRecord,
                                    "status",
                                  )
                                }
                              />

                              <StatusBadge
                                value={
                                  readString(
                                    stepRecord,
                                    "risk",
                                  )
                                }
                              />
                            </div>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-slate-400">
                            {readString(
                              stepRecord,
                              "description",
                            )}
                          </p>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </Section>

            <div className="grid gap-8 xl:grid-cols-2">
              <Section
                title="Governance Boundary"
                description="Invarianti dichiarati dal Runtime Brain."
              >
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    [
                      "Read Only",
                      "readOnly",
                    ],
                    [
                      "Deterministic",
                      "deterministic",
                    ],
                    [
                      "Fail Closed",
                      "failClosed",
                    ],
                    [
                      "Human Authorization",
                      "humanAuthorizationRequired",
                    ],
                    [
                      "Automatic Execution",
                      "automaticExecution",
                    ],
                    [
                      "Automatic Persistence",
                      "automaticPersistence",
                    ],
                    [
                      "Automatic Recall",
                      "automaticRecall",
                    ],
                    [
                      "Repository Mutation",
                      "automaticRepositoryMutation",
                    ],
                    [
                      "OPC Technical Proof Only",
                      "opcTechnicalProofOnly",
                    ],
                    [
                      "Legal Certification",
                      "legalCertification",
                    ],
                  ].map(
                    ([
                      label,
                      key,
                    ]) => {
                      const value =
                        readBoolean(
                          boundary,
                          key,
                        );

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
                        >
                          <dt className="text-slate-400">
                            {label}
                          </dt>

                          <dd
                            className={
                              value === true
                                ? "font-semibold text-emerald-300"
                                : value === false
                                  ? "font-semibold text-slate-300"
                                  : "text-slate-600"
                            }
                          >
                            {value === undefined
                              ? "—"
                              : String(
                                  value,
                                )}
                          </dd>
                        </div>
                      );
                    },
                  )}
                </dl>
              </Section>

              <Section
                title="Runtime Reasons"
                description="Motivazioni e boundary prodotti dal punto di ingresso canonico."
              >
                <div className="max-h-[520px] space-y-3 overflow-auto pr-2">
                  {reasons.map(
                    (
                      reason,
                      index,
                    ) => (
                      <p
                        key={`reason-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300"
                      >
                        {typeof reason ===
                        "string"
                          ? reason
                          : JSON.stringify(
                              reason,
                            )}
                      </p>
                    ),
                  )}
                </div>
              </Section>
            </div>

            <details className="rounded-2xl border border-slate-800 bg-slate-900/60">
              <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-200">
                Raw Runtime Brain Response
              </summary>

              <pre className="max-h-[75vh] overflow-auto border-t border-slate-800 bg-slate-950 p-6 text-xs leading-5 text-slate-300">
                {JSON.stringify(
                  result,
                  null,
                  2,
                )}
              </pre>
            </details>
          </>
        )}

        <footer className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 text-xs leading-6 text-slate-500">
          AI JOKER-C2 · IPR-AI-0001 · Human Authority:
          IPR-3 · Read Only · Human Authorization Required
          · No Automatic Repository Mutation · OPC Technical
          Proof Only · legalCertification=false
        </footer>
      </div>
    </main>
  );
}

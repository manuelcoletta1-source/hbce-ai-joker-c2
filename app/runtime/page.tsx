"use client";

/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Operations Dashboard
 *
 * UI surface for governed observation of:
 *
 * Runtime Brain
 * Runtime Scheduler
 * Scientific Cycle
 * Decision Gates
 * Improvement Planning
 *
 * This page does not:
 * - mutate repository files;
 * - persist runtime results automatically;
 * - perform automatic recall;
 * - auto-approve scientific proposals;
 * - issue legal certification.
 */

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

type SchedulerMode =
  | "MANUAL"
  | "INTERVAL"
  | "COMMIT"
  | "PRE_RELEASE";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [key: string]:
        JsonValue;
    };

interface ApiResponse {
  readonly ok?: boolean;
  readonly status?: string;
  readonly revision?: string;
  readonly generatedAt?: string;
  readonly legalCertification?: boolean;

  readonly scheduler?: {
    readonly status?: string;
    readonly reason?: string;
    readonly due?: boolean;
  };

  readonly runner?: {
    readonly status?: string;

    readonly summary?: {
      readonly runtimeBrainExecuted?: boolean;
      readonly runtimeBrainStatus?: string;
      readonly runtimeBrainDecision?: string;
    };

    readonly runtimeBrainResult?: {
      readonly status?: string;
      readonly decision?: string;

      readonly researchDevelopment?: {
        readonly scientificCycle?: {
          readonly status?: string;

          readonly summary?: {
            readonly capabilityScore?: number;
            readonly registeredCapabilities?: number;
            readonly findings?: number;
            readonly scientificHypotheses?: number;
            readonly experimentCandidates?: number;
            readonly selectedCandidateId?: string;
            readonly selectedExperimentScore?: number;
            readonly finalDecision?: string;
          };

          readonly scientificDecision?: {
            readonly status?: string;
            readonly decision?: string;

            readonly evidence?: {
              readonly totalScore?: number;
              readonly scoreMargin?: number;
              readonly competingCandidateScore?: number;
            };

            readonly gates?: readonly {
              readonly id?: string;
              readonly label?: string;
              readonly required?: boolean;
              readonly passed?: boolean;
              readonly description?: string;
            }[];
          };
        };

        readonly improvementPlan?: {
          readonly status?: string;
          readonly decision?: string;

          readonly summary?: {
            readonly totalSteps?: number;
            readonly plannedSteps?: number;
            readonly estimatedChangedFiles?: number;
            readonly estimatedChangedLines?: number;
            readonly estimatedBuildExecutions?: number;
            readonly estimatedOperatorMinutes?: number;
            readonly highestRisk?: string;
          };
        };
      };

      readonly boundary?: {
        readonly readOnly?: boolean;
        readonly deterministic?: boolean;
        readonly failClosed?: boolean;
        readonly humanAuthorizationRequired?: boolean;
        readonly automaticExecution?: boolean;
        readonly automaticSelection?: boolean;
        readonly automaticPersistence?: boolean;
        readonly automaticRecall?: boolean;
        readonly automaticRepositoryMutation?: boolean;
        readonly opcTechnicalProofOnly?: boolean;
        readonly legalCertification?: boolean;
      };
    };
  };

  readonly result?: {
    readonly status?: string;
    readonly decision?: string;

    readonly researchDevelopment?: {
      readonly scientificCycle?: {
        readonly status?: string;

        readonly summary?: {
          readonly capabilityScore?: number;
          readonly registeredCapabilities?: number;
          readonly findings?: number;
          readonly scientificHypotheses?: number;
          readonly experimentCandidates?: number;
          readonly selectedCandidateId?: string;
          readonly selectedExperimentScore?: number;
          readonly finalDecision?: string;
        };

        readonly scientificDecision?: {
          readonly status?: string;
          readonly decision?: string;

          readonly evidence?: {
            readonly totalScore?: number;
            readonly scoreMargin?: number;
            readonly competingCandidateScore?: number;
          };

          readonly gates?: readonly {
            readonly id?: string;
            readonly label?: string;
            readonly required?: boolean;
            readonly passed?: boolean;
            readonly description?: string;
          }[];
        };
      };

      readonly improvementPlan?: {
        readonly status?: string;
        readonly decision?: string;

        readonly summary?: {
          readonly totalSteps?: number;
          readonly plannedSteps?: number;
          readonly estimatedChangedFiles?: number;
          readonly estimatedChangedLines?: number;
          readonly estimatedBuildExecutions?: number;
          readonly estimatedOperatorMinutes?: number;
          readonly highestRisk?: string;
        };
      };
    };

    readonly boundary?: {
      readonly readOnly?: boolean;
      readonly deterministic?: boolean;
      readonly failClosed?: boolean;
      readonly humanAuthorizationRequired?: boolean;
      readonly automaticExecution?: boolean;
      readonly automaticSelection?: boolean;
      readonly automaticPersistence?: boolean;
      readonly automaticRecall?: boolean;
      readonly automaticRepositoryMutation?: boolean;
      readonly opcTechnicalProofOnly?: boolean;
      readonly legalCertification?: boolean;
    };
  };

  readonly error?: string;
}

function statusStyle(
  status:
    string | undefined,
): React.CSSProperties {
  const normalized =
    status?.toUpperCase();

  if (
    normalized === "PASS" ||
    normalized === "EXECUTED" ||
    normalized === "OPERATIONAL" ||
    normalized === "DUE"
  ) {
    return {
      border:
        "1px solid rgba(90, 220, 150, 0.38)",
      background:
        "rgba(90, 220, 150, 0.08)",
    };
  }

  if (
    normalized === "BLOCKED" ||
    normalized === "NO_ACTION"
  ) {
    return {
      border:
        "1px solid rgba(255, 110, 110, 0.38)",
      background:
        "rgba(255, 110, 110, 0.08)",
    };
  }

  if (
    normalized ===
      "REVIEW_REQUIRED" ||
    normalized ===
      "NOT_DUE"
  ) {
    return {
      border:
        "1px solid rgba(255, 200, 90, 0.38)",
      background:
        "rgba(255, 200, 90, 0.08)",
    };
  }

  return {
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      "rgba(255,255,255,0.03)",
  };
}

function StatusCard(
  props: {
    readonly title: string;
    readonly value:
      string | number | boolean | undefined;
    readonly description?: string;
  },
) {
  return (
    <div
      style={{
        ...statusStyle(
          String(
            props.value ?? "",
          ),
        ),
        borderRadius:
          16,
        padding:
          18,
        minHeight:
          120,
      }}
    >
      <div
        style={{
          fontSize:
            12,
          opacity:
            0.6,
          marginBottom:
            10,
          textTransform:
            "uppercase",
          letterSpacing:
            "0.08em",
        }}
      >
        {props.title}
      </div>

      <div
        style={{
          fontSize:
            22,
          fontWeight:
            700,
          wordBreak:
            "break-word",
        }}
      >
        {String(
          props.value ??
            "—",
        )}
      </div>

      {props.description ? (
        <div
          style={{
            marginTop:
              10,
            fontSize:
              13,
            lineHeight:
              1.5,
            opacity:
              0.7,
          }}
        >
          {
            props.description
          }
        </div>
      ) : null}
    </div>
  );
}

function BooleanBoundary(
  props: {
    readonly label: string;
    readonly value:
      boolean | undefined;
    readonly expected: boolean;
  },
) {
  const valid =
    props.value ===
    props.expected;

  return (
    <div
      style={{
        display:
          "flex",
        justifyContent:
          "space-between",
        gap:
          16,
        padding:
          "10px 0",
        borderBottom:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span>
        {props.label}
      </span>

      <strong>
        {valid
          ? "PASS"
          : props.value ===
              undefined
            ? "—"
            : "FAIL"}
      </strong>
    </div>
  );
}

function createRuntimeSelfState(
  generatedAt:
    string,
) {
  return {
    revision:
      "AIJC2-RUNTIME-SELF-STATE-DASHBOARD-v1_0",

    generatedAt,

    runtimeVersion:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    repository: {
      repository:
        "hbce-ai-joker-c2",

      branch:
        "main",

      commit:
        "DASHBOARD_RUNTIME_STATE",

      fileCount:
        0,

      directoryCount:
        0,

      inspectedFileCount:
        0,

      buildPassed:
        true,

      testsPassed:
        true,
    },

    evolution: {
      enabled:
        true,

      addedFiles:
        0,

      removedFiles:
        0,

      modifiedFiles:
        0,

      unchangedFiles:
        0,
    },

    integration: {
      available:
        true,

      plannerAvailable:
        true,

      validatorAvailable:
        true,

      operatorAuthorized:
        true,
    },

    knowledge: {
      available:
        true,

      operatorAuthorized:
        true,

      automaticPersistence:
        false,

      automaticRecall:
        false,
    },

    capabilities:
      [],

    capabilityRegistry: {
      revision:
        "DASHBOARD-CAPABILITY-REGISTRY",

      capabilities:
        [],

      capabilityIds:
        [],

      totalCapabilities:
        0,

      operatorAuthorized:
        true,

      humanAuthorizationRequired:
        true,

      automaticDiscovery:
        false,

      automaticPersistence:
        false,

      automaticRecall:
        false,

      legalCertification:
        false,
    },

    capabilityAnalysis: {
      revision:
        "DASHBOARD-CAPABILITY-ANALYSIS",

      totalCapabilities:
        0,

      averageScore:
        0,

      operationalCapabilities:
        0,

      degradedCapabilities:
        0,

      blockedCapabilities:
        0,

      gaps:
        [],

      recommendations:
        [],

      operationalStatus:
        "OPERATIONAL",

      legalCertification:
        false,
    },

    operationalStatus:
      "OPERATIONAL",

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,
  };
}

export default function RuntimePage() {
  const [
    mode,
    setMode,
  ] =
    useState<SchedulerMode>(
      "MANUAL",
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    response,
    setResponse,
  ] =
    useState<ApiResponse | null>(
      null,
    );

  const brainResult =
    response?.runner
      ?.runtimeBrainResult ??
    response?.result;

  const scientificCycle =
    brainResult
      ?.researchDevelopment
      ?.scientificCycle;

  const scientificDecision =
    scientificCycle
      ?.scientificDecision;

  const improvementPlan =
    brainResult
      ?.researchDevelopment
      ?.improvementPlan;

  const boundary =
    brainResult?.boundary;

  const rawJson =
    useMemo(
      () =>
        response
          ? JSON.stringify(
              response,
              null,
              2,
            )
          : "",
      [response],
    );

  async function runScheduler(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    const generatedAt =
      new Date()
        .toISOString();

    const body = {
      schedulerId:
        `HBCE-DASHBOARD-${Date.now()}`,

      evaluatedAt:
        generatedAt,

      policy: {
        mode,

        ...(mode ===
        "INTERVAL"
          ? {
              intervalMinutes:
                60,
            }
          : {}),

        ...(mode ===
        "COMMIT"
          ? {
              lastAnalyzedCommit:
                "PREVIOUS_COMMIT",
            }
          : {}),

        ...(mode ===
        "PRE_RELEASE"
          ? {
              releaseCandidate:
                true,
            }
          : {}),
      },

      runtimeSelfState:
        createRuntimeSelfState(
          generatedAt,
        ),

      manualRequested:
        mode ===
        "MANUAL",

      operatorAuthorized:
        true,

      runnerAuthorized:
        true,

      humanAuthorizationRequired:
        true,

      legalCertification:
        false,
    };

    try {
      const apiResponse =
        await fetch(
          "/api/runtime/scheduler",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body,
              ),
          },
        );

      const payload:
        ApiResponse =
        await apiResponse.json();

      setResponse(
        payload,
      );

      if (!apiResponse.ok) {
        setError(
          payload.error ??
            `HTTP ${apiResponse.status}`,
        );
      }
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unknown runtime dashboard error.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runBrainDirectly() {
    setLoading(true);
    setError(null);

    const generatedAt =
      new Date()
        .toISOString();

    const body = {
      executionId:
        `HBCE-DASHBOARD-BRAIN-${Date.now()}`,

      generatedAt,

      runtimeSelfState:
        createRuntimeSelfState(
          generatedAt,
        ),

      hypothesesPerFinding:
        3,

      operatorAuthorized:
        true,

      acceptedByOperator:
        false,

      humanAuthorizationRequired:
        true,

      legalCertification:
        false,
    };

    try {
      const apiResponse =
        await fetch(
          "/api/runtime/brain",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body,
              ),
          },
        );

      const payload:
        ApiResponse =
        await apiResponse.json();

      setResponse(
        payload,
      );

      if (!apiResponse.ok) {
        setError(
          payload.error ??
            `HTTP ${apiResponse.status}`,
        );
      }
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unknown runtime brain dashboard error.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",
        padding:
          "32px 20px 80px",
      }}
    >
      <div
        style={{
          width:
            "min(1180px, 100%)",
          margin:
            "0 auto",
        }}
      >
        <section
          style={{
            marginBottom:
              28,
          }}
        >
          <div
            style={{
              fontSize:
                12,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.12em",
              opacity:
                0.55,
              marginBottom:
                10,
            }}
          >
            HERMETICUM B.C.E.
            · AI JOKER-C2
          </div>

          <h1
            style={{
              margin:
                0,
              fontSize:
                "clamp(32px, 5vw, 56px)",
              letterSpacing:
                "-0.04em",
            }}
          >
            Runtime Operations
          </h1>

          <p
            style={{
              maxWidth:
                820,
              lineHeight:
                1.7,
              opacity:
                0.72,
              fontSize:
                16,
            }}
          >
            Governed control
            surface for the
            Runtime Brain,
            Scheduler,
            scientific
            decision engine and
            improvement planner.
            Execution remains
            bounded by explicit
            authorization and
            fail-closed
            governance.
          </p>
        </section>

        <form
          onSubmit={
            runScheduler
          }
          style={{
            border:
              "1px solid rgba(255,255,255,0.12)",
            borderRadius:
              20,
            padding:
              22,
            marginBottom:
              24,
          }}
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap:
                16,
              alignItems:
                "end",
            }}
          >
            <label>
              <div
                style={{
                  fontSize:
                    13,
                  marginBottom:
                    8,
                  opacity:
                    0.7,
                }}
              >
                Scheduler mode
              </div>

              <select
                value={
                  mode
                }
                onChange={(
                  event,
                ) =>
                  setMode(
                    event
                      .target
                      .value as SchedulerMode,
                  )
                }
                style={{
                  width:
                    "100%",
                  minHeight:
                    44,
                  borderRadius:
                    10,
                  padding:
                    "0 12px",
                }}
              >
                <option value="MANUAL">
                  MANUAL
                </option>

                <option value="INTERVAL">
                  INTERVAL
                </option>

                <option value="COMMIT">
                  COMMIT
                </option>

                <option value="PRE_RELEASE">
                  PRE_RELEASE
                </option>
              </select>
            </label>

            <button
              type="submit"
              disabled={
                loading
              }
              style={{
                minHeight:
                  44,
                borderRadius:
                  10,
                padding:
                  "0 18px",
                cursor:
                  loading
                    ? "wait"
                    : "pointer",
                fontWeight:
                  700,
              }}
            >
              {loading
                ? "Running..."
                : "Run Scheduler"}
            </button>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                runBrainDirectly
              }
              style={{
                minHeight:
                  44,
                borderRadius:
                  10,
                padding:
                  "0 18px",
                cursor:
                  loading
                    ? "wait"
                    : "pointer",
                fontWeight:
                  700,
              }}
            >
              Run Brain Directly
            </button>
          </div>
        </form>

        {error ? (
          <div
            style={{
              ...statusStyle(
                "BLOCKED",
              ),
              borderRadius:
                14,
              padding:
                16,
              marginBottom:
                24,
            }}
          >
            <strong>
              Runtime error
            </strong>

            <div
              style={{
                marginTop:
                  8,
                fontFamily:
                  "monospace",
                fontSize:
                  13,
              }}
            >
              {error}
            </div>
          </div>
        ) : null}

        <section
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap:
              14,
            marginBottom:
              24,
          }}
        >
          <StatusCard
            title="API"
            value={
              response?.status
            }
          />

          <StatusCard
            title="Scheduler"
            value={
              response
                ?.scheduler
                ?.status ??
              "—"
            }
            description={
              response
                ?.scheduler
                ?.reason
            }
          />

          <StatusCard
            title="Runner"
            value={
              response
                ?.runner
                ?.status ??
              "—"
            }
          />

          <StatusCard
            title="Runtime Brain"
            value={
              brainResult
                ?.status ??
              "—"
            }
            description={
              brainResult
                ?.decision
            }
          />

          <StatusCard
            title="Scientific Cycle"
            value={
              scientificCycle
                ?.status ??
              "—"
            }
          />

          <StatusCard
            title="Improvement Plan"
            value={
              improvementPlan
                ?.status ??
              "—"
            }
            description={
              improvementPlan
                ?.decision
            }
          />
        </section>

        <section
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap:
              14,
            marginBottom:
              24,
          }}
        >
          <StatusCard
            title="Capability Score"
            value={
              scientificCycle
                ?.summary
                ?.capabilityScore
            }
          />

          <StatusCard
            title="Registered Capabilities"
            value={
              scientificCycle
                ?.summary
                ?.registeredCapabilities
            }
          />

          <StatusCard
            title="Findings"
            value={
              scientificCycle
                ?.summary
                ?.findings
            }
          />

          <StatusCard
            title="Hypotheses"
            value={
              scientificCycle
                ?.summary
                ?.scientificHypotheses
            }
          />

          <StatusCard
            title="Experiments"
            value={
              scientificCycle
                ?.summary
                ?.experimentCandidates
            }
          />

          <StatusCard
            title="Experiment Score"
            value={
              scientificCycle
                ?.summary
                ?.selectedExperimentScore
            }
          />
        </section>

        <section
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap:
              20,
            marginBottom:
              24,
          }}
        >
          <div
            style={{
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius:
                18,
              padding:
                20,
            }}
          >
            <h2
              style={{
                marginTop:
                  0,
              }}
            >
              Scientific Decision
            </h2>

            <StatusCard
              title="Decision"
              value={
                scientificDecision
                  ?.decision ??
                "—"
              }
              description={
                scientificDecision
                  ?.status
              }
            />

            <div
              style={{
                marginTop:
                  16,
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap:
                  10,
              }}
            >
              <StatusCard
                title="Score"
                value={
                  scientificDecision
                    ?.evidence
                    ?.totalScore
                }
              />

              <StatusCard
                title="Margin"
                value={
                  scientificDecision
                    ?.evidence
                    ?.scoreMargin
                }
              />

              <StatusCard
                title="Competitor"
                value={
                  scientificDecision
                    ?.evidence
                    ?.competingCandidateScore
                }
              />
            </div>
          </div>

          <div
            style={{
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius:
                18,
              padding:
                20,
            }}
          >
            <h2
              style={{
                marginTop:
                  0,
              }}
            >
              Improvement Plan
            </h2>

            <StatusCard
              title="Steps"
              value={
                improvementPlan
                  ?.summary
                  ?.totalSteps
              }
            />

            <div
              style={{
                marginTop:
                  16,
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap:
                  10,
              }}
            >
              <StatusCard
                title="Files"
                value={
                  improvementPlan
                    ?.summary
                    ?.estimatedChangedFiles
                }
              />

              <StatusCard
                title="Lines"
                value={
                  improvementPlan
                    ?.summary
                    ?.estimatedChangedLines
                }
              />

              <StatusCard
                title="Builds"
                value={
                  improvementPlan
                    ?.summary
                    ?.estimatedBuildExecutions
                }
              />

              <StatusCard
                title="Operator Minutes"
                value={
                  improvementPlan
                    ?.summary
                    ?.estimatedOperatorMinutes
                }
              />
            </div>
          </div>
        </section>

        <section
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap:
              20,
            marginBottom:
              24,
          }}
        >
          <div
            style={{
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius:
                18,
              padding:
                20,
            }}
          >
            <h2
              style={{
                marginTop:
                  0,
              }}
            >
              Decision Gates
            </h2>

            {scientificDecision
              ?.gates
              ?.length ? (
              scientificDecision.gates.map(
                (
                  gate,
                  index,
                ) => (
                  <div
                    key={
                      gate.id ??
                      index
                    }
                    style={{
                      padding:
                        "12px 0",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap:
                          16,
                      }}
                    >
                      <strong>
                        {
                          gate.label ??
                          gate.id
                        }
                      </strong>

                      <span>
                        {gate.passed
                          ? "PASS"
                          : "FAIL"}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop:
                          6,
                        opacity:
                          0.68,
                        fontSize:
                          13,
                        lineHeight:
                          1.5,
                      }}
                    >
                      {
                        gate.description
                      }
                    </div>
                  </div>
                ),
              )
            ) : (
              <div
                style={{
                  opacity:
                    0.55,
                }}
              >
                No gate data yet.
              </div>
            )}
          </div>

          <div
            style={{
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius:
                18,
              padding:
                20,
            }}
          >
            <h2
              style={{
                marginTop:
                  0,
              }}
            >
              Governance Boundary
            </h2>

            <BooleanBoundary
              label="Read only"
              value={
                boundary?.readOnly
              }
              expected={
                true
              }
            />

            <BooleanBoundary
              label="Fail closed"
              value={
                boundary?.failClosed
              }
              expected={
                true
              }
            />

            <BooleanBoundary
              label="Human authorization required"
              value={
                boundary
                  ?.humanAuthorizationRequired
              }
              expected={
                true
              }
            />

            <BooleanBoundary
              label="Automatic execution"
              value={
                boundary
                  ?.automaticExecution
              }
              expected={
                false
              }
            />

            <BooleanBoundary
              label="Automatic selection"
              value={
                boundary
                  ?.automaticSelection
              }
              expected={
                false
              }
            />

            <BooleanBoundary
              label="Automatic persistence"
              value={
                boundary
                  ?.automaticPersistence
              }
              expected={
                false
              }
            />

            <BooleanBoundary
              label="Automatic recall"
              value={
                boundary
                  ?.automaticRecall
              }
              expected={
                false
              }
            />

            <BooleanBoundary
              label="Automatic repository mutation"
              value={
                boundary
                  ?.automaticRepositoryMutation
              }
              expected={
                false
              }
            />

            <BooleanBoundary
              label="Legal certification"
              value={
                boundary
                  ?.legalCertification
              }
              expected={
                false
              }
            />
          </div>
        </section>

        <section
          style={{
            border:
              "1px solid rgba(255,255,255,0.12)",
            borderRadius:
              18,
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              padding:
                "16px 20px",
              borderBottom:
                "1px solid rgba(255,255,255,0.1)",
              fontWeight:
                700,
            }}
          >
            Raw Runtime Evidence
          </div>

          <pre
            style={{
              margin:
                0,
              padding:
                20,
              overflowX:
                "auto",
              maxHeight:
                620,
              fontSize:
                12,
              lineHeight:
                1.6,
              whiteSpace:
                "pre-wrap",
              wordBreak:
                "break-word",
            }}
          >
            {rawJson ||
              "No runtime execution yet."}
          </pre>
        </section>
      </div>
    </main>
  );
}

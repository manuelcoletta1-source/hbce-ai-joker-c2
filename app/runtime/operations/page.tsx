"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RuntimeOperationTone =
  | "PASS"
  | "ACTIVE"
  | "EXECUTED"
  | "READY"
  | "DUE"
  | "REVIEW"
  | "BLOCKED"
  | "FAIL"
  | "UNKNOWN";

type RuntimeOperationSignal = {
  key: string;
  value: string;
  tone: RuntimeOperationTone;
  source: string;
};

type RuntimeOperationsResponse = {
  ok: boolean;
  status:
    | "HBCE_RUNTIME_OPERATIONS_PASS"
    | "HBCE_RUNTIME_OPERATIONS_REVIEW_REQUIRED"
    | "HBCE_RUNTIME_OPERATIONS_BLOCKED"
    | "HBCE_RUNTIME_OPERATIONS_FAIL_CLOSED";

  operationalStatus:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "BLOCKED"
    | "FAIL_CLOSED";

  revision: string;
  generatedAt: string;
  product: string;
  runtime: string;

  projection: {
    revision: string;

    operationalStatus:
      | "PASS"
      | "REVIEW_REQUIRED"
      | "BLOCKED"
      | "FAIL_CLOSED";

    signals: RuntimeOperationSignal[];

    summary: {
      totalSignals: number;
      pass: number;
      active: number;
      executed: number;
      ready: number;
      due: number;
      review: number;
      blocked: number;
      failed: number;
      unknown: number;
    };

    governance: {
      failClosed: boolean;
      humanAuthorizationRequired: true;
      autonomousAuthorization: false;
      legalCertification: false;
    };
  };

  sources: {
    brain: {
      available: boolean;
      httpStatus: number;
      error: string | null;
    };

    scheduler: {
      available: boolean;
      httpStatus: number;
      error: string | null;
    };
  };

  governance: {
    humanAuthorizationRequired: true;
    autonomousAuthorization: false;
    runtimeActivationFromApi: false;
    noSubmitFromCode: true;
    failClosed: boolean;
    legalCertification: false;
  };
};

type LoadState = {
  loading: boolean;
  response: RuntimeOperationsResponse | null;
  httpStatus: number | null;
  error: string | null;
};

function toneStyle(
  tone: RuntimeOperationTone,
): React.CSSProperties {
  switch (tone) {
    case "PASS":
    case "ACTIVE":
    case "EXECUTED":
    case "READY":
      return {
        borderColor: "#14532d",
        background: "rgba(20, 83, 45, 0.18)",
      };

    case "DUE":
    case "REVIEW":
      return {
        borderColor: "#854d0e",
        background: "rgba(133, 77, 14, 0.18)",
      };

    case "BLOCKED":
      return {
        borderColor: "#7f1d1d",
        background: "rgba(127, 29, 29, 0.18)",
      };

    case "FAIL":
      return {
        borderColor: "#991b1b",
        background: "rgba(153, 27, 27, 0.25)",
      };

    default:
      return {
        borderColor: "#334155",
        background: "rgba(51, 65, 85, 0.15)",
      };
  }
}

function statusStyle(
  status:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "BLOCKED"
    | "FAIL_CLOSED",
): React.CSSProperties {
  switch (status) {
    case "PASS":
      return {
        borderColor: "#166534",
        background: "rgba(22, 101, 52, 0.18)",
        color: "#bbf7d0",
      };

    case "REVIEW_REQUIRED":
      return {
        borderColor: "#854d0e",
        background: "rgba(133, 77, 14, 0.18)",
        color: "#fde68a",
      };

    case "BLOCKED":
      return {
        borderColor: "#7f1d1d",
        background: "rgba(127, 29, 29, 0.18)",
        color: "#fecaca",
      };

    case "FAIL_CLOSED":
      return {
        borderColor: "#991b1b",
        background: "rgba(153, 27, 27, 0.25)",
        color: "#fecaca",
      };
  }
}

async function loadOperations(): Promise<{
  httpStatus: number;
  data: RuntimeOperationsResponse;
}> {
  const response = await fetch(
    "/api/runtime/operations",
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data =
    (await response.json()) as RuntimeOperationsResponse;

  return {
    httpStatus: response.status,
    data,
  };
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #252b36",
        borderRadius: 12,
        padding: 18,
        background: "#0c1118",
      }}
    >
      <div
        style={{
          color: "#8995a7",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 5,
          color: "#8995a7",
          fontSize: 12,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

export default function RuntimeOperationsPage() {
  const [state, setState] = useState<LoadState>({
    loading: true,
    response: null,
    httpStatus: null,
    error: null,
  });

  const [refreshing, setRefreshing] =
    useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const result =
        await loadOperations();

      setState({
        loading: false,
        response: result.data,
        httpStatus: result.httpStatus,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        response: null,
        httpStatus: null,
        error:
          error instanceof Error
            ? error.message
            : "Unknown operations API failure.",
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const response = state.response;

  const signals =
    response?.projection.signals ?? [];

  const summary =
    response?.projection.summary;

  const availableSources = useMemo(() => {
    if (!response) {
      return 0;
    }

    return [
      response.sources.brain.available,
      response.sources.scheduler.available,
    ].filter(Boolean).length;
  }, [response]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#070b10",
        color: "#e5e7eb",
        padding: "32px 20px 64px",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 28,
          }}
        >
          <div
            style={{
              color: "#8b98aa",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            HBCE · AI JOKER-C2
          </div>

          <h1
            style={{
              margin: 0,
              fontSize:
                "clamp(28px, 5vw, 46px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
            }}
          >
            Runtime Operations
          </h1>

          <p
            style={{
              maxWidth: 820,
              margin: "14px 0 0",
              color: "#9aa6b6",
              fontSize: 15,
              lineHeight: 1.65,
            }}
          >
            Governed operational projection
            produced by the authoritative
            runtime operations API.
            This surface observes state.
            It does not grant authorization,
            activate autonomous execution,
            or produce legal certification.
          </p>
        </header>

        {state.error ? (
          <section
            style={{
              border: "1px solid #991b1b",
              borderRadius: 12,
              padding: 18,
              marginBottom: 24,
              background:
                "rgba(153, 27, 27, 0.18)",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                color: "#fecaca",
              }}
            >
              OPERATIONS API UNAVAILABLE
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#fca5a5",
                fontSize: 13,
              }}
            >
              {state.error}
            </div>

            <div
              style={{
                marginTop: 10,
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Governance defaults to
              FAIL-CLOSED when the
              authoritative operational
              projection cannot be read.
            </div>
          </section>
        ) : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <MetricCard
            title="Operational Status"
            value={
              response?.operationalStatus ??
              (state.loading
                ? "LOADING"
                : "FAIL_CLOSED")
            }
            detail="authoritative aggregated state"
          />

          <MetricCard
            title="Runtime Sources"
            value={`${availableSources}/2`}
            detail="Brain + Scheduler"
          />

          <MetricCard
            title="Signals"
            value={
              summary?.totalSignals ?? 0
            }
            detail="normalized operational signals"
          />

          <MetricCard
            title="Legal Certification"
            value="FALSE"
            detail="technical proof only"
          />
        </section>

        {response ? (
          <section
            style={{
              border: "1px solid #252b36",
              borderRadius: 12,
              background: "#0c1118",
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom:
                  "1px solid #252b36",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 800,
                  }}
                >
                  Runtime Governance State
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: "#8995a7",
                    fontSize: 12,
                  }}
                >
                  {response.revision}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    border: "1px solid",
                    borderRadius: 999,
                    padding: "7px 11px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    ...statusStyle(
                      response.operationalStatus,
                    ),
                  }}
                >
                  {
                    response.operationalStatus
                  }
                </span>

                <button
                  type="button"
                  onClick={() =>
                    void refresh()
                  }
                  disabled={refreshing}
                  style={{
                    border:
                      "1px solid #394252",
                    borderRadius: 8,
                    background: refreshing
                      ? "#111827"
                      : "#161d27",
                    color: "#e5e7eb",
                    padding: "9px 13px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: refreshing
                      ? "default"
                      : "pointer",
                  }}
                >
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh state"}
                </button>
              </div>
            </div>

            <div
              style={{
                padding: 18,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 10,
              }}
            >
              <MetricCard
                title="PASS"
                value={summary?.pass ?? 0}
                detail="verified signals"
              />

              <MetricCard
                title="ACTIVE"
                value={summary?.active ?? 0}
                detail="active runtime state"
              />

              <MetricCard
                title="EXECUTED"
                value={
                  summary?.executed ?? 0
                }
                detail="executed state records"
              />

              <MetricCard
                title="DUE"
                value={summary?.due ?? 0}
                detail="pending operational timing"
              />

              <MetricCard
                title="REVIEW"
                value={
                  summary?.review ?? 0
                }
                detail="human review required"
              />

              <MetricCard
                title="BLOCKED"
                value={
                  summary?.blocked ?? 0
                }
                detail="governance blocked"
              />

              <MetricCard
                title="FAILED"
                value={
                  summary?.failed ?? 0
                }
                detail="runtime failure signals"
              />

              <MetricCard
                title="UNKNOWN"
                value={
                  summary?.unknown ?? 0
                }
                detail="unclassified signals"
              />
            </div>
          </section>
        ) : null}

        <section
          style={{
            border: "1px solid #252b36",
            borderRadius: 12,
            background: "#0c1118",
            marginBottom: 24,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderBottom:
                "1px solid #252b36",
            }}
          >
            <div
              style={{
                fontWeight: 800,
              }}
            >
              Operational Signals
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#8995a7",
                fontSize: 12,
              }}
            >
              Normalized by
              runtime-operations-projection.
            </div>
          </div>

          <div
            style={{
              padding: 18,
            }}
          >
            {state.loading ? (
              <div
                style={{
                  color: "#8995a7",
                }}
              >
                Loading operational
                projection...
              </div>
            ) : signals.length === 0 ? (
              <div
                style={{
                  color: "#8995a7",
                  fontSize: 14,
                }}
              >
                No operational signals
                available.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 10,
                }}
              >
                {signals.map(
                  (signal, index) => (
                    <article
                      key={`${signal.source}:${signal.key}:${signal.value}:${index}`}
                      style={{
                        border:
                          "1px solid",
                        borderRadius: 9,
                        padding: 12,
                        ...toneStyle(
                          signal.tone,
                        ),
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 10,
                          alignItems:
                            "flex-start",
                        }}
                      >
                        <code
                          style={{
                            fontSize: 11,
                            color:
                              "#a7b2c1",
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {signal.key}
                        </code>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          {signal.tone}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 9,
                          fontSize: 14,
                          fontWeight: 750,
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {signal.value}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color:
                            "#8995a7",
                          fontSize: 10,
                        }}
                      >
                        {signal.source}
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {response ? (
          <section
            style={{
              border: "1px solid #252b36",
              borderRadius: 12,
              background: "#0c1118",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom:
                  "1px solid #252b36",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                }}
              >
                Source Integrity
              </div>
            </div>

            <div
              style={{
                padding: 18,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {(
                [
                  [
                    "Runtime Brain",
                    response.sources.brain,
                  ],
                  [
                    "Runtime Scheduler",
                    response.sources.scheduler,
                  ],
                ] as const
              ).map(([name, source]) => (
                <div
                  key={name}
                  style={{
                    border:
                      "1px solid #252b36",
                    borderRadius: 9,
                    padding: 14,
                    background:
                      "#070a0f",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 750,
                    }}
                  >
                    {name}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color:
                        source.available
                          ? "#86efac"
                          : "#fca5a5",
                    }}
                  >
                    {source.available
                      ? "AVAILABLE"
                      : "UNAVAILABLE"}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: "#8995a7",
                      fontSize: 11,
                    }}
                  >
                    HTTP{" "}
                    {source.httpStatus}
                  </div>

                  {source.error ? (
                    <div
                      style={{
                        marginTop: 8,
                        color:
                          "#fca5a5",
                        fontSize: 11,
                      }}
                    >
                      {source.error}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <footer
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop:
              "1px solid #252b36",
            color: "#798597",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <strong
            style={{
              color: "#aab4c3",
            }}
          >
            Governance boundary
          </strong>

          <br />

          IPR identifies · EVT traces ·
          OPC proves · HBCE governs ·
          MATRIX organizes · AI JOKER-C2
          executes.

          <br />

          HUMAN_AUTHORIZATION_REQUIRED ·
          NO_RUNTIME_ACTIVATION ·
          NO_SUBMIT_FROM_CODE ·
          FAIL_CLOSED ·
          LEGAL_CERTIFICATION=false
        </footer>
      </div>
    </main>
  );
}

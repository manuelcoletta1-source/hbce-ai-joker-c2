"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type JsonObject = Record<string, unknown>;

type EndpointState = {
  endpoint: string;
  label: string;
  loading: boolean;
  ok: boolean;
  httpStatus: number | null;
  data: unknown;
  error: string | null;
  fetchedAt: string | null;
};

type SignalTone =
  | "PASS"
  | "ACTIVE"
  | "EXECUTED"
  | "READY"
  | "DUE"
  | "REVIEW"
  | "BLOCKED"
  | "FAIL"
  | "UNKNOWN";

type RuntimeSignal = {
  key: string;
  value: string;
  tone: SignalTone;
  source: string;
};

const ENDPOINTS = [
  {
    label: "Runtime Brain",
    endpoint: "/api/runtime/brain",
  },
  {
    label: "Runtime Scheduler",
    endpoint: "/api/runtime/scheduler",
  },
] as const;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function classifyTone(value: string): SignalTone {
  const normalized = value.toUpperCase();

  if (
    normalized.includes("FAIL") ||
    normalized.includes("ERROR") ||
    normalized.includes("REJECTED")
  ) {
    return "FAIL";
  }

  if (
    normalized.includes("BLOCKED") ||
    normalized.includes("DENIED") ||
    normalized.includes("NO_ACTION")
  ) {
    return "BLOCKED";
  }

  if (
    normalized.includes("REVIEW") ||
    normalized.includes("MANUAL") ||
    normalized.includes("AUTHORIZATION_REQUIRED")
  ) {
    return "REVIEW";
  }

  if (normalized.includes("DUE")) {
    return "DUE";
  }

  if (normalized.includes("EXECUTED")) {
    return "EXECUTED";
  }

  if (
    normalized.includes("PASS") ||
    normalized.includes("VALID") ||
    normalized.includes("VERIFIED")
  ) {
    return "PASS";
  }

  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("ENABLED") ||
    normalized.includes("BOUND")
  ) {
    return "ACTIVE";
  }

  if (
    normalized.includes("READY") ||
    normalized.includes("COMPLETED") ||
    normalized.includes("AVAILABLE")
  ) {
    return "READY";
  }

  return "UNKNOWN";
}

function collectSignals(
  value: unknown,
  source: string,
  prefix = "",
  depth = 0,
): RuntimeSignal[] {
  if (depth > 5) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectSignals(
        item,
        source,
        prefix ? `${prefix}.${index}` : String(index),
        depth + 1,
      ),
    );
  }

  if (isJsonObject(value)) {
    return Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (
        child === null ||
        typeof child === "string" ||
        typeof child === "number" ||
        typeof child === "boolean"
      ) {
        const text = stringifyValue(child);

        const interestingKey =
          /status|state|decision|mode|action|authorization|execution|operational|verification|legalCertification|runtime|scheduler|runner|cycle|review|ready|due|blocked|result/i.test(
            key,
          );

        const interestingValue =
          /PASS|FAIL|ACTIVE|BLOCKED|READY|DUE|REVIEW|EXECUTED|MANUAL|NO_ACTION|VERIFIED|COMPLETED|DENIED|REQUIRED/i.test(
            text,
          );

        if (!interestingKey && !interestingValue) {
          return [];
        }

        return [
          {
            key: path,
            value: text,
            tone: classifyTone(text),
            source,
          },
        ];
      }

      return collectSignals(child, source, path, depth + 1);
    });
  }

  return [];
}

async function fetchEndpoint(
  label: string,
  endpoint: string,
): Promise<EndpointState> {
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    let data: unknown = null;

    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          raw: text,
        };
      }
    }

    return {
      endpoint,
      label,
      loading: false,
      ok: response.ok,
      httpStatus: response.status,
      data,
      error: response.ok
        ? null
        : `HTTP ${response.status} ${response.statusText}`,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      endpoint,
      label,
      loading: false,
      ok: false,
      httpStatus: null,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown runtime endpoint failure.",
      fetchedAt: new Date().toISOString(),
    };
  }
}

function toneStyle(tone: SignalTone): React.CSSProperties {
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

function EndpointPanel({ state }: { state: EndpointState }) {
  return (
    <section
      style={{
        border: "1px solid #252b36",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0c1118",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px",
          borderBottom: "1px solid #252b36",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {state.label}
          </div>

          <code
            style={{
              display: "block",
              marginTop: 5,
              color: "#8995a7",
              fontSize: 12,
            }}
          >
            {state.endpoint}
          </code>
        </div>

        <span
          style={{
            border: `1px solid ${
              state.loading
                ? "#475569"
                : state.ok
                  ? "#166534"
                  : "#991b1b"
            }`,
            borderRadius: 999,
            padding: "5px 9px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          {state.loading
            ? "LOADING"
            : state.ok
              ? "AVAILABLE"
              : "UNAVAILABLE"}
        </span>
      </div>

      <div style={{ padding: 18 }}>
        {state.error ? (
          <div
            style={{
              border: "1px solid #7f1d1d",
              borderRadius: 8,
              padding: 12,
              color: "#fecaca",
              background: "rgba(127, 29, 29, 0.15)",
            }}
          >
            {state.error}
          </div>
        ) : null}

        <pre
          style={{
            margin: state.error ? "14px 0 0" : 0,
            padding: 14,
            borderRadius: 8,
            background: "#070a0f",
            border: "1px solid #1f2937",
            color: "#cbd5e1",
            overflowX: "auto",
            fontSize: 12,
            lineHeight: 1.55,
            maxHeight: 420,
          }}
        >
          {state.loading
            ? "Waiting for runtime state..."
            : JSON.stringify(state.data, null, 2)}
        </pre>
      </div>
    </section>
  );
}

export default function RuntimeOperationsPage() {
  const [states, setStates] = useState<EndpointState[]>(
    ENDPOINTS.map(({ endpoint, label }) => ({
      endpoint,
      label,
      loading: true,
      ok: false,
      httpStatus: null,
      data: null,
      error: null,
      fetchedAt: null,
    })),
  );

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const nextStates = await Promise.all(
        ENDPOINTS.map(({ endpoint, label }) =>
          fetchEndpoint(label, endpoint),
        ),
      );

      setStates(nextStates);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signals = useMemo(() => {
    const collected = states.flatMap((state) =>
      collectSignals(state.data, state.label),
    );

    const unique = new Map<string, RuntimeSignal>();

    for (const signal of collected) {
      unique.set(
        `${signal.source}:${signal.key}:${signal.value}`,
        signal,
      );
    }

    return Array.from(unique.values()).slice(0, 40);
  }, [states]);

  const availableCount = states.filter((state) => state.ok).length;
  const unavailableCount = states.length - availableCount;

  const failClosed =
    unavailableCount > 0 ||
    signals.some(
      (signal) =>
        signal.tone === "BLOCKED" ||
        signal.tone === "FAIL" ||
        signal.tone === "REVIEW",
    );

  const legalCertificationSignals = signals.filter((signal) =>
    signal.key.toLowerCase().includes("legalcertification"),
  );

  const legalCertification =
    legalCertificationSignals.length > 0
      ? legalCertificationSignals.every(
          (signal) => signal.value.toLowerCase() === "false",
        )
        ? false
        : null
      : false;

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
              fontSize: "clamp(28px, 5vw, 46px)",
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
            Read-only operational projection of the governed runtime.
            This surface observes runtime state and governance signals.
            It does not grant authorization, activate autonomous execution,
            or convert technical proof into legal certification.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
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
              Runtime APIs
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {availableCount}/{states.length}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#8995a7",
                fontSize: 12,
              }}
            >
              operational endpoints available
            </div>
          </div>

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
              Governance
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {failClosed ? "FAIL-CLOSED" : "OBSERVING"}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#8995a7",
                fontSize: 12,
              }}
            >
              no implicit authorization
            </div>
          </div>

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
              Signals
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {signals.length}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#8995a7",
                fontSize: 12,
              }}
            >
              runtime signals projected
            </div>
          </div>

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
              Legal Certification
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {legalCertification === false ? "FALSE" : "UNKNOWN"}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#8995a7",
                fontSize: 12,
              }}
            >
              OPC remains technical proof
            </div>
          </div>
        </section>

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
              borderBottom: "1px solid #252b36",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
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
                State extracted from authoritative runtime API responses.
              </div>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              style={{
                border: "1px solid #394252",
                borderRadius: 8,
                background: refreshing ? "#111827" : "#161d27",
                color: "#e5e7eb",
                padding: "9px 13px",
                fontSize: 12,
                fontWeight: 700,
                cursor: refreshing ? "default" : "pointer",
              }}
            >
              {refreshing ? "Refreshing..." : "Refresh state"}
            </button>
          </div>

          <div
            style={{
              padding: 18,
            }}
          >
            {signals.length === 0 ? (
              <div
                style={{
                  color: "#8995a7",
                  fontSize: 14,
                }}
              >
                No runtime signals available.
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
                {signals.map((signal) => (
                  <article
                    key={`${signal.source}:${signal.key}:${signal.value}`}
                    style={{
                      border: "1px solid",
                      borderRadius: 9,
                      padding: 12,
                      ...toneStyle(signal.tone),
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <code
                        style={{
                          fontSize: 11,
                          color: "#a7b2c1",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {signal.key}
                      </code>

                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
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
                        overflowWrap: "anywhere",
                      }}
                    >
                      {signal.value}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        color: "#8995a7",
                        fontSize: 10,
                      }}
                    >
                      {signal.source}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 16,
          }}
        >
          {states.map((state) => (
            <EndpointPanel
              key={state.endpoint}
              state={state}
            />
          ))}
        </div>

        <footer
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid #252b36",
            color: "#798597",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "#aab4c3" }}>
            Governance boundary
          </strong>
          <br />
          IPR identifies · EVT traces · OPC proves · HBCE governs ·
          MATRIX organizes · AI JOKER-C2 executes.
          <br />
          Human authorization remains external to this read-only
          operational surface.
        </footer>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RequestStatus =
  | "IDLE"
  | "LOADING"
  | "SUCCESS"
  | "ERROR";

type ApiPanelState = {
  status: RequestStatus;
  httpStatus: number | null;
  payload: unknown;
  error: string | null;
  receivedAt: string | null;
};

const INITIAL_PANEL_STATE: ApiPanelState = {
  status: "IDLE",
  httpStatus: null,
  payload: null,
  error: null,
  receivedAt: null
};

const PAGE_BOUNDARY =
  "This R&D database console provides read-only HBCE persistent database health visibility. Browser-based schema initialization is not exposed by this page. It does not create legal certification, official identity issuance, public authority validation, eIDAS qualified trust service output or qualified timestamping.";

function nowIso(): string {
  return new Date().toISOString();
}

function stringifyPayload(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getStatusLabel(state: ApiPanelState): string {
  if (state.status === "IDLE") {
    return "Not executed";
  }

  if (state.status === "LOADING") {
    return "Loading";
  }

  if (state.status === "SUCCESS") {
    return "Success";
  }

  return "Error";
}

function extractBoolean(value: unknown, path: string[]): boolean | null {
  let current: unknown = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "boolean" ? current : null;
}

function extractString(value: unknown, path: string[]): string | null {
  let current: unknown = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : null;
}

function buildSummary(payload: unknown): string[] {
  const databaseConfigured = extractBoolean(payload, [
    "database",
    "configured"
  ]);
  const databaseAvailable = extractBoolean(payload, [
    "database",
    "available"
  ]);
  const databaseStatus = extractString(payload, [
    "database",
    "status"
  ]);
  const schemaVersion =
    extractString(payload, ["boundary", "schemaVersion"]) ||
    extractString(payload, ["schema", "version"]);
  const persistenceMode =
    extractString(payload, ["boundary", "persistenceMode"]) ||
    extractString(payload, ["schema", "persistenceMode"]);

  return [
    `Database configured: ${
      databaseConfigured === null ? "unknown" : String(databaseConfigured)
    }`,
    `Database available: ${
      databaseAvailable === null ? "unknown" : String(databaseAvailable)
    }`,
    `Database status: ${databaseStatus || "unknown"}`,
    `Schema version: ${schemaVersion || "unknown"}`,
    `Persistence mode: ${persistenceMode || "unknown"}`
  ];
}

export default function HbceDatabasePage() {
  const [healthState, setHealthState] =
    useState<ApiPanelState>(INITIAL_PANEL_STATE);

  const healthSummary = useMemo(
    () => buildSummary(healthState.payload),
    [healthState.payload]
  );


  const requestJson = useCallback(
    async (
      method: "GET" | "POST",
      path: string,
      setState: (state: ApiPanelState) => void
    ) => {
      setState({
        status: "LOADING",
        httpStatus: null,
        payload: null,
        error: null,
        receivedAt: null
      });

      try {
        const response = await fetch(path, {
          method,
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        });

        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        setState({
          status: response.ok ? "SUCCESS" : "ERROR",
          httpStatus: response.status,
          payload,
          error: response.ok
            ? null
            : `HTTP ${response.status} ${response.statusText}`,
          receivedAt: nowIso()
        });
      } catch (error) {
        setState({
          status: "ERROR",
          httpStatus: null,
          payload: null,
          error:
            error instanceof Error
              ? error.message
              : "UNKNOWN_DATABASE_CONSOLE_ERROR",
          receivedAt: nowIso()
        });
      }
    },
    []
  );

  const runHealthCheck = useCallback(() => {
    void requestJson(
      "GET",
      "/api/database/health",
      setHealthState
    );
  }, [requestJson]);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 34%), #05070a",
        color: "#f5f7fb",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto"
        }}
      >
        <header
          style={{
            display: "grid",
            gap: "12px",
            marginBottom: "28px"
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: "12px"
            }}
          >
            HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: 1
            }}
          >
            HBCE Database Console
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "820px",
              color: "#cbd5e1",
              fontSize: "17px",
              lineHeight: 1.6
            }}
          >
            R&amp;D read-only console for checking the persistent
            HBCE/IPR database used by AI JOKER-C2 account sessions, chat
            continuity, memory records, EVT records, OPC proof receipts and
            MATRIX Transformative Memory.
          </p>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "14px"
            }}
          >
            HERMETICUM B.C.E. S.r.l.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "18px"
          }}
        >
          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background: "rgba(15,23,42,0.72)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)"
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "22px"
              }}
            >
              Database health
            </h2>

            <p
              style={{
                marginTop: 0,
                color: "#cbd5e1",
                lineHeight: 1.55
              }}
            >
              Checks whether Vercel can reach the configured Neon/Postgres
              database through DATABASE_URL or POSTGRES_URL.
            </p>

            <button
              type="button"
              onClick={runHealthCheck}
              disabled={healthState.status === "LOADING"}
              style={{
                cursor:
                  healthState.status === "LOADING"
                    ? "not-allowed"
                    : "pointer",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "999px",
                padding: "10px 16px",
                background: "#f8fafc",
                color: "#020617",
                fontWeight: 700
              }}
            >
              {healthState.status === "LOADING"
                ? "Checking..."
                : "Run health check"}
            </button>

            <div
              style={{
                marginTop: "16px",
                color: "#e2e8f0",
                fontSize: "14px",
                lineHeight: 1.6
              }}
            >
              <strong>Status:</strong> {getStatusLabel(healthState)}
              {healthState.httpStatus ? (
                <>
                  <br />
                  <strong>HTTP:</strong> {healthState.httpStatus}
                </>
              ) : null}
              {healthState.receivedAt ? (
                <>
                  <br />
                  <strong>Received:</strong> {healthState.receivedAt}
                </>
              ) : null}
            </div>

            <ul
              style={{
                margin: "14px 0 0",
                paddingLeft: "18px",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.6
              }}
            >
              {healthSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>


        </section>

        <section
          style={{
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: "18px",
            padding: "18px",
            background: "rgba(2,6,23,0.78)",
            marginBottom: "18px"
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "20px"
            }}
          >
            Operational boundary
          </h2>

          <p
            style={{
              margin: 0,
              color: "#cbd5e1",
              lineHeight: 1.6
            }}
          >
            {PAGE_BOUNDARY}
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gap: "18px"
          }}
        >
          <details
            style={{
              border: "1px solid rgba(148,163,184,0.22)",
              borderRadius: "18px",
              padding: "18px",
              background: "rgba(2,6,23,0.78)"
            }}
            open
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 800,
                marginBottom: "12px"
              }}
            >
              Health response
            </summary>

            <pre
              style={{
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                padding: "16px",
                borderRadius: "14px",
                background: "#020617",
                color: "#dbeafe",
                fontSize: "13px",
                lineHeight: 1.5
              }}
            >
              {stringifyPayload(
                healthState.payload || {
                  status: healthState.status,
                  error: healthState.error
                }
              )}
            </pre>
          </details>


        </section>
      </section>
    </main>
  );
}

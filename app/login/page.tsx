"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RequestStatus = "IDLE" | "LOADING" | "SUCCESS" | "ERROR";

type ApiState = {
  status: RequestStatus;
  httpStatus: number | null;
  payload: unknown;
  error: string | null;
  receivedAt: string | null;
};

const INITIAL_API_STATE: ApiState = {
  status: "IDLE",
  httpStatus: null,
  payload: null,
  error: null,
  receivedAt: null
};

const HUMAN_IPR_CANONICAL = "IPR-88505FE91013DCFE97C56ED1";

const PAGE_BOUNDARY =
  "This page verifies an existing HBCE IPR account session for AI JOKER-C2. It does not create a new IPR password, does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

function nowIso(): string {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeHumanIpr(value: string): string {
  return value.trim().toUpperCase();
}

function stringifyPayload(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getStatusLabel(state: ApiState): string {
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

function extractString(value: unknown, path: string[]): string | null {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[key];
  }

  return typeof current === "string" && current.trim()
    ? current.trim()
    : null;
}

function extractBoolean(value: unknown, path: string[]): boolean | null {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[key];
  }

  return typeof current === "boolean" ? current : null;
}

function buildSessionSummary(payload: unknown): string[] {
  const authenticated = extractBoolean(payload, ["authenticated"]);
  const reason = extractString(payload, ["reason"]);
  const humanIpr =
    extractString(payload, ["session", "humanIpr"]) ||
    extractString(payload, ["accountProfile", "humanIpr"]);
  const accessSource = extractString(payload, ["access", "source"]);
  const matrixState = extractString(payload, ["matrix", "expectedState"]);
  const memoryScope = extractString(payload, ["memory", "expectedScope"]);
  const memoryPersistence = extractString(payload, [
    "memory",
    "persistenceMode"
  ]);

  return [
    `Authenticated: ${
      authenticated === null ? "unknown" : String(authenticated)
    }`,
    `Reason: ${reason || "unknown"}`,
    `Human IPR: ${humanIpr || "unknown"}`,
    `Access source: ${accessSource || "unknown"}`,
    `Matrix state: ${matrixState || "unknown"}`,
    `Memory scope: ${memoryScope || "unknown"}`,
    `Memory persistence: ${memoryPersistence || "unknown"}`
  ];
}

function buildLoginSummary(payload: unknown): string[] {
  const authenticated = extractBoolean(payload, ["authenticated"]);
  const mode = extractString(payload, ["mode"]);
  const humanIpr = extractString(payload, ["humanIpr"]);
  const accessSource = extractString(payload, ["access", "source"]);
  const matrixState = extractString(payload, ["matrix", "expectedState"]);
  const memoryScope = extractString(payload, ["memory", "expectedScope"]);
  const memoryPersistence = extractString(payload, [
    "memory",
    "persistenceMode"
  ]);
  const reason = extractString(payload, ["reason"]);
  const detail = extractString(payload, ["detail"]);

  return [
    `Authenticated: ${
      authenticated === null ? "unknown" : String(authenticated)
    }`,
    `Mode: ${mode || "unknown"}`,
    `Reason: ${reason || "unknown"}`,
    `Human IPR: ${humanIpr || "unknown"}`,
    `Access source: ${accessSource || "unknown"}`,
    `Matrix state: ${matrixState || "unknown"}`,
    `Memory scope: ${memoryScope || "unknown"}`,
    `Memory persistence: ${memoryPersistence || "unknown"}`,
    `Detail: ${detail || "none"}`
  ];
}

function isAuthenticated(payload: unknown): boolean {
  return extractBoolean(payload, ["authenticated"]) === true;
}

export default function HbceJokerLoginPage() {
  const [humanIpr, setHumanIpr] = useState(HUMAN_IPR_CANONICAL);
  const [password, setPassword] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("JOKER-C2 login device");
  const [loginState, setLoginState] = useState<ApiState>(INITIAL_API_STATE);
  const [sessionState, setSessionState] =
    useState<ApiState>(INITIAL_API_STATE);

  const loginSummary = useMemo(
    () => buildLoginSummary(loginState.payload),
    [loginState.payload]
  );

  const sessionSummary = useMemo(
    () => buildSessionSummary(sessionState.payload),
    [sessionState.payload]
  );

  const activeSession = useMemo(
    () => isAuthenticated(sessionState.payload),
    [sessionState.payload]
  );

  const loginSucceeded = useMemo(
    () => isAuthenticated(loginState.payload),
    [loginState.payload]
  );

  const runSessionCheck = useCallback(async () => {
    setSessionState({
      status: "LOADING",
      httpStatus: null,
      payload: null,
      error: null,
      receivedAt: null
    });

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        credentials: "include",
        cache: "no-store"
      });

      const payload = await response.json();

      setSessionState({
        status: response.ok ? "SUCCESS" : "ERROR",
        httpStatus: response.status,
        payload,
        error: response.ok
          ? null
          : `HTTP ${response.status} ${response.statusText}`,
        receivedAt: nowIso()
      });
    } catch (error) {
      setSessionState({
        status: "ERROR",
        httpStatus: null,
        payload: null,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_SESSION_CHECK_ERROR",
        receivedAt: nowIso()
      });
    }
  }, []);

  useEffect(() => {
    void runSessionCheck();
  }, [runSessionCheck]);

  const submitLogin = useCallback(async () => {
    const normalizedHumanIpr = normalizeHumanIpr(humanIpr);

    if (!normalizedHumanIpr) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "HUMAN_IPR_MISSING",
          detail: "Human IPR is required.",
          legalCertification: false
        },
        error: "Human IPR is required.",
        receivedAt: nowIso()
      });
      return;
    }

    if (!password) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "IPR_PASSWORD_MISSING",
          detail: "IPR password is required.",
          legalCertification: false
        },
        error: "IPR password is required.",
        receivedAt: nowIso()
      });
      return;
    }

    setLoginState({
      status: "LOADING",
      httpStatus: null,
      payload: null,
      error: null,
      receivedAt: null
    });

    try {
      const response = await fetch("/api/auth/ipr-login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          mode: "LOGIN",
          humanIpr: normalizedHumanIpr,
          password,
          deviceLabel,
          legalCertification: false
        })
      });

      const payload = await response.json();

      setLoginState({
        status: response.ok ? "SUCCESS" : "ERROR",
        httpStatus: response.status,
        payload,
        error: response.ok
          ? null
          : `HTTP ${response.status} ${response.statusText}`,
        receivedAt: nowIso()
      });

      if (response.ok) {
        await runSessionCheck();
      }
    } catch (error) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: null,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_IPR_LOGIN_ERROR",
        receivedAt: nowIso()
      });
    }
  }, [deviceLabel, humanIpr, password, runSessionCheck]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top, rgba(56,189,248,0.13), transparent 34%), #05070a",
        color: "#f8fafc",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1080px",
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
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1
            }}
          >
            JOKER-C2 Login
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
            Access AI JOKER-C2 through an existing HBCE IPR account session.
            Enter your Human IPR and password to activate governed runtime
            access.
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
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            marginBottom: "18px"
          }}
        >
          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background: "rgba(15,23,42,0.76)",
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
              Enter JOKER-C2
            </h2>

            <p
              style={{
                marginTop: 0,
                marginBottom: "18px",
                color: "#cbd5e1",
                lineHeight: 1.55,
                fontSize: "14px"
              }}
            >
              Use the password already created during the verified IPR setup.
              This page does not create a new password.
            </p>

            <div
              style={{
                display: "grid",
                gap: "14px"
              }}
            >
              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                Human IPR
                <input
                  value={humanIpr}
                  onChange={(event) => setHumanIpr(event.target.value)}
                  spellCheck={false}
                  autoCapitalize="characters"
                  autoComplete="username"
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "12px 13px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace"
                  }}
                />
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                IPR password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void submitLogin();
                    }
                  }}
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "12px 13px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px"
                  }}
                />
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                Device label
                <input
                  value={deviceLabel}
                  onChange={(event) => setDeviceLabel(event.target.value)}
                  autoComplete="off"
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "12px 13px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px"
                  }}
                />
              </label>

              <button
                type="button"
                onClick={submitLogin}
                disabled={loginState.status === "LOADING"}
                style={{
                  cursor:
                    loginState.status === "LOADING"
                      ? "not-allowed"
                      : "pointer",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "999px",
                  padding: "13px 18px",
                  background: "#38bdf8",
                  color: "#020617",
                  fontWeight: 900,
                  fontSize: "15px"
                }}
              >
                {loginState.status === "LOADING"
                  ? "Logging in..."
                  : "Login to JOKER-C2"}
              </button>

              <button
                type="button"
                onClick={runSessionCheck}
                disabled={sessionState.status === "LOADING"}
                style={{
                  cursor:
                    sessionState.status === "LOADING"
                      ? "not-allowed"
                      : "pointer",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "999px",
                  padding: "13px 18px",
                  background: "#f8fafc",
                  color: "#020617",
                  fontWeight: 800,
                  fontSize: "15px"
                }}
              >
                {sessionState.status === "LOADING"
                  ? "Checking session..."
                  : "Check IPR session"}
              </button>

              <a
                href="/interface"
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  textDecoration: "none",
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: "999px",
                  padding: "13px 18px",
                  background:
                    activeSession || loginSucceeded
                      ? "#22c55e"
                      : "rgba(15,23,42,0.9)",
                  color:
                    activeSession || loginSucceeded ? "#020617" : "#f8fafc",
                  fontWeight: 900,
                  fontSize: "15px"
                }}
              >
                Open JOKER-C2 interface
              </a>
            </div>
          </article>

          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background: "rgba(15,23,42,0.76)",
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
              Access status
            </h2>

            <div
              style={{
                border: "1px solid rgba(148,163,184,0.22)",
                borderRadius: "14px",
                padding: "14px",
                background:
                  activeSession || loginSucceeded
                    ? "rgba(34,197,94,0.12)"
                    : "rgba(2,6,23,0.62)",
                marginBottom: "16px"
              }}
            >
              <p
                style={{
                  margin: 0,
                  color:
                    activeSession || loginSucceeded ? "#86efac" : "#fbbf24",
                  fontWeight: 900,
                  fontSize: "15px"
                }}
              >
                {activeSession || loginSucceeded
                  ? "IPR account session active."
                  : "IPR account session not active yet."}
              </p>
            </div>

            <div
              style={{
                color: "#e2e8f0",
                fontSize: "14px",
                lineHeight: 1.65,
                marginBottom: "14px"
              }}
            >
              <strong>Login request:</strong> {getStatusLabel(loginState)}
              {loginState.httpStatus ? (
                <>
                  <br />
                  <strong>Login HTTP:</strong> {loginState.httpStatus}
                </>
              ) : null}
              {loginState.receivedAt ? (
                <>
                  <br />
                  <strong>Login received:</strong> {loginState.receivedAt}
                </>
              ) : null}
              {loginState.error ? (
                <>
                  <br />
                  <strong>Login error:</strong> {loginState.error}
                </>
              ) : null}
            </div>

            <ul
              style={{
                margin: "0 0 18px",
                paddingLeft: "18px",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.65
              }}
            >
              {loginSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div
              style={{
                color: "#e2e8f0",
                fontSize: "14px",
                lineHeight: 1.65,
                marginBottom: "14px"
              }}
            >
              <strong>Session check:</strong> {getStatusLabel(sessionState)}
              {sessionState.httpStatus ? (
                <>
                  <br />
                  <strong>Session HTTP:</strong> {sessionState.httpStatus}
                </>
              ) : null}
              {sessionState.receivedAt ? (
                <>
                  <br />
                  <strong>Session received:</strong> {sessionState.receivedAt}
                </>
              ) : null}
              {sessionState.error ? (
                <>
                  <br />
                  <strong>Session error:</strong> {sessionState.error}
                </>
              ) : null}
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.65
              }}
            >
              {sessionSummary.map((item) => (
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
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 900,
                marginBottom: "12px"
              }}
            >
              Login response
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
                loginState.payload || {
                  status: loginState.status,
                  error: loginState.error
                }
              )}
            </pre>
          </details>

          <details
            style={{
              border: "1px solid rgba(148,163,184,0.22)",
              borderRadius: "18px",
              padding: "18px",
              background: "rgba(2,6,23,0.78)"
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 900,
                marginBottom: "12px"
              }}
            >
              Session response
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
                sessionState.payload || {
                  status: sessionState.status,
                  error: sessionState.error
                }
              )}
            </pre>
          </details>
        </section>
      </section>
    </main>
  );
}

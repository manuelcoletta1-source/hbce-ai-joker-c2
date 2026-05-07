"use client";

/**
 * MATRIX AI Audit Trail — Dashboard
 *
 * MVP dashboard for the HERMETICUM B.C.E. internal R&D self-audit pilot.
 */

import { useMemo, useState } from "react";

import AuditReport from "./AuditReport";
import DocumentUpload, { type MatrixDocumentUploadValue } from "./DocumentUpload";
import HumanValidationPanel from "./HumanValidationPanel";

import {
  applyMatrixHumanValidation,
  buildMatrixDocumentRecord,
  createMatrixAuditSession,
  runMatrixAuditTrailRuntime
} from "../lib/matrix-audit-trail/runtime";

import type {
  MatrixAiActionType,
  MatrixAuditTrailSession,
  MatrixHumanValidationStatus,
  MatrixAuditTrailValidationInput
} from "../lib/matrix-audit-trail/types";

const DEFAULT_PROMPT =
  "Analyze this document for governance, compliance, auditability, security language, risk signals and overclaiming. Produce a concise audit-oriented summary.";

export default function MatrixAuditTrailDashboard() {
  const [session, setSession] = useState<MatrixAuditTrailSession>(() =>
    createMatrixAuditSession(buildSessionId())
  );

  const [documentValue, setDocumentValue] = useState<MatrixDocumentUploadValue | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [actionType, setActionType] = useState<MatrixAiActionType>("AI_DOCUMENT_ANALYSIS");
  const [aiOutputText, setAiOutputText] = useState("");
  const [validationStatus, setValidationStatus] = useState<MatrixHumanValidationStatus>("PENDING");
  const [validationNotes, setValidationNotes] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [status, setStatus] = useState("Ready.");

  const canRunAnalysis = Boolean(documentValue?.text.trim() && prompt.trim());

  const canValidate = Boolean(
    session.document &&
      session.aiAction &&
      session.aiOutput &&
      session.governance &&
      !session.report
  );

  const reportId = useMemo(() => {
    if (!session.report) return "";
    return session.report.reportId;
  }, [session.report]);

  function resetSession() {
    setSession(createMatrixAuditSession(buildSessionId()));
    setDocumentValue(null);
    setPrompt(DEFAULT_PROMPT);
    setActionType("AI_DOCUMENT_ANALYSIS");
    setAiOutputText("");
    setValidationStatus("PENDING");
    setValidationNotes("");
    setCorrectionText("");
    setStatus("New MATRIX AI Audit Trail session created.");
  }

  function runLocalAiSimulation() {
    if (!documentValue) {
      setStatus("Missing document.");
      return;
    }

    if (!prompt.trim()) {
      setStatus("Missing AI action prompt.");
      return;
    }

    const document = buildMatrixDocumentRecord({
      filename: documentValue.filename,
      mimeType: documentValue.mimeType,
      sizeBytes: documentValue.sizeBytes,
      text: documentValue.text
    });

    const generatedOutput = buildSyntheticAiOutput({
      filename: documentValue.filename,
      prompt,
      text: documentValue.text
    });

    const runtime = runMatrixAuditTrailRuntime({
      sessionId: session.sessionId,
      document,
      documentText: documentValue.text,
      actionType,
      prompt,
      aiOutputText: generatedOutput,
      model: "gpt-4o-mini"
    });

    const nextSession: MatrixAuditTrailSession = {
      ...session,
      document,
      aiAction: runtime.aiAction,
      aiOutput: runtime.aiOutput,
      governance: runtime.governance,
      humanValidation: null,
      evt: null,
      opc: null,
      report: null,
      status: "IN_REVIEW",
      updatedAt: new Date().toISOString()
    };

    setAiOutputText(generatedOutput);
    setValidationStatus("PENDING");
    setValidationNotes("");
    setCorrectionText("");
    setSession(nextSession);

    setStatus("AI analysis generated. Human validation is now required before EVT / OPC / report generation.");
  }

  function validate(input: MatrixAuditTrailValidationInput) {
    setValidationStatus(input.validationStatus);

    if (!session.document || !session.aiAction || !session.aiOutput || !session.governance) {
      setStatus("Validation blocked: run AI audit analysis before approving, correcting or rejecting.");
      return;
    }

    try {
      const validated = applyMatrixHumanValidation(session, input);

      setSession(validated);

      if (validated.report && validated.evt && validated.opc) {
        setStatus(
          `Human validation completed: ${input.validationStatus}. EVT, OPC and audit report generated.`
        );
      } else {
        setStatus(
          `Human validation completed: ${input.validationStatus}. Report not generated.`
        );
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Human validation failed.");
    }
  }

  return (
    <main className="matrix-page">
      <style jsx global>{`
        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #020617;
          color: #e5edf8;
        }

        * {
          box-sizing: border-box;
        }

        .matrix-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 18% 0%, rgba(34, 211, 238, 0.12), transparent 30%),
            radial-gradient(circle at 82% 8%, rgba(99, 102, 241, 0.10), transparent 28%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
          color: #e5edf8;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .matrix-shell {
          width: min(1440px, 100%);
          margin: 0 auto;
          padding: 24px;
        }

        .matrix-hero {
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 28px;
          background: rgba(15, 23, 42, 0.68);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.38);
          padding: 28px;
        }

        .matrix-kicker,
        .matrix-card-kicker {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .matrix-title {
          margin: 10px 0 0;
          color: white;
          font-size: clamp(30px, 5vw, 52px);
          line-height: 1.02;
          letter-spacing: -0.055em;
        }

        .matrix-lead {
          max-width: 980px;
          margin: 14px 0 0;
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.72;
        }

        .matrix-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 20px;
          margin-top: 20px;
          align-items: start;
        }

        .matrix-flow {
          display: grid;
          gap: 16px;
        }

        .matrix-sidebar {
          display: grid;
          gap: 16px;
          position: sticky;
          top: 16px;
        }

        .matrix-card {
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 22px;
          background: rgba(2, 6, 23, 0.68);
          padding: 18px;
          box-shadow: 0 18px 54px rgba(0, 0, 0, 0.24);
        }

        .matrix-card h2 {
          margin: 8px 0 8px;
          font-size: 22px;
          color: #f8fafc;
        }

        .matrix-card h3 {
          margin: 10px 0 8px;
          color: #f8fafc;
        }

        .matrix-muted {
          color: #94a3b8;
          line-height: 1.68;
          font-size: 14px;
        }

        .matrix-warning {
          margin-top: 14px;
          border: 1px solid rgba(245, 158, 11, 0.30);
          background: rgba(120, 53, 15, 0.16);
          color: #fde68a;
          border-radius: 16px;
          padding: 12px;
          font-size: 13px;
          line-height: 1.55;
        }

        .matrix-status {
          margin-top: 12px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.5;
        }

        .matrix-upload-box,
        .matrix-actions,
        .matrix-validation-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-top: 14px;
        }

        .matrix-upload-box input {
          max-width: 100%;
          color: #cbd5e1;
        }

        .matrix-button {
          appearance: none;
          border: 1px solid rgba(34, 211, 238, 0.46);
          background: rgba(34, 211, 238, 0.10);
          color: #cffafe;
          border-radius: 999px;
          cursor: pointer;
          padding: 10px 15px;
          font-weight: 800;
        }

        .matrix-button:hover {
          border-color: rgba(34, 211, 238, 0.76);
          background: rgba(34, 211, 238, 0.18);
        }

        .matrix-button:disabled {
          cursor: not-allowed;
          border-color: rgba(51, 65, 85, 0.9);
          background: rgba(15, 23, 42, 0.72);
          color: #64748b;
        }

        .matrix-button-secondary {
          border-color: rgba(100, 116, 139, 0.66);
          background: rgba(15, 23, 42, 0.88);
          color: #cbd5e1;
        }

        .matrix-button-success {
          border-color: rgba(16, 185, 129, 0.58);
          background: rgba(16, 185, 129, 0.14);
          color: #a7f3d0;
        }

        .matrix-button-warning {
          border-color: rgba(245, 158, 11, 0.58);
          background: rgba(245, 158, 11, 0.14);
          color: #fde68a;
        }

        .matrix-button-danger {
          border-color: rgba(239, 68, 68, 0.58);
          background: rgba(239, 68, 68, 0.14);
          color: #fecaca;
        }

        .matrix-document-meta,
        .matrix-report-grid,
        .matrix-kv-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .matrix-document-meta div,
        .matrix-report-grid div,
        .matrix-kv-grid div {
          min-width: 0;
          border: 1px solid rgba(51, 65, 85, 0.88);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.56);
          padding: 10px;
        }

        .matrix-document-meta span,
        .matrix-report-grid span,
        .matrix-kv-grid span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .matrix-document-meta strong,
        .matrix-report-grid strong,
        .matrix-kv-grid strong {
          display: block;
          margin-top: 5px;
          color: #e2e8f0;
          overflow-wrap: anywhere;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 12px;
        }

        .matrix-label {
          display: grid;
          gap: 8px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 700;
          margin-top: 14px;
        }

        .matrix-input,
        .matrix-select,
        .matrix-textarea {
          width: 100%;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 16px;
          background: rgba(2, 6, 23, 0.9);
          color: #f8fafc;
          padding: 12px;
          outline: none;
          font: inherit;
        }

        .matrix-textarea {
          resize: vertical;
        }

        .matrix-input:focus,
        .matrix-select:focus,
        .matrix-textarea:focus {
          border-color: rgba(34, 211, 238, 0.75);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
        }

        .matrix-ai-output,
        .matrix-report-pre {
          margin-top: 14px;
          max-height: 420px;
          overflow: auto;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          border: 1px solid rgba(51, 65, 85, 0.95);
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.28);
          padding: 14px;
          color: #e2e8f0;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            "Courier New",
            monospace;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 1120px) {
          .matrix-main-grid {
            grid-template-columns: 1fr;
          }

          .matrix-sidebar {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .matrix-shell {
            padding: 12px;
          }

          .matrix-hero {
            padding: 20px;
            border-radius: 22px;
          }

          .matrix-document-meta,
          .matrix-report-grid,
          .matrix-kv-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="matrix-shell">
        <section className="matrix-hero">
          <div className="matrix-kicker">MATRIX · AI AUDIT TRAIL · INTERNAL SELF-PILOT</div>
          <h1 className="matrix-title">MATRIX AI Audit Trail</h1>
          <p className="matrix-lead">
            Internal R&D self-audit pilot for HERMETICUM B.C.E. S.r.l.
            This MVP demonstrates a controlled AI-assisted document workflow:
            document hashing, AI analysis, governance decision, human validation,
            EVT continuity, OPC proof and audit-ready reporting.
          </p>
        </section>

        <div className="matrix-main-grid">
          <section className="matrix-flow">
            <DocumentUpload value={documentValue} onChange={setDocumentValue} />

            <section className="matrix-card">
              <div className="matrix-card-kicker">STEP 02 · AI ACTION</div>
              <h2>AI analysis</h2>

              <p className="matrix-muted">
                Select the AI action and review the synthetic MVP output. This first version uses
                local orchestration to prove the audit trail flow before connecting the full chat runtime.
              </p>

              <label className="matrix-label">
                Action type
                <select
                  value={actionType}
                  onChange={(event) => setActionType(event.target.value as MatrixAiActionType)}
                  className="matrix-select"
                >
                  <option value="AI_DOCUMENT_ANALYSIS">AI document analysis</option>
                  <option value="AI_COMPLIANCE_REVIEW">AI compliance review</option>
                  <option value="AI_SECURITY_REVIEW">AI security review</option>
                  <option value="AI_GOVERNANCE_REVIEW">AI governance review</option>
                  <option value="AI_OVERCLAIM_REVIEW">AI overclaim review</option>
                </select>
              </label>

              <label className="matrix-label">
                Prompt
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={5}
                  className="matrix-textarea"
                />
              </label>

              <div className="matrix-actions">
                <button
                  type="button"
                  disabled={!canRunAnalysis}
                  onClick={runLocalAiSimulation}
                  className="matrix-button"
                >
                  Run AI audit analysis
                </button>

                <button
                  type="button"
                  onClick={resetSession}
                  className="matrix-button matrix-button-secondary"
                >
                  New session
                </button>
              </div>

              {aiOutputText ? (
                <pre className="matrix-ai-output">{aiOutputText}</pre>
              ) : null}
            </section>

            <HumanValidationPanel
              disabled={!canValidate}
              currentStatus={validationStatus}
              notes={validationNotes}
              correctionText={correctionText}
              onStatusChange={setValidationStatus}
              onNotesChange={setValidationNotes}
              onCorrectionChange={setCorrectionText}
              onValidate={validate}
            />

            <AuditReport report={session.report} />
          </section>

          <aside className="matrix-sidebar">
            <section className="matrix-card">
              <div className="matrix-card-kicker">SELF-PILOT</div>
              <h2>HERMETICUM B.C.E. S.r.l.</h2>
              <p className="matrix-muted">
                First pilot client: HERMETICUM B.C.E. S.r.l. The company uses its
                own runtime as an internal R&D self-audit pilot before external pilots.
              </p>
            </section>

            <section className="matrix-card">
              <div className="matrix-card-kicker">SESSION</div>
              <h2>Runtime state</h2>
              <div className="matrix-kv-grid">
                <div>
                  <span>Session</span>
                  <strong>{session.sessionId}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{session.status}</strong>
                </div>
                <div>
                  <span>Operator IPR</span>
                  <strong>{session.identity.ipr}</strong>
                </div>
                <div>
                  <span>Operator</span>
                  <strong>{session.identity.subjectLabel}</strong>
                </div>
              </div>
              <p className="matrix-status">{status}</p>
            </section>

            <section className="matrix-card">
              <div className="matrix-card-kicker">GOVERNANCE</div>
              <h2>Decision frame</h2>
              <div className="matrix-kv-grid">
                <div>
                  <span>Risk</span>
                  <strong>{session.governance?.riskClass || "-"}</strong>
                </div>
                <div>
                  <span>Decision</span>
                  <strong>{session.governance?.decision || "-"}</strong>
                </div>
                <div>
                  <span>Human oversight</span>
                  <strong>{session.governance?.humanOversight || "-"}</strong>
                </div>
                <div>
                  <span>Validation</span>
                  <strong>{session.humanValidation?.validationStatus || "PENDING"}</strong>
                </div>
              </div>
            </section>

            <section className="matrix-card">
              <div className="matrix-card-kicker">PROOF</div>
              <h2>EVT / OPC</h2>
              <div className="matrix-kv-grid">
                <div>
                  <span>EVT</span>
                  <strong>{session.evt?.evt || "-"}</strong>
                </div>
                <div>
                  <span>EVT hash</span>
                  <strong>{session.evt?.traceHash || "-"}</strong>
                </div>
                <div>
                  <span>OPC</span>
                  <strong>{session.opc?.opc || "-"}</strong>
                </div>
                <div>
                  <span>OPC hash</span>
                  <strong>{session.opc?.proofHash || "-"}</strong>
                </div>
              </div>
            </section>

            <section className="matrix-card">
              <div className="matrix-card-kicker">REPORT</div>
              <h2>Report status</h2>
              <div className="matrix-kv-grid">
                <div>
                  <span>Report</span>
                  <strong>{reportId || "-"}</strong>
                </div>
                <div>
                  <span>Final</span>
                  <strong>{session.report?.finalState || "-"}</strong>
                </div>
              </div>
            </section>

            <section className="matrix-card">
              <div className="matrix-card-kicker">BOUNDARY</div>
              <h2>Important limit</h2>
              <p className="matrix-muted">
                This MVP creates technical audit evidence for an internal R&D self-pilot.
                It does not create legal certification, regulatory approval, eIDAS qualification,
                or external audit certification.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function buildSessionId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `MATRIX-AUDIT-${Date.now()}-${random}`;
}

function buildSyntheticAiOutput(input: {
  filename: string;
  prompt: string;
  text: string;
}): string {
  const preview = input.text.slice(0, 1200);
  const lower = input.text.toLowerCase();

  const signals = [
    lower.includes("security") || lower.includes("sicurezza") ? "security language detected" : "",
    lower.includes("privacy") || lower.includes("gdpr") ? "privacy / GDPR language detected" : "",
    lower.includes("audit") || lower.includes("verifica") ? "auditability language detected" : "",
    lower.includes("governance") ? "governance language detected" : "",
    lower.includes("risk") || lower.includes("rischio") ? "risk language detected" : ""
  ].filter(Boolean);

  return [
    "MATRIX AI AUDIT ANALYSIS",
    "",
    `Document: ${input.filename}`,
    `Prompt: ${input.prompt}`,
    "",
    "Summary:",
    "The document was processed as part of the HERMETICUM B.C.E. internal R&D self-audit pilot. The analysis identifies governance, auditability, compliance and risk-related language for review.",
    "",
    "Detected signals:",
    signals.length ? signals.map((signal) => `- ${signal}`).join("\n") : "- no major governance signal detected",
    "",
    "Audit notes:",
    "- AI output is decision-support only.",
    "- Human validation is required before audit report finalization.",
    "- EVT and OPC records will be generated after validation.",
    "- This MVP does not create legal certification or regulatory approval.",
    "",
    "Document preview:",
    preview
  ].join("\n");
}

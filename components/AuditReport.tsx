"use client";

/**
 * MATRIX AI Audit Trail — Audit Report
 *
 * Human-readable report component for the MVP.
 */

import type { MatrixAuditReport } from "../lib/matrix-audit-trail/types";
import { renderMatrixAuditReportText } from "../lib/matrix-audit-trail/runtime";

type AuditReportProps = {
  report: MatrixAuditReport | null;
};

export default function AuditReport({ report }: AuditReportProps) {
  if (!report) {
    return (
      <section className="matrix-card">
        <div className="matrix-card-kicker">STEP 04 · AUDIT REPORT</div>
        <h2>Audit report</h2>
        <p className="matrix-muted">
          The audit report will be generated after AI analysis and human validation.
        </p>
      </section>
    );
  }

  const textReport = renderMatrixAuditReportText(report);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(textReport);
    } catch {
      // Clipboard can fail in restricted browser contexts.
    }
  }

  function downloadReport() {
    const blob = new Blob([textReport], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${report.reportId}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${report.reportId}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="matrix-card">
      <div className="matrix-card-kicker">STEP 04 · AUDIT REPORT</div>
      <h2>MATRIX AI Audit Trail Report</h2>

      <p className="matrix-muted">
        This report is generated from the internal HERMETICUM B.C.E. self-audit pilot.
        It is audit-ready technical documentation, not legal certification.
      </p>

      <div className="matrix-report-grid">
        <div>
          <span>Final state</span>
          <strong>{report.finalState}</strong>
        </div>
        <div>
          <span>Document hash</span>
          <strong>{report.document.documentHash}</strong>
        </div>
        <div>
          <span>EVT</span>
          <strong>{report.evt.evt}</strong>
        </div>
        <div>
          <span>OPC</span>
          <strong>{report.opc.opc}</strong>
        </div>
      </div>

      <pre className="matrix-report-pre">{textReport}</pre>

      <div className="matrix-actions">
        <button type="button" onClick={copyReport} className="matrix-button">
          Copy report
        </button>

        <button type="button" onClick={downloadReport} className="matrix-button">
          Download TXT
        </button>

        <button type="button" onClick={downloadJson} className="matrix-button matrix-button-secondary">
          Download JSON
        </button>
      </div>

      <div className="matrix-warning">
        Public proof, EVT and OPC records do not replace private evidence review,
        legal authorization, institutional validation, regulated certification or
        contractual qualification.
      </div>
    </section>
  );
}

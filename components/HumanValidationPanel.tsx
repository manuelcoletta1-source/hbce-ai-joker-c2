"use client";

/**
 * MATRIX AI Audit Trail — Human Validation Panel
 *
 * Human validation is the compliance boundary of the MVP.
 * The AI output is not final until a human approves, corrects, or rejects it.
 */

import type {
  MatrixHumanValidationStatus,
  MatrixAuditTrailValidationInput
} from "../lib/matrix-audit-trail/types";

type HumanValidationPanelProps = {
  disabled?: boolean;
  currentStatus: MatrixHumanValidationStatus;
  notes: string;
  correctionText: string;
  onStatusChange: (status: MatrixHumanValidationStatus) => void;
  onNotesChange: (notes: string) => void;
  onCorrectionChange: (text: string) => void;
  onValidate: (input: MatrixAuditTrailValidationInput) => void;
};

export default function HumanValidationPanel({
  disabled = false,
  currentStatus,
  notes,
  correctionText,
  onStatusChange,
  onNotesChange,
  onCorrectionChange,
  onValidate
}: HumanValidationPanelProps) {
  function submit(status: MatrixHumanValidationStatus) {
    onStatusChange(status);

    onValidate({
      validationStatus: status,
      notes,
      correctionText: status === "CORRECTED" ? correctionText : undefined
    });
  }

  return (
    <section className="matrix-card">
      <div className="matrix-card-kicker">STEP 03 · HUMAN VALIDATION</div>
      <h2>Human validation</h2>

      <p className="matrix-muted">
        The AI output is treated as decision-support only. A human operator must
        approve, correct, or reject the output before the audit report is finalized.
      </p>

      <div className="matrix-validation-grid">
        <button
          type="button"
          disabled={disabled}
          onClick={() => submit("APPROVED")}
          className="matrix-button matrix-button-success"
        >
          Approve
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => submit("CORRECTED")}
          className="matrix-button matrix-button-warning"
        >
          Approve with correction
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => submit("REJECTED")}
          className="matrix-button matrix-button-danger"
        >
          Reject
        </button>
      </div>

      <label className="matrix-label">
        Validation notes
        <textarea
          value={notes}
          disabled={disabled}
          onChange={(event) => onNotesChange(event.target.value)}
          className="matrix-textarea"
          rows={4}
          placeholder="Add human review notes..."
        />
      </label>

      <label className="matrix-label">
        Correction text
        <textarea
          value={correctionText}
          disabled={disabled}
          onChange={(event) => onCorrectionChange(event.target.value)}
          className="matrix-textarea"
          rows={5}
          placeholder="Required only if approving with correction..."
        />
      </label>

      <div className="matrix-status">
        Current validation status: <strong>{currentStatus}</strong>
      </div>

      <div className="matrix-warning">
        Human validation creates the responsibility boundary. MATRIX AI Audit
        Trail does not treat autonomous AI output as final compliance evidence.
      </div>
    </section>
  );
}

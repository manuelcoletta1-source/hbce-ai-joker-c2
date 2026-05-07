"use client";

/**
 * MATRIX AI Audit Trail — Document Upload
 *
 * Local document intake component for the internal R&D self-audit MVP.
 *
 * No upload happens in this component by itself.
 * The selected file is read in the browser and passed to the parent component.
 */

import { useRef, useState } from "react";

export type MatrixDocumentUploadValue = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  text: string;
};

type DocumentUploadProps = {
  value: MatrixDocumentUploadValue | null;
  onChange: (value: MatrixDocumentUploadValue | null) => void;
};

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".json"];

export default function DocumentUpload({
  value,
  onChange
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("Ready.");

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const lower = file.name.toLowerCase();
    const supported = SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));

    if (!supported) {
      setStatus("Unsupported file for MVP. Use TXT, MD, or JSON.");
      onChange(null);
      return;
    }

    try {
      const text = await file.text();

      onChange({
        filename: file.name,
        mimeType: file.type || "text/plain",
        sizeBytes: file.size,
        text
      });

      setStatus("Document loaded locally. No public custody created.");
    } catch {
      setStatus("Failed to read document.");
      onChange(null);
    }
  }

  function clear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onChange(null);
    setStatus("Ready.");
  }

  return (
    <section className="matrix-card">
      <div className="matrix-card-kicker">STEP 01 · DOCUMENT</div>
      <h2>Upload document</h2>

      <p className="matrix-muted">
        Select a TXT, MD, or JSON document for the internal HERMETICUM B.C.E. self-audit pilot.
        The file is read locally in the browser and then used as runtime context.
      </p>

      <div className="matrix-upload-box">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.json,text/plain,text/markdown,application/json"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        <button type="button" onClick={clear} className="matrix-button matrix-button-secondary">
          Clear
        </button>
      </div>

      <p className="matrix-status">{status}</p>

      {value ? (
        <div className="matrix-document-meta">
          <div>
            <span>Filename</span>
            <strong>{value.filename}</strong>
          </div>
          <div>
            <span>MIME</span>
            <strong>{value.mimeType || "text/plain"}</strong>
          </div>
          <div>
            <span>Size</span>
            <strong>{value.sizeBytes} bytes</strong>
          </div>
        </div>
      ) : null}

      <div className="matrix-warning">
        Do not upload secrets, credentials, identity documents, private keys, customer data,
        private evidence, or sensitive operational payloads.
      </div>
    </section>
  );
}

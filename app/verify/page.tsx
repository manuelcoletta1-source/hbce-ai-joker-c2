"use client";

import { useEffect, useState } from "react";

type VerifyData = {
  ok: boolean;
  verify: {
    ledger_integrity: boolean;
    checked_events: number;
    broken_at: number | null;
  };
  signature: {
    enabled: boolean;
  };
  ledger_tail: Array<{
    seq: number;
    kind: string;
    ts: string;
    hash: string;
  }>;
};

export default function VerifyPage() {
  const [data, setData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/verify");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function exportEvidence() {
    const res = await fetch("/api/evidence");
    const json = await res.json();

    if (json.evidence_url) {
      window.open(json.evidence_url, "_blank");
    } else {
      alert("Errore export evidenza");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 40 }}>Loading verification...</div>;
  }

  if (!data || !data.ok) {
    return <div style={{ padding: 40 }}>Verify failed</div>;
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>JOKER-C2 VERIFY</h1>

      <section style={{ marginTop: 20 }}>
        <h3>Ledger Integrity</h3>
        <p>
          Status:{" "}
          <b style={{ color: data.verify.ledger_integrity ? "lime" : "red" }}>
            {data.verify.ledger_integrity ? "VALID" : "BROKEN"}
          </b>
        </p>
        <p>Checked events: {data.verify.checked_events}</p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Signature</h3>
        <p>
          Enabled:{" "}
          <b style={{ color: data.signature.enabled ? "lime" : "orange" }}>
            {data.signature.enabled ? "YES" : "NO"}
          </b>
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Latest Ledger Events</h3>
        <div style={{ fontSize: 12 }}>
          {data.ledger_tail.map((e) => (
            <div
              key={e.seq}
              style={{
                borderBottom: "1px solid #333",
                padding: "8px 0"
              }}
            >
              <div>#{e.seq} — {e.kind}</div>
              <div>{e.ts}</div>
              <div style={{ opacity: 0.6 }}>
                {e.hash.slice(0, 32)}...
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <button
          onClick={exportEvidence}
          style={{
            padding: "12px 20px",
            background: "black",
            color: "white",
            border: "1px solid #444",
            cursor: "pointer"
          }}
        >
          EXPORT EVIDENCE
        </button>
      </section>
    </main>
  );
}

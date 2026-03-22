import Link from "next/link";

import { nodeGetPublicVerifySnapshot } from "@/lib/node/node-verify";
import { nodeGetNetworkSnapshot } from "@/lib/node/node-network";
import { nodeGetHealth } from "@/lib/node/node-verify";

function pillStyle(value: string): React.CSSProperties {
  const normalized = value.toUpperCase();

  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("ONLINE") ||
    normalized.includes("STABLE") ||
    normalized === "TRUE"
  ) {
    return {
      border: "1px solid rgba(34,197,94,.35)",
      background: "rgba(34,197,94,.10)",
      color: "#bbf7d0"
    };
  }

  if (
    normalized.includes("DEGRADED") ||
    normalized.includes("LIMITED") ||
    normalized.includes("UNKNOWN")
  ) {
    return {
      border: "1px solid rgba(250,204,21,.30)",
      background: "rgba(250,204,21,.10)",
      color: "#fde68a"
    };
  }

  if (
    normalized.includes("BROKEN") ||
    normalized.includes("OFFLINE") ||
    normalized.includes("INACTIVE") ||
    normalized === "FALSE"
  ) {
    return {
      border: "1px solid rgba(248,113,113,.30)",
      background: "rgba(248,113,113,.10)",
      color: "#fecaca"
    };
  }

  return {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.04)",
    color: "#e8eef7"
  };
}

function Pill({ value }: { value: string }) {
  return (
    <span
      style={{
        ...pillStyle(value),
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 700
      }}
    >
      {value}
    </span>
  );
}

function SectionTitle({
  kicker,
  title,
  text
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="hbce-kicker" style={{ marginBottom: 10 }}>
        {kicker}
      </div>
      <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>{title}</h2>
      <p className="hbce-muted" style={{ margin: 0, lineHeight: 1.7 }}>
        {text}
      </p>
    </div>
  );
}

export default async function NodePage() {
  const [health, verifySnapshot, networkSnapshot] = await Promise.all([
    nodeGetHealth(),
    nodeGetPublicVerifySnapshot(12),
    nodeGetNetworkSnapshot()
  ]);

  return (
    <main className="hbce-page">
      <section className="hbce-wrap" style={{ marginBottom: 28 }}>
        <div className="hbce-kicker" style={{ marginBottom: 12 }}>
          HBCE Research
        </div>

        <h1
          style={{
            margin: "0 0 14px",
            fontSize: "clamp(34px, 7vw, 64px)",
            lineHeight: 1,
            letterSpacing: "-0.03em"
          }}
        >
          Torino Pilot Node
        </h1>

        <p
          className="hbce-muted"
          style={{
            margin: 0,
            maxWidth: 880,
            fontSize: 18,
            lineHeight: 1.7
          }}
        >
          Superficie operativa del nodo HBCE integrato in AI JOKER-C2. Questa
          pagina rende leggibili stato locale, continuità, integrità del
          ledger, trust layer e stato di rete della prima istanza operativa del
          sistema.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24
          }}
        >
          <Pill value={health.status} />
          <Pill value={health.continuity_status} />
          <Pill value={health.signature_enabled ? "SIGNATURE ON" : "SIGNATURE OFF"} />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            marginTop: 26
          }}
        >
          <Link href="/interface" className="hbce-button-primary">
            Open Interface
          </Link>
          <Link href="/ipr" className="hbce-button-secondary">
            Explore IPR
          </Link>
          <Link href="/api/verify" className="hbce-button-secondary">
            Open Verify API
          </Link>
          <Link href="/api/network" className="hbce-button-secondary">
            Open Network API
          </Link>
        </div>
      </section>

      <section className="hbce-wrap hbce-grid-3" style={{ marginBottom: 24 }}>
        <article className="hbce-card" style={{ padding: 22 }}>
          <div className="hbce-kicker" style={{ marginBottom: 10 }}>
            Identity
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Node Identity</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="hbce-kicker">Node</div>
              <div style={valueStyle}>{health.node}</div>
            </div>
            <div>
              <div className="hbce-kicker">Identity</div>
              <div style={valueStyle}>{health.identity}</div>
            </div>
            <div>
              <div className="hbce-kicker">System</div>
              <div style={valueStyle}>{health.system}</div>
            </div>
          </div>
        </article>

        <article className="hbce-card" style={{ padding: 22 }}>
          <div className="hbce-kicker" style={{ marginBottom: 10 }}>
            Ledger
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Integrity State</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="hbce-kicker">Integrity</div>
              <div style={valueStyle}>
                {health.ledger.integrity ? "Verified" : "Not verified"}
              </div>
            </div>
            <div>
              <div className="hbce-kicker">Checked events</div>
              <div style={valueStyle}>{String(health.ledger.checked_events)}</div>
            </div>
            <div>
              <div className="hbce-kicker">Last seq</div>
              <div style={valueStyle}>
                {health.ledger.last_seq !== null
                  ? String(health.ledger.last_seq)
                  : "N/A"}
              </div>
            </div>
          </div>
        </article>

        <article className="hbce-card" style={{ padding: 22 }}>
          <div className="hbce-kicker" style={{ marginBottom: 10 }}>
            Continuity
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Runtime Continuity</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="hbce-kicker">Status</div>
              <div style={valueStyle}>{verifySnapshot.continuity.continuity_status}</div>
            </div>
            <div>
              <div className="hbce-kicker">Active sessions</div>
              <div style={valueStyle}>
                {String(verifySnapshot.continuity.active_sessions)}
              </div>
            </div>
            <div>
              <div className="hbce-kicker">Latest reference</div>
              <div style={valueStyle}>
                {verifySnapshot.continuity.latest?.continuity_reference || "N/A"}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="hbce-wrap" style={{ marginBottom: 24 }}>
        <div className="hbce-card" style={{ padding: 22 }}>
          <SectionTitle
            kicker="Verify Surface"
            title="Public Verification Snapshot"
            text="Vista sintetica della leggibilità pubblica del nodo. Qui convergono integrità del ledger, continuità del runtime e disponibilità del trust layer."
          />

          <div className="hbce-grid-2" style={{ marginBottom: 18 }}>
            <div style={panelItemStyle}>
              <div className="hbce-kicker">Ledger integrity</div>
              <div style={valueStyle}>
                {verifySnapshot.verify.ledger_integrity ? "true" : "false"}
              </div>
            </div>
            <div style={panelItemStyle}>
              <div className="hbce-kicker">Broken at</div>
              <div style={valueStyle}>
                {verifySnapshot.verify.broken_at !== null
                  ? String(verifySnapshot.verify.broken_at)
                  : "none"}
              </div>
            </div>
            <div style={panelItemStyle}>
              <div className="hbce-kicker">Signature</div>
              <div style={valueStyle}>
                {verifySnapshot.signature.enabled ? "enabled" : "disabled"}
              </div>
            </div>
            <div style={panelItemStyle}>
              <div className="hbce-kicker">Storage</div>
              <div style={valueStyle}>{verifySnapshot.storage.type}</div>
            </div>
          </div>

          <div style={monoPanelStyle}>
            <div className="hbce-kicker" style={{ marginBottom: 10 }}>
              Last hash
            </div>
            <code style={codeStyle}>{health.ledger.last_hash || "N/A"}</code>
          </div>
        </div>
      </section>

      <section className="hbce-wrap" style={{ marginBottom: 24 }}>
        <div className="hbce-card" style={{ padding: 22 }}>
          <SectionTitle
            kicker="Ledger Tail"
            title="Recent Node Events"
            text="Coda pubblica sintetica degli eventi più recenti emessi dal nodo. È il bordo visibile della catena hash-linked persistente."
          />

          <div style={{ display: "grid", gap: 12 }}>
            {verifySnapshot.ledger_tail.length === 0 ? (
              <div style={panelItemStyle}>Nessun evento disponibile.</div>
            ) : (
              verifySnapshot.ledger_tail.map((event) => (
                <div key={`${event.seq}-${event.hash}`} style={panelItemStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 10
                    }}
                  >
                    <div>
                      <div className="hbce-kicker">Kind</div>
                      <div style={valueStyle}>{event.kind}</div>
                    </div>
                    <div>
                      <div className="hbce-kicker">Seq</div>
                      <div style={valueStyle}>{String(event.seq)}</div>
                    </div>
                    <div>
                      <div className="hbce-kicker">Timestamp</div>
                      <div style={valueStyle}>{event.ts}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <div className="hbce-kicker">Hash</div>
                      <code style={codeStyle}>{event.hash}</code>
                    </div>
                    <div>
                      <div className="hbce-kicker">Prev hash</div>
                      <code style={codeStyle}>{event.prev_hash}</code>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="hbce-wrap" style={{ marginBottom: 24 }}>
        <div className="hbce-card" style={{ padding: 22 }}>
          <SectionTitle
            kicker="Network Layer"
            title="Federation Snapshot"
            text="Lettura locale della rete HBCE. Il nodo Torino viene mostrato insieme ai descrittori federativi e ai probe di raggiungibilità."
          />

          <div className="hbce-grid-2" style={{ marginBottom: 18 }}>
            <div style={panelItemStyle}>
              <div className="hbce-kicker">Local node</div>
              <div style={valueStyle}>{networkSnapshot.local_node.node_id}</div>
            </div>
            <div style={panelItemStyle}>
              <div className="hbce-kicker">Active nodes</div>
              <div style={valueStyle}>
                {String(networkSnapshot.status.active_nodes)} /{" "}
                {String(networkSnapshot.status.total_nodes)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {networkSnapshot.probes.map((probe) => (
              <div key={`${probe.node_id}-${probe.checked_at}`} style={panelItemStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 10
                  }}
                >
                  <div>
                    <div className="hbce-kicker">Node</div>
                    <div style={valueStyle}>{probe.node_id}</div>
                  </div>
                  <div>
                    <div className="hbce-kicker">Status</div>
                    <Pill value={probe.status} />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div>
                    <div className="hbce-kicker">Endpoint</div>
                    <code style={codeStyle}>{probe.endpoint || "N/A"}</code>
                  </div>
                  <div>
                    <div className="hbce-kicker">Checked at</div>
                    <div style={valueStyle}>{probe.checked_at}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#e8eef7",
  lineHeight: 1.6,
  wordBreak: "break-word"
};

const panelItemStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,.02)",
  border: "1px solid rgba(255,255,255,.07)"
};

const monoPanelStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,.02)",
  border: "1px solid rgba(255,255,255,.07)"
};

const codeStyle: React.CSSProperties = {
  display: "block",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  fontSize: 12,
  lineHeight: 1.7,
  color: "#cbd5e1"
};

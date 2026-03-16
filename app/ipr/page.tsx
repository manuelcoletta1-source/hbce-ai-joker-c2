import Link from "next/link";

const IPR_ITEMS = [
  {
    label: "Identity Layer",
    title: "Persistent Operational Identity",
    text:
      "IPR defines a persistent operational identity model designed to bind actions, context, attribution, and verification within HBCE-oriented environments."
  },
  {
    label: "Event Logic",
    title: "Action to Evidence Chain",
    text:
      "The IPR framework is intended to connect identity, event registration, response generation, and verification logic across structured digital workflows."
  },
  {
    label: "Operational Scope",
    title: "Human, AI, Node, System",
    text:
      "The model is designed to support identity-bound execution across biological operators, AI systems, territorial nodes, and broader operational infrastructures."
  }
];

const STATUS_ITEMS = [
  {
    key: "Framework",
    value: "IPR - Identity Primary Record"
  },
  {
    key: "Default AI Identity",
    value: "IPR-AI-0001"
  },
  {
    key: "Default Node",
    value: "HBCE-MATRIX-NODE-0001-TORINO"
  },
  {
    key: "Current Role",
    value: "Operational Identity Layer"
  }
];

export default function IprPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.kicker}>HBCE Research</div>

        <h1 style={styles.title}>IPR</h1>

        <p style={styles.subtitle}>
          Identity Primary Record is the operational identity layer of the HBCE
          framework. It is designed to connect identity, action, context, and
          verification in structured digital environments.
        </p>

        <div style={styles.actions}>
          <Link href="/interface" style={styles.primaryButton}>
            Open Interface
          </Link>

          <Link href="/" style={styles.secondaryButton}>
            Back Home
          </Link>
        </div>
      </section>

      <section style={styles.grid}>
        {IPR_ITEMS.map((item) => (
          <article key={item.title} style={styles.card}>
            <div style={styles.cardLabel}>{item.label}</div>
            <h2 style={styles.cardTitle}>{item.title}</h2>
            <p style={styles.cardText}>{item.text}</p>
          </article>
        ))}
      </section>

      <section style={styles.panel}>
        <div style={styles.panelLabel}>Current IPR Context</div>

        <div style={styles.statusGrid}>
          {STATUS_ITEMS.map((item) => (
            <div key={item.key} style={styles.statusItem}>
              <span style={styles.statusKey}>{item.key}</span>
              <span style={styles.statusValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.longPanel}>
        <div style={styles.panelLabel}>Operational Interpretation</div>

        <div style={styles.longText}>
          <p style={styles.paragraph}>
            In the current Joker-C2 application, IPR is treated as the
            foundational operational identity layer used to frame requests,
            contextualize execution, and expose structured metadata during
            response generation.
          </p>

          <p style={styles.paragraph}>
            This page is not intended as a legal registry or full protocol
            specification. It functions as an application-level explanation of
            how the IPR concept supports the broader architecture of identity,
            node context, and operational interaction within the HBCE
            environment.
          </p>

          <p style={styles.paragraph}>
            Future versions may extend this route with richer registry logic,
            protocol documentation, verification references, and tighter
            integration with Matrix Europa deployment models.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(56,189,248,.10), transparent 30%), radial-gradient(circle at bottom right, rgba(125,211,252,.08), transparent 30%), #0b0f14",
    color: "#e8eef7",
    fontFamily:
      "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif",
    padding: "40px 20px 64px"
  },
  hero: {
    maxWidth: 960,
    margin: "0 auto 32px"
  },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8fa3b8",
    marginBottom: 12
  },
  title: {
    margin: "0 0 14px",
    fontSize: "clamp(40px, 8vw, 72px)",
    lineHeight: 1,
    letterSpacing: "-0.03em"
  },
  subtitle: {
    margin: 0,
    maxWidth: 780,
    color: "#8fa3b8",
    fontSize: 18,
    lineHeight: 1.7
  },
  actions: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 28
  },
  primaryButton: {
    textDecoration: "none",
    background: "linear-gradient(180deg, #7dd3fc, #38bdf8)",
    color: "#06121a",
    padding: "14px 18px",
    borderRadius: 14,
    fontWeight: 700
  },
  secondaryButton: {
    textDecoration: "none",
    background: "rgba(255,255,255,.03)",
    color: "#e8eef7",
    padding: "14px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.08)",
    fontWeight: 600
  },
  grid: {
    maxWidth: 1200,
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18
  },
  card: {
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: 22
  },
  cardLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#8fa3b8",
    marginBottom: 10
  },
  cardTitle: {
    margin: "0 0 10px",
    fontSize: 22
  },
  cardText: {
    margin: 0,
    color: "#8fa3b8",
    fontSize: 15,
    lineHeight: 1.7
  },
  panel: {
    maxWidth: 1200,
    margin: "0 auto 24px",
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: 22
  },
  longPanel: {
    maxWidth: 1200,
    margin: "0 auto",
    background:
      "linear-gradient(180deg, rgba(17,24,33,.95), rgba(15,23,32,.95))",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: 22
  },
  panelLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#8fa3b8",
    marginBottom: 14
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14
  },
  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,.02)",
    border: "1px solid rgba(255,255,255,.06)"
  },
  statusKey: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#8fa3b8"
  },
  statusValue: {
    fontSize: 15,
    color: "#e8eef7",
    wordBreak: "break-word"
  },
  longText: {
    display: "grid",
    gap: 16
  },
  paragraph: {
    margin: 0,
    color: "#8fa3b8",
    fontSize: 16,
    lineHeight: 1.8
  }
};

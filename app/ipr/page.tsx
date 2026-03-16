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
    <main className="hbce-page">
      <section className="hbce-wrap" style={styles.hero}>
        <div className="hbce-kicker" style={styles.kickerSpacing}>
          HBCE Research
        </div>

        <h1 style={styles.title}>IPR</h1>

        <p className="hbce-muted" style={styles.subtitle}>
          Identity Primary Record is the operational identity layer of the HBCE
          framework. It is designed to connect identity, action, context, and
          verification in structured digital environments.
        </p>

        <div style={styles.actions}>
          <Link href="/interface" className="hbce-button-primary">
            Open Interface
          </Link>

          <Link href="/" className="hbce-button-secondary">
            Back Home
          </Link>
        </div>
      </section>

      <section className="hbce-wrap hbce-grid-3" style={styles.sectionGap}>
        {IPR_ITEMS.map((item) => (
          <article key={item.title} className="hbce-card" style={styles.card}>
            <div className="hbce-kicker" style={styles.cardLabel}>
              {item.label}
            </div>

            <h2 style={styles.cardTitle}>{item.title}</h2>

            <p className="hbce-muted" style={styles.cardText}>
              {item.text}
            </p>
          </article>
        ))}
      </section>

      <section className="hbce-wrap" style={styles.sectionGap}>
        <div className="hbce-card" style={styles.panel}>
          <div className="hbce-kicker" style={styles.panelLabel}>
            Current IPR Context
          </div>

          <div className="hbce-grid-2">
            {STATUS_ITEMS.map((item) => (
              <div key={item.key} style={styles.statusItem}>
                <span className="hbce-kicker" style={styles.statusKey}>
                  {item.key}
                </span>
                <span style={styles.statusValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hbce-wrap">
        <div className="hbce-card" style={styles.panel}>
          <div className="hbce-kicker" style={styles.panelLabel}>
            Operational Interpretation
          </div>

          <div style={styles.longText}>
            <p className="hbce-muted" style={styles.paragraph}>
              In the current Joker-C2 application, IPR is treated as the
              foundational operational identity layer used to frame requests,
              contextualize execution, and expose structured metadata during
              response generation.
            </p>

            <p className="hbce-muted" style={styles.paragraph}>
              This page is not intended as a legal registry or full protocol
              specification. It functions as an application-level explanation of
              how the IPR concept supports the broader architecture of identity,
              node context, and operational interaction within the HBCE
              environment.
            </p>

            <p className="hbce-muted" style={styles.paragraph}>
              Future versions may extend this route with richer registry logic,
              protocol documentation, verification references, and tighter
              integration with Matrix Europa deployment models.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    marginBottom: 32
  },
  kickerSpacing: {
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
    fontSize: 18,
    lineHeight: 1.7
  },
  actions: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 28
  },
  sectionGap: {
    marginBottom: 24
  },
  card: {
    padding: 22
  },
  cardLabel: {
    marginBottom: 10
  },
  cardTitle: {
    margin: "0 0 10px",
    fontSize: 22
  },
  cardText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.7
  },
  panel: {
    padding: 22
  },
  panelLabel: {
    marginBottom: 14
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
    letterSpacing: "0.08em"
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
    fontSize: 16,
    lineHeight: 1.8
  }
};

import Link from "next/link";

const CARDS = [
  {
    label: "Operational Core",
    title: "Coordination Engine",
    text:
      "Joker-C2 operates as a coordination engine for analysis, contextual recovery, structured response generation, and node-aware operational interaction."
  },
  {
    label: "Identity Layer",
    title: "IPR-Bound Logic",
    text:
      "The application is designed to align response execution with identity-bound workflows, persistent operational attribution, and verifiable event logic."
  },
  {
    label: "Territorial Layer",
    title: "Matrix Europa Node",
    text:
      "The current interface is aligned with the Torino experimental node and prepared for wider Matrix Europa territorial deployment logic."
  }
];

const STATUS_ITEMS = [
  {
    key: "Application",
    value: "Online"
  },
  {
    key: "Interface",
    value: "Next.js Route"
  },
  {
    key: "Chat API",
    value: "Context Recovery Active"
  },
  {
    key: "Default Node",
    value: "HBCE-MATRIX-NODE-0001-TORINO"
  }
];

export default function HomePage() {
  return (
    <main className="hbce-page">
      <section className="hbce-wrap" style={styles.hero}>
        <div className="hbce-kicker" style={styles.kickerSpacing}>
          HBCE Research
        </div>

        <h1 style={styles.title}>AI JOKER-C2</h1>

        <p className="hbce-muted" style={styles.subtitle}>
          Identity-Bound Operational AI Application for HBCE environments,
          Matrix Europa nodes, and structured operational context recovery.
        </p>

        <div style={styles.actions}>
          <Link href="/interface" className="hbce-button-primary">
            Open Interface
          </Link>

          <Link href="/ipr" className="hbce-button-secondary">
            Explore IPR
          </Link>
        </div>
      </section>

      <section className="hbce-wrap hbce-grid-3" style={styles.sectionGap}>
        {CARDS.map((card) => (
          <article key={card.title} className="hbce-card" style={styles.card}>
            <div className="hbce-kicker" style={styles.cardLabel}>
              {card.label}
            </div>

            <h2 style={styles.cardTitle}>{card.title}</h2>

            <p className="hbce-muted" style={styles.cardText}>
              {card.text}
            </p>
          </article>
        ))}
      </section>

      <section className="hbce-wrap">
        <div className="hbce-card" style={styles.panel}>
          <div className="hbce-kicker" style={styles.panelLabel}>
            Current Status
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
    fontSize: "clamp(40px, 8vw, 76px)",
    lineHeight: 1,
    letterSpacing: "-0.03em"
  },
  subtitle: {
    margin: 0,
    maxWidth: 760,
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
  }
};

import Link from "next/link";

const CARDS = [
  {
    label: "Operational Core",
    title: "Coordination Engine",
    text:
      "JOKER-C2 opera come motore di coordinamento per analisi, recupero contestuale, risposta strutturata e interazione operativa consapevole del nodo."
  },
  {
    label: "Identity Layer",
    title: "IPR-Bound Logic",
    text:
      "L’applicazione allinea esecuzione, attribuzione operativa persistente e logica verificabile nel quadro IPR / HBCE."
  },
  {
    label: "Node Layer",
    title: "Torino Pilot Node",
    text:
      "Il sistema integra il primo nodo operativo HBCE, con continuità runtime, ledger persistente, verify surface, trust layer e snapshot federativo."
  }
];

const STATUS_ITEMS = [
  {
    key: "Application",
    value: "Online"
  },
  {
    key: "Runtime",
    value: "JOKER-C2 Node-Aware"
  },
  {
    key: "Default Node",
    value: "HBCE-MATRIX-NODE-0001-TORINO"
  },
  {
    key: "Verify Surface",
    value: "/api/verify"
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
          Identity-Bound Operational AI Application and Torino Pilot Node for
          HBCE environments, Matrix Europa deployment logic, structured context
          recovery, and verifiable operational continuity.
        </p>

        <div style={styles.actions}>
          <Link href="/interface" className="hbce-button-primary">
            Open Interface
          </Link>

          <Link href="/node" className="hbce-button-secondary">
            Open Node
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

      <section className="hbce-wrap" style={styles.sectionGap}>
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

      <section className="hbce-wrap">
        <div className="hbce-card" style={styles.panel}>
          <div className="hbce-kicker" style={styles.panelLabel}>
            Operational Access
          </div>

          <div className="hbce-grid-3">
            <Link href="/node" className="hbce-button-secondary" style={styles.inlineButton}>
              Torino Pilot Node
            </Link>
            <Link href="/api/verify" className="hbce-button-secondary" style={styles.inlineButton}>
              Verify API
            </Link>
            <Link href="/api/network" className="hbce-button-secondary" style={styles.inlineButton}>
              Network API
            </Link>
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
    maxWidth: 820,
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
  inlineButton: {
    justifyContent: "center"
  }
};

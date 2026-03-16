import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.kicker}>HBCE Research</div>

        <h1 style={styles.title}>AI JOKER-C2</h1>

        <p style={styles.subtitle}>
          Identity-Bound Operational AI Application for HBCE environments,
          Matrix Europa nodes, and structured operational context recovery.
        </p>

        <div style={styles.actions}>
          <Link href="/interface" style={styles.primaryButton}>
            Open Interface
          </Link>

          <Link href="/ipr" style={styles.secondaryButton}>
            Explore IPR
          </Link>
        </div>
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <div style={styles.cardLabel}>Operational Core</div>
          <h2 style={styles.cardTitle}>Coordination Engine</h2>
          <p style={styles.cardText}>
            Joker-C2 operates as a coordination engine for analysis,
            contextual recovery, structured response generation, and
            node-aware operational interaction.
          </p>
        </article>

        <article style={styles.card}>
          <div style={styles.cardLabel}>Identity Layer</div>
          <h2 style={styles.cardTitle}>IPR-Bound Logic</h2>
          <p style={styles.cardText}>
            The application is designed to align response execution with
            identity-bound workflows, persistent operational attribution,
            and verifiable event logic.
          </p>
        </article>

        <article style={styles.card}>
          <div style={styles.cardLabel}>Territorial Layer</div>
          <h2 style={styles.cardTitle}>Matrix Europa Node</h2>
          <p style={styles.cardText}>
            The current interface is aligned with the Torino experimental node
            and prepared for wider Matrix Europa territorial deployment logic.
          </p>
        </article>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelLabel}>Current Status</div>
        <div style={styles.statusGrid}>
          <div style={styles.statusItem}>
            <span style={styles.statusKey}>Application</span>
            <span style={styles.statusValue}>Online</span>
          </div>

          <div style={styles.statusItem}>
            <span style={styles.statusKey}>Interface</span>
            <span style={styles.statusValue}>Next.js Route</span>
          </div>

          <div style={styles.statusItem}>
            <span style={styles.statusKey}>Chat API</span>
            <span style={styles.statusValue}>Context Recovery Active</span>
          </div>

          <div style={styles.statusItem}>
            <span style={styles.statusKey}>Default Node</span>
            <span style={styles.statusValue}>HBCE-MATRIX-NODE-0001-TORINO</span>
          </div>
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
    fontSize: "clamp(40px, 8vw, 76px)",
    lineHeight: 1,
    letterSpacing: "-0.03em"
  },
  subtitle: {
    margin: 0,
    maxWidth: 760,
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
  }
};

import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="hbce-page">
      <section className="hbce-wrap" style={styles.shell}>
        <div className="hbce-card" style={styles.card}>
          <div className="hbce-kicker" style={styles.kickerSpacing}>
            HBCE Research
          </div>

          <div style={styles.code}>404</div>

          <h1 style={styles.title}>Route not found</h1>

          <p className="hbce-muted" style={styles.text}>
            The requested Joker-C2 route does not exist in the current Next
            application structure, or it has not been deployed in this version.
          </p>

          <div style={styles.actions}>
            <Link href="/" className="hbce-button-primary">
              Back Home
            </Link>

            <Link href="/interface" className="hbce-button-secondary">
              Open Interface
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "calc(100vh - 104px)",
    display: "grid",
    placeItems: "center"
  },
  card: {
    width: "min(100%, 760px)",
    padding: 28,
    textAlign: "center"
  },
  kickerSpacing: {
    marginBottom: 10
  },
  code: {
    fontSize: "clamp(48px, 10vw, 96px)",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    marginBottom: 14
  },
  title: {
    margin: "0 0 12px",
    fontSize: 28
  },
  text: {
    margin: "0 auto",
    maxWidth: 560,
    fontSize: 16,
    lineHeight: 1.8
  },
  actions: {
    marginTop: 24,
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap"
  }
};

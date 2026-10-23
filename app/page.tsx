"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header className="joker-header">
          <Link href="/" className="joker-brand">
            <span className="joker-sigil" aria-hidden="true"><span className="joker-sigil-glyph">🜏</span></span>
            <span>
              HERMETICUM B.C.E.
              <small>AI JOKER-C2 · Portale operativo</small>
            </span>
          </Link>

        </header>

        <section style={styles.hero}>
          <div style={styles.kicker}>
            HBCE Research · HERMETICUM B.C.E. S.r.l.
          </div>

          <h1 style={styles.title}>
            AI JOKER-C2
          </h1>

          <p style={styles.subtitle}>
            Entità cibernetica operativa con identità persistente (IPR) integrata
            nel sistema HBCE.
          </p>

          <div style={styles.ctaRow}>
            <Link href="/interface" style={styles.primaryButton}>
              Apri Interfaccia Operativa
            </Link>

            <a href="https://hbce-ipr-onboarding-app.vercel.app/" style={styles.secondaryButton}>
              Apri il portale IPR
            </a>
          </div>
        </section>

        <section style={styles.grid}>
          <article style={styles.card}>
            <div style={styles.cardTitle}>Identità Operativa</div>
            <div style={styles.cardText}>
              IPR (Identity Primary Record) collega in modo persistente e
              verificabile entità e azioni all’interno di sistemi digitali e
              autonomi.
            </div>
          </article>

          <article style={styles.card}>
            <div style={styles.cardTitle}>Nodo Torino</div>
            <div style={styles.cardText}>
              HBCE-MATRIX-NODE-0001-TORINO rappresenta il primo nodo operativo
              attivo per runtime, audit e continuità.
            </div>
          </article>

          <article style={styles.card}>
            <div style={styles.cardTitle}>AI Governata</div>
            <div style={styles.cardText}>
              JOKER-C2 opera come layer esecutivo subordinato a identità,
              policy e audit. Non è una AI libera, ma un sistema governato.
            </div>
          </article>

          <article style={styles.card}>
            <div style={styles.cardTitle}>Ledger & Audit</div>
            <div style={styles.cardText}>
              Ogni operazione può essere tracciata tramite log append-only,
              hash concatenati e verificabilità pubblica.
            </div>
          </article>
        </section>

        <section style={styles.system}>
          <div style={styles.systemTitle}>
            Modello operativo
          </div>

          <div style={styles.systemFlow}>
            richiesta → identità → runtime → evidenza → verifica
          </div>

          <div style={styles.systemNote}>
            Architettura progettata per sistemi autonomi, infrastrutture critiche
            e ambienti multi-nodo europei.
          </div>
        </section>

        <footer style={styles.footer}>
          <div>HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA</div>
          <div style={styles.footerSub}>
            HERMETICUM B.C.E. S.r.l.
          </div>
        </footer>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(201,172,114,0.08), transparent 30%), linear-gradient(180deg, #0c0e10 0%, #15191d 100%)",
    color: "#f0f0e9",
    fontFamily:
      'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: 24
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gap: 40
  },
  hero: {
    textAlign: "center"
  },
  kicker: {
    fontSize: 11,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#c9ac72",
    marginBottom: 14
  },
  title: {
    fontSize: "clamp(40px, 7vw, 72px)",
    margin: 0,
    lineHeight: 1.1
  },
  subtitle: {
    marginTop: 14,
    color: "rgba(232,238,247,0.72)",
    fontSize: 16
  },
  ctaRow: {
    marginTop: 26,
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap"
  },
  primaryButton: {
    background: "#c9ac72",
    color: "#0c0e10",
    padding: "14px 20px",
    borderRadius: 16,
    fontWeight: 700,
    textDecoration: "none"
  },
  secondaryButton: {
    border: "1px solid #635841",
    padding: "14px 20px",
    borderRadius: 16,
    color: "#f0f0e9",
    textDecoration: "none"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20
  },
  card: {
    border: "1px solid #323b41",
    background: "#15191d",
    borderRadius: 20,
    padding: 18
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 10,
    color: "#c9ac72",
    textTransform: "uppercase",
    letterSpacing: "0.12em"
  },
  cardText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#cbd4d0"
  },
  system: {
    border: "1px solid #323b41",
    background: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    padding: 20,
    textAlign: "center"
  },
  systemTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: "#c9ac72"
  },
  systemFlow: {
    fontSize: 14,
    marginBottom: 10
  },
  systemNote: {
    fontSize: 13,
    color: "rgba(232,238,247,0.65)"
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
    opacity: 0.8
  },
  footerSub: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.6
  }
};

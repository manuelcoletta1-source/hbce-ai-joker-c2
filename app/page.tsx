export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "#e8eef7",
        fontFamily:
          "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px"
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "32px",
          background: "rgba(17,24,33,0.9)"
        }}
      >
        <h1 style={{ marginTop: 0 }}>AI JOKER-C2</h1>

        <p style={{ lineHeight: 1.6, color: "#8fa3b8" }}>
          Identity-Bound Operational AI Application connected to the
          HBCE infrastructure and Matrix Europa experimental node.
        </p>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)"
          }}
        >
          <strong>Default Node</strong>
          <div>HBCE-MATRIX-NODE-0001-TORINO</div>
        </div>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)"
          }}
        >
          <strong>Execution Model</strong>
          <div>request → identity → evidence → verification</div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <a
            href="/interface.html"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              borderRadius: "12px",
              background: "#7dd3fc",
              color: "#06121a",
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            Open Joker-C2 Interface
          </a>
        </div>

        <p style={{ marginTop: "24px", fontSize: "12px", color: "#8fa3b8" }}>
          HBCE Research · HERMETICUM B.C.E. S.r.l.
        </p>
      </div>
    </main>
  )
}

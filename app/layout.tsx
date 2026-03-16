import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI JOKER-C2 | HBCE",
  description:
    "Identity-Bound Operational AI Application for HBCE environments, Matrix Europa nodes, and structured context recovery.",
  applicationName: "AI JOKER-C2",
  keywords: [
    "AI JOKER-C2",
    "HBCE",
    "IPR",
    "Matrix Europa",
    "Operational AI",
    "Context Recovery",
    "Identity-Bound AI"
  ],
  authors: [{ name: "HBCE Research" }],
  creator: "HBCE Research",
  publisher: "HERMETICUM B.C.E. S.r.l."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={styles.body}>{children}</body>
    </html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    minHeight: "100vh",
    background: "#0b0f14",
    color: "#e8eef7",
    fontFamily:
      "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif"
  }
};

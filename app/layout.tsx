import "./globals.css";
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
      <body>{children}</body>
    </html>
  );
}

"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function InterfacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState({
    session: "-",
    node: "HBCE-MATRIX-NODE-0001-TORINO",
    continuity: "-",
    status: "Ready"
  });

  async function send() {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setMeta((m) => ({ ...m, status: "Processing..." }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Unknown error");
      }

      // 🔥 QUI TAGLIAMO IL NODE RUNTIME DAL TESTO
      let cleanResponse = data.response || "";

      if (cleanResponse.includes("[Node Runtime]")) {
        cleanResponse = cleanResponse.split("[Node Runtime]")[0].trim();
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanResponse }
      ]);

      // 🔥 metadata separata
      setMeta({
        session: data.node_runtime?.session_id || "-",
        node: data.node_runtime?.node || "HBCE-MATRIX-NODE-0001-TORINO",
        continuity: data.node_runtime?.continuity_reference || "-",
        status: "Ready"
      });
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Errore: " + err.message }
      ]);
      setMeta((m) => ({ ...m, status: "Error" }));
    }
  }

  return (
    <main style={{ display: "flex", height: "100vh", background: "#0b0f14", color: "#fff" }}>
      
      {/* CHAT */}
      <div style={{ flex: 1, padding: 20 }}>
        <h2>AI JOKER-C2</h2>

        <div style={{ height: "70vh", overflow: "auto", marginBottom: 20 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b>{m.role === "user" ? "You" : "JOKER-C2"}:</b>
              <div>{m.content}</div>
            </div>
          ))}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi..."
          style={{ width: "100%", height: 80 }}
        />

        <button onClick={send} style={{ marginTop: 10 }}>
          Send
        </button>
      </div>

      {/* SIDEBAR */}
      <div style={{ width: 320, borderLeft: "1px solid #222", padding: 20 }}>
        <h3>Execution Context</h3>

        <p><b>Status:</b> {meta.status}</p>
        <p><b>Session:</b> {meta.session}</p>
        <p><b>Node:</b> {meta.node}</p>
        <p><b>Continuity:</b> {meta.continuity}</p>
      </div>

    </main>
  );
}

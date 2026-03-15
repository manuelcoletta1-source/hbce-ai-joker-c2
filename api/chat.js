export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message?.trim();

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const input = message.toLowerCase();
    let reply = "";

    if (input.includes("ciao")) {
      reply = "Joker-C2 online. Connection verified. Interface and API route are operating correctly.";
    } else if (input.includes("ipr")) {
      reply = "IPR is the Identity Primary Record, the foundational identity layer of the HBCE ecosystem.";
    } else if (input.includes("registry")) {
      reply = "The registry layer stores reference structures related to identity, records and operational verification.";
    } else if (input.includes("evidence")) {
      reply = "The evidence layer is designed to produce verifiable operational traces and audit-oriented outputs.";
    } else if (input.includes("joker")) {
      reply = "AI JOKER-C2 is the operational interface layer connected to HBCE identity-bound logic.";
    } else {
      reply = "Joker-C2 received your message: " + message;
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Invalid request body"
    });
  }
}

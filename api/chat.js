function buildReply(message) {
  const input = message.toLowerCase();

  if (input.includes("ciao")) {
    return "Joker-C2 online. Connection verified. Interface, session layer and API route are operating correctly.";
  }

  if (input.includes("ipr")) {
    return "IPR is the Identity Primary Record, the foundational identity layer of the HBCE ecosystem. It binds operational activity to a persistent identity structure.";
  }

  if (input.includes("registry")) {
    return "The registry layer stores reference structures related to identity, records and operational verification inside the HBCE environment.";
  }

  if (input.includes("evidence")) {
    return "The evidence layer is designed to generate verifiable operational traces and audit-oriented outputs.";
  }

  if (input.includes("joker")) {
    return "AI JOKER-C2 is the operational interface layer of the HBCE ecosystem, designed for identity-bound interaction flows.";
  }

  if (input.includes("hbce")) {
    return "HBCE is the operational ecosystem behind Joker-C2, centered on identity, registry and evidence-oriented infrastructure logic.";
  }

  if (input.includes("help")) {
    return "Available test keywords: ciao, ipr, registry, evidence, joker, hbce.";
  }

  return "Joker-C2 received your message. Local response logic is active, but live AI inference is not connected yet.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        error: "Missing message"
      });
    }

    const reply = buildReply(message);

    return res.status(200).json({
      ok: true,
      mode: "local-logic",
      reply
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Invalid request body"
    });
  }
}

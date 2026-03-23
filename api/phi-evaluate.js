import { runJokerPhi } from "../runtime/joker-runtime.js";

function parseBody(req) {
  if (!req || !req.body) return {};
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Metodo non consentito"
    });
  }

  try {
    const body = parseBody(req);
    const input = body?.input || "";

    const output = runJokerPhi(input);

    return res.status(200).json(output);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Errore interno",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

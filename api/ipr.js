import { IPR_EVENT_FORMAT } from "./ipr-format.js";
import { IPR_SAMPLE_EVENT } from "./ipr-sample.js";
import { validateIprEvent } from "./ipr-validator.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const validation = validateIprEvent(IPR_SAMPLE_EVENT);

    return res.status(200).json({
      ok: true,
      service: "joker-c2-ipr",
      format: IPR_EVENT_FORMAT,
      sample_event: validation.normalized_event,
      sample_validation: {
        ok: validation.ok,
        error_count: validation.errors.length
      }
    });
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const validation = validateIprEvent(body);

      return res.status(validation.ok ? 200 : 400).json(validation);
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: "Invalid JSON payload."
      });
    }
  }

  return res.status(405).json({
    ok: false,
    error: "Metodo non consentito"
  });
}

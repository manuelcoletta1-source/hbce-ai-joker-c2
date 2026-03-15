import { evaluateRequest } from "../../runtime/governance-engine.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      status: "DENY",
      reason: "method_not_allowed"
    });
  }

  const payload = req.body;

  if (!payload) {
    return res.status(400).json({
      status: "DENY",
      reason: "missing_payload"
    });
  }

  const decision = await evaluateRequest(payload);

  return res.status(200).json(decision);

}

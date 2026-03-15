import { getRuntimeSession } from "../../runtime/session-runtime.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      status: "DENY",
      reason: "method_not_allowed"
    });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      status: "DENY",
      reason: "missing_session_id"
    });
  }

  const session = getRuntimeSession(session_id);

  if (!session) {
    return res.status(404).json({
      status: "DENY",
      reason: "session_not_found"
    });
  }

  return res.status(200).json({
    status: "ALLOW",
    session: session
  });

}

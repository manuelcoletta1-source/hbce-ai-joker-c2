import { validateRequest } from "../../core/execution-governor.js";
import { bindIdentity } from "../../core/ipr-binding.js";
import { recordEvent } from "../../ledger/event-ledger.js";

export default async function handler(req, res) {

  const validation = validateRequest(req.body);

  if (validation.status === "DENY") {
    return res.status(403).json(validation);
  }

  const identity = bindIdentity();

  const event = recordEvent({
    identity,
    request: req.body.message
  });

  res.status(200).json({
    reply: "Joker-C2 received the request.",
    event
  });

}

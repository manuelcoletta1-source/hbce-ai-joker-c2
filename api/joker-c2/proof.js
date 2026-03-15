import { getLedger } from "../../ledger/event-ledger.js";

export default function handler(req, res) {

  const ledger = getLedger();

  res.status(200).json({
    status: "ALLOW",
    proof_type: "PUBLIC_VERIFICATION_PROOF",
    total_events: ledger.length,
    latest_event: ledger[ledger.length - 1] || null
  });

}

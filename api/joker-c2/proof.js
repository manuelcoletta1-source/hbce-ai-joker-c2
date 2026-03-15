import { buildPublicVerificationProof } from "../../runtime/public-verification-proof.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      status: "DENY",
      reason: "method_not_allowed"
    });
  }

  const proof = buildPublicVerificationProof();

  if (proof.status !== "ALLOW") {
    return res.status(400).json(proof);
  }

  return res.status(200).json(proof);

}

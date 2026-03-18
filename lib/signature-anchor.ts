import crypto from "crypto";

export function signResponse(text: string, privateKey: string) {
  const sign = crypto.createSign("SHA256");
  sign.update(text);
  sign.end();

  return sign.sign(privateKey, "base64");
}

export function buildAnchor(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

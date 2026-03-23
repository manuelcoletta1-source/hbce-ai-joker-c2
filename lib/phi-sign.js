import crypto from "crypto";

export function generateKeyPair() {
  return crypto.generateKeyPairSync("ed25519");
}

export function signManifest(canonical, privateKey) {
  return crypto.sign(null, Buffer.from(canonical), privateKey).toString("hex");
}

export function verifyManifest(canonical, signature, publicKey) {
  return crypto.verify(
    null,
    Buffer.from(canonical),
    publicKey,
    Buffer.from(signature, "hex")
  );
}

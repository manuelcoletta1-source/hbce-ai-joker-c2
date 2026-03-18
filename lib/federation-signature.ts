import crypto from "crypto";

export type FederationSignedEnvelope = {
  node_id: string;
  algorithm: "ED25519";
  response: string;
  anchor: string;
  timestamp: string;
  signature: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function buildAnchor(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function normalizePem(value: string | undefined): string | null {
  if (!value || !value.trim()) {
    return null;
  }

  return value.replace(/\\n/g, "\n").trim();
}

function getAvailablePrivateKey(): string | null {
  return (
    normalizePem(process.env.JOKER_SIGN_PRIVATE_KEY) ||
    normalizePem(process.env.JOKER_PRIVATE_KEY)
  );
}

function stablePayload(
  nodeId: string,
  response: string,
  anchor: string,
  timestamp: string
): string {
  return JSON.stringify({
    node_id: nodeId,
    response,
    anchor,
    timestamp
  });
}

export function federationSignatureIsConfigured(): boolean {
  return Boolean(getAvailablePrivateKey());
}

export function signFederationResponse(
  nodeId: string,
  response: string
): FederationSignedEnvelope | null {
  const privateKeyPem = getAvailablePrivateKey();

  if (!privateKeyPem) {
    return null;
  }

  const timestamp = nowIso();
  const anchor = buildAnchor(response);
  const payload = stablePayload(nodeId, response, anchor, timestamp);

  const signature = crypto.sign(
    null,
    Buffer.from(payload, "utf-8"),
    crypto.createPrivateKey(privateKeyPem)
  );

  return {
    node_id: nodeId,
    algorithm: "ED25519",
    response,
    anchor,
    timestamp,
    signature: signature.toString("base64")
  };
}

export function verifyFederationResponse(
  envelope: FederationSignedEnvelope,
  publicKeyPem: string
): boolean {
  const normalizedPublicKey = normalizePem(publicKeyPem);

  if (!normalizedPublicKey) {
    return false;
  }

  const payload = stablePayload(
    envelope.node_id,
    envelope.response,
    envelope.anchor,
    envelope.timestamp
  );

  const recalculatedAnchor = buildAnchor(envelope.response);
  if (recalculatedAnchor !== envelope.anchor) {
    return false;
  }

  return crypto.verify(
    null,
    Buffer.from(payload, "utf-8"),
    crypto.createPublicKey(normalizedPublicKey),
    Buffer.from(envelope.signature, "base64")
  );
}

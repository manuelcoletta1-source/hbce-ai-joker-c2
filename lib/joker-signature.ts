import crypto from "crypto";

export type JokerSignatureEnvelope = {
  algorithm: "ED25519";
  public_key: string;
  signature: string;
  payload_hash: string;
  signed_at: string;
};

type SignablePayload = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizePem(value: string | undefined): string {
  if (!value) {
    throw new Error("Missing signature key material");
  }

  return value.replace(/\\n/g, "\n").trim();
}

function getPrivateKeyPem(): string {
  return normalizePem(process.env.JOKER_SIGN_PRIVATE_KEY);
}

function derivePublicKeyPemFromPrivate(privateKeyPem: string): string {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const publicKey = crypto.createPublicKey(privateKey);

  return publicKey.export({
    type: "spki",
    format: "pem"
  }) as string;
}

function getPublicKeyPem(): string {
  const explicitPublicKey = process.env.JOKER_SIGN_PUBLIC_KEY;

  if (explicitPublicKey && explicitPublicKey.trim()) {
    return normalizePem(explicitPublicKey);
  }

  return derivePublicKeyPemFromPrivate(getPrivateKeyPem());
}

function exportPublicKeyBase64(publicKeyPem: string): string {
  const keyObject = crypto.createPublicKey(publicKeyPem);

  const der = keyObject.export({
    type: "spki",
    format: "der"
  }) as Buffer;

  return der.toString("base64");
}

export function signatureIsConfigured(): boolean {
  return Boolean(process.env.JOKER_SIGN_PRIVATE_KEY);
}

export function hashSignablePayload(payload: SignablePayload): string {
  return sha256(stableStringify(payload));
}

export function signJokerPayload(
  payload: SignablePayload
): JokerSignatureEnvelope {
  const privateKeyPem = getPrivateKeyPem();
  const publicKeyPem = getPublicKeyPem();

  const serialized = stableStringify(payload);
  const payloadHash = sha256(serialized);

  const signatureBuffer = crypto.sign(
    null,
    Buffer.from(serialized, "utf-8"),
    crypto.createPrivateKey(privateKeyPem)
  );

  return {
    algorithm: "ED25519",
    public_key: exportPublicKeyBase64(publicKeyPem),
    signature: signatureBuffer.toString("base64"),
    payload_hash: payloadHash,
    signed_at: nowIso()
  };
}

export function verifyJokerSignature(
  payload: SignablePayload,
  envelope: JokerSignatureEnvelope
): boolean {
  const publicKeyPem = getPublicKeyPem();
  const serialized = stableStringify(payload);
  const payloadHash = sha256(serialized);

  if (payloadHash !== envelope.payload_hash) {
    return false;
  }

  return crypto.verify(
    null,
    Buffer.from(serialized, "utf-8"),
    crypto.createPublicKey(publicKeyPem),
    Buffer.from(envelope.signature, "base64")
  );
}

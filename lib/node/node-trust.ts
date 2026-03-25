import {
  signJokerPayload,
  signatureIsConfigured,
  verifyJokerSignature,
  type JokerSignatureEnvelope
} from "../joker-signature";

import type {
  HBCEPublicKeyInfo,
  HBCESignatureRef
} from "./node-types";

const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_ISSUER = "JOKER-C2";
const DEFAULT_ISSUED_BY = "HERMETICUM B.C.E. S.r.l.";

function normalizePem(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\\n/g, "\n").trim();
}

function exportConfiguredPublicKeyBase64(): string {
  const explicit = normalizePem(process.env.JOKER_SIGN_PUBLIC_KEY);
  const envBase64 = (process.env.JOKER_PUBLIC_KEY || "").trim();

  if (envBase64) {
    return envBase64;
  }

  if (!explicit) {
    return "";
  }

  return explicit;
}

export function nodeTrustIsConfigured(): boolean {
  return signatureIsConfigured();
}

export function nodeGetPublicKeyInfo(): HBCEPublicKeyInfo | null {
  const publicKey = exportConfiguredPublicKeyBase64();

  if (!publicKey) {
    return null;
  }

  return {
    algorithm: "ED25519",
    public_key: publicKey,
    issuer: DEFAULT_ISSUER,
    node: DEFAULT_NODE,
    issued_by: DEFAULT_ISSUED_BY
  };
}

export function nodeSignPayload(
  payload: Record<string, unknown>
): HBCESignatureRef | null {
  if (!signatureIsConfigured()) {
    return null;
  }

  const signature = signJokerPayload(payload);

  return {
    algorithm: signature.algorithm,
    public_key: signature.public_key,
    signature: signature.signature,
    payload_hash: signature.payload_hash,
    signed_at: signature.signed_at
  };
}

export function nodeVerifyPayload(
  payload: Record<string, unknown>,
  signature: JokerSignatureEnvelope
): boolean {
  return verifyJokerSignature(payload, signature);
}

export function nodeGetTrustSummary(): {
  enabled: boolean;
  algorithm: "ED25519";
  issuer: string;
  node: string;
  issued_by: string;
  public_key_available: boolean;
} {
  const publicKeyInfo = nodeGetPublicKeyInfo();

  return {
    enabled: nodeTrustIsConfigured(),
    algorithm: "ED25519",
    issuer: DEFAULT_ISSUER,
    node: DEFAULT_NODE,
    issued_by: DEFAULT_ISSUED_BY,
    public_key_available: Boolean(publicKeyInfo?.public_key)
  };
}

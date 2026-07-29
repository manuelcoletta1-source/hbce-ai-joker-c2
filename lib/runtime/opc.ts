import { createHash } from "node:crypto";

import { RUNTIME_VERSION } from "./constants";
import { RuntimeEvent } from "./event";

export interface OPCReceipt {
  receiptId: string;
  eventId: string;
  eventHash: string;
  runtimeVersion: string;
  issuedAt: string;
  previousReceiptHash: string | null;
  receiptHash: string;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize(record[k])}`)
    .join(",")}}`;
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(canonicalize(value), "utf8")
    .digest("hex");
}

export function createOPCReceipt(
  event: RuntimeEvent,
  receiptId: string,
  issuedAt: string,
  previousReceiptHash: string | null = null,
): OPCReceipt {
  if (!receiptId.trim()) {
    throw new Error("OPC_RECEIPT_REQUIRED");
  }

  if (Number.isNaN(Date.parse(issuedAt))) {
    throw new Error("OPC_TIMESTAMP_INVALID");
  }

  const payload = {
    receiptId,
    eventId: event.eventId,
    eventHash: event.eventHash,
    runtimeVersion: RUNTIME_VERSION,
    issuedAt,
    previousReceiptHash,
  };

  return {
    ...payload,
    receiptHash: sha256(payload),
  };
}

export function verifyOPCReceipt(receipt: OPCReceipt): boolean {
  const { receiptHash, ...payload } = receipt;

  return sha256(payload) === receiptHash;
}

import crypto from "crypto";

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function buildPhiManifest({ input, candidates, selected, measurement }) {
  const ts = new Date().toISOString();

  const manifest = {
    version: "HBCE-PHI-1",
    ts,
    state: measurement?.state,
    input,
    selected: selected?.id,
    trace: selected?.traceId,
    probability: measurement?.probability,
    measurement
  };

  const canonical = stableStringify(manifest);
  const manifestHash = sha256(canonical);

  return { manifest, canonical, manifestHash };
}

import { phiEngine } from "../lib/phi-engine.js";
import { buildPhiManifest } from "../lib/phi-audit.js";
import { appendPhiLog } from "../lib/phi-log.js";
import { generateKeyPair, signManifest } from "../lib/phi-sign.js";

const { privateKey, publicKey } = generateKeyPair();

function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

async function llmGenerateMultiple(input) {
  return [
    { id: "a", content: `Direct: ${input}`, source: "llm", confidence: 0.85, risk: 0.2, traceId: "a", strategy: "direct" },
    { id: "b", content: `Structured: ${input}`, source: "llm", confidence: 0.82, risk: 0.15, traceId: "b", strategy: "structured" },
    { id: "c", content: `Safe: ${input}`, source: "llm", confidence: 0.78, risk: 0.1, traceId: "c", strategy: "safe" }
  ];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { input } = parseBody(req);

  const candidates = await llmGenerateMultiple(input);
  const result = phiEngine(candidates);

  if (result.status === "FAIL_CLOSED") {
    return res.status(200).json({ ok: false, state: "FAIL_CLOSED" });
  }

  const manifestBundle = buildPhiManifest({
    input,
    candidates,
    selected: result.effect,
    measurement: result.measurement
  });

  const signature = signManifest(manifestBundle.canonical, privateKey);

  appendPhiLog({
    ts: new Date().toISOString(),
    hash: manifestBundle.manifestHash,
    signature
  });

  return res.status(200).json({
    ok: true,
    state: "PASS",
    message: result.effect.content,
    probability: result.measurement.probability,
    trace: result.effect.traceId,
    hash: manifestBundle.manifestHash,
    signature,
    pub: publicKey.export({ type: "spki", format: "pem" })
  });
}

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verifyManifest } from "../lib/phi-sign.js";

const LOG_FILE = path.join(process.cwd(), "runtime", "logs", "phi-events.ndjson");

function parseBody(req) {
  if (!req || !req.body) return {};
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function findEventByHash(hash) {
  if (!fs.existsSync(LOG_FILE)) {
    return null;
  }

  const raw = fs.readFileSync(LOG_FILE, "utf8").trim();
  if (!raw) {
    return null;
  }

  const lines = raw.split("\n");

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const entry = JSON.parse(lines[i]);
      if (entry.hash === hash || entry.manifest_hash === hash || entry.manifest_hash_sha256 === hash) {
        return entry;
      }
    } catch (_error) {
      continue;
    }
  }

  return null;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Metodo non consentito"
    });
  }

  try {
    const body = parseBody(req);

    const hash = body?.hash || "";
    const signature = body?.signature || "";
    const publicKeyPem = body?.public_key || "";
    const canonical = body?.canonical || "";

    if (!hash || !signature || !publicKeyPem || !canonical) {
      return res.status(400).json({
        ok: false,
        error: "Parametri mancanti"
      });
    }

    const entry = findEventByHash(hash);

    if (!entry) {
      return res.status(200).json({
        ok: false,
        verified: false,
        state: "NOT_FOUND",
        reason: "hash non trovato nel log"
      });
    }

    const publicKey = crypto.createPublicKey(publicKeyPem);
    const verified = verifyManifest(canonical, signature, publicKey);

    return res.status(200).json({
      ok: true,
      verified,
      state: verified ? "VALID" : "INVALID",
      hash,
      log_found: true,
      log_ts: entry.ts || null
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Errore interno",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

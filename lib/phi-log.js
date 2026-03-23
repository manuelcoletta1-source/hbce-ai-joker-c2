import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "runtime", "logs");
const LOG_FILE = path.join(LOG_DIR, "phi-events.ndjson");

export function appendPhiLog(entry) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");

  return LOG_FILE;
}

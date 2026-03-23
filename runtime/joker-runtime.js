import { generatePossibilities } from "../lib/phi-generate.js";
import { phiEngine } from "../lib/phi-engine.js";

export function runJokerPhi(input) {
  const possibilities = generatePossibilities(input);
  const result = phiEngine(possibilities);

  if (result.status === "FAIL_CLOSED") {
    return {
      ok: false,
      message: "No valid operational effect generated.",
      result
    };
  }

  return {
    ok: true,
    message: result.effect.content,
    strategy: result.effect.strategy,
    probability: result.measurement.probability,
    trace: result.effect.traceId,
    result
  };
}

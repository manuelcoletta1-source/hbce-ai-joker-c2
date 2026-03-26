import { validateIpr } from "../runtime/ipr-check.js";
import { evaluateDecision } from "../runtime/decision-gate.js";
import { createTracEvent } from "../runtime/trac-event.js";

const ipr = {
  id: "IPR-0001",
  type: "human",
  role: "operator",
  capabilities: ["pilot.initialization", "pilot.execution"],
  status: "active"
};

function runDemo(intent, prevEvent = null, index = 1) {
  const iprValidation = validateIpr(ipr);

  if (!iprValidation.ok) {
    return {
      error: iprValidation.reason
    };
  }

  const decisionResult = evaluateDecision({ ipr, intent });

  const event = createTracEvent({
    index,
    prevEvent,
    ipr,
    intent
  });

  return {
    input: {
      intent
    },
    decision: decisionResult,
    event
  };
}

// DEMO FLOW

const step1 = runDemo("pilot.initialization", null, 1);
const step2 = runDemo("pilot.execution", step1.event, 2);
const step3 = runDemo("pilot.shutdown", step2.event, 3);

const chain = [step1.event, step2.event, step3.event];

console.log(
  JSON.stringify(
    {
      demo: [step1, step2, step3],
      chain
    },
    null,
    2
  )
);

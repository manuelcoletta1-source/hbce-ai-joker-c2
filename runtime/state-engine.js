const VALID_STATES = [
  "INIT",
  "IDENTIFIED",
  "VALIDATED",
  "GOVERNANCE_CHECKED",
  "ALLOWED",
  "DENIED",
  "EVIDENCE_GENERATED",
  "COMPLETED"
];

export function createInitialState(payload) {
  return {
    session_id: payload.session_id || null,
    subject: payload.subject || null,
    current_state: "INIT",
    history: [
      {
        state: "INIT",
        timestamp: new Date().toISOString()
      }
    ]
  };
}

export function transitionState(machine, nextState) {
  if (!VALID_STATES.includes(nextState)) {
    return {
      ...machine,
      current_state: "DENIED",
      history: [
        ...machine.history,
        {
          state: "DENIED",
          timestamp: new Date().toISOString(),
          reason: "invalid_state_transition"
        }
      ]
    };
  }

  return {
    ...machine,
    current_state: nextState,
    history: [
      ...machine.history,
      {
        state: nextState,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

export function buildStateFlow(payload, decision) {
  let machine = createInitialState(payload);

  machine = transitionState(machine, "IDENTIFIED");
  machine = transitionState(machine, "VALIDATED");
  machine = transitionState(machine, "GOVERNANCE_CHECKED");

  if (decision.status === "ALLOW") {
    machine = transitionState(machine, "ALLOWED");
  } else {
    machine = transitionState(machine, "DENIED");
  }

  machine = transitionState(machine, "EVIDENCE_GENERATED");
  machine = transitionState(machine, "COMPLETED");

  return machine;
}

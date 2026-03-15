const ledger = [];

export function recordEvent(event) {

  ledger.push({
    id: "EVT-" + (ledger.length + 1),
    timestamp: Date.now(),
    ...event
  });

  return ledger[ledger.length - 1];

}

export function getLedger() {
  return ledger;
}

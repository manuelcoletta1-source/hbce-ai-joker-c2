import { buildMerkleRoot } from "./event-merkle-chain.js";

const eventLedger = [];

function buildEventId() {
  const nextNumber = eventLedger.length + 1;
  return `EVT-${String(nextNumber).padStart(4, "0")}`;
}

function buildHash(input) {
  const text = JSON.stringify(input);
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return `hash-${Math.abs(hash)}`;
}

export function appendEvent(payload) {

  const previousEvent = eventLedger[eventLedger.length - 1] || null;

  const event = {
    event_id: buildEventId(),
    timestamp: new Date().toISOString(),
    previous_event_id: previousEvent ? previousEvent.event_id : null,
    previous_hash: previousEvent ? previousEvent.event_hash : null,
    payload
  };

  event.event_hash = buildHash({
    event_id: event.event_id,
    timestamp: event.timestamp,
    previous_event_id: event.previous_event_id,
    previous_hash: event.previous_hash,
    payload: event.payload
  });

  eventLedger.push(event);

  const merkle = buildMerkleRoot();

  event.merkle_root = merkle.merkle_root || null;

  return event;
}

export function getEventLedger() {
  return eventLedger;
}

import { IPR_EVENT_FORMAT, canonicalizeIprEvent } from "./ipr-format.js";

const TIMESTAMP_STATES = new Set(["LOCKED", "PROVISIONAL", "REVOKED"]);
const POLICY_DECISIONS = new Set(["ALLOW", "DENY", "HOLD"]);
const AUDIT_SCOPES = new Set(["LOCAL", "GLOBAL"]);
const STATUS_VALUES = new Set(["ACTIVE", "FROZEN", "SUSPENDED", "REVOKED"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIso8601(value) {
  if (!isNonEmptyString(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function pushError(errors, field, message) {
  errors.push({ field, message });
}

export function validateIprEvent(input) {
  const event = canonicalizeIprEvent(input);
  const errors = [];

  for (const field of IPR_EVENT_FORMAT.required_fields) {
    if (event[field] === undefined || event[field] === null) {
      pushError(errors, field, "Missing required field.");
    }
  }

  if (!isNonEmptyString(event.event_id)) {
    pushError(errors, "event_id", "event_id must be a non-empty string.");
  }

  if (!isIso8601(event.timestamp.iso8601)) {
    pushError(errors, "timestamp.iso8601", "timestamp.iso8601 must be a valid ISO-8601 value.");
  }

  if (!TIMESTAMP_STATES.has(event.timestamp.state)) {
    pushError(errors, "timestamp.state", "timestamp.state is not valid.");
  }

  if (!isNonEmptyString(event.subject.entity_name)) {
    pushError(errors, "subject.entity_name", "subject.entity_name must be present.");
  }

  if (!isNonEmptyString(event.subject.ipr_id)) {
    pushError(errors, "subject.ipr_id", "subject.ipr_id must be present.");
  }

  if (!isNonEmptyString(event.root.root_id)) {
    pushError(errors, "root.root_id", "root.root_id must be present.");
  }

  if (!AUDIT_SCOPES.has(event.audit.chain_scope)) {
    pushError(errors, "audit.chain_scope", "audit.chain_scope must be LOCAL or GLOBAL.");
  }

  if (!POLICY_DECISIONS.has(event.policy.decision)) {
    pushError(errors, "policy.decision", "policy.decision must be ALLOW, DENY or HOLD.");
  }

  if (!isNonEmptyString(event.hash_chain.current_event_sha512)) {
    pushError(errors, "hash_chain.current_event_sha512", "hash_chain.current_event_sha512 must be present.");
  }

  if (!isNonEmptyString(event.hash_chain.merkle_root_sha512)) {
    pushError(errors, "hash_chain.merkle_root_sha512", "hash_chain.merkle_root_sha512 must be present.");
  }

  if (!STATUS_VALUES.has(event.status.state)) {
    pushError(errors, "status.state", "status.state is not valid.");
  }

  if (!isNonEmptyString(event.system.domain)) {
    pushError(errors, "system.domain", "system.domain must be present.");
  }

  if (!isNonEmptyString(event.system.core_version)) {
    pushError(errors, "system.core_version", "system.core_version must be present.");
  }

  if (!isNonEmptyString(event.system.organization)) {
    pushError(errors, "system.organization", "system.organization must be present.");
  }

  if (event.parent_event_id !== null && !isNonEmptyString(event.parent_event_id)) {
    pushError(errors, "parent_event_id", "parent_event_id must be null or a non-empty string.");
  }

  if (event.ref_events.length) {
    event.ref_events.forEach((ref, index) => {
      if (!isNonEmptyString(ref.ref_id)) {
        pushError(errors, `ref_events[${index}].ref_id`, "ref_id must be present.");
      }
      if (!isIso8601(ref.timestamp)) {
        pushError(errors, `ref_events[${index}].timestamp`, "timestamp must be ISO-8601.");
      }
      if (!isNonEmptyString(ref.type)) {
        pushError(errors, `ref_events[${index}].type`, "type must be present.");
      }
    });
  }

  return {
    ok: errors.length === 0,
    format: IPR_EVENT_FORMAT.name,
    version: IPR_EVENT_FORMAT.version,
    errors,
    normalized_event: event
  };
}

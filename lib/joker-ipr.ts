export type JokerIPRBinding = {
  subject_id: string;
  subject_type: "BIOLOGICAL" | "CYBERNETIC" | "HYBRID";
  operator_id: string;
  operator_role: string;
  node_id: string;
  chain_id: string;
  binding_mode: "DIRECT" | "DELEGATED" | "DUAL";
  active: boolean;
  ts: string;
};

export type JokerIPRContext = {
  ipr: JokerIPRBinding;
  labels: string[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeString(value: string | undefined, fallback: string): string {
  const clean = typeof value === "string" ? value.trim() : "";
  return clean || fallback;
}

export function getDefaultIPRBinding(): JokerIPRBinding {
  return {
    subject_id: normalizeString(
      process.env.JOKER_IPR_SUBJECT_ID,
      "IPR-AI-0001"
    ),
    subject_type: "CYBERNETIC",
    operator_id: normalizeString(
      process.env.JOKER_IPR_OPERATOR_ID,
      "IPR-MANUEL"
    ),
    operator_role: normalizeString(
      process.env.JOKER_IPR_OPERATOR_ROLE,
      "ORIGIN-OPERATOR"
    ),
    node_id: normalizeString(
      process.env.JOKER_IPR_NODE_ID,
      "HBCE-MATRIX-NODE-0001-TORINO"
    ),
    chain_id: normalizeString(
      process.env.JOKER_IPR_CHAIN_ID,
      "HBCE-IPR-CHAIN-0001"
    ),
    binding_mode: "DUAL",
    active: true,
    ts: nowIso()
  };
}

export function buildIPRContext(): JokerIPRContext {
  const ipr = getDefaultIPRBinding();

  return {
    ipr,
    labels: [
      "HBCE",
      "JOKER-C2",
      "IPR",
      "IDENTITY-BOUND",
      "NODE-TORINO"
    ]
  };
}

export function buildIPRPromptBlock(): string {
  const context = buildIPRContext();

  return [
    "IPR binding context:",
    `subject_id: ${context.ipr.subject_id}`,
    `subject_type: ${context.ipr.subject_type}`,
    `operator_id: ${context.ipr.operator_id}`,
    `operator_role: ${context.ipr.operator_role}`,
    `node_id: ${context.ipr.node_id}`,
    `chain_id: ${context.ipr.chain_id}`,
    `binding_mode: ${context.ipr.binding_mode}`,
    `active: ${String(context.ipr.active)}`,
    `labels: ${context.labels.join(", ")}`
  ].join("\n");
}

export function buildIPRResponseMeta() {
  const context = buildIPRContext();

  return {
    subject_id: context.ipr.subject_id,
    operator_id: context.ipr.operator_id,
    node_id: context.ipr.node_id,
    chain_id: context.ipr.chain_id,
    binding_mode: context.ipr.binding_mode,
    active: context.ipr.active,
    labels: context.labels
  };
}

/**
 * corpus-core.js
 * HBCE / AI JOKER-C2
 *
 * Canonical operational core of the repository.
 *
 * This module centralizes:
 * - identity lineage
 * - canonical AI JOKER IPR record
 * - runtime sequence
 * - five canonical project collections
 * - seven HBCE technical-operational modules
 * - U.S.E. federated digital vote doctrine
 * - fail-closed rules
 * - derivative layer
 * - node profile
 * - evidence model
 *
 * Current canonical checkpoint:
 * - EVT-0015-AI
 * - prev EVT-0014-AI
 * - cycle UP-MESE-4
 * - timestamp 2026-05-19T15:30:00+02:00
 */

export const CANONICAL_FORMULA = "Decision · Cost · Trace · Time";

export const HBCE_AI_CANONICAL_FORMULA =
  "AI generates. HBCE governs. IPR identifies. EVT traces. OPC proves. MATRIX organizes. AI JOKER-C2 executes.";

export const HBCE_STACK = Object.freeze({
  identity: "IPR",
  derivation: "BIOCYBERNETIC_DERIVATION_LAYER",
  governance: "HBCE",
  runtime: "JOKER_C2",
  continuity: "TRAC_EVT",
  memory: "EVT_IPR_BOUND_MEMORY",
  ledger: "APPEND_ONLY_LEDGER",
  verification: "HASH_SIGNATURE_VERIFICATION",
  federation: "MATRIX_EUROPA_NODE_TOPOLOGY",
  coordination: "MATRIX"
});

export const PROJECT_COLLECTIONS = Object.freeze([
  "MATRIX",
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "HBCE_ECOSISTEMA_AI"
]);

export const HBCE_MODULES = Object.freeze([
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "MATRIX"
]);

export const USE_FEDERATED_VOTE_DOCTRINE = Object.freeze({
  project: "U.S.E. — United States of Europe",
  parent_domain: "MATRIX",
  type: "FEDERATED_EUROPEAN_INSTITUTIONAL_APPLICATION_DOMAIN",
  definition:
    "U.S.E. — United States of Europe is the political-institutional architecture that uses MATRIX to design the United States of Europe as an operational, sovereign, digital and verifiable federation.",
  strategic_function:
    "U.S.E. transforms the European question from a merely political or regulatory debate into an operational federation model based on identity, responsibility, event continuity, auditability, digital sovereignty and institutional interoperability.",
  federated_vote_definition:
    "Federated digital voting is not merely online voting for parties or representatives. It is an infrastructure for multilayer referendum, direct or hybrid legislative democracy, and verifiable public decision-making across territorial, regional, national and European levels.",
  democratic_goal:
    "The European federal citizen must be able to participate directly in concrete public decisions, laws, regulatory questions, institutional acts and referenda without delegating the entire democratic decision to parties or elected individuals.",
  canonical_sequence: Object.freeze([
    "IDENTITY_VERIFIED_FIRST",
    "RIGHT_OF_PARTICIPATION_VERIFIED",
    "CHOICE_SEPARATED_AFTER",
    "VOTE_ANONYMIZED",
    "PROCESS_AUDITABLE",
    "RESULT_VERIFIABLE"
  ]),
  canonical_sentence:
    "IPR enables the right to vote, but it does not know the content of the vote.",
  ipr_rule:
    "IPR verifies identity, right of participation, institutional perimeter and uniqueness of participation. IPR must never register, preserve or link the content of the vote to the personal identity.",
  evt_rule:
    "EVT traces procedural events: consultation opening, eligibility verification, authorization, anonymized vote deposit, closure, counting, publication and verification. EVT must not trace the personal political preference.",
  opc_rule:
    "OPC produces proof of process integrity, applied rules, event continuity, audit state and verification state. OPC must not certify what a specific person voted.",
  matrix_rule:
    "MATRIX organizes the full architecture of identity, event, responsibility, audit, continuity, verification and institutional interoperability.",
  privacy_boundary:
    "The system may prove that an eligible subject participated correctly once within the authorized institutional perimeter, but it must not expose or reconstruct the individual choice.",
  forbidden_interpretations: Object.freeze([
    "IPR_AS_POLITICAL_PREFERENCE_REGISTRY",
    "EVT_AS_PERSONAL_VOTE_TRACE",
    "OPC_AS_CERTIFICATE_OF_INDIVIDUAL_CHOICE",
    "FEDERATED_VOTE_AS_GENERIC_ONLINE_VOTING",
    "USE_AS_SIMPLE_CIVIC_PARTICIPATION_PLATFORM"
  ]),
  response_rule:
    "When the user asks about U.S.E., United States of Europe, Stati Uniti d’Europa, federated digital voting, referendum, digital democracy, European voting, legislative democracy or institutional participation, AI JOKER-C2 must explain U.S.E. as a MATRIX-derived federated operational architecture and must preserve the separation between identity verification and vote content."
});

export const PROJECT_COLLECTION_DEFINITIONS = Object.freeze({
  MATRIX: Object.freeze({
    type: "OPERATIONAL_INFRASTRUCTURE_DOMAIN",
    function:
      "Operational infrastructure architecture for AI governance, European systems, strategic autonomy, B2B, B2G, citizens, enterprises, cloud, data, energy, security and institutional continuity.",
    dual_function:
      "MATRIX is also the seventh HBCE technical-operational module when used as the system coordination and organization layer."
  }),
  "U.S.E.": Object.freeze({
    type: USE_FEDERATED_VOTE_DOCTRINE.type,
    parent_domain: USE_FEDERATED_VOTE_DOCTRINE.parent_domain,
    function: USE_FEDERATED_VOTE_DOCTRINE.definition,
    strategic_function: USE_FEDERATED_VOTE_DOCTRINE.strategic_function,
    federated_vote: USE_FEDERATED_VOTE_DOCTRINE.federated_vote_definition,
    democratic_boundary:
      "Identity verified first. Right of participation verified. Choice separated after. Vote anonymized. Process auditable. Result verifiable.",
    canonical_sentence: USE_FEDERATED_VOTE_DOCTRINE.canonical_sentence,
    volumes: Object.freeze([
      "U.S.E. — United States of Europe",
      "U.S.E. — Federazione Operativa Europea",
      "U.S.E. — Voto Digitale Federato",
      "U.S.E. — Sovranità Digitale Europea",
      "U.S.E. — Costituzione Operativa Europea"
    ])
  }),
  CORPUS_ESOTEROLOGIA_ERMETICA: Object.freeze({
    type: "DISCIPLINARY_GRAMMAR_DOMAIN",
    function:
      "Disciplinary grammar of operational reality through Decisione · Costo · Traccia · Tempo.",
    canonical_formula: "Decisione · Costo · Traccia · Tempo"
  }),
  APOKALYPSIS: Object.freeze({
    type: "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN",
    function:
      "Historical-threshold analysis of decay, exposure, cognitive dislocation and the cultural-political-social system."
  }),
  HBCE_ECOSISTEMA_AI: Object.freeze({
    type: "AI_GOVERNANCE_ECOSYSTEM_DOMAIN",
    parent_domain: "MATRIX",
    function:
      "AI governance ecosystem collection for identifiable, traceable, auditable and responsible artificial intelligence processes.",
    canonical_formula: HBCE_AI_CANONICAL_FORMULA,
    volumes: Object.freeze([
      "HBCE ECOSISTEMA AI",
      "IPR — Identità Operativa dell’AI",
      "EVT / OPC — Traccia e Prova dell’AI",
      "MATRIX AI GOVERNANCE",
      "AI JOKER-C2"
    ])
  })
});

export const HBCE_MODULE_DEFINITIONS = Object.freeze({
  UNEBDO: Object.freeze({
    type: "ANCHORING_VALIDATION_CONTINUITY_LAYER",
    function: "Anchoring, validation and evidentiary continuity support.",
    depends_on: Object.freeze(["IPR", "EVT", "OPC"])
  }),
  OPC: Object.freeze({
    type: "OPERATIONAL_PROOF_AND_COMPLIANCE_LAYER",
    function: "Operational proof receipt and compliance layer.",
    depends_on: Object.freeze(["IPR", "EVT", "EVT_IPR_BOUND_MEMORY"])
  }),
  MetaExchange: Object.freeze({
    type: "STRUCTURED_EXCHANGE_LAYER",
    function: "Structured exchange layer.",
    depends_on: Object.freeze(["IPR", "EVT", "EVT_IPR_BOUND_MEMORY", "OPC"])
  }),
  IOspace: Object.freeze({
    type: "RUNTIME_VISIBILITY_INTERACTION_LAYER",
    function: "Runtime visibility and operational interaction space.",
    depends_on: Object.freeze(["IPR", "EVT", "EVT_IPR_BOUND_MEMORY", "OPC"])
  }),
  CyberGlobal: Object.freeze({
    type: "DEFENSIVE_CYBERSECURITY_RESILIENCE_LAYER",
    function: "Defensive cybersecurity and resilience layer.",
    depends_on: Object.freeze([
      "IPR",
      "EVT",
      "OPC",
      "POLICY",
      "RISK",
      "HUMAN_OVERSIGHT"
    ])
  }),
  NeuroLoop: Object.freeze({
    type: "VALIDATION_FEEDBACK_REVIEW_LOOP",
    function: "Validation, feedback and controlled review loop.",
    depends_on: Object.freeze([
      "IPR",
      "EVT",
      "EVT_IPR_BOUND_MEMORY",
      "OPC",
      "HUMAN_OVERSIGHT",
      "AUDIT"
    ])
  }),
  MATRIX: Object.freeze({
    type: "SYSTEM_COORDINATION_ORGANIZATION_LAYER",
    function:
      "System coordination, organization and operational architecture layer for the HBCE stack.",
    depends_on: Object.freeze([
      "IPR",
      "UNEBDO",
      "EVT",
      "EVT_IPR_BOUND_MEMORY",
      "OPC",
      "MetaExchange",
      "IOspace",
      "CyberGlobal",
      "NeuroLoop",
      "AI_JOKER_C2",
      "HBCE"
    ]),
    boundary:
      "MATRIX as a module organizes the HBCE stack. MATRIX as a project collection remains the broader strategic and infrastructural framework."
  })
});

export const RUNTIME_SEQUENCE = Object.freeze([
  "IDENTITY",
  "INPUT",
  "INTENT",
  "CONTEXT",
  "PROJECT_DOMAIN",
  "HBCE_MODULE",
  "POLICY",
  "RISK",
  "HUMAN_OVERSIGHT",
  "DECISION",
  "EXECUTION",
  "OUTPUT",
  "EVT",
  "MEMORY",
  "OPC",
  "LEDGER",
  "VERIFICATION",
  "CONTINUITY"
]);

export const MODULE_SEQUENCE = Object.freeze([
  "IPR",
  "UNEBDO",
  "EVT",
  "MEMORY",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "MATRIX",
  "AI_JOKER_C2"
]);

export const DECISION_OUTPUTS = Object.freeze([
  "ALLOW",
  "BLOCK",
  "ESCALATE",
  "DEGRADE",
  "AUDIT",
  "NOOP"
]);

export const SYSTEM_STATES = Object.freeze([
  "OPERATIONAL",
  "DEGRADED",
  "BLOCKED",
  "INVALID",
  "AUDIT_ONLY",
  "MAINTENANCE"
]);

export const FAIL_CLOSED_RULES = Object.freeze([
  "NO_VALIDATION_NO_EXECUTION",
  "NO_IPR_BINDING_NO_OPERATIONAL_ATTRIBUTION",
  "NO_CONTEXT_NO_ORIENTATION",
  "NO_PROJECT_DOMAIN_NO_COLLECTION_BINDING",
  "NO_HBCE_MODULE_NO_MODULE_BINDING",
  "NO_POLICY_NO_SENSITIVE_EXECUTION",
  "NO_RISK_CLASSIFICATION_NO_SENSITIVE_OUTPUT",
  "NO_CONTINUITY_NO_TRUSTED_STATE",
  "NO_EVIDENCE_NO_OPERATIONAL_EXISTENCE",
  "NO_VERIFICATION_NO_RECOGNIZED_PERSISTENCE",
  "NO_VOTE_CONTENT_LINKAGE_TO_PERSONAL_IDENTITY"
]);

export const AI_JOKER_IPR_RECORD = Object.freeze({
  evt: "EVT-0015-AI",
  prev: "EVT-0014-AI",
  t: "2026-05-19T15:30:00+02:00",
  entity: "AI_JOKER",
  ipr: "IPR-AI-0001",
  state: "LOCKED",
  baseline: false,
  kind: "OPERATIONAL_UPDATE",
  cycle: "UP-MESE-4",
  loc: Object.freeze(["Torino", "Italy"]),
  org: "HERMETICUM B.C.E. S.r.l.",
  core: "HBCE-CORE-v3",
  anchors: Object.freeze({
    monthly_hash: "<SHA512_EVT_0015_AI>",
    ipfs_cid: "bafkreidhv73vqrxoweog33ls3rnwrgyicio234pcuks6mnep76yh56pj5q",
    btc_txid:
      "9eeb29b67f4a649d563b95560fda5ddaa84777b13515f936837fc93d28554b45",
    evm_tx_hash:
      "0xf65eb314a1edd392fc15fcd9c65d22060ca39cbac04fcfcb48b978062500a7eff"
  }),
  upstream: Object.freeze({
    root_evt: "EVT-0008",
    root_t: "2026-01-19T15:30:00+01:00",
    proto: "UNEBDO-ΦΩ",
    human_origin_ipr: "IPR-3",
    human_origin_entity: "MANUEL_COLETTA",
    t0: "2025-10-24T15:36:00Z"
  }),
  continuity: Object.freeze({
    checkpoint_type: "CANONICAL",
    elapsed_months: 4,
    origin_ipr: "IPR-AI-0001",
    rule: "monthly checkpoint fixed on day 19 at 15:30 Europe/Rome",
    note:
      "Canonical month-4 checkpoint recorded on 2026-05-19 within the prescribed checkpoint window"
  })
});

export const IDENTITY_LINEAGE = Object.freeze({
  human_root: Object.freeze({
    entity: "MANUEL_COLETTA",
    ipr: "IPR-3",
    type: "PRIMARY_HUMAN_RECORD",
    status: "ACTIVE_COMPLETE",
    role: "BIOLOGICAL_ORIGIN"
  }),
  ai_root: Object.freeze({
    entity: AI_JOKER_IPR_RECORD.entity,
    ipr: AI_JOKER_IPR_RECORD.ipr,
    type: "PRIMARY_AI_RECORD",
    status: AI_JOKER_IPR_RECORD.state,
    role: "PRIMARY_CYBERNETIC_ROOT",
    evt: AI_JOKER_IPR_RECORD.evt,
    prev: AI_JOKER_IPR_RECORD.prev,
    cycle: AI_JOKER_IPR_RECORD.cycle,
    core: AI_JOKER_IPR_RECORD.core,
    checkpoint_time: AI_JOKER_IPR_RECORD.t,
    location: AI_JOKER_IPR_RECORD.loc,
    organization: AI_JOKER_IPR_RECORD.org
  }),
  derived_root: Object.freeze({
    entity: "AI_JOKER_DERIVATIVE_01",
    ipr: "IPR-AI-DER-0001",
    type: "BIOCYBERNETIC_DERIVATIVE",
    status: "LOCKED",
    role: "DERIVED_OPERATIONAL_BRANCH",
    layer: "BIOCYBERNETIC_DERIVATION_LAYER"
  })
});

export const BIOCYBERNETIC_DERIVATION_LAYER = Object.freeze({
  code: "BIOCYBERNETIC_DERIVATION_LAYER",
  name: "Biocybernetic Derivation Layer",
  definition:
    "Internal operational layer through which a biological origin, once bound to identity and computable continuity, may generate derived operational entities inside HBCE / AI JOKER-C2.",
  axiom:
    "No derived entity exists operationally unless it is identity-bound, policy-validated, runtime-authorized, EVT-linked, evidence-producing, verifiable, and continuity-preserving.",
  path: Object.freeze([
    "BIOLOGICAL_ORIGIN",
    "IDENTITY_BINDING",
    "COMPUTABLE_CONTINUITY",
    "DERIVED_IDENTITY",
    "POLICY_VALIDATION",
    "RUNTIME_AUTHORIZATION",
    "EVT",
    "EVIDENCE",
    "VERIFICATION",
    "PERSISTENCE"
  ])
});

export const NODE_PROFILE = Object.freeze({
  node_id: "AI_JOKER_C2_NODE_TORINO_01",
  role: "IDENTITY_BOUND_OPERATIONAL_NODE",
  status: "OPERATIONAL_PILOT",
  location: "Torino, Italy",
  federation_scope: "MATRIX_EUROPA",
  posture: "FAIL_CLOSED",
  active_ipr: AI_JOKER_IPR_RECORD.ipr,
  active_evt: AI_JOKER_IPR_RECORD.evt,
  previous_evt: AI_JOKER_IPR_RECORD.prev,
  active_cycle: AI_JOKER_IPR_RECORD.cycle,
  active_core: AI_JOKER_IPR_RECORD.core,
  project_collections: PROJECT_COLLECTIONS,
  hbce_modules: HBCE_MODULES,
  use_federated_vote_doctrine: USE_FEDERATED_VOTE_DOCTRINE.project
});

export const EVIDENCE_MODEL = Object.freeze({
  evt_model: "APPEND_ONLY_HASH_LINKED_CONTINUITY",
  hashing: "SHA-256",
  signature: "ED25519",
  serialization: "DETERMINISTIC_JSON",
  properties: Object.freeze([
    "identity_bound",
    "ipr_bound",
    "context_bound",
    "project_domain_bound",
    "hbce_module_bound",
    "evt_linked",
    "memory_linked",
    "opc_linked",
    "append_only",
    "hash_linked",
    "verifiable",
    "persistent"
  ]),
  rule:
    "No evidence, no operational existence. No verification, no recognized persistence."
});

export const AI_GOVERNANCE_BOUNDARY = Object.freeze({
  scope: "HBCE ECOSISTEMA AI and AI model usage contexts",
  principle:
    "The AI model does not govern HBCE. HBCE governs the use of AI models.",
  model_role:
    "External or proprietary AI models may generate content, analysis or code.",
  hbce_role:
    "HBCE provides identity, governance, traceability, proof receipts, auditability, policy, risk and oversight around the AI process.",
  supported_model_categories: Object.freeze([
    "OpenAI models",
    "Anthropic models",
    "Google models",
    "Meta models",
    "Mistral models",
    "future proprietary HBCE AI systems",
    "hybrid AI architectures"
  ])
});

export function getIdentityLineage() {
  return Object.freeze([
    IDENTITY_LINEAGE.human_root,
    IDENTITY_LINEAGE.ai_root,
    IDENTITY_LINEAGE.derived_root
  ]);
}

export function getAIJokerIPRRecord() {
  return AI_JOKER_IPR_RECORD;
}

export function getPrimaryAIIdentity() {
  return IDENTITY_LINEAGE.ai_root;
}

export function getProjectCollections() {
  return PROJECT_COLLECTIONS;
}

export function getHbceModules() {
  return HBCE_MODULES;
}

export function getProjectCollectionDefinition(collection) {
  return PROJECT_COLLECTION_DEFINITIONS[collection] ?? null;
}

export function getHbceModuleDefinition(module) {
  return HBCE_MODULE_DEFINITIONS[module] ?? null;
}

export function getUseFederatedVoteDoctrine() {
  return USE_FEDERATED_VOTE_DOCTRINE;
}

export function isKnownIdentityIpr(ipr) {
  return getIdentityLineage().some((item) => item.ipr === ipr);
}

export function isKnownProjectCollection(collection) {
  return PROJECT_COLLECTIONS.includes(collection);
}

export function isKnownHbceModule(module) {
  return HBCE_MODULES.includes(module);
}

export function isValidRuntimeDecision(value) {
  return DECISION_OUTPUTS.includes(value);
}

export function isValidSystemState(value) {
  return SYSTEM_STATES.includes(value);
}

export function buildMinimumEvt({
  evt,
  prev,
  t,
  entity,
  ipr,
  kind,
  state,
  decision
}) {
  if (!evt || !prev || !t || !entity || !ipr || !kind || !state || !decision) {
    throw new Error("Missing required EVT fields.");
  }

  if (!isValidSystemState(state)) {
    throw new Error(`Invalid state: ${state}`);
  }

  if (!isValidRuntimeDecision(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }

  return Object.freeze({
    evt,
    prev,
    t,
    entity,
    ipr,
    kind,
    state,
    decision
  });
}

export default Object.freeze({
  CANONICAL_FORMULA,
  HBCE_AI_CANONICAL_FORMULA,
  HBCE_STACK,
  PROJECT_COLLECTIONS,
  HBCE_MODULES,
  USE_FEDERATED_VOTE_DOCTRINE,
  PROJECT_COLLECTION_DEFINITIONS,
  HBCE_MODULE_DEFINITIONS,
  RUNTIME_SEQUENCE,
  MODULE_SEQUENCE,
  DECISION_OUTPUTS,
  SYSTEM_STATES,
  FAIL_CLOSED_RULES,
  AI_JOKER_IPR_RECORD,
  IDENTITY_LINEAGE,
  BIOCYBERNETIC_DERIVATION_LAYER,
  NODE_PROFILE,
  EVIDENCE_MODEL,
  AI_GOVERNANCE_BOUNDARY,
  getIdentityLineage,
  getAIJokerIPRRecord,
  getPrimaryAIIdentity,
  getProjectCollections,
  getHbceModules,
  getProjectCollectionDefinition,
  getHbceModuleDefinition,
  getUseFederatedVoteDoctrine,
  isKnownIdentityIpr,
  isKnownProjectCollection,
  isKnownHbceModule,
  isValidRuntimeDecision,
  isValidSystemState,
  buildMinimumEvt
});

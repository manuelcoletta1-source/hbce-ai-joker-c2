import { NextResponse } from "next/server";

import corpusCore from "../../../corpus-core.js";
import alienCodeCore from "../../../corpus-alien-code.js";

export const runtime = "nodejs";

function buildNodeObject() {
  return Object.freeze({
    node: corpusCore.NODE_PROFILE.node_id,
    role: corpusCore.NODE_PROFILE.role,
    status: corpusCore.NODE_PROFILE.status,
    location: corpusCore.NODE_PROFILE.location,
    posture: corpusCore.NODE_PROFILE.posture,
    stack: corpusCore.HBCE_STACK,
    identity: {
      human_root: corpusCore.IDENTITY_ROOTS.human_root,
      ai_root: corpusCore.IDENTITY_ROOTS.ai_root,
      derived_root: corpusCore.IDENTITY_ROOTS.derived_root
    },
    continuity: {
      sequence: corpusCore.RUNTIME_SEQUENCE,
      evt_model: corpusCore.EVIDENCE_MODEL.evt_model,
      rule: "No EVT, no continuity. No continuity, no trusted operational state."
    },
    verification: {
      hashing: corpusCore.EVIDENCE_MODEL.hashing,
      signature: corpusCore.EVIDENCE_MODEL.signature,
      serialization: corpusCore.EVIDENCE_MODEL.serialization
    },
    federation: {
      scope: corpusCore.NODE_PROFILE.federation_scope,
      ready: true,
      model: "REGISTRY_LINKED_FEDERATED_TOPOLOGY"
    }
  });
}

function buildTopology() {
  return Object.freeze({
    origin_node: {
      id: corpusCore.NODE_PROFILE.node_id,
      city: "Torino",
      country: "Italy",
      role: "TECHNICAL_ORIGIN_NODE"
    },
    identity_topology: [
      {
        layer: "PRIMARY_HUMAN_ROOT",
        ipr: corpusCore.IDENTITY_ROOTS.human_root.ipr,
        entity: corpusCore.IDENTITY_ROOTS.human_root.entity
      },
      {
        layer: "PRIMARY_AI_ROOT",
        ipr: corpusCore.IDENTITY_ROOTS.ai_root.ipr,
        entity: corpusCore.IDENTITY_ROOTS.ai_root.entity
      },
      {
        layer: "DERIVED_OPERATIONAL_BRANCH",
        ipr: corpusCore.IDENTITY_ROOTS.derived_root.ipr,
        entity: corpusCore.IDENTITY_ROOTS.derived_root.entity,
        derivation_layer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code
      }
    ],
    future_network: [
      "ITALY_TERRITORIAL_SCALING",
      "BRUSSELS_COORDINATION",
      "EU_FEDERATED_TOPOLOGY"
    ]
  });
}

export async function GET() {
  const node = buildNodeObject();
  const topology = buildTopology();

  return NextResponse.json({
    ok: true,
    endpoint: "/api/network",
    purpose:
      "Expose node topology, identity lineage, federation posture, and derivative-aware network structure.",
    node,
    topology,
    derivationLayer: {
      code: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code,
      definition: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.definition,
      axiom: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.axiom
    },
    alienCode: {
      interface: alienCodeCore.ORGANISM_SYSTEM_INTERFACE,
      recogniconicity: alienCodeCore.ORGANISM_SYSTEM_RECOGNICONICITY,
      loop: alienCodeCore.BIOCYBERNETIC_LOOP
    }
  });
}

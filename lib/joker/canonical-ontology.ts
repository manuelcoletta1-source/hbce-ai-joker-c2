export type CanonicalTerm = {
  key: string;
  label: string;
  category:
    | "identity"
    | "continuity"
    | "governance"
    | "execution"
    | "infrastructure"
    | "organization"
    | "document";
  canonicalDefinition: string;
  shortDefinition: string;
  forbiddenInterpretations?: string[];
  usageNotes?: string[];
  relatedTerms?: string[];
};

export type CanonicalOntology = {
  systemName: string;
  version: string;
  authority: string;
  terms: CanonicalTerm[];
};

const ONTOLOGY: CanonicalOntology = {
  systemName: "JOKER-C2 Canonical Ontology",
  version: "1.0.0",
  authority: "HBCE Research / HERMETICUM B.C.E. S.r.l.",
  terms: [
    {
      key: "IPR",
      label: "IPR",
      category: "identity",
      canonicalDefinition:
        "IPR means Identity Primary Record. It is the persistent operational identity anchor of the HBCE ecosystem. It is not a generic legal acronym and it is not a copyright framework.",
      shortDefinition:
        "Identity Primary Record, persistent operational identity anchor.",
      forbiddenInterpretations: [
        "Intellectual Property Rights",
        "copyright framework",
        "generic legal registry"
      ],
      usageNotes: [
        "Always treat IPR as the identity layer.",
        "Use IPR as the attribution anchor for humans, AI systems, nodes, or infrastructure entities."
      ],
      relatedTerms: ["TRAC", "HBCE", "JOKER-C2"]
    },
    {
      key: "TRAC",
      label: "TRAC",
      category: "continuity",
      canonicalDefinition:
        "TRAC is the continuity and traceability layer of the project. It exists to convert fragmented logs and isolated events into verifiable operational continuity.",
      shortDefinition:
        "Continuity and traceability layer for verifiable operational sequencing.",
      forbiddenInterpretations: [
        "generic trust program",
        "customer tracking suite",
        "branding acronym without architectural role"
      ],
      usageNotes: [
        "Always describe TRAC as a continuity layer.",
        "Its function is to bind sequence, attribution, and evidence across operations."
      ],
      relatedTerms: ["IPR", "HBCE", "JOKER-C2"]
    },
    {
      key: "HBCE",
      label: "HBCE",
      category: "governance",
      canonicalDefinition:
        "HBCE means HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA. It is the governance and orchestration ecosystem of the project, not a generic socio-technical acronym.",
      shortDefinition:
        "Governance and orchestration ecosystem of the project.",
      forbiddenInterpretations: [
        "Human-Building-Cyber Ecosystem",
        "Human-Based Control Engine",
        "generic middleware acronym"
      ],
      usageNotes: [
        "Do not expand HBCE into invented English phrases.",
        "HBCE is the orchestration and policy environment that governs execution."
      ],
      relatedTerms: ["IPR", "TRAC", "JOKER-C2", "HERMETICUM B.C.E. S.r.l."]
    },
    {
      key: "JOKER-C2",
      label: "JOKER-C2",
      category: "execution",
      canonicalDefinition:
        "JOKER-C2 is the execution intelligence and governed runtime layer of the HBCE ecosystem. It is an identity-bound operational cybernetic node, not a generic chatbot.",
      shortDefinition:
        "Identity-bound governed execution intelligence layer.",
      forbiddenInterpretations: [
        "generic assistant",
        "consumer chatbot",
        "simple conversational interface"
      ],
      usageNotes: [
        "Always describe JOKER-C2 as an operational node or execution intelligence layer.",
        "Its role is governed reasoning, constrained execution, continuity, and evidence-linked response."
      ],
      relatedTerms: ["HBCE", "IPR", "TRAC", "EVT"]
    },
    {
      key: "EVT",
      label: "EVT",
      category: "continuity",
      canonicalDefinition:
        "EVT is the operational event unit used for chained, hash-linked continuity states. It is not only audit metadata. It can also function as cognitive continuity state across session reasoning.",
      shortDefinition:
        "Hash-linked operational event and continuity state unit.",
      forbiddenInterpretations: [
        "simple log row",
        "pure telemetry record",
        "non-semantic identifier"
      ],
      usageNotes: [
        "EVT must be treated as both audit spine and continuity carrier.",
        "Each EVT can preserve minimal operational-cognitive state."
      ],
      relatedTerms: ["TRAC", "JOKER-C2"]
    },
    {
      key: "MATRIX EUROPA",
      label: "MATRIX EUROPA",
      category: "document",
      canonicalDefinition:
        "MATRIX EUROPA is the strategic and architectural framework describing the transition from fragmented digital infrastructure to a verifiable European operational system.",
      shortDefinition:
        "Strategic framework for verifiable European operational infrastructure.",
      usageNotes: [
        "Do not flatten MATRIX EUROPA into a generic digital transformation report.",
        "Treat it as an architectural, political, and operational proposition."
      ],
      relatedTerms: ["IPR", "TRAC", "HBCE", "JOKER-C2"]
    },
    {
      key: "HERMETICUM B.C.E. S.r.l.",
      label: "HERMETICUM B.C.E. S.r.l.",
      category: "organization",
      canonicalDefinition:
        "HERMETICUM B.C.E. S.r.l. is the canonical organizational denomination tied to the project and its operational identity.",
      shortDefinition:
        "Canonical organizational denomination of the project.",
      usageNotes: [
        "Use this exact denomination when referencing the company.",
        "Do not replace it with informal variants in canonical outputs."
      ],
      relatedTerms: ["HBCE", "JOKER-C2"]
    }
  ]
};

export function getCanonicalOntology(): CanonicalOntology {
  return ONTOLOGY;
}

export function getCanonicalTerm(termKey: string): CanonicalTerm | null {
  const normalized = termKey.trim().toLowerCase();

  const found = ONTOLOGY.terms.find(
    (term) => term.key.trim().toLowerCase() === normalized
  );

  return found || null;
}

export function buildCanonicalDefinitionsBlock(): string {
  return ONTOLOGY.terms
    .map((term) => {
      const forbidden =
        term.forbiddenInterpretations && term.forbiddenInterpretations.length > 0
          ? `Forbidden reinterpretations: ${term.forbiddenInterpretations.join(
              "; "
            )}.`
          : "";

      const notes =
        term.usageNotes && term.usageNotes.length > 0
          ? `Usage notes: ${term.usageNotes.join(" ")}`
          : "";

      return [
        `${term.label}: ${term.canonicalDefinition}`,
        forbidden,
        notes
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join("\n");
}

export function buildCanonicalGuardrailsBlock(): string {
  return [
    "Canonical ontology lock:",
    "- Use the project definitions exactly as specified.",
    "- If a term has a common external meaning and a project-specific meaning, always prefer the project-specific meaning.",
    "- Do not invent new expansions for canonical acronyms.",
    "- Do not replace canonical definitions with statistically common internet meanings.",
    "- When writing new sections, remain inside the project architecture."
  ].join("\n");
}

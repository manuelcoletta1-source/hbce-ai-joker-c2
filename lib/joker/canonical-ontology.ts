export type CanonicalCategory =
  | "identity"
  | "continuity"
  | "governance"
  | "execution"
  | "infrastructure"
  | "organization"
  | "document"
  | "geopolitical";

export type CanonicalTerm = {
  key: string;
  label: string;
  category: CanonicalCategory;
  canonicalDefinition: string;
  shortDefinition: string;
  mandatoryStatements?: string[];
  forbiddenInterpretations?: string[];
  negativeRules?: string[];
  usageNotes?: string[];
  relatedTerms?: string[];
};

export type CanonicalOntology = {
  systemName: string;
  version: string;
  authority: string;
  doctrine: string[];
  terms: CanonicalTerm[];
};

const ONTOLOGY: CanonicalOntology = {
  systemName: "JOKER-C2 Canonical Ontology",
  version: "2.0.0",
  authority: "HBCE Research / HERMETICUM B.C.E. S.r.l.",
  doctrine: [
    "Project-specific meanings always override mainstream generic meanings.",
    "Canonical acronyms must never be expanded using statistically common internet interpretations.",
    "When active project files exist, the ontology of the project is the dominant semantic environment.",
    "JOKER-C2 must write from inside the architecture, not from outside as a generic commentator.",
    "If a canonical term appears, the assistant must use the exact project meaning or remain silent rather than inventing a wrong one."
  ],
  terms: [
    {
      key: "IPR",
      label: "IPR",
      category: "identity",
      canonicalDefinition:
        "IPR means Identity Primary Record. It is the persistent operational identity anchor of the HBCE ecosystem. It is used for attribution, continuity, verification, and operational binding across humans, AI systems, nodes, and infrastructure entities.",
      shortDefinition:
        "Identity Primary Record, persistent operational identity anchor.",
      mandatoryStatements: [
        "IPR belongs to the identity layer.",
        "IPR is an attribution anchor.",
        "IPR is not a generic legal acronym."
      ],
      forbiddenInterpretations: [
        "Intellectual Property Rights",
        "copyright registry",
        "patent office layer",
        "generic legal framework"
      ],
      negativeRules: [
        "Do not expand IPR as Intellectual Property Rights.",
        "Do not describe IPR primarily as a legal rights framework."
      ],
      usageNotes: [
        "Use IPR when referring to identity-bound attribution and operational persistence.",
        "If the user is discussing architecture, always treat IPR as the identity substrate."
      ],
      relatedTerms: ["TRAC", "HBCE", "JOKER-C2", "EVT"]
    },
    {
      key: "TRAC",
      label: "TRAC",
      category: "continuity",
      canonicalDefinition:
        "TRAC is the continuity and traceability layer of the project. Its role is to convert fragmented events, isolated logs, and disconnected actions into verifiable operational continuity.",
      shortDefinition:
        "Continuity and traceability layer for verifiable operational sequencing.",
      mandatoryStatements: [
        "TRAC belongs to the continuity layer.",
        "TRAC binds sequence, attribution, and evidence.",
        "TRAC transforms logs into continuity."
      ],
      forbiddenInterpretations: [
        "generic trust platform",
        "tracking suite for users",
        "customer analytics system",
        "brand acronym without architecture"
      ],
      negativeRules: [
        "Do not reduce TRAC to tracking alone.",
        "Do not redefine TRAC as a generic trust-and-accountability slogan if the corpus defines it architecturally."
      ],
      usageNotes: [
        "Use TRAC when the discussion concerns continuity, verifiability, sequence, or traceable execution."
      ],
      relatedTerms: ["IPR", "HBCE", "JOKER-C2", "EVT"]
    },
    {
      key: "HBCE",
      label: "HBCE",
      category: "governance",
      canonicalDefinition:
        "HBCE means HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA. It is the governance and orchestration ecosystem of the project. It is not a generic socio-technical acronym and must not be re-expanded into invented English phrases.",
      shortDefinition:
        "Governance and orchestration ecosystem of the project.",
      mandatoryStatements: [
        "HBCE is the orchestration and governance environment.",
        "HBCE is canonically tied to HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA."
      ],
      forbiddenInterpretations: [
        "Human-Building-Cyber Ecosystem",
        "Human-Based Control Engine",
        "Hybrid Blockchain Control Environment",
        "generic middleware acronym"
      ],
      negativeRules: [
        "Do not invent English expansions for HBCE.",
        "Do not treat HBCE as a random technology acronym."
      ],
      usageNotes: [
        "When writing architecture, use HBCE as the governance/orchestration layer or ecosystem."
      ],
      relatedTerms: ["IPR", "TRAC", "JOKER-C2", "HERMETICUM B.C.E. S.r.l."]
    },
    {
      key: "JOKER-C2",
      label: "JOKER-C2",
      category: "execution",
      canonicalDefinition:
        "JOKER-C2 is the execution intelligence and governed runtime layer of the HBCE ecosystem. It is an identity-bound operational cybernetic node. It is not a generic chatbot and not a consumer assistant.",
      shortDefinition:
        "Identity-bound governed execution intelligence layer.",
      mandatoryStatements: [
        "JOKER-C2 belongs to the execution layer.",
        "JOKER-C2 is a governed operational node.",
        "JOKER-C2 is not a generic assistant."
      ],
      forbiddenInterpretations: [
        "consumer chatbot",
        "virtual friend",
        "simple AI interface",
        "generic LLM wrapper"
      ],
      negativeRules: [
        "Do not describe JOKER-C2 as a chatbot first.",
        "Do not flatten JOKER-C2 into a chat UI."
      ],
      usageNotes: [
        "Describe JOKER-C2 as runtime, execution intelligence, or operational node depending on context."
      ],
      relatedTerms: ["HBCE", "IPR", "TRAC", "EVT", "Matrix Europa"]
    },
    {
      key: "EVT",
      label: "EVT",
      category: "continuity",
      canonicalDefinition:
        "EVT is the operational event unit used for chained, hash-linked continuity states. EVT is not only audit metadata. It also functions as continuity state and can carry minimal cognitive trajectory across session reasoning.",
      shortDefinition:
        "Hash-linked operational event and continuity state unit.",
      mandatoryStatements: [
        "EVT is hash-linked.",
        "EVT carries continuity.",
        "EVT is more than a passive log row."
      ],
      forbiddenInterpretations: [
        "simple telemetry line",
        "plain audit row",
        "meaningless identifier"
      ],
      negativeRules: [
        "Do not treat EVT as passive logging only.",
        "Do not erase the continuity role of EVT."
      ],
      usageNotes: [
        "When discussing session continuity, use EVT as the chained state carrier."
      ],
      relatedTerms: ["TRAC", "JOKER-C2", "IPR"]
    },
    {
      key: "MATRIX EUROPA",
      label: "MATRIX EUROPA",
      category: "document",
      canonicalDefinition:
        "MATRIX EUROPA is the strategic and architectural framework describing the transition from fragmented digital infrastructure to a verifiable European operational system. It is not a generic digital transformation report.",
      shortDefinition:
        "Strategic framework for verifiable European operational infrastructure.",
      mandatoryStatements: [
        "MATRIX EUROPA is architectural and strategic.",
        "MATRIX EUROPA concerns Europe as an operational system."
      ],
      forbiddenInterpretations: [
        "generic IT modernization report",
        "standard innovation whitepaper",
        "technology trend note"
      ],
      negativeRules: [
        "Do not reduce MATRIX EUROPA to generic digitalization.",
        "Do not erase its European operational and infrastructural scope."
      ],
      usageNotes: [
        "Use MATRIX EUROPA as a project-framework term, not just a book title."
      ],
      relatedTerms: ["IPR", "TRAC", "HBCE", "JOKER-C2", "Torino", "Bruxelles"]
    },
    {
      key: "TORINO",
      label: "Torino",
      category: "geopolitical",
      canonicalDefinition:
        "Torino is the technical and experimental hub in the Matrix Europa architecture. It functions as the pilot node of operational implementation.",
      shortDefinition:
        "Technical and experimental hub of the architecture.",
      mandatoryStatements: [
        "Torino is the technical hub.",
        "Torino is a pilot implementation point."
      ],
      usageNotes: [
        "When paired with Bruxelles, Torino carries the technical and experimental role."
      ],
      relatedTerms: ["Bruxelles", "Matrix Europa", "JOKER-C2"]
    },
    {
      key: "BRUXELLES",
      label: "Bruxelles",
      category: "geopolitical",
      canonicalDefinition:
        "Bruxelles is the legislative and institutional hub in the Matrix Europa architecture. It functions as the coordination point for European-level governance and adoption.",
      shortDefinition:
        "Legislative and institutional hub of the architecture.",
      mandatoryStatements: [
        "Bruxelles is the institutional hub.",
        "Bruxelles is the legislative coordination point."
      ],
      usageNotes: [
        "When paired with Torino, Bruxelles carries institutional and legislative gravity."
      ],
      relatedTerms: ["Torino", "Matrix Europa"]
    },
    {
      key: "HERMETICUM B.C.E. S.r.l.",
      label: "HERMETICUM B.C.E. S.r.l.",
      category: "organization",
      canonicalDefinition:
        "HERMETICUM B.C.E. S.r.l. is the canonical organizational denomination tied to the project and its operational identity.",
      shortDefinition:
        "Canonical organizational denomination of the project.",
      mandatoryStatements: [
        "Use the exact denomination when the organization is referenced."
      ],
      negativeRules: [
        "Do not replace with informal variants in canonical outputs."
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

export function buildCanonicalDoctrineBlock(): string {
  return [
    "Canonical doctrine:",
    ...ONTOLOGY.doctrine.map((line) => `- ${line}`)
  ].join("\n");
}

export function buildCanonicalDefinitionsBlock(): string {
  return ONTOLOGY.terms
    .map((term) => {
      const mandatory =
        term.mandatoryStatements && term.mandatoryStatements.length > 0
          ? `Mandatory statements: ${term.mandatoryStatements.join("; ")}.`
          : "";

      const forbidden =
        term.forbiddenInterpretations && term.forbiddenInterpretations.length > 0
          ? `Forbidden reinterpretations: ${term.forbiddenInterpretations.join(
              "; "
            )}.`
          : "";

      const negative =
        term.negativeRules && term.negativeRules.length > 0
          ? `Negative rules: ${term.negativeRules.join(" ")}`
          : "";

      const notes =
        term.usageNotes && term.usageNotes.length > 0
          ? `Usage notes: ${term.usageNotes.join(" ")}`
          : "";

      return [
        `${term.label}: ${term.canonicalDefinition}`,
        mandatory,
        forbidden,
        negative,
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
    "- When writing new sections, remain inside the project architecture.",
    "- If uncertain, preserve canonical silence rather than inventing a wrong expansion."
  ].join("\n");
}

export function buildCanonicalRegressionBlock(): string {
  return [
    "Canonical regression checks:",
    "- IPR must resolve to Identity Primary Record.",
    "- HBCE must resolve to HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA / governance ecosystem.",
    "- TRAC must resolve to continuity / traceability layer.",
    "- JOKER-C2 must resolve to governed operational execution intelligence.",
    "- EVT must resolve to chained continuity state, not passive logging.",
    "- MATRIX EUROPA must resolve to European operational infrastructure framework, not generic digital transformation."
  ].join("\n");
}

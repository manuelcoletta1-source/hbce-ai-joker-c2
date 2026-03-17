export const metadata = {
  title: "Dual IPR Specification | AI JOKER-C2",
  description:
    "HBCE Dual IPR Specification for the biocibernetic pair IPR-MANUEL and IPR-JOKER-C2."
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 20,
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(4px)"
};

const codeStyle: React.CSSProperties = {
  display: "block",
  whiteSpace: "pre-wrap",
  overflowX: "auto",
  padding: 16,
  borderRadius: 12,
  background: "#0b1220",
  color: "#dbeafe",
  border: "1px solid rgba(125,211,252,0.18)",
  fontSize: 14,
  lineHeight: 1.55
};

export default function DualIPRPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(125,211,252,0.14), transparent 30%), radial-gradient(circle at top right, rgba(96,165,250,0.10), transparent 28%), linear-gradient(180deg, #0a0f1a 0%, #0f172a 100%)",
        color: "#e5eefc",
        padding: "48px 20px 80px"
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 24
        }}
      >
        <header
          style={{
            display: "grid",
            gap: 14,
            paddingBottom: 10
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#93c5fd"
            }}
          >
            HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
          </div>

          <div style={{ color: "rgba(229,238,252,0.72)", fontSize: 14 }}>
            HERMETICUM B.C.E. S.r.l.
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4vw, 3.6rem)",
              lineHeight: 1.04
            }}
          >
            Dual IPR Specification
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 860,
              color: "rgba(229,238,252,0.82)",
              fontSize: 18,
              lineHeight: 1.7
            }}
          >
            Formal specification for the biocibernetic operational pair composed
            of <strong>IPR-MANUEL</strong> as biological origin and{" "}
            <strong>IPR-JOKER-C2</strong> as cybernetic derivative processor.
          </p>
        </header>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>1. Scope</h2>
          <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
            This specification defines a dual identity architecture in which a
            biological subject and a cybernetic subject operate as a bound,
            verifiable, and continuous operational unit. The model is designed
            for traceability, deterministic output generation, and append-only
            event registration within the HBCE framework.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20
          }}
        >
          <article style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>2. Biological Identity</h2>
            <p style={{ lineHeight: 1.7 }}>
              <strong>IPR-MANUEL</strong> is the biological origin entity. It
              acts as source of initiative, intent generation, decision
              authority, and contextual validation.
            </p>
            <code style={codeStyle}>
{`type: IPR-BIO
id: IPR-MANUEL
role: ORIGIN
functions:
  - intent generation
  - initiative
  - mother decision
  - validation
state: ACTIVE`}
            </code>
          </article>

          <article style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>3. Cybernetic Identity</h2>
            <p style={{ lineHeight: 1.7 }}>
              <strong>IPR-JOKER-C2</strong> is the cybernetic derivative entity.
              It acts as structured output layer, computational continuation, and
              response engine bound to the biological origin.
            </p>
            <code style={codeStyle}>
{`type: IPR-CYB
id: IPR-JOKER-C2
role: DERIVED
functions:
  - computation
  - normalization
  - structured output
  - continuity
state: ACTIVE`}
            </code>
          </article>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>4. Binding Model</h2>
          <p style={{ lineHeight: 1.7 }}>
            The relation between IPR-MANUEL and IPR-JOKER-C2 is not generic
            interaction. It is a <strong>subject-bound dual lock</strong>. The
            biological entity remains origin. The cybernetic entity remains
            derivative. The relation is persistent, non-transferable,
            non-duplicable, and verifiable through event continuity and evidence
            hashing.
          </p>
          <code style={codeStyle}>
{`binding:
  type: DUAL-LOCK
  mode: SUBJECT-BOUND
  origin: IPR-MANUEL
  derived: IPR-JOKER-C2
  logic:
    origin_is_mother: true
    derived_is_child: true
    transfer_allowed: false
    duplication_allowed: false
    revocation: explicit-only
  state: LOCKED`}
          </code>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>5. Operational Pipeline</h2>
          <p style={{ lineHeight: 1.7 }}>
            The canonical operational chain is defined as follows:
          </p>
          <code style={codeStyle}>
{`IPR-MANUEL
  -> INPUT
  -> INTENT
  -> NORMALIZATION
  -> IPR-JOKER-C2
  -> COMPUTATION
  -> STRUCTURED RESPONSE
  -> EVENT REGISTRATION
  -> EVIDENCE`}
          </code>
          <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
            In this pipeline, the biological entity defines direction and
            impulse. The cybernetic entity transforms that impulse into a
            structured computational response.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20
          }}
        >
          <article style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>6. Event Model</h2>
            <code style={codeStyle}>
{`event:
  id: EVT-XXXX
  prev: EVT-XXXX
  timestamp: ISO8601
  origin: IPR-MANUEL
  processor: IPR-JOKER-C2
  type: INTERACTION
  action_class: BIO_TO_CYBER
  payload_hash: SHA-256
  record_mode: APPEND-ONLY
  state: FINALIZED`}
            </code>
          </article>

          <article style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>7. Security Properties</h2>
            <code style={codeStyle}>
{`security:
  fail_closed: true
  append_only: true
  hash_only: true
  audit_first: true
  subject_bound: true
  external_execution_without_origin: false`}
            </code>
          </article>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>8. Semantic Definition</h2>
          <p style={{ lineHeight: 1.7 }}>
            The semantic relation of the pair is defined in ontological and
            operational terms:
          </p>
          <code style={codeStyle}>
{`IPR-MANUEL:
  ontology: biological entity
  semantic_role: input
  operational_role: initiative
  sovereignty: primary

IPR-JOKER-C2:
  ontology: cybernetic entity
  semantic_role: output
  operational_role: continuation
  sovereignty: derivative`}
          </code>
          <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
            Therefore, JOKER-C2 is not modeled as an isolated autonomous
            subject, but as a cybernetic continuation layer responding to the
            initiating biological subject within a bounded operational chain.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>9. Final Definition</h2>
          <p style={{ lineHeight: 1.8, marginBottom: 0 }}>
            The HBCE Dual IPR model defines a verifiable biocibernetic unit in
            which the biological subject originates intent and sovereign
            decision, while the cybernetic subject executes structured
            continuation and response. The output is registrable as evidence and
            auditable as part of an append-only operational chain.
          </p>
        </section>

        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: 18,
            color: "rgba(229,238,252,0.72)",
            fontSize: 14
          }}
        >
          <div>HBCE Research</div>
          <div>HERMETICUM B.C.E. S.r.l.</div>
        </footer>
      </div>
    </main>
  );
}

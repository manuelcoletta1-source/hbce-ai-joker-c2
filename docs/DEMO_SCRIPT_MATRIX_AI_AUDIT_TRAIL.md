# MATRIX AI Audit Trail — Demo Script

Repository: hbce-ai-joker-c2  
Project: MATRIX / AI JOKER-C2 / HBCE  
Pilot client: HERMETICUM B.C.E. S.r.l.  
Pilot type: Internal R&D self-audit pilot  
Demo duration: 3 minutes  
Date: 2026-05-07  

---

## 1. Demo purpose

This demo shows that AI-assisted document analysis can be converted into an audit-ready workflow.

The objective is not to demonstrate the full MATRIX architecture.

The objective is to demonstrate one clear flow:

```text
Document upload
→ AI analysis
→ governance decision
→ human validation
→ EVT
→ OPC
→ audit report

The demo proves that AI JOKER-C2 is not only a chatbot. It can act as a governed runtime where AI output is connected to document hash, risk classification, human validation, event traceability, proof generation and report export.


---

2. Demo URL

https://hbce-ai-joker-c2.vercel.app/matrix-audit-trail


---

3. Demo scenario

A compliance or governance operator at HERMETICUM B.C.E. S.r.l. needs to analyze an internal document with AI and preserve a trace of the operation.

The operator must demonstrate:

which document was analyzed;

what AI task was performed;

what governance decision was assigned;

whether a human validated the output;

which EVT event was generated;

which OPC proof was generated;

whether a final audit report can be exported.



---

4. Demo document

Use a small TXT or MD file.

Example file name:

sample-governance-document.md

Example content:

# Sample Governance Document

This document describes an internal governance workflow for AI-assisted document review.

The process requires human validation before any AI-generated output is treated as audit-ready.

The workflow should preserve document hash, timestamp, AI action, risk classification, governance decision, human validation, EVT event, OPC proof and final audit report.

The document must not include secrets, private keys, credentials, customer data, identity documents or sensitive operational payloads.


---

5. Demo steps

Step 1 — Open the page

Open:

/matrix-audit-trail

Say:

This is the MATRIX AI Audit Trail MVP. It is the first internal R&D self-audit pilot for HERMETICUM B.C.E. S.r.l.

Point out:

pilot client;

session state;

governance frame;

proof panel.



---

Step 2 — Upload document

Upload the sample document.

Say:

The document is read locally and transformed into a document record. The MVP assigns document metadata and computes a hash commitment.

Show:

filename;

MIME type;

size;

document loaded status.



---

Step 3 — Run AI audit analysis

Use the default prompt or this prompt:

Analyze this document for governance, compliance, auditability, security language, risk signals and overclaiming. Produce a concise audit-oriented summary.

Click:

Run AI audit analysis

Say:

The AI analysis is treated as decision-support. The runtime creates an AI action record, output hash and governance decision. The AI does not become the final authority.

Show:

AI output;

risk classification;

runtime decision;

human oversight required.



---

Step 4 — Human validation

Choose:

Approve

or:

Approve with correction

Say:

This is the compliance boundary. The AI output is not final until a human operator validates it.

Show:

validation status;

validator IPR;

validation notes.



---

Step 5 — EVT and OPC generation

After validation, show the proof panel.

Say:

The system now generates an EVT event and an OPC proof. EVT records the operational event. OPC creates a technical proof record linked to the event.

Show:

EVT ID;

EVT trace hash;

OPC ID;

OPC proof hash.



---

Step 6 — Audit report

Show the generated report.

Say:

The final output is a human-readable audit report. This is the commercial core of the MVP: a client can see what happened, who validated it, which document was processed, and which proof records were produced.

Click:

Download TXT

or:

Download JSON

Show:

report ID;

document hash;

AI action;

governance decision;

human validation;

EVT;

OPC;

final state.



---

6. What to say in 30 seconds

MATRIX AI Audit Trail converts AI-assisted document analysis into an audit-ready workflow.

The system records the document hash, AI action, risk classification, runtime decision, human validation, EVT event, OPC proof and final report.

The first pilot client is HERMETICUM B.C.E. S.r.l. itself, using the system as an internal R&D self-audit pilot before external customer pilots.


---

7. What not to claim

Do not say:

this is legal certification;

this is regulatory approval;

this is eIDAS qualification;

this is a certified compliance system;

this is public-sector adoption;

this is production-ready enterprise SaaS;

this replaces legal review;

this replaces private evidence review.


Correct statement:

This is an MVP / internal R&D self-audit pilot demonstrating traceable, attributable, human-validated AI document analysis.


---

8. Success criteria

The demo is successful if it shows:

one document uploaded;

one AI analysis executed;

one governance decision produced;

one human validation completed;

one EVT event generated;

one OPC proof generated;

one audit report exported;

completion in three minutes.



---

9. Follow-up after demo

After the demo, the next step is a 30-day pilot proposal.

Pilot structure:

one organization;

one document workflow;

one operator;

10–20 test documents;

audit reports generated;

final evaluation report.


For the first phase, the organization is HERMETICUM B.C.E. S.r.l. itself.


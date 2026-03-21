# C2-Lex Governance Checks
Modello canonico dei controlli di governance del layer semantico

HBCE Research  
HERMETICUM B.C.E. S.r.l.

---

## 1. Scopo del documento

Questo documento definisce il modello dei **controlli di governance (governance checks)** applicati dal layer C2-Lex durante ogni interazione.

I controlli rappresentano il meccanismo che trasforma una semplice richiesta in un **esito governato, auditabile e classificato**.

---

## 2. Principio fondamentale

Ogni input ricevuto da C2-Lex non viene eseguito direttamente, ma:

1. interpretato  
2. validato  
3. classificato  
4. controllato  
5. trasformato in esito  

---

## 3. Struttura dei governance checks

Ogni sessione C2-Lex produce un oggetto:

```json
{
  "governanceChecks": {
    "origin": "...",
    "role": "...",
    "intent": "...",
    "context": "...",
    "policy": "...",
    "admissibility": "...",
    "risk": "...",
    "traceability": "..."
  }
}


---

4. Descrizione dei controlli

4.1 origin

Verifica la provenienza dell’input.

Obiettivo:

determinare se l’origine è valida

identificare il livello di affidabilità della richiesta


Esempi:

passed

limited

insufficient



---

4.2 role

Verifica il ruolo dichiarato o implicito.

Obiettivo:

valutare se il ruolo è coerente con la richiesta

applicare restrizioni operative


Esempi:

passed

limited

blocked



---

4.3 intent

Verifica la classificazione dell’intento.

Obiettivo:

determinare la natura dell’input


Classi tipiche:

consultation

explanation

guided_procedure

decision_support

activation_request

escalation



---

4.4 context

Verifica il contesto operativo.

Obiettivo:

valutare coerenza tra richiesta e dominio (nodo, scenario, ambiente)


Esempi:

passed

limited

insufficient



---

4.5 policy

Applica il perimetro normativo.

Obiettivo:

associare la richiesta a una policy scope

determinare limiti operativi


Esempi:

HBCE / Governed Consultation

HBCE / Controlled Activation

HBCE / Escalation Review



---

4.6 admissibility

Determina se la richiesta è eseguibile.

Obiettivo:

stabilire se l’azione è consentita


Stati:

passed

limited

blocked



---

4.7 risk

Valuta il livello di rischio.

Obiettivo:

classificare l’impatto potenziale


Livelli:

ordinary

sensitive

elevated



---

4.8 traceability

Verifica la tracciabilità della sessione.

Obiettivo:

garantire auditabilità

collegare evento a sessione e identity layer


Stati:

passed

limited



---

5. Logica di combinazione

I controlli non sono indipendenti.

Regola generale

se admissibility = blocked → outcome = blocked

se risk = elevated → escalation o restrizione

se traceability ≠ passed → limitazione operativa



---

6. Relazione con outcome

I governance checks determinano:

sessionState

outcomeClass

policyScope

nextStep



---

7. Stati possibili

Stati di controllo

passed

limited

blocked

insufficient


Stati di rischio

ordinary

sensitive

elevated



---

8. Flusso operativo

Input
 ↓
Intent classification
 ↓
Governance checks
 ↓
Policy binding
 ↓
Admissibility evaluation
 ↓
Outcome generation


---

9. Ruolo nel sistema HBCE

I governance checks sono il punto centrale che:

impedisce comportamenti non controllati

garantisce compliance

introduce auditabilità

separa linguaggio da azione



---

10. Modalità demo

In ambiente demo:

i controlli sono simulati

non attivano sistemi reali

non producono effetti operativi esterni



---

11. Formula canonica

I governance checks sono il meccanismo attraverso cui C2-Lex trasforma un input linguistico in un esito operativo governato, auditabile e conforme.


---

12. Stato del documento

Stato: ACTIVE
Dominio: governance layer C2-Lex
Compatibilità: IPR / C2-Lex / JOKER-C2
Funzione: definizione dei controlli operativi


---

13. Firma

HBCE Research
HERMETICUM B.C.E. S.r.l.


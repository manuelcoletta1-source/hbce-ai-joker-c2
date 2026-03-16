# Joker-C2 Protocol
## Communication and Execution Specification

HBCE Research  
HERMETICUM B.C.E. S.r.l.

---

# 1. Introduction

Il Joker-C2 Protocol definisce il formato di comunicazione tra utenti, applicazioni e il Coordination Engine Joker-C2.

Il protocollo stabilisce:

- struttura delle richieste
- formato delle risposte
- metadati operativi
- modalità di esecuzione

Lo scopo è consentire interazioni coerenti, tracciabili e verificabili con il sistema.

---

# 2. Request Structure

Le richieste verso Joker-C2 vengono inviate attraverso endpoint API.

Endpoint principale:

POST /api/chat

Formato della richiesta:

```json
{
  "message": "user request text",
  "previous_topic": "optional context topic"
}

Campi principali:

campo	descrizione

message	testo della richiesta dell'utente
previous_topic	topic della conversazione precedente



---

3. Execution Modes

Il sistema può operare in diverse modalità.

context-recovery

Modalità attuale del sistema.

Il motore utilizza il corpus locale per generare risposte.

hybrid-search (futuro)

Integrazione tra corpus interno e ricerca esterna.

node-analysis (futuro)

Analisi di infrastrutture e nodi Matrix Europa.


---

4. Response Structure

La risposta del sistema è composta da due elementi principali.

1. risposta conversazionale


2. metadata operativi



Formato base della risposta:

{
  "ok": true,
  "reply": "generated response",
  "mode": "context-recovery",
  "domain": "matrix",
  "confidence": "medium"
}


---

5. Metadata Fields

Le risposte Joker-C2 includono metadati che descrivono il processo di esecuzione.

Campi principali:

campo	descrizione

mode	modalità operativa del sistema
domain	dominio informativo
confidence	livello di confidenza della risposta
detected_topic	topic identificato
preset	preset operativo attivato



---

6. Architecture Layers Metadata

Le risposte possono includere riferimento ai layer architetturali HBCE.

Esempio:

"architecture_layers": [
  "IPR Identity Layer",
  "Event Registry",
  "Joker-C2 Coordination Engine",
  "UFO Functional Modules",
  "Lambda Stability Layer"
]

Questo consente di collegare le risposte alla struttura operativa del sistema.


---

7. Matrix Europa Context

Quando necessario, le risposte possono includere contesto territoriale.

Esempio:

HBCE-MATRIX-NODE-0001-TORINO

Questo consente di associare richieste e analisi a nodi infrastrutturali della rete europea.


---

8. Event Traceability

Il protocollo supporta la registrazione degli eventi operativi.

Informazioni registrabili:

request id

topic identificato

nodo territoriale

timestamp

modalità operativa


Questi dati possono essere salvati nel registro eventi.

File di riferimento:

registry/events.log.json


---

9. Error Handling

Il protocollo definisce risposte standard per errori.

Esempio:

{
  "ok": false,
  "error": "Metodo non consentito"
}

Possibili errori:

metodo HTTP non valido

richiesta malformata

errore interno



---

10. Future Extensions

Il protocollo può evolvere includendo:

multi-node orchestration

integrazione con sistemi esterni

pipeline di evidenza deterministica

federazione tra nodi Matrix Europa



---

HBCE Research
HERMETICUM B.C.E. S.r.l.




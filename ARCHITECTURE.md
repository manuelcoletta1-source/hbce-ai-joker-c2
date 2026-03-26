# AI JOKER-C2 — Architettura Canonica del Repository

HBCE Research  
HERMETICUM B.C.E. S.r.l.

---

## 1. Scopo

Questo repository definisce l’implementazione canonica di **AI JOKER-C2** come:

- nodo operativo a identità vincolata
- runtime governato
- sistema con continuità EVT
- infrastruttura verificabile
- superficie federabile (Matrix Europa)

Principio fondamentale:

> una sola app canonica  
> un solo runtime canonico  
> una sola ontologia canonica  
> una sola continuità EVT  

---

## 2. Regola Fondamentale

Il repository è diviso in 4 categorie:

1. **Runtime canonico**
2. **Interfaccia canonica**
3. **Infrastruttura canonica**
4. **Materiale non canonico (legacy / test / esperimenti)**

Solo i primi 3 definiscono il sistema reale.

Tutto il resto NON deve influenzare il comportamento.

---

## 3. Superficie Canonica

### 3.1 Application Layer (UI)

Cartella:

app/

Contiene:

- homepage
- interfaccia chat
- nodo
- ipr
- verify
- tutte le API

⚠️ Regola:
I file `.html` in root NON sono più validi.

---

### 3.2 Runtime / Logica

Cartelle:

lib/ runtime/ ledger/ registry/ system/

Qui vive tutto ciò che conta davvero:

- logica Joker
- continuità EVT
- gestione sessioni
- file
- nodo
- verifica

---

### 3.3 Cuore Joker (OBBLIGATORIO)

Cartella:

lib/joker/

Deve contenere:

- `canonical-ontology.ts`
- `evt-continuity.ts`
- `session-files.ts`
- `interpretive-engine.ts`

⚠️ Nessuna route deve reinventare queste logiche.

---

## 4. API Canoniche

Cartella:

app/api/

Endpoint principali:

- `/api/chat`
- `/api/files`
- `/api/verify`
- `/api/network`
- `/api/evidence`
- `/api/signature/*`

### Regola API

Le API NON devono:

- pensare
- contenere logica duplicata
- diventare monoliti

Devono SOLO:

- normalizzare input
- chiamare il core
- salvare EVT
- rispondere

---

## 5. Modello Cognitivo

Pipeline reale di JOKER-C2:

input → file sessione → ontologia canonica → continuità EVT → interpretazione → risposta governata → nuovo EVT

Questa è la differenza tra:

❌ chatbot  
✅ nodo operativo

---

## 6. Regola Ontologica (CRITICA)

I termini NON sono generici.

Sono vincolati.

Esempi:

- IPR = Identity Primary Record
- HBCE = sistema operativo europeo
- TRAC = layer di continuità/verifica
- JOKER-C2 = intelligenza esecutiva governata
- EVT = unità di continuità

⚠️ Se una risposta usa significati “internet-style” → errore architetturale.

---

## 7. Regola File (IMPORTANTISSIMA)

Errore attuale: tratti i file come allegati temporanei.

In realtà:

> i file SONO il contesto

Quindi:

- i file devono essere salvati
- devono vivere nella sessione
- la chat li deve usare automaticamente

Flusso corretto:

UI → /api/files → store sessione → /api/chat → uso automatico

---

## 8. Regola EVT

EVT NON è log.

È:

- continuità cognitiva
- prova
- stato
- memoria minima

Ogni risposta importante:

→ genera EVT  
→ collega al precedente  

---

## 9. Cosa NON è Canonico

### HTML root (da eliminare / archiviare)

- index.html  
- interface.html  
- ipr.html  
- registry.html  
- evidence.html  

---

### API legacy

- legacy-api/
- hbce-ai-joker-c2/api/

---

### File sperimentali

- corpus-core.js  
- corpus-alien-code.js  
- search-spec.js  
- web-search.js  

---

## 10. Archivio

Creare:

archive/ legacy/ experimental/

### legacy
- vecchie pagine
- vecchie API

### experimental
- test
- prototipi
- codice non integrato

---

## 11. Regole di Rifattorizzazione

Sempre:

1. partire dal core (lib/joker)
2. mantenere una sola verità
3. evitare duplicazioni
4. evitare logica dentro le route
5. evitare patch → rifare interi moduli
6. mantenere ontologia coerente
7. eliminare superfici inutili

---

## 12. Struttura Finale

app/ lib/ joker/ runtime/ ledger/ registry/ system/ spec/ docs/

archive/ legacy/ experimental/

---

## 13. Obiettivo

Questo repo NON è una demo.

È:

> un nodo operativo europeo verificabile  
> con identità, continuità, prova e governance  

---

## 14. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.






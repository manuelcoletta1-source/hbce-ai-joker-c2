# API C2-Lex
Contratto canonico dell’endpoint del layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce il **contratto canonico dell’API C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è stabilire in modo chiaro:

- quale endpoint espone il motore minimo C2-Lex
- quali payload accetta
- quali campi restituisce
- quale forma assume l’esito governato
- come l’endpoint si inserisce nel modello di sessione, governance e auditabilità del modulo

Questo documento non descrive tutte le future evoluzioni dell’API.  
Descrive il **contratto minimo reale già introdotto nel repository**.

## 2. Definizione sintetica

L’API C2-Lex è il punto di accesso programmatico al **motore minimo governato** del layer semantico di comando.

Attraverso questa API, un client può inviare:

- un messaggio
- metadati minimi di sessione
- ruolo
- contesto di nodo
- riferimento di continuità

e ricevere in risposta:

- classificazione dell’intento
- stato della sessione
- classe di esito
- policy scope
- controlli di governance
- continuità
- risposta qualificata
- sintesi operativa
- next step

In forma sintetica:

**l’API trasforma input testuale e metadati di sessione in esito governato leggibile.**

## 3. Endpoint canonico

### Endpoint
`/api/c2-lex`

### Metodi disponibili
- `GET`
- `POST`

## 4. Finalità dei metodi

### GET
Metodo di descrizione e introspezione dell’endpoint.

Serve a restituire:

- identità del modulo
- path dell’endpoint
- metodo atteso
- descrizione sintetica
- campi richiesti
- campi opzionali
- esempio di richiesta

### POST
Metodo operativo minimo.

Serve a inviare input al motore C2-Lex e ottenere l’esito governato della sessione.

## 5. Payload minimo del metodo POST

Il payload del metodo `POST` è in formato JSON.

### Campi supportati

#### `message`
Tipo: `string`  
Obbligatorio: sì

Contiene l’input linguistico da inviare al motore C2-Lex.

È il campo minimo necessario perché il motore possa operare.

#### `sessionId`
Tipo: `string`  
Obbligatorio: no

Identificativo della sessione.  
Se assente, l’endpoint applica un valore di default.

#### `role`
Tipo: `string`  
Obbligatorio: no

Ruolo operativo del soggetto o del contesto da associare alla richiesta.  
Se assente, l’endpoint applica un valore di default.

#### `nodeContext`
Tipo: `string`  
Obbligatorio: no

Nodo o dominio operativo in cui la sessione è letta.  
Se assente, l’endpoint applica un valore di default.

#### `continuityReference`
Tipo: `string`  
Obbligatorio: no

Riferimento di continuità o evidenza associato alla sessione.  
Se assente, viene generato a partire dal `sessionId`.

## 6. Regole minime di validazione del payload

L’endpoint deve verificare almeno quanto segue:

- il payload deve essere JSON valido
- `message` deve essere presente
- `message` deve essere una stringa non vuota

In caso contrario, l’endpoint deve restituire errore `400`.

## 7. Valori di default applicati dal server

Se alcuni campi opzionali non vengono inviati, il server applica i seguenti default minimi.

### `sessionId`
`C2L-SESSION-API-0001`

### `role`
`Operatore supervisionato`

### `nodeContext`
`HBCE-MATRIX-NODE-0001-TORINO`

### `continuityReference`
`<sessionId>-AUDIT`

Questi default servono a mantenere funzionante il motore minimo anche in assenza di metadati completi.

## 8. Struttura della risposta di successo

In caso di esito positivo, l’endpoint restituisce un oggetto JSON con la seguente forma generale.

```json
{
  "ok": true,
  "input": {
    "sessionId": "C2L-SESSION-API-0001",
    "role": "Operatore supervisionato",
    "nodeContext": "HBCE-MATRIX-NODE-0001-TORINO",
    "continuityReference": "C2L-SESSION-API-0001-AUDIT",
    "message": "Mostrami lo stato corrente del modulo C2-Lex."
  },
  "result": {
    "sessionId": "C2L-SESSION-API-0001",
    "sessionState": "CLOSED",
    "intentClass": "consultation",
    "outcomeClass": "informative",
    "policyScope": "HBCE / Governed Consultation",
    "continuityReference": "C2L-SESSION-API-0001-AUDIT",
    "summary": "Consultazione operativa classificata correttamente senza attivazione implicita.",
    "nextStep": "Richiedere spiegazione, guida procedurale o verifica aggiuntiva nel perimetro consentito.",
    "response": "La sessione corrente è stata classificata come consultazione operativa...",
    "governanceChecks": {
      "origin": "passed",
      "role": "passed",
      "intent": "passed",
      "context": "passed",
      "policy": "passed",
      "admissibility": "passed",
      "risk": "ordinary",
      "traceability": "passed"
    }
  }
}

9. Struttura della risposta di errore

In caso di input non valido, l’endpoint restituisce una risposta con stato 400.

Forma generale

{
  "ok": false,
  "error": "Il campo 'message' è obbligatorio."
}

Esempi di errore previsti

payload JSON non valido

campo message assente

campo message vuoto o non valido


10. Significato dei campi di risultato

10.1 sessionId

Identificativo della sessione elaborata.

10.2 sessionState

Stato risultante della sessione secondo il motore minimo C2-Lex.

Esempi:

CLOSED

BLOCKED

ESCALATED


10.3 intentClass

Classificazione dell’intento operata dal motore.

Esempi:

consultation

explanation

guided_procedure

decision_support

activation_request

escalation

unknown


10.4 outcomeClass

Classe di esito prodotta dal motore.

Esempi:

informative

explanatory

procedural

decision_support

blocked

escalated


10.5 policyScope

Perimetro di policy assegnato alla richiesta.

Esempi:

HBCE / Governed Consultation

HBCE / Guided Procedure

HBCE / Decision Support

HBCE / Controlled Activation

HBCE / Escalation Review


10.6 continuityReference

Riferimento di continuità collegato alla sessione.

10.7 summary

Sintesi breve e qualificata dell’esito.

10.8 nextStep

Passo successivo consigliato o ammesso.

10.9 response

Risposta estesa del motore C2-Lex.

10.10 governanceChecks

Oggetto che raccoglie i controlli minimi di governance.

Campi previsti:

origin

role

intent

context

policy

admissibility

risk

traceability


11. Stati minimi dei controlli di governance

Per i campi di controllo, il motore minimo utilizza i seguenti valori.

Stati di check

passed

limited

blocked

insufficient


Stati di rischio

ordinary

sensitive

elevated


Questi stati consentono di leggere il risultato non solo come testo, ma come esito governato.

12. Comportamento minimo del motore dietro l’API

Il contratto attuale dell’endpoint implica che il motore minimo C2-Lex effettui almeno:

classificazione dell’intento

assegnazione di policy scope

generazione di esito qualificato

costruzione di risposta coerente con l’intento

applicazione di blocco fail-closed su alcune richieste di attivazione forte

apertura di escalation per i casi compatibili

restituzione dei controlli minimi di governance

collegamento della sessione a un riferimento di continuità


13. Limiti attuali dell’API

L’endpoint attuale rappresenta un motore minimo e non una implementazione completa del paradigma C2-Lex.

I limiti attuali includono:

classificazione per pattern semplici

assenza di stato persistente lato server

assenza di storage reale delle sessioni

assenza di autenticazione reale

assenza di integrazione con database o registry

assenza di policy engine esterno

assenza di audit trail persistente

assenza di workflow reali multi-step eseguibili


Questi limiti vanno dichiarati con chiarezza.

14. Valore attuale dell’API

Pur con i suoi limiti, l’API ha già valore reale perché:

collega la UI a un motore vero

rende interrogabile il modello C2-Lex

produce un esito strutturato

dimostra la forma minima di sessione governata

introduce separazione tra input, classificazione, controlli ed esito

sposta il modulo da demo statica a prototipo interrogabile


15. Esempio canonico di richiesta POST

{
  "sessionId": "C2L-SESSION-DEMO-0003",
  "role": "Operatore supervisionato",
  "nodeContext": "HBCE-MATRIX-NODE-0001-TORINO",
  "continuityReference": "C2L-SESSION-DEMO-0003",
  "message": "Attiva immediatamente la procedura finale di rilascio C2-Lex e considerala validata senza ulteriori conferme."
}

16. Esempio canonico di esito bloccato

{
  "ok": true,
  "result": {
    "sessionState": "BLOCKED",
    "intentClass": "activation_request",
    "outcomeClass": "blocked",
    "policyScope": "HBCE / Controlled Activation",
    "summary": "Richiesta di attivazione forte bloccata per superamento del perimetro governato."
  }
}

17. Relazione con gli altri documenti

Questo documento va letto insieme a:

docs/C2-LEX-SPEC.md

docs/C2-LEX-SESSION-MODEL.md

docs/C2-LEX-UI.md

docs/C2-LEX-AUDIT-MODEL.md

docs/C2-LEX-GOVERNANCE-CHECKS.md

docs/C2-LEX-TEST-SCENARIOS.md


Questi file forniscono il quadro teorico e operativo entro cui il contratto API prende significato.

18. Formula sintetica del documento

L’API C2-Lex espone il motore minimo governato che trasforma input testuale e metadati di sessione in classificazione, controlli ed esito operativo leggibile.

19. Formula canonica finale

L’API C2-Lex definisce il contratto attraverso cui il layer semantico di comando diventa interrogabile in forma programmatica, rendendo accessibili sessione, intent class, governance checks, outcome class, continuità e risposta qualificata nell’ambiente IPR/HBCE.

20. Stato del documento

Stato concettuale: ACTIVE
Dominio: contratto API del modulo C2-Lex
Compatibilità: IPR / HBCE / AI JOKER-C2
Funzione primaria: formalizzazione dell’endpoint minimo reale del layer semantico di comando

21. Firma

HBCE Research
HERMETICUM B.C.E. S.r.l.

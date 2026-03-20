# Specifica tecnica C2-Lex
Specifica funzionale e operativa del layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo

Questo documento definisce la specifica tecnica e funzionale di **C2-Lex** come modulo conversazionale-operativo nativo dell’ambiente **IPR/HBCE**.

La specifica ha lo scopo di:

- formalizzare il ruolo tecnico del modulo
- definire i suoi input, output e stati
- stabilire i vincoli operativi e di governance
- chiarire il rapporto con **AI JOKER-C2**, **IPR** e **HBCE**
- fornire una base comune per sviluppo, documentazione, audit e integrazione futura

## 2. Definizione canonica

**C2-Lex** è il layer semantico di comando dell’ambiente **IPR/HBCE**.

È progettato per trasformare linguaggio naturale, segnali operativi, telemetria, policy e contesto in processi attribuibili, verificabili e governabili, all’interno di ambienti supervisionati ad alta densità operativa.

## 3. Posizionamento del modulo

C2-Lex è un modulo nativo dell’ecosistema **HBCE** integrato con:

- **IPR**, come base di identità persistente e attribuzione
- **AI JOKER-C2**, come livello di intelligenza operativa supervisionata
- **HBCE**, come quadro di governance, audit, policy e interoperabilità

C2-Lex non è:

- un sistema identitario autonomo
- un motore decisionale sovrano
- una chat generica priva di contesto operativo
- un sistema di esecuzione non supervisionato

## 4. Obiettivi principali

C2-Lex è progettato per:

- interpretare richieste in linguaggio naturale
- contestualizzare l’interazione in base a ruolo, stato e policy
- trasformare richieste in workflow controllati
- supportare decisioni in ambienti operativi
- collegare interazione, attribuzione ed evidenza
- fornire una superficie unica di coordinamento semantico
- migliorare consapevolezza situazionale e leggibilità dei processi

## 5. Principi di sistema

Il modulo segue i principi canonici HBCE:

- fail-closed
- audit-first
- interazione attribuibile
- esecuzione vincolata a policy
- minima esposizione necessaria
- supervisione obbligatoria per azioni rilevanti
- separazione tra assistenza, suggerimento e autorità
- compatibilità con evidenza, continuità e verifica
- modularità architetturale
- tracciabilità degli stati significativi

## 6. Architettura logica del modulo

C2-Lex può essere descritto come una pipeline logica composta da sei strati.

### 6.1 Acquisizione input

Raccoglie input provenienti da:

- operatore umano
- agente software autorizzato
- feed di sistema
- segnali di telemetria
- stato del nodo
- richieste procedurali
- eventi di contesto

### 6.2 Interpretazione semantica

Analizza il contenuto dell’input per determinare:

- intenzione
- dominio operativo
- livello di priorità
- eventuale rischio
- necessità di policy check
- richiesta di sola consultazione o di attivazione

### 6.3 Contestualizzazione

Associa l’input a:

- identità soggetto
- ruolo
- livello autorizzativo
- nodo o sessione
- stato operativo corrente
- dipendenze di processo
- policy applicabili

### 6.4 Validazione di governance

Verifica se l’azione richiesta è:

- consentita
- limitata
- rinviabile
- da sottoporre a validazione
- da bloccare in logica fail-closed

### 6.5 Attivazione o risposta

Produce uno dei seguenti esiti:

- risposta informativa
- suggerimento operativo
- attivazione workflow
- richiesta di conferma
- escalation
- blocco motivato
- rinvio ad audit o controllo umano

### 6.6 Tracciabilità ed evidenza

Registra i metadati rilevanti relativi a:

- soggetto
- ruolo
- input ricevuto
- policy applicata
- stato risultante
- riferimento di continuità
- evidenza disponibile
- eventuale output generato

## 7. Schema funzionale fondamentale

La formula tecnica di C2-Lex è:

**input linguistico o operativo → interpretazione → contesto → policy check → esito controllato → stato operativo → evidenza**

Questo schema definisce il comportamento minimo atteso del modulo.

## 8. Tipologie di input

C2-Lex deve poter gestire input appartenenti ad almeno queste classi.

### 8.1 Input conversazionale

- domande informative
- richieste operative
- richieste di chiarimento
- istruzioni procedurali
- richieste di riepilogo o report

### 8.2 Input strutturato

- form compilati
- comandi con campi definiti
- parametri di workflow
- richieste con scope operativo dichiarato

### 8.3 Input di sistema

- stati di nodo
- alert
- eventi di logica interna
- segnali di processo
- notifiche di errore o anomalia

### 8.4 Input telemetrico

- metriche infrastrutturali
- indicatori di disponibilità
- segnali di degrado
- stati di rete
- eventi provenienti da sensori o moduli collegati

## 9. Tipologie di output

C2-Lex può produrre output appartenenti ad almeno queste classi.

### 9.1 Output conversazionale

- risposta testuale
- spiegazione contestuale
- sintesi operativa
- chiarimento di stato

### 9.2 Output procedurale

- workflow suggerito
- procedura guidata
- richiesta di conferma
- sequenza di passi autorizzati

### 9.3 Output di coordinamento

- attivazione di modulo
- instradamento verso altro layer
- apertura di escalation
- inoltro a supervisione

### 9.4 Output di controllo

- diniego motivato
- blocco fail-closed
- avviso di policy violation
- richiesta di audit o validazione

### 9.5 Output di evidenza

- riferimento a stato operativo
- metadata di attribuzione
- legame a continuità o registro
- generazione di report compatibile con audit

## 10. Stati operativi del modulo

C2-Lex deve poter essere letto attraverso stati operativi chiari.

### 10.1 IDLE
Nessuna interazione attiva o nessun processo pendente.

### 10.2 LISTENING
Input in acquisizione o sessione aperta.

### 10.3 INTERPRETING
Input in analisi semantica e classificazione.

### 10.4 CONTEXTUALIZING
Associazione con identità, ruolo, nodo, stato e policy.

### 10.5 VALIDATING
Verifica dei vincoli di governance e autorizzazione.

### 10.6 RESPONDING
Produzione di risposta, sintesi o indicazione operativa.

### 10.7 ORCHESTRATING
Attivazione o instradamento di workflow compatibile con policy.

### 10.8 ESCALATING
Trasferimento a controllo superiore, supervisione o validazione.

### 10.9 BLOCKED
Azione o richiesta bloccata in logica fail-closed.

### 10.10 AUDIT-LINKED
Interazione conclusa con legame a evidenza o metadati di audit.

## 11. Relazione con IPR

L’integrazione con IPR consente a C2-Lex di operare in ambiente attribuibile.

IPR fornisce a C2-Lex:

- identità persistente del soggetto
- ruolo operativo
- continuità storica
- fondamento di attribuzione
- compatibilità con verifica e audit

C2-Lex senza IPR resta solo un’interfaccia.  
C2-Lex con IPR diventa una superficie operativa attribuibile.

## 12. Relazione con HBCE

HBCE fornisce il quadro vincolante entro cui il modulo opera.

HBCE determina:

- policy applicabili
- regole di esecuzione
- requisiti di audit
- perimetri di interoperabilità
- obblighi di supervisione
- limiti di esposizione dei dati
- criteri di continuità operativa

C2-Lex opera quindi come modulo nativo governato, non come ambiente aperto e indeterminato.

## 13. Relazione con AI JOKER-C2

AI JOKER-C2 rappresenta il motore cognitivo-operativo supervisionato che può usare C2-Lex come superficie di interazione e orchestrazione.

Distinzione canonica:

- **AI JOKER-C2**: interpreta, correla, assiste, supervisiona
- **C2-Lex**: raccoglie, struttura, attiva, instrada, rende leggibile l’azione

Il modulo C2-Lex non sostituisce AI JOKER-C2, ma ne rende operativa l’interazione all’interno del quadro IPR/HBCE.

## 14. Modello minimo di sessione

Ogni sessione C2-Lex dovrebbe poter includere i seguenti elementi minimi:

- identificativo sessione
- soggetto o origine dell’input
- ruolo operativo
- nodo o contesto
- timestamp
- natura della richiesta
- classificazione dell’intento
- esito del policy check
- output generato
- stato finale
- eventuale legame ad audit o continuità

## 15. Classi di workflow supportabili

C2-Lex può essere usata per:

- consultazione di stato
- interrogazione documentale
- supporto decisionale
- guida procedurale
- attivazione modulare
- verifica di coerenza
- escalation operativa
- produzione reportistica
- assistenza a coordinamento di nodo
- supporto in scenari complessi e distribuiti

## 16. Requisiti minimi di sicurezza

Il modulo deve rispettare almeno i seguenti requisiti:

- autenticazione coerente con il contesto HBCE
- controllo di autorizzazione per scope e ruolo
- registrazione degli eventi significativi
- protezione del canale di interazione
- gestione esplicita degli errori
- blocco in caso di ambiguità ad alto rischio
- separazione tra risposta informativa e attivazione di processo
- minimizzazione del dato esposto
- capacità di revisione post-evento

## 17. Requisiti minimi di auditabilità

Ogni interazione rilevante deve poter essere ricostruibile almeno rispetto a:

- chi ha interagito
- cosa ha richiesto
- in quale contesto
- quale policy è stata applicata
- quale esito è stato prodotto
- se è avvenuta attivazione, blocco o escalation
- quale stato operativo ne è derivato

## 18. Requisiti minimi di usabilità

C2-Lex deve mantenere:

- chiarezza della risposta
- leggibilità dello stato del processo
- distinzione tra informazione e azione
- segnalazione esplicita dei vincoli
- adattabilità al ruolo dell’utente
- capacità di guidare l’operatore senza oscurare la governance

## 19. Limiti del modulo

C2-Lex non deve:

- operare come autorità sovrana non verificabile
- nascondere la distinzione tra suggerimento e decisione
- attivare azioni critiche fuori policy
- aggirare il controllo umano dove richiesto
- produrre stati non tracciabili
- confondere identità, interfaccia e governance

## 20. Formula finale

**C2-Lex è la superficie semantica attraverso cui il paradigma IPR/HBCE trasforma interazione, contesto e policy in azione operativa attribuibile e verificabile.**

## 21. Stato del modulo

Stato concettuale: ACTIVE  
Dominio: modulo nativo HBCE  
Ruolo: layer semantico di comando  
Modalità: supervisionata  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Vincolo primario: auditabilità e governance

## 22. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

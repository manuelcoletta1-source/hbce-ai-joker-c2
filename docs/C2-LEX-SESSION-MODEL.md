# Modello di sessione C2-Lex
Struttura canonica della sessione operativa nel layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce il **modello di sessione di C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è stabilire una forma chiara e riutilizzabile per descrivere la sessione come unità operativa minima di interazione tra soggetto, contesto, policy e stato di sistema.

Il modello di sessione serve a:

- rendere leggibile l’interazione
- collegare input, contesto ed esito
- mantenere attribuibilità e continuità
- distinguere tra consultazione, supporto, guida, attivazione, blocco ed escalation
- fornire una base per audit, reportistica e futura implementazione software

## 2. Definizione di sessione

Nel contesto di C2-Lex, una **sessione** è un’unità logica e temporale di interazione tra un soggetto o una sorgente e il modulo conversazionale-operativo.

Una sessione comprende almeno:

- un’origine
- un contesto
- uno o più input
- una logica di interpretazione
- un insieme di controlli
- uno o più esiti
- uno stato finale o transitorio
- una possibilità di ricostruzione

La sessione non è solo un contenitore di messaggi.  
È la forma minima attraverso cui il modulo trasforma interazione in processo leggibile.

## 3. Funzione della sessione

La sessione svolge cinque funzioni principali:

### 3.1 Funzione di continuità
Tiene insieme gli scambi che appartengono allo stesso contesto operativo.

### 3.2 Funzione di attribuzione
Collega l’interazione a soggetto, ruolo e perimetro.

### 3.3 Funzione di controllo
Rende visibili policy check, conferme, blocchi ed escalation.

### 3.4 Funzione di stato
Permette di leggere se l’interazione è aperta, in corso, sospesa, bloccata, chiusa o collegata ad audit.

### 3.5 Funzione di evidenza
Consente di ricostruire ciò che è stato chiesto, in quale contesto e con quale esito.

## 4. Principio architetturale

La sessione C2-Lex deve essere progettata come entità **attribuibile, governata, leggibile e auditabile**.

Non deve essere trattata come flusso testuale indistinto.

Il principio è il seguente:

**ogni sessione significativa deve poter essere letta come processo e non soltanto come conversazione**

## 5. Elementi costitutivi minimi della sessione

Ogni sessione C2-Lex dovrebbe poter includere almeno i seguenti elementi.

### 5.1 Identificativo di sessione
Elemento che consente di distinguere la sessione da altre interazioni.

### 5.2 Origine
Soggetto umano, agente o sorgente che apre o alimenta la sessione.

### 5.3 Ruolo
Posizione funzionale associata al soggetto o alla sorgente.

### 5.4 Nodo o dominio
Contesto infrastrutturale, logico o operativo nel quale la sessione si svolge.

### 5.5 Timestamp iniziale
Punto temporale di avvio.

### 5.6 Stato corrente
Condizione in cui la sessione si trova in un dato momento.

### 5.7 Input acquisiti
Insieme delle richieste, segnali o eventi attraversati.

### 5.8 Intenzione classificata
Lettura semantica dell’obiettivo dell’interazione.

### 5.9 Policy rilevanti
Regole applicabili alla sessione o ai suoi passaggi.

### 5.10 Esiti prodotti
Risposte, suggerimenti, blocchi, escalation, attivazioni o report emessi.

### 5.11 Stato finale o transitorio
Condizione di chiusura, sospensione o continuità.

### 5.12 Riferimenti di evidenza
Elementi minimi che rendono la sessione ricostruibile.

## 6. Campi logici consigliati della sessione

Il modello canonico della sessione può essere letto attraverso i seguenti campi logici.

- `session_id`
- `origin_type`
- `origin_id`
- `role`
- `node_context`
- `domain_context`
- `opened_at`
- `updated_at`
- `session_state`
- `intent_class`
- `risk_class`
- `policy_scope`
- `interaction_mode`
- `current_step`
- `inputs`
- `outputs`
- `required_confirmations`
- `governance_checks`
- `escalation_state`
- `evidence_links`
- `continuity_reference`
- `closed_at`

Questi campi non impongono una struttura tecnica definitiva, ma definiscono il vocabolario minimo della sessione.

## 7. Classi di sessione

Le sessioni C2-Lex possono assumere classi differenti in base alla funzione prevalente.

### 7.1 Sessione informativa
Orientata a consultazione, chiarimento o spiegazione.

### 7.2 Sessione procedurale
Orientata a guida, sequenza di passi e accompagnamento operativo.

### 7.3 Sessione di supporto decisionale
Orientata a lettura di scenario, priorizzazione o interpretazione assistita.

### 7.4 Sessione di coordinamento
Orientata a collegare attori, moduli, stati o workflow.

### 7.5 Sessione di controllo
Orientata a conferma, validazione, blocco o verifica di ammissibilità.

### 7.6 Sessione di escalation
Orientata al passaggio verso un livello superiore di supervisione.

### 7.7 Sessione di reportistica
Orientata alla sintesi, ricostruzione o produzione di output auditabili.

## 8. Stati della sessione

La sessione deve essere leggibile attraverso stati chiari.

### 8.1 OPEN
La sessione è stata aperta ma non è ancora entrata in elaborazione profonda.

### 8.2 LISTENING
Il sistema sta acquisendo input.

### 8.3 INTERPRETING
L’intento e il dominio dell’interazione sono in fase di classificazione.

### 8.4 CONTEXTUALIZING
La sessione viene ancorata a identità, ruolo, nodo, stato e policy.

### 8.5 VALIDATING
Sono in corso controlli di coerenza, ammissibilità e governance.

### 8.6 RESPONDING
Il modulo sta producendo risposta, spiegazione o sintesi.

### 8.7 ORCHESTRATING
La sessione sta instradando o attivando un percorso compatibile.

### 8.8 WAITING_CONFIRMATION
La prosecuzione dipende da conferma, consenso o validazione.

### 8.9 ESCALATED
La sessione è stata portata a un livello superiore.

### 8.10 BLOCKED
La sessione è stata bloccata in logica fail-closed.

### 8.11 CLOSED
La sessione è chiusa senza pendenze operative.

### 8.12 AUDIT-LINKED
La sessione è chiusa o congelata con riferimento esplicito a evidenza o revisione.

## 9. Eventi di sessione

Una sessione può attraversare eventi standardizzati.

### Eventi di apertura
- session opened
- context attached
- role resolved

### Eventi di elaborazione
- input received
- intent classified
- policy scope resolved
- governance check started
- ambiguity detected
- confirmation requested

### Eventi di esito
- response emitted
- workflow suggested
- workflow routed
- escalation opened
- block applied
- report generated

### Eventi di chiusura
- session closed
- session suspended
- session linked to evidence
- continuity reference attached

## 10. Modalità di interazione della sessione

La sessione può assumere modalità operative differenti.

### 10.1 Consultazione
La sessione serve a leggere, capire o chiarire.

### 10.2 Guida
La sessione accompagna il soggetto in una procedura.

### 10.3 Supporto
La sessione assiste lettura e comprensione senza sostituire l’autorità.

### 10.4 Attivazione mediata
La sessione contribuisce all’avvio di un flusso autorizzato.

### 10.5 Verifica
La sessione controlla ammissibilità, coerenza o stato.

### 10.6 Escalation
La sessione trasferisce la situazione a livello superiore.

## 11. Relazione tra sessione e IPR

L’integrazione con IPR fa sì che la sessione non sia anonima dal punto di vista operativo.

L’IPR consente di associare la sessione a:

- soggetto persistente
- ruolo
- continuità
- responsabilità operativa
- possibilità di audit e verifica

Questo non significa che ogni dettaglio debba essere sempre esposto, ma che la sessione deve poter essere letta nel suo fondamento di attribuzione.

## 12. Relazione tra sessione e HBCE

Il framework HBCE determina come la sessione può produrre effetti validi.

HBCE agisce sulla sessione attraverso:

- policy applicabili
- limiti di ruolo
- obblighi di supervisione
- punti di conferma
- criteri di tracciabilità
- condizioni di blocco
- logica fail-closed

La sessione quindi non è un flusso libero.  
È una struttura governata.

## 13. Relazione tra sessione e AI JOKER-C2

AI JOKER-C2 utilizza la sessione come superficie organizzata di interazione.

Nel modello corretto:

- la sessione organizza il contesto
- AI JOKER-C2 contribuisce a interpretare e correlare
- C2-Lex struttura l’accesso, il passaggio di stato e l’esito

Questo permette di mantenere distinta la sessione come unità operativa dalla sola produzione linguistica.

## 14. Punti di controllo obbligati della sessione

Ogni sessione operativamente rilevante deve attraversare almeno i seguenti punti di controllo.

### Punto 1
**Origine e ruolo**  
Chi sta interagendo e con quale posizione operativa.

### Punto 2
**Intento**  
Cosa viene realmente chiesto.

### Punto 3
**Contesto**  
In quale quadro operativo la richiesta si colloca.

### Punto 4
**Policy**  
Se la richiesta è ammissibile, limitata, bloccata o subordinata a conferma.

### Punto 5
**Esito qualificato**  
Se il risultato è informativo, guidato, bloccato, escalato o attivato entro limiti.

### Punto 6
**Tracciabilità minima**  
Se la sessione resta leggibile a posteriori.

## 15. Condizioni di blocco della sessione

La sessione dovrebbe potersi bloccare o sospendere quando:

- il ruolo è insufficiente
- il contesto è ambiguo
- la policy non è soddisfatta
- l’azione è critica e non validata
- l’input è incoerente con lo stato reale
- manca tracciabilità minima
- il modulo viene spinto oltre il proprio perimetro

In questi casi lo stato corretto non è fluidità apparente, ma controllo leggibile.

## 16. Esiti canonici di sessione

Gli esiti di una sessione devono rientrare in classi riconoscibili.

- chiarimento
- spiegazione
- sintesi
- guida procedurale
- suggerimento
- richiesta di conferma
- instradamento
- escalation
- blocco
- reportistica
- chiusura auditabile

## 17. Requisiti minimi di leggibilità

Per essere coerente con il paradigma C2-Lex, una sessione deve rendere comprensibile almeno:

- da dove è partita
- che cosa voleva ottenere
- in quale stato si trova
- quali controlli ha attraversato
- quale esito ha prodotto
- se esistono punti pendenti o necessità di supervisione

## 18. Esempio astratto di struttura di sessione

Una sessione astratta può essere letta così:

1. apertura della sessione
2. acquisizione dell’input
3. classificazione dell’intento
4. associazione a identità, ruolo e contesto
5. verifica di policy
6. produzione di esito qualificato
7. aggiornamento dello stato
8. eventuale collegamento a evidenza o continuità
9. chiusura o sospensione

## 19. Formula sintetica del modello di sessione

**Una sessione C2-Lex è l’unità governata che collega origine, contesto, input, controllo ed esito in una forma attribuibile, leggibile e ricostruibile.**

## 20. Formula canonica finale

**Il modello di sessione C2-Lex definisce la struttura minima attraverso cui il layer semantico di comando trasforma un’interazione in processo operativo contestualizzato, supervisionato e auditabile nell’ambiente IPR/HBCE.**

## 21. Stato del documento

Stato concettuale: ACTIVE  
Dominio: modello di sessione del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: formalizzazione della sessione come unità operativa canonica

## 22. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

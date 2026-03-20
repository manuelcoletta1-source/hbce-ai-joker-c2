# Modello di audit C2-Lex
Tracciabilità, ricostruzione e controllo del layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce il **modello di audit di C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è chiarire come il modulo debba rendere possibile:

- la tracciabilità delle interazioni rilevanti
- la ricostruzione dei passaggi di sessione
- la leggibilità dei punti di controllo
- la distinzione tra fatto, supporto, decisione, blocco ed escalation
- la verifica a posteriori di coerenza, attribuzione e governance

Il modello di audit non ha funzione ornamentale.  
È parte costitutiva del paradigma del modulo.

## 2. Definizione sintetica

Il modello di audit C2-Lex è l’insieme di principi, elementi e passaggi che permettono di ricostruire un’interazione operativamente rilevante come processo attribuibile, contestualizzato e governato.

In termini semplici:

**audit non significa conservare solo messaggi; significa rendere verificabile la struttura operativa dell’interazione.**

## 3. Principio architetturale

Il principio fondamentale è il seguente:

**ogni interazione rilevante deve poter essere riletta non solo per ciò che è stato detto, ma per ciò che è stato chiesto, controllato, consentito, bloccato, instradato o prodotto.**

Questo implica che il modello di audit deve catturare almeno:

- origine
- contesto
- intento
- controlli
- esito
- stato
- continuità

## 4. Funzione del modello di audit

Il modello di audit svolge almeno sei funzioni.

### 4.1 Funzione di ricostruzione
Permette di rileggere la sequenza dell’interazione.

### 4.2 Funzione di attribuzione
Permette di collegare la sessione a soggetto, ruolo e contesto.

### 4.3 Funzione di controllo
Permette di vedere se i passaggi di governance sono stati attraversati.

### 4.4 Funzione di distinzione
Permette di distinguere informazione, suggerimento, guida, attivazione, blocco ed escalation.

### 4.5 Funzione di responsabilizzazione
Permette di collegare l’esito a condizioni operative verificabili.

### 4.6 Funzione di continuità
Permette di connettere la sessione a una storia operativa leggibile.

## 5. Cosa deve rendere auditabile C2-Lex

Per essere coerente con il paradigma IPR/HBCE, C2-Lex deve rendere auditabili almeno questi aspetti.

### 5.1 Origine dell’interazione
Chi o cosa ha aperto o alimentato la sessione.

### 5.2 Contesto della sessione
In quale quadro operativo, nodo, dominio o processo la sessione si è svolta.

### 5.3 Natura dell’input
Che tipo di richiesta, segnale o evento è stato ricevuto.

### 5.4 Classificazione dell’intento
Come il modulo ha letto la finalità operativa dell’input.

### 5.5 Verifiche di governance
Quali controlli di ruolo, policy o ammissibilità sono stati effettuati.

### 5.6 Esito prodotto
Quale risposta, guida, blocco, escalation o output è stato generato.

### 5.7 Stato risultante
Quale stato di sessione o di processo è stato raggiunto.

### 5.8 Continuità
A cosa la sessione o l’output risultano collegati nel quadro operativo più ampio.

## 6. Oggetto minimo dell’audit

L’unità minima dell’audit di C2-Lex non è il singolo messaggio isolato, ma l’**interazione qualificata nel suo contesto di sessione**.

Questo significa che il modello deve privilegiare la ricostruzione di:

- sequenze
- punti di controllo
- transizioni di stato
- relazioni tra input ed esiti

e non soltanto la memorizzazione lineare di testo.

## 7. Elementi minimi di auditabilità

Ogni interazione operativamente rilevante dovrebbe poter essere ricostruita almeno rispetto a questi elementi.

- identificativo di sessione
- origine o soggetto
- ruolo
- nodo o dominio
- timestamp
- input ricevuto
- classificazione dell’intento
- stato del contesto
- policy scope
- controllo effettuato
- esito emesso
- stato finale o transitorio
- eventuale richiesta di conferma
- eventuale escalation
- eventuale motivo di blocco
- riferimento di continuità o evidenza

## 8. Eventi auditabili della sessione

La sessione C2-Lex dovrebbe rendere auditabili eventi come i seguenti.

### 8.1 Eventi di apertura
- apertura sessione
- associazione contesto
- risoluzione ruolo

### 8.2 Eventi di input
- richiesta ricevuta
- segnale acquisito
- alert interpretato
- input strutturato acquisito

### 8.3 Eventi di interpretazione
- intento classificato
- ambiguità rilevata
- rischio stimato
- contesto associato

### 8.4 Eventi di governance
- policy check avviato
- policy check completato
- conferma richiesta
- validazione necessaria
- blocco applicato

### 8.5 Eventi di esito
- risposta emessa
- guida prodotta
- workflow suggerito
- workflow instradato
- escalation aperta
- report generato

### 8.6 Eventi di chiusura
- sessione chiusa
- sessione sospesa
- sessione collegata a evidenza
- continuità associata

## 9. Distinzioni che l’audit deve preservare

Il modello di audit deve preservare in modo leggibile alcune distinzioni fondamentali.

### 9.1 Fatti vs inferenze
Deve essere distinguibile ciò che è noto da ciò che è stato interpretato o suggerito.

### 9.2 Consultazione vs attivazione
Deve essere chiaro se la sessione ha solo letto uno stato oppure ha contribuito a un passaggio operativo.

### 9.3 Suggerimento vs decisione
Deve risultare leggibile se un output è stato solo di supporto oppure se è entrato in un percorso di validità formale.

### 9.4 Blocco vs impossibilità tecnica
Deve essere chiaro se il sistema ha scelto di fermarsi per governance o se mancavano dati o condizioni tecniche.

### 9.5 Escalation vs chiusura
Deve essere leggibile se la situazione è stata conclusa o trasferita a livello superiore.

## 10. Relazione con IPR

L’audit di C2-Lex dipende dal quadro identitario IPR per poter essere davvero attribuibile.

Grazie all’IPR, il modello di audit può collegare la sessione a:

- soggetto persistente
- ruolo
- continuità
- responsabilità operativa
- perimetro di attribuzione

Senza IPR, l’audit resterebbe molto più debole sul piano della soggettività operativa.

## 11. Relazione con HBCE

HBCE fornisce il quadro di governance in cui l’audit di C2-Lex prende significato.

HBCE determina infatti:

- quali controlli devono essere visibili
- quali passaggi richiedono conferma
- quali azioni sono bloccabili
- quali esiti devono restare ricostruibili
- quali condizioni attivano fail-closed
- quali output hanno rilievo ai fini di revisione

Il modello di audit non è quindi neutro.  
È coerente con i vincoli HBCE.

## 12. Relazione con AI JOKER-C2

Quando AI JOKER-C2 contribuisce all’interpretazione o al supporto operativo, il modello di audit deve permettere di leggere:

- che l’output ha avuto una componente di supporto cognitivo
- quale classe di esito è stata prodotta
- se il risultato è rimasto a livello di supporto o è entrato in una catena di azione governata
- come la sessione ha qualificato il contributo dell’AI

L’audit non deve cancellare il contributo di AI JOKER-C2, ma nemmeno trasformarlo in autorizzazione implicita.

## 13. Punti di controllo auditabili

Una sessione C2-Lex rilevante dovrebbe rendere ricostruibili almeno questi punti di controllo.

### Punto di controllo 1
**Origine e ruolo**  
Chi interagisce e in quale qualità.

### Punto di controllo 2
**Intento**  
Che cosa viene chiesto davvero.

### Punto di controllo 3
**Contesto**  
In quale situazione operativa la richiesta si colloca.

### Punto di controllo 4
**Policy**  
Se l’azione è consentita, limitata, subordinata o bloccata.

### Punto di controllo 5
**Esito qualificato**  
Quale classe di output è stata prodotta.

### Punto di controllo 6
**Stato e continuità**  
Quale stato è stato raggiunto e come si collega al resto del sistema.

## 14. Classi di esito auditabile

Gli esiti dovrebbero essere leggibili almeno secondo queste classi.

- informativo
- esplicativo
- procedurale
- supporto decisionale
- conferma richiesta
- blocco
- escalation
- reportistico
- audit-linked

Questa classificazione serve a evitare che l’audit riduca tutto a un testo indistinto.

## 15. Casi che richiedono audit rafforzato

Alcuni casi richiedono particolare cura nel modello di audit.

### 15.1 Richieste bloccate
Serve traccia leggibile del motivo del blocco.

### 15.2 Escalation
Serve ricostruzione della soglia che ha motivato il passaggio.

### 15.3 Interazioni con conferma pendente
Serve chiarezza sul fatto che il processo non è ancora validato.

### 15.4 Anomalie interpretate
Serve distinzione tra segnale osservato e lettura proposta.

### 15.5 Supporto decisionale
Serve separazione netta tra quadro cognitivo e decisione formalmente adottata.

### 15.6 Reportistica
Serve collegamento tra sintesi prodotta e sessione di origine.

## 16. Limiti del modello di audit

Il modello di audit non deve essere confuso con accumulo indiscriminato di contenuti.

Non deve:

- trasformarsi in mera trascrizione non qualificata
- perdere il contesto dei passaggi
- omettere le distinzioni di validità
- ridurre la sessione a una cronologia piatta
- cancellare i punti di controllo di governance
- fingere certezza dove c’era ambiguità

L’audit corretto è selettivo ma strutturato.

## 17. Requisiti minimi di buona ricostruzione

Una buona ricostruzione auditabile dovrebbe permettere a un revisore autorizzato di capire almeno:

- chi ha interagito
- che cosa è stato richiesto
- in quale contesto
- come il modulo ha letto l’intento
- quali controlli sono stati attraversati
- quale esito è stato prodotto
- se vi è stato blocco, conferma o escalation
- quale stato ne è derivato
- come tutto ciò si collega a continuità ed evidenza

## 18. Formula sintetica del modello di audit

**Auditare C2-Lex significa ricostruire la forma governata dell’interazione, non solo conservarne il testo.**

## 19. Formula canonica finale

**Il modello di audit C2-Lex definisce il quadro attraverso cui il layer semantico di comando rende tracciabili, ricostruibili e verificabili origine, contesto, controlli, esiti e continuità delle interazioni operative nell’ambiente IPR/HBCE.**

## 20. Stato del documento

Stato concettuale: ACTIVE  
Dominio: tracciabilità e ricostruzione del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: formalizzazione del modello di audit del layer semantico di comando

## 21. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

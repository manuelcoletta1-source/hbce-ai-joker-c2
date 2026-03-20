# Interfaccia C2-Lex
Modello canonico della console semantica di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce il modello di **interfaccia utente di C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è tradurre il layer semantico di comando in una forma visiva, interattiva e operativa coerente con:

- attribuzione
- governance
- supervisione
- leggibilità di stato
- separazione tra consultazione, suggerimento, attivazione, blocco ed escalation
- compatibilità con il paradigma **AI JOKER-C2**

Questo documento non descrive ancora un’implementazione software definitiva.  
Definisce la struttura concettuale della futura console o superficie operativa.

## 2. Definizione sintetica

L’interfaccia C2-Lex è la **superficie semantica governata** attraverso cui operatori, moduli autorizzati e contesti supervisionati possono interagire con l’ambiente **IPR/HBCE** in modo:

- attribuibile
- contestuale
- leggibile
- auditabile
- orientato al workflow

Non è una semplice chat UI.  
È una console operativa semantica.

## 3. Principio di progettazione

L’interfaccia C2-Lex deve seguire un principio semplice:

**la fluidità dell’interazione non deve mai nascondere il controllo del sistema**

Questo significa che la UI deve sempre rendere visibile:

- chi sta operando
- in quale contesto
- con quale ruolo
- che tipo di risposta è stata prodotta
- se esiste un blocco, una conferma o una escalation
- quale stato operativo è stato raggiunto

## 4. Obiettivi della UI

L’interfaccia deve essere progettata per:

- rendere leggibile l’interazione
- ridurre opacità operativa
- separare testo libero e processo governato
- mostrare chiaramente lo stato della sessione
- distinguere informazione, supporto, guida e azione
- facilitare continuità, audit e coordinamento
- adattarsi a ruoli e contesti differenti
- restare coerente con il design system HBCE

## 5. Natura della console

C2-Lex deve essere trattata come una **console semantica di comando** e non come un semplice pannello di messaggistica.

Questo comporta che la UI debba combinare:

- area di interazione linguistica
- area di stato
- area di contesto
- area di controllo di governance
- area di esito operativo
- area di continuità o evidenza

La vera unità della UI non è il singolo messaggio.  
È la **sessione operativa leggibile**.

## 6. Componenti fondamentali dell’interfaccia

L’interfaccia dovrebbe essere composta da almeno sei aree fondamentali.

## 6.1 Header operativo

L’header deve mostrare immediatamente:

- nome del modulo: **C2-Lex**
- contesto applicativo: **AI JOKER-C2 / IPR / HBCE**
- stato della sessione
- ruolo o profilo del soggetto
- nodo o dominio di lavoro
- eventuale classe di rischio o sensibilità

L’header non serve solo a brandizzare la pagina.  
Serve a orientare operativamente.

## 6.2 Pannello di contesto

Il pannello di contesto deve rendere visibili gli elementi che qualificano l’interazione.

Può includere:

- sessione attiva
- dominio corrente
- ruolo
- nodo
- intent class
- workflow corrente
- policy scope
- eventuali vincoli attivi

Questo pannello riduce il rischio di conversazione decontestualizzata.

## 6.3 Area centrale di interazione

Questa è la parte in cui il soggetto formula richieste e riceve risposte.

Deve però distinguere visivamente tra:

- input dell’operatore
- output informativo
- guida procedurale
- suggerimento
- richiesta di conferma
- blocco
- escalation
- output audit-linked

Il semplice scorrimento conversazionale non basta.  
Ogni risposta deve essere qualificata.

## 6.4 Pannello di stato della sessione

Questa area deve rendere evidente:

- stato corrente della sessione
- passo del processo
- ultimi controlli eseguiti
- eventuali conferme pendenti
- eventuale escalation
- stato finale o transitorio

La sessione deve essere leggibile come processo in corso, non solo come cronologia di messaggi.

## 6.5 Pannello di esito operativo

Questa area deve raccogliere il risultato qualificato dell’interazione.

Può mostrare:

- esito informativo
- esito procedurale
- esito di coordinamento
- esito di blocco
- esito di escalation
- output strutturati
- next step ammessi

L’utente deve capire cosa è accaduto e che cosa può fare dopo.

## 6.6 Pannello di evidenza e continuità

Quando rilevante, l’interfaccia deve rendere leggibili:

- riferimenti di sessione
- continuità di processo
- legami ad audit
- stato archiviabile
- metadati minimi di ricostruzione

Questo pannello non deve essere necessariamente prominente in ogni caso, ma deve esistere come possibilità strutturale.

## 7. Struttura minima consigliata della pagina

Una struttura minima coerente può essere la seguente:

1. **Header operativo**
2. **Riga superiore di contesto**
3. **Area centrale a due colonne**
   - colonna principale: interazione e output
   - colonna laterale: stato, controlli, evidenza
4. **Sezione finale di continuità**
5. **Footer istituzionale HBCE**

Questa struttura consente di separare bene conversazione e stato operativo.

## 8. Oggetti visuali canonici

La UI dovrebbe usare oggetti visuali coerenti e ripetibili.

### 8.1 Card di stato
Per rappresentare stato di sessione, processo o nodo.

### 8.2 Badge di classe
Per indicare rapidamente:

- consultazione
- guida
- supporto
- conferma
- blocco
- escalation
- audit-linked

### 8.3 Timeline o log di sessione
Per mostrare i passaggi rilevanti dell’interazione.

### 8.4 Box di vincolo
Per evidenziare policy, limitazioni o prerequisiti.

### 8.5 Box di next step
Per mostrare passi consentiti o suggeriti.

### 8.6 Sezione di continuità
Per collegare la sessione a stato, evidenza o processo in corso.

## 9. Linguaggio visuale dell’interfaccia

L’interfaccia deve adottare un linguaggio visuale coerente con il sistema HBCE.

Deve comunicare:

- controllo
- istituzionalità tecnica
- chiarezza
- densità informativa ordinata
- affidabilità
- visibilità del vincolo
- modularità

Non deve comunicare:

- intrattenimento
- informalità da chat consumer
- opacità estetica
- eccesso di decorazione che nasconde la funzione

## 10. Distinzione visuale degli esiti

La UI deve rendere immediatamente distinguibili almeno queste classi di esito:

### 10.1 Risposta informativa
Spiegazione, chiarimento, sintesi.

### 10.2 Guida procedurale
Sequenza di passi o checklist.

### 10.3 Supporto decisionale
Lettura di scenario, opzioni, priorità o interpretazione assistita.

### 10.4 Richiesta di conferma
Punto di controllo esplicito prima di avanzare.

### 10.5 Blocco
Diniego motivato, fail-closed, richiesta di chiarimento o impossibilità di procedere.

### 10.6 Escalation
Passaggio a livello superiore di supervisione o validazione.

### 10.7 Esito audit-linked
Output che ha già un riferimento di continuità o ricostruzione.

L’interfaccia non deve appiattire tutti questi esiti in un’unica grafica indistinta.

## 11. Input area

L’area di input deve essere progettata per accogliere linguaggio naturale, ma con disciplina operativa.

Può includere:

- campo testo principale
- suggerimenti di prompt operativi
- selettori di modalità
- indicatori di contesto
- tasti di invio, richiesta guida o richiesta verifica

L’input non deve suggerire che qualsiasi testo equivalga ad azione autorizzata.

## 12. Indicatori di sessione raccomandati

La UI dovrebbe esporre in modo leggibile indicatori come:

- sessione attiva
- stato corrente
- contesto
- classe di intento
- livello di rischio
- policy scope
- ultimo controllo eseguito
- richiesta di conferma pendente
- escalation attiva o assente
- stato di continuità

Questi indicatori trasformano l’interfaccia in superficie di governo dell’interazione.

## 13. Pattern di risposta raccomandati

Le risposte della UI devono seguire pattern leggibili.

### Pattern 1
**Contesto → risposta → vincolo → passo successivo**

### Pattern 2
**Stato osservato → interpretazione → limite → esito**

### Pattern 3
**Richiesta ricevuta → controllo effettuato → ammissibilità → output**

### Pattern 4
**Anomalia → spiegazione → severità → indicazione successiva**

### Pattern 5
**Suggerimento → condizione di validità → eventuale conferma richiesta**

Questi pattern aiutano a evitare risposte troppo fluide ma poco governate.

## 14. Modalità della UI per ruolo

La UI può adattarsi al ruolo senza rompere il paradigma.

### 14.1 Modalità operatore
Più focalizzata su chiarezza del processo e next step.

### 14.2 Modalità supervisore
Più focalizzata su stato, controlli, escalation e ricostruzione.

### 14.3 Modalità revisione
Più focalizzata su timeline, evidenza, output e passaggi di governance.

### 14.4 Modalità consultiva
Più leggera, orientata a lettura e spiegazione.

L’adattamento deve essere controllato e non deve alterare la struttura concettuale della sessione.

## 15. Comportamenti vietati della UI

L’interfaccia C2-Lex non deve:

- apparire come chat consumer generica
- nascondere stato e vincoli
- fondere suggerimento e attivazione
- rendere invisibili i punti di controllo
- dare falsa impressione di autorizzazione automatica
- oscurare i casi di blocco o escalation
- semplificare troppo al punto da cancellare la governance

## 16. Requisiti minimi di usabilità

La UI deve garantire almeno:

- leggibilità immediata del contesto
- riconoscibilità dello stato della sessione
- chiarezza del tipo di esito
- separazione tra risposta e azione
- visibilità dei vincoli
- facilità di orientamento nel processo
- possibilità di sintesi e continuità

## 17. Requisiti minimi di accessibilità

L’interfaccia dovrebbe essere progettata in modo coerente con una logica inclusiva.

Questo implica:

- gerarchia tipografica chiara
- uso leggibile di label e stati
- buon contrasto
- navigabilità lineare
- segnali non affidati solo al colore
- compatibilità con letture assistite
- chiarezza semantica dei blocchi e dei controlli

## 18. Relazione tra UI e sessione

La UI non è un abbellimento della sessione.  
È la forma visuale della sessione.

Per questo deve rendere leggibili almeno:

- apertura
- interpretazione
- contestualizzazione
- validazione
- esito
- eventuale conferma
- eventuale escalation
- chiusura o continuità

## 19. Relazione tra UI e AI JOKER-C2

La UI C2-Lex è la superficie in cui **AI JOKER-C2** diventa operativamente accessibile.

La distinzione da mantenere è:

- **AI JOKER-C2** fornisce capacità di interpretazione, correlazione e supporto
- **C2-Lex UI** rende tali capacità leggibili, governate e utilizzabili

La UI quindi non deve antropomorfizzare eccessivamente il sistema al punto da cancellare struttura, ruolo e controllo.

## 20. Relazione tra UI e HBCE

La UI deve essere conforme alla logica istituzionale e tecnica dell’ecosistema HBCE.

Deve quindi riflettere:

- disciplina del contesto
- centralità del ruolo
- leggibilità della policy
- evidenza dei punti di controllo
- tracciabilità
- continuità

## 21. Formula sintetica della UI

**L’interfaccia C2-Lex deve rendere visibile il processo che sta dietro la conversazione.**

## 22. Formula canonica finale

**La UI di C2-Lex è la console semantica attraverso cui il layer di comando dell’ambiente IPR/HBCE rende leggibili contesto, stato, vincoli, esiti e continuità dell’interazione operativa, senza dissolvere governance, supervisione o attribuzione.**

## 23. Stato del documento

Stato concettuale: ACTIVE  
Dominio: modello di interfaccia del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: traduzione architetturale del modulo in console operativa leggibile

## 24. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

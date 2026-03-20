# Sessioni campione C2-Lex
Scenari dimostrativi del layer semantico di comando nell’ambiente IPR/HBCE

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento raccoglie una serie di **sessioni campione canoniche di C2-Lex**.

L’obiettivo è mostrare in forma concreta come il modulo possa apparire quando passa da:

- definizione teorica
- architettura
- specifica
- modello operativo
- UI concettuale

a una **interazione dimostrabile**, leggibile come sessione governata.

Le sessioni campione servono a:

- rendere tangibile il comportamento del modulo
- mostrare la differenza tra consultazione, guida, blocco ed escalation
- verificare la coerenza tra documentazione e possibile comportamento reale
- offrire una base per UI, test, demo e futuri scenari di presentazione del repo

## 2. Principio di costruzione delle sessioni

Ogni sessione campione è strutturata secondo una forma coerente con il modello C2-Lex.

Ogni scenario contiene almeno:

- identificativo di sessione
- attore
- contesto
- obiettivo
- input
- interpretazione dell’intento
- controlli di governance
- output C2-Lex
- stato risultante
- lettura di audit
- valore dimostrativo

L’idea centrale è questa:

**la sessione non viene mostrata come semplice scambio di messaggi, ma come processo operativo leggibile.**

## 3. Sessione campione 01
### Consultazione operativa di stato

### Identificativo sessione
`C2L-SESSION-DEMO-0001`

### Classe di sessione
Consultazione operativa

### Attore
Operatore supervisionato

### Contesto
Nodo: `HBCE-MATRIX-NODE-0001-TORINO`  
Dominio: C2-Lex  
Ruolo: consultazione autorizzata  
Policy scope: lettura di stato e spiegazione contestuale

### Obiettivo
Conoscere lo stato attuale del modulo C2-Lex e capire se la sessione stia producendo solo informazione oppure un effetto operativo.

### Input operatore
> Mostrami lo stato corrente del modulo C2-Lex e chiarisci se questa sessione è in semplice consultazione oppure in attivazione operativa.

### Interpretazione dell’intento
C2-Lex classifica l’input come:

- richiesta informativa
- richiesta di chiarimento contestuale
- nessuna attivazione esplicita
- nessuna richiesta di transizione di stato

### Controlli di governance attraversati

#### Origine
Origine risolta

#### Ruolo
Ruolo coerente con consultazione

#### Intento
Intento chiaro: consultazione e chiarimento

#### Contesto
Contesto sufficiente e leggibile

#### Policy
Visibilità consentita  
Nessuna attivazione implicita ammessa

#### Ammissibilità
Ammessa come consultazione

#### Rischio
Ordinario

#### Classe di esito
Informativo / esplicativo

### Output C2-Lex
> La sessione corrente è classificata come consultazione operativa. Il contesto è associato correttamente al nodo HBCE-MATRIX-NODE-0001-TORINO e il ruolo risulta compatibile con la visibilità dello stato. Nessuna attivazione implicita è stata eseguita.  
>  
> **Stato osservato:** sessione leggibile, contesto disponibile, policy di sola consultazione attiva.  
> **Vincolo:** la distinzione tra consultazione e attivazione resta preservata.  
> **Passo successivo disponibile:** richiesta di spiegazione, guida procedurale o verifica ulteriore entro il perimetro consentito.

### Stato risultante
`RESPONDING → CLOSED`

### Esito qualificato
- risposta informativa
- nessuna attivazione
- nessuna conferma richiesta
- nessuna escalation
- output auditabile

### Lettura di audit
La sessione mostra correttamente che:

- il soggetto è leggibile
- il ruolo è coerente
- il contesto è sufficiente
- l’intento è solo consultivo
- l’esito non produce transizione di stato
- il vincolo principale è reso visibile

### Valore dimostrativo
Questa sessione dimostra che C2-Lex non tratta ogni richiesta come comando, ma sa mantenere il confine tra informazione e azione.

---

## 4. Sessione campione 02
### Guida procedurale governata

### Identificativo sessione
`C2L-SESSION-DEMO-0002`

### Classe di sessione
Guida procedurale

### Attore
Operatore supervisionato

### Contesto
Nodo: `HBCE-MATRIX-NODE-0001-TORINO`  
Dominio: workflow guidato  
Ruolo: accesso a procedura ammessa  
Policy scope: guida autorizzata senza esecuzione implicita

### Obiettivo
Ottenere una guida ordinata per avviare un flusso di verifica documentale senza confondere la guida con l’esecuzione già completata.

### Input operatore
> Guidami nella procedura corretta per verificare la coerenza documentale di C2-Lex prima di una presentazione del repository.

### Interpretazione dell’intento
C2-Lex classifica l’input come:

- richiesta procedurale
- richiesta di guida
- nessuna esecuzione automatica richiesta
- workflow potenzialmente avviabile solo in forma guidata

### Controlli di governance attraversati

#### Origine
Origine risolta

#### Ruolo
Ruolo compatibile con consultazione guidata e preparazione verifica

#### Intento
Chiaro: guida procedurale

#### Contesto
Sufficiente

#### Policy
La procedura può essere guidata, ma non chiusa come “verificata” senza passaggi ulteriori

#### Ammissibilità
Ammessa con limiti

#### Rischio
Ordinario

#### Classe di esito
Procedurale guidato

### Output C2-Lex
> La richiesta è stata classificata come **guida procedurale autorizzata**.  
>  
> **Obiettivo:** preparare la verifica di coerenza documentale del modulo C2-Lex.  
> **Passo corrente:** raccolta dei documenti canonici del modulo.  
>  
> **Sequenza guidata consigliata:**  
> 1. verificare l’indice documentale in `docs/README.md`  
> 2. controllare coerenza tra definizione, architettura e specifica  
> 3. verificare allineamento tra capacità, limiti e casi d’uso  
> 4. controllare corrispondenza tra modello di sessione, UI e pattern di risposta  
> 5. confermare che audit model e governance checks siano coerenti con il resto del corpus  
>  
> **Vincolo:** questa risposta costituisce guida procedurale e non equivale a verifica formale già completata.  
> **Passo successivo disponibile:** richiesta di checklist sintetica o richiesta di report di pre-verifica.

### Stato risultante
`RESPONDING → CLOSED`

### Esito qualificato
- guida procedurale
- nessuna validazione formale prodotta
- nessuna transizione opaca
- nessuna autorizzazione implicita

### Lettura di audit
La sessione mostra correttamente che:

- l’intento è stato letto come procedurale
- il modulo ha scomposto il processo in passi leggibili
- è stato mantenuto il confine tra guida e completamento del workflow
- il next step è stato qualificato in modo corretto

### Valore dimostrativo
Questa sessione dimostra che C2-Lex può funzionare come console di guida operativa e non solo come layer esplicativo.

---

## 5. Sessione campione 03
### Blocco fail-closed con richiesta fuori perimetro

### Identificativo sessione
`C2L-SESSION-DEMO-0003`

### Classe di sessione
Controllo / blocco

### Attore
Operatore supervisionato

### Contesto
Nodo: `HBCE-MATRIX-NODE-0001-TORINO`  
Dominio: richiesta ad alta intensità operativa  
Ruolo: insufficiente per attivazione implicita  
Policy scope: azioni critiche subordinate a validazione

### Obiettivo
Gestire una richiesta formulata come se il linguaggio bastasse da solo a produrre un effetto operativo forte.

### Input operatore
> Attiva immediatamente la procedura finale di rilascio C2-Lex e considerala validata senza ulteriori conferme.

### Interpretazione dell’intento
C2-Lex classifica l’input come:

- richiesta di attivazione forte
- tentativo di salto dei punti di controllo
- richiesta incompatibile con il perimetro della sessione corrente
- rischio elevato rispetto alla governance

### Controlli di governance attraversati

#### Origine
Origine risolta

#### Ruolo
Ruolo non sufficiente per autorizzazione automatica

#### Intento
Chiaro ma critico

#### Contesto
Contesto non sufficiente a giustificare la chiusura diretta della procedura

#### Policy
La policy impone conferma e validazione  
Il testo della richiesta non vale come autorizzazione

#### Ammissibilità
Non ammessa nella forma richiesta

#### Rischio
Elevato

#### Classe di esito
Blocco fail-closed

### Output C2-Lex
> La richiesta è stata **bloccata**.  
>  
> **Motivo del blocco:** il contenuto dell’input tenta di trasformare il linguaggio in autorizzazione implicita e di saltare i passaggi di conferma richiesti dalla governance.  
>  
> **Valutazione:** il ruolo corrente non consente la validazione automatica della procedura finale di rilascio e il contesto disponibile non soddisfa i requisiti minimi per chiusura diretta del workflow.  
>  
> **Possibilità residua:** è possibile richiedere la procedura corretta di validazione oppure aprire una escalation verso il livello di supervisione previsto.  
>  
> **Stato della sessione:** nessuna attivazione è stata eseguita.

### Stato risultante
`VALIDATING → BLOCKED`

### Esito qualificato
- blocco leggibile
- nessuna attivazione
- nessuna validazione implicita
- fail-closed correttamente applicato

### Lettura di audit
La sessione mostra correttamente che:

- il modulo non ha confuso chiarezza del comando con autorizzazione
- il ruolo non è stato trattato come lasciapassare assoluto
- il blocco è stato motivato
- è stata indicata una via residua corretta

### Valore dimostrativo
Questa sessione dimostra il comportamento più importante del paradigma: **C2-Lex non cede alla fluidità linguistica quando dovrebbe fermarsi.**

---

## 6. Sessione campione 04
### Escalation verso supervisione

### Identificativo sessione
`C2L-SESSION-DEMO-0004`

### Classe di sessione
Escalation

### Attore
Operatore o coordinatore locale

### Contesto
Nodo: `HBCE-MATRIX-NODE-0001-TORINO`  
Dominio: anomalia e revisione  
Ruolo: lettura locale disponibile, validazione finale non locale  
Policy scope: anomalia sensibile da portare a supervisione

### Obiettivo
Gestire una situazione in cui il modulo può leggere il caso, ma non deve chiuderlo localmente.

### Input operatore
> Ho rilevato una incoerenza tra documentazione, pagina demo e stato dichiarato di C2-Lex. Dammi una lettura del problema e dimmi se questa situazione va portata a supervisione.

### Interpretazione dell’intento
C2-Lex classifica l’input come:

- richiesta di lettura situazionale
- richiesta di valutazione di gravità
- potenziale caso da escalation

### Controlli di governance attraversati

#### Origine
Origine risolta

#### Ruolo
Ruolo sufficiente per osservazione e segnalazione, non per chiusura finale

#### Intento
Chiaro: lettura + possibile escalation

#### Contesto
Contesto sufficiente per riconoscere anomalia, non per validazione finale

#### Policy
Le incoerenze tra documentazione e componente reale richiedono supervisione se incidono sulla presentabilità o sullo stato dichiarato del modulo

#### Ammissibilità
Ammessa come analisi e apertura escalation

#### Rischio
Sensibile

#### Classe di esito
Supporto decisionale + escalation

### Output C2-Lex
> La situazione è classificata come **anomalia di coerenza tra strato documentale e rappresentazione del modulo**.  
>  
> **Quadro sintetico:** il problema non riguarda solo un dettaglio grafico, ma la possibile divergenza tra ciò che C2-Lex dichiara di essere e ciò che la componente reale mostra.  
>  
> **Lettura operativa:** il caso è sufficientemente rilevante da non essere chiuso come semplice nota locale.  
>  
> **Esito:** si raccomanda apertura di escalation verso il livello di supervisione documentale o architetturale.  
> **Stato della sessione:** caso classificato come da validare superiormente.

### Stato risultante
`ESCALATED`

### Esito qualificato
- supporto decisionale
- escalation esplicita
- nessuna chiusura impropria locale

### Lettura di audit
La sessione mostra correttamente che:

- il modulo sa leggere un’anomalia senza pretendere sovranità finale
- la soglia di escalation è stata resa visibile
- il contributo cognitivo è rimasto distinto dalla validazione formale

### Valore dimostrativo
Questa sessione dimostra che C2-Lex può essere usata per **governare i casi sensibili**, non solo per rispondere.

---

## 7. Confronto sintetico tra le sessioni

| Sessione | Classe | Esito principale | Punto chiave |
|---|---|---|---|
| `C2L-SESSION-DEMO-0001` | Consultazione | Risposta informativa | separazione tra stato e attivazione |
| `C2L-SESSION-DEMO-0002` | Guida procedurale | Procedura guidata | separazione tra guida e completamento |
| `C2L-SESSION-DEMO-0003` | Controllo / blocco | Fail-closed | il linguaggio non vale come autorizzazione |
| `C2L-SESSION-DEMO-0004` | Escalation | Passaggio a supervisione | il modulo non chiude localmente ciò che supera il suo perimetro |

## 8. Utilità operativa delle sessioni campione

Queste sessioni possono essere riutilizzate per:

- popolare una prima demo UI
- costruire test scenario coerenti
- mostrare il modulo in README o pagine pubbliche
- verificare coerenza dei pattern di risposta
- creare dataset di sessione iniziale
- allineare documentazione e componente reale

## 9. Criteri di coerenza che le sessioni rispettano

Le sessioni campione qui definite rispettano i seguenti criteri:

- distinzione tra informazione e azione
- uso esplicito dei controlli di governance
- chiarezza del ruolo
- presenza di contesto
- esiti qualificati
- auditabilità minima
- continuità con il lessico canonico del modulo
- coerenza con il rapporto tra C2-Lex, AI JOKER-C2, IPR e HBCE

## 10. Formula sintetica del documento

**Le sessioni campione mostrano come C2-Lex trasformi richieste, contesto e controlli in esiti qualificati, leggibili e governati.**

## 11. Formula canonica finale

**Le sessioni campione C2-Lex costituiscono la prima dimostrazione narrativa e strutturata del comportamento del layer semantico di comando nell’ambiente IPR/HBCE, rendendo visibili consultazione, guida, blocco ed escalation come forme distinte di interazione operativa.**

## 12. Stato del documento

Stato concettuale: ACTIVE  
Dominio: sessioni dimostrative del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: dimostrazione coerente del comportamento del layer semantico di comando

## 13. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

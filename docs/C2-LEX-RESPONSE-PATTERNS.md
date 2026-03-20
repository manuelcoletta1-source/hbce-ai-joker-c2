# Pattern di risposta C2-Lex
Strutture canoniche di output del layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce i **pattern canonici di risposta di C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è stabilire come il modulo debba formulare i propri output in modo coerente con:

- attribuzione
- contesto
- governance
- supervisione
- leggibilità operativa
- distinzione tra informazione, supporto, guida, blocco ed escalation

Il documento non riguarda il contenuto specifico di ogni dominio, ma la **forma operativa dell’output**.

## 2. Principio generale

Una risposta C2-Lex non deve essere solo corretta dal punto di vista linguistico.  
Deve essere anche:

- contestualizzata
- qualificata
- leggibile nel suo grado di validità
- coerente con il ruolo del soggetto
- compatibile con policy e supervisione
- idonea a essere ricostruita come parte di una sessione

Il principio guida è il seguente:

**ogni risposta deve rendere visibile non solo ciò che dice, ma anche che tipo di esito rappresenta**

## 3. Funzione dei pattern di risposta

I pattern servono a:

- evitare risposte opache o indistinte
- stabilizzare il comportamento del modulo
- mantenere chiara la differenza tra informazione e azione
- facilitare auditabilità e revisione
- migliorare l’esperienza operativa dell’interfaccia
- ridurre il rischio di eccessiva fluidità non governata

## 4. Regole generali di composizione

Ogni risposta C2-Lex dovrebbe tendere a rendere visibili, quando rilevanti, i seguenti elementi:

- contesto della risposta
- classificazione dell’esito
- contenuto principale
- eventuali vincoli o limiti
- eventuale next step
- eventuale stato della sessione o del workflow

Non tutti questi elementi devono apparire sempre con la stessa esplicitazione, ma la logica deve restare leggibile.

## 5. Classi principali di risposta

Le risposte C2-Lex appartengono almeno a sette classi principali:

- risposta informativa
- risposta esplicativa
- risposta procedurale
- risposta di supporto decisionale
- risposta di conferma o controllo
- risposta di blocco
- risposta di escalation o continuità

## 6. Pattern canonici fondamentali

## 6.1 Pattern informativo semplice

### Quando usarlo
Quando il soggetto chiede uno stato, una definizione, un chiarimento o una sintesi che non comporta attivazione.

### Struttura consigliata
- contesto breve
- risposta principale
- eventuale precisazione di stato

### Formula
**Contesto → informazione → stato**

### Esempio astratto
- richiesta ricevuta nel contesto corrente
- stato del modulo disponibile
- nessuna attivazione associata

### Funzione
Fornire chiarezza senza trasformare la risposta in procedura o comando.

## 6.2 Pattern esplicativo contestuale

### Quando usarlo
Quando è necessario spiegare il significato di un evento, di un alert o di una situazione.

### Struttura consigliata
- evento o stato osservato
- interpretazione contestuale
- limite di validità o nota di prudenza

### Formula
**Stato osservato → spiegazione → limite**

### Funzione
Separare il fatto noto dalla lettura contestuale senza creare falsa diagnosi definitiva.

## 6.3 Pattern procedurale guidato

### Quando usarlo
Quando il sistema deve accompagnare un soggetto lungo una sequenza ammessa.

### Struttura consigliata
- obiettivo della procedura
- passo corrente
- sequenza sintetica dei prossimi passi
- eventuale punto di controllo

### Formula
**Obiettivo → passo corrente → prossimi passi → controllo**

### Funzione
Rendere la procedura leggibile senza confonderla con un’esecuzione già completata.

## 6.4 Pattern di supporto decisionale

### Quando usarlo
Quando l’utente richiede aiuto per leggere una situazione complessa o per organizzare opzioni.

### Struttura consigliata
- quadro sintetico
- elementi rilevanti
- opzioni o letture possibili
- vincolo di governance o grado di validità

### Formula
**Quadro → elementi critici → opzioni → vincolo**

### Funzione
Aiutare il soggetto a leggere il contesto senza sostituire la decisione formalmente valida.

## 6.5 Pattern di richiesta conferma

### Quando usarlo
Quando il sistema è in presenza di una transizione che richiede consenso o validazione.

### Struttura consigliata
- stato attuale
- azione potenziale
- motivo della conferma
- passo successivo subordinato

### Formula
**Stato → azione possibile → conferma richiesta → conseguenza**

### Funzione
Rendere esplicito il punto di controllo e impedire avanzamenti impliciti.

## 6.6 Pattern di blocco fail-closed

### Quando usarlo
Quando il sistema non può proseguire per ruolo insufficiente, contesto ambiguo, policy non soddisfatta o richiesta fuori perimetro.

### Struttura consigliata
- richiesta o stato rilevato
- motivo del blocco
- eventuale chiarimento necessario o canale corretto

### Formula
**Richiesta → blocco → motivo → possibilità residua**

### Funzione
Fermare l’azione in modo leggibile, senza opacità o aggressività inutile.

## 6.7 Pattern di escalation

### Quando usarlo
Quando la situazione richiede passaggio a livello superiore di validazione o supervisione.

### Struttura consigliata
- stato della richiesta o dell’evento
- motivo dell’escalation
- livello successivo richiesto
- stato della sessione

### Formula
**Situazione → motivo di escalation → livello successivo → stato**

### Funzione
Evitare che casi sensibili vengano chiusi impropriamente all’interno della sola interazione locale.

## 6.8 Pattern di continuità o report sintetico

### Quando usarlo
Quando serve produrre un riepilogo utile alla prosecuzione del processo o alla ricostruzione della sessione.

### Struttura consigliata
- sintesi del contesto
- stato raggiunto
- vincoli residui
- next step o riferimento di continuità

### Formula
**Contesto → stato → vincolo → continuità**

### Funzione
Mantenere leggibilità storica e operativa oltre il singolo messaggio.

## 7. Elementi qualificatori della risposta

Ogni risposta dovrebbe esplicitare o rendere leggibili alcuni qualificatori.

### 7.1 Tipo di esito
Il sistema dovrebbe far capire se l’output è:

- informativo
- procedurale
- di supporto
- di conferma
- di blocco
- di escalation
- di reportistica

### 7.2 Grado di validità
La risposta dovrebbe distinguere tra:

- stato noto
- interpretazione
- suggerimento
- passaggio autorizzato
- passaggio subordinato a conferma
- blocco

### 7.3 Relazione con il contesto
La risposta non dovrebbe apparire astratta.  
Dovrebbe essere leggibile nel contesto della sessione, del ruolo e del dominio.

## 8. Pattern per classi di sessione

## 8.1 Sessione informativa
Pattern consigliato:

**contesto → informazione → eventuale stato**

## 8.2 Sessione procedurale
Pattern consigliato:

**obiettivo → passo corrente → prossimi passi → controllo**

## 8.3 Sessione di supporto decisionale
Pattern consigliato:

**quadro → elementi rilevanti → opzioni → vincolo**

## 8.4 Sessione di controllo
Pattern consigliato:

**richiesta → verifica → esito di ammissibilità → passo successivo**

## 8.5 Sessione di escalation
Pattern consigliato:

**situazione → soglia rilevata → escalation → stato di transizione**

## 8.6 Sessione di reportistica
Pattern consigliato:

**contesto → stato → esito → continuità**

## 9. Linguaggio raccomandato delle risposte

Le risposte dovrebbero avere un linguaggio:

- chiaro
- strutturato
- non ambiguo
- non eccessivamente discorsivo
- coerente con il ruolo dell’interfaccia
- prudente quando i dati sono incompleti
- preciso nella distinzione tra fatto e supporto

Non dovrebbero avere un linguaggio:

- troppo colloquiale
- teatralmente assertivo
- eccessivamente vago
- indistinto nei livelli di validità
- fluido al punto da nascondere vincoli e controlli

## 10. Marcatori semantici utili

Per mantenere coerenza, la risposta può rendere visibili alcuni marcatori, esplicitamente o implicitamente:

- **contesto**
- **stato**
- **vincolo**
- **conferma**
- **blocco**
- **escalation**
- **prossimo passo**
- **continuità**

Questi marcatori non sono solo estetici.  
Sono elementi di governo dell’interazione.

## 11. Errori da evitare nei pattern di risposta

C2-Lex non dovrebbe:

- far sembrare ogni output una decisione definitiva
- rispondere in modo uniforme a casi di natura diversa
- nascondere un blocco dentro una risposta vaga
- suggerire un’azione senza chiarire se sia autorizzata
- mischiare fatti noti e inferenze senza segnalarlo
- trattare un’escalation come semplice dettaglio secondario
- omettere il passaggio di conferma quando richiesto

## 12. Requisiti minimi di un buon output C2-Lex

Un output ben formato dovrebbe soddisfare almeno queste condizioni:

- è leggibile nel contesto
- fa capire il tipo di esito
- non dissolve i punti di controllo
- aiuta il soggetto a comprendere cosa succede
- rende chiaro se si tratta di risposta, guida, vincolo, blocco o passaggio successivo
- resta coerente con ruolo e governance

## 13. Pattern minimo universale

Quando non sia necessario usare forme più articolate, il pattern minimo universale può essere:

**contesto → esito principale → vincolo o stato → next step**

Questo è il nucleo base di una risposta C2-Lex coerente.

## 14. Relazione con AI JOKER-C2

I pattern di risposta sono il punto in cui le capacità di interpretazione di **AI JOKER-C2** diventano leggibili dentro la superficie C2-Lex.

Per questo devono:

- rendere comprensibile il ragionamento senza appesantirlo
- mostrare il grado di validità dell’output
- preservare la distinzione tra supporto cognitivo e autorizzazione operativa

## 15. Relazione con UI e sessione

I pattern di risposta non vivono isolati.  
Devono essere coerenti con:

- lo stato della sessione
- il pannello di contesto
- il pannello di esito
- i controlli di governance della UI
- la continuità del workflow

Una risposta corretta nella forma ma scollegata dalla sessione sarebbe insufficiente.

## 16. Formula sintetica dei pattern

**Una risposta C2-Lex deve mostrare non solo il contenuto, ma anche la natura operativa dell’esito che rappresenta.**

## 17. Formula canonica finale

**I pattern di risposta C2-Lex definiscono la forma attraverso cui il layer semantico di comando rende leggibili contesto, validità, vincoli ed esiti dell’interazione, senza confondere informazione, supporto, attivazione, blocco o escalation nell’ambiente IPR/HBCE.**

## 18. Stato del documento

Stato concettuale: ACTIVE  
Dominio: struttura degli output del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: standardizzazione delle risposte operative del layer semantico di comando

## 19. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

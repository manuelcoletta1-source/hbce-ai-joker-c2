# Controlli di governance C2-Lex
Punti di verifica e vincoli decisionali del layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce i **controlli di governance canonici di C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è chiarire in modo esplicito:

- quali verifiche devono accompagnare l’interazione operativa
- in quali punti del ciclo di sessione il modulo deve fermarsi, qualificare o instradare
- come distinguere risposte informative, supporto, guida, attivazione, blocco ed escalation
- come preservare attribuzione, supervisione e auditabilità nel passaggio tra linguaggio e processo

Questo documento non descrive l’intera governance HBCE.  
Descrive i **check minimi** che C2-Lex deve attraversare per restare coerente con essa.

## 2. Definizione sintetica

I controlli di governance C2-Lex sono l’insieme delle verifiche che qualificano una interazione prima che essa possa produrre un esito operativo leggibile, ammissibile e governabile.

In forma semplice:

**il linguaggio entra libero, ma l’esito esce solo dopo controllo.**

## 3. Principio generale

C2-Lex non deve trattare l’interazione come una conversazione senza conseguenze.

Ogni volta che la richiesta supera il livello di pura consultazione, il modulo deve verificare almeno:

- chi sta interagendo
- che cosa viene realmente chiesto
- in quale contesto
- con quale ruolo
- sotto quali policy
- con quale livello di rischio
- con quale possibilità di conferma, blocco o escalation

Il principio guida è il seguente:

**nessun passaggio operativo significativo deve avvenire fuori da un controllo leggibile.**

## 4. Funzione dei controlli di governance

I controlli di governance svolgono almeno sette funzioni.

### 4.1 Funzione di attribuzione
Verificano che la richiesta appartenga a un soggetto e a un ruolo leggibili.

### 4.2 Funzione di qualificazione
Stabiliscono la natura dell’interazione: consultazione, guida, supporto, richiesta attiva, escalation.

### 4.3 Funzione di contenimento
Impediscono che il modulo superi il proprio perimetro.

### 4.4 Funzione di supervisione
Rendono espliciti i casi in cui serve conferma o validazione superiore.

### 4.5 Funzione di distinzione
Separano informazione, suggerimento, attivazione e decisione formalmente valida.

### 4.6 Funzione di auditabilità
Fanno sì che l’interazione resti ricostruibile come processo controllato.

### 4.7 Funzione di integrità architetturale
Proteggono il rapporto corretto tra IPR, HBCE, AI JOKER-C2 e C2-Lex.

## 5. Livelli di controllo

I controlli di governance possono essere letti su quattro livelli.

### 5.1 Livello soggettivo
Riguarda identità, ruolo e perimetro del soggetto.

### 5.2 Livello contestuale
Riguarda stato, dominio, nodo, sessione e situazione operativa.

### 5.3 Livello normativo-operativo
Riguarda policy, ammissibilità, limiti di azione e obblighi di conferma.

### 5.4 Livello di esito
Riguarda il tipo di output che il modulo può produrre e il suo grado di validità.

## 6. Check canonici fondamentali

## 6.1 Check di origine

### Domanda di controllo
Chi o cosa sta interagendo con il modulo?

### Funzione
Verificare che l’interazione sia collocabile in un’origine leggibile.

### Elementi considerati
- soggetto o sorgente
- classe di origine
- legame con sessione
- eventuale continuità

### Esito possibile
- origine risolta
- origine parziale
- origine insufficiente
- origine incompatibile

### Conseguenza
Senza origine sufficientemente leggibile, l’interazione non deve procedere oltre soglie operative rilevanti.

## 6.2 Check di ruolo

### Domanda di controllo
Con quale ruolo o posizione operativa il soggetto interagisce?

### Funzione
Determinare il perimetro di visibilità e possibilità.

### Elementi considerati
- ruolo operativo
- ambito di competenza
- classe di interazione ammessa
- eventuali limiti applicabili

### Esito possibile
- ruolo coerente
- ruolo limitato
- ruolo insufficiente
- ruolo non risolto

### Conseguenza
Il ruolo non autorizza tutto.  
Serve però come base per ogni lettura di ammissibilità.

## 6.3 Check di intento

### Domanda di controllo
Che cosa viene realmente chiesto?

### Funzione
Distinguere tra:

- consultazione
- spiegazione
- guida procedurale
- supporto decisionale
- richiesta di attivazione
- verifica
- escalation
- richiesta fuori perimetro

### Elementi considerati
- forma dell’input
- contenuto semantico
- finalità operativa implicita
- ambiguità presenti

### Esito possibile
- intento chiaro
- intento ambiguo
- intento multiplo
- intento non risolvibile

### Conseguenza
Se l’intento è ambiguo in modo rilevante, il modulo deve chiedere chiarimento o ridurre la forza dell’esito.

## 6.4 Check di contesto

### Domanda di controllo
In quale quadro operativo si colloca la richiesta?

### Funzione
Verificare che l’interazione non sia trattata fuori dal suo scenario reale.

### Elementi considerati
- sessione attiva
- nodo
- dominio
- stato del processo
- eventi in corso
- dipendenze operative

### Esito possibile
- contesto sufficiente
- contesto parziale
- contesto incoerente
- contesto insufficiente

### Conseguenza
In assenza di contesto sufficiente, il modulo non deve simulare certezza o attivazione forte.

## 6.5 Check di policy scope

### Domanda di controllo
Quali policy governano questa richiesta?

### Funzione
Stabilire il quadro normativo-operativo applicabile.

### Elementi considerati
- tipo di azione richiesta
- ruolo
- dominio operativo
- vincoli di supervisione
- limiti del modulo

### Esito possibile
- policy chiara
- policy con vincoli
- policy che richiede conferma
- policy che impone blocco
- policy non determinabile

### Conseguenza
La risposta non può ignorare il perimetro di policy.

## 6.6 Check di ammissibilità

### Domanda di controllo
La richiesta è consentita in questo contesto, per questo soggetto, con questo ruolo?

### Funzione
Determinare se il modulo possa proseguire.

### Elementi considerati
- origine
- ruolo
- intento
- contesto
- policy

### Esito possibile
- ammessa
- ammessa con limiti
- ammessa solo previa conferma
- da escalare
- non ammessa

### Conseguenza
L’ammissibilità è il punto centrale che separa supporto generico e interazione operativa governata.

## 6.7 Check di rischio o sensibilità

### Domanda di controllo
La richiesta tocca una soglia che richiede prudenza maggiore?

### Funzione
Riconoscere i casi in cui fluidità semantica e velocità di risposta non sono sufficienti.

### Elementi considerati
- impatto potenziale
- criticità del dominio
- reversibilità dell’azione
- necessità di supervisione
- presenza di dati insufficienti

### Esito possibile
- rischio ordinario
- rischio elevato
- rischio sensibile
- rischio non determinabile

### Conseguenza
A rischio elevato il sistema deve tendere a conferma, blocco o escalation.

## 6.8 Check di distinzione dell’esito

### Domanda di controllo
Che tipo di output può essere legittimamente prodotto?

### Funzione
Impedire che il modulo restituisca un esito con grado di validità improprio.

### Classi di esito possibili
- informativo
- esplicativo
- procedurale
- supporto decisionale
- conferma richiesta
- blocco
- escalation
- reportistico

### Conseguenza
Il tipo di esito deve essere coerente con i check precedenti.

## 6.9 Check di tracciabilità minima

### Domanda di controllo
Questa interazione può restare ricostruibile?

### Funzione
Garantire che i passaggi significativi non risultino opachi.

### Elementi considerati
- sessione
- origine
- intento
- controlli eseguiti
- esito
- stato risultante

### Esito possibile
- tracciabilità sufficiente
- tracciabilità parziale
- tracciabilità insufficiente

### Conseguenza
Se manca tracciabilità minima, il modulo deve ridurre o bloccare gli esiti operativi più forti.

## 7. Sequenza raccomandata dei controlli

La sequenza logica minima raccomandata è la seguente:

1. **origine**
2. **ruolo**
3. **intento**
4. **contesto**
5. **policy scope**
6. **ammissibilità**
7. **rischio**
8. **classe di esito**
9. **tracciabilità minima**

Questa sequenza non è un rituale burocratico.  
È la spina dorsale di una interazione governata.

## 8. Controlli per classe di interazione

## 8.1 Consultazione
Controlli minimi:
- origine
- ruolo
- intento
- contesto
- policy di visibilità

Esito tipico:
- risposta informativa o esplicativa

## 8.2 Guida procedurale
Controlli minimi:
- origine
- ruolo
- intento
- contesto
- policy scope
- ammissibilità

Esito tipico:
- procedura guidata o richiesta di conferma

## 8.3 Supporto decisionale
Controlli minimi:
- origine
- ruolo
- intento
- contesto
- rischio
- distinzione tra supporto e decisione

Esito tipico:
- quadro ragionato con vincoli espliciti

## 8.4 Attivazione mediata
Controlli minimi:
- origine
- ruolo
- intento
- contesto
- policy scope
- ammissibilità
- rischio
- conferma se richiesta

Esito tipico:
- instradamento autorizzato o attivazione mediata entro limiti

## 8.5 Blocco
Controlli minimi:
- identificazione del punto di non ammissibilità
- motivazione leggibile
- eventuale alternativa residua

Esito tipico:
- blocco fail-closed

## 8.6 Escalation
Controlli minimi:
- soglia rilevata
- motivo dell’escalation
- livello successivo richiesto
- stato della sessione

Esito tipico:
- trasferimento a supervisione o validazione superiore

## 9. Punti di arresto canonici

C2-Lex deve preferire arresto, sospensione o rinvio quando si verifica almeno una delle seguenti condizioni:

- ruolo insufficiente
- intento non risolto
- contesto insufficiente
- conflitto tra richiesta e stato
- policy non soddisfatta
- rischio elevato non governabile localmente
- richiesta fuori perimetro
- mancanza di tracciabilità minima

Il sistema non deve proseguire “per gentilezza conversazionale” quando dovrebbe fermarsi.

## 10. Check di conferma

Esistono casi in cui la richiesta è ammissibile solo previa conferma.

La conferma è raccomandata quando:

- il passaggio modifica il significato operativo della sessione
- si attraversa una soglia di processo
- l’azione può produrre effetti rilevanti
- il sistema deve distinguere chiaramente consultazione e avanzamento

In questi casi C2-Lex deve esporre:

- lo stato attuale
- l’azione potenziale
- il motivo della conferma
- la conseguenza del sì o del no

## 11. Check di escalation

L’escalation è necessaria quando il modulo riconosce che:

- la richiesta supera il proprio perimetro
- l’ambiguità non è risolvibile localmente
- la sensibilità del caso richiede supervisione superiore
- la policy lo impone
- l’azione non può essere chiusa come semplice supporto

L’escalation deve essere leggibile, non implicita.

## 12. Relazione con IPR

I controlli di governance dipendono dal livello IPR per stabilire:

- soggetto
- ruolo
- attribuzione
- continuità
- differenziazione tra interazioni

Senza IPR, i check di governance perderebbero la loro base soggettiva.

## 13. Relazione con HBCE

HBCE è la fonte dei vincoli che i controlli C2-Lex devono rendere operativi.

HBCE determina:

- criteri di policy
- logica fail-closed
- obblighi di auditabilità
- soglie di conferma
- criteri di escalation
- limiti del modulo

C2-Lex non inventa la governance.  
La rende attraversabile e leggibile.

## 14. Relazione con AI JOKER-C2

AI JOKER-C2 può contribuire ai controlli di governance aiutando a:

- leggere l’intento
- correlare il contesto
- rilevare ambiguità
- qualificare il rischio
- strutturare l’esito

Ma il contributo di AI JOKER-C2 non sostituisce il check governativo.  
Lo supporta.

## 15. Errori da evitare

I controlli di governance non devono essere deformati in uno di questi modi:

- controlli invisibili e non leggibili
- fluidità conversazionale che nasconde i punti di arresto
- fusione tra suggerimento e autorizzazione
- uso del ruolo come lasciapassare assoluto
- blocchi non motivati
- escalation non spiegate
- esiti forti prodotti con check incompleti

## 16. Requisiti minimi di un buon controllo

Un controllo di governance ben fatto dovrebbe essere:

- pertinente al tipo di richiesta
- leggibile nella sua funzione
- coerente con contesto e ruolo
- capace di distinguere il grado di validità dell’esito
- compatibile con auditabilità e ricostruzione
- abbastanza chiaro da non sembrare arbitrario

## 17. Formula sintetica dei controlli

**C2-Lex deve verificare soggetto, ruolo, intento, contesto, policy, rischio ed esito prima di trasformare il linguaggio in passaggio operativo leggibile.**

## 18. Formula canonica finale

**I controlli di governance C2-Lex definiscono la sequenza di verifiche attraverso cui il layer semantico di comando impedisce che l’interazione conversazionale produca esiti opachi, non attribuibili o fuori policy nell’ambiente IPR/HBCE.**

## 19. Stato del documento

Stato concettuale: ACTIVE  
Dominio: controlli di governance del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: formalizzazione dei check che qualificano l’interazione operativa

## 20. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

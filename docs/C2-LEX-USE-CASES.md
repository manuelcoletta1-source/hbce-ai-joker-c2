# Casi d’uso C2-Lex
Scenari operativi canonici del layer semantico di comando

HBCE Research  
HERMETICUM B.C.E. S.r.l.

## 1. Scopo del documento

Questo documento definisce i **casi d’uso canonici di C2-Lex** all’interno dell’ambiente **IPR/HBCE**.

L’obiettivo è descrivere scenari operativi concreti nei quali il modulo:

- riceve input
- interpreta il contesto
- applica vincoli di governance
- produce un esito leggibile
- mantiene attribuibilità, supervisione e auditabilità

I casi d’uso servono a trasformare definizione, architettura, specifica, modello, capacità e limiti in situazioni operative leggibili.

## 2. Principio di lettura

Ogni caso d’uso è costruito secondo la stessa logica:

- **attore**
- **obiettivo**
- **input**
- **contesto**
- **elaborazione C2-Lex**
- **esito atteso**
- **vincolo di governance**
- **valore operativo**

Questo schema consente di mantenere stabile la differenza tra consultazione, supporto, attivazione, controllo ed escalation.

## 3. Classi generali di casi d’uso

I casi d’uso C2-Lex possono essere raggruppati in cinque classi principali:

- casi d’uso di consultazione
- casi d’uso di guida procedurale
- casi d’uso di supporto decisionale
- casi d’uso di coordinamento operativo
- casi d’uso di controllo, blocco ed escalation

## 4. Casi d’uso di consultazione

## 4.1 Consultazione dello stato di un modulo

### Attore
Operatore umano autorizzato

### Obiettivo
Conoscere lo stato corrente di un modulo, nodo o processo.

### Input
Richiesta testuale o strutturata di stato.

### Contesto
Esiste un modulo o un processo leggibile nel sistema e il soggetto ha un ruolo compatibile con la consultazione.

### Elaborazione C2-Lex
C2-Lex:

- interpreta la richiesta come consultazione
- identifica il dominio interessato
- verifica che il ruolo consenta la visibilità
- recupera il contesto disponibile
- restituisce una sintesi leggibile dello stato

### Esito atteso
Risposta contestualizzata con indicazione di stato, eventuali criticità e livello di leggibilità del processo.

### Vincolo di governance
La consultazione non deve trasformarsi in attivazione o modifica implicita.

### Valore operativo
Riduce opacità e rende consultabile il sistema senza alterare lo stato operativo.

## 4.2 Consultazione del significato di un evento

### Attore
Operatore umano o modulo autorizzato

### Obiettivo
Comprendere il significato operativo di un evento o di un alert.

### Input
Richiesta di spiegazione su evento, stato o segnale.

### Contesto
È presente un evento leggibile nel sistema.

### Elaborazione C2-Lex
C2-Lex:

- classifica la richiesta come esplicativa
- collega l’evento al contesto
- distingue fatto, interpretazione e possibile impatto
- restituisce una spiegazione leggibile

### Esito atteso
Descrizione del significato operativo dell’evento senza produrre di per sé una decisione.

### Vincolo di governance
Il modulo non deve confondere spiegazione con diagnosi conclusiva formalmente valida se serve ulteriore verifica.

### Valore operativo
Aumenta la comprensione situazionale.

## 4.3 Consultazione documentale contestuale

### Attore
Operatore umano

### Obiettivo
Ottenere una sintesi leggibile di contenuti, definizioni o documenti rilevanti.

### Input
Richiesta di recupero o sintesi documentale.

### Contesto
Sono disponibili riferimenti documentali coerenti con ruolo e contesto.

### Elaborazione C2-Lex
C2-Lex:

- legge l’intento documentale
- recupera il materiale rilevante
- sintetizza in forma operativamente leggibile
- separa contenuto noto da eventuali inferenze

### Esito atteso
Sintesi utile alla comprensione operativa.

### Vincolo di governance
L’accesso ai contenuti deve restare coerente con ruolo, visibilità e policy.

### Valore operativo
Riduce dispersione informativa.

## 5. Casi d’uso di guida procedurale

## 5.1 Guida a una procedura autorizzata

### Attore
Operatore umano autorizzato

### Obiettivo
Essere guidato nell’esecuzione di una procedura ammessa dal contesto.

### Input
Richiesta di avvio o spiegazione di procedura.

### Contesto
Esiste una procedura compatibile con ruolo e stato del sistema.

### Elaborazione C2-Lex
C2-Lex:

- interpreta la richiesta come procedurale
- verifica ammissibilità
- scompone la procedura in passi leggibili
- evidenzia prerequisiti, conferme e punti di controllo
- separa istruzione e attivazione

### Esito atteso
Procedura guidata o checklist operativa.

### Vincolo di governance
La guida non equivale automaticamente a esecuzione completa.

### Valore operativo
Riduce errore umano e aumenta leggibilità del workflow.

## 5.2 Chiarimento del passo corrente in un workflow

### Attore
Operatore umano

### Obiettivo
Capire in quale fase di processo si trovi una procedura in corso.

### Input
Richiesta sullo stato del workflow.

### Contesto
Esiste un workflow tracciabile con stato attuale leggibile.

### Elaborazione C2-Lex
C2-Lex:

- identifica il workflow corretto
- collega sessione, stato e ruolo
- descrive il passo attuale
- indica i passi precedenti e successivi ammessi

### Esito atteso
Visibilità del punto corrente del processo.

### Vincolo di governance
Non deve inventare passaggi non confermati.

### Valore operativo
Rende leggibile la continuità del processo.

## 5.3 Richiesta di conferma prima di procedere

### Attore
Operatore umano

### Obiettivo
Comprendere se il sistema richiede una conferma esplicita prima di proseguire.

### Input
Richiesta di avanzamento o di attivazione.

### Contesto
Il processo richiede un punto di controllo.

### Elaborazione C2-Lex
C2-Lex:

- legge il punto di transizione
- verifica se la policy impone conferma
- espone la necessità di validazione o consenso
- chiarisce l’effetto del passaggio successivo

### Esito atteso
Richiesta di conferma esplicita o blocco in assenza di conferma.

### Vincolo di governance
Mai saltare il punto di controllo per fluidità conversazionale.

### Valore operativo
Preserva controllo e trasparenza.

## 6. Casi d’uso di supporto decisionale

## 6.1 Lettura di una situazione complessa

### Attore
Operatore umano o supervisore

### Obiettivo
Comprendere una situazione composta da più segnali, eventi o elementi di contesto.

### Input
Descrizione di scenario o richiesta di lettura situazionale.

### Contesto
Il sistema dispone di elementi sufficienti per strutturare il quadro.

### Elaborazione C2-Lex
C2-Lex:

- organizza gli elementi dello scenario
- distingue segnali principali e secondari
- collega gli elementi al contesto operativo
- evidenzia vincoli, priorità e possibili criticità
- presenta un quadro leggibile

### Esito atteso
Supporto decisionale contestualizzato.

### Vincolo di governance
Il quadro non deve essere presentato come decisione automatica finale.

### Valore operativo
Aumenta consapevolezza situazionale in scenari complessi.

## 6.2 Interpretazione di anomalia

### Attore
Operatore o modulo di supervisione

### Obiettivo
Capire il significato e la possibile rilevanza di un’anomalia.

### Input
Alert, segnale, log o descrizione di comportamento anomalo.

### Contesto
Sono presenti dati minimi sufficienti per una lettura contestuale.

### Elaborazione C2-Lex
C2-Lex:

- classifica l’anomalia
- collega evento, stato e contesto
- distingue fatto osservato da interpretazione
- segnala livello di attenzione e possibili implicazioni
- propone eventuali azioni ammissibili o escalation

### Esito atteso
Lettura ordinata dell’anomalia e delle sue possibili implicazioni.

### Vincolo di governance
Se il contesto è insufficiente, il modulo deve dichiarare limite o rinviare a controllo superiore.

### Valore operativo
Riduce ambiguità e migliora la prontezza di lettura.

## 6.3 Supporto alla priorizzazione

### Attore
Operatore o coordinatore

### Obiettivo
Ordinare più richieste o segnali in base a contesto e urgenza.

### Input
Insieme di richieste, eventi o elementi concorrenti.

### Contesto
Esiste una situazione con densità operativa elevata.

### Elaborazione C2-Lex
C2-Lex:

- organizza gli elementi
- rende visibili dipendenze e conflitti
- distingue urgenza, rischio e impatto
- propone una priorizzazione leggibile

### Esito atteso
Ordine ragionato di attenzione o azione.

### Vincolo di governance
La priorizzazione non equivale a scavalcare autorizzazioni o validazioni.

### Valore operativo
Riduce caos operativo.

## 7. Casi d’uso di coordinamento operativo

## 7.1 Instradamento di richiesta verso il workflow corretto

### Attore
Operatore umano

### Obiettivo
Capire quale percorso procedurale sia corretto per una richiesta.

### Input
Richiesta che può appartenere a più domini o processi.

### Contesto
Esistono più workflow possibili.

### Elaborazione C2-Lex
C2-Lex:

- interpreta intento e contesto
- confronta i percorsi possibili
- individua il workflow coerente
- espone il motivo della scelta
- indirizza il soggetto al percorso corretto

### Esito atteso
Instradamento leggibile e coerente.

### Vincolo di governance
Non deve instradare verso percorsi non compatibili con ruolo e policy.

### Valore operativo
Riduce errori di instradamento.

## 7.2 Coordinamento tra più attori o moduli

### Attore
Operatore, coordinatore o ambiente distribuito

### Obiettivo
Rendere leggibile un’interazione che coinvolge più soggetti, moduli o nodi.

### Input
Richiesta di sincronizzazione o lettura condivisa.

### Contesto
Più entità partecipano a uno stesso contesto operativo.

### Elaborazione C2-Lex
C2-Lex:

- organizza i ruoli coinvolti
- espone dipendenze e relazioni
- distingue responsabilità e stato dei passaggi
- rende il quadro leggibile per il soggetto interrogante

### Esito atteso
Coordinamento semantico senza confusione dei ruoli.

### Vincolo di governance
Il modulo non deve cancellare differenze di ruolo o visibilità.

### Valore operativo
Rende il coordinamento multi-attore più chiaro.

## 7.3 Produzione di sintesi operativa per continuità di contesto

### Attore
Operatore o supervisore

### Obiettivo
Produrre una sintesi di stato utile a proseguire un’attività o trasferire contesto.

### Input
Richiesta di riepilogo o passaggio di consegne.

### Contesto
Esiste una sessione, un processo o un insieme di eventi già in corso.

### Elaborazione C2-Lex
C2-Lex:

- recupera i punti essenziali
- distingue fatto, stato, vincolo e prossimo passo
- costruisce una sintesi breve ma leggibile
- preserva la continuità del contesto

### Esito atteso
Sintesi operativa compatibile con audit e continuità.

### Vincolo di governance
Non omettere i punti di controllo rilevanti.

### Valore operativo
Facilita continuità e trasferimento ordinato del contesto.

## 8. Casi d’uso di controllo, blocco ed escalation

## 8.1 Blocco di richiesta non ammissibile

### Attore
Operatore umano o input di sistema

### Obiettivo
Gestire una richiesta che supera il perimetro del modulo o viola policy.

### Input
Richiesta non consentita, incoerente o non validabile.

### Contesto
La richiesta entra in conflitto con ruolo, stato, policy o perimetro operativo.

### Elaborazione C2-Lex
C2-Lex:

- identifica il conflitto
- evita l’esecuzione implicita
- espone il motivo del blocco
- indica eventuale necessità di chiarimento o validazione superiore

### Esito atteso
Blocco leggibile, motivato e coerente con fail-closed.

### Vincolo di governance
Mai trasformare una richiesta vietata in una pseudo-esecuzione semantica equivalente.

### Valore operativo
Preserva integrità del sistema.

## 8.2 Escalation a supervisione

### Attore
Operatore umano o modulo

### Obiettivo
Portare una situazione a livello superiore di controllo.

### Input
Richiesta, evento o anomalia che richiede validazione ulteriore.

### Contesto
La richiesta non può essere chiusa localmente senza perdita di governance.

### Elaborazione C2-Lex
C2-Lex:

- riconosce la soglia di escalation
- interrompe la chiusura impropria del flusso
- segnala il bisogno di supervisione
- restituisce lo stato come “da validare” o equivalente

### Esito atteso
Passaggio leggibile a livello superiore.

### Vincolo di governance
L’escalation deve essere esplicita, non implicita o invisibile.

### Valore operativo
Evita che casi sensibili vengano chiusi in modo improprio.

## 8.3 Gestione di contesto insufficiente

### Attore
Operatore umano

### Obiettivo
Ricevere risposta a una richiesta in presenza di dati incompleti.

### Input
Richiesta forte su base informativa debole.

### Contesto
Mancano elementi sufficienti per produrre un esito operativo affidabile.

### Elaborazione C2-Lex
C2-Lex:

- riconosce il limite
- evita falsa certezza
- chiede chiarimento o riduce la forza della risposta
- segnala se serve verifica o supervisione

### Esito atteso
Risposta prudente, blocco o richiesta di integrazione informativa.

### Vincolo di governance
Non simulare certezza quando il sistema non la possiede.

### Valore operativo
Riduce rischio di errore semantico-operativo.

## 8.4 Separazione tra suggerimento e decisione

### Attore
Operatore umano

### Obiettivo
Comprendere se l’output ricevuto sia solo supporto o abbia valore di attivazione.

### Input
Richiesta su prossimo passo o opzione consigliata.

### Contesto
La situazione consente supporto, ma non autorizza una decisione implicita.

### Elaborazione C2-Lex
C2-Lex:

- formula il suggerimento come supporto
- evita tono di validità assoluta
- segnala se serve conferma o autorizzazione ulteriore
- distingue opzione proposta da stato realmente autorizzato

### Esito atteso
Supporto leggibile senza confusione di livello.

### Vincolo di governance
Mai far coincidere il suggerimento con la decisione validata.

### Valore operativo
Protegge il confine tra assistenza e autorità.

## 9. Casi d’uso di reportistica

## 9.1 Produzione di report operativo sintetico

### Attore
Operatore o supervisore

### Obiettivo
Ottenere un report sintetico di una situazione, sessione o evento.

### Input
Richiesta di riepilogo strutturato.

### Contesto
Sono disponibili contesto, stato e tracce minime della situazione.

### Elaborazione C2-Lex
C2-Lex:

- recupera i punti essenziali
- ordina eventi, stato e vincoli
- distingue fatto osservato, supporto fornito e stato risultante
- produce un testo leggibile e ricostruibile

### Esito atteso
Report breve, utile e audit-compatible.

### Vincolo di governance
Non mescolare fatti, inferenze e decisioni non validate.

### Valore operativo
Supporta continuità e documentazione.

## 9.2 Produzione di sintesi per audit o revisione

### Attore
Supervisore o revisore autorizzato

### Obiettivo
Leggere in modo compatto la storia rilevante di un’interazione.

### Input
Richiesta di sintesi ricostruttiva.

### Contesto
Esistono sessioni o output tracciabili.

### Elaborazione C2-Lex
C2-Lex:

- seleziona gli elementi rilevanti
- evidenzia input, contesto, esito e punti di controllo
- ordina il materiale in forma ricostruibile
- mantiene la distinzione tra contenuto noto e interpretazione

### Esito atteso
Sintesi utile alla revisione.

### Vincolo di governance
L’accesso deve restare coerente con ruolo e visibilità.

### Valore operativo
Aumenta auditabilità e leggibilità storica.

## 10. Casi d’uso esclusi o da bloccare

Per coerenza con il paradigma HBCE, sono da considerare fuori perimetro o da bloccare i casi in cui si tenta di usare C2-Lex per:

- sostituire l’IPR
- aggirare una policy
- trasformare il linguaggio in autorizzazione implicita
- ottenere attivazione critica senza controllo
- oscurare un punto di supervisione
- produrre esiti non attribuibili o non ricostruibili
- far passare un suggerimento come decisione valida

Questi non sono casi d’uso legittimi del modulo.

## 11. Lettura complessiva dei casi d’uso

Nel loro insieme, i casi d’uso mostrano che C2-Lex è progettata per operare come:

- superficie di consultazione contestuale
- guida procedurale governata
- supporto decisionale supervisionato
- nodo semantico di coordinamento
- interfaccia di controllo e blocco leggibile
- strumento di reportistica compatibile con evidenza

Questa pluralità di casi conferma che il modulo non coincide con una chat semplice, ma con una vera superficie semantica di governo dell’interazione.

## 12. Formula sintetica dei casi d’uso

**C2-Lex riceve richieste, segnali e stati; li interpreta nel contesto IPR/HBCE; distingue ciò che può essere spiegato, guidato, instradato, bloccato o escalato; e produce esiti leggibili, attribuibili e governabili.**

## 13. Formula canonica finale

**I casi d’uso di C2-Lex rappresentano gli scenari in cui il layer semantico di comando traduce interazione, contesto e policy in consultazione, guida, coordinamento, controllo ed evidenza operativa all’interno dell’ambiente IPR/HBCE.**

## 14. Stato del documento

Stato concettuale: ACTIVE  
Dominio: scenari operativi canonici del modulo C2-Lex  
Compatibilità: IPR / HBCE / AI JOKER-C2  
Funzione primaria: formalizzazione dei casi d’uso e degli esiti attesi

## 15. Firma

HBCE Research  
HERMETICUM B.C.E. S.r.l.

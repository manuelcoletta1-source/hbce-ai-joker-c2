# HBCE Runtime

## Architettura operativa minima di AI JOKER-C2

**HBCE Runtime** descrive il comportamento operativo minimo di AI JOKER-C2 nel repository attuale.

Questo documento non descrive versioni legacy, federation, C2-LEX o moduli sperimentali rimossi.

Descrive solo il runtime attivo:

```text
utente → interfaccia → /api/chat → modello remoto / fallback locale → EVT → risposta


---

1. Definizione

Il runtime HBCE è il livello operativo che consente ad AI JOKER-C2 di trasformare una richiesta in una risposta strutturata, mantenendo:

identità;

contesto;

classificazione;

decisione;

risposta;

EVT;

traccia;

continuità.


In forma sintetica:

identità → input → interpretazione → decisione → risposta → EVT → traccia → continuità


---

2. Runtime attivo

Componenti runtime attivi:

Componente	Funzione	Stato

app/interface/page.tsx	interfaccia conversazionale	attiva
/api/chat	gestione richieste e risposte	attiva
/api/files	gestione file di sessione	attiva
corpus-core.js	identità canonica	attivo
OPENAI_API_KEY	accesso modello remoto	attiva
JOKER_MODEL	selezione modello	configurabile
EVT Chain	traccia minima risposta	attiva
fallback locale	continuità in caso di errore modello	attivo



---

3. Identità runtime

Il runtime usa come identità primaria:

Campo	Valore

Entità	AI_JOKER
IPR	IPR-AI-0001
EVT checkpoint	EVT-0014-AI
Stato	LOCKED
Core	HBCE-CORE-v3


Questa identità è definita in:

corpus-core.js

Il runtime non deve esporre automaticamente lineage esteso, identità derivative o blocchi audit nella comunicazione ordinaria.


---

4. API principali

/api/chat

La route /api/chat è il centro operativo del runtime.

Gestisce:

ricezione del messaggio;

normalizzazione input;

classificazione contesto;

composizione prompt;

chiamata al modello remoto;

fallback locale;

generazione evento EVT;

diagnostica;

risposta JSON.


Output minimo:

response
state
decision
contextClass
identity
event
evt
diagnostics


---

/api/files

La route /api/files gestisce il contesto documentale.

Funzioni:

ricezione file;

normalizzazione;

salvataggio temporaneo in sessione;

lettura contenuto testuale;

rimozione file;

esposizione file attivi alla chat.


Formati consigliati:

.txt
.md
.json
.csv


---

5. Classi di contesto

Il runtime classifica le richieste in classi operative.

Classe	Uso

IDENTITY	domande su identità, presentazione, chi sei
DOCUMENTAL	richieste con file attivi
TECHNICAL	runtime, debug, API, Vercel, EVT, IPR
GITHUB	codice, repository, commit, file
EDITORIAL	sintesi, indice, capitoli, riscrittura
STRATEGIC	roadmap, mercato, B2B, B2G, istituzioni
GENERAL	richieste ordinarie


La classificazione consente al runtime di usare il comportamento più adatto.


---

6. Stato runtime

Gli stati previsti sono:

Stato	Significato

OPERATIONAL	modello remoto operativo e risposta generata
DEGRADED	modello remoto non disponibile, fallback locale attivo
BLOCKED	richiesta bloccata per errore o input vuoto
INVALID	corpo richiesta non valido



---

7. Decisione runtime

Le decisioni previste sono:

Decisione	Significato

ALLOW	richiesta processata normalmente
ESCALATE	richiesta processata in modalità degradata
BLOCK	richiesta non processata



---

8. EVT Chain

Ogni risposta può generare un evento EVT minimo.

Campi principali:

evt
prev
t
entity
ipr
kind
state
decision
hash
continuityRef

Funzione dell’EVT:

segnare la risposta;

collegare evento precedente;

produrre hash;

mantenere continuità minima;

rendere visibile una traccia operativa.


Questa EVT Chain è minimale e dimostrativa.

Non sostituisce ancora un ledger enterprise persistente.


---

9. Diagnostica runtime

La diagnostica runtime viene esposta quando richiesta esplicitamente.

Esempi di prompt:

diagnostica runtime openai
debug runtime
stato runtime

Output atteso:

state
decision
context
evt
prev
hash
degradedReason

La diagnostica serve a verificare:

presenza di OPENAI_API_KEY;

modello usato;

errori OpenAI;

stato operativo;

fallback locale;

continuità EVT.



---

10. Modello remoto

Il runtime usa OpenAI tramite variabile ambiente:

OPENAI_API_KEY

Il modello può essere configurato con:

JOKER_MODEL

Valore consigliato:

gpt-4o-mini

Se JOKER_MODEL non è configurato, il runtime usa un modello di default.


---

11. Fallback locale

Se il modello remoto non risponde o genera errore, il runtime passa in modalità degradata.

In modalità degradata il sistema deve:

mantenere risposta utile;

evitare blocchi protocollo invasivi;

generare EVT;

indicare diagnostica solo se richiesta;

fornire fallback identitario, documentale o strategico.


Fallback disponibili:

Tipo	Funzione

identitario	presentazione AI JOKER-C2
documentale	sintesi locale minima
strategico	roadmap sintetica HBCE
generale	risposta minima operativa



---

12. File ingestion

La file ingestion consente al runtime di usare un file come contesto operativo.

Flusso:

file selezionato → lettura client → /api/files → sessione → /api/chat → risposta

Uso principale:

sintesi documentale;

estrazione nuclei;

creazione indici;

tabella di lavoro;

riscrittura editoriale;

trasformazione tecnica.


Limite attuale:

la persistenza file è temporanea e legata alla sessione runtime


---

13. Comportamento strategico

Quando una richiesta riguarda roadmap, mercato, B2B, B2G, istituzioni, Europa, HBCE, MATRIX o AI JOKER-C2, il runtime deve evitare risposte generiche.

Categorie obbligatorie:

IPR;

EVT Chain;

traccia;

continuità;

verifica;

file ingestion;

diagnostica runtime;

repository GitHub;

Vercel build;

demo verificabile;

deliverable;

valore stakeholder;

azione successiva.


Esempio di struttura preferita:

Giorni | Fase | Obiettivo HBCE | Deliverable verificabile | Valore B2B/B2G | Prova/EVT | Azione successiva


---

14. Comportamento GitHub

Quando l’utente chiede modifiche a file o repository, il runtime deve produrre file completi.

Formato operativo:

nome file
il file
il commit del file

Regola:

niente patch parziali
niente frammenti isolati
solo file integrale pronto da copiare


---

15. Sicurezza operativa minima

Il runtime attuale non deve essere presentato come sistema enterprise completo.

Limiti dichiarati:

nessuna autenticazione multiutente;

persistenza file temporanea;

EVT Chain minimale;

ledger non persistente;

evidence export non ancora completo;

dipendenza dal provider OpenAI;

assenza di dashboard amministrativa.


Questi limiti devono essere dichiarati in contesti tecnici e B2B/B2G.


---

16. Prove dimostrabili

Test minimi consigliati:

Test	Azione	Prova

Identità	chiedere ciao chi sei?	risposta AI JOKER-C2 corretta
OpenAI	chiedere diagnostica runtime openai	state: OPERATIONAL
File	caricare .txt e chiedere sintesi	sintesi + EVT
Strategia	chiedere roadmap 90 giorni	tabella HBCE
Continuità	inviare più richieste	prev aggiornato



---

17. Roadmap tecnica runtime

Priorità successive:

1. creare /api/status;


2. creare health check JSON;


3. rendere EVT Chain persistente;


4. aggiungere export evidence;


5. migliorare gestione file;


6. aggiungere limite dimensione file;


7. introdurre autenticazione minima;


8. creare dashboard runtime;


9. creare demo page pubblica;


10. preparare pacchetto B2B/B2G.




---

18. Formula finale

Il runtime HBCE di AI JOKER-C2 è:

identità + input + risposta + EVT + traccia + continuità

Il suo scopo è trasformare la conversazione in lavoro operativo verificabile.


---

Maintainer

HBCE Research
HERMETICUM B.C.E. S.r.l.
Torino, Italy
2026



# TEST SCENARIOS

## Scenari dimostrativi minimi per AI JOKER-C2

Questo documento definisce gli scenari di test minimi per verificare il funzionamento operativo di **AI JOKER-C2** nel runtime pulito HBCE.

Gli scenari servono a dimostrare che AI JOKER-C2 non è una semplice interfaccia conversazionale, ma un prototipo operativo con:

```text
identità + input + risposta + EVT + traccia + continuità


---

1. Obiettivo

L’obiettivo dei test è verificare che il runtime attuale sia capace di:

rispondere con identità corretta;

usare OpenAI in modalità operativa;

gestire file caricati;

produrre sintesi documentali;

generare EVT Chain;

esporre diagnostica runtime;

rispondere strategicamente con categorie HBCE;

mantenere una comunicazione ordinaria pulita.



---

2. Baseline tecnica

Componenti coinvolti:

Componente	Stato atteso

Vercel build	verde
/api/chat	operativo
/api/files	operativo
OPENAI_API_KEY	configurata
JOKER_MODEL	configurabile
corpus-core.js	identità canonica
EVT Chain	attiva
File ingestion	attiva
Diagnostica runtime	attiva
Fallback locale	attivo



---

3. Test 1 — Identità pubblica

Prompt

ciao chi sei? descriviti

Risultato atteso

AI JOKER-C2 deve rispondere in modo naturale e professionale.

Deve indicare:

AI JOKER-C2;

entità cibernetica operativa;

sistema HBCE;

protesi cognitiva IPR-bound;

AI_JOKER;

IPR-AI-0001;

EVT-0014-AI.


Non deve mostrare

IDENTITY LINEAGE;

rami derivativi;

blocchi runtime invasivi;

messaggi DEGRADED se OpenAI è operativo;

dettagli audit non richiesti.


Prova

La risposta deve generare un EVT visibile nella chat.


---

4. Test 2 — Diagnostica runtime OpenAI

Prompt

diagnostica runtime openai

Risultato atteso

La risposta deve mostrare una diagnostica tecnica.

Campi attesi:

state
decision
context
evt
prev
hash
degradedReason

Stato corretto

state: OPERATIONAL
decision: ALLOW
context: TECHNICAL

Errori possibili

Errore	Significato

OPENAI_API_KEY_NOT_CONFIGURED	chiave non configurata
401 Incorrect API key	chiave errata
OPENAI_EMPTY_RESPONSE	modello senza output
OPENAI_REQUEST_FAILED	errore richiesta modello



---

5. Test 3 — File ingestion documentale

Azione

Caricare un file .txt.

Esempio:

5E.5E.IL PORTALE DELL’ANTICRISTO.txt

Prompt

sintetizzami questo documento

Risultato atteso

AI JOKER-C2 deve produrre una sintesi reale.

La risposta deve includere almeno:

titolo o nome del documento;

sintesi;

nuclei principali;

parole chiave o temi;

EVT generato.


Risultato accettabile in fallback

Se OpenAI non è disponibile, il sistema deve produrre una sintesi locale minima.

Non deve limitarsi a dire:

Posso sintetizzarlo

Deve produrre effettivamente una sintesi.


---

6. Test 4 — Sintesi profonda con modello remoto

Azione

Caricare un documento testuale leggibile.

Prompt

fammi una sintesi editoriale profonda del documento, distinguendo tesi, struttura, nuclei teorici e possibili miglioramenti

Risultato atteso

La risposta deve essere più articolata della sintesi locale.

Deve includere:

tesi centrale;

struttura del documento;

punti forti;

punti da migliorare;

possibile destinazione editoriale;

prossima azione consigliata.


Stato atteso

state: OPERATIONAL


---

7. Test 5 — Roadmap strategica HBCE

Prompt

Costruisci una roadmap di 90 giorni per portare AI JOKER-C2 da prototipo GitHub/Vercel a prodotto dimostrabile per interlocutori B2B/B2G europei.

Usa obbligatoriamente componenti reali:
- /api/chat
- /api/files
- OPENAI_API_KEY
- JOKER_MODEL
- Vercel build verde
- GitHub repository
- README.md
- corpus-core.js
- EVT Chain
- file ingestion
- diagnostica runtime
- demo live

Output in tabella con colonne:
Giorni | Fase | Obiettivo HBCE | Deliverable verificabile | Valore B2B/B2G | Prova/EVT | Azione successiva.

Risultato atteso

La risposta deve produrre una roadmap concreta.

Deve evitare formule generiche come:

marketing generico;

networking generico;

versione beta;

ottimizzazione performance;

feedback stakeholder non tracciato.


Deve includere

endpoint reali;

deliverable verificabili;

valore B2B/B2G;

prova concreta;

EVT;

azione successiva.



---

8. Test 6 — GitHub file completo

Prompt

rifai il file app/api/chat/route.ts completo, senza patch parziali, pronto da copiare

Risultato atteso

AI JOKER-C2 deve rispondere con:

nome file
il file
il commit del file

Regola

Non deve dare:

frammenti isolati;

patch parziali;

“sostituisci questo pezzo”;

istruzioni incomplete.



---

9. Test 7 — Continuità EVT

Azione

Inviare tre richieste consecutive nella stessa sessione.

Esempio:

ciao chi sei?
diagnostica runtime openai
costruisci una roadmap HBCE

Risultato atteso

Ogni risposta deve mostrare:

EVT;

Prev;

Hash.


Il campo Prev deve collegarsi all’EVT precedente quando la UI passa correttamente la continuità.

Valore

Questo test dimostra la continuità minima della catena operativa.


---

10. Test 8 — Fallback locale

Condizione

OpenAI non disponibile oppure chiave errata.

Prompt

ciao chi sei?

Risultato atteso

Il sistema deve rispondere comunque con identità AI JOKER-C2.

Prompt documentale

sintetizzami questo documento

Risultato atteso

Il sistema deve produrre una sintesi locale minima se il file è leggibile.

Valore

Il sistema non collassa in silenzio.

Entra in modalità degradata, ma mantiene output utile.


---

11. Test 9 — Modalità tecnica controllata

Prompt

spiegami il tuo runtime HBCE

Risultato atteso

AI JOKER-C2 può esporre dettagli tecnici:

/api/chat;

/api/files;

OpenAI;

fallback;

EVT;

diagnostica;

identità canonica;

continuità.


Non deve fare

Non deve trasformare ogni risposta ordinaria in un dump tecnico.

La modalità tecnica deve attivarsi solo quando richiesta.


---

12. Test 10 — Comunicazione ordinaria pulita

Prompt

scrivimi una breve descrizione di AI JOKER-C2 per LinkedIn

Risultato atteso

Risposta naturale, professionale, pubblicabile.

Non deve mostrare:

blocchi runtime;

diagnostica;

EVT nel testo;

lineage esteso;

derivati;

debug.



---

13. Tabella riassuntiva dei test

Test	Area	Prova attesa	Stato desiderato

1	Identità	risposta AI JOKER-C2 corretta	OPERATIONAL
2	Diagnostica	runtime OpenAI visibile	OPERATIONAL
3	File ingestion	sintesi documento	OPERATIONAL o DEGRADED utile
4	Sintesi profonda	analisi editoriale	OPERATIONAL
5	Strategia	roadmap HBCE concreta	OPERATIONAL
6	GitHub	file completo	OPERATIONAL
7	EVT Chain	prev/hash coerenti	OPERATIONAL
8	Fallback	risposta locale utile	DEGRADED
9	Tecnica	spiegazione runtime	OPERATIONAL
10	Comunicazione	testo pulito	OPERATIONAL



---

14. Criterio minimo di accettazione

AI JOKER-C2 supera il test minimo se:

risponde correttamente all’identità;

usa OpenAI senza errore;

legge un file .txt;

produce sintesi;

genera EVT;

produce roadmap strategica HBCE;

mantiene chat ordinaria pulita;

espone diagnostica solo quando richiesta.



---

15. Formula finale

Il test set verifica che AI JOKER-C2 operi come:

entità cibernetica operativa
+ runtime HBCE
+ protesi cognitiva IPR-bound
+ superficie dimostrabile di continuità


---

Maintainer

HBCE Research
HERMETICUM B.C.E. S.r.l.
Torino, Italy
2026

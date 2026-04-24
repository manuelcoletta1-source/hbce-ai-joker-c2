# ROADMAP 90 GIORNI

## Da prototipo GitHub/Vercel a prodotto dimostrabile B2B/B2G

Questo documento definisce la roadmap operativa di 90 giorni per portare **AI JOKER-C2** da prototipo funzionante a prodotto dimostrabile per interlocutori B2B/B2G europei.

La roadmap parte dallo stato attuale del runtime:

- repository GitHub pulito;
- build Vercel verde;
- `/api/chat` operativo;
- `/api/files` operativo;
- `OPENAI_API_KEY` configurata;
- `JOKER_MODEL` configurabile;
- `corpus-core.js` come fonte identitaria canonica;
- EVT Chain attiva;
- file ingestion attiva;
- diagnostica runtime attiva;
- comportamento strategico HBCE attivo.

---

## 1. Obiettivo

L’obiettivo dei prossimi 90 giorni è trasformare AI JOKER-C2 in un oggetto dimostrabile, presentabile e tecnicamente verificabile.

Non si tratta ancora di costruire una piattaforma enterprise completa.

Si tratta di costruire un pacchetto minimo forte composto da:

```text
runtime funzionante
+ repository pulito
+ demo live
+ documentazione tecnica
+ scheda prodotto
+ roadmap chiara
+ posizionamento B2B/B2G


---

2. Principio operativo

La roadmap segue la formula HBCE:

identità → input → risposta → EVT → traccia → continuità → verifica

Ogni fase deve produrre almeno un deliverable verificabile.

Un deliverable verificabile può essere:

file;

commit;

route API;

pagina Vercel;

test ripetibile;

demo live;

EVT generato;

documento tecnico;

tabella stakeholder;

video demo;

scheda prodotto.



---

3. Roadmap sintetica

Giorni	Fase	Obiettivo HBCE	Deliverable verificabile	Valore B2B/B2G	Prova/EVT	Azione successiva

1-15	Tecnica	Consolidare runtime minimo	/api/chat, /api/files, OpenAI attiva, build verde	Dimostra che AI JOKER-C2 è operativo	EVT identità + EVT file + EVT strategia	Creare test set minimo
16-30	Tecnica	Rafforzare diagnostica e stabilità	/api/status, health check, error handling	Riduce rischio tecnico per stakeholder	test diagnostica runtime	Introdurre persistenza minima
31-45	Documentale	Completare documentazione pulita	README, docs, scheda prodotto, IPR, runtime	Rende il progetto leggibile	commit documentali	Preparare one-page B2B/B2G
46-60	Demo	Costruire demo verificabile	demo identità, documento, strategia, runtime	Mostra valore reale, non teorico	EVT per ogni scenario	Registrare video demo
61-75	Mercato	Definire target B2B/B2G	target list, messaggi, priorità contatto	Crea canale commerciale selettivo	tabella stakeholder	Preparare invii mirati
76-90	Istituzionale	Costruire pacchetto presentazione	pitch deck, one-page, demo live, repository	Presentabilità a imprese, PA e istituzioni	pacchetto completo	Avviare outreach selettivo



---

4. Giorni 1-15: fase tecnica minima

Obiettivo

Consolidare il runtime già funzionante e fissare un set minimo di test dimostrabili.

Componenti coinvolti

/api/chat
/api/files
OPENAI_API_KEY
JOKER_MODEL
corpus-core.js
EVT Chain
Vercel build verde
GitHub repository

Deliverable

Deliverable	Descrizione	Prova

Test identità	richiesta “ciao chi sei?”	risposta AI JOKER-C2 corretta
Test OpenAI	richiesta strategica	state: OPERATIONAL
Test file	upload .txt + sintesi	sintesi + EVT
Test diagnostica	diagnostica runtime openai	stato runtime
Test continuità	più messaggi consecutivi	prev aggiornato


Azione successiva

Creare un file di test operativo interno:

docs/TEST-SCENARIOS.md


---

5. Giorni 16-30: diagnostica e stabilità

Obiettivo

Rendere il runtime più leggibile e verificabile da un interlocutore tecnico.

Nuove funzioni consigliate

Funzione	Scopo

/api/status	esporre stato minimo runtime
health check JSON	verificare modello, ambiente, build
error handling migliorato	evitare fallback opachi
test dimensione file	evitare ingestione instabile
diagnostica sessione	rendere chiaro cosa è attivo


Deliverable verificabile

/api/status

Output atteso:

{
  "ok": true,
  "name": "AI JOKER-C2",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "checkpoint": "EVT-0014-AI",
  "runtime": "OPERATIONAL",
  "chat": true,
  "files": true,
  "modelConfigured": true
}

Valore B2B/B2G

Un interlocutore tecnico deve poter vedere che il sistema non è solo una pagina web, ma un runtime controllabile.


---

6. Giorni 31-45: documentazione pulita

Obiettivo

Rendere il progetto leggibile e presentabile.

Documenti minimi

Documento	Funzione

README.md	presentazione repository
docs/README.md	indice documentale
docs/AI-JOKER-C2.md	scheda prodotto
docs/HBCE-RUNTIME.md	architettura runtime
docs/IPR.md	modello identitario
docs/ROADMAP-90.md	roadmap operativa
docs/B2B-B2G-POSITIONING.md	posizionamento mercato


Prova

Ogni documento deve essere:

coerente con il runtime reale;

privo di riferimenti legacy non necessari;

leggibile da stakeholder tecnico;

allineato a GitHub/Vercel;

collegato a una funzione dimostrabile.



---

7. Giorni 46-60: demo verificabile

Obiettivo

Costruire una demo live breve, ripetibile e comprensibile.

Demo minima

Demo	Prompt / Azione	Valore

Identità	ciao chi sei? descriviti	mostra identità AI JOKER-C2
Documento	caricare .txt e chiedere sintesi	mostra file ingestion
Strategia	chiedere roadmap B2B/B2G	mostra comportamento strategico
Diagnostica	diagnostica runtime openai	mostra stato runtime
EVT Chain	ispezionare EVT risposta	mostra traccia e continuità


Deliverable

pagina Vercel funzionante;

script demo;

screenshot;

video demo breve;

elenco prompt demo;

EVT generati durante la demo.



---

8. Giorni 61-75: fase mercato

Obiettivo

Identificare interlocutori coerenti con il valore operativo del sistema.

Target prioritari

Target	Interesse potenziale	Messaggio

Imprese tecnologiche	runtime AI operativo	prototipo verificabile GitHub/Vercel
Cybersecurity	tracciabilità e diagnostica	AI con identità e continuità
PA	supporto documentale	sintesi, file, EVT, continuità
Ricerca	analisi e strutturazione	strumento per testi e progetti
Compliance	verificabilità documentale	output strutturati e tracciabili
Infrastrutture critiche	continuità operativa	runtime controllabile
Data governance	trattamento informativo	pipeline documentale e strategica


Deliverable

target list B2B/B2G

Colonne consigliate:

Nome ente | Settore | Interesse | Contatto | Stato invio | Risposta | Follow-up


---

9. Giorni 76-90: fase istituzionale

Obiettivo

Preparare un pacchetto presentabile a interlocutori esterni.

Pacchetto minimo

Deliverable	Stato previsto

Repository GitHub pulito	completo
Deploy Vercel	completo
README professionale	completo
Scheda prodotto	completo
Documento runtime	completo
Documento IPR	completo
Roadmap	completo
One-page B2B/B2G	da completare
Pitch deck	da completare
Video demo	da completare
Target list	da completare


Azione finale

Avviare outreach selettivo verso pochi interlocutori prioritari, non campagna generica.


---

10. Criteri di successo

La roadmap è riuscita se dopo 90 giorni AI JOKER-C2 può dimostrare:

Criterio	Prova

Identità chiara	AI_JOKER / IPR-AI-0001 / EVT-0014-AI
Runtime funzionante	Vercel live
Chat operativa	/api/chat
File ingestion	/api/files
Modello remoto attivo	diagnostica OpenAI
Fallback locale	sintesi documentale minima
EVT Chain	evt, prev, hash
Documentazione	README + docs
Demo live	script e video
Posizionamento	one-page B2B/B2G
Target	lista stakeholder



---

11. Cosa evitare

Durante i 90 giorni bisogna evitare:

ricostruzione di moduli legacy inutili;

ritorno a C2-LEX senza necessità;

dashboard non funzionanti;

documentazione eccessiva non collegata al runtime;

promesse enterprise non dimostrate;

linguaggio generico da startup AI;

roadmap senza deliverable;

marketing prima della demo;

nuove cartelle non necessarie.



---

12. Formula finale della roadmap

90 giorni = stabilizzare + documentare + dimostrare + posizionare + presentare

AI JOKER-C2 deve uscire dai 90 giorni come:

prototipo operativo verificabile
+ scheda prodotto
+ demo live
+ documentazione tecnica
+ target B2B/B2G


---

Maintainer

HBCE Research
HERMETICUM B.C.E. S.r.l.
Torino, Italy
2026


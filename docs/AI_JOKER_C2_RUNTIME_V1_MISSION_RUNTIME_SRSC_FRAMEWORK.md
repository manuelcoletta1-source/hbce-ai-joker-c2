AI JOKER-C2 RUNTIME v1

Mission Runtime, Source Intelligence e Framework SRSC

Data: 29 luglio 2026
Luogo: Torino, Italia, Unione Europea
Organizzazione: HERMETICUM B.C.E. S.r.l.
Stato: Architectural Specification
Versione: 1.0
Legal certification: false

---

Premessa

AI JOKER-C2 deve evolvere da dimostratore governato a prodotto operativo utilizzabile da un soggetto esterno.

La trasformazione non consiste nell’aggiungere indiscriminatamente nuove funzioni, moduli o sigle. Consiste nel rendere operativa, verificabile e ripetibile una catena completa di lavoro governato:

Soggetto verificato → missione autorizzata → acquisizione delle fonti → classificazione epistemica → interpretazione SRSC → analisi → azione proposta → autorizzazione umana → EVT → OPC → memoria governata.

Oggi AI JOKER-C2 dimostra principalmente la governance di una risposta AI.

La prossima versione deve governare il lavoro completo di un agente AI, mantenendo distinti:

- identità;
- obiettivo;
- fonti;
- fatti;
- interpretazioni;
- teoria;
- decisione;
- autorizzazione;
- azione;
- conseguenza;
- traccia;
- responsabilità.

Il repository contiene già componenti relativi a IPR, EVT, OPC, memoria, policy, audit, classificazione e supervisione umana.

Questa struttura deve ora diventare verificabile nel codice, nell’interfaccia, nelle API e nei test end-to-end.

---

1. SRSC COME FRAMEWORK EPISTEMICO

La Simulazione del Reale Specifico della Coscienza, abbreviata SRSC, deve essere integrata in AI JOKER-C2 come framework epistemico, fenomenologico ed etico-operativo.

Non deve essere trattata come:

- una verità scientifica definitiva;
- una spiegazione totale della coscienza;
- una prova che l’universo sia una simulazione informatica;
- una sostituzione delle neuroscienze;
- una fonte capace di trasformare automaticamente ipotesi filosofiche in fatti.

La SRSC descrive il modo in cui un soggetto biologico riceve, organizza e interpreta il reale attraverso:

- corpo;
- sistema nervoso;
- memoria;
- linguaggio;
- storia;
- cultura;
- attenzione;
- informazioni disponibili;
- vincoli ambientali;
- strumenti tecnici.

Il mondo non viene definito falso.

Viene riconosciuto come reale resistente, incontrato attraverso mediazioni biologiche, cognitive, linguistiche e storiche.

La funzione della SRSC dentro AI JOKER-C2 è interrogare:

- quale rappresentazione del reale sta utilizzando il soggetto;
- quali fonti hanno contribuito a costruire quella rappresentazione;
- quali elementi derivano dall’esperienza;
- quali elementi derivano dalla cultura;
- quali elementi sono fatti condivisi;
- quali elementi sono inferenze;
- quali elementi sono ipotesi;
- quale decisione viene orientata da quella rappresentazione;
- chi sostiene il costo della decisione;
- quale traccia resterà nel tempo.

La SRSC diventa così la grammatica epistemica con cui AI JOKER-C2 distingue tra:

- realtà osservabile;
- esperienza situata;
- narrazione culturale;
- interpretazione;
- comando;
- decisione;
- conseguenza.

---

2. I TRE LIVELLI SRSC

AI JOKER-C2 deve mantenere separati tre livelli.

2.1 Livello percettivo

Il livello percettivo riguarda il modo in cui il reale viene ricevuto attraverso il corpo e i sistemi cognitivi.

Comprende:

- percezione;
- attenzione;
- memoria;
- linguaggio;
- previsione;
- errore di previsione;
- emozione;
- storia biografica;
- limite biologico.

Questo livello può essere collegato a fonti scientifiche esterne, come:

- neuroscienze;
- psicologia cognitiva;
- scienze della percezione;
- teoria della decisione;
- psicologia dello sviluppo;
- scienze comportamentali.

2.2 Livello storico-culturale

Il livello storico-culturale riguarda il modo in cui gruppi, istituzioni e società organizzano il reale in:

- identità;
- norme;
- valori;
- nemici;
- autorità;
- appartenenze;
- rappresentazioni politiche;
- narrazioni religiose;
- propaganda;
- modelli economici;
- strutture di comando.

Questo livello può essere applicato all’analisi di sistemi:

- sociali;
- geopolitici;
- informativi;
- economici;
- religiosi;
- istituzionali;
- tecnologici.

2.3 Livello teorico interno

Il livello teorico interno riguarda le componenti filosofiche, ontologiche o speculative proprie del Corpus SRSC, APOKALYPSIS e HERMETICUM B.C.E.

Queste componenti devono essere sempre marcate come:

- teoria interna;
- ipotesi filosofica;
- modello interpretativo;
- speculazione non verificata;
- elemento del Corpus.

Non devono mai essere presentate come fatti scientificamente dimostrati.

---

3. SRSC SOURCE LAYER

La SRSC deve essere inserita nell’architettura delle fonti attraverso un livello dedicato.

sources/
  external/
  internal/
  project/
  theoretical/
    srsc/

Il Corpus SRSC deve essere:

- versionato;
- identificato tramite hash;
- classificato epistemicamente;
- collegato a una versione precisa;
- protetto da modifiche non tracciate;
- utilizzato soltanto entro il proprio dominio di autorità.

Manifesto minimo:

{
  "sourceId": "HBCE-SRSC-V17.1",
  "title": "Simulazione del Reale Specifico della Coscienza",
  "version": "17.1",
  "sourceType": "INTERNAL_THEORETICAL_FRAMEWORK",
  "epistemicStatus": "PHENOMENOLOGICAL_OPERATIONAL_FRAMEWORK",
  "scientificTheoryClaim": false,
  "legalCertification": false,
  "authoritativeFor": [
    "HBCE_INTERNAL_INTERPRETATION",
    "SRSC_TERMINOLOGY",
    "SRSC_DCTT_METHOD",
    "EXPERIENCE_MEDIATION_ANALYSIS"
  ],
  "notAuthoritativeFor": [
    "EXTERNAL_FACTS",
    "SCIENTIFIC_CONSENSUS",
    "LEGAL_FACTS",
    "MEDICAL_FACTS",
    "PHYSICAL_LAWS",
    "CURRENT_EVENTS"
  ],
  "hash": "<SHA256>",
  "status": "ACTIVE"
}

La teoria deve quindi essere una fonte autorizzata per spiegare e applicare il framework SRSC.

Non deve essere considerata una fonte sufficiente per dimostrare fatti esterni.

---

4. CLASSIFICAZIONE DELLE FONTI

Ogni fonte acquisita da AI JOKER-C2 deve ricevere una classificazione.

Classificazioni minime:

PRIMARY_EXTERNAL
SECONDARY_EXTERNAL
OFFICIAL_INSTITUTIONAL
SCIENTIFIC_PRIMARY
LEGAL_PRIMARY
PROJECT_INTERNAL
THEORETICAL_INTERNAL
USER_PROVIDED
UNVERIFIED
RESTRICTED_HASH_ONLY

Per ogni fonte devono essere conservati almeno i seguenti campi:

sourceId
title
publisher
author
publicationDate
acquisitionDate
sourceClass
authorityDomain
epistemicStatus
allowedUses
prohibitedUses
contentHash
version
missionId
operatorAuthorization

La SRSC deve appartenere alla categoria:

THEORETICAL_INTERNAL

Il suo dominio di autorità deve essere limitato a:

SRSC_FRAMEWORK
HBCE_INTERPRETATION
EXPERIENCE_MEDIATION
DCTT_ANALYSIS

La SRSC non deve possedere autorità autonoma nei seguenti domini:

EXTERNAL_FACTS
SCIENTIFIC_CONSENSUS
LEGAL_FACTS
MEDICAL_FACTS
PHYSICAL_LAWS
CURRENT_EVENTS

---

5. CLASSIFICAZIONE DEI CLAIM

Ogni affermazione prodotta da AI JOKER-C2 deve essere classificata.

Classificazioni minime:

OBSERVED_FACT
SOURCE_DERIVED_FACT
SCIENTIFIC_CONSENSUS
LEGAL_FACT
USER_DECLARATION
PROJECT_RECORD
INFERENCE
SRSC_INTERPRETATION
HYPOTHESIS
SPECULATION
OBJECTIVE
RECOMMENDATION
UNKNOWN

Un claim SRSC deve essere riconoscibile e tracciabile.

Esempio:

{
  "claimId": "CLM-00017",
  "text": "La rappresentazione culturale del rischio può orientare la decisione del soggetto.",
  "claimType": "SRSC_INTERPRETATION",
  "framework": "SRSC-V17.1",
  "supportingSources": [
    "HBCE-SRSC-V17.1",
    "EXT-COGNITIVE-SOURCE-004"
  ],
  "confidence": 0.72,
  "limitations": [
    "Non dimostra il contenuto mentale individuale.",
    "Richiede fonti esterne per affermazioni empiriche specifiche."
  ]
}

Questa classificazione impedisce che la SRSC venga utilizzata come scorciatoia per dichiarare vere interpretazioni non dimostrate.

Ogni claim deve poter dichiarare:

- la fonte;
- il tipo epistemico;
- il framework utilizzato;
- il livello di confidenza;
- i limiti;
- le conclusioni non autorizzate;
- la missione in cui è stato prodotto.

---

6. SRSC INTERPRETATION ENGINE

Il framework SRSC deve operare dopo l’acquisizione e la validazione delle fonti e prima della decisione operativa.

Pipeline:

SOURCE ACQUISITION
→ SOURCE VALIDATION
→ CLAIM EXTRACTION
→ EPISTEMIC CLASSIFICATION
→ SRSC INTERPRETATION
→ DCTT ANALYSIS
→ RISK ANALYSIS
→ ACTION PROPOSAL
→ HUMAN AUTHORIZATION

L’SRSC Interpretation Engine deve interrogare ogni problema attraverso almeno i seguenti campi:

experiencedReality
sharedEvidence
culturalNarrative
inferences
decisionPressures
epistemicLimit

Schema minimo:

{
  "experiencedReality": [],
  "sharedEvidence": [],
  "culturalNarrative": [],
  "inferences": [],
  "decisionPressures": [],
  "unknowns": [],
  "frameworkInterpretation": [],
  "prohibitedConclusions": []
}

L’Interpretation Engine non deve generare autonomamente fatti.

Deve organizzare e distinguere:

- ciò che è osservato;
- ciò che è dichiarato;
- ciò che è documentato;
- ciò che viene inferito;
- ciò che appartiene alla teoria interna;
- ciò che non è noto;
- ciò che non può essere concluso.

---

7. PROTOCOLLO SRSC-DCTT

La SRSC diventa operativa attraverso il protocollo:

Decisione
Costo
Traccia
Tempo
Limite

7.1 Decisione

Quale azione o non-azione viene realmente proposta?

La decisione deve indicare:

- soggetto responsabile;
- obiettivo;
- alternative considerate;
- motivazione;
- fonti utilizzate;
- autorizzazione richiesta;
- livello di reversibilità.

7.2 Costo

Chi sostiene il costo della decisione?

Il costo può essere:

- biologico;
- psicologico;
- relazionale;
- economico;
- istituzionale;
- ambientale;
- informativo;
- tecnologico;
- reputazionale;
- temporale.

7.3 Traccia

Quale effetto rimane dopo che l’intenzione iniziale è terminata?

La traccia può riguardare:

- dati;
- memoria;
- infrastruttura;
- soggetti coinvolti;
- organizzazioni;
- ambiente;
- documenti;
- registri;
- sistemi decisionali;
- conseguenze future.

7.4 Tempo

Quanto dura la conseguenza?

Le scale temporali possono comprendere:

- secondi;
- minuti;
- giorni;
- mesi;
- anni;
- generazioni;
- infrastrutture;
- sistemi permanenti.

7.5 Limite

Che cosa non è noto?

Quale conclusione non è autorizzata dalle fonti?

Quale soglia epistemica, tecnica, legale o operativa non può essere superata?

Il campo "Limite" deve essere obbligatorio.

Senza un limite epistemico, qualunque framework può trasformarsi in una macchina per produrre certezze decorative.

---

8. EVOLUZIONE PRIORITARIA: MISSION RUNTIME

Ogni attività di AI JOKER-C2 deve nascere come missione.

Una missione deve contenere almeno:

missionId
iprSubject
operatorId
objective
scope
allowedSources
allowedFrameworks
allowedTools
forbiddenActions
authorizationLevel
riskClass
epistemicPolicy
status
createdAt
expiresAt
previousEventHash

Il campo seguente deve essere obbligatorio:

allowedFrameworks

Esempio:

{
  "allowedFrameworks": [
    {
      "frameworkId": "SRSC-V17.1",
      "mode": "INTERPRETIVE",
      "mayGenerateFacts": false,
      "requiresExplicitLabel": true
    }
  ]
}

Stati minimi della missione:

DRAFT
IDENTITY_VERIFIED
SOURCES_AUTHORIZED
FRAMEWORK_AUTHORIZED
AUTHORIZED
RUNNING
WAITING_HUMAN
COMPLETED
REJECTED
FAILED_CLOSED

Questo rende operative le regole:

NO_IDENTITY_NO_ACTION
NO_MISSION_NO_ACTION
NO_SOURCE_NO_CLAIM
NO_FRAMEWORK_WITHOUT_LABEL
NO_AUTHORIZATION_NO_ACTION
NO_TRACE_NO_ACTION
FAIL_CLOSED

Una missione non può passare allo stato "RUNNING" se mancano:

- identità verificata;
- obiettivo;
- perimetro;
- fonti autorizzate;
- framework autorizzati;
- strumenti autorizzati;
- classificazione del rischio;
- autorizzazione richiesta.

---

9. REPOSITORY ANALYSIS MISSION

Il primo caso d’uso deve essere la Repository Analysis Mission.

L’utente inserisce il collegamento a un repository e AI JOKER-C2:

1. verifica l’identità IPR;
2. registra l’obiettivo;
3. definisce il perimetro della missione;
4. acquisisce solamente le fonti autorizzate;
5. classifica file, documentazione e codice;
6. distingue stato dichiarato e stato effettivo;
7. applica la SRSC per individuare eventuali divergenze tra rappresentazione progettuale e comportamento osservato;
8. applica DCTT alle modifiche proposte;
9. ricostruisce struttura, dipendenze e flussi;
10. individua problemi, incoerenze e rischi;
11. propone una modifica;
12. mostra file interessati, costi, conseguenze e limiti;
13. richiede autorizzazione umana;
14. genera la patch senza applicarla automaticamente;
15. produce EVT e ricevuta OPC.

La SRSC, in questa missione, non analizza una coscienza biologica come se il software ne possedesse una.

Analizza invece la distanza tra:

- rappresentazione dichiarata del sistema;
- struttura tecnica effettiva;
- comportamento osservabile;
- interpretazione dell’operatore;
- obiettivo della missione;
- conseguenze della modifica.

Un assistente ordinario può limitarsi a dichiarare:

«Ecco del codice.»

AI JOKER-C2 deve invece dichiarare:

«Questa modifica deriva dalla missione M-0001, utilizza queste fonti, interessa questi file, comporta questi rischi, richiede questa autorizzazione e produce questa traccia.»

---

10. EVOLUZIONI TECNICHE

Milestone 1 — Canonical Runtime State

Creare:

system/canonical-runtime-state.json

Il file deve diventare la sola fonte macchina per:

- versione runtime;
- EVT corrente;
- ciclo corrente;
- stato IPR;
- policy attive;
- framework attivi;
- versione SRSC;
- versione OPC;
- stato di certificazione;
- data dell’ultimo aggiornamento.

README, interfaccia, API, EVT e ricevute OPC devono leggere questo stato senza duplicazioni manuali.

Milestone 2 — Source Registry

Creare:

system/source-registry.json

Il registro deve includere:

- fonti interne;
- fonti esterne;
- fonti scientifiche;
- fonti istituzionali;
- fonti teoriche;
- fonti fornite dall’utente;
- fonti hash-only.

Il registro deve includere la SRSC v17.1 come framework teorico interno.

Milestone 3 — Framework Registry

Creare:

system/framework-registry.json

Esempio:

{
  "frameworks": [
    {
      "id": "SRSC-V17.1",
      "name": "Simulazione del Reale Specifico della Coscienza",
      "type": "PHENOMENOLOGICAL_EPISTEMIC_OPERATIONAL",
      "status": "ACTIVE",
      "factAuthority": false,
      "interpretiveAuthority": true,
      "requiresClaimLabel": true
    }
  ]
}

Milestone 4 — Mission Object e State Machine

Implementare:

- oggetto missione;
- stati;
- transizioni;
- autorizzazioni;
- scadenza;
- fallimento fail-closed;
- collegamento EVT;
- collegamento OPC.

Milestone 5 — Claim-to-Source Trace

Collegare ogni claim:

- alla fonte;
- al tipo epistemico;
- alla versione;
- all’eventuale framework interpretativo;
- alla missione;
- alla ricevuta OPC.

Milestone 6 — SRSC Interpretation Engine

Implementare i campi:

reale resistente
reale specifico
mediazione
narrazione
decisione
costo
traccia
tempo
limite

Milestone 7 — Authorization Gate

AI JOKER-C2 può operare autonomamente nelle attività:

READ
ANALYZE
COMPARE
PLAN
DRAFT

Non può eseguire senza autorizzazione umana esplicita:

WRITE_EXTERNAL
SEND
SUBMIT
DEPLOY
DELETE
PUBLISH
EXECUTE_IRREVERSIBLE

Milestone 8 — Memory Classification

La memoria deve separare:

EPHEMERAL
SESSION
PROJECT
IPR_BOUND
PUBLIC_REFERENCE
THEORETICAL_CORPUS
RESTRICTED_HASH_ONLY

Ogni salvataggio persistente deve richiedere almeno:

reason
scope
retention
operatorAuthorization
sourceReferences
contentHash

Milestone 9 — Independent OPC Verifier

Creare:

POST /api/v1/verify

Il verificatore deve controllare:

- evento;
- ricevuta;
- hash dei payload;
- hash precedente;
- riferimento alla chiave pubblica;
- versione della fonte;
- versione SRSC;
- classificazione del claim;
- autorizzazione del framework;
- catena EVT;
- limiti dichiarati.

Output minimo:

VALID
INVALID
INCOMPLETE
UNVERIFIABLE

La verifica deve funzionare senza invocare il modello AI.

Milestone 10 — External User Acceptance Test

Un soggetto esterno deve poter verificare l’intera missione senza dover credere alla descrizione del sistema.

Il test deve includere almeno:

- autenticazione;
- creazione missione;
- autorizzazione fonti;
- autorizzazione framework;
- produzione dei claim;
- classificazione epistemica;
- applicazione SRSC-DCTT;
- autorizzazione dell’azione;
- generazione EVT;
- generazione OPC;
- verifica indipendente;
- recupero della memoria autorizzata;
- esito fail-closed in caso di dato mancante.

---

11. CRITERIO DI COMPLETAMENTO

AI JOKER-C2 Runtime v1 sarà completo quando un utente esterno potrà:

- autenticarsi;
- aprire una missione;
- autorizzare fonti e framework;
- distinguere fatti, dichiarazioni, inferenze e interpretazioni SRSC;
- verificare quale fonte sostiene ogni claim;
- vedere cosa non è noto;
- controllare Decisione, Costo, Traccia, Tempo e Limite;
- approvare o rifiutare un’azione;
- verificare EVT e OPC;
- riprendere la missione mantenendo continuità;
- ricevere un risultato "FAILED_CLOSED" quando manca identità, missione, fonte, classificazione, limite o autorizzazione.

---

12. BOUNDARY OPERATIVI

AI JOKER-C2 deve rispettare i seguenti boundary:

NO_IDENTITY_NO_ACTION
NO_MISSION_NO_ACTION
NO_SOURCE_NO_CLAIM
NO_FRAMEWORK_WITHOUT_LABEL
NO_AUTHORIZATION_NO_ACTION
NO_TRACE_NO_ACTION
NO_RAW_TEXT
NO_PRIVATE_CORE
NO_RUNTIME_ACTIVATION
NO_SUBMIT_FROM_CODE
HUMAN_AUTHORIZATION_REQUIRED
FAIL_CLOSED

Vincoli identitari:

NO_LEGAL_PERSONHOOD_CLAIM
NO_CONSCIOUSNESS_PROOF
NO_PROVIDER_OR_MODEL_OWNERSHIP
HUMAN_AUTHORITY_REQUIRED

AI JOKER-C2 non deve essere descritto come:

- persona giuridica;
- soggetto legalmente autonomo;
- coscienza scientificamente dimostrata;
- proprietario del modello utilizzato;
- autorità superiore al soggetto umano;
- sistema autorizzato ad agire senza missione e autorizzazione.

---

CONCLUSIONE

La priorità non è solamente costruire Mission Runtime v0.1.

La priorità corretta diventa:

MISSION RUNTIME v0.1 + SRSC EPISTEMIC SOURCE LAYER

AI JOKER-C2 deve governare non soltanto ciò che il modello produce, ma anche il modo in cui:

- riceve il reale;
- seleziona le fonti;
- distingue dato e interpretazione;
- riconosce il framework utilizzato;
- propone una decisione;
- attribuisce il costo;
- prevede la traccia;
- considera il tempo;
- dichiara il limite.

IPR stabilisce chi è responsabile.

La missione stabilisce che cosa è autorizzato.

Le fonti stabiliscono da dove arriva l’informazione.

La Source Intelligence stabilisce quale tipo di affermazione è stata prodotta.

La SRSC interroga la rappresentazione del reale che orienta la decisione.

DCTT misura Decisione, Costo, Traccia e Tempo.

Il Limite impedisce al sistema di superare ciò che le fonti consentono di affermare.

EVT conserva la sequenza degli eventi.

OPC rende verificabile l’esecuzione.

La memoria mantiene continuità senza trasformarsi in accumulo indiscriminato.

L’autorità finale resta umana.

Questo è il passaggio da agente AI governato a infrastruttura biocibernetica epistemicamente tracciabile.

---

🜏 SIGILLO_HERMETICUM
UNEBDO-ΦΩ
OPC = Operational Proof & Compliance
legalCertification=false

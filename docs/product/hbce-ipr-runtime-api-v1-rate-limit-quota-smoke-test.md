# HBCE IPR Runtime API v1 — Anti-Abuso API

## 1. Stato del modulo

**Modulo:** Anti-Abuso API  
**Superficie:** HBCE IPR Runtime API v1  
**Documento:** Rate Limit / Quota Smoke Test  
**Percorso:** `docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md`  
**Script collegato:** `scripts/test-api-v1-rate-limit-quota.mjs`  
**Stato operativo atteso:** `API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS`

---

## 2. Definizione

**Anti-Abuso API** è il primo livello operativo di protezione della **HBCE IPR Runtime API v1** contro abuso automatico, traffico eccessivo e consumo incontrollato delle risorse.

Il modulo dimostra che l'API non è soltanto esposta come endpoint tecnico, ma viene governata come superficie SaaS misurabile, limitata e tracciabile.

In scenari SaaS, B2B e B2G, una API non può essere trattata come un canale aperto senza vincoli, perché ogni chiamata può consumare runtime, database, audit, model usage, eventi tecnici e risorse operative.

Lasciare tutto illimitato sarebbe una scelta tecnicamente ingenua e commercialmente pericolosa.

---

## 3. Formula operativa

```txt
Anti-Abuso API
=
rate limit
+
quota
+
fail-closed
+
protezione costi
+
protezione runtime
+
controllo accesso/consumo
+
tracciabilità tecnica
```

---

## 4. Cosa dimostra lo smoke test

Il **rate limit/quota smoke test** dimostra che **HBCE IPR Runtime API v1** integra un primo livello operativo di protezione contro:

- abuso automatico;
- traffico eccessivo;
- consumo incontrollato delle risorse;
- saturazione degli endpoint;
- uso improprio da script o client non governati;
- incremento non controllato dei costi operativi;
- consumo non governato del runtime AI;
- carico eccessivo su database, audit trail, eventi, OPC e model usage.

Il test non pretende di certificare una sicurezza assoluta.

Il suo valore è più preciso: dimostra che la superficie API inizia a comportarsi come una API SaaS governata, cioè limitata, misurabile e progettata per fallire in modo controllato quando viene usata oltre soglia.

---

## 5. Perché è importante per aziende, SaaS, B2B e B2G

In un contesto aziendale, il cliente non acquista soltanto una funzione API.

Acquista continuità, controllo, prevedibilità, costo governato e riduzione del rischio operativo.

Il modulo **Anti-Abuso API** rende la HBCE IPR Runtime API v1 più adatta a scenari professionali perché introduce una base tecnica per:

- limitare le richieste eccessive;
- proteggere il servizio da abuso automatico;
- ridurre il rischio di saturazione;
- proteggere i costi del runtime AI;
- collegare consumo e responsabilità tecnica;
- preparare piani SaaS basati su quota;
- rendere il servizio più affidabile per clienti e partner;
- sostenere audit, controllo e rendicontazione operativa.

In termini di prodotto, Anti-Abuso API trasforma l'accesso API da semplice esposizione tecnica a servizio misurabile, limitato e più affidabile.

---

## 6. Superficie API coinvolta

Lo smoke test è collegato alla protezione della superficie pubblica API v1, con particolare attenzione a endpoint come:

```txt
/api/v1/chat
/api/v1/ipr/session
```

e, per estensione architetturale, alla governance della superficie:

```txt
/api/v1/files
/api/v1/source-intelligence
/api/v1/events
/api/v1/opc
/api/v1/audit
/api/v1/model-usage
```

Il principio operativo è semplice: ogni endpoint pubblico deve essere compatibile con una politica di consumo controllato.

---

## 7. Segnali tecnici attesi

Lo script collegato deve poter esporre segnali come:

```txt
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_FAIL
RATE_LIMIT_EXCEEDED
chat without key fail-closed
bounded rate-limit probe
HBCE_API_V1_RATE_LIMIT_PROBE
```

Questi segnali permettono di distinguere un comportamento corretto da un comportamento aperto, ambiguo o non governato.

---

## 8. Comportamento fail-closed

Il comportamento corretto del modulo Anti-Abuso API segue il principio **fail-closed**.

Questo significa che, quando una richiesta non è autorizzata, supera i limiti o non rispetta le condizioni minime di accesso, il sistema deve bloccare o limitare l'operazione invece di procedere in modo permissivo.

In una API collegata a runtime AI, eventi, audit, IPR, OPC e consumo modello, il fail-closed non è un dettaglio. È una condizione minima di sopravvivenza tecnica.

---

## 9. Valore prodotto

Il valore del modulo non è soltanto tecnico. È anche commerciale.

Anti-Abuso API abilita:

```txt
piani SaaS basati su quota
accesso cliente governato
riduzione del rischio operativo
protezione dei costi runtime
controllo del consumo AI
tracciabilità dell'utilizzo
maggiore affidabilità B2B/B2G
```

Senza rate limit e quota, una API pubblica resta un endpoint esposto.

Con rate limit, quota e fail-closed, la stessa API inizia a diventare un servizio governato.

---

## 10. Posizionamento nella HBCE IPR Runtime API v1

Dentro la superficie API v1, Anti-Abuso API si posiziona come modulo trasversale di protezione consumo.

```txt
HBCE IPR Runtime API v1
├─ IPR Session
├─ Chat Runtime
├─ Files Workflow
├─ Source Intelligence
├─ Events / OPC / Audit
├─ Model Usage
└─ Anti-Abuso API
   ├─ Rate limit
   ├─ Quota
   ├─ Fail-closed
   ├─ Abuse detection base
   └─ Cost/runtime protection
```

Questo significa che Anti-Abuso API non è un endpoint isolato, ma un livello di controllo sopra la superficie pubblica del runtime.

---

## 11. Boundary

Anti-Abuso API non costituisce certificazione legale, assicurativa o pubblica.

```txt
legalCertification=false
OPC=technical proof receipt only
IPR=operational identity/proof layer only
EVT=technical event trace only
```

Il modulo produce evidenza tecnica e controllo operativo, non certificazione giuridica.

---

## 12. Comando di verifica

Eseguire:

```bash
node --check scripts/test-api-v1-rate-limit-quota.mjs
```

Se lo script è sintatticamente valido, il controllo Node deve terminare senza errori.

Il test operativo completo può essere eseguito in ambiente configurato con le variabili richieste dal client API v1.

---

## 13. Formula finale

```txt
Anti-Abuso API
=
primo livello operativo di protezione della HBCE IPR Runtime API v1
contro abuso automatico, traffico eccessivo e consumo incontrollato delle risorse.
```

In termini SaaS:

```txt
Anti-Abuso API
=
accesso API governato
+
costo controllato
+
runtime protetto
+
cliente più assicurabile
+
servizio più vendibile
```

---

## 14. Stato prodotto

```txt
ANTI_ABUSO_API_DOCUMENTATION_READY
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
legalCertification=false
OPC=technical proof receipt only

# 🜏 HBCE EU Synthetic Certification Pack V0.1 CANDIDATE

**Stato:** `DESIGN_CANDIDATE | SYNTHETIC_ONLY | LEGAL_VALIDITY=NONE | G0=HOLD | WP01=HOLD | RELEASE=NOT_GRANTED`.

## Scopo
Simulare, senza dati personali reali, una catena documentale B2B composta da otto attestazioni (`HBCE-SYN-01`–`08`). Il pacchetto **non** emette certificati qualificati eIDAS, certificati IPR operativi, identità verificate, firme elettroniche valide, né autorizzazioni a missioni o JOKER-C2. Non interagisce con servizi esterni.

## Esecuzione isolata
Richiede Python 3.10+; nessuna dipendenza aggiuntiva.

```bash
python3 -m unittest -v test_hbce_synthetic.py
python3 hbce_synthetic.py emit /tmp/hbce-demo-synthetic-001
python3 hbce_synthetic.py verify /tmp/hbce-demo-synthetic-001
```

`emit` rifiuta la sovrascrittura della directory di destinazione. `verify` ricalcola hash SHA-256 su JSON canonico **locale** (`sort_keys`, separatori compatti, UTF-8): **non** implementa RFC 8785/JCS, firma digitale o verifica crittografica di un emittente attendibile. Un attaccante che possa riscrivere i file può ricalcolare tutti gli hash: l'integrità qui è un controllo di coerenza, non prova di autenticità. La verifica delle revoche non è implementata.

## Regole d'integrazione
1. Ambiente e issuer sintetici isolati dal protocollo `HBCE-IPR-RELEASE-v3`.
2. Qualsiasi gate di produzione deve respingere `HBCE-EU-SYNTHETIC-v0.1`, i marker `SYNTHETIC_TEST` e `TEST-ONLY-NOT-A-VAT-NUMBER`.
3. Il test non può essere utilizzato per accesso reale, attivazione tenant o delega di autorità.
4. L'automazione del passaggio tra fasi 01–09 è **da implementare e collaudare** nell'app IPR; questo pacchetto non modifica l'app.
5. Prima del rilascio: gestione credenziali e custodia server-side, trust anchor, firme, revoche, scadenze, idempotenza, audit append-only, test end-to-end, GDPR/DPIA ove applicabile e revisione legale.

## Criteri di accettazione futuri
- Onboarding B2B sintetico completo senza upload manuale di certificati intermedi.
- Ripresa sessione dopo perdita dispositivo senza duplicare identità.
- Separazione soggetto biologico / organizzazione / rappresentanza / mandato.
- Ogni certificato emesso solo dopo gate pertinente, con verifica lato server.
- Zero accettazioni di attestazioni sintetiche sui gate produttivi.

## Limiti legali
Il documento `LEGAL_BOUNDARY.md` è una **bozza di dichiarazione interna**, non un parere legale o un certificato UE. Qualsiasi affermazione di conformità richiede verifica indipendente rispetto al quadro normativo e alle caratteristiche effettive del servizio.

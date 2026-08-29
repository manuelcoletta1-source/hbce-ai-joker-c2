# IPR Password Recovery — Production Self-Pilot Result

**Organization:** HERMETICUM B.C.E. S.r.l.
**Repository:** `hbce-ai-joker-c2`
**Branch:** `main`
**Environment:** Vercel Production
**Database schema:** `HBCE-IPR-DB-v1.13`
**Persistence:** `DATABASE_PERSISTENT`
**Date:** `2026-08-29`
**Status:** `PASS`
**legalCertification:** `false`

## Commit anchor

`8767b7c52bc02b1c20fc84ef3ff55c22fd03e058`

`feat(auth): add governed production recovery grant issuer`

## Purpose

This record documents the controlled Production self-pilot of the governed HBCE IPR password recovery flow.

The tested chain was:

```text
persistent database preflight
→ governed server-side recovery authority
→ one-use PASSWORD_ROTATION grant
→ existing credential rotation
→ grant consumption
→ explicit post-recovery login
→ persistent session creation
→ independent server-side session verification
→ Production redeploy
→ session persistence verification after redeploy
→ recovery grant issuer returned fail-closed
→ local transient secret cleanup
```

## Production preflight

Observed:

```text
persistentSubjectExists=true
persistentProfileExists=true
persistentCredentialExists=true
databaseReadOnly=true
schemaMutation=false
readyForGovernedGrantIssuance=true
legalCertification=false
```

Observed at:

`2026-08-29T14:47:00.556Z`

The preflight confirmed the persistent Production subject, profile and credential without performing credential mutation or grant issuance.

## Governed recovery grant

Observed:

```text
status=IPR_PASSWORD_RECOVERY_GRANT_ISSUED
scope=PASSWORD_ROTATION
ttlSeconds=900
oneUse=true
authorityVerified=true
publicSelfService=false
authoritySecretAcceptedOverHttp=false
sessionCreation=false
automaticLogin=false
legalCertification=false
```

Grant issued at:

`2026-08-29T15:58:09.731Z`

No raw recovery token or authority secret is recorded in this evidence document.

## Password recovery transaction

Observed Production result:

```text
HTTP_STATUS=200
status=IPR_PASSWORD_RECOVERY_COMMITTED
operation=ROTATE_EXISTING_PASSWORD
grantConsumed=true
transactionCommitted=true
sessionCreated=false
automaticLogin=false
loginRequired=true
legalCertification=false
```

Password update observed at:

`2026-08-29T16:01:14.383Z`

Declared transaction boundary:

```text
isolationLevel=SERIALIZABLE
credentialMutation=UPDATE_EXISTING_ONLY
subjectSessionRevocation=ALL_ACTIVE_SESSIONS
automaticLogin=false
```

`transactionCommitted=true` and `grantConsumed=true` were directly observed.

`ALL_ACTIVE_SESSIONS` is the executed implementation contract. This Production self-pilot did not independently replay a captured pre-recovery session after rotation.

No plaintext password is recorded in this evidence document.

## Explicit post-recovery login

Observed:

```text
HTTP_STATUS=200
authenticated=true
authorized=true
mode=LOGIN
runtimeIpr=IPR-AI-0001
accessDecision=ACCESS_GRANTED
accessScope=JOKER_C2_ACCESS
identityBinding=IPR_VERIFIED_BIOLOGICAL_SUBJECT
matrixState=MATRIX_ACTIVE
semanticMemoryScope=IPR_BOUND
persistenceMode=DATABASE_PERSISTENT
LOGIN_VERIFIED=true
legalCertification=false
```

Persistent session created:

```text
sessionId=IPR-SESSION-5001C4043473A684CF9A412E
status=ACTIVE
createdAt=2026-08-29T16:05:51.096Z
expiresAt=2026-09-05T16:05:51.095Z
```

The session cookie value is intentionally absent from this record.

## Independent session verification

Observed through `/api/auth/session`:

```text
HTTP_STATUS=200
ok=true
authenticated=true
sessionAuthenticated=true
reason=SESSION_ACTIVE
authorized=true
SESSION_VERIFIED=true
```

Observed session state:

```text
sessionId=IPR-SESSION-5001C4043473A684CF9A412E
status=ACTIVE
lastSeenAt=2026-08-29T16:09:03.877Z
```

This independently confirmed server-side validation of the newly created persistent session after recovery.

## Production closure and redeploy proof

After successful recovery, the dedicated Production invocation variable:

`HBCE_PASSWORD_RECOVERY_ISSUER_INVOCATION_SECRET`

was removed from the Production environment.

Production was then redeployed.

Final deployment reference:

`dpl_C9osxCWd8tp1VB1F5dfU8H6ydA1r`

Canonical runtime alias:

`https://hbce-ai-joker-c2.vercel.app`

Post-redeploy grant issuer result:

```text
HTTP_STATUS=503
REASON=RECOVERY_GRANT_ISSUER_AUTHORITY_UNAVAILABLE
ISSUER_FAIL_CLOSED=true
```

The administrative recovery-grant issuance surface therefore returned to a fail-closed state after the controlled maintenance operation.

## Persistent session across redeploy

The authenticated session created before redeploy was verified again after the Production redeploy.

Observed:

```text
HTTP_STATUS=200
REASON=SESSION_ACTIVE
SESSION_STATUS=ACTIVE
SESSION_ID=IPR-SESSION-5001C4043473A684CF9A412E
LAST_SEEN_AT=2026-08-29T16:21:17.202Z
SESSION_SURVIVED_REDEPLOY=true
```

Final end-to-end marker:

```text
HBCE_RECOVERY_PRODUCTION_E2E=PASS
```

## Local transient secret cleanup

The following local transient artifacts were explicitly destroyed after the Production self-pilot:

```text
/tmp/hbce-post-recovery-session.cookies
/tmp/hbce-password-recovery-grant.token
/tmp/hbce-password-recovery-issuer-invocation.secret
/tmp/hbce-new-ipr-password.secret
/tmp/hbce-login-password.secret
```

Observed cleanup state:

```text
/tmp/hbce-post-recovery-session.cookies=DESTROYED
/tmp/hbce-password-recovery-grant.token=DESTROYED
/tmp/hbce-password-recovery-issuer-invocation.secret=DESTROYED
/tmp/hbce-new-ipr-password.secret=DESTROYED
/tmp/hbce-login-password.secret=DESTROYED
```

This evidence record contains no plaintext password, raw recovery token, raw session cookie, recovery authority secret, issuer invocation secret, database credential, password hash, password salt or session-token hash.

## Evidence limitations

The following properties were not independently exercised in this specific Production sequence:

```text
consumed recovery token replay
old-password negative login
pre-recovery session replay after credential rotation
concurrent competing recovery transactions
external penetration testing
external regulatory or legal validation
```

No claim is escalated from an implementation contract or automated test into directly observed Production evidence.

## Boundary and non-claims

This record is internal technical-operational evidence for HERMETICUM B.C.E. R&D.

It does not constitute or claim:

```text
legal certification
eIDAS qualification
qualified electronic signature
qualified electronic timestamp
public authority identity issuance
regulatory approval
external audit certification
formal penetration-test certification
legally binding evidence status by itself
```

`legalCertification=false`

No new EVT identifier or OPC receipt is claimed by this document because no separate recovery-specific EVT/OPC artifact has yet been independently emitted and verified.

## Final result

The Production self-pilot completed successfully.

The observed recovery lifecycle was:

```text
PERSISTENT_DB_PREFLIGHT
→ SERVER_SIDE_RECOVERY_AUTHORITY
→ ONE_USE_RECOVERY_GRANT
→ SERIALIZABLE_PASSWORD_ROTATION
→ GRANT_CONSUMED
→ NO_AUTOMATIC_LOGIN
→ EXPLICIT_LOGIN
→ PERSISTENT_SESSION
→ INDEPENDENT_SESSION_VERIFICATION
→ PRODUCTION_REDEPLOY
→ SESSION_PERSISTENCE
→ RECOVERY_ISSUER_FAIL_CLOSED
→ LOCAL_SECRET_CLEANUP
```

Final operational state:

```text
HBCE_RECOVERY_PRODUCTION_E2E=PASS
legalCertification=false
```

## Maintainer statement

This record documents an internal HERMETICUM B.C.E. R&D Production self-pilot of the AI JOKER-C2 governed IPR password recovery mechanism.

The evidence is technical, operational and audit-oriented.

It is intended to support repeatability, reconstruction, engineering review and later evidence-chain integration.

It does not replace independent security assessment, legal review, regulated trust services, external audit or institutional validation.

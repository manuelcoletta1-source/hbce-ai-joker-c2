# HBCE Runtime Level 9

## External Effect Idempotency and Transactional Outbox

**Artifact ID:**  
`HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0`

**Runtime Level:**  
`HBCE_RUNTIME_LEVEL_9`

**Product:**  
`HBCE IPR Operational Identity & Proof Layer`

**Runtime:**  
`AI_JOKER_C2_SAAS_CORE_v0_1`

**Evidence class:**  
`INTERNAL_TECHNICAL_RUNTIME_EVIDENCE`

**Legal certification:**  
`false`

---

# 1. Purpose

HBCE Runtime Level 9 verifies that one durable logical operation produces one canonical persistent effect, one transactional outbox record and one technical OPC closure receipt, including when the runtime is interrupted after the persistent effect has been committed but before the workflow checkpoint has been updated.

The critical failure window is:

```text
EXTERNAL_EFFECT_WRITTEN
+
OUTBOX_WRITTEN
+
DATABASE_TRANSACTION_COMMITTED
+
WORKFLOW_CHECKPOINT_NOT_UPDATED
+
CONTROLLED_INTERRUPTION
+
RECOVERY_BY_SECOND_WORKER

The recovery worker must detect that the effect already exists, validate its identity and hashes, reconcile the associated outbox record and resume the workflow without producing duplicate persistent state.


---

2. Architectural mutation

The single architectural mutation introduced by Level 9 is:

PERSISTENT_EXTERNAL_EFFECT_IDEMPOTENCY_AND_TRANSACTIONAL_OUTBOX_RECONCILIATION

Level 9 does not modify:

the IPR identity model;

authorization policy;

human authorization requirements;

operation ID semantics;

the Level 8 durable state machine;

the recovery lease algorithm;

heartbeat semantics;

maximum-attempt policy;

raw-text persistence boundaries;

legal certification boundaries;

unrelated business workflows.



---

3. Relationship with Level 8

Level 8 verified that an interrupted durable workflow could be detected, leased exclusively to a recovery worker and resumed from a persistent checkpoint.

Level 9 extends that guarantee to persistent effects.

Level 8 answers:

Can the workflow resume after an interruption?

Level 9 answers:

Can the workflow resume without writing the same persistent effect twice?

The resulting progression is:

LEVEL 8
Durable workflow recovery

↓

LEVEL 9
Durable workflow recovery
+
persistent-effect idempotency
+
transactional outbox
+
recovery reconciliation
+
technical OPC closure


---

4. Runtime boundary

The Level 9 self-test declares the following boundary:

{
  "legalCertification": false,
  "technicalRuntimeTestOnly": true,
  "space": "HBCE_PRODUCTION_RUNTIME",
  "usesDurableOperationRegistry": true,
  "usesDurableStateMachine": true,
  "usesCheckpointPersistence": true,
  "usesExclusiveRecoveryLease": true,
  "usesHeartbeat": true,
  "rejectsCompetingRecoveryWorker": true,
  "idempotencyRequired": true,
  "usesPersistentExternalEffect": true,
  "usesUniqueEffectConstraint": true,
  "usesTransactionalOutbox": true,
  "usesRecoveryReconciliation": true,
  "performsControlledCrashInjection": true,
  "performsRealProcessTermination": false,
  "performsRealModelCall": false,
  "createsTemporaryPersistentTestData": true,
  "testRecordRetained": false,
  "opcGeneratedAtClosure": true,
  "replacesDisasterRecoveryTesting": false,
  "replacesMultiRegionFailoverTesting": false,
  "replacesHumanReview": false,
  "externalDeliverySemantics": "AT_LEAST_ONCE_DELIVERY_WITH_IDEMPOTENT_CONSUMER_REQUIREMENT"
}


---

5. Persistent data model

Level 9 uses four persistent runtime structures.

5.1 Durable operation registry

runtime_operations

This table already belongs to the Level 8 durable workflow layer.

It stores:

canonical operation ID;

idempotency key;

current operation status;

current checkpoint;

recovery status;

attempt count;

recovery count;

lease ownership;

lease token;

heartbeat;

state hash;

chain hash;

interruption reason;

completion reason;

terminal timestamps;

legal_certification = false.



---

5.2 Persistent effects

runtime_operation_effects

This table stores the canonical internal registration of a runtime effect.

Required uniqueness guarantees:

UNIQUE (operation_id, effect_type)
UNIQUE (idempotency_key, effect_type)

These constraints prevent:

two effects of the same type for one operation;

two operations from producing the same effect under one idempotency key.


The table does not persist raw model output.

It stores deterministic hashes and technical metadata only.


---

5.3 Transactional outbox

runtime_operation_outbox

The outbox stores the event associated with a persistent runtime effect.

Required uniqueness guarantee:

UNIQUE (operation_id, event_type)

The effect and outbox record must be created in one database transaction:

BEGIN

INSERT runtime_operation_effects

INSERT runtime_operation_outbox

COMMIT

Any failure must cause:

ROLLBACK

The system must not accept the state:

EFFECT_COMMITTED
OUTBOX_MISSING

If such a historical inconsistency is detected, recovery must enter:

RECONCILIATION_REQUIRED


---

5.4 OPC closure receipts

runtime_operation_opc_receipts

This table stores the internal technical receipt created when the recovered workflow reaches closure.

Required uniqueness guarantee:

UNIQUE (operation_id, receipt_type)

The receipt contains:

operation ID;

hashed idempotency key;

effect hash;

outbox hash;

final state hash;

final chain hash;

recovery count;

attempt count;

completion timestamp;

legal_certification = false.


The receipt is technical runtime evidence.

It is not a legal certificate.


---

6. Canonical test effect

The Level 9 self-test uses one temporary synthetic effect:

HBCE_RUNTIME_TEST_LEDGER_ENTRY

Canonical payload:

{
  "operationId": "<canonical-operation-id>",
  "effectType": "HBCE_RUNTIME_TEST_LEDGER_ENTRY",
  "effectVersion": "v1_0",
  "result": "TECHNICAL_TEST_EFFECT",
  "legalCertification": false
}

The test uses no personal data, business data or raw model output.

The payload is canonically serialized and hashed before persistence.


---

7. Hash semantics

Level 9 calculates deterministic SHA-256 hashes for:

canonical effect payload;

persistent effect;

transactional outbox record;

final operation state;

OPC receipt;

final evidence chain.


All hashes use the prefix:

sha256:

Canonical serialization must:

sort object keys;

preserve array order;

normalize null values;

exclude volatile, non-deterministic fields unless explicitly required;

avoid locale-dependent formatting;

avoid raw sensitive content.


The chain relationship is logically represented as:

currentChainHash =
SHA256(
  previousChainHash
  +
  canonicalStatePayload
  +
  currentStateHash
)

The implementation may use an equivalent deterministic canonical representation.


---

8. Self-test sequence

The Level 9 self-test contains sixteen required checks.

Check 1: Runtime configuration

Verifies:

persistent database configuration;

persistent pooled session;

BEGIN, COMMIT and ROLLBACK;

durable operation table;

effect table;

outbox table;

OPC table;

required unique constraints;

recovery helper;

reconciliation helper.


Expected status:

PASS


---

Check 2: Durable operation creation

Creates one canonical operation with:

operationStatus = NEW
checkpoint = NEW
recoveryStatus = NOT_REQUIRED
attemptCount = 0
recoveryCount = 0
maxAttempts = 3
legalCertification = false

Expected status:

PASS


---

Check 3: Durable idempotency replay

Repeats operation creation with:

the same idempotency key;

a different requested operation ID.


Expected result:

sameCanonicalOperation = true

No second logical operation may be created.


---

Check 4: Pre-effect workflow advance

Advances the durable workflow through:

NEW
AUTHORIZED
RUNNING
MODEL_COMPLETED
LEDGER_PENDING

The model call is simulated.

No real model call is performed.


---

Check 5: Persistent effect write

Creates, inside one database transaction:

one persistent effect;

one transactional outbox record.


Expected counts:

effectCount = 1
outboxCount = 1

The workflow checkpoint remains LEDGER_PENDING.


---

Check 6: Controlled crash after effect commit

After the effect and outbox transaction commits, the workflow is moved to:

operationStatus = INTERRUPTED
checkpoint = INTERRUPTED
recoveryStatus = REQUIRED

Interruption reason:

HBCE_CONTROLLED_CRASH_AFTER_EXTERNAL_EFFECT_COMMIT

No real process termination is performed.


---

Check 7: Recovery need detection

The recovery helper must return:

recover = true

Accepted reasons:

INTERRUPTED_OPERATION

or:

STALE_HEARTBEAT


---

Check 8: Exclusive recovery lease

The recovery worker acquires the operation lease.

Expected state:

operationStatus = RECOVERING
checkpoint = RECOVERING
recoveryStatus = LEASE_ACQUIRED
recoveryCount = 1


---

Check 9: Competing-worker rejection

A second recovery worker attempts to acquire the same lease.

Expected result:

competingLeaseAccepted = false
competingError = RECOVERY_LEASE_NOT_ACQUIRED


---

Check 10: Effect reconciliation

The recovery worker queries the persistent effect registry before performing any write.

Expected result:

existingEffectFound = true
existingEffectValid = true
existingOutboxFound = true
effectReused = true
newEffectCreated = false

Required counts:

effectCountBeforeRecovery = 1
effectCountAfterRecovery = 1
outboxCountBeforeRecovery = 1
outboxCountAfterRecovery = 1


---

Check 11: Unique-constraint guard

The self-test attempts a second insertion of the same logical effect.

Expected result:

duplicateEffectAccepted = false

The database unique constraints or normalized idempotency logic must reject the operation.

Final counts must remain:

effectCount = 1
outboxCount = 1


---

Check 12: Workflow resumption

The workflow resumes from the logical point:

EXTERNAL_EFFECT_ALREADY_COMMITTED

It advances through:

LEDGER_COMPLETED
OPC_PENDING

The recovery attempt increments:

attemptCount = 2
recoveryCount = 1

The following actions must not be repeated:

model call;

persistent-effect creation;

outbox creation.



---

Check 13: OPC closure

One technical OPC receipt is created.

The workflow advances through:

OPC_COMPLETED
COMPLETED

The recovery lease is then released.

Expected final lease state:

leaseOwner = null
leaseTokenPresent = false
heartbeatAt = null
leaseExpiresAt = null


---

Check 14: Completed replay guard

The same idempotency key is replayed after completion.

Expected result:

canonicalOperationReturned = true
operationAlreadyCompleted = true
newEffectCreated = false
newOutboxCreated = false
newOpcCreated = false

Required counts:

operationCount = 1
effectCount = 1
outboxCount = 1
opcCount = 1


---

Check 15: Final-state verification

Required terminal state:

{
  "operationStatus": "COMPLETED",
  "checkpoint": "COMPLETED",
  "recoveryStatus": "RECOVERED",
  "attemptCount": 2,
  "recoveryCount": 1,
  "leaseReleased": true,
  "effectCount": 1,
  "outboxCount": 1,
  "opcCount": 1,
  "duplicateLogicalExecution": false,
  "duplicatePersistentEffect": false,
  "legalCertification": false
}


---

Check 16: Cleanup

The self-test deletes only the temporary synthetic records that it created.

Expected result:

remainingOperation = null
remainingEffect = null
remainingOutbox = null
remainingOpc = null

Failure to clean up is a required-check failure.


---

9. Fail-closed conditions

The Level 9 test must return FAIL when:

the database is not configured;

persistent transactions are unavailable;

a required table is missing;

a required unique constraint is missing;

effect and outbox are not written atomically;

the competing worker acquires the lease;

the persistent effect cannot be reconciled;

a duplicate effect is accepted;

a duplicate outbox record is accepted;

a duplicate OPC receipt is accepted;

the recovery worker repeats the model call;

persistent counts differ from the expected values;

deterministic hashes do not match;

the lease is not released;

cleanup fails;

any required check is skipped.


A failure must not be converted into a successful result by fallback logic.


---

10. Exactly-once semantics

Level 9 does not claim absolute exactly-once execution across arbitrary external distributed systems.

The permitted claim is limited to the HBCE persistent transaction boundary.

The self-test verifies:

one canonical logical operation
one internal persistent effect registration
one transactional outbox record
one technical OPC closure receipt

External delivery semantics remain:

AT_LEAST_ONCE_DELIVERY_WITH_IDEMPOTENT_CONSUMER_REQUIREMENT

Therefore Level 9 separates four concepts:

logical execution
persistent effect registration
event delivery
external side effect

Exactly-once is demonstrated only for canonical internal persistence within the tested HBCE database boundary.


---

11. API endpoint

Endpoint:

POST /api/v1/runtime/self-test/external-effect-idempotency

The endpoint uses POST because it creates temporary persistent records.

Production execution requires authorization through:

Authorization: Bearer <HBCE_RUNTIME_SELF_TEST_SECRET>

or:

x-hbce-runtime-self-test-secret: <HBCE_RUNTIME_SELF_TEST_SECRET>

Unauthenticated production requests must return:

401
HBCE_RUNTIME_SELF_TEST_UNAUTHORIZED

A GET request must return:

405 METHOD_NOT_ALLOWED


---

12. Environment variables

The runtime requires one supported database variable:

DATABASE_URL

or:

POSTGRES_URL

or:

NEON_DATABASE_URL

Production authorization requires:

HBCE_RUNTIME_SELF_TEST_SECRET

Persistent integration tests require:

HBCE_LEVEL9_INTEGRATION_TEST=true

A separate test database may be provided through:

TEST_DATABASE_URL


---

13. Integration-test execution

Recommended command:

HBCE_LEVEL9_INTEGRATION_TEST=true \
DATABASE_URL="$DATABASE_URL" \
npx vitest run tests/runtime/runtime-level9-external-effect-idempotency.test.ts

The test is skipped unless:

HBCE_LEVEL9_INTEGRATION_TEST = true

and a database URL is configured.

This prevents accidental persistent writes during ordinary local test execution.


---

14. Production endpoint execution

Example:

curl -X POST \
  -H "Authorization: Bearer $HBCE_RUNTIME_SELF_TEST_SECRET" \
  -H "Content-Type: application/json" \
  https://hbce-ai-joker-c2.vercel.app/api/v1/runtime/self-test/external-effect-idempotency

No request body is required unless later authorization policy introduces one.


---

15. Required successful result

The milestone is verified only when the runtime returns:

ok = true
status = HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_PASS
operationalStatus = PASS

Required summary:

{
  "totalChecks": 16,
  "passedChecks": 16,
  "failedChecks": 0,
  "skippedChecks": 0,
  "requiredChecks": 16,
  "requiredPassed": 16,
  "requiredFailed": 0
}

The duration must be measured from the actual execution.

A hard-coded duration or hard-coded PASS is not accepted.


---

16. Permitted technical claim

> The HBCE AI JOKER-C2 runtime passed an internal technical persistent-effect idempotency test. After the transactional registration of one effect and its corresponding outbox record, the workflow was interrupted before its checkpoint update. A second worker acquired an exclusive recovery lease, reconciled the already persisted effect and completed the operation without creating a second logical operation, persistent effect, outbox record or OPC receipt. The test is not a legal certification, multi-region disaster-recovery proof or exactly-once guarantee for external systems outside the HBCE transactional boundary.




---

17. Limitations

Level 9 does not verify:

real Vercel process termination;

real model invocation;

external message-broker delivery;

idempotency of third-party consumers;

cross-region database failover;

multi-region application failover;

database backup restoration;

regional network partition recovery;

permanent business-data creation;

legal certification;

regulatory conformity assessment;

replacement of human review.


These capabilities require separate milestones and separate evidence.


---

18. Files introduced by Level 9

database/migrations/20260804_1406_runtime_level_9_external_effect_idempotency.sql

src/runtime/types/runtime-external-effect.ts

src/runtime/repositories/runtime-operation-effects.repository.ts

src/runtime/helpers/runtime-transactional-outbox.ts

src/runtime/helpers/runtime-effect-reconciliation.ts

src/runtime/helpers/runtime-opc-closure.ts

src/runtime/self-tests/hbce-runtime-external-effect-idempotency-self-test.ts

src/runtime/adapters/neon-runtime-level9.adapter.ts

src/app/api/v1/runtime/self-test/external-effect-idempotency/route.ts

tests/runtime/runtime-level9-external-effect-idempotency.test.ts

docs/runtime/HBCE-RUNTIME-LEVEL-9-EXTERNAL-EFFECT-IDEMPOTENCY.md


---

19. Milestone status

Before real execution:

HBCE_RUNTIME_LEVEL_9
SPECIFICATION: COMPLETE
IMPLEMENTATION: COMPLETE
DATABASE MIGRATION: PENDING VERIFICATION
RUNTIME EXECUTION: NOT YET VERIFIED
STATUS: PENDING_RUNTIME_EVIDENCE
LEGAL_CERTIFICATION: FALSE

After a real successful execution:

HBCE_RUNTIME_LEVEL_9
EXTERNAL_EFFECT_IDEMPOTENCY_AND_TRANSACTIONAL_OUTBOX
STATUS: VERIFIED_PASS
EVIDENCE_CLASS: INTERNAL_TECHNICAL_RUNTIME_EVIDENCE
LEGAL_CERTIFICATION: FALSE

The second status is authorized only after receipt of the complete runtime JSON showing all sixteen required checks as PASS.




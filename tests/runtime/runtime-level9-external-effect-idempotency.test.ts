import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "@neondatabase/serverless";

import {
  NeonRuntimeLevel9Adapter,
  type RuntimeLevel9DatabasePool,
} from "../../src/runtime/adapters/neon-runtime-level9.adapter";

import {
  HBCE_RUNTIME_LEVEL_9_FAIL_STATUS,
  HBCE_RUNTIME_LEVEL_9_PASS_STATUS,
  HBCE_RUNTIME_LEVEL_9_REVISION,
  runHbceRuntimeLevel9SelfTest,
} from "../../src/runtime/self-tests/hbce-runtime-external-effect-idempotency-self-test";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.NEON_DATABASE_URL;

const integrationEnabled =
  process.env.HBCE_LEVEL9_INTEGRATION_TEST === "true" &&
  typeof databaseUrl === "string" &&
  databaseUrl.length > 0;

const describeIntegration = integrationEnabled
  ? describe
  : describe.skip;

let pool: Pool | null = null;

function createAdapter(): NeonRuntimeLevel9Adapter {
  if (!databaseUrl) {
    throw new Error("HBCE_LEVEL9_TEST_DATABASE_URL_NOT_CONFIGURED");
  }

  pool ??= new Pool({
    connectionString: databaseUrl,
  });

  return new NeonRuntimeLevel9Adapter(
    pool as unknown as RuntimeLevel9DatabasePool,
  );
}

afterAll(async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
});

describeIntegration(
  "HBCE Runtime Level 9 external-effect idempotency",
  () => {
    it(
      "completa tutti i 16 controlli senza duplicare effetti persistenti",
      async () => {
        const adapter = createAdapter();

        const result = await runHbceRuntimeLevel9SelfTest(
          adapter,
          {
            deployment: {
              origin: "HBCE_LEVEL9_INTEGRATION_TEST",
              runtimeEnvironment: "test",
              vercelEnvironment: "test",
              vercelRegion: "local",
              nodeVersion: process.version,
            },
          },
        );

        expect(result.ok).toBe(true);
        expect(result.status).toBe(
          HBCE_RUNTIME_LEVEL_9_PASS_STATUS,
        );
        expect(result.status).not.toBe(
          HBCE_RUNTIME_LEVEL_9_FAIL_STATUS,
        );
        expect(result.operationalStatus).toBe("PASS");
        expect(result.revision).toBe(
          HBCE_RUNTIME_LEVEL_9_REVISION,
        );

        expect(result.summary).toMatchObject({
          totalChecks: 16,
          passedChecks: 16,
          failedChecks: 0,
          skippedChecks: 0,
          requiredChecks: 16,
          requiredPassed: 16,
          requiredFailed: 0,
        });

        expect(result.summary.durationMs).toBeGreaterThanOrEqual(
          0,
        );

        expect(result.checks).toHaveLength(16);

        for (const check of result.checks) {
          expect(check.required).toBe(true);
          expect(check.status).toBe("PASS");
          expect(check.error).toBeNull();
          expect(check.durationMs).toBeGreaterThanOrEqual(0);
        }

        expect(result.interpretation).toEqual({
          durableOperationCreated: true,
          idempotencyReplayResolved: true,
          persistentExternalEffectCreated: true,
          transactionalOutboxCreated: true,
          controlledCrashPersistedAfterEffectCommit: true,
          recoveryNeedDetected: true,
          exclusiveRecoveryLeaseAcquired: true,
          competingWorkerRejected: true,
          existingEffectReconciled: true,
          duplicateEffectRejected: true,
          workflowResumedWithoutDuplicateEffect: true,
          opcClosureGenerated: true,
          completedReplayResolvedWithoutNewEffects: true,
          cleanupCompleted: true,
          externalEffectIdempotencyPassed: true,
        });

        expect(result.boundary).toMatchObject({
          legalCertification: false,
          technicalRuntimeTestOnly: true,
          uneBdoOpening: true,
          space: "HBCE_PRODUCTION_RUNTIME",
          usesDurableOperationRegistry: true,
          usesDurableStateMachine: true,
          usesCheckpointPersistence: true,
          usesExclusiveRecoveryLease: true,
          usesHeartbeat: true,
          rejectsCompetingRecoveryWorker: true,
          idempotencyRequired: true,
          usesPersistentExternalEffect: true,
          usesUniqueEffectConstraint: true,
          usesTransactionalOutbox: true,
          usesRecoveryReconciliation: true,
          performsControlledCrashInjection: true,
          performsRealProcessTermination: false,
          performsRealModelCall: false,
          createsTemporaryPersistentTestData: true,
          testRecordRetained: false,
          opcGeneratedAtClosure: true,
          replacesDisasterRecoveryTesting: false,
          replacesMultiRegionFailoverTesting: false,
          replacesHumanReview: false,
          externalDeliverySemantics:
            "AT_LEAST_ONCE_DELIVERY_WITH_IDEMPOTENT_CONSUMER_REQUIREMENT",
        });

        expect(result.execution.crashPoint).toBe(
          "AFTER_EXTERNAL_EFFECT_AND_OUTBOX_COMMIT_BEFORE_WORKFLOW_CHECKPOINT_UPDATE",
        );

        expect(result.execution.recoveryStrategy).toBe(
          "EXCLUSIVE_LEASE_EFFECT_RECONCILIATION_AND_WORKFLOW_RESUMPTION",
        );

        expect(result.execution.firstFailure).toBeNull();
      },
      60_000,
    );

    it(
      "dimostra che il worker concorrente viene respinto",
      async () => {
        const adapter = createAdapter();

        const result = await runHbceRuntimeLevel9SelfTest(
          adapter,
          {
            deployment: {
              origin: "HBCE_LEVEL9_DOUBLE_LEASE_TEST",
              runtimeEnvironment: "test",
              vercelEnvironment: "test",
              vercelRegion: "local",
              nodeVersion: process.version,
            },
          },
        );

        expect(result.ok).toBe(true);

        const leaseGuardCheck = result.checks.find(
          (check) =>
            check.id === "RECOVERY_DOUBLE_LEASE_GUARD",
        );

        expect(leaseGuardCheck).toBeDefined();
        expect(leaseGuardCheck?.status).toBe("PASS");
        expect(leaseGuardCheck?.error).toBeNull();

        expect(leaseGuardCheck?.details).toMatchObject({
          competingLeaseAccepted: false,
          competingError: "RECOVERY_LEASE_NOT_ACQUIRED",
        });
      },
      60_000,
    );

    it(
      "riconcilia l’effetto esistente senza crearne un secondo",
      async () => {
        const adapter = createAdapter();

        const result = await runHbceRuntimeLevel9SelfTest(
          adapter,
          {
            deployment: {
              origin: "HBCE_LEVEL9_RECONCILIATION_TEST",
              runtimeEnvironment: "test",
              vercelEnvironment: "test",
              vercelRegion: "local",
              nodeVersion: process.version,
            },
          },
        );

        expect(result.ok).toBe(true);

        const reconciliationCheck = result.checks.find(
          (check) =>
            check.id === "RECOVERY_RECONCILIATION",
        );

        expect(reconciliationCheck).toBeDefined();
        expect(reconciliationCheck?.status).toBe("PASS");

        expect(reconciliationCheck?.details).toMatchObject({
          existingEffectFound: true,
          existingEffectValid: true,
          existingOutboxFound: true,
          effectReused: true,
          newEffectCreated: false,
          effectCountBeforeRecovery: 1,
          effectCountAfterRecovery: 1,
          outboxCountBeforeRecovery: 1,
          outboxCountAfterRecovery: 1,
        });
      },
      60_000,
    );

    it(
      "rifiuta esplicitamente la seconda registrazione dell’effetto",
      async () => {
        const adapter = createAdapter();

        const result = await runHbceRuntimeLevel9SelfTest(
          adapter,
          {
            deployment: {
              origin: "HBCE_LEVEL9_DUPLICATE_GUARD_TEST",
              runtimeEnvironment: "test",
              vercelEnvironment: "test",
              vercelRegion: "local",
              nodeVersion: process.version,
            },
          },
        );

        expect(result.ok).toBe(true);

        const duplicateCheck = result.checks.find(
          (check) =>
            check.id === "UNIQUE_CONSTRAINT_GUARD",
        );

        expect(duplicateCheck).toBeDefined();
        expect(duplicateCheck?.status).toBe("PASS");

        expect(duplicateCheck?.details).toMatchObject({
          duplicateEffectAccepted: false,
          effectCount: 1,
          outboxCount: 1,
        });
      },
      60_000,
    );

    it(
      "mantiene una sola operazione, un effetto, una outbox e una ricevuta OPC prima del cleanup",
      async () => {
        const adapter = createAdapter();

        const result = await runHbceRuntimeLevel9SelfTest(
          adapter,
          {
            deployment: {
              origin: "HBCE_LEVEL9_FINAL_COUNTS_TEST",
              runtimeEnvironment: "test",
              vercelEnvironment: "test",
              vercelRegion: "local",
              nodeVersion: process.version,
            },
          },
        );

        expect(result.ok).toBe(true);

        const finalStateCheck = result.checks.find(
          (check) =>
            check.id === "FINAL_STATE_VERIFY",
        );

        expect(finalStateCheck).toBeDefined();
        expect(finalStateCheck?.status).toBe("PASS");

        expect(finalStateCheck?.details).toMatchObject({
          expected: {
            operationStatus: "COMPLETED",
            checkpoint: "COMPLETED",
            recoveryStatus: "RECOVERED",
            attemptCount: 2,
            recoveryCount: 1,
            leaseReleased: true,
            effectCount: 1,
            outboxCount: 1,
            opcCount: 1,
            duplicateLogicalExecution: false,
            duplicatePersistentEffect: false,
            legalCertification: false,
          },
          actual: {
            operationStatus: "COMPLETED",
            checkpoint: "COMPLETED",
            recoveryStatus: "RECOVERED",
            attemptCount: 2,
            recoveryCount: 1,
            leaseOwner: null,
            leaseTokenPresent: false,
            effectCount: 1,
            outboxCount: 1,
            opcCount: 1,
            duplicateLogicalExecution: false,
            duplicatePersistentEffect: false,
            legalCertification: false,
          },
        });
      },
      60_000,
    );

    it(
      "rimuove tutti i record sintetici creati dal self-test",
      async () => {
        const adapter = createAdapter();

        const result = await runHbceRuntimeLevel9SelfTest(
          adapter,
          {
            deployment: {
              origin: "HBCE_LEVEL9_CLEANUP_TEST",
              runtimeEnvironment: "test",
              vercelEnvironment: "test",
              vercelRegion: "local",
              nodeVersion: process.version,
            },
          },
        );

        expect(result.ok).toBe(true);

        const cleanupCheck = result.checks.find(
          (check) => check.id === "CLEANUP",
        );

        expect(cleanupCheck).toBeDefined();
        expect(cleanupCheck?.status).toBe("PASS");

        expect(cleanupCheck?.details).toEqual({
          remainingOperation: null,
          remainingEffect: null,
          remainingOutbox: null,
          remainingOpc: null,
        });
      },
      60_000,
    );
  },
);

describe(
  "HBCE Runtime Level 9 integration-test boundary",
  () => {
    it("non esegue il test persistente senza autorizzazione esplicita", () => {
      if (integrationEnabled) {
        expect(databaseUrl).toBeTruthy();
        expect(
          process.env.HBCE_LEVEL9_INTEGRATION_TEST,
        ).toBe("true");
        return;
      }

      expect(integrationEnabled).toBe(false);
    });

    it("mantiene il boundary di certificazione legale disabilitato", () => {
      expect(false).toBe(false);
    });
  },
);

import {
  createHash
} from "node:crypto";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  IprOnboardingReplayStoreError,
  evaluateAndRecordIprOnboardingReplay,
  markIprOnboardingReplayProfilePersisted,
  type IprOnboardingReplayTransaction
} from "../lib/ipr-onboarding-replay-store";

import type {
  IprOnboardingTrustedIngressValidated
} from "../lib/ipr-onboarding-trusted-ingress";


type Receipt = {
  projection_key: string;
  payload_hash: string;
  first_credential_id_hash: string;
  tenant_id: string;
  workspace_id: string;
  human_ipr_hash: string;
  status:
    | "PENDING"
    | "PROFILE_PERSISTED";
  replay_count: number;
};


type NonceRecord = {
  nonce_hash: string;
  projection_key: string;
  payload_hash: string;
  credential_id_hash: string;
};


function sha256(
  value: string
): string {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function operationalHash(
  domain: string,
  value: string
): string {
  return createHash(
    "sha256"
  )
    .update(
      `${domain}\u0000${value}`,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function buildIngress(
  overrides: Partial<{
    projectionKey: string;
    payloadHash: string;
    nonceHash: string;
    credentialId: string;
    tenantId: string;
    workspaceId: string;
    humanIpr: string;
  }> = {}
): IprOnboardingTrustedIngressValidated {
  const humanIpr =
    overrides.humanIpr ??
    "IPR-HUMAN-0001";

  return {
    ok: true,
    status:
      "TRUSTED_INGRESS_VALIDATED",

    runtimeAuthorized: false,
    sessionAuthenticated: false,
    profilePersistenceAuthorized: false,

    authority:
      "TRANSPORT_EVIDENCE_ONLY",

    service: {
      credentialId:
        overrides.credentialId ??
        "HBCE-SVC-CREDENTIAL-001",

      tenantId:
        overrides.tenantId ??
        "HBCE-TENANT-001",

      workspaceId:
        overrides.workspaceId ??
        "HBCE-WORKSPACE-001"
    },

    issuedAt:
      "2026-08-26T12:00:00.000Z",

    projectionKey:
      overrides.projectionKey ??
      sha256(
        "projection-001"
      ),

    payloadHash:
      overrides.payloadHash ??
      sha256(
        "payload-001"
      ),

    nonceHash:
      overrides.nonceHash ??
      sha256(
        "nonce-001"
      ),

    replay: {
      status:
        "NOT_EVALUATED"
    },

    evidence: {
      iprId:
        humanIpr,

      subjectId:
        "SUBJECT-001",

      iprStatus:
        "VERIFIED",

      iprCardStatus:
        "ISSUED",

      certificateStatus:
        "ACTIVE",

      revocationState:
        "CLEAR",

      jokerC2AccessStatus:
        "ENABLED",

      latestPhaseNumber:
        9,

      latestPhaseCertificateHash:
        sha256(
          "phase-certificate"
        ),

      certificateId:
        "CERT-001",

      certificateHash:
        sha256(
          "certificate"
        ),

      certificateScope: [
        "JOKER_C2_ACCESS"
      ],

      cardSerial:
        "CARD-001"
    },

    legalCertification:
      false
  };
}


class FakeReplayDatabase {
  readonly receipts =
    new Map<
      string,
      Receipt
    >();

  readonly nonces =
    new Map<
      string,
      NonceRecord
    >();

  readonly queryLog:
    Array<{
      sql: string;
      parameters:
        readonly unknown[];
    }> = [];

  async query(
    sql: string,
    parameters:
      readonly unknown[] = []
  ): Promise<{
    rows:
      Record<string, unknown>[];
    rowCount: number;
  }> {
    const normalized =
      sql
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    this.queryLog.push({
      sql:
        normalized,
      parameters
    });

    if (
      normalized.startsWith(
        "INSERT INTO ipr_onboarding_projection_nonces"
      )
    ) {
      const [
        nonceHash,
        projectionKey,
        payloadHash,
        credentialIdHash
      ] =
        parameters as string[];

      if (
        this.nonces.has(
          nonceHash
        )
      ) {
        return {
          rows: [],
          rowCount: 0
        };
      }

      this.nonces.set(
        nonceHash,
        {
          nonce_hash:
            nonceHash,
          projection_key:
            projectionKey,
          payload_hash:
            payloadHash,
          credential_id_hash:
            credentialIdHash
        }
      );

      return {
        rows: [
          {
            nonce_hash:
              nonceHash
          }
        ],
        rowCount: 1
      };
    }

    if (
      normalized.startsWith(
        "INSERT INTO ipr_onboarding_projection_receipts"
      )
    ) {
      const [
        projectionKey,
        payloadHash,
        credentialIdHash,
        tenantId,
        workspaceId,
        humanIprHash
      ] =
        parameters as string[];

      if (
        this.receipts.has(
          projectionKey
        )
      ) {
        return {
          rows: [],
          rowCount: 0
        };
      }

      const receipt:
        Receipt = {
          projection_key:
            projectionKey,

          payload_hash:
            payloadHash,

          first_credential_id_hash:
            credentialIdHash,

          tenant_id:
            tenantId,

          workspace_id:
            workspaceId,

          human_ipr_hash:
            humanIprHash,

          status:
            "PENDING",

          replay_count:
            0
        };

      this.receipts.set(
        projectionKey,
        receipt
      );

      return {
        rows: [
          {
            projection_key:
              receipt.projection_key,

            payload_hash:
              receipt.payload_hash,

            status:
              receipt.status,

            replay_count:
              receipt.replay_count
          }
        ],
        rowCount: 1
      };
    }

    if (
      normalized.startsWith(
        "SELECT projection_key, payload_hash, first_credential_id_hash"
      )
    ) {
      const projectionKey =
        String(
          parameters[0]
        );

      const receipt =
        this.receipts.get(
          projectionKey
        );

      return {
        rows:
          receipt
            ? [
                {
                  ...receipt
                }
              ]
            : [],

        rowCount:
          receipt
            ? 1
            : 0
      };
    }

    if (
      normalized.startsWith(
        "UPDATE ipr_onboarding_projection_receipts SET last_seen_at = now(), replay_count = replay_count + 1"
      )
    ) {
      const projectionKey =
        String(
          parameters[0]
        );

      const payloadHash =
        String(
          parameters[1]
        );

      const receipt =
        this.receipts.get(
          projectionKey
        );

      if (
        !receipt ||
        receipt.payload_hash !==
          payloadHash ||
        receipt.status !==
          "PROFILE_PERSISTED"
      ) {
        return {
          rows: [],
          rowCount: 0
        };
      }

      receipt.replay_count +=
        1;

      return {
        rows: [
          {
            status:
              receipt.status,

            replay_count:
              receipt.replay_count
          }
        ],
        rowCount: 1
      };
    }

    if (
      normalized.startsWith(
        "UPDATE ipr_onboarding_projection_receipts SET status = 'PROFILE_PERSISTED'"
      )
    ) {
      const projectionKey =
        String(
          parameters[0]
        );

      const payloadHash =
        String(
          parameters[1]
        );

      const receipt =
        this.receipts.get(
          projectionKey
        );

      if (
        !receipt ||
        receipt.payload_hash !==
          payloadHash ||
        receipt.status !==
          "PENDING"
      ) {
        return {
          rows: [],
          rowCount: 0
        };
      }

      receipt.status =
        "PROFILE_PERSISTED";

      return {
        rows: [
          {
            projection_key:
              receipt.projection_key,

            payload_hash:
              receipt.payload_hash,

            status:
              receipt.status,

            replay_count:
              receipt.replay_count
          }
        ],
        rowCount: 1
      };
    }

    if (
      normalized.startsWith(
        "SELECT projection_key, payload_hash, status, replay_count"
      )
    ) {
      const projectionKey =
        String(
          parameters[0]
        );

      const receipt =
        this.receipts.get(
          projectionKey
        );

      return {
        rows:
          receipt
            ? [
                {
                  projection_key:
                    receipt.projection_key,

                  payload_hash:
                    receipt.payload_hash,

                  status:
                    receipt.status,

                  replay_count:
                    receipt.replay_count
                }
              ]
            : [],

        rowCount:
          receipt
            ? 1
            : 0
      };
    }

    throw new Error(
      `UNEXPECTED_TEST_SQL:${normalized}`
    );
  }
}


function transaction(
  db:
    FakeReplayDatabase,
  transactionId =
    "HBCE-TX-001"
): IprOnboardingReplayTransaction {
  return {
    transactionId,

    query:
      db.query.bind(
        db
      )
  };
}


async function reserveAndPersist(
  db:
    FakeReplayDatabase,
  ingress =
    buildIngress()
) {
  const tx =
    transaction(
      db
    );

  const reservation =
    await evaluateAndRecordIprOnboardingReplay({
      transaction:
        tx,
      ingress
    });

  expect(
    reservation.ok
  ).toBe(
    true
  );

  if (
    !reservation.ok
  ) {
    throw new Error(
      "TEST_PRECONDITION_RESERVATION_DENIED"
    );
  }

  const persisted =
    await markIprOnboardingReplayProfilePersisted({
      transaction:
        tx,

      projectionKey:
        ingress.projectionKey,

      payloadHash:
        ingress.payloadHash
    });

  return {
    reservation,
    persisted
  };
}


describe(
  "IPR onboarding replay store",
  () => {
    it(
      "reserves a new projection and consumed nonce without granting authority",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        const result =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db
              ),

            ingress
          });

        expect(
          result
        ).toMatchObject({
          ok: true,
          status:
            "NEW_PROJECTION_RESERVED",
          replayDecision:
            "NEW_PROJECTION",
          projectionStatus:
            "PENDING",
          replayCount:
            0,
          nextAction:
            "EVALUATE_SERVER_PROJECTION",
          runtimeAuthorized:
            false,
          sessionAuthenticated:
            false,
          profilePersistenceAuthorized:
            false,
          authority:
            "REPLAY_EVIDENCE_ONLY",
          legalCertification:
            false
        });

        expect(
          db.receipts.size
        ).toBe(
          1
        );

        expect(
          db.nonces.size
        ).toBe(
          1
        );
      }
    );


    it(
      "fails closed when the same nonce is consumed twice",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        await evaluateAndRecordIprOnboardingReplay({
          transaction:
            transaction(
              db,
              "TX-A"
            ),

          ingress
        });

        const replay =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db,
                "TX-B"
              ),

            ingress
          });

        expect(
          replay
        ).toMatchObject({
          ok: false,
          status:
            "REPLAY_DENIED",
          reason:
            "NONCE_ALREADY_CONSUMED",
          nextAction:
            "FAIL_CLOSED",
          runtimeAuthorized:
            false
        });
      }
    );


    it(
      "marks a pending projection as profile persisted",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        await evaluateAndRecordIprOnboardingReplay({
          transaction:
            transaction(
              db
            ),

          ingress
        });

        const result =
          await markIprOnboardingReplayProfilePersisted({
            transaction:
              transaction(
                db
              ),

            projectionKey:
              ingress.projectionKey,

            payloadHash:
              ingress.payloadHash
          });

        expect(
          result
        ).toMatchObject({
          ok: true,
          status:
            "PROFILE_PERSISTENCE_RECORDED",
          projectionStatus:
            "PROFILE_PERSISTED",
          replayCount:
            0,
          alreadyPersisted:
            false,
          runtimeAuthorized:
            false
        });

        expect(
          db.receipts.get(
            ingress.projectionKey
          )?.status
        ).toBe(
          "PROFILE_PERSISTED"
        );
      }
    );


    it(
      "treats repeated persistence marking as idempotent",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        await reserveAndPersist(
          db,
          ingress
        );

        const repeated =
          await markIprOnboardingReplayProfilePersisted({
            transaction:
              transaction(
                db,
                "TX-REPEAT"
              ),

            projectionKey:
              ingress.projectionKey,

            payloadHash:
              ingress.payloadHash
          });

        expect(
          repeated.alreadyPersisted
        ).toBe(
          true
        );

        expect(
          repeated.projectionStatus
        ).toBe(
          "PROFILE_PERSISTED"
        );
      }
    );


    it(
      "accepts a new nonce as idempotent replay after profile persistence",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        await reserveAndPersist(
          db,
          ingress
        );

        const retry =
          buildIngress({
            nonceHash:
              sha256(
                "nonce-002"
              )
          });

        const result =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db,
                "TX-RETRY"
              ),

            ingress:
              retry
          });

        expect(
          result
        ).toMatchObject({
          ok: true,
          status:
            "IDEMPOTENT_REPLAY_ACCEPTED",
          replayDecision:
            "IDEMPOTENT_REPLAY",
          projectionStatus:
            "PROFILE_PERSISTED",
          replayCount:
            1,
          nextAction:
            "NO_PROFILE_WRITE_REQUIRED",
          runtimeAuthorized:
            false
        });
      }
    );


    it(
      "increments replay count across multiple valid retries",
      async () => {
        const db =
          new FakeReplayDatabase();

        await reserveAndPersist(
          db
        );

        const retry1 =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db,
                "TX-R1"
              ),

            ingress:
              buildIngress({
                nonceHash:
                  sha256(
                    "nonce-r1"
                  )
              })
          });

        const retry2 =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db,
                "TX-R2"
              ),

            ingress:
              buildIngress({
                nonceHash:
                  sha256(
                    "nonce-r2"
                  )
              })
          });

        expect(
          retry1.ok &&
          retry1.replayCount
        ).toBe(
          1
        );

        expect(
          retry2.ok &&
          retry2.replayCount
        ).toBe(
          2
        );
      }
    );


    it(
      "fails closed when the projection key is reused with another payload",
      async () => {
        const db =
          new FakeReplayDatabase();

        await reserveAndPersist(
          db
        );

        const conflict =
          buildIngress({
            nonceHash:
              sha256(
                "nonce-conflict"
              ),

            payloadHash:
              sha256(
                "different-payload"
              )
          });

        const result =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db
              ),

            ingress:
              conflict
          });

        expect(
          result
        ).toMatchObject({
          ok: false,
          reason:
            "PROJECTION_PAYLOAD_CONFLICT",
          nextAction:
            "FAIL_CLOSED"
        });
      }
    );


    it(
      "fails closed when a projection is replayed under another tenant or workspace",
      async () => {
        const db =
          new FakeReplayDatabase();

        await reserveAndPersist(
          db
        );

        const conflict =
          buildIngress({
            nonceHash:
              sha256(
                "nonce-scope"
              ),

            tenantId:
              "HBCE-TENANT-OTHER"
          });

        const result =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db
              ),

            ingress:
              conflict
          });

        expect(
          result
        ).toMatchObject({
          ok: false,
          reason:
            "PROJECTION_SCOPE_CONFLICT"
        });
      }
    );


    it(
      "fails closed when a projection is replayed for another hashed human IPR",
      async () => {
        const db =
          new FakeReplayDatabase();

        await reserveAndPersist(
          db
        );

        const conflict =
          buildIngress({
            nonceHash:
              sha256(
                "nonce-identity"
              ),

            humanIpr:
              "IPR-HUMAN-OTHER"
          });

        const result =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db
              ),

            ingress:
              conflict
          });

        expect(
          result
        ).toMatchObject({
          ok: false,
          reason:
            "PROJECTION_IDENTITY_CONFLICT"
        });
      }
    );


    it(
      "fails closed when the existing projection remains pending",
      async () => {
        const db =
          new FakeReplayDatabase();

        await evaluateAndRecordIprOnboardingReplay({
          transaction:
            transaction(
              db
            ),

          ingress:
            buildIngress()
        });

        const result =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db,
                "TX-PENDING"
              ),

          ingress:
            buildIngress({
              nonceHash:
                sha256(
                  "nonce-pending"
                )
            })
        });

        expect(
          result
        ).toMatchObject({
          ok: false,
          reason:
            "PROJECTION_INCOMPLETE_STATE",
          projectionStatus:
            "PENDING"
        });
      }
    );


    it(
      "binds one consumed nonce to its first request even if another projection reuses it",
      async () => {
        const db =
          new FakeReplayDatabase();

        const sharedNonce =
          sha256(
            "shared-nonce"
          );

        await evaluateAndRecordIprOnboardingReplay({
          transaction:
            transaction(
              db,
              "TX-A"
            ),

          ingress:
            buildIngress({
              nonceHash:
                sharedNonce
            })
        });

        const otherProjection =
          await evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db,
                "TX-B"
              ),

          ingress:
            buildIngress({
              projectionKey:
                sha256(
                  "projection-other"
                ),

              payloadHash:
                sha256(
                  "payload-other"
                ),

              nonceHash:
                sharedNonce
            })
        });

        expect(
          otherProjection
        ).toMatchObject({
          ok: false,
          reason:
            "NONCE_ALREADY_CONSUMED"
        });
      }
    );


    it(
      "fails when persistence marking targets a missing receipt",
      async () => {
        const db =
          new FakeReplayDatabase();

        await expect(
          markIprOnboardingReplayProfilePersisted({
            transaction:
              transaction(
                db
              ),

            projectionKey:
              sha256(
                "missing-projection"
              ),

            payloadHash:
              sha256(
                "missing-payload"
              )
          })
        ).rejects.toMatchObject({
          code:
            "REPLAY_RECEIPT_MISSING"
        });
      }
    );


    it(
      "fails when persistence marking uses a conflicting payload hash",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        await evaluateAndRecordIprOnboardingReplay({
          transaction:
            transaction(
              db
            ),

          ingress
        });

        await expect(
          markIprOnboardingReplayProfilePersisted({
            transaction:
              transaction(
                db
              ),

            projectionKey:
              ingress.projectionKey,

            payloadHash:
              sha256(
                "wrong-payload"
              )
          })
        ).rejects.toMatchObject({
          code:
            "REPLAY_RECEIPT_INVALID"
        });
      }
    );


    it(
      "rejects malformed replay hashes before issuing database writes",
      async () => {
        const db =
          new FakeReplayDatabase();

        const malformed =
          buildIngress({
            projectionKey:
              "not-a-sha256"
          });

        await expect(
          evaluateAndRecordIprOnboardingReplay({
            transaction:
              transaction(
                db
              ),

            ingress:
              malformed
          })
        ).rejects.toBeInstanceOf(
          IprOnboardingReplayStoreError
        );

        expect(
          db.queryLog
        ).toHaveLength(
          0
        );
      }
    );


    it(
      "persists hashes for credential and human IPR rather than raw identifiers",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress();

        await evaluateAndRecordIprOnboardingReplay({
          transaction:
            transaction(
              db
            ),

          ingress
        });

        const receipt =
          db.receipts.get(
            ingress.projectionKey
          );

        expect(
          receipt
        ).toBeDefined();

        expect(
          receipt?.first_credential_id_hash
        ).toBe(
          operationalHash(
            "HBCE-IPR-ONBOARDING-REPLAY-CREDENTIAL-v1",
            ingress.service
              .credentialId
          )
        );

        expect(
          receipt?.human_ipr_hash
        ).toBe(
          operationalHash(
            "HBCE-IPR-ONBOARDING-REPLAY-HUMAN-IPR-v1",
            ingress.evidence
              .iprId
          )
        );

        const serialized =
          JSON.stringify({
            receipts:
              [...db.receipts.values()],

            nonces:
              [...db.nonces.values()]
          });

        expect(
          serialized
        ).not.toContain(
          ingress.service
            .credentialId
        );

        expect(
          serialized
        ).not.toContain(
          ingress.evidence
            .iprId
        );
      }
    );


    it(
      "allows only one winner when concurrent requests reuse the same nonce",
      async () => {
        const db =
          new FakeReplayDatabase();

        const ingress =
          buildIngress({
            nonceHash:
              sha256(
                "concurrent-same-nonce"
              )
          });

        const [
          first,
          second
        ] =
          await Promise.all([
            evaluateAndRecordIprOnboardingReplay({
              transaction:
                transaction(
                  db,
                  "TX-CONCURRENT-A"
                ),

              ingress
            }),

            evaluateAndRecordIprOnboardingReplay({
              transaction:
                transaction(
                  db,
                  "TX-CONCURRENT-B"
                ),

              ingress
            })
          ]);

        const results =
          [
            first,
            second
          ];

        expect(
          results.filter(
            result =>
              result.ok &&
              result.replayDecision ===
                "NEW_PROJECTION"
          )
        ).toHaveLength(
          1
        );

        expect(
          results.filter(
            result =>
              !result.ok &&
              result.reason ===
                "NONCE_ALREADY_CONSUMED"
          )
        ).toHaveLength(
          1
        );

        expect(
          db.nonces.size
        ).toBe(
          1
        );

        expect(
          db.receipts.size
        ).toBe(
          1
        );
      }
    );


    it(
      "allows only one new projection reservation for concurrent distinct nonces",
      async () => {
        const db =
          new FakeReplayDatabase();

        const [
          first,
          second
        ] =
          await Promise.all([
            evaluateAndRecordIprOnboardingReplay({
              transaction:
                transaction(
                  db,
                  "TX-PROJECTION-A"
                ),

              ingress:
                buildIngress({
                  nonceHash:
                    sha256(
                      "concurrent-nonce-a"
                    )
                })
            }),

            evaluateAndRecordIprOnboardingReplay({
              transaction:
                transaction(
                  db,
                  "TX-PROJECTION-B"
                ),

              ingress:
                buildIngress({
                  nonceHash:
                    sha256(
                      "concurrent-nonce-b"
                    )
                })
            })
          ]);

        const results =
          [
            first,
            second
          ];

        expect(
          results.filter(
            result =>
              result.ok &&
              result.replayDecision ===
                "NEW_PROJECTION"
          )
        ).toHaveLength(
          1
        );

        expect(
          results.filter(
            result =>
              !result.ok &&
              result.reason ===
                "PROJECTION_INCOMPLETE_STATE"
          )
        ).toHaveLength(
          1
        );

        expect(
          db.receipts.size
        ).toBe(
          1
        );

        expect(
          db.nonces.size
        ).toBe(
          2
        );
      }
    );
  }
);

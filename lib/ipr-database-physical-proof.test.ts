import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const {
  mockQueryWithoutSchemaInitialization
} = vi.hoisted(() => ({
  mockQueryWithoutSchemaInitialization:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-database",
  () => ({
    queryHbceDatabaseWithoutSchemaInitialization:
      mockQueryWithoutSchemaInitialization
  })
);


import {
  inspectIprDatabasePhysicalSchema,
  IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY
} from "@/lib/ipr-database-physical-proof";


function result(
  rows: Array<Record<string, unknown>>
) {
  return {
    ok: true,
    status: "AVAILABLE",
    rows,
    rowCount: rows.length,
    error: null,
    sqlHash: null,
    durationMs: 0
  };
}


function queryFailure(
  error = "HBCE_TEST_QUERY_FAILURE"
) {
  return {
    ok: false,
    status: "QUERY_FAILED",
    rows: [],
    rowCount: 0,
    error,
    sqlHash: null,
    durationMs: 0
  };
}


function postgresCatalogIdentifier(
  value: string
): string {
  const maxBytes = 63;

  if (
    Buffer.byteLength(
      value,
      "utf8"
    ) <= maxBytes
  ) {
    return value;
  }

  let normalized = "";

  for (const character of value) {
    const candidate =
      `${normalized}${character}`;

    if (
      Buffer.byteLength(
        candidate,
        "utf8"
      ) > maxBytes
    ) {
      break;
    }

    normalized = candidate;
  }

  return normalized;
}


const CONSTRAINTS = [
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_record_id_sha256",
    definition:
      "CHECK (policy_record_id ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_human_ipr_hash_sha256",
    definition:
      "CHECK (human_ipr_hash ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_projection_key_sha256",
    definition:
      "CHECK (projection_key ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_payload_hash_sha256",
    definition:
      "CHECK (payload_hash ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_issuer_credential_hash_sha256",
    definition:
      "CHECK (issuer_credential_id_hash ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_issuer_authorization_hash_sha256",
    definition:
      "CHECK (issuer_authorization_ref_hash ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_supersedes_hash_sha256",
    definition:
      "CHECK (supersedes_policy_record_id IS NULL OR supersedes_policy_record_id ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_revokes_hash_sha256",
    definition:
      "CHECK (revokes_policy_record_id IS NULL OR revokes_policy_record_id ~ '^[0-9a-f]{64}$')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_scope_non_empty",
    definition:
      "CHECK (btrim(tenant_id) <> '' AND btrim(workspace_id) <> '')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_issuer_kind_non_empty",
    definition:
      "CHECK (btrim(issuer_kind) <> '')"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_decision_valid",
    definition:
      "CHECK (decision IN ('GRANT', 'DENY', 'REVOKE'))"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_grant_all_flags_true",
    definition:
      "CHECK (decision <> 'GRANT' OR (allow_joker_c2_access = true AND verified_biological_subject = true AND matrix_active = true AND ipr_bound_memory = true))"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_non_grant_flags_false",
    definition:
      "CHECK (decision = 'GRANT' OR (allow_joker_c2_access = false AND verified_biological_subject = false AND matrix_active = false AND ipr_bound_memory = false))"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_grant_expiry_required",
    definition:
      "CHECK (decision <> 'GRANT' OR expires_at IS NOT NULL)"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_validity_window",
    definition:
      "CHECK (expires_at IS NULL OR expires_at > COALESCE(not_before, issued_at))"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_revoke_reference_required",
    definition:
      "CHECK (decision <> 'REVOKE' OR revokes_policy_record_id IS NOT NULL)"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_non_revoke_reference_forbidden",
    definition:
      "CHECK (decision = 'REVOKE' OR revokes_policy_record_id IS NULL)"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_genealogy_exclusive",
    definition:
      "CHECK (NOT (supersedes_policy_record_id IS NOT NULL AND revokes_policy_record_id IS NOT NULL))"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_no_self_supersession",
    definition:
      "CHECK (supersedes_policy_record_id IS NULL OR supersedes_policy_record_id <> policy_record_id)"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_no_self_revocation",
    definition:
      "CHECK (revokes_policy_record_id IS NULL OR revokes_policy_record_id <> policy_record_id)"
  },
  {
    constraint_name:
      "ipr_onboarding_pre_profile_policy_legal_certification_false",
    definition:
      "CHECK (legal_certification = false)"
  }
].map(
  (constraint) => ({
    ...constraint,
    constraint_name:
      postgresCatalogIdentifier(
        constraint.constraint_name
      )
  })
);


function installHappyPath(): void {
  mockQueryWithoutSchemaInitialization
    .mockResolvedValueOnce(
      result([
        {
          table_name:
            "ipr_onboarding_pre_profile_policy_records"
        }
      ])
    )
    .mockResolvedValueOnce(
      result([
        {
          version:
            "HBCE-IPR-DB-v1.11",
          legal_certification:
            false
        }
      ])
    )
    .mockResolvedValueOnce(
      result([
        {
          trigger_name:
            "trg_ipr_onboarding_pre_profile_policy_append_only",
          trigger_enabled:
            "O",
          trigger_definition:
            "CREATE TRIGGER trg_ipr_onboarding_pre_profile_policy_append_only BEFORE UPDATE OR DELETE ON ipr_onboarding_pre_profile_policy_records FOR EACH ROW EXECUTE FUNCTION hbce_reject_ipr_onboarding_pre_profile_policy_mutation()"
        }
      ])
    )
    .mockResolvedValueOnce(
      result([
        {
          function_name:
            "hbce_reject_ipr_onboarding_pre_profile_policy_mutation",
          language:
            "plpgsql",
          source:
            "BEGIN RAISE EXCEPTION 'HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN'; RETURN NULL; END;"
        }
      ])
    )
    .mockResolvedValueOnce(
      result(CONSTRAINTS)
    );
}


beforeEach(() => {
  mockQueryWithoutSchemaInitialization
    .mockReset();
});


describe(
  "HBCE physical database schema proof",
  () => {
    it(
      "passes only when all five physical proof domains are proven",
      async () => {
        installHappyPath();

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(true);
        expect(proof.status).toBe(
          "PHYSICAL_SCHEMA_PROOF_PASS"
        );

        expect(proof.failedChecks)
          .toEqual([]);

        expect(proof.checks)
          .toHaveLength(5);

        expect(
          proof.checks.every(
            (check) => check.ok
          )
        ).toBe(true);

        expect(proof.queryMode)
          .toBe("NO_AUTO_SCHEMA");

        expect(proof.authority)
          .toBe(
            "PHYSICAL_SCHEMA_EVIDENCE_ONLY"
          );

        expect(proof.databaseMutation)
          .toBe(false);

        expect(proof.sessionCreated)
          .toBe(false);

        expect(proof.runtimeAuthorized)
          .toBe(false);

        expect(proof.profilePersisted)
          .toBe(false);

        expect(proof.routeActivated)
          .toBe(false);

        expect(proof.legalCertification)
          .toBe(false);

        expect(
          mockQueryWithoutSchemaInitialization
        ).toHaveBeenCalledTimes(5);
      }
    );


    it(
      "fails closed when the target table is absent",
      async () => {
        installHappyPath();

        mockQueryWithoutSchemaInitialization
          .mockReset()
          .mockResolvedValueOnce(
            result([])
          )
          .mockResolvedValueOnce(
            result([
              {
                version:
                  "HBCE-IPR-DB-v1.11",
                legal_certification:
                  false
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                trigger_name:
                  "trg_ipr_onboarding_pre_profile_policy_append_only",
                trigger_enabled:
                  "O",
                trigger_definition:
                  "BEFORE UPDATE DELETE ipr_onboarding_pre_profile_policy_records hbce_reject_ipr_onboarding_pre_profile_policy_mutation"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                function_name:
                  "hbce_reject_ipr_onboarding_pre_profile_policy_mutation",
                language:
                  "plpgsql",
                source:
                  "HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN"
              }
            ])
          )
          .mockResolvedValueOnce(
            result(CONSTRAINTS)
          );

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(false);
        expect(proof.failedChecks)
          .toContain("TABLE_EXISTS");
      }
    );


    it(
      "fails closed when the v1.11 migration record is not valid",
      async () => {
        installHappyPath();

        mockQueryWithoutSchemaInitialization
          .mockReset()
          .mockResolvedValueOnce(
            result([
              {
                table_name:
                  "ipr_onboarding_pre_profile_policy_records"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                version:
                  "HBCE-IPR-DB-v1.11",
                legal_certification:
                  true
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                trigger_name:
                  "trg_ipr_onboarding_pre_profile_policy_append_only",
                trigger_enabled:
                  "O",
                trigger_definition:
                  "BEFORE UPDATE DELETE ipr_onboarding_pre_profile_policy_records hbce_reject_ipr_onboarding_pre_profile_policy_mutation"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                function_name:
                  "hbce_reject_ipr_onboarding_pre_profile_policy_mutation",
                language:
                  "plpgsql",
                source:
                  "HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN"
              }
            ])
          )
          .mockResolvedValueOnce(
            result(CONSTRAINTS)
          );

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(false);

        expect(proof.failedChecks)
          .toContain(
            "V1_11_MIGRATION_RECORD_EXISTS"
          );
      }
    );


    it(
      "fails closed when the append-only trigger is disabled",
      async () => {
        installHappyPath();

        mockQueryWithoutSchemaInitialization
          .mockReset()
          .mockResolvedValueOnce(
            result([
              {
                table_name:
                  "ipr_onboarding_pre_profile_policy_records"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                version:
                  "HBCE-IPR-DB-v1.11",
                legal_certification:
                  false
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                trigger_name:
                  "trg_ipr_onboarding_pre_profile_policy_append_only",
                trigger_enabled:
                  "D",
                trigger_definition:
                  "BEFORE UPDATE DELETE ipr_onboarding_pre_profile_policy_records hbce_reject_ipr_onboarding_pre_profile_policy_mutation"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                function_name:
                  "hbce_reject_ipr_onboarding_pre_profile_policy_mutation",
                language:
                  "plpgsql",
                source:
                  "HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN"
              }
            ])
          )
          .mockResolvedValueOnce(
            result(CONSTRAINTS)
          );

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(false);

        expect(proof.failedChecks)
          .toContain(
            "APPEND_ONLY_TRIGGER_EXISTS"
          );
      }
    );


    it(
      "fails closed when the immutability function contract is wrong",
      async () => {
        installHappyPath();

        mockQueryWithoutSchemaInitialization
          .mockReset()
          .mockResolvedValueOnce(
            result([
              {
                table_name:
                  "ipr_onboarding_pre_profile_policy_records"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                version:
                  "HBCE-IPR-DB-v1.11",
                legal_certification:
                  false
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                trigger_name:
                  "trg_ipr_onboarding_pre_profile_policy_append_only",
                trigger_enabled:
                  "O",
                trigger_definition:
                  "BEFORE UPDATE DELETE ipr_onboarding_pre_profile_policy_records hbce_reject_ipr_onboarding_pre_profile_policy_mutation"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                function_name:
                  "hbce_reject_ipr_onboarding_pre_profile_policy_mutation",
                language:
                  "sql",
                source:
                  "SELECT 1"
              }
            ])
          )
          .mockResolvedValueOnce(
            result(CONSTRAINTS)
          );

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(false);

        expect(proof.failedChecks)
          .toContain(
            "IMMUTABILITY_FUNCTION_EXISTS"
          );
      }
    );


    it(
      "fails closed when a required policy constraint is missing",
      async () => {
        installHappyPath();

        const incompleteConstraints =
          CONSTRAINTS.filter(
            (constraint) =>
              constraint.constraint_name !==
              "ipr_onboarding_pre_profile_policy_grant_expiry_required"
          );

        mockQueryWithoutSchemaInitialization
          .mockReset()
          .mockResolvedValueOnce(
            result([
              {
                table_name:
                  "ipr_onboarding_pre_profile_policy_records"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                version:
                  "HBCE-IPR-DB-v1.11",
                legal_certification:
                  false
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                trigger_name:
                  "trg_ipr_onboarding_pre_profile_policy_append_only",
                trigger_enabled:
                  "O",
                trigger_definition:
                  "BEFORE UPDATE DELETE ipr_onboarding_pre_profile_policy_records hbce_reject_ipr_onboarding_pre_profile_policy_mutation"
              }
            ])
          )
          .mockResolvedValueOnce(
            result([
              {
                function_name:
                  "hbce_reject_ipr_onboarding_pre_profile_policy_mutation",
                language:
                  "plpgsql",
                source:
                  "HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN"
              }
            ])
          )
          .mockResolvedValueOnce(
            result(incompleteConstraints)
          );

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(false);

        expect(proof.failedChecks)
          .toContain(
            "POLICY_CONSTRAINTS_EXIST"
          );
      }
    );


    it(
      "fails closed when a catalog query fails",
      async () => {
        mockQueryWithoutSchemaInitialization
          .mockResolvedValueOnce(
            queryFailure()
          )
          .mockResolvedValueOnce(
            queryFailure()
          )
          .mockResolvedValueOnce(
            queryFailure()
          )
          .mockResolvedValueOnce(
            queryFailure()
          )
          .mockResolvedValueOnce(
            queryFailure()
          );

        const proof =
          await inspectIprDatabasePhysicalSchema();

        expect(proof.ok).toBe(false);

        expect(proof.status).toBe(
          "PHYSICAL_SCHEMA_PROOF_FAIL"
        );

        expect(proof.failedChecks)
          .toHaveLength(5);

        expect(
          proof.checks.every(
            (check) =>
              check.ok === false
          )
        ).toBe(true);

        expect(
          mockQueryWithoutSchemaInitialization
        ).toHaveBeenCalledTimes(5);
      }
    );


    it(
      "exposes a non-authoritative immutable proof boundary",
      () => {
        expect(
          IPR_DATABASE_PHYSICAL_PROOF_BOUNDARY
        ).toEqual(
          expect.objectContaining({
            targetSchemaVersion:
              "HBCE-IPR-DB-v1.11",

            targetTable:
              "ipr_onboarding_pre_profile_policy_records",

            queryMode:
              "NO_AUTO_SCHEMA",

            authority:
              "PHYSICAL_SCHEMA_EVIDENCE_ONLY",

            databaseMutation:
              false,

            sessionCreation:
              false,

            runtimeAuthorization:
              false,

            profilePersistence:
              false,

            routeActivation:
              false,

            legalCertification:
              false
          })
        );
      }
    );
  }
);

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  readFileSync,
} from "node:fs";

import {
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

import {
  buildPlatformCoreCanonicalExecutionExecutingToTerminal,
  PlatformCoreCanonicalExecutionExecutingToTerminalBuilderError,
  type PlatformCoreExecutionExecutingToTerminalInput,
} from "./canonical-execution-executing-to-terminal-builder";

import type {
  PlatformCoreCanonicalExecutionExecutingV2,
} from "./canonical-execution-pending-to-executing-builder";

type JsonSchema =
  Record<string, any>;

const schema =
  JSON.parse(
    readFileSync(
      "src/runtime/platform-core/schemas/hbce-execution.schema.json",
      "utf8",
    ),
  ) as JsonSchema;

function resolve(
  rule:
    JsonSchema,
): JsonSchema {
  if (
    typeof rule.$ref === "string"
    && rule.$ref.startsWith(
      "#/",
    )
  ) {
    let cursor:
      any =
      schema;

    for (
      const raw
      of rule.$ref
        .slice(2)
        .split("/")
    ) {
      const segment =
        raw
          .replaceAll(
            "~1",
            "/",
          )
          .replaceAll(
            "~0",
            "~",
          );

      cursor =
        cursor[
          segment
        ];
    }

    return cursor;
  }

  return rule;
}

function sampleString(
  rule:
    JsonSchema,
  path:
    string,
): string {
  if (
    rule.format ===
      "date-time"
  ) {
    return "2026-09-01T15:30:00.000Z";
  }

  const pattern =
    typeof rule.pattern ===
      "string"
      ? rule.pattern
      : "";

  if (
    pattern.includes(
      "[a-f0-9]{64}",
    )
  ) {
    return "a".repeat(
      64,
    );
  }

  if (
    path.endsWith(
      ".execution_id",
    )
  ) {
    return "EXE-TEST:TERMINAL";
  }

  if (
    path.endsWith(
      ".authorization_ref",
    )
  ) {
    return "AZN-TEST:TERMINAL";
  }

  if (
    pattern.includes(
      "A-Z0-9",
    )
  ) {
    return "REF:TEST";
  }

  const minimum =
    typeof rule.minLength ===
      "number"
      ? rule.minLength
      : 1;

  return "T".repeat(
    Math.max(
      minimum,
      4,
    ),
  );
}

function sample(
  incoming:
    JsonSchema,
  path =
    "$",
): any {
  const rule =
    resolve(
      incoming,
    );

  if (
    Object.prototype.hasOwnProperty.call(
      rule,
      "const",
    )
  ) {
    return rule.const;
  }

  if (
    Array.isArray(
      rule.enum,
    )
    && rule.enum.length > 0
  ) {
    const nonNull =
      rule.enum.find(
        (value: unknown) =>
          value !== null,
      );

    return (
      nonNull
      ?? rule.enum[0]
    );
  }

  if (
    Array.isArray(
      rule.oneOf,
    )
    && rule.oneOf.length > 0
  ) {
    return sample(
      rule.oneOf[0],
      path,
    );
  }

  if (
    Array.isArray(
      rule.anyOf,
    )
    && rule.anyOf.length > 0
  ) {
    return sample(
      rule.anyOf[0],
      path,
    );
  }

  let type =
    rule.type;

  if (
    Array.isArray(
      type,
    )
  ) {
    if (
      (
        path.endsWith(
          "_reference",
        )
        || path.endsWith(
          ".state_ref",
        )
        || path.endsWith(
          ".state_sha256",
        )
      )
      && type.includes(
        "null",
      )
    ) {
      return null;
    }

    type =
      type.find(
        (entry: string) =>
          entry !== "null",
      )
      ?? "null";
  }

  if (
    type === "object"
    || (
      type === undefined
      && rule.properties
    )
  ) {
    const output:
      Record<string, unknown> =
      {};

    const required =
      Array.isArray(
        rule.required,
      )
        ? rule.required
        : [];

    for (
      const key
      of required
    ) {
      const property =
        rule.properties?.[
          key
        ];

      if (!property) {
        throw new Error(
          "MISSING_SCHEMA_PROPERTY:"
          + path
          + "."
          + key,
        );
      }

      output[key] =
        sample(
          property,
          path
          + "."
          + key,
        );
    }

    return output;
  }

  if (
    type === "array"
  ) {
    const count =
      typeof rule.minItems ===
        "number"
        ? rule.minItems
        : 0;

    return Array.from(
      {
        length:
          count,
      },
      (
        _,
        index,
      ) =>
        sample(
          rule.items ?? {},
          path
          + "["
          + index
          + "]",
        ),
    );
  }

  if (
    type === "string"
  ) {
    return sampleString(
      rule,
      path,
    );
  }

  if (
    type === "integer"
  ) {
    return (
      typeof rule.minimum ===
        "number"
        ? rule.minimum
        : 1
    );
  }

  if (
    type === "number"
  ) {
    return (
      typeof rule.minimum ===
        "number"
        ? rule.minimum
        : 1
    );
  }

  if (
    type === "boolean"
  ) {
    return true;
  }

  if (
    type === "null"
  ) {
    return null;
  }

  return null;
}

function rehash<T extends Record<string, any>>(
  input:
    T,
): T {
  const copy =
    JSON.parse(
      JSON.stringify(
        input,
      ),
    );

  delete copy.payload_sha256;

  copy.payload_sha256 =
    computePlatformCorePayloadSha256(
      copy,
    );

  return copy;
}

function buildExecutingFixture():
  PlatformCoreCanonicalExecutionExecutingV2 {
  const fixture =
    sample(
      schema,
    ) as Record<string, any>;

  fixture.execution_id =
    "EXE-TEST:TERMINAL";

  fixture.execution_version =
    2;

  fixture.state =
    "EXECUTING";

  fixture.started_at =
    "2026-09-01T15:30:00.000Z";

  fixture.completed_at =
    null;

  fixture.evidence_state =
    "PRESENT";

  fixture.evidence_reference =
    "EVIDENCE:EXECUTING";

  fixture.precheck = {
    evaluated_at:
      "2026-09-01T15:29:59.000Z",

    authorization_state_observed:
      "AUTHORIZED",

    validity_state:
      "VALID",

    authority_usability_state:
      "PASS",

    dependency_binding_state:
      "PASS",

    iospace_binding_state:
      "PASS",

    enforcement_point_binding_state:
      "PASS",

    replay_state:
      "AVAILABLE",

    decision:
      "ALLOW_EXECUTION",

    evidence_reference:
      "EVIDENCE:PRECHECK",
  };

  fixture.authorization_consumption = {
    state:
      "CONSUMED",

    replay_key_sha256:
      "b".repeat(
        64,
      ),

    usage_counter_ref:
      "COUNTER:TEST",

    consumption_event_ref:
      "HBCE_AC_EVT:0123456789ABCDEF0123456789ABCDEF",

    consumption_index:
      1,

    consumed_at:
      "2026-09-01T15:30:00.000Z",

    atomic:
      true,
  };

  fixture.binding_check = {
    ...fixture.binding_check,

    action_match_state:
      "MATCH",

    request_match_state:
      "MATCH",
  };

  fixture.state_before = {
    observation_state:
      "CAPTURED",

    state_ref:
      "STATE:BEFORE",

    state_sha256:
      "c".repeat(
        64,
      ),
  };

  fixture.state_after = {
    observation_state:
      "NOT_AVAILABLE",

    state_ref:
      null,

    state_sha256:
      null,
  };

  fixture.genealogy = {
    derived_from:
      fixture.execution_id,

    previous_state:
      "PENDING",

    new_state:
      "EXECUTING",

    cause:
      "AUTHORIZATION_CONSUMED_EXECUTION_STARTED",

    evidence_reference:
      fixture
        .authorization_consumption
        .consumption_event_ref,

    timestamp:
      fixture
        .authorization_consumption
        .consumed_at,

    hash:
      "d".repeat(
        64,
      ),
  };

  const built =
    rehash(
      fixture,
    );

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EXECUTION",
      built,
    );

  if (
    !validation.valid
  ) {
    throw new Error(
      "EXECUTING_FIXTURE_SCHEMA_INVALID:"
      + JSON.stringify(
        validation.issues,
      ),
    );
  }

  return built as unknown as
    PlatformCoreCanonicalExecutionExecutingV2;
}

function terminalInput(
  state:
    "EXECUTED"
    | "FAILED"
    | "ABORTED",
): PlatformCoreExecutionExecutingToTerminalInput {
  return {
    target_state:
      state,

    completed_at:
      "2026-09-01T15:31:00.000Z",

    evidence_reference:
      "EVIDENCE:TERMINAL",

    state_after:
      state ===
        "EXECUTED"
        ? {
            observation_state:
              "CAPTURED",

            state_ref:
              "STATE:AFTER",

            state_sha256:
              "e".repeat(
                64,
              ),
          }
        : {
            observation_state:
              "UNKNOWN",

            state_ref:
              null,

            state_sha256:
              null,
          },

    genealogy: {
      cause:
        state
        + "_TEST",

      evidence_reference:
        "EVIDENCE:TERMINAL",

      timestamp:
        "2026-09-01T15:31:00.000Z",
    },
  };
}

function expectBuilderCode(
  expectedCode:
    string,
  action:
    () => unknown,
): void {
  try {
    action();

    throw new Error(
      "EXPECTED_BUILDER_ERROR:"
      + expectedCode,
    );
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreCanonicalExecutionExecutingToTerminalBuilderError,
    );

    expect(
      (
        error as
          PlatformCoreCanonicalExecutionExecutingToTerminalBuilderError
      ).code,
    ).toBe(
      expectedCode,
    );
  }
}

describe(
  "canonical EXECUTING to terminal builder",
  () => {
    it(
      "builds schema-valid EXECUTED v3",
      () => {
        const predecessor =
          buildExecutingFixture();

        const before =
          JSON.stringify(
            predecessor,
          );

        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            predecessor,
            terminalInput(
              "EXECUTED",
            ),
          );

        expect(
          result.execution_id,
        ).toBe(
          predecessor.execution_id,
        );

        expect(
          result.execution_version,
        ).toBe(
          3,
        );

        expect(
          result.state,
        ).toBe(
          "EXECUTED",
        );

        expect(
          result.started_at,
        ).toBe(
          predecessor.started_at,
        );

        expect(
          result.completed_at,
        ).toBe(
          "2026-09-01T15:31:00.000Z",
        );

        expect(
          result.state_after.observation_state,
        ).toBe(
          "CAPTURED",
        );

        expect(
          result.genealogy.derived_from,
        ).toBe(
          predecessor.execution_id,
        );

        expect(
          result.genealogy.previous_state,
        ).toBe(
          "EXECUTING",
        );

        expect(
          result.genealogy.new_state,
        ).toBe(
          "EXECUTED",
        );

        expect(
          result.genealogy.hash,
        ).toBe(
          predecessor.payload_sha256,
        );

        expect(
          JSON.stringify(
            predecessor,
          ),
        ).toBe(
          before,
        );

        expect(
          validatePlatformCoreCanonicalSchema(
            "EXECUTION",
            result,
          ).valid,
        ).toBe(
          true,
        );
      },
    );

    it(
      "builds schema-valid FAILED v3",
      () => {
        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            buildExecutingFixture(),
            terminalInput(
              "FAILED",
            ),
          );

        expect(
          result.state,
        ).toBe(
          "FAILED",
        );

        expect(
          result.state_after.observation_state,
        ).toBe(
          "UNKNOWN",
        );
      },
    );

    it(
      "builds schema-valid ABORTED v3",
      () => {
        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            buildExecutingFixture(),
            terminalInput(
              "ABORTED",
            ),
          );

        expect(
          result.state,
        ).toBe(
          "ABORTED",
        );
      },
    );

    it(
      "computes exact terminal payload hash",
      () => {
        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            buildExecutingFixture(),
            terminalInput(
              "FAILED",
            ),
          );

        const {
          payload_sha256,
          ...preimage
        } =
          result;

        expect(
          computePlatformCorePayloadSha256(
            preimage,
          ),
        ).toBe(
          payload_sha256,
        );
      },
    );

    it(
      "inherits committed authorization consumption exactly",
      () => {
        const predecessor =
          buildExecutingFixture();

        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            predecessor,
            terminalInput(
              "FAILED",
            ),
          );

        expect(
          result.authorization_consumption,
        ).toEqual(
          predecessor.authorization_consumption,
        );
      },
    );

    it(
      "returns deeply frozen terminal successor",
      () => {
        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            buildExecutingFixture(),
            terminalInput(
              "FAILED",
            ),
          );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            result.genealogy,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            result.state_after,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not invent started/completed ordering",
      () => {
        const input =
          terminalInput(
            "FAILED",
          );

        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            buildExecutingFixture(),
            {
              ...input,

              completed_at:
                "2026-08-01T00:00:00.000Z",

              genealogy: {
                ...input.genealogy,

                timestamp:
                  "2026-07-01T00:00:00.000Z",
              },
            },
          );

        expect(
          result.completed_at,
        ).toBe(
          "2026-08-01T00:00:00.000Z",
        );
      },
    );

    it(
      "preserves optional note absence",
      () => {
        const predecessor =
          buildExecutingFixture();

        delete (
          predecessor as unknown as
            Record<string, unknown>
        ).note;

        const repaired =
          rehash(
            predecessor as unknown as
              Record<string, any>,
          ) as unknown as
            PlatformCoreCanonicalExecutionExecutingV2;

        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            repaired,
            terminalInput(
              "FAILED",
            ),
          );

        expect(
          Object.prototype.hasOwnProperty.call(
            result,
            "note",
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "preserves optional note value",
      () => {
        const predecessor =
          rehash({
            ...buildExecutingFixture(),

            note:
              "KEEP-EXACT",
          }) as unknown as
            PlatformCoreCanonicalExecutionExecutingV2;

        const result =
          buildPlatformCoreCanonicalExecutionExecutingToTerminal(
            predecessor,
            terminalInput(
              "FAILED",
            ),
          );

        expect(
          result.note,
        ).toBe(
          "KEEP-EXACT",
        );
      },
    );

    it(
      "rejects invalid terminal state",
      () => {
        const input =
          terminalInput(
            "FAILED",
          ) as any;

        input.target_state =
          "PENDING";

        expectBuilderCode(
          "INVALID_TERMINAL_STATE",
          () =>
            buildPlatformCoreCanonicalExecutionExecutingToTerminal(
              buildExecutingFixture(),
              input,
            ),
        );
      },
    );

    it(
      "rejects invalid completed_at",
      () => {
        const input =
          terminalInput(
            "FAILED",
          ) as any;

        input.completed_at =
          "not-a-date";

        expectBuilderCode(
          "INVALID_INPUT",
          () =>
            buildPlatformCoreCanonicalExecutionExecutingToTerminal(
              buildExecutingFixture(),
              input,
            ),
        );
      },
    );

    it(
      "rejects unknown transition fields",
      () => {
        const input = {
          ...terminalInput(
            "FAILED",
          ),

          surprise:
            true,
        } as any;

        expectBuilderCode(
          "INVALID_INPUT",
          () =>
            buildPlatformCoreCanonicalExecutionExecutingToTerminal(
              buildExecutingFixture(),
              input,
            ),
        );
      },
    );

    it(
      "rejects predecessor payload hash mismatch",
      () => {
        const predecessor =
          JSON.parse(
            JSON.stringify(
              buildExecutingFixture(),
            ),
          );

        predecessor.payload_sha256 =
          "0".repeat(
            64,
          );

        expectBuilderCode(
          "PREDECESSOR_HASH_INVALID",
          () =>
            buildPlatformCoreCanonicalExecutionExecutingToTerminal(
              predecessor,
              terminalInput(
                "FAILED",
              ),
            ),
        );
      },
    );

    it(
      "rejects non-v2 predecessor",
      () => {
        const predecessor =
          JSON.parse(
            JSON.stringify(
              buildExecutingFixture(),
            ),
          );

        predecessor.execution_version =
          3;

        const repaired =
          rehash(
            predecessor,
          );

        expectBuilderCode(
          "PREDECESSOR_NOT_EXECUTING_V2",
          () =>
            buildPlatformCoreCanonicalExecutionExecutingToTerminal(
              repaired,
              terminalInput(
                "FAILED",
              ),
            ),
        );
      },
    );

    it(
      "EXECUTED requires CAPTURED state_after",
      () => {
        const input =
          terminalInput(
            "EXECUTED",
          );

        expectBuilderCode(
          "SUCCESSOR_SCHEMA_VALIDATION_FAILED",
          () =>
            buildPlatformCoreCanonicalExecutionExecutingToTerminal(
              buildExecutingFixture(),
              {
                ...input,

                state_after: {
                  observation_state:
                    "UNKNOWN",

                  state_ref:
                    null,

                  state_sha256:
                    null,
                },
              },
            ),
        );
      },
    );
  },
);

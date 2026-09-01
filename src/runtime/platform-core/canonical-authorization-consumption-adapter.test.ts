import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  PlatformCoreCanonicalAuthorization,
} from "./canonical-authorization-builder";

import type {
  PlatformCoreCanonicalExecutionGenesis,
} from "./canonical-execution-genesis-builder";

import {
  PLATFORM_CORE_CANONICAL_AUTHORIZATION_CONSUMPTION_ADAPTER_PROTOCOL,
  PlatformCoreCanonicalAuthorizationConsumptionAdapterError,
  buildPlatformCoreCanonicalAuthorizationConsumptionInput,
} from "./canonical-authorization-consumption-adapter";

const AUTHORIZATION_SHA =
  "a".repeat(64);

const ACTION_SHA =
  "b".repeat(64);

const REQUEST_SHA =
  "c".repeat(64);

const REPLAY_SHA =
  "d".repeat(64);

const BASE_AUTHORIZATION = {
  authorization_id:
    "AZN-TEST:CONSUMPTION",

  authorization_version:
    7,

  principal_ref:
    "PRINCIPAL:TEST",

  actor_ref:
    "ACTOR:TEST",

  iospace_ref:
    "IOSPACE:TEST",

  enforcement_point_ref:
    "ENFORCEMENT:TEST",

  action_binding: {
    action_class:
      "ACTION:TEST",

    target_ref:
      "TARGET:TEST",

    action_sha256:
      ACTION_SHA,

    request_sha256:
      REQUEST_SHA,
  },

  state:
    "AUTHORIZED",

  replay_guard: {
    mode:
      "BOUNDED_USE",

    replay_key_sha256:
      REPLAY_SHA,

    max_uses:
      3,

    usage_counter_ref:
      "COUNTER:TEST",

    requires_atomic_consumption:
      true,
  },

  payload_sha256:
    AUTHORIZATION_SHA,
} as const;

const BASE_PRECHECK = {
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
} as const;

const BASE_BINDING = {
  action_class:
    "ACTION:TEST",

  target_ref:
    "TARGET:TEST",

  authorization_action_sha256:
    ACTION_SHA,

  execution_action_sha256:
    ACTION_SHA,

  authorization_request_sha256:
    REQUEST_SHA,

  execution_request_sha256:
    REQUEST_SHA,

  action_match_state:
    "MATCH",

  request_match_state:
    "MATCH",
} as const;

const BASE_CONSUMPTION = {
  state:
    "NOT_CONSUMED",

  replay_key_sha256:
    REPLAY_SHA,

  usage_counter_ref:
    "COUNTER:TEST",

  consumption_event_ref:
    null,

  consumption_index:
    null,

  consumed_at:
    null,

  atomic:
    true,
} as const;

const BASE_GENEALOGY = {
  derived_from:
    null,

  previous_state:
    null,

  new_state:
    "PENDING",

  hash:
    AUTHORIZATION_SHA,
} as const;

const BASE_EXECUTION = {
  execution_id:
    "EXE-TEST:CONSUMPTION",

  execution_version:
    1,

  principal_ref:
    "PRINCIPAL:TEST",

  actor_ref:
    "ACTOR:TEST",

  authorization_ref:
    "AZN-TEST:CONSUMPTION",

  authorization_version:
    7,

  authorization_sha256:
    AUTHORIZATION_SHA,

  iospace_ref:
    "IOSPACE:TEST",

  enforcement_point_ref:
    "ENFORCEMENT:TEST",

  binding_check:
    BASE_BINDING,

  precheck:
    BASE_PRECHECK,

  authorization_consumption:
    BASE_CONSUMPTION,

  state:
    "PENDING",

  genealogy:
    BASE_GENEALOGY,
} as const;

function cloneRecord(
  value: object,
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as Record<string, unknown>;
}

function setPath(
  root:
    Record<string, unknown>,
  path:
    readonly string[],
  value:
    unknown,
): void {
  let current =
    root;

  for (
    let index = 0;
    index < path.length - 1;
    index += 1
  ) {
    const key =
      path[index];

    if (key === undefined) {
      throw new Error(
        "invalid path",
      );
    }

    const child =
      current[key];

    if (
      typeof child !== "object"
      || child === null
      || Array.isArray(
        child,
      )
    ) {
      throw new Error(
        `invalid object path at ${key}`,
      );
    }

    current =
      child as Record<
        string,
        unknown
      >;
  }

  const finalKey =
    path[
      path.length - 1
    ];

  if (finalKey === undefined) {
    throw new Error(
      "empty path",
    );
  }

  current[finalKey] =
    value;
}

function makeAuthorization():
  PlatformCoreCanonicalAuthorization {
  return cloneRecord(
    BASE_AUTHORIZATION,
  ) as unknown as
    PlatformCoreCanonicalAuthorization;
}

function makeExecution():
  PlatformCoreCanonicalExecutionGenesis {
  return cloneRecord(
    BASE_EXECUTION,
  ) as unknown as
    PlatformCoreCanonicalExecutionGenesis;
}

function expectAdapterFailure(
  authorization:
    PlatformCoreCanonicalAuthorization,
  execution:
    PlatformCoreCanonicalExecutionGenesis,
  code:
    string,
): void {
  try {
    buildPlatformCoreCanonicalAuthorizationConsumptionInput(
      authorization,
      execution,
    );

    throw new Error(
      "expected adapter failure",
    );
  } catch (error) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreCanonicalAuthorizationConsumptionAdapterError,
    );

    expect(
      (
        error as
          PlatformCoreCanonicalAuthorizationConsumptionAdapterError
      ).code,
    ).toBe(
      code,
    );
  }
}

describe(
  "Platform Core canonical authorization consumption adapter",
  () => {
    it(
      "locks the adapter protocol identity",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_AUTHORIZATION_CONSUMPTION_ADAPTER_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-CANONICAL-AUTHORIZATION-CONSUMPTION-ADAPTER-v1",
        );
      },
    );

    it(
      "maps exactly the repository consumption input",
      () => {
        const result =
          buildPlatformCoreCanonicalAuthorizationConsumptionInput(
            makeAuthorization(),
            makeExecution(),
          );

        expect(
          result,
        ).toEqual({
          authorizationRef:
            "AZN-TEST:CONSUMPTION",

          authorizationVersion:
            "7",

          authorizationSha256:
            AUTHORIZATION_SHA,

          replayKeySha256:
            REPLAY_SHA,

          replayMode:
            "BOUNDED_USE",

          maxUses:
            3,

          usageCounterRef:
            "COUNTER:TEST",

          executionId:
            "EXE-TEST:CONSUMPTION",

          actionSha256:
            ACTION_SHA,

          requestSha256:
            REQUEST_SHA,

          iospaceRef:
            "IOSPACE:TEST",
        });
      },
    );

    it(
      "converts authorization_version to exact decimal string",
      () => {
        const result =
          buildPlatformCoreCanonicalAuthorizationConsumptionInput(
            makeAuthorization(),
            makeExecution(),
          );

        expect(
          result.authorizationVersion,
        ).toBe(
          "7",
        );
      },
    );

    it(
      "returns a frozen repository input",
      () => {
        const result =
          buildPlatformCoreCanonicalAuthorizationConsumptionInput(
            makeAuthorization(),
            makeExecution(),
          );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not mutate canonical source objects",
      () => {
        const authorization =
          makeAuthorization();

        const execution =
          makeExecution();

        const authorizationBefore =
          JSON.stringify(
            authorization,
          );

        const executionBefore =
          JSON.stringify(
            execution,
          );

        buildPlatformCoreCanonicalAuthorizationConsumptionInput(
          authorization,
          execution,
        );

        expect(
          JSON.stringify(
            authorization,
          ),
        ).toBe(
          authorizationBefore,
        );

        expect(
          JSON.stringify(
            execution,
          ),
        ).toBe(
          executionBefore,
        );
      },
    );

    const authorizationCases:
      readonly [
        readonly string[],
        unknown,
        string,
      ][] = [
        [
          ["state"],
          "REVOKED",
          "AUTHORIZATION_NOT_EXECUTABLE",
        ],
        [
          [
            "replay_guard",
            "requires_atomic_consumption",
          ],
          false,
          "AUTHORIZATION_NOT_EXECUTABLE",
        ],
        [
          [
            "authorization_version",
          ],
          0,
          "AUTHORIZATION_VERSION_INVALID",
        ],
      ];

    it.each(
      authorizationCases,
    )(
      "fails closed for authorization gate %j",
      (
        path,
        value,
        code,
      ) => {
        const raw =
          cloneRecord(
            BASE_AUTHORIZATION,
          );

        setPath(
          raw,
          path,
          value,
        );

        expectAdapterFailure(
          raw as unknown as
            PlatformCoreCanonicalAuthorization,
          makeExecution(),
          code,
        );
      },
    );

    const executionGenesisCases:
      readonly [
        readonly string[],
        unknown,
        string,
      ][] = [
        [
          ["execution_version"],
          2,
          "EXECUTION_GENESIS_INVALID",
        ],
        [
          ["state"],
          "EXECUTING",
          "EXECUTION_GENESIS_INVALID",
        ],
      ];

    it.each(
      executionGenesisCases,
    )(
      "fails closed for execution genesis gate %j",
      (
        path,
        value,
        code,
      ) => {
        const raw =
          cloneRecord(
            BASE_EXECUTION,
          );

        setPath(
          raw,
          path,
          value,
        );

        expectAdapterFailure(
          makeAuthorization(),
          raw as unknown as
            PlatformCoreCanonicalExecutionGenesis,
          code,
        );
      },
    );

    const precheckCases:
      readonly [
        readonly string[],
        unknown,
      ][] = [
        [
          [
            "precheck",
            "authorization_state_observed",
          ],
          "REVOKED",
        ],
        [
          [
            "precheck",
            "validity_state",
          ],
          "EXPIRED",
        ],
        [
          [
            "precheck",
            "authority_usability_state",
          ],
          "FAIL",
        ],
        [
          [
            "precheck",
            "dependency_binding_state",
          ],
          "FAIL",
        ],
        [
          [
            "precheck",
            "iospace_binding_state",
          ],
          "FAIL",
        ],
        [
          [
            "precheck",
            "enforcement_point_binding_state",
          ],
          "FAIL",
        ],
        [
          [
            "precheck",
            "replay_state",
          ],
          "EXHAUSTED",
        ],
        [
          [
            "precheck",
            "decision",
          ],
          "BLOCK_EXECUTION",
        ],
      ];

    it.each(
      precheckCases,
    )(
      "fails closed for precheck gate %j",
      (
        path,
        value,
      ) => {
        const raw =
          cloneRecord(
            BASE_EXECUTION,
          );

        setPath(
          raw,
          path,
          value,
        );

        expectAdapterFailure(
          makeAuthorization(),
          raw as unknown as
            PlatformCoreCanonicalExecutionGenesis,
          "PRECHECK_NOT_EXECUTABLE",
        );
      },
    );

    const bindingCases:
      readonly [
        readonly string[],
        unknown,
      ][] = [
        [
          [
            "binding_check",
            "action_match_state",
          ],
          "FAIL",
        ],
        [
          [
            "binding_check",
            "request_match_state",
          ],
          "FAIL",
        ],
        [
          ["principal_ref"],
          "PRINCIPAL:OTHER",
        ],
        [
          ["actor_ref"],
          "ACTOR:OTHER",
        ],
        [
          ["authorization_ref"],
          "AZN-OTHER:AUTH",
        ],
        [
          ["authorization_version"],
          8,
        ],
        [
          ["authorization_sha256"],
          "f".repeat(64),
        ],
        [
          ["iospace_ref"],
          "IOSPACE:OTHER",
        ],
        [
          ["enforcement_point_ref"],
          "ENFORCEMENT:OTHER",
        ],
        [
          [
            "binding_check",
            "action_class",
          ],
          "ACTION:OTHER",
        ],
        [
          [
            "binding_check",
            "target_ref",
          ],
          "TARGET:OTHER",
        ],
        [
          [
            "binding_check",
            "authorization_action_sha256",
          ],
          "e".repeat(64),
        ],
        [
          [
            "binding_check",
            "execution_action_sha256",
          ],
          "e".repeat(64),
        ],
        [
          [
            "binding_check",
            "authorization_request_sha256",
          ],
          "e".repeat(64),
        ],
        [
          [
            "binding_check",
            "execution_request_sha256",
          ],
          "e".repeat(64),
        ],
        [
          [
            "authorization_consumption",
            "replay_key_sha256",
          ],
          "e".repeat(64),
        ],
        [
          [
            "authorization_consumption",
            "usage_counter_ref",
          ],
          "COUNTER:OTHER",
        ],
      ];

    it.each(
      bindingCases,
    )(
      "fails closed for exact binding mismatch %j",
      (
        path,
        value,
      ) => {
        const raw =
          cloneRecord(
            BASE_EXECUTION,
          );

        setPath(
          raw,
          path,
          value,
        );

        expectAdapterFailure(
          makeAuthorization(),
          raw as unknown as
            PlatformCoreCanonicalExecutionGenesis,
          "BINDING_MISMATCH",
        );
      },
    );

    const consumptionCases:
      readonly [
        readonly string[],
        unknown,
      ][] = [
        [
          [
            "authorization_consumption",
            "state",
          ],
          "CONSUMED",
        ],
        [
          [
            "authorization_consumption",
            "consumption_event_ref",
          ],
          "EVENT:TEST",
        ],
        [
          [
            "authorization_consumption",
            "consumption_index",
          ],
          1,
        ],
        [
          [
            "authorization_consumption",
            "consumed_at",
          ],
          "2026-09-01T00:00:00.000Z",
        ],
        [
          [
            "authorization_consumption",
            "atomic",
          ],
          false,
        ],
      ];

    it.each(
      consumptionCases,
    )(
      "fails closed for invalid pre-consumption state %j",
      (
        path,
        value,
      ) => {
        const raw =
          cloneRecord(
            BASE_EXECUTION,
          );

        setPath(
          raw,
          path,
          value,
        );

        expectAdapterFailure(
          makeAuthorization(),
          raw as unknown as
            PlatformCoreCanonicalExecutionGenesis,
          "CONSUMPTION_STATE_INVALID",
        );
      },
    );

    const genealogyCases:
      readonly [
        readonly string[],
        unknown,
      ][] = [
        [
          [
            "genealogy",
            "derived_from",
          ],
          "EXE-OTHER:EXECUTION",
        ],
        [
          [
            "genealogy",
            "previous_state",
          ],
          "PENDING",
        ],
        [
          [
            "genealogy",
            "new_state",
          ],
          "EXECUTING",
        ],
        [
          [
            "genealogy",
            "hash",
          ],
          "e".repeat(64),
        ],
      ];

    it.each(
      genealogyCases,
    )(
      "fails closed for invalid genesis genealogy %j",
      (
        path,
        value,
      ) => {
        const raw =
          cloneRecord(
            BASE_EXECUTION,
          );

        setPath(
          raw,
          path,
          value,
        );

        expectAdapterFailure(
          makeAuthorization(),
          raw as unknown as
            PlatformCoreCanonicalExecutionGenesis,
          "GENESIS_GENEALOGY_INVALID",
        );
      },
    );
  },
);

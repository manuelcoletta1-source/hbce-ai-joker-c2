mport { createHash } from "node:crypto";

import {
  buildRuntimeOperationsEvidence,
  type RuntimeOperationsEvidenceInput,
} from "./runtime-operations-evidence";

import {
  buildRuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-envelope";

import {
  verifyRuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-verifier";

import {
  appendVerifiedRuntimeOperationsLedgerEntry,
  getLatestRuntimeOperationsLedgerEntry,
  getRuntimeOperationsLedgerEntryByOperationIdSha256,
  getRuntimeOperationsLedgerEntryBySequence,
  listRuntimeOperationsLedgerEntries,
  type RuntimeOperationsLedgerRepositoryRecord,
} from "./runtime-operations-ledger-repository";

import {
  verifyRuntimeOperationsLedgerEntry,
  type RuntimeOperationsLedgerEntry,
} from "./runtime-operations-ledger";

export const RUNTIME_OPERATIONS_PERSISTENT_APPEND_SERVICE_REVISION =
  "HBCE-RUNTIME-OPERATIONS-PERSISTENT-APPEND-SERVICE-v1_1" as const;

const CANONICAL_RUNTIME_IPR =
  "IPR-AI-0001" as const;

const CANONICAL_HUMAN_AUTHORITY_IPR =
  "IPR-3" as const;

const CANONICAL_ORGANIZATION =
  "HERMETICUM B.C.E. S.r.l." as const;

const HERMETICUM_SIGIL =
  "🜏" as const;

const DEFAULT_PAGE_SIZE =
  500;

const MAX_PAGE_SIZE =
  1000;

const DEFAULT_MAX_VERIFICATION_ENTRIES =
  10_000;

export type RuntimeOperationsPersistentAppendStage =
  | "AUTHORIZATION"
  | "SOURCE_PRECONDITION"
  | "IDEMPOTENCY"
  | "TIP_READ"
  | "TIP_VERIFICATION"
  | "EVIDENCE_BUILD"
  | "OPC_BUILD"
  | "OPC_VERIFICATION"
  | "PERSISTENCE_APPEND"
  | "PERSISTENCE_REREAD"
  | "APPENDED_ENTRY_VERIFICATION"
  | "FULL_CHAIN_READ"
  | "FULL_CHAIN_VERIFICATION";

export type RuntimeOperationsPersistentAppendAuthorization = {
  humanAuthorized: boolean;
  authorizationRef: string;
  runtimeIpr: string;
  humanAuthorityIpr: string;
  organization: string;
};

export type RuntimeOperationsPersistentAppendExpectedTip = {
  sequence: number;
  entrySha256: string;
};

export type RuntimeOperationsPersistentAppendRequest = {
  sourceInput:
    RuntimeOperationsEvidenceInput;

  authorization:
    RuntimeOperationsPersistentAppendAuthorization;

  /**
   * Stable logical operation identifier.
   *
   * New production callers MUST provide this value. It is hashed with
   * SHA-256 inside the service and the raw identifier is never persisted.
   *
   * The property remains optional only during the one-file-at-a-time
   * migration window so already-deployed completed self-test callers keep
   * compiling until their boundary is upgraded.
   */
  operationId?:
    string;

  /**
   * Optional optimistic precondition.
   *
   * It prevents an append when the tip already differs at service
   * preflight time. The database/repository remains authoritative for
   * concurrent append serialization.
   */
  expectedTip?:
    RuntimeOperationsPersistentAppendExpectedTip;

  verification?: {
    pageSize?: number;
    maximumEntries?: number;
  };
};

export type RuntimeOperationsPersistentChainVerificationEntry = {
  sequence: number;
  verified: boolean;
  cryptographicVerificationPassed: boolean;
  sequenceContinuity: boolean;
  previousHashBinding: boolean;
  failedChecks: number;
  entrySha256: string;
  previousEntrySha256: string | null;
  chainRootSha256: string;
};

export type RuntimeOperationsPersistentChainVerificationResult = {
  verifierMode:
    "PERSISTENT_DATABASE_FULL_CHAIN";

  verified:
    boolean;

  entryCount:
    number;

  genesisSequence:
    number | null;

  latestSequence:
    number | null;

  sequenceContinuityVerified:
    boolean;

  previousHashBindingsVerified:
    boolean;

  allEntriesCryptographicallyVerified:
    boolean;

  tipCoverageVerified:
    boolean;

  totalFailedChecks:
    number;

  entries:
    RuntimeOperationsPersistentChainVerificationEntry[];
};

export type RuntimeOperationsPersistentAppendResult = {
  ok: true;

  status:
    "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_PASS";

  operationalStatus:
    "PASS";

  revision:
    typeof RUNTIME_OPERATIONS_PERSISTENT_APPEND_SERVICE_REVISION;

  identity: {
    runtimeIpr:
      typeof CANONICAL_RUNTIME_IPR;

    humanAuthorityIpr:
      typeof CANONICAL_HUMAN_AUTHORITY_IPR;

    organization:
      typeof CANONICAL_ORGANIZATION;

    hermeticumSigil:
      typeof HERMETICUM_SIGIL;
  };

  authorization: {
    humanAuthorized:
      true;

    authorizationRef:
      string;

    rawCredentialPersisted:
      false;
  };

  preflight: {
    sequence:
      number;

    entrySha256:
      string;

    chainRootSha256:
      string;

    expectedTipProvided:
      boolean;

    expectedTipMatched:
      boolean;
  };

  evidence: {
    revision:
      string;

    sha256:
      string;

    allRequiredChecksPassed:
      true;
  };

  opcEvt: {
    revision:
      string;

    envelopeSha256:
      string;

    internalSeal:
      string;

    verified:
      true;

    failedChecks:
      0;
  };

  persistence: {
    attempted:
      boolean;

    confirmed:
      true;

    table:
      string;

    recordedAt:
      string;

    sequence:
      number;

    operationIdSha256:
      string | null;

    inserted:
      boolean;

    idempotentReplay:
      boolean;
  };

  idempotency: {
    enabled:
      boolean;

    operationIdSha256:
      string | null;

    inserted:
      boolean;

    replayed:
      boolean;

    legacyKeyless:
      boolean;

    rawOperationIdPersisted:
      false;
  };

  append: {
    expectedNextSequence:
      number;

    sequence:
      number;

    previousEntrySha256:
      string | null;

    entrySha256:
      string;

    chainRootSha256:
      string;

    linkedToRepositoryTipAtAppend:
      boolean;

    concurrentTipAdvanceObserved:
      boolean;
  };

  verification: {
    rereadMatched:
      true;

    appendedEntryVerified:
      true;

    appendedEntryFailedChecks:
      0;

    fullChain:
      RuntimeOperationsPersistentChainVerificationResult;
  };

  governance: {
    appendOnly:
      true;

    hashOnlyEvidence:
      true;

    humanAuthorizationRequired:
      true;

    autonomousAuthorization:
      false;

    runtimeActivation:
      false;

    noSubmitFromCode:
      true;

    legalCertification:
      false;

    qualifiedElectronicSignature:
      false;
  };
};

export class RuntimeOperationsPersistentAppendError
  extends Error {
  readonly code: string;

  readonly stage:
    RuntimeOperationsPersistentAppendStage;

  readonly persistenceAttempted:
    boolean;

  readonly persistenceConfirmed:
    boolean;

  readonly persistedSequence:
    number | null;

  readonly causeValue:
    unknown;

  constructor(input: {
    code: string;
    stage:
      RuntimeOperationsPersistentAppendStage;
    message: string;
    persistenceAttempted?:
      boolean;
    persistenceConfirmed?:
      boolean;
    persistedSequence?:
      number | null;
    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "RuntimeOperationsPersistentAppendError";

    this.code =
      input.code;

    this.stage =
      input.stage;

    this.persistenceAttempted =
      input.persistenceAttempted ??
      false;

    this.persistenceConfirmed =
      input.persistenceConfirmed ??
      false;

    this.persistedSequence =
      input.persistedSequence ??
      null;

    this.causeValue =
      input.causeValue;
  }
}

function fail(input: {
  code: string;
  stage:
    RuntimeOperationsPersistentAppendStage;
  message: string;
  persistenceAttempted?:
    boolean;
  persistenceConfirmed?:
    boolean;
  persistedSequence?:
    number | null;
  causeValue?:
    unknown;
}): never {
  throw new RuntimeOperationsPersistentAppendError(
    input,
  );
}

function isSha256(
  value: string,
): boolean {
  return /^[0-9a-f]{64}$/.test(
    value,
  );
}

function normalizeOperationId(
  operationId:
    string | undefined,
): {
  operationId:
    string | null;

  operationIdSha256:
    string | null;
} {
  if (
    operationId === undefined
  ) {
    return {
      operationId:
        null,

      operationIdSha256:
        null,
    };
  }

  if (
    typeof operationId !==
      "string" ||
    operationId.length < 1 ||
    operationId.length > 512 ||
    operationId.trim() !==
      operationId ||
    /[\u0000-\u001f\u007f]/.test(
      operationId,
    )
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_INVALID_OPERATION_ID",

      stage:
        "IDEMPOTENCY",

      message:
        "operationId must be a stable non-empty 1..512 character identifier without leading/trailing whitespace or control characters.",

      causeValue:
        operationId,
    });
  }

  const operationIdSha256 =
    createHash(
      "sha256",
    )
      .update(
        operationId,
        "utf8",
      )
      .digest(
        "hex",
      );

  if (
    !isSha256(
      operationIdSha256,
    )
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_OPERATION_ID_HASH_FAILURE",

      stage:
        "IDEMPOTENCY",

      message:
        "operationId SHA-256 derivation failed closed.",
    });
  }

  return {
    operationId,
    operationIdSha256,
  };
}

function assertNonEmpty(
  value: string,
  field: string,
  stage:
    RuntimeOperationsPersistentAppendStage,
): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_INVALID_STRING",

      stage,

      message:
        `${field} must be a non-empty string.`,

      causeValue:
        value,
    });
  }
}

function assertPositiveSafeInteger(
  value: number,
  field: string,
  stage:
    RuntimeOperationsPersistentAppendStage,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value < 1
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_INVALID_INTEGER",

      stage,

      message:
        `${field} must be a positive safe integer.`,

      causeValue:
        value,
    });
  }
}

function normalizePageSize(
  value: number | undefined,
): number {
  const normalized =
    value ??
    DEFAULT_PAGE_SIZE;

  if (
    !Number.isSafeInteger(
      normalized,
    ) ||
    normalized < 1 ||
    normalized >
      MAX_PAGE_SIZE
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_INVALID_PAGE_SIZE",

      stage:
        "FULL_CHAIN_READ",

      message:
        `verification.pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}.`,

      causeValue:
        value,
    });
  }

  return normalized;
}

function normalizeMaximumEntries(
  value: number | undefined,
): number {
  const normalized =
    value ??
    DEFAULT_MAX_VERIFICATION_ENTRIES;

  if (
    !Number.isSafeInteger(
      normalized,
    ) ||
    normalized < 1
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_INVALID_MAXIMUM_ENTRIES",

      stage:
        "FULL_CHAIN_READ",

      message:
        "verification.maximumEntries must be a positive safe integer.",

      causeValue:
        value,
    });
  }

  return normalized;
}

function assertAuthorization(
  authorization:
    RuntimeOperationsPersistentAppendAuthorization,
): void {
  if (
    authorization
      .humanAuthorized !==
    true
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_HUMAN_AUTHORIZATION_REQUIRED",

      stage:
        "AUTHORIZATION",

      message:
        "Persistent append requires explicit human authorization.",
    });
  }

  assertNonEmpty(
    authorization
      .authorizationRef,
    "authorization.authorizationRef",
    "AUTHORIZATION",
  );

  if (
    authorization
      .runtimeIpr !==
    CANONICAL_RUNTIME_IPR
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_RUNTIME_IPR_MISMATCH",

      stage:
        "AUTHORIZATION",

      message:
        "Authorization Runtime IPR is not canonical.",

      causeValue: {
        expected:
          CANONICAL_RUNTIME_IPR,

        actual:
          authorization
            .runtimeIpr,
      },
    });
  }

  if (
    authorization
      .humanAuthorityIpr !==
    CANONICAL_HUMAN_AUTHORITY_IPR
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_HUMAN_IPR_MISMATCH",

      stage:
        "AUTHORIZATION",

      message:
        "Authorization human authority IPR is not canonical.",

      causeValue: {
        expected:
          CANONICAL_HUMAN_AUTHORITY_IPR,

        actual:
          authorization
            .humanAuthorityIpr,
      },
    });
  }

  if (
    authorization
      .organization !==
    CANONICAL_ORGANIZATION
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_ORGANIZATION_MISMATCH",

      stage:
        "AUTHORIZATION",

      message:
        "Authorization organization is not canonical.",

      causeValue: {
        expected:
          CANONICAL_ORGANIZATION,

        actual:
          authorization
            .organization,
      },
    });
  }
}

function assertSourcePreconditions(
  sourceInput:
    RuntimeOperationsEvidenceInput,
): void {
  if (
    sourceInput.ok !==
    true
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_NOT_OK",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Only source inputs with ok=true may enter persistent append.",
    });
  }

  if (
    sourceInput
      .operationalStatus !==
    "PASS"
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_NOT_PASS",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Only source inputs with operationalStatus=PASS may enter persistent append.",

      causeValue:
        sourceInput
          .operationalStatus,
    });
  }

  if (
    sourceInput.summary
      .failedChecks !==
      0 ||
    sourceInput.summary
      .requiredFailed !==
      0
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_CHECKS_FAILED",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Source input contains failed checks.",

      causeValue: {
        failedChecks:
          sourceInput
            .summary
            .failedChecks,

        requiredFailed:
          sourceInput
            .summary
            .requiredFailed,
      },
    });
  }

  if (
    sourceInput.governance
      .humanAuthorizationRequired !==
    true
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_HUMAN_AUTHORIZATION_NOT_REQUIRED",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Source governance must require human authorization.",
    });
  }

  if (
    sourceInput.governance
      .autonomousAuthorization !==
    false
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_AUTONOMOUS_AUTHORIZATION_ENABLED",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Source governance must keep autonomous authorization disabled.",
    });
  }

  if (
    sourceInput.governance
      .runtimeActivationFromSelfTest !==
    false
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_RUNTIME_ACTIVATION_ENABLED",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Source governance must keep runtime activation disabled.",
    });
  }

  if (
    sourceInput.governance
      .noSubmitFromCode !==
    true
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_SUBMIT_GUARD_DISABLED",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Source governance must keep NO_SUBMIT_FROM_CODE enabled.",
    });
  }

  if (
    sourceInput.governance
      .legalCertification !==
    false
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_SOURCE_LEGAL_CERTIFICATION_ENABLED",

      stage:
        "SOURCE_PRECONDITION",

      message:
        "Source governance must keep legalCertification=false.",
    });
  }
}

function assertExpectedTip(
  expected:
    RuntimeOperationsPersistentAppendExpectedTip | undefined,
  latest:
    RuntimeOperationsLedgerRepositoryRecord,
): boolean {
  if (!expected) {
    return true;
  }

  assertPositiveSafeInteger(
    expected.sequence,
    "expectedTip.sequence",
    "TIP_READ",
  );

  if (
    !isSha256(
      expected.entrySha256,
    )
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_EXPECTED_TIP_INVALID_SHA256",

      stage:
        "TIP_READ",

      message:
        "expectedTip.entrySha256 must be a lowercase SHA-256 hex string.",

      causeValue:
        expected.entrySha256,
    });
  }

  const matched =
    expected.sequence ===
      latest.entry.sequence &&
    expected.entrySha256 ===
      latest.entry.chain
        .entrySha256;

  if (!matched) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_EXPECTED_TIP_MISMATCH",

      stage:
        "TIP_READ",

      message:
        "Persistent ledger tip does not match the caller precondition.",

      causeValue: {
        expected,

        actual: {
          sequence:
            latest.entry
              .sequence,

          entrySha256:
            latest.entry
              .chain
              .entrySha256,
        },
      },
    });
  }

  return true;
}

async function verifyCurrentTip(
  latest:
    RuntimeOperationsLedgerRepositoryRecord,
): Promise<void> {
  const sequence =
    latest.entry
      .sequence;

  const previousRecord =
    sequence === 1
      ? null
      : await getRuntimeOperationsLedgerEntryBySequence(
          sequence - 1,
        );

  if (
    sequence > 1 &&
    !previousRecord
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_PREVIOUS_TIP_ENTRY_MISSING",

      stage:
        "TIP_VERIFICATION",

      message:
        "Previous persistent ledger entry is missing before append.",

      causeValue: {
        sequence,

        expectedPreviousSequence:
          sequence - 1,
      },
    });
  }

  const verification =
    verifyRuntimeOperationsLedgerEntry({
      entry:
        latest.entry,

      previousEntry:
        previousRecord
          ?.entry ?? null,
    });

  if (
    verification.verified !==
      true ||
    verification.summary
      .failedChecks !==
      0
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_CURRENT_TIP_INVALID",

      stage:
        "TIP_VERIFICATION",

      message:
        "Current persistent ledger tip failed independent verification.",

      causeValue: {
        sequence,

        verified:
          verification
            .verified,

        failedChecks:
          verification
            .summary
            .failedChecks,
      },
    });
  }
}

function assertCanonicalEnvelope(
  envelope:
    ReturnType<
      typeof buildRuntimeOperationsOpcEnvelope
    >,
): void {
  if (
    envelope.identity
      .runtimeIpr !==
    CANONICAL_RUNTIME_IPR ||
    envelope.identity
      .humanAuthorityIpr !==
    CANONICAL_HUMAN_AUTHORITY_IPR ||
    envelope.identity
      .organization !==
    CANONICAL_ORGANIZATION
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_ENVELOPE_IDENTITY_MISMATCH",

      stage:
        "OPC_BUILD",

      message:
        "OPC/EVT envelope identity is not canonical.",

      causeValue:
        envelope.identity,
    });
  }

  if (
    envelope.governance
      .humanAuthorizationRequired !==
      true ||
    envelope.governance
      .autonomousAuthorization !==
      false ||
    envelope.governance
      .runtimeActivation !==
      false ||
    envelope.governance
      .legalCertification !==
      false ||
    envelope.internalSeal
      .qualifiedElectronicSignature !==
      false
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_ENVELOPE_GOVERNANCE_MISMATCH",

      stage:
        "OPC_BUILD",

      message:
        "OPC/EVT envelope governance invariants are not canonical.",

      causeValue: {
        governance:
          envelope.governance,

        qualifiedElectronicSignature:
          envelope.internalSeal
            .qualifiedElectronicSignature,
      },
    });
  }
}

async function readFullPersistentChain(input: {
  expectedLatestSequence:
    number;

  pageSize:
    number;

  maximumEntries:
    number;
}): Promise<
  RuntimeOperationsLedgerRepositoryRecord[]
> {
  if (
    input.expectedLatestSequence >
    input.maximumEntries
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_CHAIN_LIMIT_EXCEEDED",

      stage:
        "FULL_CHAIN_READ",

      message:
        "Persistent ledger exceeds the configured full-chain verification limit.",

      causeValue: {
        expectedLatestSequence:
          input.expectedLatestSequence,

        maximumEntries:
          input.maximumEntries,
      },
    });
  }

  const records:
    RuntimeOperationsLedgerRepositoryRecord[] =
    [];

  let afterSequence =
    0;

  while (
    afterSequence <
    input.expectedLatestSequence
  ) {
    const remaining =
      input.expectedLatestSequence -
      afterSequence;

    const limit =
      Math.min(
        input.pageSize,
        remaining,
      );

    const page =
      await listRuntimeOperationsLedgerEntries({
        limit,

        afterSequence,
      });

    if (
      page.length ===
      0
    ) {
      break;
    }

    records.push(
      ...page,
    );

    if (
      records.length >
      input.maximumEntries
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_CHAIN_LIMIT_EXCEEDED",

        stage:
          "FULL_CHAIN_READ",

        message:
          "Persistent ledger read exceeded the configured full-chain verification limit.",

        causeValue: {
          recordsRead:
            records.length,

          maximumEntries:
            input.maximumEntries,
        },
      });
    }

    const last =
      page[
        page.length - 1
      ];

    if (!last) {
      break;
    }

    if (
      last.entry
        .sequence <=
      afterSequence
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_CHAIN_PAGINATION_STALLED",

        stage:
          "FULL_CHAIN_READ",

      message:
        "Persistent ledger pagination did not advance.",

        causeValue: {
          afterSequence,

          observedSequence:
            last.entry
              .sequence,
        },
      });
    }

    afterSequence =
      last.entry
        .sequence;
  }

  return records;
}

export function verifyRuntimeOperationsPersistentChain(
  entries:
    RuntimeOperationsLedgerEntry[],
  expectedLatestSequence?:
    number,
): RuntimeOperationsPersistentChainVerificationResult {
  const details:
    RuntimeOperationsPersistentChainVerificationEntry[] =
    [];

  let previousEntry:
    RuntimeOperationsLedgerEntry | null =
    null;

  let sequenceContinuityVerified =
    true;

  let previousHashBindingsVerified =
    true;

  let allEntriesCryptographicallyVerified =
    true;

  let totalFailedChecks =
    0;

  for (
    let index = 0;
    index < entries.length;
    index += 1
  ) {
    const entry =
      entries[index];

    const expectedSequence =
      index + 1;

    const sequenceContinuity =
      entry.sequence ===
      expectedSequence;

    const expectedPreviousHash =
      previousEntry === null
        ? null
        : previousEntry.chain
            .entrySha256;

    const previousHashBinding =
      entry.chain
        .previousEntrySha256 ===
      expectedPreviousHash;

    const verification =
      verifyRuntimeOperationsLedgerEntry({
        entry,
        previousEntry,
      });

    const cryptographicVerificationPassed =
      verification.verified ===
        true &&
      verification.summary
        .failedChecks === 0;

    let structuralFailures =
      0;

    if (!sequenceContinuity) {
      sequenceContinuityVerified =
        false;

      structuralFailures +=
        1;
    }

    if (!previousHashBinding) {
      previousHashBindingsVerified =
        false;

      structuralFailures +=
        1;
    }

    if (
      !cryptographicVerificationPassed
    ) {
      allEntriesCryptographicallyVerified =
        false;
    }

    const failedChecks =
      verification.summary
        .failedChecks +
      structuralFailures;

    totalFailedChecks +=
      failedChecks;

    details.push({
      sequence:
        entry.sequence,

      verified:
        cryptographicVerificationPassed &&
        sequenceContinuity &&
        previousHashBinding,

      cryptographicVerificationPassed,

      sequenceContinuity,

      previousHashBinding,

      failedChecks,

      entrySha256:
        entry.chain
          .entrySha256,

      previousEntrySha256:
        entry.chain
          .previousEntrySha256,

      chainRootSha256:
        entry.chain
          .chainRootSha256,
    });

    previousEntry =
      entry;
  }

  const genesisSequence =
    entries[0]
      ?.sequence ?? null;

  const latestSequence =
    entries[
      entries.length - 1
    ]?.sequence ?? null;

  const tipCoverageVerified =
    expectedLatestSequence ===
      undefined
      ? true
      : latestSequence ===
          expectedLatestSequence &&
        entries.length ===
          expectedLatestSequence;

  if (
    !tipCoverageVerified
  ) {
    totalFailedChecks +=
      1;
  }

  return {
    verifierMode:
      "PERSISTENT_DATABASE_FULL_CHAIN",

    verified:
      entries.length > 0 &&
      genesisSequence === 1 &&
      sequenceContinuityVerified &&
      previousHashBindingsVerified &&
      allEntriesCryptographicallyVerified &&
      tipCoverageVerified &&
      totalFailedChecks === 0,

    entryCount:
      entries.length,

    genesisSequence,

    latestSequence,

    sequenceContinuityVerified,

    previousHashBindingsVerified,

    allEntriesCryptographicallyVerified,

    tipCoverageVerified,

    totalFailedChecks,

    entries:
      details,
  };
}

async function buildIdempotentReplayResult(input: {
  request:
    RuntimeOperationsPersistentAppendRequest;

  existing:
    RuntimeOperationsLedgerRepositoryRecord;

  operationIdSha256:
    string;

  pageSize:
    number;

  maximumEntries:
    number;
}): Promise<
  RuntimeOperationsPersistentAppendResult
> {
  /*
   * The stable logical operation id is authoritative for replay.
   * generatedAt is intentionally not compared because a retry may be
   * reconstructed later. Source revision must remain compatible.
   */
  if (
    input.request.sourceInput
      .revision !==
      input.existing.entry
        .source
        .sourceRevision
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_OPERATION_ID_SOURCE_REVISION_CONFLICT",

      stage:
        "IDEMPOTENCY",

      message:
        "The operationId is already bound to a different source revision.",

      persistenceAttempted:
        false,

      persistenceConfirmed:
        true,

      persistedSequence:
        input.existing.entry
          .sequence,

      causeValue: {
        operationIdSha256:
          input.operationIdSha256,

        persistedSourceRevision:
          input.existing.entry
            .source
            .sourceRevision,

        attemptedSourceRevision:
          input.request
            .sourceInput
            .revision,
      },
    });
  }

  const previousRecord =
    input.existing.entry
      .sequence === 1
      ? null
      : await getRuntimeOperationsLedgerEntryBySequence(
          input.existing.entry
            .sequence - 1,
        );

  if (
    input.existing.entry
      .sequence > 1 &&
    !previousRecord
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_IDEMPOTENT_REPLAY_PREVIOUS_ENTRY_MISSING",

      stage:
        "APPENDED_ENTRY_VERIFICATION",

      message:
        "Previous ledger entry required to verify idempotent replay is missing.",

      persistenceAttempted:
        false,

      persistenceConfirmed:
        true,

      persistedSequence:
        input.existing.entry
          .sequence,
    });
  }

  const appendedVerification =
    verifyRuntimeOperationsLedgerEntry({
      entry:
        input.existing.entry,

      previousEntry:
        previousRecord
          ?.entry ?? null,
    });

  if (
    appendedVerification
      .verified !== true ||
    appendedVerification
      .summary
      .failedChecks !== 0
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_IDEMPOTENT_REPLAY_ENTRY_INVALID",

      stage:
        "APPENDED_ENTRY_VERIFICATION",

      message:
        "Persisted idempotent replay entry failed independent verification.",

      persistenceAttempted:
        false,

      persistenceConfirmed:
        true,

      persistedSequence:
        input.existing.entry
          .sequence,

      causeValue:
        appendedVerification,
    });
  }

  const linkedToRepositoryTipAtAppend =
    input.existing.entry
      .sequence === 1
      ? input.existing.entry
          .chain
          .previousEntrySha256 ===
        null
      : input.existing.entry
          .chain
          .previousEntrySha256 ===
        previousRecord
          ?.entry.chain
            .entrySha256;

  if (
    !linkedToRepositoryTipAtAppend
  ) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_IDEMPOTENT_REPLAY_PREVIOUS_HASH_BINDING_FAILED",

      stage:
        "APPENDED_ENTRY_VERIFICATION",

      message:
        "Persisted idempotent replay entry does not bind its immediately previous entry.",

      persistenceAttempted:
        false,

      persistenceConfirmed:
        true,

      persistedSequence:
        input.existing.entry
          .sequence,
    });
  }

  const latestAfter =
    await getLatestRuntimeOperationsLedgerEntry();

  if (!latestAfter) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_IDEMPOTENT_REPLAY_LATEST_MISSING",

      stage:
        "FULL_CHAIN_READ",

      message:
        "Persistent ledger tip is missing during idempotent replay verification.",

      persistenceAttempted:
        false,

      persistenceConfirmed:
        true,

      persistedSequence:
        input.existing.entry
          .sequence,
    });
  }

  const records =
    await readFullPersistentChain({
      expectedLatestSequence:
        latestAfter.entry
          .sequence,

      pageSize:
        input.pageSize,

      maximumEntries:
        input.maximumEntries,
    });

  const fullChain =
    verifyRuntimeOperationsPersistentChain(
      records.map(
        (record) =>
          record.entry,
      ),

      latestAfter.entry
        .sequence,
    );

  if (!fullChain.verified) {
    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_IDEMPOTENT_REPLAY_FULL_CHAIN_INVALID",

      stage:
        "FULL_CHAIN_VERIFICATION",

      message:
        "Persistent full-chain verification failed during idempotent replay.",

      persistenceAttempted:
        false,

      persistenceConfirmed:
        true,

      persistedSequence:
        input.existing.entry
          .sequence,

      causeValue:
        fullChain,
    });
  }

  const expectedTipProvided =
    input.request
      .expectedTip !==
    undefined;

  const expectedTipMatched =
    !input.request
      .expectedTip ||
    (
      input.request
        .expectedTip
        .sequence ===
        latestAfter.entry
          .sequence &&
      input.request
        .expectedTip
        .entrySha256 ===
        latestAfter.entry
          .chain
          .entrySha256
    );

  return {
    ok:
      true,

    status:
      "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_PASS",

    operationalStatus:
      "PASS",

    revision:
      RUNTIME_OPERATIONS_PERSISTENT_APPEND_SERVICE_REVISION,

    identity: {
      runtimeIpr:
        CANONICAL_RUNTIME_IPR,

      humanAuthorityIpr:
        CANONICAL_HUMAN_AUTHORITY_IPR,

      organization:
        CANONICAL_ORGANIZATION,

      hermeticumSigil:
        HERMETICUM_SIGIL,
    },

    authorization: {
      humanAuthorized:
        true,

      authorizationRef:
        input.request
          .authorization
          .authorizationRef,

      rawCredentialPersisted:
        false,
    },

    preflight: {
      sequence:
        latestAfter.entry
          .sequence,

      entrySha256:
        latestAfter.entry
          .chain
          .entrySha256,

      chainRootSha256:
        latestAfter.entry
          .chain
          .chainRootSha256,

      expectedTipProvided,

      expectedTipMatched,
    },

    evidence: {
      revision:
        input.existing.entry
          .source
          .evidenceRevision,

      sha256:
        input.existing.entry
          .source
          .evidenceSha256,

      allRequiredChecksPassed:
        true,
    },

    opcEvt: {
      revision:
        input.existing.entry
          .source
          .envelopeRevision,

      envelopeSha256:
        input.existing.entry
          .source
          .envelopeSha256,

      internalSeal:
        input.existing.entry
          .source
          .internalSeal,

      verified:
        true,

      failedChecks:
        0,
    },

    persistence: {
      attempted:
        false,

      confirmed:
        true,

      table:
        input.existing
          .persistence
          .table,

      recordedAt:
        input.existing
          .persistence
          .recordedAt,

      sequence:
        input.existing.entry
          .sequence,

      operationIdSha256:
        input.operationIdSha256,

      inserted:
        false,

      idempotentReplay:
        true,
    },

    idempotency: {
      enabled:
        true,

      operationIdSha256:
        input.operationIdSha256,

      inserted:
        false,

      replayed:
        true,

      legacyKeyless:
        false,

      rawOperationIdPersisted:
        false,
    },

    append: {
      expectedNextSequence:
        input.existing.entry
          .sequence,

      sequence:
        input.existing.entry
          .sequence,

      previousEntrySha256:
        input.existing.entry
          .chain
          .previousEntrySha256,

      entrySha256:
        input.existing.entry
          .chain
          .entrySha256,

      chainRootSha256:
        input.existing.entry
          .chain
          .chainRootSha256,

      linkedToRepositoryTipAtAppend,

      concurrentTipAdvanceObserved:
        false,
    },

    verification: {
      rereadMatched:
        true,

      appendedEntryVerified:
        true,

      appendedEntryFailedChecks:
        0,

      fullChain,
    },

    governance: {
      appendOnly:
        true,

      hashOnlyEvidence:
        true,

      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivation:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,

      qualifiedElectronicSignature:
        false,
    },
  };
}

export async function appendRuntimeOperationsPersistentEvidence(
  request:
    RuntimeOperationsPersistentAppendRequest,
): Promise<
  RuntimeOperationsPersistentAppendResult
> {
  let persistenceAttempted =
    false;

  let persistenceConfirmed =
    false;

  let persistedSequence:
    number | null =
    null;

  try {
    /*
     * 1. Authorization is explicit and external to this service.
     *
     * This service never validates or stores raw credentials/tokens.
     * The caller must resolve the human authorization before invoking it.
     */
    assertAuthorization(
      request.authorization,
    );

    /*
     * 2. Only already-passing, governance-compatible source input enters
     * the persistence pipeline.
     */
    assertSourcePreconditions(
      request.sourceInput,
    );

    const pageSize =
      normalizePageSize(
        request.verification
          ?.pageSize,
      );

    const maximumEntries =
      normalizeMaximumEntries(
        request.verification
          ?.maximumEntries,
      );

    const {
      operationIdSha256,
    } =
      normalizeOperationId(
        request.operationId,
      );

    /*
     * 3. Operation-level idempotency preflight.
     *
     * If the stable logical operation already exists, return the
     * independently verified persisted entry without building a fresh
     * generatedAt-dependent Evidence / OPC payload and without attempting
     * a second database append.
     */
    if (
      operationIdSha256 !==
      null
    ) {
      const existing =
        await getRuntimeOperationsLedgerEntryByOperationIdSha256(
          operationIdSha256,
        );

      if (existing) {
        return await buildIdempotentReplayResult({
          request,
          existing,
          operationIdSha256,
          pageSize,
          maximumEntries,
        });
      }
    }

    /*
     * 4. Read and independently verify the current persistent tip.
     *
     * The service is intentionally a continuation service. Genesis has
     * its own bootstrap path and must already exist.
     */
    const latestBefore =
      await getLatestRuntimeOperationsLedgerEntry();

    if (!latestBefore) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_GENESIS_REQUIRED",

        stage:
          "TIP_READ",

        message:
          "Persistent append service requires an existing ledger Genesis entry.",
      });
    }

    const expectedTipMatched =
      assertExpectedTip(
        request.expectedTip,
        latestBefore,
      );

    await verifyCurrentTip(
      latestBefore,
    );

    /*
     * 5. Build hash-only evidence and OPC/EVT envelope.
     */
    const evidence =
      buildRuntimeOperationsEvidence(
        request.sourceInput,
      );

    if (
      evidence.verification
        .allRequiredChecksPassed !==
      true
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_EVIDENCE_VERIFICATION_FAILED",

        stage:
          "EVIDENCE_BUILD",

        message:
          "Runtime Operations evidence did not pass all required checks.",

        causeValue: {
          evidenceRevision:
            evidence.revision,

          evidenceSha256:
            evidence.integrity
              .sha256,

          allRequiredChecksPassed:
            evidence.verification
              .allRequiredChecksPassed,
        },
      });
    }

    const envelope =
      buildRuntimeOperationsOpcEnvelope({
        evidence,
      });

    assertCanonicalEnvelope(
      envelope,
    );

    const opcVerification =
      verifyRuntimeOperationsOpcEnvelope({
        sourceInput:
          request.sourceInput,

        evidence,

        envelope,
      });

    if (
      opcVerification.verified !==
        true ||
      opcVerification
        .operationalStatus !==
        "PASS" ||
      opcVerification.summary
        .failedChecks !==
        0
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_OPC_VERIFICATION_FAILED",

        stage:
          "OPC_VERIFICATION",

        message:
          "OPC/EVT envelope failed independent verification.",

        causeValue: {
          verified:
            opcVerification
              .verified,

          operationalStatus:
            opcVerification
              .operationalStatus,

          failedChecks:
            opcVerification
              .summary
              .failedChecks,
        },
      });
    }

    /*
     * 6. Single persistence call.
     *
     * The repository/database owns append serialization and operation-id
     * uniqueness. Sequential retries are filtered before this point; a
     * same-operation concurrent winner may also be returned by repository.
     */
    persistenceAttempted =
      true;

    const persisted =
      await appendVerifiedRuntimeOperationsLedgerEntry({
        envelope,

        verification:
          opcVerification,

        operationIdSha256,
      });

    persistenceConfirmed =
      true;

    persistedSequence =
      persisted.entry
        .sequence;

    const expectedNextSequence =
      latestBefore.entry
        .sequence + 1;

    const concurrentTipAdvanceObserved =
      persisted.entry
        .sequence !==
      expectedNextSequence;

    /*
     * 7. Independent reread of the exact persisted/resolved sequence.
     */
    const reread =
      await getRuntimeOperationsLedgerEntryBySequence(
        persisted.entry
          .sequence,
      );

    if (!reread) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_REREAD_MISSING",

        stage:
          "PERSISTENCE_REREAD",

        message:
          "Persisted ledger entry could not be reread.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,
      });
    }

    const rereadMatched =
      reread.entry
        .chain
        .entrySha256 ===
        persisted.entry
          .chain
          .entrySha256 &&
      reread.entry
        .source
        .evidenceSha256 ===
        evidence.integrity
          .sha256 &&
      reread.entry
        .source
        .envelopeSha256 ===
        envelope.integrity
          .envelopeSha256;

    if (!rereadMatched) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_REREAD_MISMATCH",

        stage:
          "PERSISTENCE_REREAD",

        message:
          "Reread ledger entry does not match the persisted cryptographic identifiers.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,

        causeValue: {
          persistedEntrySha256:
            persisted.entry
              .chain
              .entrySha256,

          rereadEntrySha256:
            reread.entry
              .chain
              .entrySha256,

          evidenceSha256Expected:
            evidence.integrity
              .sha256,

          evidenceSha256Actual:
            reread.entry
              .source
              .evidenceSha256,

          envelopeSha256Expected:
            envelope.integrity
              .envelopeSha256,

          envelopeSha256Actual:
            reread.entry
              .source
              .envelopeSha256,
        },
      });
    }

    const previousRecord =
      reread.entry
        .sequence === 1
        ? null
        : await getRuntimeOperationsLedgerEntryBySequence(
            reread.entry
              .sequence - 1,
          );

    if (
      reread.entry
        .sequence > 1 &&
      !previousRecord
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_PREVIOUS_ENTRY_MISSING_AFTER_PERSISTENCE",

        stage:
          "APPENDED_ENTRY_VERIFICATION",

        message:
          "Previous ledger entry required to verify the appended record is missing.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,
      });
    }

    const appendedVerification =
      verifyRuntimeOperationsLedgerEntry({
        entry:
          reread.entry,

        previousEntry:
          previousRecord
            ?.entry ?? null,
      });

    if (
      appendedVerification
        .verified !== true ||
      appendedVerification
        .summary
        .failedChecks !== 0
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_POST_PERSISTENCE_VERIFICATION_FAILED",

        stage:
          "APPENDED_ENTRY_VERIFICATION",

        message:
          "Persisted ledger entry failed independent verification.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,

        causeValue: {
          verified:
            appendedVerification
              .verified,

          failedChecks:
            appendedVerification
              .summary
              .failedChecks,
        },
      });
    }

    const linkedToRepositoryTipAtAppend =
      reread.entry
        .sequence === 1
        ? reread.entry
            .chain
            .previousEntrySha256 ===
          null
        : reread.entry
            .chain
            .previousEntrySha256 ===
          previousRecord
            ?.entry.chain
              .entrySha256;

    if (
      !linkedToRepositoryTipAtAppend
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_PREVIOUS_HASH_BINDING_FAILED",

        stage:
          "APPENDED_ENTRY_VERIFICATION",

        message:
          "Persisted entry does not bind the immediately previous ledger entry.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,
      });
    }

    /*
     * 8. Read and verify the complete current chain.
     */
    const latestAfter =
      await getLatestRuntimeOperationsLedgerEntry();

    if (!latestAfter) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_LATEST_AFTER_MISSING",

        stage:
          "FULL_CHAIN_READ",

        message:
          "Persistent ledger tip disappeared after append.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,
      });
    }

    if (
      latestAfter.entry
        .sequence <
      reread.entry
        .sequence
    ) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_TIP_REGRESSION",

        stage:
          "FULL_CHAIN_READ",

        message:
          "Persistent ledger tip regressed after append.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,

        causeValue: {
          persistedSequence:
            reread.entry
              .sequence,

          observedLatestSequence:
            latestAfter.entry
              .sequence,
        },
      });
    }

    const records =
      await readFullPersistentChain({
        expectedLatestSequence:
          latestAfter.entry
            .sequence,

        pageSize,

        maximumEntries,
      });

    const fullChain =
      verifyRuntimeOperationsPersistentChain(
        records.map(
          (record) =>
            record.entry,
        ),

        latestAfter.entry
          .sequence,
      );

    if (!fullChain.verified) {
      fail({
        code:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_FULL_CHAIN_VERIFICATION_FAILED",

        stage:
          "FULL_CHAIN_VERIFICATION",

        message:
          "Persistent ledger full-chain verification failed after append.",

        persistenceAttempted,
        persistenceConfirmed,
        persistedSequence,

        causeValue:
          fullChain,
      });
    }

    return {
      ok:
        true,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_PASS",

      operationalStatus:
        "PASS",

      revision:
        RUNTIME_OPERATIONS_PERSISTENT_APPEND_SERVICE_REVISION,

      identity: {
        runtimeIpr:
          CANONICAL_RUNTIME_IPR,

        humanAuthorityIpr:
          CANONICAL_HUMAN_AUTHORITY_IPR,

        organization:
          CANONICAL_ORGANIZATION,

        hermeticumSigil:
          HERMETICUM_SIGIL,
      },

      authorization: {
        humanAuthorized:
          true,

        authorizationRef:
          request.authorization
            .authorizationRef,

        rawCredentialPersisted:
          false,
      },

      preflight: {
        sequence:
          latestBefore.entry
            .sequence,

        entrySha256:
          latestBefore.entry
            .chain
            .entrySha256,

        chainRootSha256:
          latestBefore.entry
            .chain
            .chainRootSha256,

        expectedTipProvided:
          request.expectedTip !==
          undefined,

        expectedTipMatched,
      },

      evidence: {
        revision:
          evidence.revision,

        sha256:
          evidence.integrity
            .sha256,

        allRequiredChecksPassed:
          true,
      },

      opcEvt: {
        revision:
          envelope.revision,

        envelopeSha256:
          envelope.integrity
            .envelopeSha256,

        internalSeal:
          envelope.internalSeal
            .value,

        verified:
          true,

        failedChecks:
          0,
      },

      persistence: {
        attempted:
          true,

        confirmed:
          true,

        table:
          persisted.persistence
            .table,

        recordedAt:
          persisted.persistence
            .recordedAt,

        sequence:
          reread.entry
            .sequence,

        operationIdSha256:
          persisted.persistence
            .operationIdSha256,

        inserted:
          persisted.persistence
            .inserted,

        idempotentReplay:
          persisted.persistence
            .idempotentReplay,
      },

      idempotency: {
        enabled:
          operationIdSha256 !==
          null,

        operationIdSha256,

        inserted:
          persisted.persistence
            .inserted,

        replayed:
          persisted.persistence
            .idempotentReplay,

        legacyKeyless:
          operationIdSha256 ===
          null,

        rawOperationIdPersisted:
          false,
      },

      append: {
        expectedNextSequence,

        sequence:
          reread.entry
            .sequence,

        previousEntrySha256:
          reread.entry
            .chain
            .previousEntrySha256,

        entrySha256:
          reread.entry
            .chain
            .entrySha256,

        chainRootSha256:
          reread.entry
            .chain
            .chainRootSha256,

        linkedToRepositoryTipAtAppend,

        concurrentTipAdvanceObserved,
      },

      verification: {
        rereadMatched:
          true,

        appendedEntryVerified:
          true,

        appendedEntryFailedChecks:
          0,

        fullChain,
      },

      governance: {
        appendOnly:
          true,

        hashOnlyEvidence:
          true,

        humanAuthorizationRequired:
          true,

        autonomousAuthorization:
          false,

        runtimeActivation:
          false,

        noSubmitFromCode:
          true,

        legalCertification:
          false,

        qualifiedElectronicSignature:
          false,
      },
    };
  } catch (error) {
    if (
      error instanceof
      RuntimeOperationsPersistentAppendError
    ) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    fail({
      code:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_UNEXPECTED_FAILURE",

      stage:
        persistenceConfirmed
          ? "FULL_CHAIN_VERIFICATION"
          : persistenceAttempted
            ? "PERSISTENCE_APPEND"
            : "SOURCE_PRECONDITION",

      message:
        `Persistent append failed closed: ${message}`,

      persistenceAttempted,

      persistenceConfirmed,

      persistedSequence,

      causeValue:
        error,
    });
  }
}

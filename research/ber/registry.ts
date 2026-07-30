/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Biocybernetic Evolution Register
 * Append-Only Registry
 *
 * Purpose:
 * - Persist BER records without allowing mutation or deletion.
 * - Preserve the chronological and evidentiary continuity of HBCE R&D.
 * - Prevent duplicate identifiers and accidental history rewriting.
 *
 * Invariant:
 * Once a BER record is appended, it cannot be updated or deleted
 * through this registry.
 */

import {
  assertValidBerRecord,
  type BerStatus,
  type BiocyberneticEvolutionRecord,
} from "./biocybernetic-evolution-register";

export interface BerRegistryStorage {
  getById(
    berId: string,
  ): Promise<BiocyberneticEvolutionRecord | null>;

  getAll(): Promise<BiocyberneticEvolutionRecord[]>;

  append(
    record: BiocyberneticEvolutionRecord,
  ): Promise<void>;
}

export interface BerRegistryQuery {
  researchTrack?: string;
  missionId?: string;
  biologicalIprId?: string;
  cyberneticIprId?: string;
  status?: BerStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface BerRegistrySummary {
  totalRecords: number;
  verifiedRecords: number;
  observedRecords: number;
  rejectedRecords: number;
  supersededRecords: number;
  firstRecordAt?: string;
  lastRecordAt?: string;
  latestBerId?: string;
}

export class BerRegistryError extends Error {
  readonly code:
    | "INVALID_RECORD"
    | "DUPLICATE_BER_ID"
    | "PREVIOUS_RECORD_NOT_FOUND"
    | "CHAIN_MISMATCH"
    | "STORAGE_FAILURE";

  constructor(
    code: BerRegistryError["code"],
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });

    this.name = "BerRegistryError";
    this.code = code;
  }
}

function cloneRecord(
  record: BiocyberneticEvolutionRecord,
): BiocyberneticEvolutionRecord {
  return structuredClone(record);
}

function sortChronologically(
  records: BiocyberneticEvolutionRecord[],
): BiocyberneticEvolutionRecord[] {
  return [...records].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.berId.localeCompare(right.berId);
  });
}

function isWithinDateRange(
  record: BiocyberneticEvolutionRecord,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  const recordTime = Date.parse(record.createdAt);

  if (Number.isNaN(recordTime)) {
    return false;
  }

  if (dateFrom) {
    const fromTime = Date.parse(dateFrom);

    if (!Number.isNaN(fromTime) && recordTime < fromTime) {
      return false;
    }
  }

  if (dateTo) {
    const toTime = Date.parse(dateTo);

    if (!Number.isNaN(toTime) && recordTime > toTime) {
      return false;
    }
  }

  return true;
}

export class BiocyberneticEvolutionRegistry {
  constructor(
    private readonly storage: BerRegistryStorage,
  ) {}

  /**
   * Appends one BER record.
   *
   * No update and no delete methods are exposed.
   * Apparently history needs protection from its authors.
   */
  async append(
    record: BiocyberneticEvolutionRecord,
  ): Promise<void> {
    try {
      assertValidBerRecord(record);
    } catch (error) {
      throw new BerRegistryError(
        "INVALID_RECORD",
        `BER record ${record.berId} is invalid.`,
        error,
      );
    }

    let existing: BiocyberneticEvolutionRecord | null;

    try {
      existing = await this.storage.getById(record.berId);
    } catch (error) {
      throw new BerRegistryError(
        "STORAGE_FAILURE",
        `Unable to verify BER identifier ${record.berId}.`,
        error,
      );
    }

    if (existing) {
      throw new BerRegistryError(
        "DUPLICATE_BER_ID",
        `BER record ${record.berId} already exists.`,
      );
    }

    const previousBerId =
      record.evidenceChain.previousBerId;

    if (previousBerId) {
      let previousRecord:
        | BiocyberneticEvolutionRecord
        | null;

      try {
        previousRecord =
          await this.storage.getById(previousBerId);
      } catch (error) {
        throw new BerRegistryError(
          "STORAGE_FAILURE",
          `Unable to verify previous BER record ${previousBerId}.`,
          error,
        );
      }

      if (!previousRecord) {
        throw new BerRegistryError(
          "PREVIOUS_RECORD_NOT_FOUND",
          `Previous BER record ${previousBerId} does not exist.`,
        );
      }

      if (
        previousRecord.ipr.biologicalIprId !==
          record.ipr.biologicalIprId ||
        previousRecord.ipr.cyberneticIprId !==
          record.ipr.cyberneticIprId
      ) {
        throw new BerRegistryError(
          "CHAIN_MISMATCH",
          `BER record ${record.berId} does not preserve the IPR chain of ${previousBerId}.`,
        );
      }

      if (
        Date.parse(record.createdAt) <
        Date.parse(previousRecord.createdAt)
      ) {
        throw new BerRegistryError(
          "CHAIN_MISMATCH",
          `BER record ${record.berId} predates its previous record ${previousBerId}.`,
        );
      }
    }

    try {
      await this.storage.append(cloneRecord(record));
    } catch (error) {
      throw new BerRegistryError(
        "STORAGE_FAILURE",
        `Unable to append BER record ${record.berId}.`,
        error,
      );
    }
  }

  async getById(
    berId: string,
  ): Promise<BiocyberneticEvolutionRecord | null> {
    try {
      const record = await this.storage.getById(berId);

      return record ? cloneRecord(record) : null;
    } catch (error) {
      throw new BerRegistryError(
        "STORAGE_FAILURE",
        `Unable to read BER record ${berId}.`,
        error,
      );
    }
  }

  async getTimeline(): Promise<
    BiocyberneticEvolutionRecord[]
  > {
    try {
      const records = await this.storage.getAll();

      return sortChronologically(records).map(
        cloneRecord,
      );
    } catch (error) {
      throw new BerRegistryError(
        "STORAGE_FAILURE",
        "Unable to read the BER timeline.",
        error,
      );
    }
  }

  async query(
    query: BerRegistryQuery,
  ): Promise<BiocyberneticEvolutionRecord[]> {
    const records = await this.getTimeline();

    return records.filter((record) => {
      if (
        query.researchTrack &&
        record.researchTrack !== query.researchTrack
      ) {
        return false;
      }

      if (
        query.missionId &&
        record.missionId !== query.missionId
      ) {
        return false;
      }

      if (
        query.biologicalIprId &&
        record.ipr.biologicalIprId !==
          query.biologicalIprId
      ) {
        return false;
      }

      if (
        query.cyberneticIprId &&
        record.ipr.cyberneticIprId !==
          query.cyberneticIprId
      ) {
        return false;
      }

      if (
        query.status &&
        record.status !== query.status
      ) {
        return false;
      }

      return isWithinDateRange(
        record,
        query.dateFrom,
        query.dateTo,
      );
    });
  }

  async getLatest(): Promise<
    BiocyberneticEvolutionRecord | null
  > {
    const timeline = await this.getTimeline();

    return timeline.length > 0
      ? timeline[timeline.length - 1]
      : null;
  }

  async getSummary(): Promise<BerRegistrySummary> {
    const timeline = await this.getTimeline();

    const summary: BerRegistrySummary = {
      totalRecords: timeline.length,
      verifiedRecords: 0,
      observedRecords: 0,
      rejectedRecords: 0,
      supersededRecords: 0,
    };

    for (const record of timeline) {
      switch (record.status) {
        case "VERIFIED":
          summary.verifiedRecords += 1;
          break;

        case "OBSERVED":
          summary.observedRecords += 1;
          break;

        case "REJECTED":
          summary.rejectedRecords += 1;
          break;

        case "SUPERSEDED":
          summary.supersededRecords += 1;
          break;
      }
    }

    if (timeline.length > 0) {
      const first = timeline[0];
      const latest = timeline[timeline.length - 1];

      summary.firstRecordAt = first.createdAt;
      summary.lastRecordAt = latest.createdAt;
      summary.latestBerId = latest.berId;
    }

    return summary;
  }
}

/**
 * Minimal in-memory storage.
 *
 * Intended for tests, local development and deterministic validation.
 * Production must replace this adapter with persistent append-only storage.
 */
export class InMemoryBerRegistryStorage
  implements BerRegistryStorage
{
  private readonly records =
    new Map<string, BiocyberneticEvolutionRecord>();

  async getById(
    berId: string,
  ): Promise<BiocyberneticEvolutionRecord | null> {
    const record = this.records.get(berId);

    return record ? cloneRecord(record) : null;
  }

  async getAll(): Promise<
    BiocyberneticEvolutionRecord[]
  > {
    return Array.from(this.records.values()).map(
      cloneRecord,
    );
  }

  async append(
    record: BiocyberneticEvolutionRecord,
  ): Promise<void> {
    if (this.records.has(record.berId)) {
      throw new Error(
        `Duplicate BER identifier: ${record.berId}`,
      );
    }

    this.records.set(
      record.berId,
      cloneRecord(record),
    );
  }
}

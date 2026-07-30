/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * BER JSONL Append-Only Storage
 *
 * Purpose:
 * - Persist BER records on disk.
 * - Store one canonical JSON record per line.
 * - Prevent update and delete operations.
 * - Detect duplicate BER identifiers.
 * - Reject malformed or corrupted registry entries.
 *
 * Storage format:
 *
 * {"berId":"BER-0001", ...}
 * {"berId":"BER-0002", ...}
 * {"berId":"BER-0003", ...}
 *
 * This adapter is intended for:
 * - local development;
 * - deterministic testing;
 * - controlled single-process runtime execution;
 * - repository-level R&D evidence storage.
 *
 * For multi-instance production deployments, use a transactional
 * append-only database implementation with a unique BER identifier.
 */

import {
  appendFile,
  mkdir,
  open,
  readFile,
} from "node:fs/promises";

import { dirname } from "node:path";

import {
  assertValidBerRecord,
  type BiocyberneticEvolutionRecord,
} from "./biocybernetic-evolution-register";

import type {
  BerRegistryStorage,
} from "./registry";

export class JsonlBerStorageError extends Error {
  readonly code:
    | "READ_FAILURE"
    | "WRITE_FAILURE"
    | "INVALID_LINE"
    | "INVALID_RECORD"
    | "DUPLICATE_BER_ID"
    | "STORAGE_LOCKED";

  constructor(
    code: JsonlBerStorageError["code"],
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });

    this.name = "JsonlBerStorageError";
    this.code = code;
  }
}

export interface JsonlBerStorageOptions {
  filePath: string;

  createDirectory?: boolean;

  fsyncAfterAppend?: boolean;
}

function cloneRecord(
  record: BiocyberneticEvolutionRecord,
): BiocyberneticEvolutionRecord {
  return structuredClone(record);
}

function serializeRecord(
  record: BiocyberneticEvolutionRecord,
): string {
  return `${JSON.stringify(record)}\n`;
}

function isBlankLine(
  line: string,
): boolean {
  return line.trim().length === 0;
}

export class JsonlBerRegistryStorage
  implements BerRegistryStorage
{
  private readonly filePath: string;

  private readonly createDirectory: boolean;

  private readonly fsyncAfterAppend: boolean;

  private writeQueue: Promise<void> =
    Promise.resolve();

  constructor(
    options: JsonlBerStorageOptions,
  ) {
    if (!options.filePath.trim()) {
      throw new JsonlBerStorageError(
        "WRITE_FAILURE",
        "BER JSONL filePath is required.",
      );
    }

    this.filePath = options.filePath;

    this.createDirectory =
      options.createDirectory ?? true;

    this.fsyncAfterAppend =
      options.fsyncAfterAppend ?? true;
  }

  async getById(
    berId: string,
  ): Promise<BiocyberneticEvolutionRecord | null> {
    if (!berId.trim()) {
      return null;
    }

    const records = await this.readAllRecords();

    const record = records.find(
      (candidate) =>
        candidate.berId === berId,
    );

    return record
      ? cloneRecord(record)
      : null;
  }

  async getAll(): Promise<
    BiocyberneticEvolutionRecord[]
  > {
    const records =
      await this.readAllRecords();

    return records.map(cloneRecord);
  }

  /**
   * Appends one record to the JSONL file.
   *
   * Writes are serialized inside the current process.
   * No update or delete operation is exposed.
   */
  async append(
    record: BiocyberneticEvolutionRecord,
  ): Promise<void> {
    const operation = async (): Promise<void> => {
      this.validateRecord(record);

      await this.ensureStorageDirectory();

      const existing =
        await this.getById(record.berId);

      if (existing) {
        throw new JsonlBerStorageError(
          "DUPLICATE_BER_ID",
          `BER record ${record.berId} already exists in ${this.filePath}.`,
        );
      }

      const serialized =
        serializeRecord(
          cloneRecord(record),
        );

      if (!this.fsyncAfterAppend) {
        try {
          await appendFile(
            this.filePath,
            serialized,
            {
              encoding: "utf8",

              flag: "a",
            },
          );

          return;
        } catch (error) {
          throw new JsonlBerStorageError(
            "WRITE_FAILURE",
            `Unable to append BER record ${record.berId}.`,
            error,
          );
        }
      }

      let handle:
        Awaited<ReturnType<typeof open>>
        | undefined;

      try {
        handle = await open(
          this.filePath,
          "a",
        );

        await handle.writeFile(
          serialized,
          {
            encoding: "utf8",
          },
        );

        await handle.sync();
      } catch (error) {
        throw new JsonlBerStorageError(
          "WRITE_FAILURE",
          `Unable to durably append BER record ${record.berId}.`,
          error,
        );
      } finally {
        await handle?.close();
      }
    };

    const queuedOperation =
      this.writeQueue.then(operation);

    this.writeQueue =
      queuedOperation.catch(() => undefined);

    return queuedOperation;
  }

  private async ensureStorageDirectory():
    Promise<void> {
    if (!this.createDirectory) {
      return;
    }

    const directory =
      dirname(this.filePath);

    try {
      await mkdir(directory, {
        recursive: true,
      });
    } catch (error) {
      throw new JsonlBerStorageError(
        "WRITE_FAILURE",
        `Unable to create BER storage directory ${directory}.`,
        error,
      );
    }
  }

  private validateRecord(
    record: BiocyberneticEvolutionRecord,
  ): void {
    try {
      assertValidBerRecord(record);
    } catch (error) {
      throw new JsonlBerStorageError(
        "INVALID_RECORD",
        `BER record ${record.berId} is invalid.`,
        error,
      );
    }
  }

  private async readAllRecords(): Promise<
    BiocyberneticEvolutionRecord[]
  > {
    let content: string;

    try {
      content = await readFile(
        this.filePath,
        "utf8",
      );
    } catch (error) {
      const possibleError =
        error as NodeJS.ErrnoException;

      if (
        possibleError.code === "ENOENT"
      ) {
        return [];
      }

      throw new JsonlBerStorageError(
        "READ_FAILURE",
        `Unable to read BER registry ${this.filePath}.`,
        error,
      );
    }

    const records:
      BiocyberneticEvolutionRecord[] = [];

    const seenIdentifiers =
      new Set<string>();

    const lines =
      content.split(/\r?\n/u);

    for (
      let index = 0;
      index < lines.length;
      index += 1
    ) {
      const line = lines[index];

      if (isBlankLine(line)) {
        continue;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(line);
      } catch (error) {
        throw new JsonlBerStorageError(
          "INVALID_LINE",
          `Invalid JSON at BER registry line ${index + 1}.`,
          error,
        );
      }

      const record =
        parsed as BiocyberneticEvolutionRecord;

      try {
        assertValidBerRecord(record);
      } catch (error) {
        throw new JsonlBerStorageError(
          "INVALID_RECORD",
          `Invalid BER record at line ${index + 1}.`,
          error,
        );
      }

      if (
        seenIdentifiers.has(record.berId)
      ) {
        throw new JsonlBerStorageError(
          "DUPLICATE_BER_ID",
          `Duplicate BER identifier ${record.berId} found at line ${index + 1}.`,
        );
      }

      seenIdentifiers.add(record.berId);

      records.push(
        cloneRecord(record),
      );
    }

    return records;
  }
}

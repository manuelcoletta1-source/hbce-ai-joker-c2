export type FileRole =
  | "context"
  | "corpus"
  | "single"
  | "reference"
  | "evidence"
  | "temporary";

export type StoredFile = {
  id: string;
  sessionId: string;
  name: string;
  title: string;
  mimeType: string;
  text: string;
  content: string;
  hasText: boolean;
  sizeEstimate: number;
  role: FileRole;
  ingestedAt: string;
  updatedAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __HBCE_FILE_STORE__:
    | Map<string, Map<string, StoredFile>>
    | undefined;
}

export function getFileStore(): Map<string, Map<string, StoredFile>> {
  if (!globalThis.__HBCE_FILE_STORE__) {
    globalThis.__HBCE_FILE_STORE__ = new Map();
  }

  return globalThis.__HBCE_FILE_STORE__;
}

export function getSessionFiles(sessionId: string): StoredFile[] {
  const store = getFileStore();
  const filesMap = store.get(sessionId);

  if (!filesMap) {
    return [];
  }

  return Array.from(filesMap.values()).sort((a, b) =>
    a.ingestedAt.localeCompare(b.ingestedAt)
  );
}

export function getStoredFileBody(file: StoredFile): string {
  return (file.text || file.content || "").trim();
}

export function buildStoredFilesIndex(files: StoredFile[]): string {
  if (files.length === 0) {
    return "No active session files.";
  }

  return files
    .map(
      (file, index) =>
        `${index + 1}. ${file.title || file.name} [role=${file.role}; hasText=${
          file.hasText ? "yes" : "no"
        }]`
    )
    .join("\n");
}

export function buildStoredFilesContext(files: StoredFile[]): string {
  if (files.length === 0) return "";

  return files
    .map((file, index) => {
      const label = file.title || file.name || `file-${index + 1}`;
      const body = getStoredFileBody(file);

      if (!body) {
        return [
          `ACTIVE FILE ${index + 1}: ${label}`,
          `[Role: ${file.role}]`,
          "[No textual extraction available. Metadata only.]"
        ].join("\n");
      }

      return [
        `ACTIVE FILE ${index + 1}: ${label}`,
        `[Role: ${file.role}]`,
        body.slice(0, 20000)
      ].join("\n");
    })
    .join("\n\n");
}

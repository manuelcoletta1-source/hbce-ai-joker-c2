"use client";

export type JokerClientFile = {
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  role?: string;
};

export type JokerChatRequest = {
  message: string;
  files?: JokerClientFile[];
};

export type JokerChatResponse = {
  ok: boolean;
  sessionId?: string;
  response?: string;
  state?: string;
  decision?: string;
  governanceDecision?: string;
  projectDomain?: string;
  activeDomains?: string[];
  domainType?: string;
  contextClass?: string;
  legacyContextClass?: string;
  intentClass?: string;
  documentMode?: string;
  documentFamily?: string;
  evtIprMemoryUsed?: boolean;
  memorySource?: string;
  structuredFormat?: boolean;
  activeFiles?: string[];
  identity?: {
    entity?: string;
    ipr?: string;
    evt?: string;
    state?: string;
    cycle?: string;
    core?: string;
  };
  evt?: {
    ok?: boolean;
    evt?: string;
    prev?: string;
    hash?: string;
  };
  governedEvt?: {
    ok?: boolean;
    evt?: string;
    prev?: string;
    project?: string;
    activeDomains?: string[];
    hash?: string;
    appendStatus?: string;
    appendReason?: string;
  };
  memory?: {
    used?: boolean;
    source?: string;
    lastEventId?: string | null;
    event?: string;
    appendStatus?: string;
    appendReason?: string;
    governedEvt?: string | null;
    governedHash?: string | null;
  };
  diagnostics?: {
    openaiConfigured?: boolean;
    modelUsed?: string;
    degradedReason?: string | null;
    evtIprMemoryUsed?: boolean;
    memorySource?: string;
    memoryEvent?: string;
    memoryAppendStatus?: string;
    structuredFormat?: boolean;
  };
  error?: string;
};

const JOKER_SESSION_STORAGE_KEY = "AI_JOKER_C2_SESSION_ID";
const JOKER_CONTINUITY_STORAGE_KEY = "AI_JOKER_C2_CONTINUITY_REF";
const JOKER_LAST_MEMORY_EVT_STORAGE_KEY = "AI_JOKER_C2_LAST_MEMORY_EVT";
const JOKER_LAST_GOVERNED_EVT_STORAGE_KEY = "AI_JOKER_C2_LAST_GOVERNED_EVT";
const JOKER_LAST_GOVERNED_HASH_STORAGE_KEY = "AI_JOKER_C2_LAST_GOVERNED_HASH";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createStableSessionId(): string {
  const entropy =
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `JOKER-SESSION-${entropy}`;
}

function readStorage(key: string): string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(key);

  return value && value.trim() ? value.trim() : null;
}

function writeStorage(key: string, value: string | null | undefined): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  if (!value || !value.trim()) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, value.trim());
}

export function getJokerSessionId(): string {
  const existing = readStorage(JOKER_SESSION_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const created = createStableSessionId();
  writeStorage(JOKER_SESSION_STORAGE_KEY, created);

  return created;
}

export function setJokerSessionId(sessionId: string): void {
  writeStorage(JOKER_SESSION_STORAGE_KEY, sessionId);
}

export function getJokerContinuityRef(): string | null {
  return readStorage(JOKER_CONTINUITY_STORAGE_KEY);
}

export function setJokerContinuityRef(continuityRef: string | null | undefined): void {
  writeStorage(JOKER_CONTINUITY_STORAGE_KEY, continuityRef);
}

export function clearJokerClientSession(): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(JOKER_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(JOKER_CONTINUITY_STORAGE_KEY);
  window.localStorage.removeItem(JOKER_LAST_MEMORY_EVT_STORAGE_KEY);
  window.localStorage.removeItem(JOKER_LAST_GOVERNED_EVT_STORAGE_KEY);
  window.localStorage.removeItem(JOKER_LAST_GOVERNED_HASH_STORAGE_KEY);
}

export function getJokerClientState() {
  return {
    sessionId: readStorage(JOKER_SESSION_STORAGE_KEY),
    continuityRef: readStorage(JOKER_CONTINUITY_STORAGE_KEY),
    lastMemoryEvt: readStorage(JOKER_LAST_MEMORY_EVT_STORAGE_KEY),
    lastGovernedEvt: readStorage(JOKER_LAST_GOVERNED_EVT_STORAGE_KEY),
    lastGovernedHash: readStorage(JOKER_LAST_GOVERNED_HASH_STORAGE_KEY)
  };
}

export function persistJokerRuntimeState(response: JokerChatResponse): void {
  if (response.sessionId) {
    writeStorage(JOKER_SESSION_STORAGE_KEY, response.sessionId);
  }

  const memoryEvt = response.memory?.event || response.diagnostics?.memoryEvent || null;

  if (memoryEvt) {
    writeStorage(JOKER_LAST_MEMORY_EVT_STORAGE_KEY, memoryEvt);
    writeStorage(JOKER_CONTINUITY_STORAGE_KEY, memoryEvt);
  }

  const governedEvt = response.governedEvt?.evt || response.memory?.governedEvt || null;

  if (governedEvt) {
    writeStorage(JOKER_LAST_GOVERNED_EVT_STORAGE_KEY, governedEvt);
  }

  const governedHash = response.governedEvt?.hash || response.memory?.governedHash || null;

  if (governedHash) {
    writeStorage(JOKER_LAST_GOVERNED_HASH_STORAGE_KEY, governedHash);
  }
}

export async function sendJokerChatRequest(
  request: JokerChatRequest
): Promise<JokerChatResponse> {
  const sessionId = getJokerSessionId();
  const continuityRef = getJokerContinuityRef();

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: request.message,
      files: request.files || [],
      sessionId,
      continuityRef
    })
  });

  let payload: JokerChatResponse;

  try {
    payload = (await response.json()) as JokerChatResponse;
  } catch {
    payload = {
      ok: false,
      error: "INVALID_CHAT_RESPONSE"
    };
  }

  if (payload.sessionId) {
    persistJokerRuntimeState(payload);
  }

  if (!response.ok && !payload.error) {
    payload.error = `CHAT_REQUEST_FAILED_${response.status}`;
  }

  return payload;
}

export function buildJokerRuntimeFooter(response: JokerChatResponse): string {
  const parts = [
    response.state ? `state=${response.state}` : "",
    response.decision ? `decision=${response.decision}` : "",
    response.governanceDecision
      ? `governance=${response.governanceDecision}`
      : "",
    response.memorySource ? `memory=${response.memorySource}` : "",
    response.memory?.appendStatus
      ? `memoryAppend=${response.memory.appendStatus}`
      : "",
    response.governedEvt?.appendStatus
      ? `evtAppend=${response.governedEvt.appendStatus}`
      : ""
  ].filter(Boolean);

  return parts.join(" · ");
}

/**
 * Matrix Europa Node Ledger Persistence
 * File-based persistence layer for append-only node-bound events in AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import type { MatrixNodeEvent } from "./matrix-node-event-factory"
import { exportMatrixNodeLedgerSnapshot } from "./matrix-node-ledger-store"

export type MatrixNodeLedgerFileShape = {
  node_id: string
  exported_at: string
  total_events: number
  events: MatrixNodeEvent[]
}

const DEFAULT_NODE_ID = "HBCE-MATRIX-NODE-0001-TORINO"

function normalizeNodeId(nodeId?: string): string {
  return nodeId ?? DEFAULT_NODE_ID
}

function toLedgerFileName(nodeId: string): string {
  return nodeId.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export function resolveMatrixNodeLedgerFilePath(nodeId?: string): string {
  const normalizedNodeId = normalizeNodeId(nodeId)
  const fileName = `${toLedgerFileName(normalizedNodeId)}.persistent-ledger.json`

  return resolve(process.cwd(), "ledger", "persistent", fileName)
}

function ensureParentDirectory(filePath: string): void {
  const parentDir = dirname(filePath)

  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true })
  }
}

export function loadMatrixNodeLedgerFromDisk(nodeId?: string): MatrixNodeLedgerFileShape {
  const normalizedNodeId = normalizeNodeId(nodeId)
  const filePath = resolveMatrixNodeLedgerFilePath(normalizedNodeId)

  if (!existsSync(filePath)) {
    return {
      node_id: normalizedNodeId,
      exported_at: new Date().toISOString(),
      total_events: 0,
      events: []
    }
  }

  const raw = readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw) as MatrixNodeLedgerFileShape

  return {
    node_id: parsed.node_id ?? normalizedNodeId,
    exported_at: parsed.exported_at ?? new Date().toISOString(),
    total_events: Array.isArray(parsed.events) ? parsed.events.length : 0,
    events: Array.isArray(parsed.events) ? parsed.events : []
  }
}

export function saveMatrixNodeLedgerToDisk(nodeId?: string): MatrixNodeLedgerFileShape {
  const normalizedNodeId = normalizeNodeId(nodeId)
  const snapshot = exportMatrixNodeLedgerSnapshot()

  const payload: MatrixNodeLedgerFileShape = {
    node_id: normalizedNodeId,
    exported_at: snapshot.exported_at,
    total_events: snapshot.total_events,
    events: snapshot.events
  }

  const filePath = resolveMatrixNodeLedgerFilePath(normalizedNodeId)
  ensureParentDirectory(filePath)
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8")

  return payload
}

export function appendPersistentMatrixNodeLedgerSnapshot(nodeId?: string): MatrixNodeLedgerFileShape {
  const normalizedNodeId = normalizeNodeId(nodeId)
  const onDisk = loadMatrixNodeLedgerFromDisk(normalizedNodeId)
  const inMemory = exportMatrixNodeLedgerSnapshot()

  const existingEventIds = new Set(onDisk.events.map((event) => event.event_id))
  const newEvents = inMemory.events.filter((event) => !existingEventIds.has(event.event_id))

  const payload: MatrixNodeLedgerFileShape = {
    node_id: normalizedNodeId,
    exported_at: new Date().toISOString(),
    total_events: onDisk.events.length + newEvents.length,
    events: [...onDisk.events, ...newEvents]
  }

  const filePath = resolveMatrixNodeLedgerFilePath(normalizedNodeId)
  ensureParentDirectory(filePath)
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8")

  return payload
}

// ============================================================================
// NFCC Digital Twin - IndexedDB Historian (Dexie.js)
// ============================================================================
// Time-series data storage for sensor node history.
// Supports write, batch write, query by node/zone, and automatic purge.
// ============================================================================

import Dexie, { type Table } from 'dexie';
import type { TimeSeriesRecord } from '../types/index';

// === Database Class ===

export class NFCCDatabase extends Dexie {
  timeSeries!: Table<TimeSeriesRecord>;

  constructor() {
    super('nfcc-historian');
    this.version(1).stores({
      timeSeries: '++id, nodeId, zone, timestamp, type, [nodeId+timestamp], [zone+timestamp]',
    });
  }
}

// === Singleton Instance ===

export const db = new NFCCDatabase();

// === Write Operations ===

/**
 * Write a single time-series record to the database.
 */
export async function writeRecord(record: TimeSeriesRecord): Promise<number> {
  return db.timeSeries.add(record);
}

/**
 * Bulk write multiple time-series records for performance.
 */
export async function writeBatch(records: TimeSeriesRecord[]): Promise<number> {
  return db.timeSeries.bulkAdd(records);
}

// === Query Operations ===

/**
 * Query records by nodeId within a time range.
 * Uses compound index [nodeId+timestamp] for efficient lookup.
 */
export async function queryByNode(
  nodeId: string,
  startTime: number,
  endTime: number
): Promise<TimeSeriesRecord[]> {
  return db.timeSeries
    .where('[nodeId+timestamp]')
    .between([nodeId, startTime], [nodeId, endTime], true, true)
    .toArray();
}

/**
 * Query records by zone within a time range.
 * Uses compound index [zone+timestamp] for efficient lookup.
 */
export async function queryByZone(
  zone: string,
  startTime: number,
  endTime: number
): Promise<TimeSeriesRecord[]> {
  return db.timeSeries
    .where('[zone+timestamp]')
    .between([zone, startTime], [zone, endTime], true, true)
    .toArray();
}

// === Purge Operations ===

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const PURGE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Delete all records older than 24 hours.
 */
export async function purgeOldRecords(): Promise<number> {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
  return db.timeSeries.where('timestamp').below(cutoff).delete();
}

// === Periodic Purge ===

let purgeIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the periodic purge timer (every 5 minutes).
 * Safe to call multiple times — will not create duplicate intervals.
 */
export function startPeriodicPurge(): void {
  if (purgeIntervalId !== null) return;
  purgeIntervalId = setInterval(() => {
    void purgeOldRecords();
  }, PURGE_INTERVAL_MS);
}

/**
 * Stop the periodic purge timer.
 * Useful for testing and cleanup.
 */
export function stopPeriodicPurge(): void {
  if (purgeIntervalId !== null) {
    clearInterval(purgeIntervalId);
    purgeIntervalId = null;
  }
}

// Auto-start periodic purge on module import
startPeriodicPurge();

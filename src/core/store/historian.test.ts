// ============================================================================
// NFCC Digital Twin - Historian Unit Tests
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  db,
  writeRecord,
  writeBatch,
  queryByNode,
  queryByZone,
  purgeOldRecords,
  startPeriodicPurge,
  stopPeriodicPurge,
} from './historian';
import type { TimeSeriesRecord } from '../types/index';

describe('IndexedDB Historian', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.timeSeries.clear();
    stopPeriodicPurge();
  });

  afterEach(() => {
    stopPeriodicPurge();
  });

  describe('writeRecord', () => {
    it('writes a single record and returns an id', async () => {
      const record: TimeSeriesRecord = {
        nodeId: 'sensor-001',
        zone: 'zone-a',
        value: 25.5,
        timestamp: Date.now(),
        type: 'TEMPERATURE',
      };

      const id = await writeRecord(record);
      expect(id).toBeGreaterThan(0);

      const stored = await db.timeSeries.get(id);
      expect(stored).toBeDefined();
      expect(stored?.nodeId).toBe('sensor-001');
      expect(stored?.value).toBe(25.5);
    });
  });

  describe('writeBatch', () => {
    it('writes multiple records in bulk', async () => {
      const now = Date.now();
      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 25.0, timestamp: now, type: 'TEMPERATURE' },
        { nodeId: 'sensor-002', zone: 'zone-b', value: 220.0, timestamp: now, type: 'VOLTAGE' },
        { nodeId: 'sensor-003', zone: 'zone-a', value: 45.0, timestamp: now, type: 'HUMIDITY' },
      ];

      const lastKey = await writeBatch(records);
      expect(lastKey).toBeGreaterThan(0);

      const count = await db.timeSeries.count();
      expect(count).toBe(3);
    });
  });

  describe('queryByNode', () => {
    it('returns records for a specific node within time range', async () => {
      const baseTime = 1000000;
      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 20, timestamp: baseTime, type: 'TEMPERATURE' },
        { nodeId: 'sensor-001', zone: 'zone-a', value: 21, timestamp: baseTime + 100, type: 'TEMPERATURE' },
        { nodeId: 'sensor-001', zone: 'zone-a', value: 22, timestamp: baseTime + 200, type: 'TEMPERATURE' },
        { nodeId: 'sensor-002', zone: 'zone-b', value: 30, timestamp: baseTime + 100, type: 'HUMIDITY' },
      ];

      await writeBatch(records);

      const results = await queryByNode('sensor-001', baseTime, baseTime + 200);
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.nodeId === 'sensor-001')).toBe(true);
    });

    it('excludes records outside the time range', async () => {
      const baseTime = 1000000;
      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 20, timestamp: baseTime, type: 'TEMPERATURE' },
        { nodeId: 'sensor-001', zone: 'zone-a', value: 21, timestamp: baseTime + 500, type: 'TEMPERATURE' },
        { nodeId: 'sensor-001', zone: 'zone-a', value: 22, timestamp: baseTime + 1000, type: 'TEMPERATURE' },
      ];

      await writeBatch(records);

      const results = await queryByNode('sensor-001', baseTime + 100, baseTime + 600);
      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(21);
    });
  });

  describe('queryByZone', () => {
    it('returns records for a specific zone within time range', async () => {
      const baseTime = 1000000;
      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 20, timestamp: baseTime, type: 'TEMPERATURE' },
        { nodeId: 'sensor-003', zone: 'zone-a', value: 45, timestamp: baseTime + 100, type: 'HUMIDITY' },
        { nodeId: 'sensor-002', zone: 'zone-b', value: 220, timestamp: baseTime + 50, type: 'VOLTAGE' },
      ];

      await writeBatch(records);

      const results = await queryByZone('zone-a', baseTime, baseTime + 200);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.zone === 'zone-a')).toBe(true);
    });

    it('excludes records outside the time range', async () => {
      const baseTime = 1000000;
      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 20, timestamp: baseTime, type: 'TEMPERATURE' },
        { nodeId: 'sensor-003', zone: 'zone-a', value: 45, timestamp: baseTime + 500, type: 'HUMIDITY' },
      ];

      await writeBatch(records);

      const results = await queryByZone('zone-a', baseTime + 200, baseTime + 600);
      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(45);
    });
  });

  describe('purgeOldRecords', () => {
    it('deletes records older than 24 hours', async () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
      const oneHourAgo = now - 1 * 60 * 60 * 1000;

      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 20, timestamp: twentyFiveHoursAgo, type: 'TEMPERATURE' },
        { nodeId: 'sensor-002', zone: 'zone-b', value: 30, timestamp: oneHourAgo, type: 'HUMIDITY' },
        { nodeId: 'sensor-003', zone: 'zone-a', value: 40, timestamp: now, type: 'VOLTAGE' },
      ];

      await writeBatch(records);
      const deleted = await purgeOldRecords();

      expect(deleted).toBe(1);

      const remaining = await db.timeSeries.count();
      expect(remaining).toBe(2);
    });

    it('keeps records within 24 hours', async () => {
      const now = Date.now();
      const records: TimeSeriesRecord[] = [
        { nodeId: 'sensor-001', zone: 'zone-a', value: 20, timestamp: now - 1000, type: 'TEMPERATURE' },
        { nodeId: 'sensor-002', zone: 'zone-b', value: 30, timestamp: now, type: 'HUMIDITY' },
      ];

      await writeBatch(records);
      const deleted = await purgeOldRecords();

      expect(deleted).toBe(0);

      const remaining = await db.timeSeries.count();
      expect(remaining).toBe(2);
    });
  });

  describe('periodic purge', () => {
    it('startPeriodicPurge does not create duplicate intervals', () => {
      startPeriodicPurge();
      startPeriodicPurge();
      // No error thrown, and stopPeriodicPurge in afterEach cleans up
    });

    it('stopPeriodicPurge is safe to call when not started', () => {
      stopPeriodicPurge();
      stopPeriodicPurge();
      // No error thrown
    });
  });
});

// ============================================================================
// NFCC Digital Twin - IndexedDB Historian Property Tests
// ============================================================================
// Property-based tests for the IndexedDB Historian using fast-check.
// Validates: Requirements 24.1, 24.2, 24.3, 24.4
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  db,
  writeRecord,
  writeBatch,
  queryByNode,
  queryByZone,
  purgeOldRecords,
  stopPeriodicPurge,
} from './historian';
import { arbTimeSeriesRecord, arbZone, arbSensorType } from '../../test/arbitraries';
import type { TimeSeriesRecord } from '../types/index';

describe('Feature: nfcc-digital-twin, Property 11: IndexedDB Historian Round-Trip', () => {
  beforeEach(async () => {
    await db.timeSeries.clear();
    stopPeriodicPurge();
  });

  afterEach(() => {
    stopPeriodicPurge();
  });

  /**
   * **Validates: Requirements 24.1, 24.2, 24.3**
   *
   * For any valid TimeSeriesRecord written to the IndexedDB_Historian,
   * querying by the same nodeId and a time range containing the record's
   * timestamp SHALL return a result set that includes that record.
   */
  it('any written record is retrievable by nodeId query with matching time range', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimeSeriesRecord, async (record) => {
        // Clear DB for isolation
        await db.timeSeries.clear();

        // Write the record
        const id = await writeRecord(record);
        expect(id).toBeGreaterThan(0);

        // Query by nodeId with a time range that includes the record's timestamp
        const results = await queryByNode(
          record.nodeId,
          record.timestamp - 1,
          record.timestamp + 1
        );

        // The result set must include the written record
        expect(results.length).toBeGreaterThanOrEqual(1);
        const found = results.find(
          (r) =>
            r.nodeId === record.nodeId &&
            r.zone === record.zone &&
            r.value === record.value &&
            r.timestamp === record.timestamp &&
            r.type === record.type
        );
        expect(found).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 24.1, 24.2, 24.3**
   *
   * For any valid TimeSeriesRecord written to the IndexedDB_Historian,
   * querying by the same zone and a time range containing the record's
   * timestamp SHALL return a result set that includes that record.
   */
  it('any written record is retrievable by zone query with matching time range', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimeSeriesRecord, async (record) => {
        // Clear DB for isolation
        await db.timeSeries.clear();

        // Write the record
        await writeRecord(record);

        // Query by zone with a time range that includes the record's timestamp
        const results = await queryByZone(
          record.zone,
          record.timestamp - 1,
          record.timestamp + 1
        );

        // The result set must include the written record
        expect(results.length).toBeGreaterThanOrEqual(1);
        const found = results.find(
          (r) =>
            r.nodeId === record.nodeId &&
            r.zone === record.zone &&
            r.value === record.value &&
            r.timestamp === record.timestamp &&
            r.type === record.type
        );
        expect(found).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 24.1, 24.2, 24.3**
   *
   * For any batch of valid TimeSeriesRecords written to the IndexedDB_Historian,
   * each record SHALL be retrievable by its nodeId within the correct time range.
   */
  it('batch-written records are all retrievable by nodeId query', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbTimeSeriesRecord, { minLength: 1, maxLength: 10 }),
        async (records) => {
          // Clear DB for isolation
          await db.timeSeries.clear();

          // Write batch
          await writeBatch(records);

          // Verify each record is retrievable
          for (const record of records) {
            const results = await queryByNode(
              record.nodeId,
              record.timestamp - 1,
              record.timestamp + 1
            );

            const found = results.find(
              (r) =>
                r.nodeId === record.nodeId &&
                r.zone === record.zone &&
                r.value === record.value &&
                r.timestamp === record.timestamp &&
                r.type === record.type
            );
            expect(found).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: nfcc-digital-twin, Property 12: IndexedDB Historian Purge Correctness', () => {
  beforeEach(async () => {
    await db.timeSeries.clear();
    stopPeriodicPurge();
  });

  afterEach(() => {
    stopPeriodicPurge();
  });

  /**
   * **Validates: Requirements 24.4**
   *
   * For any set of TimeSeriesRecords with various timestamps, after purge
   * operation, only records with timestamps within the last 24 hours SHALL
   * remain in the database.
   */
  it('purge removes only records older than 24 hours', async () => {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            nodeId: fc.uuid(),
            zone: arbZone,
            value: fc.float({ min: Math.fround(-1000), max: Math.fround(10000), noNaN: true }),
            // Generate timestamps spanning from 48 hours ago to now
            timestamp: fc.integer({
              min: Date.now() - 48 * 60 * 60 * 1000,
              max: Date.now(),
            }),
            type: arbSensorType,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (records: TimeSeriesRecord[]) => {
          // Clear DB for isolation
          await db.timeSeries.clear();

          // Write all records
          await writeBatch(records);

          // Determine cutoff
          const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;

          // Count expected survivors (records within last 24 hours)
          const expectedSurvivors = records.filter((r) => r.timestamp >= cutoff);

          // Purge
          await purgeOldRecords();

          // Get remaining records
          const remaining = await db.timeSeries.toArray();

          // All remaining records must have timestamps >= cutoff
          for (const r of remaining) {
            expect(r.timestamp).toBeGreaterThanOrEqual(cutoff);
          }

          // The count of remaining records should match expected survivors
          expect(remaining.length).toBe(expectedSurvivors.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 24.4**
   *
   * After purge, no record with a timestamp older than 24 hours SHALL exist
   * in the database.
   */
  it('no records older than 24 hours survive purge', async () => {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            nodeId: fc.uuid(),
            zone: arbZone,
            value: fc.float({ min: Math.fround(-1000), max: Math.fround(10000), noNaN: true }),
            // All records are older than 24 hours
            timestamp: fc.integer({
              min: Date.now() - 72 * 60 * 60 * 1000,
              max: Date.now() - TWENTY_FOUR_HOURS_MS - 1000,
            }),
            type: arbSensorType,
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (records: TimeSeriesRecord[]) => {
          // Clear DB for isolation
          await db.timeSeries.clear();

          // Write all old records
          await writeBatch(records);

          // Verify records were written
          const beforeCount = await db.timeSeries.count();
          expect(beforeCount).toBe(records.length);

          // Purge
          const deleted = await purgeOldRecords();

          // All records should be deleted
          expect(deleted).toBe(records.length);

          // Database should be empty
          const remaining = await db.timeSeries.count();
          expect(remaining).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 24.4**
   *
   * Records within the last 24 hours SHALL NOT be affected by purge.
   */
  it('recent records are preserved after purge', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            nodeId: fc.uuid(),
            zone: arbZone,
            value: fc.float({ min: Math.fround(-1000), max: Math.fround(10000), noNaN: true }),
            // All records are within the last 23 hours (safely within 24h window)
            timestamp: fc.integer({
              min: Date.now() - 23 * 60 * 60 * 1000,
              max: Date.now(),
            }),
            type: arbSensorType,
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (records: TimeSeriesRecord[]) => {
          // Clear DB for isolation
          await db.timeSeries.clear();

          // Write all recent records
          await writeBatch(records);

          // Purge
          const deleted = await purgeOldRecords();

          // No records should be deleted
          expect(deleted).toBe(0);

          // All records should remain
          const remaining = await db.timeSeries.count();
          expect(remaining).toBe(records.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

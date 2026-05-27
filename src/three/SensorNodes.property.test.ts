// ============================================================================
// NFCC Digital Twin - Property Tests: Sensor Status to Color Mapping
// ============================================================================
// Property 10: Sensor Status to Color Mapping Consistency
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  updateSensorBuffer,
  getColorBuffer,
} from './SensorNodes.tsx';
import { arbStatusFlags } from '../test/arbitraries';
import type { SensorNode, StatusFlags } from '../core/types/index';

// === Helper: create a SensorNode with given status flags ===

function makeSensorNodeWithStatus(statusFlags: StatusFlags): SensorNode {
  return {
    id: 'test-node',
    objectName: 'Test Sensor',
    objectType: 'TEMPERATURE',
    presentValue: 25.0,
    statusFlags,
    zone: 'zone-a',
    position: [0, 0, 0],
    division: 1,
    metadata: {
      vendor: 'TestVendor',
      installDate: '2024-01-01',
      maintenanceInterval: 90,
      criticalityLevel: 'MEDIUM',
      isoReference: 'ISO-16484',
    },
  };
}

describe('Feature: nfcc-digital-twin, Property 10: Sensor Status to Color Mapping Consistency', () => {
  beforeEach(() => {
    // Reset buffers
    updateSensorBuffer([]);
  });

  /**
   * **Validates: Requirements 3.4, 9.4, 9.5**
   *
   * For any SensorNode, when its status is IN_ALARM (inAlarm=true),
   * the corresponding Float32Array color entry SHALL be red (r=1, g=0, b=0).
   * When NORMAL (all flags false), the color SHALL be cyan/green (r=0, g≥0.8, b≥0.8).
   * Priority order: inAlarm > fault > overridden > normal.
   */
  it('IN_ALARM status always maps to red (1, 0, 0) regardless of other flags', () => {
    fc.assert(
      fc.property(
        arbStatusFlags,
        (flags: StatusFlags) => {
          // Force inAlarm to true, other flags can be anything
          const alarmFlags: StatusFlags = { ...flags, inAlarm: true };
          const node = makeSensorNodeWithStatus(alarmFlags);

          updateSensorBuffer([node]);
          const color = getColorBuffer();

          // Red: r=1, g=0, b=0
          expect(color[0]).toBe(1);
          expect(color[1]).toBe(0);
          expect(color[2]).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('NORMAL status (all flags false) always maps to cyan (r=0, g≥0.8, b≥0.8)', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined),
        () => {
          const normalFlags: StatusFlags = {
            inAlarm: false,
            fault: false,
            overridden: false,
            outOfService: false,
          };
          const node = makeSensorNodeWithStatus(normalFlags);

          updateSensorBuffer([node]);
          const color = getColorBuffer();

          // Cyan/green: r=0, g≥0.8, b≥0.8
          expect(color[0]).toBe(0);
          expect(color[1]).toBeGreaterThanOrEqual(0.8);
          expect(color[2]).toBeGreaterThanOrEqual(0.8);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('FAULT status (fault=true, inAlarm=false) maps to yellow (1, 1, 0)', () => {
    fc.assert(
      fc.property(
        arbStatusFlags,
        (flags: StatusFlags) => {
          // Force fault=true, inAlarm=false; other flags can be anything
          const faultFlags: StatusFlags = { ...flags, inAlarm: false, fault: true };
          const node = makeSensorNodeWithStatus(faultFlags);

          updateSensorBuffer([node]);
          const color = getColorBuffer();

          // Yellow: r=1, g=1, b=0
          expect(color[0]).toBe(1);
          expect(color[1]).toBe(1);
          expect(color[2]).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('OVERRIDDEN status (overridden=true, inAlarm=false, fault=false) maps to purple (0.7, 0, 1)', () => {
    fc.assert(
      fc.property(
        arbStatusFlags,
        (flags: StatusFlags) => {
          // Force overridden=true, inAlarm=false, fault=false
          const overriddenFlags: StatusFlags = {
            ...flags,
            inAlarm: false,
            fault: false,
            overridden: true,
          };
          const node = makeSensorNodeWithStatus(overriddenFlags);

          updateSensorBuffer([node]);
          const color = getColorBuffer();

          // Purple: r=0.7, g=0, b=1
          expect(color[0]).toBeCloseTo(0.7);
          expect(color[1]).toBe(0);
          expect(color[2]).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('color mapping follows priority: inAlarm > fault > overridden > normal', () => {
    fc.assert(
      fc.property(
        arbStatusFlags,
        (flags: StatusFlags) => {
          const node = makeSensorNodeWithStatus(flags);

          updateSensorBuffer([node]);
          const color = getColorBuffer();
          const r = color[0];
          const g = color[1];
          const b = color[2];

          if (flags.inAlarm) {
            // Highest priority: red
            expect(r).toBe(1);
            expect(g).toBe(0);
            expect(b).toBe(0);
          } else if (flags.fault) {
            // Second priority: yellow
            expect(r).toBe(1);
            expect(g).toBe(1);
            expect(b).toBe(0);
          } else if (flags.overridden) {
            // Third priority: purple
            expect(r).toBeCloseTo(0.7);
            expect(g).toBe(0);
            expect(b).toBe(1);
          } else {
            // Normal: cyan
            expect(r).toBe(0);
            expect(g).toBeGreaterThanOrEqual(0.8);
            expect(b).toBeGreaterThanOrEqual(0.8);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('color values are always valid Float32Array entries (finite, in [0, 1])', () => {
    fc.assert(
      fc.property(
        arbStatusFlags,
        (flags: StatusFlags) => {
          const node = makeSensorNodeWithStatus(flags);

          updateSensorBuffer([node]);
          const color = getColorBuffer();
          const r = color[0];
          const g = color[1];
          const b = color[2];

          // All color components must be finite and within [0, 1]
          expect(Number.isFinite(r)).toBe(true);
          expect(Number.isFinite(g)).toBe(true);
          expect(Number.isFinite(b)).toBe(true);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(1);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(1);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

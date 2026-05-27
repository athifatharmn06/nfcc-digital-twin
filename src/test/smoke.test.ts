// ============================================================================
// NFCC Digital Twin - Smoke Test
// ============================================================================
// Verifies that the test runner (Vitest) is properly configured and working.
// ============================================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DivisionId, EmergencyState } from '../core/types/index';
import { arbDivisionId, arbEmergencyState, arbSensorNode, arbBrokerMessage } from './arbitraries';

describe('Smoke Test - Vitest Configuration', () => {
  it('should run a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to jsdom environment', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  it('should have Web Worker mock available', () => {
    expect(typeof Worker).toBe('function');
    const worker = new Worker('test.js');
    expect(worker).toBeDefined();
  });

  it('should have AudioContext mock available', () => {
    expect(typeof AudioContext).toBe('function');
  });
});

describe('Smoke Test - Fast-Check Integration', () => {
  it('should generate valid DivisionIds (1-11)', () => {
    fc.assert(
      fc.property(arbDivisionId, (id: DivisionId) => {
        return id >= 1 && id <= 11;
      }),
      { numRuns: 100 },
    );
  });

  it('should generate valid EmergencyStates', () => {
    const validStates: EmergencyState[] = ['NORMAL', 'LOCKDOWN', 'EVACUATION'];
    fc.assert(
      fc.property(arbEmergencyState, (state: EmergencyState) => {
        return validStates.includes(state);
      }),
      { numRuns: 100 },
    );
  });

  it('should generate valid SensorNodes', () => {
    fc.assert(
      fc.property(arbSensorNode, (node) => {
        return (
          typeof node.id === 'string' &&
          node.id.length > 0 &&
          typeof node.objectName === 'string' &&
          typeof node.presentValue === 'number' &&
          !Number.isNaN(node.presentValue) &&
          node.division >= 1 &&
          node.division <= 11 &&
          node.position.length === 3
        );
      }),
      { numRuns: 100 },
    );
  });

  it('should generate valid BrokerMessages', () => {
    fc.assert(
      fc.property(arbBrokerMessage, (msg) => {
        return (
          typeof msg.topic === 'string' &&
          msg.topic.length > 0 &&
          typeof msg.timestamp === 'number' &&
          msg.timestamp > 0 &&
          ['physics', 'ai', 'ui', 'broker'].includes(msg.source)
        );
      }),
      { numRuns: 100 },
    );
  });
});

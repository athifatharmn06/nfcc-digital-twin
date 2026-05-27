// ============================================================================
// NFCC Digital Twin - Emergency Lockdown Round-Trip Property Test
// ============================================================================
// Property 9: Emergency Lockdown Round-Trip Restoration
// For any set of SensorNodes with initial states, after transitioning
// NORMAL→LOCKDOWN→NORMAL, all SensorNode statusFlags SHALL be restored
// to their pre-lockdown values.
//
// **Validates: Requirements 10.2, 10.5**
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  executeTransition,
  getPreTransitionStates,
  clearPreTransitionStates,
} from './emergencyMachine';
import { useNFCCStore } from './useNFCCStore';
import { arbStatusFlags } from '../../test/arbitraries';
import type { StatusFlags } from '../types/index';

/**
 * Arbitrary for a sensor entry: unique id paired with random StatusFlags.
 * We use a lightweight representation since the property only concerns
 * StatusFlags preservation through the round-trip.
 */
const arbSensorEntry: fc.Arbitrary<{ id: string; statusFlags: StatusFlags }> = fc.record({
  id: fc.uuid(),
  statusFlags: arbStatusFlags,
});

describe('Feature: nfcc-digital-twin, Property 9: Emergency Lockdown Round-Trip Restoration', () => {
  beforeEach(() => {
    // Reset store to NORMAL before each test
    useNFCCStore.setState({
      activeDivision: 1,
      emergencyMode: 'NORMAL',
      notifications: [],
      isMuted: false,
      isDemoMode: false,
    });
    clearPreTransitionStates();
  });

  it('restores all SensorNode statusFlags after NORMAL→LOCKDOWN→NORMAL round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(arbSensorEntry, { minLength: 1, maxLength: 50 }),
        (sensorEntries) => {
          // Reset state for each iteration
          useNFCCStore.setState({ emergencyMode: 'NORMAL' });
          clearPreTransitionStates();

          // Deduplicate by id (UUIDs are unique in practice but be safe)
          const uniqueEntries = new Map(
            sensorEntries.map((entry) => [entry.id, entry.statusFlags])
          );

          // Capture original statusFlags keyed by sensor id
          const originalFlags = new Map<string, StatusFlags>();
          for (const [id, flags] of uniqueEntries) {
            originalFlags.set(id, { ...flags });
          }

          // Build the sensor states map as expected by executeTransition
          const sensorStatesMap = new Map<string, StatusFlags>();
          for (const [id, flags] of uniqueEntries) {
            sensorStatesMap.set(id, { ...flags });
          }

          // Transition NORMAL → LOCKDOWN
          const lockdownResult = executeTransition('LOCKDOWN', sensorStatesMap);
          expect(lockdownResult.success).toBe(true);
          expect(useNFCCStore.getState().emergencyMode).toBe('LOCKDOWN');

          // Transition LOCKDOWN → NORMAL
          const normalResult = executeTransition('NORMAL');
          expect(normalResult.success).toBe(true);
          expect(useNFCCStore.getState().emergencyMode).toBe('NORMAL');

          // Verify: pre-transition states are available for restoration
          const restoredStates = getPreTransitionStates();

          // The number of restored entries must match the original count
          expect(restoredStates.size).toBe(originalFlags.size);

          // All original sensor IDs must be present with matching statusFlags
          for (const [id, originalFlag] of originalFlags) {
            const restoredFlag = restoredStates.get(id);
            expect(restoredFlag).toBeDefined();

            // Each statusFlag field must match the original pre-lockdown value
            expect(restoredFlag!.inAlarm).toBe(originalFlag.inAlarm);
            expect(restoredFlag!.fault).toBe(originalFlag.fault);
            expect(restoredFlag!.overridden).toBe(originalFlag.overridden);
            expect(restoredFlag!.outOfService).toBe(originalFlag.outOfService);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

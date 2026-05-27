// ============================================================================
// NFCC Digital Twin - Property Tests: Zustand Store
// ============================================================================
// Property 8: Emergency State Machine Transition Validity
// Property 13: Zustand Store Division Selection
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useNFCCStore, isValidTransition } from './useNFCCStore';
import { arbDivisionId, arbEmergencyState } from '../../test/arbitraries';
import type { EmergencyState, DivisionId } from '../types/index';

// === Valid transition map for reference ===
const VALID_TRANSITIONS: Record<EmergencyState, EmergencyState[]> = {
  NORMAL: ['LOCKDOWN', 'EVACUATION'],
  LOCKDOWN: ['NORMAL', 'EVACUATION'],
  EVACUATION: ['NORMAL'],
};

describe('Feature: nfcc-digital-twin, Property 8: Emergency State Machine Transition Validity', () => {
  beforeEach(() => {
    // Reset store to NORMAL before each test
    useNFCCStore.setState({ emergencyMode: 'NORMAL' });
  });

  /**
   * **Validates: Requirements 10.6**
   *
   * For any sequence of transition attempts, the Emergency_State_Machine
   * SHALL only allow transitions through the defined valid paths
   * (NORMAL↔LOCKDOWN, NORMAL↔EVACUATION, LOCKDOWN→EVACUATION)
   * and SHALL reject all other transitions.
   */
  it('only allows valid transitions and rejects invalid ones', () => {
    fc.assert(
      fc.property(
        fc.array(arbEmergencyState, { minLength: 1, maxLength: 20 }),
        (transitionSequence: EmergencyState[]) => {
          // Reset to NORMAL
          useNFCCStore.setState({ emergencyMode: 'NORMAL' });

          let currentState: EmergencyState = 'NORMAL';

          for (const targetState of transitionSequence) {
            const expectedValid = VALID_TRANSITIONS[currentState].includes(targetState);

            // Attempt the transition
            useNFCCStore.getState().transitionEmergency(targetState);
            const newState = useNFCCStore.getState().emergencyMode;

            if (expectedValid) {
              // Valid transition: state should change to target
              expect(newState).toBe(targetState);
              currentState = targetState;
            } else {
              // Invalid transition: state should remain unchanged
              expect(newState).toBe(currentState);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('EVACUATION to LOCKDOWN is always rejected (must go through NORMAL)', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined),
        () => {
          // Set state to EVACUATION
          useNFCCStore.setState({ emergencyMode: 'EVACUATION' });

          // Attempt EVACUATION → LOCKDOWN
          useNFCCStore.getState().transitionEmergency('LOCKDOWN');

          // Should remain in EVACUATION
          expect(useNFCCStore.getState().emergencyMode).toBe('EVACUATION');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isValidTransition correctly classifies all state pairs', () => {
    fc.assert(
      fc.property(
        arbEmergencyState,
        arbEmergencyState,
        (from: EmergencyState, to: EmergencyState) => {
          const result = isValidTransition(from, to);
          const expected = VALID_TRANSITIONS[from].includes(to);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('self-transitions are always rejected', () => {
    fc.assert(
      fc.property(
        arbEmergencyState,
        (state: EmergencyState) => {
          useNFCCStore.setState({ emergencyMode: state });

          // Attempt self-transition
          useNFCCStore.getState().transitionEmergency(state);

          // State should remain unchanged (self-transitions not in valid map)
          expect(useNFCCStore.getState().emergencyMode).toBe(state);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: nfcc-digital-twin, Property 13: Zustand Store Division Selection', () => {
  beforeEach(() => {
    // Reset store to default division
    useNFCCStore.setState({ activeDivision: 1 });
  });

  /**
   * **Validates: Requirements 5.3**
   *
   * For any valid DivisionId (1-11), calling setActiveDivision SHALL result
   * in the store's activeDivision field equaling that DivisionId.
   */
  it('setActiveDivision correctly updates store for any valid DivisionId', () => {
    fc.assert(
      fc.property(
        arbDivisionId,
        (divisionId: DivisionId) => {
          useNFCCStore.getState().setActiveDivision(divisionId);
          expect(useNFCCStore.getState().activeDivision).toBe(divisionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sequential division selections always reflect the last selected division', () => {
    fc.assert(
      fc.property(
        fc.array(arbDivisionId, { minLength: 1, maxLength: 20 }),
        (divisionSequence: DivisionId[]) => {
          for (const divId of divisionSequence) {
            useNFCCStore.getState().setActiveDivision(divId);
          }
          // After all selections, store should reflect the last one
          const lastDivision = divisionSequence[divisionSequence.length - 1];
          expect(useNFCCStore.getState().activeDivision).toBe(lastDivision);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('division selection does not affect emergency mode', () => {
    fc.assert(
      fc.property(
        arbDivisionId,
        arbEmergencyState,
        (divisionId: DivisionId, emergencyState: EmergencyState) => {
          // Set a specific emergency state first
          useNFCCStore.setState({ emergencyMode: emergencyState });

          // Change division
          useNFCCStore.getState().setActiveDivision(divisionId);

          // Emergency mode should be unchanged
          expect(useNFCCStore.getState().emergencyMode).toBe(emergencyState);
        }
      ),
      { numRuns: 100 }
    );
  });
});

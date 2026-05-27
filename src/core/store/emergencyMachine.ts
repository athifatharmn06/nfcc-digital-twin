// ============================================================================
// NFCC Digital Twin - Emergency State Machine
// ============================================================================
// Orchestrates emergency state transitions with associated effects.
// Defines valid transitions, computes transition effects, and manages
// pre-transition sensor state storage for restoration.
// ============================================================================

import type {
  EmergencyState,
  TransitionEffect,
  StatusFlags,
} from '../types/index';
import { isValidTransition, useNFCCStore } from './useNFCCStore';

// === Transition Key Helper ===

/**
 * Creates a lookup key for the transition effects map.
 */
function transitionKey(from: EmergencyState, to: EmergencyState): string {
  return `${from}→${to}`;
}

// === Transition Effects Map ===

/**
 * Maps each valid "FROM→TO" transition to its list of effects.
 * Effects are dispatched as BrokerWorker messages by the caller.
 */
const TRANSITION_EFFECTS: Record<string, TransitionEffect[]> = {
  [transitionKey('NORMAL', 'LOCKDOWN')]: [
    { type: 'LOCK_ALL_DOORS' },
    { type: 'ACTIVATE_ALARM', tone: 'lockdown' },
    { type: 'OVERRIDE_SENSORS', override: { overridden: true } },
  ],
  [transitionKey('NORMAL', 'EVACUATION')]: [
    { type: 'COMPUTE_EVACUATION' },
    { type: 'ACTIVATE_ALARM', tone: 'evacuation' },
  ],
  [transitionKey('LOCKDOWN', 'NORMAL')]: [
    { type: 'UNLOCK_ALL_DOORS' },
    { type: 'DEACTIVATE_ALARM' },
    { type: 'RESTORE_SENSORS' },
  ],
  [transitionKey('EVACUATION', 'NORMAL')]: [
    { type: 'DEACTIVATE_ALARM' },
    { type: 'RESTORE_SENSORS' },
  ],
  [transitionKey('LOCKDOWN', 'EVACUATION')]: [
    { type: 'COMPUTE_EVACUATION' },
    // Alarm stays active — no DEACTIVATE_ALARM, no new ACTIVATE_ALARM needed
    // but we switch tone to evacuation
    { type: 'ACTIVATE_ALARM', tone: 'evacuation' },
  ],
};

// === Pre-Transition State Storage ===

/**
 * Stores sensor status flags captured before a transition away from NORMAL.
 * Used to restore sensor states when transitioning back to NORMAL.
 */
let preTransitionSensorStates: Map<string, StatusFlags> = new Map();

/**
 * Stores the pre-transition sensor states for later restoration.
 * Should be called before applying transition effects that modify sensors.
 */
export function storePreTransitionStates(
  sensorStates: Map<string, StatusFlags>
): void {
  preTransitionSensorStates = new Map(sensorStates);
}

/**
 * Retrieves the stored pre-transition sensor states.
 * Returns a copy of the stored states map.
 */
export function getPreTransitionStates(): Map<string, StatusFlags> {
  return new Map(preTransitionSensorStates);
}

/**
 * Clears the stored pre-transition sensor states.
 */
export function clearPreTransitionStates(): void {
  preTransitionSensorStates = new Map();
}

// === Public API ===

/**
 * Checks whether a transition from one emergency state to another is allowed.
 * Reuses the validation logic from useNFCCStore.
 */
export function canTransition(
  from: EmergencyState,
  to: EmergencyState
): boolean {
  return isValidTransition(from, to);
}

/**
 * Returns the list of effects for a given transition.
 * Returns an empty array if the transition is invalid.
 */
export function getTransitionEffects(
  from: EmergencyState,
  to: EmergencyState
): TransitionEffect[] {
  if (!canTransition(from, to)) {
    return [];
  }
  const key = transitionKey(from, to);
  return TRANSITION_EFFECTS[key] ?? [];
}

/**
 * Result of executing a transition.
 */
export interface TransitionResult {
  success: boolean;
  effects: TransitionEffect[];
  previousState: EmergencyState;
  newState: EmergencyState;
}

/**
 * Orchestrates a full emergency state transition:
 * 1. Validates the transition is allowed from the current state
 * 2. Stores pre-transition sensor states (if transitioning away from NORMAL)
 * 3. Computes the effects for the transition
 * 4. Updates the Zustand store
 * 5. Returns the effects list for the caller to dispatch to BrokerWorker
 *
 * @param to - The target emergency state
 * @param currentSensorStates - Optional map of current sensor states for restoration
 * @returns TransitionResult with success status and effects to execute
 */
export function executeTransition(
  to: EmergencyState,
  currentSensorStates?: Map<string, StatusFlags>
): TransitionResult {
  const store = useNFCCStore.getState();
  const from = store.emergencyMode;

  // Validate transition
  if (!canTransition(from, to)) {
    return {
      success: false,
      effects: [],
      previousState: from,
      newState: from,
    };
  }

  // Store pre-transition sensor states when leaving NORMAL
  if (from === 'NORMAL' && currentSensorStates) {
    storePreTransitionStates(currentSensorStates);
  }

  // Get effects for this transition
  const effects = getTransitionEffects(from, to);

  // Update the Zustand store
  store.transitionEmergency(to);

  return {
    success: true,
    effects,
    previousState: from,
    newState: to,
  };
}

// ============================================================================
// NFCC Digital Twin - Zustand Store
// ============================================================================
// Manages UI-only state: active division, emergency mode, notifications,
// user preferences. Does NOT contain sensor arrays, 3D data, or physics state.
// ============================================================================

import { create } from 'zustand';
import type {
  NFCCStore,
  DivisionId,
  EmergencyState,
  Notification,
} from '../types/index';

/**
 * Valid emergency state transitions.
 * Key: current state, Value: set of allowed target states.
 *
 * Valid paths:
 *   NORMAL → LOCKDOWN
 *   NORMAL → EVACUATION
 *   LOCKDOWN → NORMAL
 *   LOCKDOWN → EVACUATION
 *   EVACUATION → NORMAL
 *
 * Invalid (silently rejected):
 *   EVACUATION → LOCKDOWN
 */
const VALID_TRANSITIONS: Record<EmergencyState, Set<EmergencyState>> = {
  NORMAL: new Set(['LOCKDOWN', 'EVACUATION']),
  LOCKDOWN: new Set(['NORMAL', 'EVACUATION']),
  EVACUATION: new Set(['NORMAL']),
};

/**
 * Checks whether a transition from one emergency state to another is allowed.
 */
export function isValidTransition(
  from: EmergencyState,
  to: EmergencyState
): boolean {
  return VALID_TRANSITIONS[from].has(to);
}

/**
 * The main NFCC Zustand store.
 * Manages only UI metadata — no sensor arrays, 3D data, or physics state.
 */
export const useNFCCStore = create<NFCCStore>((set) => ({
  // === UI State ===
  activeDivision: 1 as DivisionId,
  emergencyMode: 'NORMAL' as EmergencyState,
  notifications: [] as Notification[],
  isMuted: false,
  isDemoMode: false,

  // === Actions ===

  setActiveDivision: (id: DivisionId): void => {
    set({ activeDivision: id });
  },

  transitionEmergency: (to: EmergencyState): void => {
    set((state) => {
      if (!isValidTransition(state.emergencyMode, to)) {
        // Invalid transition — silently rejected, no state change
        return state;
      }
      return { emergencyMode: to };
    });
  },

  addNotification: (n: Notification): void => {
    set((state) => ({
      notifications: [...state.notifications, n],
    }));
  },

  dismissNotification: (id: string): void => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  toggleMute: (): void => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  setDemoMode: (active: boolean): void => {
    set({ isDemoMode: active });
  },
}));

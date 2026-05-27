// ============================================================================
// NFCC Digital Twin - Emergency State Machine Tests
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  canTransition,
  getTransitionEffects,
  executeTransition,
  storePreTransitionStates,
  getPreTransitionStates,
  clearPreTransitionStates,
} from './emergencyMachine';
import { useNFCCStore } from './useNFCCStore';
import type { EmergencyState, StatusFlags, TransitionEffect } from '../types/index';

describe('Emergency State Machine', () => {
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

  describe('canTransition', () => {
    it('should allow NORMAL → LOCKDOWN', () => {
      expect(canTransition('NORMAL', 'LOCKDOWN')).toBe(true);
    });

    it('should allow NORMAL → EVACUATION', () => {
      expect(canTransition('NORMAL', 'EVACUATION')).toBe(true);
    });

    it('should allow LOCKDOWN → NORMAL', () => {
      expect(canTransition('LOCKDOWN', 'NORMAL')).toBe(true);
    });

    it('should allow LOCKDOWN → EVACUATION', () => {
      expect(canTransition('LOCKDOWN', 'EVACUATION')).toBe(true);
    });

    it('should allow EVACUATION → NORMAL', () => {
      expect(canTransition('EVACUATION', 'NORMAL')).toBe(true);
    });

    it('should reject EVACUATION → LOCKDOWN', () => {
      expect(canTransition('EVACUATION', 'LOCKDOWN')).toBe(false);
    });

    it('should reject same-state transitions', () => {
      const states: EmergencyState[] = ['NORMAL', 'LOCKDOWN', 'EVACUATION'];
      for (const state of states) {
        expect(canTransition(state, state)).toBe(false);
      }
    });
  });

  describe('getTransitionEffects', () => {
    it('should return LOCK_ALL_DOORS, ACTIVATE_ALARM, OVERRIDE_SENSORS for NORMAL→LOCKDOWN', () => {
      const effects = getTransitionEffects('NORMAL', 'LOCKDOWN');
      expect(effects).toHaveLength(3);

      const types = effects.map((e) => e.type);
      expect(types).toContain('LOCK_ALL_DOORS');
      expect(types).toContain('ACTIVATE_ALARM');
      expect(types).toContain('OVERRIDE_SENSORS');

      const alarmEffect = effects.find(
        (e): e is Extract<TransitionEffect, { type: 'ACTIVATE_ALARM' }> =>
          e.type === 'ACTIVATE_ALARM'
      );
      expect(alarmEffect?.tone).toBe('lockdown');
    });

    it('should return COMPUTE_EVACUATION and ACTIVATE_ALARM for NORMAL→EVACUATION', () => {
      const effects = getTransitionEffects('NORMAL', 'EVACUATION');
      expect(effects).toHaveLength(2);

      const types = effects.map((e) => e.type);
      expect(types).toContain('COMPUTE_EVACUATION');
      expect(types).toContain('ACTIVATE_ALARM');

      const alarmEffect = effects.find(
        (e): e is Extract<TransitionEffect, { type: 'ACTIVATE_ALARM' }> =>
          e.type === 'ACTIVATE_ALARM'
      );
      expect(alarmEffect?.tone).toBe('evacuation');
    });

    it('should return UNLOCK_ALL_DOORS, DEACTIVATE_ALARM, RESTORE_SENSORS for LOCKDOWN→NORMAL', () => {
      const effects = getTransitionEffects('LOCKDOWN', 'NORMAL');
      expect(effects).toHaveLength(3);

      const types = effects.map((e) => e.type);
      expect(types).toContain('UNLOCK_ALL_DOORS');
      expect(types).toContain('DEACTIVATE_ALARM');
      expect(types).toContain('RESTORE_SENSORS');
    });

    it('should return DEACTIVATE_ALARM and RESTORE_SENSORS for EVACUATION→NORMAL', () => {
      const effects = getTransitionEffects('EVACUATION', 'NORMAL');
      expect(effects).toHaveLength(2);

      const types = effects.map((e) => e.type);
      expect(types).toContain('DEACTIVATE_ALARM');
      expect(types).toContain('RESTORE_SENSORS');
    });

    it('should return COMPUTE_EVACUATION and ACTIVATE_ALARM for LOCKDOWN→EVACUATION', () => {
      const effects = getTransitionEffects('LOCKDOWN', 'EVACUATION');
      expect(effects).toHaveLength(2);

      const types = effects.map((e) => e.type);
      expect(types).toContain('COMPUTE_EVACUATION');
      expect(types).toContain('ACTIVATE_ALARM');

      const alarmEffect = effects.find(
        (e): e is Extract<TransitionEffect, { type: 'ACTIVATE_ALARM' }> =>
          e.type === 'ACTIVATE_ALARM'
      );
      expect(alarmEffect?.tone).toBe('evacuation');
    });

    it('should return empty array for invalid transitions', () => {
      expect(getTransitionEffects('EVACUATION', 'LOCKDOWN')).toEqual([]);
    });

    it('should return empty array for same-state transitions', () => {
      expect(getTransitionEffects('NORMAL', 'NORMAL')).toEqual([]);
      expect(getTransitionEffects('LOCKDOWN', 'LOCKDOWN')).toEqual([]);
      expect(getTransitionEffects('EVACUATION', 'EVACUATION')).toEqual([]);
    });
  });

  describe('executeTransition', () => {
    it('should successfully transition from NORMAL to LOCKDOWN', () => {
      const result = executeTransition('LOCKDOWN');

      expect(result.success).toBe(true);
      expect(result.previousState).toBe('NORMAL');
      expect(result.newState).toBe('LOCKDOWN');
      expect(result.effects.length).toBeGreaterThan(0);
      expect(useNFCCStore.getState().emergencyMode).toBe('LOCKDOWN');
    });

    it('should successfully transition from NORMAL to EVACUATION', () => {
      const result = executeTransition('EVACUATION');

      expect(result.success).toBe(true);
      expect(result.previousState).toBe('NORMAL');
      expect(result.newState).toBe('EVACUATION');
      expect(useNFCCStore.getState().emergencyMode).toBe('EVACUATION');
    });

    it('should reject invalid transition from EVACUATION to LOCKDOWN', () => {
      useNFCCStore.setState({ emergencyMode: 'EVACUATION' });

      const result = executeTransition('LOCKDOWN');

      expect(result.success).toBe(false);
      expect(result.previousState).toBe('EVACUATION');
      expect(result.newState).toBe('EVACUATION');
      expect(result.effects).toEqual([]);
      expect(useNFCCStore.getState().emergencyMode).toBe('EVACUATION');
    });

    it('should store pre-transition sensor states when leaving NORMAL', () => {
      const sensorStates = new Map<string, StatusFlags>([
        ['sensor-1', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
        ['sensor-2', { inAlarm: true, fault: false, overridden: false, outOfService: false }],
      ]);

      executeTransition('LOCKDOWN', sensorStates);

      const stored = getPreTransitionStates();
      expect(stored.size).toBe(2);
      expect(stored.get('sensor-1')).toEqual({
        inAlarm: false,
        fault: false,
        overridden: false,
        outOfService: false,
      });
      expect(stored.get('sensor-2')).toEqual({
        inAlarm: true,
        fault: false,
        overridden: false,
        outOfService: false,
      });
    });

    it('should not overwrite pre-transition states when transitioning between non-NORMAL states', () => {
      const sensorStates = new Map<string, StatusFlags>([
        ['sensor-1', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
      ]);

      // First transition: NORMAL → LOCKDOWN (stores states)
      executeTransition('LOCKDOWN', sensorStates);

      // Second transition: LOCKDOWN → EVACUATION (should NOT overwrite)
      const newStates = new Map<string, StatusFlags>([
        ['sensor-1', { inAlarm: false, fault: false, overridden: true, outOfService: false }],
      ]);
      executeTransition('EVACUATION', newStates);

      // Original pre-transition states should be preserved
      const stored = getPreTransitionStates();
      expect(stored.get('sensor-1')?.overridden).toBe(false);
    });

    it('should return correct effects for LOCKDOWN→NORMAL transition', () => {
      useNFCCStore.setState({ emergencyMode: 'LOCKDOWN' });

      const result = executeTransition('NORMAL');

      expect(result.success).toBe(true);
      const types = result.effects.map((e) => e.type);
      expect(types).toContain('UNLOCK_ALL_DOORS');
      expect(types).toContain('DEACTIVATE_ALARM');
      expect(types).toContain('RESTORE_SENSORS');
    });

    it('should handle full round-trip NORMAL→LOCKDOWN→NORMAL', () => {
      const sensorStates = new Map<string, StatusFlags>([
        ['sensor-a', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
        ['sensor-b', { inAlarm: true, fault: true, overridden: false, outOfService: false }],
      ]);

      // Go to LOCKDOWN
      const lockdownResult = executeTransition('LOCKDOWN', sensorStates);
      expect(lockdownResult.success).toBe(true);
      expect(useNFCCStore.getState().emergencyMode).toBe('LOCKDOWN');

      // Return to NORMAL
      const normalResult = executeTransition('NORMAL');
      expect(normalResult.success).toBe(true);
      expect(useNFCCStore.getState().emergencyMode).toBe('NORMAL');

      // Pre-transition states should still be available for restoration
      const stored = getPreTransitionStates();
      expect(stored.size).toBe(2);
      expect(stored.get('sensor-a')).toEqual({
        inAlarm: false,
        fault: false,
        overridden: false,
        outOfService: false,
      });
      expect(stored.get('sensor-b')).toEqual({
        inAlarm: true,
        fault: true,
        overridden: false,
        outOfService: false,
      });
    });
  });

  describe('pre-transition state storage', () => {
    it('should store and retrieve sensor states', () => {
      const states = new Map<string, StatusFlags>([
        ['node-1', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
        ['node-2', { inAlarm: true, fault: false, overridden: true, outOfService: false }],
        ['node-3', { inAlarm: false, fault: true, overridden: false, outOfService: true }],
      ]);

      storePreTransitionStates(states);
      const retrieved = getPreTransitionStates();

      expect(retrieved.size).toBe(3);
      expect(retrieved.get('node-1')).toEqual({
        inAlarm: false,
        fault: false,
        overridden: false,
        outOfService: false,
      });
      expect(retrieved.get('node-2')).toEqual({
        inAlarm: true,
        fault: false,
        overridden: true,
        outOfService: false,
      });
      expect(retrieved.get('node-3')).toEqual({
        inAlarm: false,
        fault: true,
        overridden: false,
        outOfService: true,
      });
    });

    it('should return a copy (not a reference) of stored states', () => {
      const states = new Map<string, StatusFlags>([
        ['node-1', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
      ]);

      storePreTransitionStates(states);
      const retrieved = getPreTransitionStates();

      // Mutating the retrieved map should not affect stored states
      retrieved.delete('node-1');
      const retrievedAgain = getPreTransitionStates();
      expect(retrievedAgain.size).toBe(1);
    });

    it('should clear stored states', () => {
      const states = new Map<string, StatusFlags>([
        ['node-1', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
      ]);

      storePreTransitionStates(states);
      clearPreTransitionStates();

      const retrieved = getPreTransitionStates();
      expect(retrieved.size).toBe(0);
    });

    it('should overwrite previous states when storePreTransitionStates is called again', () => {
      const states1 = new Map<string, StatusFlags>([
        ['node-1', { inAlarm: false, fault: false, overridden: false, outOfService: false }],
      ]);
      const states2 = new Map<string, StatusFlags>([
        ['node-2', { inAlarm: true, fault: true, overridden: true, outOfService: true }],
      ]);

      storePreTransitionStates(states1);
      storePreTransitionStates(states2);

      const retrieved = getPreTransitionStates();
      expect(retrieved.size).toBe(1);
      expect(retrieved.has('node-1')).toBe(false);
      expect(retrieved.has('node-2')).toBe(true);
    });
  });
});

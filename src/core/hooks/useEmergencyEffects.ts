// ============================================================================
// NFCC Digital Twin - Emergency Effects Hook
// ============================================================================
// Subscribes to Zustand emergencyMode changes and dispatches side effects:
// - LOCKDOWN: publishes door lock commands, activates lockdown alarm
// - EVACUATION: triggers AI pathfinding, activates evacuation alarm
// - NORMAL: stops alarms, publishes door unlock commands
// Validates: Requirements 10.2, 10.3, 10.4, 10.5, 11.3, 16.2
// ============================================================================

import { useEffect, useRef } from 'react';
import { useNFCCStore } from '../store/useNFCCStore';
import { useWorkers } from '../workers/WorkerProvider';
import { alarmManager } from '../../utils/audio';
import type { EmergencyState } from '../types/index';

/**
 * Hook that reacts to emergency mode transitions and dispatches
 * the corresponding side effects (door commands, alarms, AI pathfinding).
 *
 * Must be called within a WorkerProvider context.
 */
export function useEmergencyEffects(): void {
  const { publishCommand, postToAI } = useWorkers();
  const previousModeRef = useRef<EmergencyState>('NORMAL');

  useEffect(() => {
    // Subscribe to full store state and filter for emergencyMode changes
    const unsubscribe = useNFCCStore.subscribe((state) => {
      const emergencyMode = state.emergencyMode;
      const previousMode = previousModeRef.current;

      // Skip if no actual change
      if (emergencyMode === previousMode) {
        return;
      }

      // Dispatch effects based on the new emergency mode
      switch (emergencyMode) {
        case 'LOCKDOWN': {
          // Req 10.2: Lock all doors
          publishCommand('command/doors/lock', {
            action: 'LOCK_ALL',
            timestamp: Date.now(),
          });

          // Req 10.4 / 26.1: Activate lockdown alarm
          void alarmManager.playAlarm('lockdown');
          break;
        }

        case 'EVACUATION': {
          // Req 10.3 / 16.2: Trigger AI pathfinding for evacuation routes
          postToAI({
            type: 'COMPUTE_EVACUATION',
            timestamp: Date.now(),
          });

          // Req 10.3 / 26.1: Activate evacuation alarm
          void alarmManager.playAlarm('evacuation');
          break;
        }

        case 'NORMAL': {
          // Req 10.5 / 26.3: Stop all alarms
          alarmManager.stopAlarm();

          // Req 10.5: Unlock all doors (restore from lockdown)
          if (previousMode === 'LOCKDOWN') {
            publishCommand('command/doors/unlock', {
              action: 'UNLOCK_ALL',
              timestamp: Date.now(),
            });
          }

          // Restore sensor states (publish restore command)
          publishCommand('command/sensors/restore', {
            action: 'RESTORE_ALL',
            previousMode,
            timestamp: Date.now(),
          });
          break;
        }
      }

      // Update the previous mode reference
      previousModeRef.current = emergencyMode;
    });

    return () => {
      unsubscribe();
    };
  }, [publishCommand, postToAI]);
}

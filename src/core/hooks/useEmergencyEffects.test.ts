// ============================================================================
// NFCC Digital Twin - useEmergencyEffects Hook Tests
// ============================================================================
// Validates: Requirements 10.2, 10.3, 10.4, 10.5, 11.3, 16.2
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { useNFCCStore } from '../store/useNFCCStore';
import { useEmergencyEffects } from './useEmergencyEffects';
import { alarmManager } from '../../utils/audio';

// === Mocks ===

// Mock the WorkerProvider's useWorkers hook
const mockPublishCommand = vi.fn();
const mockPostToAI = vi.fn();
const mockPostToPhysics = vi.fn();

vi.mock('../workers/WorkerProvider', () => ({
  useWorkers: () => ({
    publishCommand: mockPublishCommand,
    postToAI: mockPostToAI,
    postToPhysics: mockPostToPhysics,
  }),
}));

// Spy on alarmManager methods
vi.spyOn(alarmManager, 'playAlarm').mockResolvedValue(undefined);
vi.spyOn(alarmManager, 'stopAlarm').mockImplementation(() => undefined);

// === Test Suite ===

describe('useEmergencyEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to NORMAL before each test
    const store = useNFCCStore.getState();
    if (store.emergencyMode !== 'NORMAL') {
      // Force reset by directly setting state
      useNFCCStore.setState({ emergencyMode: 'NORMAL' });
    }
  });

  afterEach(() => {
    // Ensure store is back to NORMAL
    useNFCCStore.setState({ emergencyMode: 'NORMAL' });
  });

  // Simple wrapper — no provider needed since useWorkers is mocked
  function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return createElement('div', null, children);
  }

  it('publishes door lock command on LOCKDOWN transition', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    act(() => {
      useNFCCStore.getState().transitionEmergency('LOCKDOWN');
    });

    expect(mockPublishCommand).toHaveBeenCalledWith(
      'command/doors/lock',
      expect.objectContaining({ action: 'LOCK_ALL' })
    );
  });

  it('activates lockdown alarm on LOCKDOWN transition', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    act(() => {
      useNFCCStore.getState().transitionEmergency('LOCKDOWN');
    });

    expect(alarmManager.playAlarm).toHaveBeenCalledWith('lockdown');
  });

  it('triggers AI pathfinding on EVACUATION transition', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    act(() => {
      useNFCCStore.getState().transitionEmergency('EVACUATION');
    });

    expect(mockPostToAI).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'COMPUTE_EVACUATION' })
    );
  });

  it('activates evacuation alarm on EVACUATION transition', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    act(() => {
      useNFCCStore.getState().transitionEmergency('EVACUATION');
    });

    expect(alarmManager.playAlarm).toHaveBeenCalledWith('evacuation');
  });

  it('stops alarm on NORMAL restore from LOCKDOWN', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    // First transition to LOCKDOWN
    act(() => {
      useNFCCStore.getState().transitionEmergency('LOCKDOWN');
    });

    vi.clearAllMocks();

    // Then restore to NORMAL
    act(() => {
      useNFCCStore.getState().transitionEmergency('NORMAL');
    });

    expect(alarmManager.stopAlarm).toHaveBeenCalled();
  });

  it('publishes door unlock command on NORMAL restore from LOCKDOWN', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    // First transition to LOCKDOWN
    act(() => {
      useNFCCStore.getState().transitionEmergency('LOCKDOWN');
    });

    vi.clearAllMocks();

    // Then restore to NORMAL
    act(() => {
      useNFCCStore.getState().transitionEmergency('NORMAL');
    });

    expect(mockPublishCommand).toHaveBeenCalledWith(
      'command/doors/unlock',
      expect.objectContaining({ action: 'UNLOCK_ALL' })
    );
  });

  it('publishes sensor restore command on NORMAL restore', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    // Transition to EVACUATION then back to NORMAL
    act(() => {
      useNFCCStore.getState().transitionEmergency('EVACUATION');
    });

    vi.clearAllMocks();

    act(() => {
      useNFCCStore.getState().transitionEmergency('NORMAL');
    });

    expect(mockPublishCommand).toHaveBeenCalledWith(
      'command/sensors/restore',
      expect.objectContaining({ action: 'RESTORE_ALL', previousMode: 'EVACUATION' })
    );
  });

  it('does not publish door unlock when restoring from EVACUATION', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    // Transition to EVACUATION then back to NORMAL
    act(() => {
      useNFCCStore.getState().transitionEmergency('EVACUATION');
    });

    vi.clearAllMocks();

    act(() => {
      useNFCCStore.getState().transitionEmergency('NORMAL');
    });

    // Should NOT have called door unlock (only from LOCKDOWN)
    expect(mockPublishCommand).not.toHaveBeenCalledWith(
      'command/doors/unlock',
      expect.anything()
    );
  });

  it('does not fire effects when mode does not change', () => {
    renderHook(() => useEmergencyEffects(), { wrapper });

    // Attempt invalid transition (NORMAL → NORMAL is a no-op in the store)
    act(() => {
      useNFCCStore.getState().transitionEmergency('NORMAL');
    });

    expect(mockPublishCommand).not.toHaveBeenCalled();
    expect(mockPostToAI).not.toHaveBeenCalled();
    expect(alarmManager.playAlarm).not.toHaveBeenCalled();
  });
});

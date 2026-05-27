import { describe, it, expect, beforeEach } from 'vitest';
import { useNFCCStore, isValidTransition } from './useNFCCStore';
import type { DivisionId, EmergencyState, Notification } from '../types/index';

describe('useNFCCStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useNFCCStore.setState({
      activeDivision: 1,
      emergencyMode: 'NORMAL',
      notifications: [],
      isMuted: false,
      isDemoMode: false,
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useNFCCStore.getState();
      expect(state.activeDivision).toBe(1);
      expect(state.emergencyMode).toBe('NORMAL');
      expect(state.notifications).toEqual([]);
      expect(state.isMuted).toBe(false);
      expect(state.isDemoMode).toBe(false);
    });
  });

  describe('setActiveDivision', () => {
    it('should update activeDivision to a valid DivisionId', () => {
      useNFCCStore.getState().setActiveDivision(5);
      expect(useNFCCStore.getState().activeDivision).toBe(5);
    });

    it('should accept all valid DivisionIds (1-11)', () => {
      const validIds: DivisionId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      for (const id of validIds) {
        useNFCCStore.getState().setActiveDivision(id);
        expect(useNFCCStore.getState().activeDivision).toBe(id);
      }
    });
  });

  describe('transitionEmergency', () => {
    it('should transition from NORMAL to LOCKDOWN', () => {
      useNFCCStore.getState().transitionEmergency('LOCKDOWN');
      expect(useNFCCStore.getState().emergencyMode).toBe('LOCKDOWN');
    });

    it('should transition from NORMAL to EVACUATION', () => {
      useNFCCStore.getState().transitionEmergency('EVACUATION');
      expect(useNFCCStore.getState().emergencyMode).toBe('EVACUATION');
    });

    it('should transition from LOCKDOWN to NORMAL', () => {
      useNFCCStore.setState({ emergencyMode: 'LOCKDOWN' });
      useNFCCStore.getState().transitionEmergency('NORMAL');
      expect(useNFCCStore.getState().emergencyMode).toBe('NORMAL');
    });

    it('should transition from LOCKDOWN to EVACUATION', () => {
      useNFCCStore.setState({ emergencyMode: 'LOCKDOWN' });
      useNFCCStore.getState().transitionEmergency('EVACUATION');
      expect(useNFCCStore.getState().emergencyMode).toBe('EVACUATION');
    });

    it('should transition from EVACUATION to NORMAL', () => {
      useNFCCStore.setState({ emergencyMode: 'EVACUATION' });
      useNFCCStore.getState().transitionEmergency('NORMAL');
      expect(useNFCCStore.getState().emergencyMode).toBe('NORMAL');
    });

    it('should reject transition from EVACUATION to LOCKDOWN (invalid)', () => {
      useNFCCStore.setState({ emergencyMode: 'EVACUATION' });
      useNFCCStore.getState().transitionEmergency('LOCKDOWN');
      expect(useNFCCStore.getState().emergencyMode).toBe('EVACUATION');
    });

    it('should reject transition to the same state', () => {
      useNFCCStore.getState().transitionEmergency('NORMAL');
      expect(useNFCCStore.getState().emergencyMode).toBe('NORMAL');
    });
  });

  describe('addNotification', () => {
    it('should add a notification to the list', () => {
      const notification: Notification = {
        id: 'test-1',
        type: 'INFO',
        title: 'Test',
        message: 'Test message',
        division: 1,
        timestamp: Date.now(),
      };
      useNFCCStore.getState().addNotification(notification);
      expect(useNFCCStore.getState().notifications).toHaveLength(1);
      expect(useNFCCStore.getState().notifications[0]).toEqual(notification);
    });

    it('should append multiple notifications', () => {
      const n1: Notification = {
        id: 'n1',
        type: 'WARNING',
        title: 'Warning',
        message: 'First',
        division: 2,
        timestamp: 1000,
      };
      const n2: Notification = {
        id: 'n2',
        type: 'CRITICAL',
        title: 'Critical',
        message: 'Second',
        division: 3,
        timestamp: 2000,
      };
      useNFCCStore.getState().addNotification(n1);
      useNFCCStore.getState().addNotification(n2);
      expect(useNFCCStore.getState().notifications).toHaveLength(2);
      expect(useNFCCStore.getState().notifications[0]?.id).toBe('n1');
      expect(useNFCCStore.getState().notifications[1]?.id).toBe('n2');
    });
  });

  describe('dismissNotification', () => {
    it('should remove a notification by id', () => {
      const notification: Notification = {
        id: 'dismiss-me',
        type: 'INFO',
        title: 'Dismiss',
        message: 'To be dismissed',
        division: 1,
        timestamp: Date.now(),
      };
      useNFCCStore.getState().addNotification(notification);
      useNFCCStore.getState().dismissNotification('dismiss-me');
      expect(useNFCCStore.getState().notifications).toHaveLength(0);
    });

    it('should not affect other notifications when dismissing', () => {
      const n1: Notification = {
        id: 'keep',
        type: 'INFO',
        title: 'Keep',
        message: 'Stay',
        division: 1,
        timestamp: 1000,
      };
      const n2: Notification = {
        id: 'remove',
        type: 'WARNING',
        title: 'Remove',
        message: 'Go',
        division: 2,
        timestamp: 2000,
      };
      useNFCCStore.getState().addNotification(n1);
      useNFCCStore.getState().addNotification(n2);
      useNFCCStore.getState().dismissNotification('remove');
      expect(useNFCCStore.getState().notifications).toHaveLength(1);
      expect(useNFCCStore.getState().notifications[0]?.id).toBe('keep');
    });

    it('should do nothing if id does not exist', () => {
      const notification: Notification = {
        id: 'existing',
        type: 'INFO',
        title: 'Existing',
        message: 'Here',
        division: 1,
        timestamp: Date.now(),
      };
      useNFCCStore.getState().addNotification(notification);
      useNFCCStore.getState().dismissNotification('non-existent');
      expect(useNFCCStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('toggleMute', () => {
    it('should toggle isMuted from false to true', () => {
      useNFCCStore.getState().toggleMute();
      expect(useNFCCStore.getState().isMuted).toBe(true);
    });

    it('should toggle isMuted from true to false', () => {
      useNFCCStore.setState({ isMuted: true });
      useNFCCStore.getState().toggleMute();
      expect(useNFCCStore.getState().isMuted).toBe(false);
    });
  });

  describe('setDemoMode', () => {
    it('should set isDemoMode to true', () => {
      useNFCCStore.getState().setDemoMode(true);
      expect(useNFCCStore.getState().isDemoMode).toBe(true);
    });

    it('should set isDemoMode to false', () => {
      useNFCCStore.setState({ isDemoMode: true });
      useNFCCStore.getState().setDemoMode(false);
      expect(useNFCCStore.getState().isDemoMode).toBe(false);
    });
  });
});

describe('isValidTransition', () => {
  it('should return true for all valid transitions', () => {
    const validTransitions: [EmergencyState, EmergencyState][] = [
      ['NORMAL', 'LOCKDOWN'],
      ['NORMAL', 'EVACUATION'],
      ['LOCKDOWN', 'NORMAL'],
      ['LOCKDOWN', 'EVACUATION'],
      ['EVACUATION', 'NORMAL'],
    ];
    for (const [from, to] of validTransitions) {
      expect(isValidTransition(from, to)).toBe(true);
    }
  });

  it('should return false for EVACUATION to LOCKDOWN', () => {
    expect(isValidTransition('EVACUATION', 'LOCKDOWN')).toBe(false);
  });

  it('should return false for same-state transitions', () => {
    const states: EmergencyState[] = ['NORMAL', 'LOCKDOWN', 'EVACUATION'];
    for (const state of states) {
      expect(isValidTransition(state, state)).toBe(false);
    }
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlarmManager } from './audio.ts';

// Mock Web Audio API for jsdom environment using a class
class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};

  createOscillator(): OscillatorNode {
    return {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    return {
      gain: { value: 1, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as GainNode;
  }

  async resume(): Promise<void> {
    return;
  }

  async close(): Promise<void> {
    return;
  }
}

describe('AlarmManager', () => {
  let manager: AlarmManager;

  beforeEach(() => {
    manager = new AlarmManager();
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterEach(async () => {
    await manager.dispose();
    vi.unstubAllGlobals();
  });

  describe('playAlarm', () => {
    it('starts playing when called with lockdown tone', async () => {
      await manager.playAlarm('lockdown');
      expect(manager.isPlaying()).toBe(true);
    });

    it('starts playing when called with evacuation tone', async () => {
      await manager.playAlarm('evacuation');
      expect(manager.isPlaying()).toBe(true);
    });

    it('stops previous alarm before starting new one', async () => {
      await manager.playAlarm('lockdown');
      await manager.playAlarm('evacuation');
      // Should still be playing (new alarm replaced old)
      expect(manager.isPlaying()).toBe(true);
    });
  });

  describe('stopAlarm', () => {
    it('stops all active oscillators', async () => {
      await manager.playAlarm('lockdown');
      manager.stopAlarm();
      expect(manager.isPlaying()).toBe(false);
    });

    it('does not throw when no alarm is playing', () => {
      expect(() => manager.stopAlarm()).not.toThrow();
    });
  });

  describe('setMuted', () => {
    it('tracks muted state', () => {
      manager.setMuted(true);
      expect(manager.isMuted()).toBe(true);
    });

    it('tracks unmuted state', () => {
      manager.setMuted(true);
      manager.setMuted(false);
      expect(manager.isMuted()).toBe(false);
    });

    it('defaults to unmuted', () => {
      expect(manager.isMuted()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('stops alarms and cleans up', async () => {
      await manager.playAlarm('lockdown');
      await manager.dispose();
      expect(manager.isPlaying()).toBe(false);
    });
  });
});

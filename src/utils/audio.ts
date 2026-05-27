// ============================================================================
// NFCC Digital Twin - Web Audio Alarm System
// ============================================================================
// Programmatic alarm tones using Web Audio API.
// No external audio files required.
// Validates: Requirements 26.1, 26.2, 26.3, 26.4
// ============================================================================

import type { AlarmTone } from '../core/types/index.ts';

/**
 * Manages alarm audio using the Web Audio API.
 * Lazily initializes AudioContext on first play (browser gesture requirement).
 */
export class AlarmManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private muted = false;

  /**
   * Ensures AudioContext is created and resumed.
   * Browsers require a user gesture before audio can play,
   * so we lazily initialize and attempt resume.
   */
  private async ensureContext(): Promise<{ ctx: AudioContext; master: GainNode }> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return { ctx: this.audioContext, master: this.masterGain! };
  }

  /**
   * Plays an alarm tone.
   * - Lockdown: steady 800Hz sawtooth wave
   * - Evacuation: alternating 600Hz/900Hz square wave at 2Hz
   */
  async playAlarm(tone: AlarmTone): Promise<void> {
    // Stop any existing alarm before starting a new one
    this.stopAlarm();

    const { ctx, master } = await this.ensureContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(master);
    gainNode.gain.value = 0.5; // Moderate volume to avoid harsh output

    if (tone === 'lockdown') {
      // Lockdown: steady 800Hz sawtooth
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    } else {
      // Evacuation: alternating 600Hz/900Hz square wave at 2Hz
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);

      // Schedule frequency alternation for the next 60 seconds (long enough for any alarm)
      const duration = 60;
      const intervalSeconds = 0.5; // 2Hz = switch every 0.5s
      const steps = Math.floor(duration / intervalSeconds);

      for (let i = 0; i < steps; i++) {
        const time = ctx.currentTime + i * intervalSeconds;
        const freq = i % 2 === 0 ? 600 : 900;
        oscillator.frequency.setValueAtTime(freq, time);
      }
    }

    oscillator.start();

    this.activeOscillators.push(oscillator);
    this.activeGains.push(gainNode);
  }

  /**
   * Stops all active alarm oscillators and disconnects audio nodes.
   */
  stopAlarm(): void {
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    for (const oscillator of this.activeOscillators) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch {
        // Oscillator may already be stopped
      }
    }

    for (const gain of this.activeGains) {
      try {
        gain.disconnect();
      } catch {
        // Node may already be disconnected
      }
    }

    this.activeOscillators = [];
    this.activeGains = [];
  }

  /**
   * Sets the master mute state.
   * When muted, master gain is set to 0; when unmuted, restored to 1.
   */
  setMuted(muted: boolean): void {
    this.muted = muted;

    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  /**
   * Returns whether the alarm manager is currently muted.
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Returns whether any alarm is currently playing.
   */
  isPlaying(): boolean {
    return this.activeOscillators.length > 0;
  }

  /**
   * Cleans up the AudioContext entirely.
   * Call this when the application is being destroyed.
   */
  async dispose(): Promise<void> {
    this.stopAlarm();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

/** Singleton instance for application-wide alarm management. */
export const alarmManager = new AlarmManager();

// ============================================================================
// NFCC Digital Twin - Test Setup
// ============================================================================
// Global test utilities and mocks for Vitest + jsdom environment.
// ============================================================================

import '@testing-library/jest-dom';

// === Web Worker Mock ===
// jsdom does not support Web Workers natively. Provide a minimal mock.
class MockWorker implements Partial<Worker> {
  public onmessage: ((ev: MessageEvent) => void) | null = null;
  public onerror: ((ev: ErrorEvent) => void) | null = null;

  postMessage(_data: unknown): void {
    // No-op in tests; individual tests can override behavior
  }

  terminate(): void {
    // No-op
  }

  addEventListener(): void {
    // No-op
  }

  removeEventListener(): void {
    // No-op
  }

  dispatchEvent(): boolean {
    return false;
  }
}

// Assign mock Worker to global scope
Object.defineProperty(globalThis, 'Worker', {
  writable: true,
  value: MockWorker,
});

// === IndexedDB Mock ===
// Dexie.js requires IndexedDB. Use fake-indexeddb for tests.
import 'fake-indexeddb/auto';

// === Web Audio API Mock ===
// jsdom does not implement Web Audio API. Provide minimal stubs.
class MockAudioContext {
  public state: AudioContextState = 'running';

  createOscillator(): { connect: () => void; start: () => void; stop: () => void; frequency: { value: number } } {
    return {
      connect: (): void => {},
      start: (): void => {},
      stop: (): void => {},
      frequency: { value: 440 },
    };
  }

  createGain(): { connect: () => void; gain: { value: number } } {
    return {
      connect: (): void => {},
      gain: { value: 1 },
    };
  }

  get destination(): AudioDestinationNode {
    return {} as AudioDestinationNode;
  }

  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

Object.defineProperty(globalThis, 'AudioContext', {
  writable: true,
  configurable: true,
  value: MockAudioContext,
});

Object.defineProperty(globalThis, 'webkitAudioContext', {
  writable: true,
  configurable: true,
  value: MockAudioContext,
});

// === structuredClone polyfill ===
// Some jsdom versions lack structuredClone
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

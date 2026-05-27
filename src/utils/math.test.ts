import { describe, it, expect } from 'vitest';
import { clamp, lerp, mapRange } from './math.ts';

describe('math utilities', () => {
  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to min when value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps to max when value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns min when value equals min', () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it('returns max when value equals max', () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('returns a when t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('returns b when t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('returns midpoint when t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('handles negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('mapRange', () => {
    it('maps value from one range to another', () => {
      expect(mapRange(0.5, 0, 1, 0, 100)).toBe(50);
    });

    it('maps min to outMin', () => {
      expect(mapRange(0, 0, 1, 10, 20)).toBe(10);
    });

    it('maps max to outMax', () => {
      expect(mapRange(1, 0, 1, 10, 20)).toBe(20);
    });

    it('handles inverted output range', () => {
      expect(mapRange(0.5, 0, 1, 100, 0)).toBe(50);
    });

    it('handles non-zero input min', () => {
      expect(mapRange(50, 0, 100, 0, 1)).toBeCloseTo(0.5);
    });
  });
});

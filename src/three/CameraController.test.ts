// ============================================================================
// NFCC Digital Twin - CameraController Unit Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { getZoneCameraPosition, getAvailableZones } from './CameraController';

describe('CameraController utilities', () => {
  describe('getZoneCameraPosition', () => {
    it('returns a valid position for known zones', () => {
      const position = getZoneCameraPosition('zone-a');
      expect(position).toBeDefined();
      expect(position?.position).toHaveLength(3);
      expect(position?.target).toHaveLength(3);
    });

    it('returns undefined for unknown zones', () => {
      const position = getZoneCameraPosition('zone-unknown');
      expect(position).toBeUndefined();
    });

    it('returns correct position for zone-a (Command Center)', () => {
      const position = getZoneCameraPosition('zone-a');
      expect(position?.position).toEqual([0, 25, 30]);
      expect(position?.target).toEqual([0, 5, 0]);
    });

    it('returns correct position for zone-e (HVAC)', () => {
      const position = getZoneCameraPosition('zone-e');
      expect(position?.position).toEqual([0, 20, -25]);
      expect(position?.target).toEqual([0, 5, -5]);
    });
  });

  describe('getAvailableZones', () => {
    it('returns all 11 zone identifiers', () => {
      const zones = getAvailableZones();
      expect(zones).toHaveLength(11);
    });

    it('includes all expected zone keys', () => {
      const zones = getAvailableZones();
      const expected = [
        'zone-a',
        'zone-b',
        'zone-c',
        'zone-d',
        'zone-e',
        'zone-f',
        'zone-g',
        'zone-h',
        'zone-i',
        'zone-j',
        'zone-k',
      ];
      for (const zone of expected) {
        expect(zones).toContain(zone);
      }
    });

    it('each zone has valid position and target arrays', () => {
      const zones = getAvailableZones();
      for (const zone of zones) {
        const pos = getZoneCameraPosition(zone);
        expect(pos).toBeDefined();
        expect(pos?.position).toHaveLength(3);
        expect(pos?.target).toHaveLength(3);
        // All coordinates should be finite numbers
        for (const coord of pos?.position ?? []) {
          expect(Number.isFinite(coord)).toBe(true);
        }
        for (const coord of pos?.target ?? []) {
          expect(Number.isFinite(coord)).toBe(true);
        }
      }
    });
  });
});

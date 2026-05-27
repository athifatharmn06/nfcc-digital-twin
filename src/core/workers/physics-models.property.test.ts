// ============================================================================
// NFCC Digital Twin - Physics Models Property-Based Tests
// ============================================================================
// Property-based tests using fast-check to verify physics simulation correctness
// across all valid input spaces.
// ============================================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  simulateTemperature,
  simulateElectricalLoad,
  simulateWaterTank,
} from './physics-models';
import {
  arbTemperatureParams,
  arbElectricalParams,
  arbWaterTankParams,
} from '../../test/arbitraries';

describe('Feature: nfcc-digital-twin, Property 3: Temperature Simulation Follows Newton\'s Law of Cooling', () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * For any valid TemperatureParams and current temperature, the temperature delta
   * computed by simulateTemperature SHALL equal:
   *   -k * (T_current - T_ambient) + heatGain - cooling
   * where heatGain = occupancy * 0.05
   */
  it('delta matches formula: -k * (T_current - T_ambient) + occupancy * 0.05 - hvacCooling', () => {
    fc.assert(
      fc.property(
        arbTemperatureParams,
        fc.float({ min: Math.fround(-50), max: Math.fround(100), noNaN: true }),
        (params, currentTemp) => {
          const result = simulateTemperature(currentTemp, params);

          const heatGain = params.occupancy * 0.05;
          const expectedDelta =
            -params.kCoefficient * (currentTemp - params.ambientTemp) +
            heatGain -
            params.hvacCooling;

          // Floating-point tolerance for accumulated rounding
          expect(result).toBeCloseTo(expectedDelta, 4);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: nfcc-digital-twin, Property 4: Electrical Load Simulation Bounds', () => {
  /**
   * **Validates: Requirements 7.3**
   *
   * For any valid ElectricalParams and time value, the simulated electrical load
   * SHALL be within the range:
   *   [baseLoad - amplitude - noiseLevel, baseLoad + amplitude + noiseLevel]
   */
  it('output is within [baseLoad - amplitude - noiseLevel, baseLoad + amplitude + noiseLevel]', () => {
    fc.assert(
      fc.property(
        arbElectricalParams,
        fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
        (params, time, rng) => {
          const result = simulateElectricalLoad(params, time, rng);

          const lowerBound = params.baseLoad - params.amplitude - params.noiseLevel;
          const upperBound = params.baseLoad + params.amplitude + params.noiseLevel;

          expect(result).toBeGreaterThanOrEqual(lowerBound - 1e-4);
          expect(result).toBeLessThanOrEqual(upperBound + 1e-4);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: nfcc-digital-twin, Property 5: Water Tank Mass Conservation', () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * For any valid WaterTankParams and time step dt, the new water level SHALL equal:
   *   currentLevel + (inflowRate - outflowRate) * dt / tankArea
   */
  it('new level matches formula: currentLevel + (inflowRate - outflowRate) * dt / tankArea', () => {
    fc.assert(
      fc.property(
        arbWaterTankParams,
        fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true }),
        (params, dt) => {
          const result = simulateWaterTank(params, dt);

          const expectedLevel =
            params.currentLevel +
            ((params.inflowRate - params.outflowRate) * dt) / params.tankArea;

          expect(result).toBeCloseTo(expectedLevel, 4);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// NFCC Digital Twin - Physics Models Unit Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  simulateTemperature,
  simulateElectricalLoad,
  simulateWaterTank,
  simulateSeismic,
} from './physics-models';
import type {
  TemperatureParams,
  ElectricalParams,
  WaterTankParams,
  SeismicParams,
} from '../types/index';

describe('simulateTemperature', () => {
  it('returns negative delta when current temp is above ambient (cooling)', () => {
    const params: TemperatureParams = {
      ambientTemp: 20,
      occupancy: 0,
      hvacCooling: 0,
      kCoefficient: 0.1,
    };
    const currentTemp = 30; // 10 degrees above ambient
    const dT = simulateTemperature(currentTemp, params);
    // dT = -0.1 * (30 - 20) + 0 - 0 = -1
    expect(dT).toBeCloseTo(-1, 5);
  });

  it('returns positive delta when current temp is below ambient (warming)', () => {
    const params: TemperatureParams = {
      ambientTemp: 25,
      occupancy: 0,
      hvacCooling: 0,
      kCoefficient: 0.2,
    };
    const currentTemp = 20; // 5 degrees below ambient
    const dT = simulateTemperature(currentTemp, params);
    // dT = -0.2 * (20 - 25) + 0 - 0 = 1
    expect(dT).toBeCloseTo(1, 5);
  });

  it('accounts for occupancy heat gain', () => {
    const params: TemperatureParams = {
      ambientTemp: 22,
      occupancy: 100,
      hvacCooling: 0,
      kCoefficient: 0.1,
    };
    const currentTemp = 22; // At ambient
    const dT = simulateTemperature(currentTemp, params);
    // dT = -0.1 * (22 - 22) + 100*0.05 - 0 = 5
    expect(dT).toBeCloseTo(5, 5);
  });

  it('accounts for HVAC cooling', () => {
    const params: TemperatureParams = {
      ambientTemp: 22,
      occupancy: 0,
      hvacCooling: 3,
      kCoefficient: 0.1,
    };
    const currentTemp = 22; // At ambient
    const dT = simulateTemperature(currentTemp, params);
    // dT = -0.1 * (22 - 22) + 0 - 3 = -3
    expect(dT).toBeCloseTo(-3, 5);
  });

  it('combines all factors correctly', () => {
    const params: TemperatureParams = {
      ambientTemp: 20,
      occupancy: 40,
      hvacCooling: 2,
      kCoefficient: 0.1,
    };
    const currentTemp = 25;
    const dT = simulateTemperature(currentTemp, params);
    // dT = -0.1 * (25 - 20) + 40*0.05 - 2 = -0.5 + 2 - 2 = -0.5
    expect(dT).toBeCloseTo(-0.5, 5);
  });

  it('returns zero delta at equilibrium', () => {
    // Equilibrium: -k*(T-Tamb) + heatGain - cooling = 0
    // With T=Tamb, occupancy=0, cooling=0 → dT = 0
    const params: TemperatureParams = {
      ambientTemp: 22,
      occupancy: 0,
      hvacCooling: 0,
      kCoefficient: 0.5,
    };
    const dT = simulateTemperature(22, params);
    expect(dT).toBeCloseTo(0, 5);
  });
});

describe('simulateElectricalLoad', () => {
  it('returns baseLoad when amplitude and noise are zero', () => {
    const params: ElectricalParams = {
      baseLoad: 5000,
      amplitude: 0,
      frequency: 1,
      noiseLevel: 0,
    };
    const result = simulateElectricalLoad(params, 0, 0.5);
    // noise = (0.5 * 2 - 1) = 0, sin(0) = 0
    expect(result).toBeCloseTo(5000, 5);
  });

  it('produces sinusoidal variation with amplitude', () => {
    const params: ElectricalParams = {
      baseLoad: 5000,
      amplitude: 1000,
      frequency: 1,
      noiseLevel: 0,
    };
    // At t = 0.25 (quarter period), sin(2π * 1 * 0.25) = sin(π/2) = 1
    const result = simulateElectricalLoad(params, 0.25, 0.5);
    // noise = 0 * 0 = 0
    expect(result).toBeCloseTo(6000, 5);
  });

  it('adds noise proportional to noiseLevel', () => {
    const params: ElectricalParams = {
      baseLoad: 5000,
      amplitude: 0,
      frequency: 1,
      noiseLevel: 100,
    };
    // rng = 1.0 → noise = (1.0 * 2 - 1) = 1 → noiseLevel * 1 = 100
    const result = simulateElectricalLoad(params, 0, 1.0);
    expect(result).toBeCloseTo(5100, 5);
  });

  it('result is within expected bounds', () => {
    const params: ElectricalParams = {
      baseLoad: 5000,
      amplitude: 500,
      frequency: 0.5,
      noiseLevel: 100,
    };
    // For any t and rng, result should be in [baseLoad - amplitude - noiseLevel, baseLoad + amplitude + noiseLevel]
    for (let i = 0; i < 100; i++) {
      const t = Math.random() * 100;
      const rng = Math.random();
      const result = simulateElectricalLoad(params, t, rng);
      expect(result).toBeGreaterThanOrEqual(5000 - 500 - 100);
      expect(result).toBeLessThanOrEqual(5000 + 500 + 100);
    }
  });

  it('handles negative noise (rng < 0.5)', () => {
    const params: ElectricalParams = {
      baseLoad: 5000,
      amplitude: 0,
      frequency: 1,
      noiseLevel: 100,
    };
    // rng = 0.0 → noise = (0 * 2 - 1) = -1 → noiseLevel * -1 = -100
    const result = simulateElectricalLoad(params, 0, 0.0);
    expect(result).toBeCloseTo(4900, 5);
  });
});

describe('simulateWaterTank', () => {
  it('increases level when inflow exceeds outflow', () => {
    const params: WaterTankParams = {
      currentLevel: 50,
      inflowRate: 10,
      outflowRate: 5,
      tankArea: 20,
    };
    const dt = 1; // 1 second
    const result = simulateWaterTank(params, dt);
    // newLevel = 50 + (10 - 5) * 1 / 20 = 50 + 0.25 = 50.25
    expect(result).toBeCloseTo(50.25, 5);
  });

  it('decreases level when outflow exceeds inflow', () => {
    const params: WaterTankParams = {
      currentLevel: 50,
      inflowRate: 5,
      outflowRate: 10,
      tankArea: 20,
    };
    const dt = 1;
    const result = simulateWaterTank(params, dt);
    // newLevel = 50 + (5 - 10) * 1 / 20 = 50 - 0.25 = 49.75
    expect(result).toBeCloseTo(49.75, 5);
  });

  it('maintains level when inflow equals outflow', () => {
    const params: WaterTankParams = {
      currentLevel: 60,
      inflowRate: 8,
      outflowRate: 8,
      tankArea: 10,
    };
    const dt = 2;
    const result = simulateWaterTank(params, dt);
    expect(result).toBeCloseTo(60, 5);
  });

  it('scales with time step dt', () => {
    const params: WaterTankParams = {
      currentLevel: 50,
      inflowRate: 10,
      outflowRate: 0,
      tankArea: 10,
    };
    const result1 = simulateWaterTank(params, 1);
    const result2 = simulateWaterTank(params, 2);
    // result2 - currentLevel should be 2x (result1 - currentLevel)
    expect(result2 - 50).toBeCloseTo(2 * (result1 - 50), 5);
  });

  it('inversely scales with tank area', () => {
    const params1: WaterTankParams = {
      currentLevel: 50,
      inflowRate: 10,
      outflowRate: 0,
      tankArea: 10,
    };
    const params2: WaterTankParams = {
      ...params1,
      tankArea: 20,
    };
    const dt = 1;
    const result1 = simulateWaterTank(params1, dt);
    const result2 = simulateWaterTank(params2, dt);
    // Level change with area=20 should be half of area=10
    expect(result2 - 50).toBeCloseTo((result1 - 50) / 2, 5);
  });
});

describe('simulateSeismic', () => {
  it('applies random walk step within stepSize bounds', () => {
    const params: SeismicParams = {
      currentValue: 0,
      stepSize: 1,
      spikeProbability: 0, // No spikes
      spikeAmplitude: 10,
    };
    // rngStep = 0.5 → step = (0.5*2 - 1) * 1 = 0
    const result = simulateSeismic(params, 0.5, 1.0); // rngSpike=1.0 > 0 → no spike
    expect(result).toBeCloseTo(0, 5);
  });

  it('applies positive step when rngStep > 0.5', () => {
    const params: SeismicParams = {
      currentValue: 0,
      stepSize: 1,
      spikeProbability: 0,
      spikeAmplitude: 10,
    };
    // rngStep = 1.0 → step = (1.0*2 - 1) * 1 = 1
    const result = simulateSeismic(params, 1.0, 1.0);
    expect(result).toBeCloseTo(1, 5);
  });

  it('applies negative step when rngStep < 0.5', () => {
    const params: SeismicParams = {
      currentValue: 0,
      stepSize: 1,
      spikeProbability: 0,
      spikeAmplitude: 10,
    };
    // rngStep = 0.0 → step = (0*2 - 1) * 1 = -1
    const result = simulateSeismic(params, 0.0, 1.0);
    expect(result).toBeCloseTo(-1, 5);
  });

  it('adds spike when rngSpike < spikeProbability', () => {
    const params: SeismicParams = {
      currentValue: 0,
      stepSize: 0,
      spikeProbability: 0.5,
      spikeAmplitude: 5,
    };
    // rngStep = 0.75 (> 0.5 → positive spike direction), rngSpike = 0.1 (< 0.5 → spike triggers)
    // step = (0.75*2 - 1) * 0 = 0
    // spike = 5 * 1 = 5 (rngStep > 0.5 → positive)
    const result = simulateSeismic(params, 0.75, 0.1);
    expect(result).toBeCloseTo(5, 5);
  });

  it('adds negative spike when rngStep <= 0.5', () => {
    const params: SeismicParams = {
      currentValue: 0,
      stepSize: 0,
      spikeProbability: 0.5,
      spikeAmplitude: 5,
    };
    // rngStep = 0.25 (≤ 0.5 → negative spike direction), rngSpike = 0.1 (< 0.5 → spike triggers)
    // spike = 5 * -1 = -5
    const result = simulateSeismic(params, 0.25, 0.1);
    expect(result).toBeCloseTo(-5, 5);
  });

  it('does not add spike when rngSpike >= spikeProbability', () => {
    const params: SeismicParams = {
      currentValue: 5,
      stepSize: 0,
      spikeProbability: 0.1,
      spikeAmplitude: 100,
    };
    // rngSpike = 0.5 (>= 0.1 → no spike)
    const result = simulateSeismic(params, 0.5, 0.5);
    // step = 0, spike = 0
    expect(result).toBeCloseTo(5, 5);
  });

  it('preserves current value offset', () => {
    const params: SeismicParams = {
      currentValue: 10,
      stepSize: 1,
      spikeProbability: 0,
      spikeAmplitude: 0,
    };
    // rngStep = 0.75 → step = (0.75*2 - 1) * 1 = 0.5
    const result = simulateSeismic(params, 0.75, 1.0);
    expect(result).toBeCloseTo(10.5, 5);
  });
});

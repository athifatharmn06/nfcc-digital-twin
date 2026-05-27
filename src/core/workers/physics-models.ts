// ============================================================================
// NFCC Digital Twin - Physics Simulation Models
// ============================================================================
// Pure simulation functions extracted for testability.
// These implement the physical models used by the PhysicsWorker.
// ============================================================================

import type {
  TemperatureParams,
  ElectricalParams,
  WaterTankParams,
  SeismicParams,
} from '../types/index';

/**
 * Simulates temperature change using Newton's Law of Cooling.
 * Formula: dT = -k * (T_current - T_ambient) + heatGain - cooling
 *
 * @param currentTemp - Current temperature value
 * @param params - Temperature simulation parameters
 * @returns The temperature delta (change) for this tick
 */
export function simulateTemperature(
  currentTemp: number,
  params: TemperatureParams
): number {
  const heatGain = params.occupancy * 0.05; // Each occupant contributes 0.05°C per tick
  const dT =
    -params.kCoefficient * (currentTemp - params.ambientTemp) +
    heatGain -
    params.hvacCooling;
  return dT;
}

/**
 * Simulates electrical load using sinusoidal base load with noise.
 * Formula: baseLoad + amplitude * sin(2π * frequency * t) + noise
 *
 * @param params - Electrical simulation parameters
 * @param t - Time value (seconds since start)
 * @param rng - Optional random number (0-1) for deterministic testing
 * @returns The computed electrical load value
 */
export function simulateElectricalLoad(
  params: ElectricalParams,
  t: number,
  rng?: number
): number {
  const noise = (rng ?? Math.random()) * 2 - 1; // Range [-1, 1]
  return (
    params.baseLoad +
    params.amplitude * Math.sin(2 * Math.PI * params.frequency * t) +
    params.noiseLevel * noise
  );
}

/**
 * Simulates water tank level using flow rate differential.
 * Formula: level + (inflow - outflow) * dt / area
 *
 * @param params - Water tank simulation parameters
 * @param dt - Time step in seconds
 * @returns The new water level after the time step
 */
export function simulateWaterTank(
  params: WaterTankParams,
  dt: number
): number {
  const newLevel =
    params.currentLevel +
    ((params.inflowRate - params.outflowRate) * dt) / params.tankArea;
  return newLevel;
}

/**
 * Simulates seismic data using random walk with spike probability.
 * Each tick: value += random step. With spikeProbability, a large spike occurs.
 *
 * @param params - Seismic simulation parameters
 * @param rngStep - Optional random number (0-1) for step direction
 * @param rngSpike - Optional random number (0-1) for spike trigger
 * @returns The new seismic value
 */
export function simulateSeismic(
  params: SeismicParams,
  rngStep?: number,
  rngSpike?: number
): number {
  const stepRandom = rngStep ?? Math.random();
  const spikeRandom = rngSpike ?? Math.random();

  // Random walk step: range [-stepSize, +stepSize]
  const step = (stepRandom * 2 - 1) * params.stepSize;

  // Spike: if random < spikeProbability, add a large amplitude
  const spike =
    spikeRandom < params.spikeProbability
      ? params.spikeAmplitude * (stepRandom > 0.5 ? 1 : -1)
      : 0;

  return params.currentValue + step + spike;
}

// ============================================================================
// NFCC Digital Twin - Fast-Check Arbitraries
// ============================================================================
// Custom fast-check Arbitrary generators for all core NFCC types.
// Used across property-based tests to generate valid random instances.
// ============================================================================

import * as fc from 'fast-check';
import type {
  SensorNode,
  SensorType,
  StatusFlags,
  BIMMetadata,
  DivisionId,
  BrokerMessage,
  WorkerSource,
  EmergencyState,
  TemperatureParams,
  ElectricalParams,
  WaterTankParams,
  SeismicParams,
  TimeSeriesRecord,
  Notification,
} from '../core/types/index';

// === Primitive Arbitraries ===

/** All valid SensorType values */
const SENSOR_TYPES: SensorType[] = [
  'TEMPERATURE', 'HUMIDITY', 'CO2', 'PRESSURE',
  'ELECTRICAL_LOAD', 'VOLTAGE', 'POWER_FACTOR',
  'WATER_LEVEL', 'FLOW_RATE', 'PH',
  'PIR_MOTION', 'DOOR_CONTACT', 'VIBRATION',
  'SMOKE', 'HEAT', 'SEISMIC',
];

/** All valid WorkerSource values */
const WORKER_SOURCES: WorkerSource[] = ['physics', 'ai', 'ui', 'broker'];

/** All valid EmergencyState values */
const EMERGENCY_STATES: EmergencyState[] = ['NORMAL', 'LOCKDOWN', 'EVACUATION'];

/** All valid DivisionId values (1-11) */
const DIVISION_IDS: DivisionId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Criticality levels for BIMMetadata */
const CRITICALITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

// === Exported Arbitraries ===

/** Arbitrary for DivisionId (1-11) */
export const arbDivisionId: fc.Arbitrary<DivisionId> = fc.constantFrom(...DIVISION_IDS);

/** Arbitrary for SensorType */
export const arbSensorType: fc.Arbitrary<SensorType> = fc.constantFrom(...SENSOR_TYPES);

/** Arbitrary for WorkerSource */
export const arbWorkerSource: fc.Arbitrary<WorkerSource> = fc.constantFrom(...WORKER_SOURCES);

/** Arbitrary for EmergencyState */
export const arbEmergencyState: fc.Arbitrary<EmergencyState> = fc.constantFrom(...EMERGENCY_STATES);

/** Arbitrary for StatusFlags */
export const arbStatusFlags: fc.Arbitrary<StatusFlags> = fc.record({
  inAlarm: fc.boolean(),
  fault: fc.boolean(),
  overridden: fc.boolean(),
  outOfService: fc.boolean(),
});

/** Arbitrary for BIMMetadata */
export const arbBIMMetadata: fc.Arbitrary<BIMMetadata> = fc.record({
  vendor: fc.string({ minLength: 1, maxLength: 50 }),
  installDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map((d) => d.toISOString().split('T')[0] as string),
  maintenanceInterval: fc.integer({ min: 1, max: 365 }),
  criticalityLevel: fc.constantFrom(...CRITICALITY_LEVELS),
  isoReference: fc.string({ minLength: 3, maxLength: 20 }),
});

/** Arbitrary for a 3D position tuple */
export const arbPosition: fc.Arbitrary<[number, number, number]> = fc.tuple(
  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
);

/** Arbitrary for zone names */
export const arbZone: fc.Arbitrary<string> = fc.constantFrom(
  'zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e',
  'zone-f', 'zone-g', 'zone-h', 'zone-i', 'zone-j', 'zone-k',
);

/** Arbitrary for SensorNode */
export const arbSensorNode: fc.Arbitrary<SensorNode> = fc.record({
  id: fc.uuid(),
  objectName: fc.string({ minLength: 1, maxLength: 30 }),
  objectType: arbSensorType,
  presentValue: fc.float({ min: Math.fround(-1000), max: Math.fround(10000), noNaN: true }),
  statusFlags: arbStatusFlags,
  zone: arbZone,
  position: arbPosition,
  division: arbDivisionId,
  metadata: arbBIMMetadata,
});

/** Arbitrary for BrokerMessage topic strings (hierarchical) */
export const arbTopic: fc.Arbitrary<string> = fc.oneof(
  fc.constant('sensor').chain((prefix) =>
    arbZone.chain((zone) =>
      arbSensorType.map((type) => `${prefix}/${zone}/${type.toLowerCase()}`)
    )
  ),
  fc.constant('command').chain(() =>
    arbDivisionId.map((div) => `command/division-${div}/override`)
  ),
  fc.constant('alert').chain(() =>
    fc.constantFrom('info', 'warning', 'critical').map((sev) => `alert/${sev}/anomaly`)
  ),
  fc.constant('system').chain(() =>
    fc.constantFrom('start', 'stop', 'transition').map((evt) => `system/${evt}`)
  ),
);

/** Arbitrary for BrokerMessage */
export const arbBrokerMessage: fc.Arbitrary<BrokerMessage> = fc.record({
  topic: arbTopic,
  timestamp: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
  payload: fc.oneof(
    fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }).map((v) => v as unknown),
    fc.string().map((s) => s as unknown),
    fc.record({ value: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }), unit: fc.string() }).map((r) => r as unknown),
  ),
  source: arbWorkerSource,
});

/** Arbitrary for TemperatureParams */
export const arbTemperatureParams: fc.Arbitrary<TemperatureParams> = fc.record({
  ambientTemp: fc.float({ min: Math.fround(-20), max: Math.fround(50), noNaN: true }),
  occupancy: fc.float({ min: Math.fround(0), max: Math.fround(500), noNaN: true }),
  hvacCooling: fc.float({ min: Math.fround(0), max: Math.fround(20), noNaN: true }),
  kCoefficient: fc.float({ min: Math.fround(0.001), max: Math.fround(1), noNaN: true }),
});

/** Arbitrary for ElectricalParams */
export const arbElectricalParams: fc.Arbitrary<ElectricalParams> = fc.record({
  baseLoad: fc.float({ min: Math.fround(100), max: Math.fround(10000), noNaN: true }),
  amplitude: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
  frequency: fc.float({ min: Math.fround(0.001), max: Math.fround(10), noNaN: true }),
  noiseLevel: fc.float({ min: Math.fround(0), max: Math.fround(500), noNaN: true }),
});

/** Arbitrary for WaterTankParams */
export const arbWaterTankParams: fc.Arbitrary<WaterTankParams> = fc.record({
  currentLevel: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
  inflowRate: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
  outflowRate: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
  tankArea: fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
});

/** Arbitrary for SeismicParams */
export const arbSeismicParams: fc.Arbitrary<SeismicParams> = fc.record({
  currentValue: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
  stepSize: fc.float({ min: Math.fround(0.001), max: Math.fround(1), noNaN: true }),
  spikeProbability: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
  spikeAmplitude: fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
});

/** Arbitrary for TimeSeriesRecord */
export const arbTimeSeriesRecord: fc.Arbitrary<TimeSeriesRecord> = fc.record({
  nodeId: fc.uuid(),
  zone: arbZone,
  value: fc.float({ min: Math.fround(-1000), max: Math.fround(10000), noNaN: true }),
  timestamp: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
  type: arbSensorType,
});

/** Arbitrary for Notification */
export const arbNotification: fc.Arbitrary<Notification> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('INFO' as const, 'WARNING' as const, 'CRITICAL' as const),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  message: fc.string({ minLength: 1, maxLength: 200 }),
  division: arbDivisionId,
  timestamp: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
});

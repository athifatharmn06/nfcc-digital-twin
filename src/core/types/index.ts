// ============================================================================
// NFCC Digital Twin - Core Type Definitions
// ============================================================================
// All TypeScript interfaces for the NFCC Digital Twin application.
// Strict mode: no `any` type usage.
// ============================================================================

// === Sensor Types ===

export type SensorType =
  | 'TEMPERATURE'
  | 'HUMIDITY'
  | 'CO2'
  | 'PRESSURE'
  | 'ELECTRICAL_LOAD'
  | 'VOLTAGE'
  | 'POWER_FACTOR'
  | 'WATER_LEVEL'
  | 'FLOW_RATE'
  | 'PH'
  | 'PIR_MOTION'
  | 'DOOR_CONTACT'
  | 'VIBRATION'
  | 'SMOKE'
  | 'HEAT'
  | 'SEISMIC';

// === Status Flags ===

export interface StatusFlags {
  inAlarm: boolean;
  fault: boolean;
  overridden: boolean;
  outOfService: boolean;
}

// === BIM Metadata ===

export interface BIMMetadata {
  vendor: string;
  installDate: string;
  maintenanceInterval: number; // days
  criticalityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isoReference: string;
}

// === Division ===

export type DivisionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface DivisionConfig {
  id: DivisionId;
  name: string;
  icon: string;
  sensorTypes: SensorType[];
  color: string;
}

// === Sensor Node ===

export interface SensorNode {
  id: string;
  objectName: string;
  objectType: SensorType;
  presentValue: number;
  statusFlags: StatusFlags;
  zone: string;
  position: [number, number, number];
  division: DivisionId;
  metadata: BIMMetadata;
}


// === Emergency State Machine ===

export type EmergencyState = 'NORMAL' | 'LOCKDOWN' | 'EVACUATION';

export type AlarmTone = 'lockdown' | 'evacuation';

export type TransitionEffect =
  | { type: 'LOCK_ALL_DOORS' }
  | { type: 'UNLOCK_ALL_DOORS' }
  | { type: 'ACTIVATE_ALARM'; tone: AlarmTone }
  | { type: 'DEACTIVATE_ALARM' }
  | { type: 'COMPUTE_EVACUATION' }
  | { type: 'OVERRIDE_SENSORS'; override: Partial<StatusFlags> }
  | { type: 'RESTORE_SENSORS' };

export interface StateTransition {
  from: EmergencyState;
  to: EmergencyState;
  trigger: string;
  effects: TransitionEffect[];
}

// === Broker Message ===

export type WorkerSource = 'physics' | 'ai' | 'ui' | 'broker';

export interface BrokerMessage {
  topic: string;
  timestamp: number;
  payload: unknown;
  source: WorkerSource;
}

// === Notification ===

export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  division: DivisionId;
  timestamp: number;
}

// === Zustand Store ===

export interface NFCCStore {
  // UI State
  activeDivision: DivisionId;
  emergencyMode: EmergencyState;
  notifications: Notification[];
  isMuted: boolean;
  isDemoMode: boolean;

  // Actions
  setActiveDivision: (id: DivisionId) => void;
  transitionEmergency: (to: EmergencyState) => void;
  addNotification: (n: Notification) => void;
  dismissNotification: (id: string) => void;
  toggleMute: () => void;
  setDemoMode: (active: boolean) => void;
}

// === Physics Models ===

export interface TemperatureParams {
  ambientTemp: number;
  occupancy: number;
  hvacCooling: number;
  kCoefficient: number;
}

export interface ElectricalParams {
  baseLoad: number;
  amplitude: number;
  frequency: number;
  noiseLevel: number;
}

export interface WaterTankParams {
  currentLevel: number;
  inflowRate: number;
  outflowRate: number;
  tankArea: number;
}

export interface SeismicParams {
  currentValue: number;
  stepSize: number;
  spikeProbability: number;
  spikeAmplitude: number;
}

// === AI Models ===

export interface Cluster {
  centroid: [number, number];
  points: [number, number][];
  size: number;
}

export interface KMeansResult {
  clusters: Cluster[];
  anomalies: AnomalyAlert[];
}

export interface AnomalyAlert {
  zone: string;
  centroid: [number, number];
  confidence: number;
  timestamp: number;
}

export interface PathfindingResult {
  path: [number, number][];
  cost: number;
  blocked: [number, number][];
}

// === IndexedDB Schema ===

export interface TimeSeriesRecord {
  id?: number;
  nodeId: string;
  zone: string;
  value: number;
  timestamp: number;
  type: SensorType;
}

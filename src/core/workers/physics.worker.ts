// ============================================================================
// NFCC Digital Twin - PhysicsWorker
// ============================================================================
// Web Worker that runs the physics simulation engine at 500ms intervals.
// Computes sensor values for 5000 nodes distributed across 11 zones.
// Posts updated sensor data to BrokerWorker after each tick.
// ============================================================================

import type {
  SensorNode,
  SensorType,
  DivisionId,
  TemperatureParams,
  ElectricalParams,
  WaterTankParams,
  SeismicParams,
  StatusFlags,
  BIMMetadata,
} from '../types/index';

import {
  simulateTemperature,
  simulateElectricalLoad,
  simulateWaterTank,
  simulateSeismic,
} from './physics-models';

// === Worker Message Types ===

interface StartMessage {
  type: 'START';
  interval: number;
}

interface StopMessage {
  type: 'STOP';
}

interface UpdateParamsMessage {
  type: 'UPDATE_PARAMS';
  zone: string;
  params: Partial<TemperatureParams | ElectricalParams>;
}

type IncomingMessage = StartMessage | StopMessage | UpdateParamsMessage;

interface SensorUpdateMessage {
  type: 'SENSOR_UPDATE';
  data: SensorNode[];
}

// === Zone Configuration ===

interface ZoneConfig {
  zone: string;
  division: DivisionId;
  nodeCount: number;
  sensorTypes: SensorType[];
}

const ZONE_CONFIGS: ZoneConfig[] = [
  { zone: 'zone-a', division: 1, nodeCount: 200, sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'TEMPERATURE'] },
  { zone: 'zone-b', division: 2, nodeCount: 500, sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'VIBRATION'] },
  { zone: 'zone-c', division: 3, nodeCount: 400, sensorTypes: ['VIBRATION', 'PIR_MOTION'] },
  { zone: 'zone-d', division: 4, nodeCount: 600, sensorTypes: ['ELECTRICAL_LOAD', 'VOLTAGE', 'POWER_FACTOR'] },
  { zone: 'zone-e', division: 5, nodeCount: 800, sensorTypes: ['TEMPERATURE', 'HUMIDITY', 'CO2', 'PRESSURE'] },
  { zone: 'zone-f', division: 6, nodeCount: 700, sensorTypes: ['SMOKE', 'HEAT', 'TEMPERATURE'] },
  { zone: 'zone-g', division: 7, nodeCount: 500, sensorTypes: ['WATER_LEVEL', 'FLOW_RATE', 'PH'] },
  { zone: 'zone-h', division: 8, nodeCount: 200, sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'TEMPERATURE'] },
  { zone: 'zone-i', division: 9, nodeCount: 300, sensorTypes: ['PIR_MOTION', 'TEMPERATURE'] },
  { zone: 'zone-j', division: 10, nodeCount: 300, sensorTypes: ['VIBRATION', 'PIR_MOTION'] }, // virtual network nodes
  { zone: 'zone-k', division: 11, nodeCount: 500, sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT'] },
];

// === Simulation State ===

let intervalId: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;
let sensorNodes: SensorNode[] = [];

// Per-zone simulation parameters (can be updated via UPDATE_PARAMS)
const zoneTemperatureParams: Map<string, TemperatureParams> = new Map();
const zoneElectricalParams: Map<string, ElectricalParams> = new Map();
const zoneWaterTankParams: Map<string, WaterTankParams> = new Map();
const zoneSeismicParams: Map<string, SeismicParams> = new Map();

// === Initialization ===

function generateDefaultMetadata(zone: string, sensorType: SensorType): BIMMetadata {
  const vendors = ['Honeywell', 'Siemens', 'Johnson Controls', 'Schneider Electric', 'ABB'];
  const vendorIndex = (zone.charCodeAt(zone.length - 1) + sensorType.length) % vendors.length;

  const isoMap: Record<string, string> = {
    TEMPERATURE: 'ISO 16484-5 §3.2.1', HUMIDITY: 'ISO 16484-5 §3.2.2',
    CO2: 'ISO 16484-5 §3.2.3', ELECTRICAL_LOAD: 'IEC 61850-7-4',
    VOLTAGE: 'IEC 60364-5-52', POWER_FACTOR: 'ISO 52120-1 §6',
    WATER_LEVEL: 'ISO 30500 §4.2', FLOW_RATE: 'ISO 4064-1',
    PH: 'ISO 10523', PIR_MOTION: 'IEC 62443-2-1 §6',
    DOOR_CONTACT: 'NFPA 3000 §7.4', VIBRATION: 'ISO 10816-1',
    SMOKE: 'NFPA 72 §17.7', HEAT: 'NFPA 72 §17.6',
    SEISMIC: 'ISO 31000 §6.4',
  };

  const critMap: Record<string, BIMMetadata['criticalityLevel']> = {
    SMOKE: 'CRITICAL', HEAT: 'CRITICAL', SEISMIC: 'CRITICAL',
    ELECTRICAL_LOAD: 'HIGH', VOLTAGE: 'HIGH', DOOR_CONTACT: 'HIGH',
    TEMPERATURE: 'MEDIUM', HUMIDITY: 'MEDIUM', CO2: 'MEDIUM',
    WATER_LEVEL: 'MEDIUM', PIR_MOTION: 'MEDIUM',
    FLOW_RATE: 'LOW', PH: 'LOW', POWER_FACTOR: 'LOW', VIBRATION: 'LOW',
  };

  const intervals: Record<string, number> = {
    SMOKE: 30, HEAT: 30, SEISMIC: 30, ELECTRICAL_LOAD: 60, VOLTAGE: 60,
    TEMPERATURE: 90, HUMIDITY: 90, CO2: 90, DOOR_CONTACT: 60,
    WATER_LEVEL: 90, FLOW_RATE: 120, PH: 120, VIBRATION: 60,
    PIR_MOTION: 180, POWER_FACTOR: 120,
  };

  return {
    vendor: vendors[vendorIndex] as string,
    installDate: `2024-${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`,
    maintenanceInterval: intervals[sensorType] ?? 90,
    criticalityLevel: critMap[sensorType] ?? 'MEDIUM',
    isoReference: isoMap[sensorType] ?? 'ISO 16484-5',
  };
}

// ═══════════════════════════════════════════════════════════════════
// REALISTIC SENSOR PLACEMENT ENGINE
// ═══════════════════════════════════════════════════════════════════
// Each sensor type has a specific architectural rule:
//   DOOR_CONTACT  → at doorways on walls (edges of rooms)
//   PIR_MOTION    → ceiling corners (~ceiling height, near wall)
//   SMOKE/HEAT    → ceiling center (fire sensors go on ceiling mid-span)
//   TEMPERATURE   → wall-mounted ~1.5m height
//   VIBRATION     → fence line (perimeter) or structural base
//   ELECTRICAL_LOAD/VOLTAGE/POWER_FACTOR → panel rooms (clustered)
//   WATER_LEVEL   → tank/pipe locations (grouped)
//   CO2/HUMIDITY/PRESSURE → wall or ceiling, spread across rooms
//   SEISMIC       → foundation/basement level (y near 0)
// ═══════════════════════════════════════════════════════════════════

// Building geometry constants (must match HologramBuilding.tsx)
const FLOOR_H_PHYS   = 5;   // floor height in physics units
const FLOOR_SLAB_Y   = 0.1; // slab thickness
const CEILING_OFFSET = 0.25; // sensors near ceiling

// Room grid for a building block: returns candidate positions
interface RoomGrid {
  cx: number; cz: number;    // building center
  hw: number; hd: number;    // half-width / half-depth
  floors: number;
}

const BUILDING_ROOMS: Record<string, RoomGrid> = {
  // Main Hall
  'main':   { cx: 0,    cz: 0,   hw: 20,  hd: 12, floors: 6 },
  // Wing A
  'wing-a': { cx: -34,  cz: -5,  hw: 10,  hd: 9,  floors: 5 },
  // Wing B
  'wing-b': { cx:  34,  cz: -5,  hw: 10,  hd: 9,  floors: 5 },
  // Annex
  'annex':  { cx: 0,    cz: 22,  hw: 8,   hd: 6,  floors: 3 },
  // Perimeter (exterior)
  'perim':  { cx: 0,    cz: 0,   hw: 60,  hd: 42, floors: 1 },
};

const ZONE_ROOM: Record<string, string> = {
  'zone-a': 'main',   'zone-b': 'main',   'zone-j': 'main',   'zone-k': 'main',
  'zone-d': 'wing-a', 'zone-e': 'wing-a',
  'zone-f': 'wing-b', 'zone-g': 'wing-b',
  'zone-h': 'annex',  'zone-i': 'annex',
  'zone-c': 'perim',
};

function seededRand(seed: number): number {
  // Simple deterministic pseudo-random (LCG) — same seed → same position
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function generatePosition(zone: string, index: number, sensorType: SensorType): [number, number, number] {
  const roomKey = ZONE_ROOM[zone] ?? 'main';
  const room    = BUILDING_ROOMS[roomKey] ?? BUILDING_ROOMS['main']!;
  const { cx, cz, hw, hd, floors } = room;

  const seed1 = index * 13 + zone.charCodeAt(0) * 7;
  const seed2 = index * 17 + zone.charCodeAt(zone.length - 1) * 11;
  const seed3 = index * 23 + sensorType.length * 3;

  // Which floor this sensor lives on
  const floor = Math.floor(seededRand(seed1 + 500) * floors);
  const floorBase = floor * FLOOR_H_PHYS + FLOOR_SLAB_Y;
  const ceilingY  = floorBase + FLOOR_H_PHYS - CEILING_OFFSET;

  let x: number, y: number, z: number;

  switch (sensorType) {
    // ── Door contact: placed on walls at door-frame positions ──────────────
    case 'DOOR_CONTACT': {
      // Doors are on the edges of rooms (walls), not floating in middle
      // Randomly pick a wall side and a position along that wall
      const side = Math.floor(seededRand(seed1) * 4); // 0=N,1=S,2=E,3=W
      const t    = seededRand(seed2) * 0.8 + 0.1; // 10-90% along wall
      const doorH = floorBase + 1.1; // door handle height
      if (side === 0)      { x = cx - hw + hd * 2 * t - hd; z = cz - hd + 0.2; }
      else if (side === 1) { x = cx - hw + hd * 2 * t - hd; z = cz + hd - 0.2; }
      else if (side === 2) { x = cx + hw - 0.2; z = cz - hd + hd * 2 * t; }
      else                 { x = cx - hw + 0.2; z = cz - hd + hd * 2 * t; }
      y = doorH;
      break;
    }

    // ── PIR motion: ceiling corners / wall-ceiling junction ───────────────
    case 'PIR_MOTION': {
      // PIR cameras go in ceiling corners of rooms
      const roomW = (hw * 2) / 3;  // divide building into 3 rooms wide
      const roomD = (hd * 2) / 2;  // and 2 rooms deep
      const ri = index % 6; // 6 corner positions per floor
      const cornerX = cx - hw + roomW * (ri % 3) + 0.8;
      const cornerZ = cz - hd + roomD * Math.floor(ri / 3) + 0.8;
      x = cornerX + (seededRand(seed2) - 0.5) * 1.5;
      z = cornerZ + (seededRand(seed3) - 0.5) * 1.5;
      y = ceilingY; // near ceiling
      break;
    }

    // ── Smoke / heat detectors: ceiling, distributed across room spans ─────
    case 'SMOKE':
    case 'HEAT': {
      // Fire detectors: ceiling mount, evenly distributed
      const gridCols = Math.max(2, Math.floor(hw * 2 / 6));
      const gridRows = Math.max(2, Math.floor(hd * 2 / 6));
      const col = index % gridCols;
      const row = Math.floor(index / gridCols) % gridRows;
      x = cx - hw + (col + 0.5) * (hw * 2 / gridCols) + (seededRand(seed1) - 0.5) * 0.5;
      z = cz - hd + (row + 0.5) * (hd * 2 / gridRows) + (seededRand(seed2) - 0.5) * 0.5;
      y = ceilingY;
      break;
    }

    // ── Temperature / Humidity / CO2: wall-mounted ~1.5m above floor ──────
    case 'TEMPERATURE':
    case 'HUMIDITY':
    case 'CO2':
    case 'PRESSURE': {
      const side    = Math.floor(seededRand(seed1) * 4);
      const t       = seededRand(seed2) * 0.7 + 0.15;
      const wallH   = floorBase + 1.5;
      if (side === 0)      { x = cx - hw + hw * 2 * t; z = cz - hd + 0.25; }
      else if (side === 1) { x = cx - hw + hw * 2 * t; z = cz + hd - 0.25; }
      else if (side === 2) { x = cx + hw - 0.25; z = cz - hd + hd * 2 * t; }
      else                 { x = cx - hw + 0.25; z = cz - hd + hd * 2 * t; }
      y = wallH;
      break;
    }

    // ── Electrical sensors: grouped in panel room (one corner area) ───────
    case 'ELECTRICAL_LOAD':
    case 'VOLTAGE':
    case 'POWER_FACTOR': {
      // Panel room is in one corner of the electrical zone
      const panelX = cx - hw + 3;
      const panelZ = cz - hd + 3;
      const col    = index % 8;
      const row    = Math.floor(index / 8) % 6;
      const floorE = Math.floor(index / 48) % floors;
      x = panelX + col * 1.8 + (seededRand(seed1) - 0.5) * 0.3;
      z = panelZ + row * 1.8 + (seededRand(seed2) - 0.5) * 0.3;
      y = floorE * FLOOR_H_PHYS + 1.2; // panels at ~1.2m height (eye level)
      break;
    }

    // ── Water sensors: grouped along pipe routes ──────────────────────────
    case 'WATER_LEVEL':
    case 'FLOW_RATE':
    case 'PH': {
      // Pipes run along the edges of the building
      const pipeRoutes = [
        { axis: 'x', base: cz - hd + 1.5, from: cx - hw + 1, to: cx + hw - 1 },
        { axis: 'z', base: cx - hw + 1.5, from: cz - hd + 1, to: cz + hd - 1 },
      ];
      const route  = pipeRoutes[index % 2]!;
      const t2     = seededRand(seed1);
      const floorP = Math.floor(seededRand(seed3) * floors);
      const pipeY  = floorP * FLOOR_H_PHYS + 0.4; // low on wall (pipe level)
      if (route.axis === 'x') {
        x = route.from + t2 * (route.to - route.from);
        z = route.base + (seededRand(seed2) - 0.5) * 0.3;
      } else {
        x = route.base + (seededRand(seed2) - 0.5) * 0.3;
        z = route.from + t2 * (route.to - route.from);
      }
      y = pipeY;
      break;
    }

    // ── Vibration: fence line and structural bases ────────────────────────
    case 'VIBRATION': {
      if (roomKey === 'perim') {
        // On fence perimeter
        const fW = 60, fD = 42;
        const perimeter_length = 2 * (fW + fD);
        const pos = (index / 400) * perimeter_length;
        if      (pos < fW)              { x = cx - fW + pos;      z = cz - fD; y = 2.0; }
        else if (pos < fW + fD)         { x = cx + fW;             z = cz - fD + (pos - fW); y = 2.0; }
        else if (pos < 2 * fW + fD)     { x = cx + fW - (pos - fW - fD); z = cz + fD; y = 2.0; }
        else                            { x = cx - fW;             z = cz + fD - (pos - 2*fW - fD); y = 2.0; }
        x += (seededRand(seed1) - 0.5) * 0.5;
        z += (seededRand(seed2) - 0.5) * 0.5;
      } else {
        // Structural vibration: at column bases
        const cols2 = 4; const colX = [-hw+2, -hw/2, hw/2, hw-2];
        x = cx + (colX[index % cols2] ?? 0) + (seededRand(seed1) - 0.5) * 0.3;
        z = cz + ((index % 3) - 1) * hd/1.5 + (seededRand(seed2) - 0.5) * 0.3;
        y = Math.floor(seededRand(seed3) * floors) * FLOOR_H_PHYS + 0.3;
      }
      break;
    }

    // ── Seismic: ground level / foundation ───────────────────────────────
    case 'SEISMIC': {
      x = cx + (seededRand(seed1) * 2 - 1) * (hw - 1);
      z = cz + (seededRand(seed2) * 2 - 1) * (hd - 1);
      y = 0.15; // at ground / foundation level
      break;
    }

    // ── Default: spread across floors ────────────────────────────────────
    default: {
      x = cx + (seededRand(seed1) * 2 - 1) * (hw - 1);
      z = cz + (seededRand(seed2) * 2 - 1) * (hd - 1);
      y = floorBase + 1.5;
      break;
    }
  }

  // Perimeter zone: vibration along fence, others scattered outside
  if (zone === 'zone-c' && sensorType !== 'VIBRATION') {
    const t = seededRand(seed1);
    const r = 48 + seededRand(seed2) * 14;
    x = Math.cos(t * Math.PI * 2) * r;
    z = Math.sin(t * Math.PI * 2) * r * 0.7;
    y = 0.5 + seededRand(seed3) * 2;
  }

  return [
    Math.round(x * 10) / 10,
    Math.round(Math.max(0.1, y) * 10) / 10,
    Math.round(z * 10) / 10,
  ];
}

function initializeSensorNodes(): void {
  sensorNodes = [];

  for (const config of ZONE_CONFIGS) {
    // Initialize default params for this zone
    zoneTemperatureParams.set(config.zone, {
      ambientTemp: 30,   // Indonesian tropical ambient: 28-33°C
      occupancy: 50,
      hvacCooling: 3,    // Stronger cooling needed for tropical climate
      kCoefficient: 0.1,
    });

    zoneElectricalParams.set(config.zone, {
      baseLoad: 5000,      // Watts
      amplitude: 500,
      frequency: 0.01,     // 50 Hz PLN
      noiseLevel: 100,
    });

    zoneWaterTankParams.set(config.zone, {
      currentLevel: 50,
      inflowRate: 10,
      outflowRate: 8,
      tankArea: 20,
    });

    zoneSeismicParams.set(config.zone, {
      currentValue: 0,
      stepSize: 0.05,
      spikeProbability: 0.01,
      spikeAmplitude: 3,
    });

    for (let i = 0; i < config.nodeCount; i++) {
      const sensorType = config.sensorTypes[i % config.sensorTypes.length] as SensorType;
      const defaultFlags: StatusFlags = {
        inAlarm: false,
        fault: false,
        overridden: false,
        outOfService: false,
      };

      const node: SensorNode = {
        id: `${config.zone}-${sensorType.toLowerCase()}-${String(i).padStart(4, '0')}`,
        objectName: `${config.zone.toUpperCase()}_${sensorType}_${String(i).padStart(4, '0')}`,
        objectType: sensorType,
        presentValue: getInitialValue(sensorType),
        statusFlags: defaultFlags,
        zone: config.zone,
        position: generatePosition(config.zone, i, sensorType),
        division: config.division,
        metadata: generateDefaultMetadata(config.zone, sensorType),
      };

      sensorNodes.push(node);
    }
  }

  // Verify total is 5000
  if (sensorNodes.length !== 5000) {
    // This should never happen given the config, but guard against it
    console.warn(`[PhysicsWorker] Expected 5000 nodes, got ${String(sensorNodes.length)}`);
  }
}

function getInitialValue(sensorType: SensorType): number {
  switch (sensorType) {
    case 'TEMPERATURE':
      return 22 + Math.random() * 4; // 22-26°C
    case 'HUMIDITY':
      return 40 + Math.random() * 20; // 40-60%
    case 'CO2':
      return 400 + Math.random() * 200; // 400-600 ppm
    case 'PRESSURE':
      return 1013 + Math.random() * 10; // ~1013 hPa
    case 'ELECTRICAL_LOAD':
      return 4000 + Math.random() * 2000; // 4000-6000 W
    case 'VOLTAGE':
      return 220 + Math.random() * 10; // 220-230 V
    case 'POWER_FACTOR':
      return 0.85 + Math.random() * 0.1; // 0.85-0.95
    case 'WATER_LEVEL':
      return 40 + Math.random() * 30; // 40-70%
    case 'FLOW_RATE':
      return 5 + Math.random() * 10; // 5-15 L/min
    case 'PH':
      return 6.5 + Math.random() * 1.5; // 6.5-8.0
    case 'PIR_MOTION':
      return Math.random() > 0.7 ? 1 : 0; // Binary: 0 or 1
    case 'DOOR_CONTACT':
      return Math.random() > 0.9 ? 1 : 0; // Mostly closed (0)
    case 'VIBRATION':
      return Math.random() * 2; // 0-2 mm/s
    case 'SMOKE':
      return Math.random() * 5; // 0-5% obscuration
    case 'HEAT':
      return 20 + Math.random() * 10; // 20-30°C
    case 'SEISMIC':
      return Math.random() * 0.5; // 0-0.5 magnitude
  }
}

// === Simulation Tick ===

function simulateTick(): void {
  tickCount++;
  const t = tickCount * 0.5; // Time in seconds (500ms per tick)

  for (const node of sensorNodes) {
    node.presentValue = computeNodeValue(node, t);
    node.statusFlags = computeStatusFlags(node);
  }

  // Post updated data to main thread / BrokerWorker
  const message: SensorUpdateMessage = {
    type: 'SENSOR_UPDATE',
    data: sensorNodes,
  };

  self.postMessage(message);
}

function computeNodeValue(node: SensorNode, t: number): number {
  const zone = node.zone;

  switch (node.objectType) {
    case 'TEMPERATURE':
    case 'HEAT': {
      const params = zoneTemperatureParams.get(zone);
      if (!params) return node.presentValue;
      const dT = simulateTemperature(node.presentValue, params);
      return node.presentValue + dT;
    }

    case 'ELECTRICAL_LOAD':
    case 'VOLTAGE':
    case 'POWER_FACTOR': {
      const params = zoneElectricalParams.get(zone);
      if (!params) return node.presentValue;
      if (node.objectType === 'VOLTAGE') {
        // Voltage varies around 220V with small amplitude
        return simulateElectricalLoad(
          { baseLoad: 220, amplitude: 5, frequency: 0.01, noiseLevel: 2 }, // PLN 220V nominal
          t
        );
      }
      if (node.objectType === 'POWER_FACTOR') {
        // Power factor varies around 0.9 with tiny amplitude
        return simulateElectricalLoad(
          { baseLoad: 0.9, amplitude: 0.05, frequency: params.frequency * 0.5, noiseLevel: 0.02 },
          t
        );
      }
      return simulateElectricalLoad(params, t);
    }

    case 'WATER_LEVEL': {
      const params = zoneWaterTankParams.get(zone);
      if (!params) return node.presentValue;
      const updatedParams: WaterTankParams = { ...params, currentLevel: node.presentValue };
      const newLevel = simulateWaterTank(updatedParams, 0.5); // dt = 0.5s
      // Clamp between 0 and 100
      return Math.max(0, Math.min(100, newLevel));
    }

    case 'FLOW_RATE': {
      // Flow rate fluctuates around a base value
      const base = 10;
      return base + Math.sin(t * 0.1) * 3 + (Math.random() - 0.5) * 2;
    }

    case 'PH': {
      // pH stays relatively stable with small drift
      const drift = (Math.random() - 0.5) * 0.02;
      return Math.max(6.0, Math.min(8.5, node.presentValue + drift));
    }

    case 'HUMIDITY': {
      // Humidity varies slowly
      const drift = (Math.random() - 0.5) * 0.5;
      return Math.max(20, Math.min(80, node.presentValue + drift));
    }

    case 'CO2': {
      // CO2 varies with occupancy
      const drift = (Math.random() - 0.5) * 5;
      return Math.max(350, Math.min(1500, node.presentValue + drift));
    }

    case 'PRESSURE': {
      // Atmospheric pressure varies slowly
      const drift = (Math.random() - 0.5) * 0.2;
      return Math.max(990, Math.min(1040, node.presentValue + drift));
    }

    case 'SEISMIC':
    case 'VIBRATION': {
      const params = zoneSeismicParams.get(zone);
      if (!params) return node.presentValue;
      const updatedParams: SeismicParams = { ...params, currentValue: node.presentValue };
      return simulateSeismic(updatedParams);
    }

    case 'PIR_MOTION': {
      // Binary sensor: random activation
      return Math.random() > 0.8 ? 1 : 0;
    }

    case 'DOOR_CONTACT': {
      // Binary sensor: mostly closed, occasional open
      return Math.random() > 0.95 ? 1 : 0;
    }

    case 'SMOKE': {
      // Smoke level: normally very low
      const drift = (Math.random() - 0.5) * 0.1;
      return Math.max(0, Math.min(100, node.presentValue + drift));
    }
  }
}

function computeStatusFlags(node: SensorNode): StatusFlags {
  const flags: StatusFlags = {
    inAlarm: false,
    fault: false,
    overridden: node.statusFlags.overridden,
    outOfService: node.statusFlags.outOfService,
  };

  // Set alarm thresholds based on sensor type
  switch (node.objectType) {
    case 'TEMPERATURE':
      flags.inAlarm = node.presentValue > 40 || node.presentValue < 10;
      break;
    case 'HUMIDITY':
      flags.inAlarm = node.presentValue > 75 || node.presentValue < 25;
      break;
    case 'CO2':
      flags.inAlarm = node.presentValue > 1000;
      break;
    case 'ELECTRICAL_LOAD':
      flags.inAlarm = node.presentValue > 9000;
      break;
    case 'VOLTAGE':
      flags.inAlarm = node.presentValue < 198 || node.presentValue > 242; // PLN 220V ±10%
      break;
    case 'WATER_LEVEL':
      flags.inAlarm = node.presentValue < 10 || node.presentValue > 90;
      break;
    case 'SMOKE':
      flags.inAlarm = node.presentValue > 10;
      break;
    case 'HEAT':
      flags.inAlarm = node.presentValue > 60;
      break;
    case 'SEISMIC':
    case 'VIBRATION':
      flags.inAlarm = Math.abs(node.presentValue) > 5;
      break;
    case 'PH':
      flags.inAlarm = node.presentValue < 6.0 || node.presentValue > 8.5;
      break;
    default:
      break;
  }

  return flags;
}

// === Worker Message Handler ===

self.onmessage = (event: MessageEvent<IncomingMessage>): void => {
  const message = event.data;

  switch (message.type) {
    case 'START': {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      tickCount = 0;
      initializeSensorNodes();
      const interval = message.interval > 0 ? message.interval : 500;
      intervalId = setInterval(simulateTick, interval);
      break;
    }

    case 'STOP': {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
    }

    case 'UPDATE_PARAMS': {
      const { zone, params } = message;
      // Merge params into existing zone params
      if ('kCoefficient' in params || 'ambientTemp' in params || 'hvacCooling' in params || 'occupancy' in params) {
        const existing = zoneTemperatureParams.get(zone);
        if (existing) {
          zoneTemperatureParams.set(zone, { ...existing, ...params });
        }
      }
      if ('baseLoad' in params || 'amplitude' in params || 'frequency' in params || 'noiseLevel' in params) {
        const existing = zoneElectricalParams.get(zone);
        if (existing) {
          zoneElectricalParams.set(zone, { ...existing, ...params });
        }
      }
      break;
    }
  }
};

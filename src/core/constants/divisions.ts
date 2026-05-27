// ============================================================================
// NFCC Digital Twin - Division Configuration Constants
// ============================================================================

import type { DivisionConfig } from '../types';

export const DIVISIONS: DivisionConfig[] = [
  {
    id: 1,
    name: 'Command Center',
    icon: '🎖️',
    sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'TEMPERATURE'],
    color: '#FFD700', // Gold
  },
  {
    id: 2,
    name: 'Internal Security',
    icon: '🛡️',
    sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'VIBRATION'],
    color: '#FF4444', // Red
  },
  {
    id: 3,
    name: 'Perimeter Defense',
    icon: '🏰',
    sensorTypes: ['VIBRATION', 'PIR_MOTION'],
    color: '#FF8C00', // Dark Orange
  },
  {
    id: 4,
    name: 'Electrical',
    icon: '⚡',
    sensorTypes: ['ELECTRICAL_LOAD', 'VOLTAGE', 'POWER_FACTOR'],
    color: '#FFFF00', // Yellow
  },
  {
    id: 5,
    name: 'HVAC',
    icon: '❄️',
    sensorTypes: ['TEMPERATURE', 'HUMIDITY', 'CO2', 'PRESSURE'],
    color: '#00BFFF', // Deep Sky Blue
  },
  {
    id: 6,
    name: 'Fire & Safety',
    icon: '🔥',
    sensorTypes: ['SMOKE', 'HEAT', 'TEMPERATURE'],
    color: '#FF6347', // Tomato
  },
  {
    id: 7,
    name: 'Plumbing',
    icon: '💧',
    sensorTypes: ['WATER_LEVEL', 'FLOW_RATE', 'PH'],
    color: '#1E90FF', // Dodger Blue
  },
  {
    id: 8,
    name: 'Medical',
    icon: '🏥',
    sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'TEMPERATURE'],
    color: '#00FF7F', // Spring Green
  },
  {
    id: 9,
    name: 'Logistics',
    icon: '📦',
    sensorTypes: ['PIR_MOTION', 'TEMPERATURE'],
    color: '#DDA0DD', // Plum
  },
  {
    id: 10,
    name: 'CyberOps',
    icon: '💻',
    sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT', 'VIBRATION'],
    color: '#00FF00', // Lime Green
  },
  {
    id: 11,
    name: 'Crisis Communication',
    icon: '📡',
    sensorTypes: ['PIR_MOTION', 'DOOR_CONTACT'],
    color: '#9370DB', // Medium Purple
  },
];

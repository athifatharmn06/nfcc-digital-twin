// ============================================================================
// NFCC Digital Twin - SensorNodes Unit Tests
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  updateSensorBuffer,
  getPositionBuffer,
  getColorBuffer,
  getScaleBuffer,
  getActiveNodeCount,
} from './SensorNodes.tsx';
import type { SensorNode } from '../core/types/index.ts';

function makeSensorNode(overrides: Partial<SensorNode> = {}): SensorNode {
  return {
    id: 'test-node-1',
    objectName: 'Temperature Sensor',
    objectType: 'TEMPERATURE',
    presentValue: 25.0,
    statusFlags: {
      inAlarm: false,
      fault: false,
      overridden: false,
      outOfService: false,
    },
    zone: 'zone-a',
    position: [10, 20, 30],
    division: 1,
    metadata: {
      vendor: 'TestVendor',
      installDate: '2024-01-01',
      maintenanceInterval: 90,
      criticalityLevel: 'MEDIUM',
      isoReference: 'ISO-16484',
    },
    ...overrides,
  };
}

describe('SensorNodes - updateSensorBuffer', () => {
  beforeEach(() => {
    // Reset buffers by writing empty data
    updateSensorBuffer([]);
  });

  it('writes position data to the position buffer', () => {
    const node = makeSensorNode({ position: [5, 10, 15] });
    updateSensorBuffer([node]);

    const pos = getPositionBuffer();
    expect(pos[0]).toBe(5);
    expect(pos[1]).toBe(10);
    expect(pos[2]).toBe(15);
  });

  it('sets activeNodeCount correctly', () => {
    const nodes = [makeSensorNode(), makeSensorNode({ id: 'node-2' })];
    updateSensorBuffer(nodes);
    expect(getActiveNodeCount()).toBe(2);
  });

  it('maps NORMAL status to cyan color (0, 0.9, 0.9)', () => {
    const node = makeSensorNode({
      statusFlags: { inAlarm: false, fault: false, overridden: false, outOfService: false },
    });
    updateSensorBuffer([node]);

    const color = getColorBuffer();
    expect(color[0]).toBe(0);
    expect(color[1]).toBeCloseTo(0.9);
    expect(color[2]).toBeCloseTo(0.9);
  });

  it('maps IN_ALARM status to red color (1, 0, 0)', () => {
    const node = makeSensorNode({
      statusFlags: { inAlarm: true, fault: false, overridden: false, outOfService: false },
    });
    updateSensorBuffer([node]);

    const color = getColorBuffer();
    expect(color[0]).toBe(1);
    expect(color[1]).toBe(0);
    expect(color[2]).toBe(0);
  });

  it('maps FAULT status to yellow color (1, 1, 0)', () => {
    const node = makeSensorNode({
      statusFlags: { inAlarm: false, fault: true, overridden: false, outOfService: false },
    });
    updateSensorBuffer([node]);

    const color = getColorBuffer();
    expect(color[0]).toBe(1);
    expect(color[1]).toBe(1);
    expect(color[2]).toBe(0);
  });

  it('maps OVERRIDDEN status to purple color (0.7, 0, 1)', () => {
    const node = makeSensorNode({
      statusFlags: { inAlarm: false, fault: false, overridden: true, outOfService: false },
    });
    updateSensorBuffer([node]);

    const color = getColorBuffer();
    expect(color[0]).toBeCloseTo(0.7);
    expect(color[1]).toBe(0);
    expect(color[2]).toBe(1);
  });

  it('prioritizes inAlarm over fault and overridden', () => {
    const node = makeSensorNode({
      statusFlags: { inAlarm: true, fault: true, overridden: true, outOfService: false },
    });
    updateSensorBuffer([node]);

    const color = getColorBuffer();
    // Should be red (inAlarm takes priority)
    expect(color[0]).toBe(1);
    expect(color[1]).toBe(0);
    expect(color[2]).toBe(0);
  });

  it('prioritizes fault over overridden', () => {
    const node = makeSensorNode({
      statusFlags: { inAlarm: false, fault: true, overridden: true, outOfService: false },
    });
    updateSensorBuffer([node]);

    const color = getColorBuffer();
    // Should be yellow (fault takes priority over overridden)
    expect(color[0]).toBe(1);
    expect(color[1]).toBe(1);
    expect(color[2]).toBe(0);
  });

  it('sets scale to 1.5 for alarm nodes and 1.0 for normal', () => {
    const normalNode = makeSensorNode({ id: 'normal' });
    const alarmNode = makeSensorNode({
      id: 'alarm',
      statusFlags: { inAlarm: true, fault: false, overridden: false, outOfService: false },
    });
    updateSensorBuffer([normalNode, alarmNode]);

    const scale = getScaleBuffer();
    expect(scale[0]).toBe(1.0);
    expect(scale[1]).toBe(1.5);
  });

  it('caps at 5000 nodes maximum', () => {
    const nodes: SensorNode[] = [];
    for (let i = 0; i < 6000; i++) {
      nodes.push(makeSensorNode({ id: `node-${i}`, position: [i, i, i] }));
    }
    updateSensorBuffer(nodes);
    expect(getActiveNodeCount()).toBe(5000);
  });
});

// ============================================================================
// NFCC Digital Twin — SensorNodes (InstancedMesh)
// ============================================================================
// 5000 nodes, color-coded by SENSOR TYPE (not just alarm status).
// Hover shows a detailed BIM metadata tooltip.
// Status overrides type color: alarm=red, fault=yellow, overridden=purple.
// ============================================================================

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SensorNode } from '../core/types/index.ts';

const MAX_NODES     = 5000;
const SPHERE_RADIUS = 0.28;

// Float32Array buffers — never in React state
const positionBuffer = new Float32Array(MAX_NODES * 3);
const colorBuffer    = new Float32Array(MAX_NODES * 3);
const scaleBuffer    = new Float32Array(MAX_NODES);
let   activeNodeCount = 0;

// Metadata cache for hover tooltip (refreshed every physics tick)
const nodeDataCache: (SensorNode | undefined)[] = new Array(MAX_NODES);

// ── Type-based colors (dimmed 75% when normal so alarms stand out) ──────────
const TYPE_RGB: Record<string, [number, number, number]> = {
  TEMPERATURE:     [1.00, 0.55, 0.10],  // amber
  HUMIDITY:        [0.20, 0.65, 1.00],  // sky blue
  CO2:             [0.10, 0.90, 0.65],  // teal
  PRESSURE:        [0.55, 0.40, 1.00],  // lavender
  ELECTRICAL_LOAD: [1.00, 0.95, 0.10],  // bright yellow
  VOLTAGE:         [1.00, 0.80, 0.00],  // orange-yellow
  POWER_FACTOR:    [0.90, 0.70, 0.00],  // gold
  WATER_LEVEL:     [0.10, 0.40, 1.00],  // deep blue
  FLOW_RATE:       [0.00, 0.75, 1.00],  // cyan
  PH:              [0.60, 0.20, 1.00],  // violet
  PIR_MOTION:      [0.20, 1.00, 0.30],  // green
  DOOR_CONTACT:    [0.80, 0.10, 1.00],  // purple
  VIBRATION:       [1.00, 0.50, 0.00],  // orange
  SMOKE:           [1.00, 0.35, 0.10],  // red-orange
  HEAT:            [1.00, 0.20, 0.00],  // hot red
  SEISMIC:         [0.90, 0.90, 1.00],  // near-white
};
const FALLBACK_RGB: [number, number, number] = [0.00, 0.85, 1.00]; // cyan

function writeNodeColor(
  index: number,
  inAlarm: boolean,
  fault: boolean,
  overridden: boolean,
  objectType: string,
): void {
  const off = index * 3;
  let r: number, g: number, b: number;

  if (inAlarm) {
    [r, g, b] = [1.0, 0.0, 0.0];          // bright red
  } else if (fault) {
    [r, g, b] = [1.0, 1.0, 0.0];          // yellow
  } else if (overridden) {
    [r, g, b] = [0.7, 0.0, 1.0];          // purple
  } else {
    const [tr, tg, tb] = TYPE_RGB[objectType] ?? FALLBACK_RGB;
    r = tr * 0.75; g = tg * 0.75; b = tb * 0.75; // dim normal nodes
  }

  colorBuffer[off]     = r;
  colorBuffer[off + 1] = g;
  colorBuffer[off + 2] = b;
}

// ── Public write API ─────────────────────────────────────────────────────────
export function updateSensorBuffer(data: SensorNode[]): void {
  const count = Math.min(data.length, MAX_NODES);
  activeNodeCount = count;

  for (let i = 0; i < count; i++) {
    const node    = data[i]!;
    const posOff  = i * 3;
    const { inAlarm, fault } = node.statusFlags;

    positionBuffer[posOff]     = node.position[0];
    positionBuffer[posOff + 1] = node.position[1];
    positionBuffer[posOff + 2] = node.position[2];

    scaleBuffer[i] =
      inAlarm ? 2.2 :
      fault   ? 1.6 :
      node.metadata.criticalityLevel === 'CRITICAL' ? 1.15 :
      node.metadata.criticalityLevel === 'HIGH'     ? 1.05 : 0.72;

    writeNodeColor(i, inAlarm, fault, node.statusFlags.overridden, node.objectType);

    nodeDataCache[i] = node;
  }
}

// Test exports
export const getPositionBuffer  = (): Float32Array            => positionBuffer;
export const getColorBuffer     = (): Float32Array            => colorBuffer;
export const getScaleBuffer     = (): Float32Array            => scaleBuffer;
export const getActiveNodeCount = (): number                  => activeNodeCount;
export const getNodeAt          = (i: number): SensorNode | undefined => nodeDataCache[i];

// ── Hover info type ──────────────────────────────────────────────────────────
export interface NodeHoverInfo {
  node: SensorNode;
  x: number;
  y: number;
}

// ── Component ────────────────────────────────────────────────────────────────
interface SensorNodesProps {
  onNodeClick?: (nodeIndex: number) => void;
  onNodeHover?: (info: NodeHoverInfo | null) => void;
}

export function SensorNodes({ onNodeClick, onNodeHover }: SensorNodesProps): React.JSX.Element {
  const meshRef   = useRef<THREE.InstancedMesh>(null);
  const dummy     = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const lastHoverMs = useRef(0);

  useFrame(() => {
    const mesh  = meshRef.current;
    if (!mesh) return;
    const count = activeNodeCount;

    for (let i = 0; i < count; i++) {
      const off = i * 3;
      dummy.position.set(positionBuffer[off]!, positionBuffer[off + 1]!, positionBuffer[off + 2]!);
      const s = scaleBuffer[i]!;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      tempColor.setRGB(colorBuffer[off]!, colorBuffer[off + 1]!, colorBuffer[off + 2]!);
      mesh.setColorAt(i, tempColor);
    }

    if (count < MAX_NODES) {
      dummy.scale.set(0, 0, 0);
      dummy.position.set(0, -9999, 0);
      dummy.updateMatrix();
      for (let i = count; i < MAX_NODES; i++) mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (onNodeClick && event.instanceId !== undefined) {
      event.stopPropagation();
      onNodeClick(event.instanceId);
    }
  }, [onNodeClick]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const now = Date.now();
    if (now - lastHoverMs.current < 50) return; // throttle to ~20fps
    lastHoverMs.current = now;
    if (onNodeHover && event.instanceId !== undefined) {
      const node = nodeDataCache[event.instanceId];
      if (node) onNodeHover({ node, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
    }
  }, [onNodeHover]);

  const handlePointerOut = useCallback(() => { onNodeHover?.(null); }, [onNodeHover]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_NODES]}
      onClick={handleClick}
      onPointerMove={onNodeHover ? handlePointerMove : undefined}
      onPointerOut={onNodeHover  ? handlePointerOut  : undefined}
      frustumCulled={false}
    >
      <sphereGeometry args={[SPHERE_RADIUS, 6, 6]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default SensorNodes;

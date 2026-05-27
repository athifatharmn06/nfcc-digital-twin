// ============================================================================
// NFCC — DronePatrol  (realistic patrol pattern)
// ============================================================================
// 4 small UAVs patrolling independently.
// Each drone uses a LISSAJOUS-style path (not simple circle) so they never
// crowd together and move in different random-looking directions.
// Scale reduced to 0.45× the original.
// ============================================================================

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { JSX } from 'react';

// ── Drone configs ─────────────────────────────────────────────────────────────
// Each drone has independent Lissajous parameters so their paths never overlap.
// rx/rz = X/Z radii, ry = vertical bob amplitude,
// freqX/freqZ = angular freq multipliers (create figure-8 / oval / random paths)
// phase = initial time offset so they start spread out

interface DroneConfig {
  id:      number;
  rx:      number;   // x orbit radius
  rz:      number;   // z orbit radius
  ry:      number;   // vertical bob amplitude
  height:  number;   // base altitude
  freqX:   number;   // x freq
  freqZ:   number;   // z freq
  freqY:   number;   // bob freq
  speed:   number;   // time multiplier
  phase:   number;   // initial time offset
  color:   string;
  status:  'PATROLLING' | 'RETURNING' | 'ALERT';
}

const DRONES: DroneConfig[] = [
  // UAV-01: wide ellipse N→S, opposite direction, high
  {
    id: 1, rx: 58, rz: 35, ry: 3, height: 28,
    freqX: 1.0, freqZ: 1.0, freqY: 2.3,
    speed: 0.18, phase: 0,
    color: '#06b6d4', status: 'PATROLLING',
  },
  // UAV-02: tighter figure-8 going E→W, lower
  {
    id: 2, rx: 42, rz: 55, ry: 2, height: 22,
    freqX: 2.0, freqZ: 1.0, freqY: 3.1,
    speed: 0.22, phase: Math.PI * 0.67,
    color: '#06b6d4', status: 'PATROLLING',
  },
  // UAV-03: large diagonal sweep, returning (amber)
  {
    id: 3, rx: 65, rz: 48, ry: 4, height: 18,
    freqX: 1.0, freqZ: 2.0, freqY: 1.7,
    speed: -0.14, phase: Math.PI * 1.3,   // negative speed = reverse direction
    color: '#f59e0b', status: 'RETURNING',
  },
  // UAV-04: far perimeter, very wide, slow
  {
    id: 4, rx: 72, rz: 62, ry: 5, height: 32,
    freqX: 3.0, freqZ: 2.0, freqY: 2.7,
    speed: 0.13, phase: Math.PI * 1.9,
    color: '#06b6d4', status: 'PATROLLING',
  },
];

// ── Shared geometry (all drones reuse same geo) ───────────────────────────────
function useDroneGeometry(): {
  bodyEdge: THREE.EdgesGeometry;
  armEdge:  THREE.EdgesGeometry;
  bladeEdge:THREE.EdgesGeometry;
  legEdge:  THREE.EdgesGeometry;
} {
  return useMemo(() => {
    const bodyGeo  = new THREE.BoxGeometry(0.55, 0.14, 0.34);
    const armGeo   = new THREE.BoxGeometry(1.5,  0.07, 0.07);
    const bladeGeo = new THREE.BoxGeometry(0.65, 0.015, 0.07);
    const legGeo   = new THREE.CylinderGeometry(0.025, 0.025, 0.26, 4);
    return {
      bodyEdge:  new THREE.EdgesGeometry(bodyGeo),
      armEdge:   new THREE.EdgesGeometry(armGeo),
      bladeEdge: new THREE.EdgesGeometry(bladeGeo),
      legEdge:   new THREE.EdgesGeometry(legGeo),
    };
  }, []);
}

// ── Single drone ──────────────────────────────────────────────────────────────
function Drone({ cfg }: { cfg: DroneConfig }): JSX.Element {
  const groupRef    = useRef<THREE.Group>(null);
  const prop0Ref    = useRef<THREE.Group>(null);
  const prop1Ref    = useRef<THREE.Group>(null);
  const prop2Ref    = useRef<THREE.Group>(null);
  const prop3Ref    = useRef<THREE.Group>(null);
  const timeRef     = useRef(cfg.phase);

  const geo = useDroneGeometry();
  const c   = cfg.color;
  const propRefs = [prop0Ref, prop1Ref, prop2Ref, prop3Ref];

  // Propeller arm offsets (body-local)
  const propPos: [number, number, number][] = [
    [-0.7,  0.09,  0.32],
    [ 0.7,  0.09,  0.32],
    [-0.7,  0.09, -0.32],
    [ 0.7,  0.09, -0.32],
  ];

  useFrame((_, dt) => {
    timeRef.current += cfg.speed * dt;
    const t = timeRef.current;

    // Lissajous position
    const x = Math.cos(cfg.freqX * t) * cfg.rx;
    const z = Math.sin(cfg.freqZ * t) * cfg.rz;
    const y = cfg.height + Math.sin(cfg.freqY * t) * cfg.ry;

    // Velocity direction (derivative) for yaw orientation
    const dx = -cfg.freqX * Math.sin(cfg.freqX * t) * cfg.rx * cfg.speed;
    const dz =  cfg.freqZ * Math.cos(cfg.freqZ * t) * cfg.rz * cfg.speed;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      if (Math.abs(dx) + Math.abs(dz) > 0.001) {
        groupRef.current.rotation.y = Math.atan2(dx, dz);
      }
      // Slight banking tilt based on lateral velocity
      groupRef.current.rotation.z = -Math.sign(cfg.speed) * Math.atan2(dz, 8) * 0.4;
    }

    // Spin propellers
    const spinSpeed = cfg.status === 'RETURNING' ? 14 : 22;
    propRefs.forEach((r) => {
      if (r.current) r.current.rotation.y += spinSpeed * dt;
    });
  });

  const lineOpacity   = 0.80;
  const bladeOpacity  = 0.70;
  const navColor = cfg.status === 'RETURNING' ? '#f59e0b' : '#10b981';

  return (
    <group ref={groupRef}>
      {/* Body */}
      <lineSegments geometry={geo.bodyEdge}>
        <lineBasicMaterial color={c} transparent opacity={lineOpacity} />
      </lineSegments>

      {/* Cross arms (× pattern) */}
      <group rotation={[0, 0, 0]}>
        <lineSegments geometry={geo.armEdge}>
          <lineBasicMaterial color={c} transparent opacity={0.55} />
        </lineSegments>
      </group>
      <group rotation={[0, Math.PI / 2, 0]}>
        <lineSegments geometry={geo.armEdge}>
          <lineBasicMaterial color={c} transparent opacity={0.55} />
        </lineSegments>
      </group>

      {/* Propellers (4 corners) */}
      {propPos.map((pos, i) => (
        <group key={i} ref={propRefs[i]} position={pos}>
          <lineSegments geometry={geo.bladeEdge}>
            <lineBasicMaterial color="#e0f0ff" transparent opacity={bladeOpacity} />
          </lineSegments>
          <lineSegments geometry={geo.bladeEdge} rotation={[0, Math.PI / 2, 0]}>
            <lineBasicMaterial color="#e0f0ff" transparent opacity={bladeOpacity} />
          </lineSegments>
        </group>
      ))}

      {/* Landing legs */}
      {([-0.22, 0.22] as number[]).map((dx, i) => (
        <group key={i} position={[dx, -0.17, 0]}>
          <lineSegments geometry={geo.legEdge}>
            <lineBasicMaterial color={c} transparent opacity={0.40} />
          </lineSegments>
        </group>
      ))}

      {/* Nav light */}
      <mesh position={[0, 0, 0.18]}>
        <sphereGeometry args={[0.05, 5, 5]} />
        <meshBasicMaterial color={navColor} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function DronePatrol(): JSX.Element {
  return (
    <group>
      {DRONES.map((cfg) => (
        <Drone key={cfg.id} cfg={cfg} />
      ))}
    </group>
  );
}

export default DronePatrol;

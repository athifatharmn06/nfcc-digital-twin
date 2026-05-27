// ============================================================================
// NFCC — HologramBuilding  (Realistic X-Ray Architecture)
// ============================================================================
// Multi-wing fortified complex. Uses EdgesGeometry — clean box edges only,
// no diagonal wireframe triangles. Interior room partitions are visible
// through the glass walls, making it look like a real building.
//
// Architecture:
//   Main Hall (center):   6 floors, command room on top
//   Wing A (NW):          5 floors, admin/electrical
//   Wing B (NE):          5 floors, ops/fire
//   Annex (rear):         3 floors, servers/medical
//   Stairwell cores:      visible as darker towers
//   Perimeter:            fence + 4 guard towers
// ============================================================================

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { JSX } from 'react';

// ── Palette ──────────────────────────────────────────────────────────────────
const E_BRIGHT  = '#06b6d4';  // bright cyan structural edges  → bloom
const E_MID     = '#0a4a5a';  // secondary edges
const E_DIM     = '#03202a';  // cage / fence ghost
const E_ROOM    = '#082030';  // interior partition walls (very dim)
const WALL_FILL = '#010c16';  // X-ray glass fill

// ── Helpers ──────────────────────────────────────────────────────────────────

function useEdgeBox(w: number, h: number, d: number): THREE.EdgesGeometry {
  const box  = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
  const edge = useMemo(() => new THREE.EdgesGeometry(box),   [box]);
  return edge;
}

function EdgeBox({ w, h, d, color = E_MID, opacity = 0.40 }: {
  w: number; h: number; d: number; color?: string; opacity?: number;
}): JSX.Element {
  const edge = useEdgeBox(w, h, d);
  return (
    <lineSegments geometry={edge} position={[0, h/2, 0]}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

function GlassFill({ w, h, d, opacity = 0.04 }: { w: number; h: number; d: number; opacity?: number }): JSX.Element {
  const geo = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
  return (
    <mesh geometry={geo} position={[0, h/2, 0]}>
      <meshBasicMaterial color={WALL_FILL} transparent opacity={opacity} depthWrite={false} side={THREE.FrontSide} />
    </mesh>
  );
}

function FloorSlab({ w, d, y, color = E_MID, opacity = 0.20 }: {
  w: number; d: number; y: number; color?: string; opacity?: number;
}): JSX.Element {
  const geo  = useMemo(() => new THREE.PlaneGeometry(w - 0.5, d - 0.5), [w, d]);
  const edge = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  return (
    <group position={[0, y, 0]} rotation={[-Math.PI/2, 0, 0]}>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.25} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edge}>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineSegments>
    </group>
  );
}

// Partition wall using lineSegments (not <line> which conflicts with SVG) ──────
function PartitionWall({ x1, z1, x2, z2, y, h, color = E_ROOM, opacity = 0.18 }: {
  x1: number; z1: number; x2: number; z2: number; y: number; h: number;
  color?: string; opacity?: number;
}): JSX.Element {
  const geo = useMemo(() => {
    const verts = new Float32Array([
      x1, y,   z1,
      x1, y+h, z1,
      x1, y+h, z1,
      x2, y+h, z2,
      x2, y+h, z2,
      x2, y,   z2,
      x2, y,   z2,
      x1, y,   z1,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    return g;
  }, [x1,z1,x2,z2,y,h]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

// Corner column ────────────────────────────────────────────────────────────────
function Column({ cx, cz, h, bright = false }: { cx: number; cz: number; h: number; bright?: boolean }): JSX.Element {
  const cg = useMemo(() => new THREE.BoxGeometry(0.45, h, 0.45), [h]);
  const ce = useMemo(() => new THREE.EdgesGeometry(cg), [cg]);
  return (
    <group position={[cx, h/2, cz]}>
      <lineSegments geometry={ce}>
        <lineBasicMaterial color={bright ? E_BRIGHT : E_MID} transparent opacity={bright ? 0.85 : 0.40} />
      </lineSegments>
    </group>
  );
}

// Stairwell core ───────────────────────────────────────────────────────────────
function StairCore({ px, pz, h }: { px: number; pz: number; h: number }): JSX.Element {
  const cg = useMemo(() => new THREE.BoxGeometry(3.5, h, 3.5), [h]);
  const ce = useMemo(() => new THREE.EdgesGeometry(cg), [cg]);
  return (
    <group position={[px, h/2, pz]}>
      <mesh geometry={cg}>
        <meshBasicMaterial color="#030c14" transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <lineSegments geometry={ce}>
        <lineBasicMaterial color={E_MID} transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
}

// ── Full Building Block with interior rooms ───────────────────────────────────
function BuildingBlock({ w, h, d, px, pz, floors, accent = false, showRooms = false }: {
  w: number; h: number; d: number;
  px: number; pz: number;
  floors: number;
  accent?: boolean;
  showRooms?: boolean;
}): JSX.Element {
  const FLOOR_H = h / floors;
  const hw = w / 2 - 0.3;
  const hd = d / 2 - 0.3;
  const edgeColor  = accent ? E_BRIGHT : E_MID;
  const edgeOpacity = accent ? 0.72 : 0.38;

  return (
    <group position={[px, 0, pz]}>
      {/* Glass fill */}
      <GlassFill w={w} h={h} d={d} opacity={accent ? 0.07 : 0.04} />

      {/* Structural cage */}
      <EdgeBox w={w} h={h} d={d} color={edgeColor} opacity={edgeOpacity} />

      {/* Floor slabs */}
      {Array.from({ length: floors + 1 }, (_, i) => (
        <FloorSlab key={i} w={w} d={d} y={i * FLOOR_H}
          color={accent ? E_BRIGHT : E_MID}
          opacity={i === 0 || i === floors ? 0.35 : 0.18}
        />
      ))}

      {/* Corner columns */}
      <Column cx={-hw} cz={-hd} h={h} bright={accent} />
      <Column cx={ hw} cz={-hd} h={h} bright={accent} />
      <Column cx={-hw} cz={ hd} h={h} bright={accent} />
      <Column cx={ hw} cz={ hd} h={h} bright={accent} />

      {/* Interior room partitions (visible through glass) */}
      {showRooms && Array.from({ length: floors }, (_, fi) => {
        const fy = fi * FLOOR_H;
        const rh = FLOOR_H - 0.2;
        return (
          <group key={fi}>
            {/* Corridor wall parallel to X axis */}
            <PartitionWall x1={-hw} z1={0} x2={hw} z2={0} y={fy} h={rh} />
            {/* Room dividers perpendicular (Z axis) */}
            <PartitionWall x1={-w/6} z1={-hd} x2={-w/6} z2={0}    y={fy} h={rh} />
            <PartitionWall x1={ w/6} z1={-hd} x2={ w/6} z2={0}    y={fy} h={rh} />
            <PartitionWall x1={-w/6} z1={ 0}  x2={-w/6} z2={hd}   y={fy} h={rh} />
            <PartitionWall x1={ w/6} z1={ 0}  x2={ w/6} z2={hd}   y={fy} h={rh} />
          </group>
        );
      })}

      {/* Stairwell cores at corners (main hall) */}
      {accent && (
        <>
          <StairCore px={-hw + 2.5} pz={-hd + 2.5} h={h} />
          <StairCore px={ hw - 2.5} pz={-hd + 2.5} h={h} />
        </>
      )}

      {/* Top equipment/antenna base on accent building */}
      {accent && (
        <group position={[0, h, 0]}>
          <EdgeBox w={8} h={1.5} d={6} color={E_BRIGHT} opacity={0.50} />
          {/* Parapet rails */}
          <FloorSlab w={w} d={d} y={0.2} color={E_BRIGHT} opacity={0.45} />
        </group>
      )}
    </group>
  );
}

// Sky bridge ──────────────────────────────────────────────────────────────────
function SkyBridge({ fromX, toX, z, y, width = 4 }: {
  fromX: number; toX: number; z: number; y: number; width?: number;
}): JSX.Element {
  const len  = Math.abs(toX - fromX);
  const cx   = (fromX + toX) / 2;
  const dGeo = useMemo(() => new THREE.BoxGeometry(len, 0.3, width), [len, width]);
  const dEdg = useMemo(() => new THREE.EdgesGeometry(dGeo), [dGeo]);
  const rGeo = useMemo(() => new THREE.BoxGeometry(len, 2.8, 0.1), [len]);
  const rEdg = useMemo(() => new THREE.EdgesGeometry(rGeo), [rGeo]);
  return (
    <group position={[cx, y, z]}>
      <mesh geometry={dGeo}><meshBasicMaterial color={WALL_FILL} transparent opacity={0.10} depthWrite={false} /></mesh>
      <lineSegments geometry={dEdg}><lineBasicMaterial color={E_BRIGHT} transparent opacity={0.50} /></lineSegments>
      {[-width/2 + 0.2, width/2 - 0.2].map((dz, i) => (
        <group key={i} position={[0, 1.4, dz]}>
          <lineSegments geometry={rEdg}><lineBasicMaterial color={E_MID} transparent opacity={0.28} /></lineSegments>
        </group>
      ))}
    </group>
  );
}

// Perimeter fence ─────────────────────────────────────────────────────────────
function Perimeter(): JSX.Element {
  const W = 128, H = 5, D = 90;
  const fGeo  = useMemo(() => new THREE.BoxGeometry(W, H, D), []);
  const fEdge = useMemo(() => new THREE.EdgesGeometry(fGeo),  [fGeo]);
  const rGeo  = useMemo(() => new THREE.BoxGeometry(W, 0.15, D), []);
  const rEdge = useMemo(() => new THREE.EdgesGeometry(rGeo),  [rGeo]);
  const tGeo  = useMemo(() => new THREE.BoxGeometry(3.2, 20, 3.2), []);
  const tEdge = useMemo(() => new THREE.EdgesGeometry(tGeo),  [tGeo]);
  const dGeo  = useMemo(() => new THREE.BoxGeometry(5, 0.15, 5), []);
  const dEdge = useMemo(() => new THREE.EdgesGeometry(dGeo),  [dGeo]);
  const gGeo  = useMemo(() => new THREE.PlaneGeometry(W, D, 22, 15), []);
  const gEdge = useMemo(() => new THREE.EdgesGeometry(gGeo),  [gGeo]);

  const towers: [number, number][] = [
    [-W/2+2,  D/2-2], [ W/2-2,  D/2-2],
    [-W/2+2, -D/2+2], [ W/2-2, -D/2+2],
  ];

  return (
    <group>
      {/* Fence cage */}
      <group position={[0, H/2, 0]}>
        <lineSegments geometry={fEdge}><lineBasicMaterial color={E_DIM} transparent opacity={0.22} /></lineSegments>
      </group>
      {/* Top rail */}
      <group position={[0, H, 0]}>
        <lineSegments geometry={rEdge}><lineBasicMaterial color={E_MID} transparent opacity={0.35} /></lineSegments>
      </group>
      {/* Guard towers */}
      {towers.map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <group position={[0, 10, 0]}>
            <mesh geometry={tGeo}><meshBasicMaterial color={WALL_FILL} transparent opacity={0.12} depthWrite={false} /></mesh>
            <lineSegments geometry={tEdge}><lineBasicMaterial color={E_BRIGHT} transparent opacity={0.70} /></lineSegments>
          </group>
          <group position={[0, 20.1, 0]}>
            <lineSegments geometry={dEdge}><lineBasicMaterial color={E_BRIGHT} transparent opacity={0.80} /></lineSegments>
          </group>
          {/* Beacon */}
          <mesh position={[0, 21.2, 0]}>
            <sphereGeometry args={[0.28, 6, 6]} />
            <meshBasicMaterial color={E_BRIGHT} transparent opacity={0.95} />
          </mesh>
          {/* Searchlight base */}
          <mesh position={[0, 20.5, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.6, 6]} />
            <meshBasicMaterial color={WALL_FILL} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
      {/* Ground grid */}
      <group rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <lineSegments geometry={gEdge}><lineBasicMaterial color={E_DIM} transparent opacity={0.07} /></lineSegments>
      </group>
    </group>
  );
}

// Radar dish ──────────────────────────────────────────────────────────────────
function Radar(): JSX.Element {
  const ref  = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.55; });
  const dGeo = useMemo(() => new THREE.ConeGeometry(4.2, 2.8, 8, 1, true), []);
  const dEdg = useMemo(() => new THREE.EdgesGeometry(dGeo), [dGeo]);
  const mGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.2, 3, 5), []);
  const mEdg = useMemo(() => new THREE.EdgesGeometry(mGeo), [mGeo]);
  return (
    <group ref={ref} position={[0, 31.7, 0]}>
      <lineSegments geometry={dEdg}><lineBasicMaterial color={E_BRIGHT} transparent opacity={0.75} /></lineSegments>
      <group position={[0, -1.4, 0]}>
        <lineSegments geometry={mEdg}><lineBasicMaterial color={E_BRIGHT} transparent opacity={0.55} /></lineSegments>
      </group>
    </group>
  );
}

// Antenna ─────────────────────────────────────────────────────────────────────
function Antenna({ h, x, baseY, pz }: { h: number; x: number; baseY: number; pz: number }): JSX.Element {
  const geo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.07, h, 4), [h]);
  const edg = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  return (
    <group position={[x, baseY + h/2, pz]}>
      <lineSegments geometry={edg}><lineBasicMaterial color={E_MID} transparent opacity={0.55} /></lineSegments>
    </group>
  );
}

// CCTV camera bracket (visible at wall edges) ─────────────────────────────────
function CCTV({ px, py, pz }: { px: number; py: number; pz: number }): JSX.Element {
  const bGeo = useMemo(() => new THREE.BoxGeometry(0.3, 0.2, 0.6), []);
  const bEdg = useMemo(() => new THREE.EdgesGeometry(bGeo), [bGeo]);
  return (
    <group position={[px, py, pz]}>
      <lineSegments geometry={bEdg}>
        <lineBasicMaterial color={E_BRIGHT} transparent opacity={0.65} />
      </lineSegments>
      {/* Bracket arm */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshBasicMaterial color={E_MID} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function HologramBuilding(): JSX.Element {
  // Building heights
  const MAIN_H  = 30;  // 6 floors × 5
  const WING_H  = 25;  // 5 floors × 5
  const ANNEX_H = 15;  // 3 floors × 5

  // CCTV positions on corners of main hall exterior
  const cctvPositions: [number, number, number][] = [
    [-20, MAIN_H - 1, -12.8], [ 20, MAIN_H - 1, -12.8],
    [-20, MAIN_H - 1,  12.8], [ 20, MAIN_H - 1,  12.8],
    [ 0,  MAIN_H - 1, -12.8], [ 0,  MAIN_H - 1,  12.8],
    [-20, 10, -12.8], [ 20, 10, -12.8],  // mid-floor cameras
  ];

  return (
    <group>
      {/* ── Main Command Hall (centre, 6 floors, with interior rooms) ── */}
      <BuildingBlock w={42} h={MAIN_H} d={26} px={0}   pz={0}  floors={6} accent showRooms />

      {/* ── Wing A (NW, 5 floors, admin rooms) ── */}
      <BuildingBlock w={22} h={WING_H}  d={20} px={-34} pz={-5} floors={5} showRooms />

      {/* ── Wing B (NE, 5 floors, ops rooms) ── */}
      <BuildingBlock w={22} h={WING_H}  d={20} px={ 34} pz={-5} floors={5} showRooms />

      {/* ── Annex / Tech block (rear, 3 floors) ── */}
      <BuildingBlock w={18} h={ANNEX_H} d={14} px={0}   pz={22} floors={3} />

      {/* ── Sky bridges (floor 3 level = y=15) ── */}
      <SkyBridge fromX={-23} toX={-13} z={-3} y={15} width={4} />
      <SkyBridge fromX={ 13} toX={ 23} z={-3} y={15} width={4} />

      {/* ── Connection to annex ── */}
      <SkyBridge fromX={-4} toX={4} z={12} y={10} width={3.5} />

      {/* ── Perimeter + guard towers ── */}
      <Perimeter />

      {/* ── Radar on main hall roof ── */}
      <Radar />

      {/* ── Antenna arrays ── */}
      <Antenna h={5.5} x={0}    baseY={MAIN_H}  pz={0}    />
      <Antenna h={4.0} x={-3}   baseY={MAIN_H}  pz={0}    />
      <Antenna h={3.5} x={ 3}   baseY={MAIN_H}  pz={0}    />
      <Antenna h={4.5} x={-34}  baseY={WING_H}  pz={-5}   />
      <Antenna h={3.5} x={ 34}  baseY={WING_H}  pz={-5}   />
      <Antenna h={3.0} x={0}    baseY={ANNEX_H} pz={22}   />

      {/* ── CCTV cameras on main hall exterior corners ── */}
      {cctvPositions.map(([x, y, z], i) => (
        <CCTV key={i} px={x} py={y} pz={z} />
      ))}
    </group>
  );
}

export default HologramBuilding;

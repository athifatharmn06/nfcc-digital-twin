// ============================================================================
// NFCC Digital Twin - Camera Controller
// ============================================================================
// Provides manual orbit controls, auto-orbit mode (for demo), programmatic
// camera transitions, and zone-specific focus positions.
// ============================================================================

import { useRef, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useNFCCStore } from '../core/store/useNFCCStore';

// === Types ===

interface CameraControllerProps {
  /** Enable auto-orbit rotation around the building center */
  autoOrbit: boolean;
  /** Target position for programmatic camera transition [x, y, z] */
  targetPosition?: [number, number, number];
  /** Speed of auto-orbit rotation in radians per second */
  orbitSpeed?: number;
  /** Duration of programmatic transitions in seconds */
  transitionDuration?: number;
}

interface ZoneCameraPosition {
  position: [number, number, number];
  target: [number, number, number];
}

// === Zone Focus Positions ===
// Predefined camera positions for each zone/division.
// Positions are arranged around the building to give a clear view of each zone.

const ZONE_CAMERA_POSITIONS: Record<string, ZoneCameraPosition> = {
  'zone-a': { position: [0, 60, 80],    target: [0, 10, 0] },   // Main Hall top view
  'zone-b': { position: [40, 35, 60],   target: [0, 8, 0] },    // Internal Security
  'zone-c': { position: [90, 20, 0],    target: [0, 5, 0] },    // Perimeter
  'zone-d': { position: [-65, 35, 40],  target: [-32, 8, -3] }, // Wing A Electrical
  'zone-e': { position: [-65, 35, -40], target: [-32, 8, -3] }, // Wing A HVAC
  'zone-f': { position: [65, 35, -40],  target: [32, 8, -3] },  // Wing B Fire
  'zone-g': { position: [65, 35, 40],   target: [32, 8, -3] },  // Wing B Plumbing
  'zone-h': { position: [30, 30, 50],   target: [0, 5, 18] },   // Tech block Medical
  'zone-i': { position: [-30, 30, 50],  target: [0, 5, 18] },   // Tech block Logistics
  'zone-j': { position: [50, 50, 50],   target: [0, 10, 0] },   // CyberOps overview
  'zone-k': { position: [-50, 50, 50],  target: [0, 10, 0] },   // Crisis Comm overview
};

// Building center — slightly elevated to frame the mid-point of the tall main hall
const BUILDING_CENTER = new THREE.Vector3(0, 16, 0);

// Orbit: closer radius so buildings fill the frame, lower height for dramatic angle
const DEFAULT_ORBIT_RADIUS = 110;
const DEFAULT_ORBIT_HEIGHT  = 42;
const DEFAULT_ORBIT_SPEED   = 0.10; // radians per second
const DEFAULT_TRANSITION_DURATION = 1.5; // seconds

// === Component ===

type OrbitControlsRef = {
  target: THREE.Vector3;
  update: () => void;
  enabled: boolean;
};

export function CameraController({
  autoOrbit,
  targetPosition,
  orbitSpeed = DEFAULT_ORBIT_SPEED,
  transitionDuration = DEFAULT_TRANSITION_DURATION,
}: CameraControllerProps): React.JSX.Element {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsRef>(null);

  // Transition state
  const transitionRef = useRef({
    active: false,
    startPosition: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    elapsed: 0,
    duration: DEFAULT_TRANSITION_DURATION,
  });

  // Auto-orbit angle tracker
  const orbitAngleRef = useRef(0);

  // Read demo mode from store
  const isDemoMode = useNFCCStore((state) => state.isDemoMode);

  // Determine if auto-orbit should be active
  const shouldAutoOrbit = autoOrbit || isDemoMode;

  /**
   * Focus the camera on a specific zone by name.
   * Initiates a smooth programmatic transition to the zone's predefined camera position.
   */
  const focusOnZone = useCallback(
    (zone: string): void => {
      const zonePosition = ZONE_CAMERA_POSITIONS[zone];
      if (!zonePosition) {
        return;
      }

      const transition = transitionRef.current;
      transition.active = true;
      transition.startPosition.copy(camera.position);
      transition.endPosition.set(...zonePosition.position);
      transition.startTarget.copy(
        controlsRef.current?.target ?? BUILDING_CENTER
      );
      transition.endTarget.set(...zonePosition.target);
      transition.elapsed = 0;
      transition.duration = transitionDuration;
    },
    [camera, transitionDuration]
  );

  // Handle targetPosition prop changes for programmatic transitions
  useEffect(() => {
    if (targetPosition) {
      const transition = transitionRef.current;
      transition.active = true;
      transition.startPosition.copy(camera.position);
      transition.endPosition.set(...targetPosition);
      transition.startTarget.copy(
        controlsRef.current?.target ?? BUILDING_CENTER
      );
      transition.endTarget.copy(BUILDING_CENTER);
      transition.elapsed = 0;
      transition.duration = transitionDuration;
    }
  }, [targetPosition, camera, transitionDuration]);

  // Expose focusOnZone on the component instance via a global ref
  // This allows external code (demo mode, division selection) to call it
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__nfccCameraFocusOnZone =
      focusOnZone;
    return (): void => {
      delete (window as unknown as Record<string, unknown>)
        .__nfccCameraFocusOnZone;
    };
  }, [focusOnZone]);

  // Main animation frame loop
  useFrame((_state, delta) => {
    const transition = transitionRef.current;

    // Handle programmatic transitions
    if (transition.active) {
      transition.elapsed += delta;
      const progress = Math.min(transition.elapsed / transition.duration, 1);

      // Smooth easing (ease-in-out cubic)
      const eased = easeInOutCubic(progress);

      // Lerp camera position
      camera.position.lerpVectors(
        transition.startPosition,
        transition.endPosition,
        eased
      );

      // Lerp orbit controls target
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          transition.startTarget,
          transition.endTarget,
          eased
        );
        controlsRef.current.update();
      }

      // End transition
      if (progress >= 1) {
        transition.active = false;
      }

      return;
    }

    // Handle auto-orbit mode
    if (shouldAutoOrbit) {
      orbitAngleRef.current += orbitSpeed * delta;

      const x = Math.cos(orbitAngleRef.current) * DEFAULT_ORBIT_RADIUS;
      const z = Math.sin(orbitAngleRef.current) * DEFAULT_ORBIT_RADIUS;

      camera.position.set(x, DEFAULT_ORBIT_HEIGHT, z);

      if (controlsRef.current) {
        controlsRef.current.target.copy(BUILDING_CENTER);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef as React.RefObject<never>}
      enableDamping
      dampingFactor={0.05}
      minDistance={30}
      maxDistance={300}
      maxPolarAngle={Math.PI / 2.05}
      enabled={!shouldAutoOrbit && !transitionRef.current.active}
      target={[0, 10, 0]}
    />
  );
}

// === Utility Functions ===

/**
 * Cubic ease-in-out function for smooth transitions.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// === Exported Utilities ===

/**
 * Get the predefined camera position for a zone.
 * Returns undefined if the zone is not found.
 */
export function getZoneCameraPosition(
  zone: string
): ZoneCameraPosition | undefined {
  return ZONE_CAMERA_POSITIONS[zone];
}

/**
 * Get all available zone names that have predefined camera positions.
 */
export function getAvailableZones(): string[] {
  return Object.keys(ZONE_CAMERA_POSITIONS);
}

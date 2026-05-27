// ============================================================================
// NFCC — DemoController  (Cinematic full-coverage demo)
// ============================================================================
// ROOT FIX: iterate through DEMO_SCENES in ORDER so the scene index shown
// in the overlay always matches the action being performed.
// Previous bug: separate scenePtr counter mismatched DEMO_SCENES array
// (EMERGENCY at index 6 never shown, wrong scene displayed for every phase).
// ============================================================================

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNFCCStore } from '../../core/store/useNFCCStore';
import type { DivisionId } from '../../core/types/index';
import { DEMO_SCENES, setDemoSceneIndex } from './NexusDemoOverlay';

export interface DemoCameraControl {
  startOrbit:  () => void;
  stopOrbit:   () => void;
  focusOnZone: (zone: string) => void;
}

export interface DemoComplianceControl {
  show: () => void;
  hide: () => void;
}

interface DemoControllerProps {
  cameraControl?:     DemoCameraControl;
  complianceControl?: DemoComplianceControl;
}

const DIVISION_ZONES: Record<number, string> = {
  1:'zone-a', 2:'zone-b', 3:'zone-c', 4:'zone-d',  5:'zone-e',
  6:'zone-f', 7:'zone-g', 8:'zone-h', 9:'zone-i', 10:'zone-j', 11:'zone-k',
};

// Duration per scene type (seconds)
const T = {
  intro:      3.5,
  division:   3.5,
  emergency:  5.5,
  compliance: 4.0,
  outro:      2.5,
};

export function DemoController({ cameraControl, complianceControl }: DemoControllerProps): React.ReactNode {
  const isDemoMode = useNFCCStore((s) => s.isDemoMode);

  const tlRef         = useRef<gsap.core.Timeline | null>(null);
  const cameraRef     = useRef(cameraControl);
  const complianceRef = useRef(complianceControl);
  const urlCheckedRef = useRef(false);

  // Keep refs current without triggering re-renders
  cameraRef.current     = cameraControl;
  complianceRef.current = complianceControl;

  // URL param — once on mount
  useEffect(() => {
    if (urlCheckedRef.current) return;
    urlCheckedRef.current = true;
    if (new URLSearchParams(window.location.search).get('mode') === 'demo') {
      useNFCCStore.getState().setDemoMode(true);
    }
  }, []);

  // Demo lifecycle — ONLY depends on isDemoMode (boolean)
  useEffect(() => {
    if (!isDemoMode) {
      tlRef.current?.kill();
      tlRef.current = null;
      setDemoSceneIndex(0);
      // Reset orbit so user can control 3D again
      cameraRef.current?.stopOrbit();
      const em = useNFCCStore.getState().emergencyMode;
      if (em !== 'NORMAL') useNFCCStore.getState().transitionEmergency('NORMAL');
      return;
    }

    // Kill any previous timeline
    tlRef.current?.kill();

    const tl = gsap.timeline({
      onComplete: () => {
        // Ensure orbit is stopped so user can interact with 3D again
        cameraRef.current?.stopOrbit();
        useNFCCStore.getState().setDemoMode(false);
        setDemoSceneIndex(0);
        tlRef.current = null;
      },
    });

    tlRef.current = tl;

    // ── Iterate DEMO_SCENES in ORDER — each scene index == overlay scene index ──
    for (let i = 0; i < DEMO_SCENES.length; i++) {
      const scene = DEMO_SCENES[i]!;
      const capturedIdx = i;

      // Advance the overlay to this scene
      tl.call(() => setDemoSceneIndex(capturedIdx));

      switch (scene.phase) {

        case 'intro':
          tl.call(() => cameraRef.current?.startOrbit());
          tl.to({}, { duration: T.intro });
          tl.call(() => cameraRef.current?.stopOrbit());
          break;

        case 'division': {
          const divId        = scene.divisionId!;
          const zone         = DIVISION_ZONES[divId] ?? 'zone-a';
          const capturedDiv  = divId;
          const capturedZone = zone;

          tl.call(() => {
            useNFCCStore.getState().setActiveDivision(capturedDiv as DivisionId);
            cameraRef.current?.focusOnZone(capturedZone);
          });
          tl.to({}, { duration: T.division });
          break;
        }

        case 'emergency':
          tl.call(() => {
            useNFCCStore.getState().transitionEmergency('EVACUATION');
            useNFCCStore.getState().setActiveDivision(6 as DivisionId);
            cameraRef.current?.focusOnZone('zone-f');
          });
          tl.to({}, { duration: T.emergency });
          tl.call(() => {
            useNFCCStore.getState().transitionEmergency('NORMAL');
          });
          tl.to({}, { duration: 0.5 });
          break;

        case 'compliance':
          tl.call(() => {
            complianceRef.current?.show();
            useNFCCStore.getState().setActiveDivision(1 as DivisionId);
            cameraRef.current?.startOrbit();
          });
          tl.to({}, { duration: T.compliance });
          tl.call(() => {
            complianceRef.current?.hide();
            cameraRef.current?.stopOrbit();
          });
          break;

        case 'outro':
          // Slowly orbit one final time, then stop
          tl.call(() => cameraRef.current?.startOrbit());
          tl.to({}, { duration: T.outro });
          tl.call(() => cameraRef.current?.stopOrbit());
          break;
      }
    }

    return () => {
      tl.kill();
      tlRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]); // Only isDemoMode — all other values read via refs

  return null;
}

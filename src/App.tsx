// ============================================================================
// NFCC Digital Twin - Main Application
// ============================================================================
// Full integration: WorkerProvider → EmergencyEffects → AppLayout with
// DivisionSidebar, HeaderBar, NFCCScene, DivisionRouter, NexusDemoOverlay,
// DemoController, and ComplianceMatrix modal.
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { WorkerProvider } from './core/workers/WorkerProvider';
import { useEmergencyEffects } from './core/hooks/useEmergencyEffects';
import { useNFCCStore } from './core/store/useNFCCStore';
import { AppLayout, DivisionSidebar, HeaderBar } from './components/layout';
import { NFCCScene } from './three/NFCCScene';
import {
  CommandCenter,
  InternalSecurity,
  PerimeterDefense,
  Electrical,
  HVAC,
  FireSafety,
  Plumbing,
  Medical,
  Logistics,
  CyberOps,
  CrisisComm,
} from './components/divisions';
import { NexusDemoOverlay } from './components/demo/NexusDemoOverlay';
import { DemoController } from './components/demo/DemoController';
import { ComplianceMatrix } from './components/ui/ComplianceMatrix';
import type { DivisionId } from './core/types';
import type { DemoCameraControl, DemoComplianceControl } from './components/demo/DemoController';
import './App.css';

/**
 * Inner component that activates hooks requiring WorkerProvider context.
 */
function EmergencyEffectsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  useEmergencyEffects();
  return <>{children}</>;
}

/**
 * Routes to the correct division dashboard based on activeDivision from the store.
 */
function DivisionRouter(): React.JSX.Element {
  const activeDivision = useNFCCStore((state) => state.activeDivision);

  const divisionMap: Record<DivisionId, React.JSX.Element> = {
    1: <CommandCenter />,
    2: <InternalSecurity />,
    3: <PerimeterDefense />,
    4: <Electrical />,
    5: <HVAC />,
    6: <FireSafety />,
    7: <Plumbing />,
    8: <Medical />,
    9: <Logistics />,
    10: <CyberOps />,
    11: <CrisisComm />,
  };

  return divisionMap[activeDivision] ?? <CommandCenter />;
}

/**
 * Main application content (rendered inside WorkerProvider + EmergencyEffectsProvider).
 * Manages demo camera/compliance controls and compliance matrix modal state.
 */
function AppContent(): React.JSX.Element {
  const isDemoMode = useNFCCStore((state) => state.isDemoMode);
  const [showCompliance, setShowCompliance] = useState(false);

  // Wire the compliance ref to the real setter immediately (runs every render but that's fine)
  const setShowComplianceRef = useRef<(v: boolean) => void>(() => undefined);
  setShowComplianceRef.current = setShowCompliance;

  // Camera control for demo mode
  const [autoOrbit, setAutoOrbit] = useState(false);
  const setAutoOrbitRef = useRef(setAutoOrbit);
  setAutoOrbitRef.current = setAutoOrbit;

  // Stable refs — never recreated, so DemoController's useCallback stays stable
  const cameraControl = useRef<DemoCameraControl>({
    startOrbit:  (): void => setAutoOrbitRef.current(true),
    stopOrbit:   (): void => setAutoOrbitRef.current(false),
    focusOnZone: (zone: string): void => {
      setAutoOrbitRef.current(false);
      const fn = (window as unknown as Record<string, unknown>).__nfccCameraFocusOnZone;
      if (typeof fn === 'function') (fn as (z: string) => void)(zone);
    },
  }).current;

  const complianceControl = useRef<DemoComplianceControl>({
    show: (): void => setShowComplianceRef.current(true),
    hide: (): void => setShowComplianceRef.current(false),
  }).current;

  const handleComplianceClose = useCallback((): void => {
    setShowCompliance(false);
  }, []);

  return (
    <>
      <AppLayout
        sidebar={<DivisionSidebar />}
        header={<HeaderBar />}
        scene={<NFCCScene autoOrbit={autoOrbit} />}
        dashboard={<DivisionRouter />}
      />

      {/* Demo Mode Overlay */}
      <NexusDemoOverlay />

      {/* Demo Mode Controller (renders nothing, orchestrates timeline) */}
      <DemoController
        cameraControl={cameraControl}
        complianceControl={complianceControl}
      />

      {/* Compliance Matrix Modal */}
      {showCompliance && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-label="Compliance Matrix"
          aria-modal="true"
        >
          <div className="relative max-h-[80vh] max-w-4xl w-full overflow-y-auto rounded-lg border border-cyan-500/30 bg-black/90 p-6 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            {!isDemoMode && (
              <button
                onClick={handleComplianceClose}
                className="absolute top-4 right-4 rounded border border-cyan-500/40 bg-black/60 px-3 py-1 font-mono text-sm text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10"
                type="button"
                aria-label="Close compliance matrix"
              >
                ✕
              </button>
            )}
            <ComplianceMatrix />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Root App component. Wraps everything in WorkerProvider and EmergencyEffectsProvider.
 */
function App(): React.JSX.Element {
  return (
    <WorkerProvider>
      <EmergencyEffectsProvider>
        <AppContent />
      </EmergencyEffectsProvider>
    </WorkerProvider>
  );
}

export default App;

// ============================================================================
// NFCC — NFCCScene
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { HologramBuilding } from './HologramBuilding';
import { SensorNodes, type NodeHoverInfo } from './SensorNodes';
import { CameraController } from './CameraController';
import { DronePatrol } from './DronePatrol';
import { NodeTooltip } from './NodeTooltip';
import { NodeLegend } from './NodeLegend';

interface NFCCSceneProps {
  autoOrbit?: boolean;
  onNodeClick?: (nodeIndex: number) => void;
}

export function NFCCScene({ autoOrbit = false, onNodeClick }: NFCCSceneProps): React.JSX.Element {
  const [hoverInfo, setHoverInfo] = useState<NodeHoverInfo | null>(null);

  const handleHover = useCallback((info: NodeHoverInfo | null) => {
    setHoverInfo(info);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ fov: 42, position: [65, 40, 100], near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ backgroundColor: '#060c18', width: '100%', height: '100%' }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#060c18']} />
        <fog attach="fog" args={['#060c18', 160, 440]} />
        <ambientLight intensity={0.02} />

        <HologramBuilding />
        <SensorNodes onNodeClick={onNodeClick} onNodeHover={handleHover} />
        <DronePatrol />
        <CameraController autoOrbit={autoOrbit} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.18}
            luminanceSmoothing={0.38}
            intensity={0.95}
            mipmapBlur
            radius={0.60}
          />
        </EffectComposer>
      </Canvas>

      {/* Node hover tooltip (HTML overlay) */}
      {hoverInfo && (
        <NodeTooltip node={hoverInfo.node} x={hoverInfo.x} y={hoverInfo.y} />
      )}

      {/* Node legend (bottom-left overlay) */}
      <NodeLegend />
    </div>
  );
}

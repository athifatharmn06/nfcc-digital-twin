// ============================================================================
// Division 2 — Internal Security v2
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNFCCStore } from '../../../core/store/useNFCCStore';
import { useDivisionData } from '../../../core/hooks/useDivisionData';

interface IntrusionEvent {
  id: string; timestamp: number; zone: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

const ZONES = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D', 'Zone-E'];
const TYPES = ['PIR Trigger', 'Door Breach', 'Vibration Alert', 'Unauthorized Access', 'Tailgating'];
const SEVER_COLOR: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e' };
const SEVER_BG: Record<string, string>    = { LOW: 'rgba(16,185,129,0.07)', MEDIUM: 'rgba(245,158,11,0.07)', HIGH: 'rgba(244,63,94,0.07)' };

function rndEvent(): IntrusionEvent {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    zone: ZONES[Math.floor(Math.random() * ZONES.length)],
    type: TYPES[Math.floor(Math.random() * TYPES.length)],
    severity: (['LOW', 'MEDIUM', 'HIGH'] as const)[Math.floor(Math.random() * 3)],
  };
}

// Heatmap cell opacity — refreshed each tick
function mkHeatmap(): number[] { return Array.from({ length: 25 }, () => Math.random() * 0.75 + 0.05); }

const CAMERA_ZONES = ['CAM-01 Lobby', 'CAM-02 Wing A', 'CAM-03 Perimeter N', 'CAM-04 Server Rm'];

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function InternalSecurity(): React.JSX.Element {
  const { addNotification } = useNFCCStore();
  const { sendCommand }     = useDivisionData(2);
  const [heatmap, setHeatmap]   = useState(false);
  const [heatData, setHeatData] = useState<number[]>(mkHeatmap);
  const [anomaly, setAnomaly]   = useState(true);
  const [log, setLog]           = useState<IntrusionEvent[]>(() => Array.from({ length: 8 }, rndEvent));
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setLog((p) => [...p.slice(-19), rndEvent()]), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  useEffect(() => {
    const t = setInterval(() => setAnomaly(Math.random() > 0.3), 5000);
    return () => clearInterval(t);
  }, []);

  // Animate heatmap cells
  useEffect(() => {
    if (!heatmap) return;
    const t = setInterval(() => setHeatData(mkHeatmap()), 900);
    return () => clearInterval(t);
  }, [heatmap]);

  const handleMass = useCallback(() => {
    const msg = 'Security alert broadcast — heightened awareness required.';
    sendCommand('command/notification/mass', { message: msg, severity: 'WARNING', originDivision: 2 });
    addNotification({ id: `n-${Date.now()}`, type: 'WARNING', title: 'MASS NOTIFICATION', message: msg, division: 2, timestamp: Date.now() });
  }, [sendCommand, addNotification]);

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #FF4444' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 02</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Internal Security</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`dot ${anomaly ? 'dot-red animate-pulse' : 'dot-green'}`} />
            <span className="text-[13px] font-semibold" style={{ ...inter, color: anomaly ? '#f43f5e' : '#10b981' }}>
              {anomaly ? 'ANOMALY' : 'NOMINAL'}
            </span>
          </div>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* AI Heatmap + Anomaly + Mass Notif */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card">
            <div className="section-title-bar">AI Heatmap Overlay</div>
            <button onClick={() => setHeatmap(!heatmap)} className="btn-holo w-full mb-2 !text-[12px]"
              style={heatmap ? { borderColor: 'rgba(6,182,212,0.55)', color: '#06b6d4' } : {}}>
              {heatmap ? '● ACTIVE' : '○ INACTIVE'}
            </button>
            {heatmap ? (
              <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {heatData.map((op, i) => (
                  <div key={i} className="h-4 rounded-sm" style={{ background: `rgba(244,63,94,${op.toFixed(2)})`, transition: 'background 0.6s ease' }} />
                ))}
              </div>
            ) : (
              <p className="text-[12px]" style={{ ...inter, color: '#3a4f66' }}>Toggle to enable K-Means overlay</p>
            )}
          </div>
          <div className="glass-card space-y-2">
            <div className="section-title-bar">Anomaly Status</div>
            {anomaly ? (
              <div className="p-2 rounded" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.22)' }}>
                <div className="flex items-center gap-2">
                  <span className="dot dot-red animate-pulse shrink-0" />
                  <div style={{ minWidth: 0 }}>
                    <p className="text-[13px] font-semibold" style={{ ...inter, color: '#f43f5e' }}>Zone B — Active</p>
                    <p className="text-[11px]" style={{ ...mono, color: '#64748b' }}>Confidence: 87% · 12 PIR hits</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px]" style={{ ...inter, color: '#10b981' }}>All zones nominal</p>
            )}
          </div>
        </div>

        {/* Mass Notification — full width */}
        <button onClick={handleMass} className="btn-danger w-full !text-[12px] !py-2.5">
          ⚠ Broadcast Alert → All 11 Divisions
        </button>

        {/* Camera Feed Placeholder */}
        <div className="glass-card">
          <div className="section-title-bar">Camera Feed Monitor</div>
          <div className="grid grid-cols-2 gap-1.5">
            {CAMERA_ZONES.map((z, i) => (
              <div key={i} className="rounded flex flex-col items-center justify-center gap-1.5"
                style={{ height: '56px', background: 'rgba(4,8,16,0.8)', border: '1px solid rgba(6,182,212,0.10)' }}>
                <svg width="14" height="10" viewBox="0 0 20 14" fill="none"><rect x="0" y="2" width="14" height="10" rx="2" stroke="rgba(6,182,212,0.4)" strokeWidth="1.2" /><path d="M14 5l6-3v10l-6-3V5z" stroke="rgba(6,182,212,0.4)" strokeWidth="1.2" /></svg>
                <span className="text-[10px] text-center px-1" style={{ ...mono, color: '#3a4f66' }}>{z}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Intrusion Log */}
        <div className="glass-card">
          <div className="section-title-bar">Real-Time Intrusion Log</div>
          <div ref={logRef} className="overflow-y-auto" style={{ maxHeight: '180px' }}>
            <table>
              <colgroup>
                <col style={{ width: '60px' }} /><col style={{ width: '52px' }} /><col style={{ width: '52px' }} /><col />
              </colgroup>
              <tbody>
                {log.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: SEVER_BG[e.severity] }}>
                    <td className="py-1 text-[11px]" style={{ ...mono, color: '#475569' }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td className="py-1 text-[12px] font-semibold" style={{ ...mono, color: SEVER_COLOR[e.severity] }}>{e.severity}</td>
                    <td className="py-1 text-[12px]" style={{ ...mono, color: '#06b6d4' }}>{e.zone}</td>
                    <td className="py-1 text-[12px]" style={{ ...inter, color: '#94a3b8' }}>{e.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default InternalSecurity;


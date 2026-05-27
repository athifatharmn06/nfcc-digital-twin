// ============================================================================
// Division 6 — Fire Safety v2
// ============================================================================
import React, { useState } from 'react';
import { useNFCCStore } from '../../../core/store/useNFCCStore';

interface Detector  { id: string; type: 'SMOKE' | 'SPR'; zone: string; status: 'NORMAL' | 'TRIGGERED' | 'FAULT'; }
interface EvacRoute { id: string; name: string; status: 'CLEAR' | 'BLOCKED' | 'CONGESTED'; cap: number; load: number; estMinutes: number; }

const DET_ICON: Record<Detector['status'], string> = { NORMAL: '✅', TRIGGERED: '🔴', FAULT: '⚠️' };
const DET_BORDER: Record<Detector['status'], string> = { NORMAL: 'rgba(16,185,129,0.20)', TRIGGERED: 'rgba(244,63,94,0.30)', FAULT: 'rgba(245,158,11,0.22)' };
const DET_TEXT:   Record<Detector['status'], string> = { NORMAL: '#10b981', TRIGGERED: '#f43f5e', FAULT: '#f59e0b' };
const ROUTE_COLOR: Record<EvacRoute['status'], string> = { CLEAR: '#10b981', CONGESTED: '#f59e0b', BLOCKED: '#f43f5e' };
const ROUTE_DOT:   Record<EvacRoute['status'], string> = { CLEAR: 'dot-green', CONGESTED: 'dot-amber', BLOCKED: 'dot-red' };

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

// SVG floor plan floors
const FLOORS = ['B1', 'F1', 'F2', 'F3'];

export function FireSafety(): React.JSX.Element {
  const { transitionEmergency, addNotification } = useNFCCStore();
  const [alarm, setAlarm]   = useState(false);
  const [spread, setSpread] = useState(0);
  const [affectedFloor, setAffectedFloor] = useState('');

  const [detectors] = useState<Detector[]>([
    { id: 'SMK-001', type: 'SMOKE', zone: 'F1-A', status: 'NORMAL'    },
    { id: 'SMK-002', type: 'SMOKE', zone: 'F1-B', status: 'NORMAL'    },
    { id: 'SMK-003', type: 'SMOKE', zone: 'F2-A', status: 'TRIGGERED' },
    { id: 'SMK-004', type: 'SMOKE', zone: 'F2-B', status: 'NORMAL'    },
    { id: 'SPR-001', type: 'SPR',   zone: 'F1-A', status: 'NORMAL'    },
    { id: 'SPR-002', type: 'SPR',   zone: 'F1-B', status: 'NORMAL'    },
    { id: 'SPR-003', type: 'SPR',   zone: 'F2-A', status: 'TRIGGERED' },
    { id: 'SPR-004', type: 'SPR',   zone: 'F2-B', status: 'FAULT'     },
  ]);

  const [routes] = useState<EvacRoute[]>([
    { id: 'r1', name: 'Main Exit North',    status: 'CLEAR',     cap: 200, load: 45, estMinutes: 4  },
    { id: 'r2', name: 'Emergency Exit East',status: 'CLEAR',     cap: 100, load: 12, estMinutes: 3  },
    { id: 'r3', name: 'Stairwell B',        status: 'CONGESTED', cap: 80,  load: 72, estMinutes: 8  },
    { id: 'r4', name: 'Underground Tunnel', status: 'BLOCKED',   cap: 150, load: 0,  estMinutes: 0  },
  ]);

  const handleFire = (): void => {
    transitionEmergency('EVACUATION');
    setAlarm(true);
    setSpread(25);
    setAffectedFloor('F2');
    addNotification({ id: `n-${Date.now()}`, type: 'CRITICAL', title: 'FIRE SIMULATION TRIGGERED', message: 'Evacuation protocol initiated.', division: 6, timestamp: Date.now() });
    const iv = setInterval(() => {
      setSpread((p) => { if (p >= 80) { clearInterval(iv); return 80; } return p + 4; });
    }, 2000);
  };

  const spreadColor = spread > 70 ? '#f43f5e' : spread > 40 ? '#f97316' : '#f59e0b';

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #FF6347' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 06</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Fire Safety</h2>
          </div>
          <span className={`badge shrink-0 ${alarm ? 'badge-critical animate-pulse' : 'badge-ok'}`}>{alarm ? 'ALARM' : 'STANDBY'}</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* Detector grid with better icons */}
        <div className="glass-card">
          <div className="section-title-bar">Smoke & Sprinkler Status</div>
          <div className="grid grid-cols-4 gap-1.5">
            {detectors.map((d) => (
              <div key={d.id} className={`p-1.5 rounded text-center ${d.status === 'TRIGGERED' ? 'animate-pulse' : ''}`}
                style={{ background: 'rgba(10,20,40,0.6)', border: `1px solid ${DET_BORDER[d.status]}` }}>
                <p className="text-[14px]">{DET_ICON[d.status]}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ ...mono, color: '#94a3b8' }}>{d.id}</p>
                <p className="text-[9px]" style={{ ...inter, color: '#475569' }}>{d.type === 'SMOKE' ? 'SMK' : 'SPR'} · {d.zone}</p>
                <p className="text-[9px] font-semibold mt-0.5" style={{ ...inter, color: DET_TEXT[d.status] }}>{d.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floor plan indicator + spread */}
        <div className="glass-card">
          <div className="section-title-bar">Fire Spread Monitor</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* SVG floor plan */}
            <div>
              <p className="text-[11px] mb-1.5" style={{ ...inter, color: '#475569' }}>Floor Plan Indicator</p>
              <svg viewBox="0 0 80 100" style={{ width: '100%', maxHeight: '70px' }}>
                {FLOORS.map((fl, i) => (
                  <g key={fl}>
                    <rect x="5" y={5 + i * 22} width="70" height="18" rx="2"
                      fill={affectedFloor === fl ? 'rgba(244,63,94,0.35)' : 'rgba(6,182,212,0.05)'}
                      stroke={affectedFloor === fl ? '#f43f5e' : 'rgba(6,182,212,0.18)'} strokeWidth="0.8" />
                    <text x="40" y={17 + i * 22} textAnchor="middle" style={{ fontSize: '7px', fill: affectedFloor === fl ? '#f43f5e' : '#3a4f66', fontFamily: 'JetBrains Mono, monospace' }}>{fl}</text>
                  </g>
                ))}
              </svg>
            </div>
            {/* Spread gauge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px]" style={{ ...inter, color: '#475569' }}>Spread Rate</p>
                <span className="text-[15px] font-bold" style={{ ...mono, color: spreadColor }}>{spread}%</span>
              </div>
              <div className="progress-track !h-2.5 rounded-sm overflow-hidden">
                <div style={{ width: `${spread}%`, height: '100%', background: `linear-gradient(90deg, #f59e0b, ${spreadColor})`, transition: 'width 1s, background 0.5s' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ ...inter, color: '#3a4f66' }}>Contained</span>
                <span className="text-[10px]" style={{ ...inter, color: '#3a4f66' }}>Critical</span>
              </div>
            </div>
          </div>

          {/* Alarm controls */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleFire} className="btn-danger py-2 text-[13px]">🔥 Trigger Fire Sim</button>
            <button onClick={() => setAlarm(!alarm)} className={alarm ? 'btn-danger py-2 text-[13px]' : 'btn-holo py-2 text-[13px]'}>
              {alarm ? '🔔 Deactivate' : '🔕 Activate Alarm'}
            </button>
          </div>
        </div>

        {/* Evacuation Routes */}
        <div className="glass-card">
          <div className="section-title-bar">Evacuation Route Status</div>
          <div className="space-y-1.5">
            {routes.map((r) => {
              const pct = (r.load / r.cap) * 100;
              return (
                <div key={r.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className={`dot shrink-0 ${ROUTE_DOT[r.status]}`} />
                  <span className="flex-1 text-[12px] truncate" style={{ ...inter, color: '#94a3b8', minWidth: 0 }}>{r.name}</span>
                  {r.status !== 'BLOCKED' && (
                    <span className="text-[10px] shrink-0" style={{ ...mono, color: '#475569' }}>~{r.estMinutes}min</span>
                  )}
                  <div className="w-14 shrink-0">
                    <div className="progress-track !h-1.5">
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: ROUTE_COLOR[r.status] }} />
                    </div>
                  </div>
                  <span className="text-[11px] shrink-0" style={{ ...mono, color: ROUTE_COLOR[r.status], width: '32px', textAlign: 'right' }}>{r.load}/{r.cap}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FireSafety;


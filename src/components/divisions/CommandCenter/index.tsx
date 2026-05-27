// ============================================================================
// Division 1 — Command Center (Komando Utama) v2
// ============================================================================
import React, { useState } from 'react';
import { useNFCCStore } from '../../../core/store/useNFCCStore';
import type { DivisionId } from '../../../core/types';

type ThreatLevel = 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
const THREAT_CFG: Record<ThreatLevel, { color: string; label: string; desc: string }> = {
  GREEN:  { color: '#10b981', label: 'NOMINAL',    desc: 'No active threats detected' },
  YELLOW: { color: '#f59e0b', label: 'ELEVATED',   desc: 'Monitor heightened activity' },
  RED:    { color: '#f43f5e', label: 'HIGH ALERT', desc: 'Imminent threat — prepare response' },
  BLACK:  { color: '#cc2233', label: 'CRITICAL',   desc: 'Maximum threat — all protocols active' },
};
const THREAT_SEGS: ThreatLevel[] = ['GREEN', 'YELLOW', 'RED', 'BLACK'];

const DIVISION_LIST: { id: DivisionId; name: string }[] = [
  { id:  1, name: 'Command Center'     },
  { id:  2, name: 'Internal Security'  },
  { id:  3, name: 'Perimeter Defense'  },
  { id:  4, name: 'Electrical'         },
  { id:  5, name: 'HVAC'               },
  { id:  6, name: 'Fire Safety'        },
  { id:  7, name: 'Plumbing'           },
  { id:  8, name: 'Medical'            },
  { id:  9, name: 'Logistics'          },
  { id: 10, name: 'Cyber Ops'          },
  { id: 11, name: 'Crisis Comm'        },
];

// 5×5 risk matrix likelihood/impact
const RISK_MATRIX: { l: string; i: string; val: number }[] = [
  { l:'Rare',     i:'Negligible', val:1 }, { l:'Rare',     i:'Minor', val:2 }, { l:'Rare',     i:'Moderate', val:3 }, { l:'Rare',     i:'Major', val:4 }, { l:'Rare',     i:'Catastrophic', val:4 },
  { l:'Unlikely', i:'Negligible', val:1 }, { l:'Unlikely', i:'Minor', val:2 }, { l:'Unlikely', i:'Moderate', val:3 }, { l:'Unlikely', i:'Major', val:5 }, { l:'Unlikely', i:'Catastrophic', val:6 },
  { l:'Possible', i:'Negligible', val:2 }, { l:'Possible', i:'Minor', val:3 }, { l:'Possible', i:'Moderate', val:5 }, { l:'Possible', i:'Major', val:6 }, { l:'Possible', i:'Catastrophic', val:8 },
  { l:'Likely',   i:'Negligible', val:3 }, { l:'Likely',   i:'Minor', val:4 }, { l:'Likely',   i:'Moderate', val:6 }, { l:'Likely',   i:'Major', val:8 }, { l:'Likely',   i:'Catastrophic', val:9 },
  { l:'Almost',   i:'Negligible', val:4 }, { l:'Almost',   i:'Minor', val:6 }, { l:'Almost',   i:'Moderate', val:8 }, { l:'Almost',   i:'Major', val:9 }, { l:'Almost',   i:'Catastrophic', val:10 },
];
const riskColor = (v: number): string =>
  v <= 2 ? 'rgba(16,185,129,0.55)' : v <= 4 ? 'rgba(245,158,11,0.55)' : v <= 7 ? 'rgba(249,115,22,0.55)' : 'rgba(244,63,94,0.65)';

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };
const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function CommandCenter(): React.JSX.Element {
  const { emergencyMode, transitionEmergency, addNotification } = useNFCCStore();
  const [threat, setThreat] = useState<ThreatLevel>('GREEN');
  const [overrideTarget, setOverrideTarget] = useState<DivisionId>(2);
  const [overrideActive, setOverrideActive] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  const tc = THREAT_CFG[threat];

  const handleProtocol = (): void => {
    if (!coverOpen) { setCoverOpen(true); return; }
    transitionEmergency('LOCKDOWN');
    setThreat('BLACK');
    setCoverOpen(false);
    addNotification({
      id: `n-${Date.now()}`, type: 'CRITICAL',
      title: 'PRESIDENTIAL PROTOCOL ACTIVATED',
      message: 'Full facility lockdown — VVIP security mode active.',
      division: 1, timestamp: Date.now(),
    });
  };

  const toggleOverride = (): void => {
    setOverrideActive((v) => {
      if (!v) addNotification({ id: `n-${Date.now()}`, type: 'WARNING', title: 'OVERRIDE ACTIVE', message: `Command assumed control of Division ${overrideTarget}.`, division: 1, timestamp: Date.now() });
      return !v;
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #FFD700' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 01</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Command Center</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="live-dot live-dot-cyan" />
            <span className="text-[10px] uppercase tracking-wider" style={{ ...inter, color: '#3a4f66' }}>LIVE</span>
            <span className="badge badge-info">KOMANDO</span>
          </div>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {now}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Nodes',   value: '5,000',  color: '#06b6d4', trend: '▲ 0.2%' },
            { label: 'Active Alarms', value: '3',      color: '#f43f5e', trend: '▼ 1' },
            { label: 'Divisions',     value: '11',     color: '#10b981', trend: '▲ 0' },
            { label: 'Uptime',        value: '99.97%', color: '#3b82f6', trend: '▲ 0.01%' },
          ].map((m) => (
            <div key={m.label} className="kpi-tile">
              <div className="flex justify-between items-start">
                <p className="text-[12px] mb-1" style={{ ...inter, color: '#64748b' }}>{m.label}</p>
                <span className="text-[10px]" style={{ color: m.trend.startsWith('▲') ? '#10b981' : '#f43f5e', ...mono }}>{m.trend}</span>
              </div>
              <p className="text-[17px] font-semibold" style={{ ...mono, color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Threat Level — Visual Gauge */}
        <div className="glass-card">
          <div className="section-title-bar">Threat Level</div>
          <div className="flex gap-1 mb-2">
            {THREAT_SEGS.map((lv) => (
              <button key={lv} onClick={() => setThreat(lv)} className="flex-1 py-2 rounded transition-all text-[12px] font-bold"
                style={{
                  background: threat === lv ? THREAT_CFG[lv].color : 'rgba(10,20,40,0.6)',
                  border: `1px solid ${threat === lv ? THREAT_CFG[lv].color : 'rgba(255,255,255,0.06)'}`,
                  color: threat === lv ? '#fff' : THREAT_CFG[lv].color,
                  boxShadow: threat === lv ? `0 0 12px ${THREAT_CFG[lv].color}55` : 'none',
                  cursor: 'pointer',
                }}>
                {lv}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="dot" style={{ background: tc.color, boxShadow: `0 0 6px ${tc.color}`, width: '8px', height: '8px' }} />
            <span className="text-[13px] font-bold" style={{ ...inter, color: tc.color }}>{tc.label}</span>
            <span className="text-[11px]" style={{ ...inter, color: '#475569' }}>— {tc.desc}</span>
          </div>
        </div>

        {/* Presidential Protocol — safety cover animation */}
        <div className="glass-card">
          <div className="section-title-bar">Presidential Protocol</div>
          <div className="relative overflow-hidden rounded" style={{ border: `1px solid ${coverOpen ? 'rgba(244,63,94,0.6)' : 'rgba(244,63,94,0.25)'}` }}>
            {!coverOpen && (
              <div className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                onClick={() => setCoverOpen(true)}
                style={{ background: 'rgba(10,20,40,0.85)', backdropFilter: 'blur(2px)' }}>
                <span className="text-[12px] uppercase tracking-widest" style={{ ...inter, color: '#3a4f66' }}>▸ LIFT COVER TO ENABLE</span>
              </div>
            )}
            <button onClick={handleProtocol} disabled={emergencyMode === 'LOCKDOWN'}
              className="w-full py-4 text-[14px] font-bold tracking-widest transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ ...inter, background: 'rgba(244,63,94,0.08)', color: '#f43f5e', cursor: emergencyMode === 'LOCKDOWN' ? 'not-allowed' : 'pointer', border: 'none' }}>
              {emergencyMode === 'LOCKDOWN' ? '■ LOCKDOWN ACTIVE' : '🔴 PRESIDENTIAL PROTOCOL → LOCKDOWN'}
            </button>
          </div>
          <p className="text-[11px] mt-1.5" style={{ ...inter, color: '#3a4f66' }}>Triggers full facility lockdown, notifies all 11 divisions</p>
        </div>

        {/* Override Control */}
        <div className="glass-card">
          <div className="section-title-bar">Override Control</div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <span className="text-[12px]" style={{ ...inter, color: '#64748b' }}>Target:</span>
              <select value={overrideTarget} onChange={(e) => setOverrideTarget(Number(e.target.value) as DivisionId)} style={{ maxWidth: '140px' }}>
                {DIVISION_LIST.filter((d) => d.id !== 1).map((d) => (
                  <option key={d.id} value={d.id}>{String(d.id).padStart(2, '0')} — {d.name}</option>
                ))}
              </select>
            </div>
            <button onClick={toggleOverride} className="toggle-track shrink-0"
              style={{ borderColor: overrideActive ? 'rgba(6,182,212,0.50)' : 'rgba(255,255,255,0.14)', background: overrideActive ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)' }}
              aria-label={overrideActive ? 'Deactivate override' : 'Activate override'}>
              <span className="toggle-thumb" style={{ left: overrideActive ? '22px' : '3px', background: overrideActive ? '#06b6d4' : '#3a4f66', boxShadow: overrideActive ? '0 0 6px rgba(6,182,212,0.6)' : 'none' }} />
            </button>
            {overrideActive && <span className="badge badge-info animate-pulse">OVERRIDE — DIV {String(overrideTarget).padStart(2, '0')}</span>}
          </div>
        </div>

        {/* System Status Overview — grid of colored dots */}
        <div className="glass-card">
          <div className="section-title-bar">System Status Overview</div>
          <div className="grid grid-cols-3 gap-1.5">
            {DIVISION_LIST.map((d) => (
              <div key={d.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded"
                style={{ background: 'rgba(10,20,40,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="dot dot-green shrink-0" style={{ width: '5px', height: '5px' }} />
                <span className="text-[11px] font-semibold shrink-0" style={{ ...mono, color: '#06b6d4', width: '16px' }}>{String(d.id).padStart(2,'0')}</span>
                <span className="text-[11px] truncate" style={{ ...inter, color: '#64748b', minWidth: 0 }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="glass-card">
          <div className="section-title-bar">Risk Matrix</div>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {RISK_MATRIX.map((cell, i) => (
              <div key={i} className="h-5 rounded-sm flex items-center justify-center"
                style={{ background: riskColor(cell.val) }}>
                <span className="text-[9px] font-bold" style={{ ...mono, color: 'rgba(255,255,255,0.8)' }}>{cell.val}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {['Neg.','Min.','Mod.','Maj.','Cat.'].map((l) => (
              <span key={l} className="text-[9px] text-center flex-1" style={{ ...inter, color: '#3a4f66' }}>{l}</span>
            ))}
          </div>
          <p className="text-[9px] mt-0.5 text-right" style={{ ...inter, color: '#2a3a4a' }}>← Impact →</p>
        </div>
      </div>
    </div>
  );
}

export default CommandCenter;


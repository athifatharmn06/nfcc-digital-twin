// ============================================================================
// Division 7 — Plumbing & Sanitasi v2
// ============================================================================
import React, { useState, useEffect } from 'react';

interface Tank  { id: string; name: string; level: number; cap: number; status: 'NORMAL' | 'LOW' | 'CRITICAL' | 'OVERFLOW'; }
interface Flow  { id: string; loc: string; rate: number; exp: number; }
interface Leak  { id: string; zone: string; imbal: number; sev: 'SUSPECTED' | 'CONFIRMED'; ts: number; }

const TANK_FILL: Record<Tank['status'], string> = { NORMAL: '#06b6d4', LOW: '#f59e0b', CRITICAL: '#f43f5e', OVERFLOW: '#a855f7' };


const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function Plumbing(): React.JSX.Element {
  const [tanks, setTanks] = useState<Tank[]>([
    { id: 't1', name: 'Main Reservoir', level: 78, cap: 50000, status: 'NORMAL'   },
    { id: 't2', name: 'Fire Reserve',   level: 95, cap: 30000, status: 'NORMAL'   },
    { id: 't3', name: 'Potable Water',  level: 42, cap: 20000, status: 'LOW'      },
    { id: 't4', name: 'Grey Water',     level: 15, cap: 15000, status: 'CRITICAL' },
  ]);

  const [flows] = useState<Flow[]>([
    { id: 'f1', loc: 'Main Inlet',    rate: 120.5, exp: 125 },
    { id: 'f2', loc: 'Zone A Supply', rate: 45.2,  exp: 45  },
    { id: 'f3', loc: 'Zone B Supply', rate: 38.7,  exp: 40  },
    { id: 'f4', loc: 'Recirculation', rate: 22.1,  exp: 25  },
  ]);

  const [leaks] = useState<Leak[]>([
    { id: 'lk1', zone: 'Zone B — Level 2',  imbal: 3.2, sev: 'SUSPECTED', ts: Date.now() - 120000 },
    { id: 'lk2', zone: 'Zone D — Basement', imbal: 8.7, sev: 'CONFIRMED',  ts: Date.now() - 30000  },
  ]);

  // Old quality removed — replaced by qualityIndo below

  useEffect(() => {
    const t = setInterval(() => {
      setTanks((p) => p.map((tk) => {
        const nl = Math.max(5, Math.min(98, tk.level + (Math.random() - 0.5) * 1.5));
        const s: Tank['status'] = nl < 20 ? 'CRITICAL' : nl < 40 ? 'LOW' : nl > 95 ? 'OVERFLOW' : 'NORMAL';
        return { ...tk, level: nl, status: s };
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Indonesian water quality — SNI 01-3553-2006 & Permenkes No.492/2010
  const [qualityIndo] = useState({ ph: 7.2, turb: 0.8, cl: 0.6, tds: 312 });
  const qualityData = [
    { key: 'pH',       val: qualityIndo.ph,   range: '6,5–8,5', unit: '',      ok: qualityIndo.ph >= 6.5 && qualityIndo.ph <= 8.5, std: 'Permenkes 492' },
    { key: 'Turbiditas', val: qualityIndo.turb, range: '<5 NTU',  unit: 'NTU',  ok: qualityIndo.turb < 5,                       std: 'SNI 01-3553' },
    { key: 'Klorin',   val: qualityIndo.cl,   range: '0,2–1,0', unit: 'mg/L', ok: qualityIndo.cl >= 0.2 && qualityIndo.cl <= 1.0, std: 'Permenkes 492' },
    { key: 'TDS',      val: qualityIndo.tds,  range: '<500',     unit: 'ppm',  ok: qualityIndo.tds < 500,                      std: 'SNI 01-3553' },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #1E90FF' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 07</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Plumbing & Sanitation</h2>
          </div>
          <span className="badge badge-warn shrink-0">2 ALERTS</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* Tank levels — vertical fill bars with wave effect */}
        <div className="glass-card">
          <div className="section-title-bar">Water Tank Levels</div>
          <div className="grid grid-cols-4 gap-3">
            {tanks.map((tk) => (
              <div key={tk.id} className="flex flex-col items-center gap-1">
                <p className="text-[11px] text-center w-full truncate" style={{ ...inter, color: '#64748b' }}>{tk.name}</p>
                <div className="relative w-full overflow-hidden rounded-sm"
                  style={{ height: '72px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${TANK_FILL[tk.status]}33` }}>
                  <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
                    style={{ height: `${tk.level}%`, background: `${TANK_FILL[tk.status]}22`, borderTop: `2px solid ${TANK_FILL[tk.status]}` }}>
                    {/* Wave surface */}
                    <div className="wave-surface absolute top-0 left-0 right-0 h-1.5"
                      style={{ background: `linear-gradient(90deg, transparent, ${TANK_FILL[tk.status]}88, transparent)` }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[14px] font-semibold tabular-nums" style={{ ...mono, color: TANK_FILL[tk.status] }}>{tk.level.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-[9px]" style={{ ...mono, color: TANK_FILL[tk.status] }}>{tk.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipe flow SVG diagram */}
        <div className="glass-card">
          <div className="section-title-bar">Pipe Flow Diagram</div>
          <svg viewBox="0 0 260 50" style={{ width: '100%', height: '44px' }}>
            {/* Main pipe */}
            <line x1="10" y1="25" x2="250" y2="25" stroke="rgba(6,182,212,0.25)" strokeWidth="3" />
            {/* Flow arrows */}
            {[40, 90, 140, 190].map((x) => (
              <g key={x}>
                <polygon points={`${x},20 ${x+10},25 ${x},30`} fill="rgba(6,182,212,0.6)" />
              </g>
            ))}
            {/* Branches */}
            {[60, 130, 200].map((x, i) => (
              <g key={x}>
                <line x1={x} y1="25" x2={x} y2="42" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5" />
                <text x={x} y="49" textAnchor="middle" style={{ fontSize: '6px', fill: '#3a4f66', fontFamily: 'JetBrains Mono, monospace' }}>
                  {['Zone A','Zone B','Zone C'][i]}
                </text>
              </g>
            ))}
            <text x="10" y="19" style={{ fontSize: '6px', fill: '#3a4f66', fontFamily: 'JetBrains Mono, monospace' }}>INLET</text>
            <text x="220" y="19" style={{ fontSize: '6px', fill: '#3a4f66', fontFamily: 'JetBrains Mono, monospace' }}>RECIRC</text>
          </svg>
        </div>

        {/* Flow rate + Water quality */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card">
            <div className="section-title-bar">Flow Rate</div>
            <div className="space-y-1.5">
              {flows.map((f) => {
                const dev = Math.abs(f.rate - f.exp) / f.exp;
                return (
                  <div key={f.id} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[12px] truncate" style={{ ...inter, color: '#94a3b8', flex: 1, minWidth: 0 }}>{f.loc}</span>
                    <span className="text-[13px] font-semibold shrink-0 ml-2" style={{ ...mono, color: dev > 0.1 ? '#f59e0b' : '#06b6d4' }}>{f.rate}L/m</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass-card">
            <div className="section-title-bar">Water Quality</div>
            <div className="grid grid-cols-2 gap-1.5">
              {qualityData.map(({ key, val, range, unit, ok, std }) => (
                <div key={key} className="text-center py-2 rounded" style={{ background: 'rgba(10,20,40,0.7)', border: `1px solid ${ok ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.20)'}` }}>
                  <p className="text-[15px] font-semibold" style={{ ...mono, color: ok ? '#06b6d4' : '#f43f5e' }}>{val} {unit}</p>
                  <p className="text-[10px] mt-0.5" style={{ ...inter, color: '#64748b' }}>{key}</p>
                  <p className="text-[9px] mt-0.5" style={{ ...inter, color: ok ? '#10b981' : '#f59e0b' }}>{range}</p>
                  <p className="text-[9px]" style={{ ...inter, color: '#2a3a4a' }}>{std}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leak detection */}
        <div className="glass-card">
          <div className="section-title-bar">Leak Detection</div>
          <div className="space-y-1.5">
            {leaks.map((lk) => (
              <div key={lk.id} className="flex items-center justify-between p-2 rounded"
                style={{ background: lk.sev === 'CONFIRMED' ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${lk.sev === 'CONFIRMED' ? 'rgba(244,63,94,0.22)' : 'rgba(245,158,11,0.22)'}` }}>
                <div style={{ minWidth: 0 }}>
                  <p className="text-[13px] font-semibold" style={{ ...inter, color: lk.sev === 'CONFIRMED' ? '#f43f5e' : '#f59e0b' }}>{lk.sev} — {lk.zone}</p>
                  <p className="text-[11px]" style={{ ...mono, color: '#64748b' }}>Imbalance: {lk.imbal} L/min</p>
                </div>
                <span className="text-[11px] shrink-0" style={{ ...mono, color: '#475569' }}>{new Date(lk.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Plumbing;


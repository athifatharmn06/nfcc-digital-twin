// ============================================================================
// Division 4 — Electrical v2
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDivisionData } from '../../../core/hooks/useDivisionData';

interface PowerPoint { time: string; load: number; capacity: number; }
interface UPSUnit { id: string; name: string; battery: number; status: 'ONLINE' | 'CHARGING' | 'DISCHARGING' | 'FAULT'; }

const battColor = (b: number) => b > 70 ? '#10b981' : b > 30 ? '#f59e0b' : '#f43f5e';
const UPS_STATUS_COLOR: Record<UPSUnit['status'], string> = { ONLINE: '#10b981', CHARGING: '#3b82f6', DISCHARGING: '#f59e0b', FAULT: '#f43f5e' };

// Battery % → estimated runtime hours (rough: 100% ≈ 8h linear)
const battToHours = (b: number): string => `${(b * 0.08).toFixed(1)}h`;

const CHART_STYLE = {
  contentStyle: { background: 'rgba(8,16,32,0.96)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
};

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function Electrical(): React.JSX.Element {
  const { sendCommand, sendToPhysics } = useDivisionData(4);

  const [data, setData] = useState<PowerPoint[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({
      time: `${i * 2}s`,
      load: 2400 + Math.sin(i * 0.5) * 300 + (Math.random() - 0.5) * 80,
      capacity: 3200,
    }))
  );

  const [ups] = useState<UPSUnit[]>([
    { id: 'UPS-A1', name: 'Main UPS A',   battery: 95,  status: 'ONLINE'   },
    { id: 'UPS-A2', name: 'Main UPS B',   battery: 88,  status: 'ONLINE'   },
    { id: 'UPS-B1', name: 'Backup UPS',   battery: 72,  status: 'CHARGING' },
    { id: 'UPS-C1', name: 'Critical UPS', battery: 100, status: 'ONLINE'   },
  ]);

  const [genStatus, setGenStatus] = useState<'STANDBY' | 'RUNNING' | 'FAULT'>('STANDBY');
  const [atsActive, setAtsActive] = useState(false);
  const [volt] = useState({ l1: 219.8, l2: 218.4, l3: 220.1 }); // PLN: 220V ±5%, 50Hz
  const [frequency] = useState(49.98); // Target 50 Hz
  const [pf]   = useState(0.88); // Typical Indonesian industrial PF

  useEffect(() => {
    const t = setInterval(() => {
      setData((prev) => {
        const next = [...prev.slice(1)];
        const idx  = parseInt(prev.at(-1)!.time) + 2;
        next.push({ time: `${idx}s`, load: 2400 + Math.sin(idx * 0.1) * 300 + (Math.random() - 0.5) * 80, capacity: 3200 });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleShed = useCallback((zone: string) => {
    sendCommand('command/electrical/loadshed', { circuits: [zone] });
    sendToPhysics({ type: 'CIRCUIT_DISCONNECT', circuits: [zone] });
  }, [sendCommand, sendToPhysics]);

  const genColor = genStatus === 'RUNNING' ? '#10b981' : genStatus === 'FAULT' ? '#f43f5e' : '#f59e0b';
  const currentLoad = data.at(-1)?.load ?? 0;
  const loadPct = (currentLoad / 3200) * 100;

  // KW saved estimates per circuit
  const SHED_KW: Record<string, number> = { 'Non-Critical': 220, 'HVAC Zones': 380, 'Ext. Lighting': 90, 'Auxiliary': 150 };

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #FFFF00' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 04</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Electrical Systems</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="live-dot live-dot-cyan" />
            <span className="badge badge-ok">ONLINE</span>
          </div>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Beban Aktif',    value: `${currentLoad.toFixed(0)} kW`,  color: loadPct > 85 ? '#f43f5e' : '#06b6d4', trend: loadPct > 85 ? '▲' : '▼' },
            { label: 'Kapasitas PLN',  value: '3.200 kW',  color: '#dde6f0', trend: '—' },
            { label: 'Faktor Daya',   value: String(pf),  color: '#10b981', trend: '▲' },
            { label: 'Frekuensi',     value: `${frequency} Hz`,  color: '#06b6d4', trend: '▲' },
          ].map((m) => (
            <div key={m.label} className="kpi-tile">
              <div className="flex justify-between items-start">
                <p className="text-[12px] mb-1" style={{ ...inter, color: '#64748b' }}>{m.label}</p>
                <span className="text-[10px]" style={{ color: m.trend === '▲' ? '#10b981' : m.trend === '▼' ? '#f43f5e' : '#475569', ...mono }}>{m.trend}</span>
              </div>
              <p className="text-[16px] font-semibold" style={{ ...mono, color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Mini power flow diagram */}
        <div className="glass-card">
          <div className="section-title-bar">Power Flow Diagram</div>
          <div className="flex items-center justify-between px-2 py-1">
            {['MAIN GRID', 'ATS', 'UPS', 'CRITICAL LOADS'].map((node, i, arr) => (
              <React.Fragment key={node}>
                <div className="text-center">
                  <div className="px-2 py-1 rounded text-[11px] font-semibold" style={{ ...mono, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.22)', color: '#06b6d4' }}>
                    {node}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 flex items-center px-1">
                    <div className="data-bar flex-1" style={{ height: '2px' }} />
                    <span className="text-[10px]" style={{ ...mono, color: '#06b6d4' }}>▶</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Live Chart */}
        <div className="glass-card" style={{ padding: '10px 12px 6px' }}>
          <div className="section-title-bar">Dynamic Load Flow — Real-Time</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.06)" />
              <XAxis dataKey="time" stroke="#3a4f66" fontSize={8} tick={{ fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#3a4f66" fontSize={8} domain={[1800, 3600]} tick={{ fontFamily: 'JetBrains Mono' }} />
              <Tooltip {...CHART_STYLE} />
              <ReferenceLine y={2720} stroke="rgba(245,158,11,0.5)" strokeDasharray="4 3" label={{ value: 'MAX CAPACITY', position: 'right', fill: '#f59e0b', fontSize: 8 }} />
              <Line type="monotone" dataKey="load"     stroke="#06b6d4" strokeWidth={2} dot={false} name="Load kW" />
              <Line type="monotone" dataKey="capacity" stroke="#f43f5e" strokeWidth={1} strokeDasharray="5 3" dot={false} name="Capacity" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* UPS */}
        <div className="glass-card">
          <div className="section-title-bar">UPS Battery Status</div>
          <div className="space-y-2">
            {ups.map((u) => (
              <div key={u.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px]" style={{ ...inter, color: '#94a3b8' }}>{u.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ ...mono, color: '#475569' }}>~{battToHours(u.battery)} remain</span>
                    <span className="text-[12px] font-semibold" style={{ ...mono, color: UPS_STATUS_COLOR[u.status] }}>{u.battery}% — {u.status}</span>
                  </div>
                </div>
                <div className="progress-track" style={{ height: '4px' }}>
                  <div style={{ width: `${u.battery}%`, height: '100%', background: battColor(u.battery), borderRadius: 2, transition: 'width 0.8s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generator + ATS + Voltage */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card space-y-2">
            <div className="section-title-bar">Generator / ATS</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="dot" style={{ background: genColor, boxShadow: `0 0 4px ${genColor}` }} />
                <span className="text-[13px] font-semibold" style={{ ...inter, color: genColor }}>{genStatus}</span>
              </div>
              <button onClick={() => setGenStatus((p) => p === 'STANDBY' ? 'RUNNING' : 'STANDBY')} className="btn-holo !px-2 !py-0.5 !text-[11px]">
                {genStatus === 'STANDBY' ? 'START' : 'STOP'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ ...inter, color: atsActive ? '#10b981' : '#475569' }}>ATS {atsActive ? 'ACTIVATED' : 'STANDBY'}</span>
              <button onClick={() => setAtsActive((v) => !v)} className="btn-holo !px-2 !py-0.5 !text-[11px]">{atsActive ? 'DEACT' : 'ACTIV'}</button>
            </div>
          </div>
          <div className="glass-card">
            <div className="section-title-bar">Tegangan Fasa (L-N)</div>
            <p className="text-[10px] mb-1.5" style={{ ...mono, color: '#3a4f66' }}>PLN 220V / 50Hz</p>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {[['L1', volt.l1], ['L2', volt.l2], ['L3', volt.l3]].map(([ph, v]) => (
                <div key={ph as string} className="text-center py-2 rounded" style={{ background: 'rgba(10,20,40,0.7)', border: `1px solid ${Math.abs((v as number) - 220) > 10 ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                  <p className="text-[14px] font-semibold" style={{ ...mono, color: Math.abs((v as number) - 220) > 10 ? '#f43f5e' : '#06b6d4' }}>{(v as number).toFixed(1)}V</p>
                  <p className="text-[11px]" style={{ ...inter, color: '#475569' }}>{ph as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Load Shedding */}
        <div className="glass-card">
          <div className="section-title-bar">Load Shedding Control</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Non-Critical', 'HVAC Zones', 'Ext. Lighting', 'Auxiliary'] as const).map((z) => (
              <button key={z} onClick={() => handleShed(z)} className="btn-danger !text-[12px] !py-1.5 flex-col !gap-0.5">
                <span>SHED: {z}</span>
                <span className="text-[10px]" style={{ color: 'rgba(244,63,94,0.6)' }}>save ~{SHED_KW[z]} kW</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Electrical;


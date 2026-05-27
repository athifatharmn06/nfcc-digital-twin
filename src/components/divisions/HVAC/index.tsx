// ============================================================================
// Division 5 — HVAC v2
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDivisionData } from '../../../core/hooks/useDivisionData';

interface ZoneData   { id: string; name: string; temp: number; humidity: number; co2: number; setpoint: number; }
interface TempPoint  { time: string; actual: number; setpoint: number; }
interface MaintAlert { id: string; unit: string; issue: string; days: number; sev: 'LOW' | 'MEDIUM' | 'HIGH'; }

const MAINT_COLOR:  Record<string, string> = { HIGH: 'rgba(244,63,94,0.08)',  MEDIUM: 'rgba(245,158,11,0.08)', LOW: 'rgba(6,182,212,0.08)' };
const MAINT_BORDER: Record<string, string> = { HIGH: 'rgba(244,63,94,0.25)',  MEDIUM: 'rgba(245,158,11,0.25)', LOW: 'rgba(6,182,212,0.20)' };
const MAINT_TEXT:   Record<string, string> = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#06b6d4' };

// PID quality feedback
const pidQuality = (kp: number): 'OPTIMAL' | 'ACCEPTABLE' | 'OSCILLATING' =>
  kp >= 1.0 && kp <= 1.5 ? 'OPTIMAL' : kp < 1.0 ? 'ACCEPTABLE' : 'OSCILLATING';
const pidQualityColor: Record<string, string> = { OPTIMAL: '#10b981', ACCEPTABLE: '#f59e0b', OSCILLATING: '#f43f5e' };

// Energy efficiency score
const efficiencyScore = (kp: number, ki: number): string => {
  const s = kp + ki;
  return s < 1.5 ? 'A' : s < 2.5 ? 'B' : 'C';
};
const effColor: Record<string, string> = { A: '#10b981', B: '#f59e0b', C: '#f43f5e' };

const CHART_STYLE = {
  contentStyle: { background: 'rgba(8,16,32,0.96)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
};

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

// Countdown to days in h:m:s display
function daysCountdown(days: number): string { return `${days * 24}h remaining`; }

export function HVAC(): React.JSX.Element {
  const { sendToPhysics } = useDivisionData(5);
  const [pid, setPid] = useState({ kp: 1.2, ki: 0.5, kd: 0.3 });

  // Indonesian tropical climate: ambient 28-33°C, AC setpoints realistic
  const [zones] = useState<ZoneData[]>([
    { id: 'za', name: 'Ruang Komando', temp: 22.4, humidity: 58, co2: 520,  setpoint: 22 },
    { id: 'zb', name: 'Server Room',   temp: 18.1, humidity: 40, co2: 380,  setpoint: 18 },
    { id: 'zc', name: 'Ruang Operasi', temp: 24.8, humidity: 65, co2: 680,  setpoint: 24 },
    { id: 'zd', name: 'Ruang Medis',   temp: 21.0, humidity: 55, co2: 450,  setpoint: 21 },
  ]);

  const [tempData, setTempData] = useState<TempPoint[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({
      time: `${i * 2}s`,
      actual:   22 + Math.sin(i * 0.3) * 2 + (Math.random() - 0.5) * 0.5,
      setpoint: 22,
    }))
  );

  const [alerts] = useState<MaintAlert[]>([
    { id: 'ma1', unit: 'AHU-03',    issue: 'Filter replacement due',       days: 3,  sev: 'HIGH'   },
    { id: 'ma2', unit: 'Chiller-01',issue: 'Compressor vibration anomaly', days: 7,  sev: 'MEDIUM' },
    { id: 'ma3', unit: 'FCU-12',    issue: 'Bearing wear predicted',       days: 14, sev: 'LOW'    },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setTempData((prev) => {
        const next = [...prev.slice(1)];
        const last = prev.at(-1)!;
        const idx  = parseInt(last.time) + 2;
        const err  = 22 - last.actual;
        next.push({ time: `${idx}s`, actual: last.actual + pid.kp * err * 0.08 + (Math.random() - 0.5) * 0.25, setpoint: 22 });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pid]);

  const handlePid = useCallback((k: 'kp' | 'ki' | 'kd', v: number) => {
    const p = { ...pid, [k]: v };
    setPid(p);
    sendToPhysics({ type: 'UPDATE_PID', params: p });
  }, [pid, sendToPhysics]);

  const quality = pidQuality(pid.kp);
  const effScore = efficiencyScore(pid.kp, pid.ki);

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #00BFFF' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 05</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">HVAC Control</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2 py-0.5 rounded text-[12px] font-bold" style={{ background: `${effColor[effScore]}18`, border: `1px solid ${effColor[effScore]}44`, color: effColor[effScore], ...mono }}>
              EFF: {effScore}
            </div>
            <span className="badge badge-ok">NOMINAL</span>
          </div>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {/* PID Controller */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title-bar flex-1 !mb-0">PID Controller Parameters</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase" style={{ ...inter, color: '#475569' }}>Response:</span>
              <span className="text-[11px] font-semibold" style={{ ...mono, color: pidQualityColor[quality] }}>{quality}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['kp', 'ki', 'kd'] as const).map((k) => (
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] font-semibold uppercase" style={{ ...mono, color: '#06b6d4' }}>{k}</span>
                  <span className="text-[12px] tabular-nums" style={{ ...mono, color: '#dde6f0' }}>{pid[k].toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="3" step="0.1" value={pid[k]} onChange={(e) => handlePid(k, parseFloat(e.target.value))} />
              </div>
            ))}
          </div>
        </div>

        {/* Zone table */}
        <div className="glass-card">
          <div className="section-title-bar">Climate Zones</div>
          <table>
            <colgroup>
              <col style={{ width: '80px' }} /><col style={{ width: '56px' }} /><col style={{ width: '44px' }} /><col /><col style={{ width: '16px' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Zone','Temp','Humid','CO₂','▲'].map((h) => (
                  <th key={h} className="py-1 text-left text-[11px] uppercase" style={{ ...inter, color: '#3a4f66' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => {
                const isOff = Math.abs(z.temp - z.setpoint) > 2;
                const trend = z.temp > z.setpoint ? '▲' : '▼';
                return (
                  <tr key={z.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-1.5 text-[12px] font-medium" style={{ ...inter, color: '#94a3b8' }}>{z.name}</td>
                    <td className="py-1.5 text-[13px] font-semibold" style={{ ...mono, color: isOff ? '#f43f5e' : '#06b6d4' }}>{z.temp.toFixed(1)}°C</td>
                    <td className="py-1.5 text-[12px]" style={{ ...mono, color: '#64748b' }}>{z.humidity}%</td>
                    <td className="py-1.5 text-[12px]" style={{ ...mono, color: z.co2 > 500 ? '#f59e0b' : '#64748b' }}>{z.co2}ppm</td>
                    <td className="py-1.5 text-[11px] font-bold" style={{ color: z.temp > z.setpoint ? '#f43f5e' : '#10b981' }}>{trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Temperature chart */}
        <div className="glass-card" style={{ padding: '10px 12px 6px' }}>
          <div className="section-title-bar">Temperature Response (PID)</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={tempData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.06)" />
              <XAxis dataKey="time" stroke="#3a4f66" fontSize={8} tick={{ fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#3a4f66" fontSize={8} domain={[18, 26]} tick={{ fontFamily: 'JetBrains Mono' }} />
              <Tooltip {...CHART_STYLE} />
              <Line type="monotone" dataKey="actual"   stroke="#06b6d4" strokeWidth={2} dot={false} name="Actual °C" />
              <Line type="monotone" dataKey="setpoint" stroke="#10b981" strokeWidth={1} strokeDasharray="5 3" dot={false} name="Setpoint" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Alerts */}
        <div className="glass-card">
          <div className="section-title-bar">Predictive Maintenance</div>
          <div className="space-y-1.5">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded"
                style={{ background: MAINT_COLOR[a.sev], border: `1px solid ${MAINT_BORDER[a.sev]}` }}>
                <div style={{ minWidth: 0 }}>
                  <p className="text-[13px] font-semibold" style={{ ...mono, color: MAINT_TEXT[a.sev] }}>{a.unit}</p>
                  <p className="text-[11px] truncate" style={{ ...inter, color: '#64748b' }}>{a.issue}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-[12px] font-semibold" style={{ ...mono, color: MAINT_TEXT[a.sev] }}>{a.days}d</span>
                  <p className="text-[9px]" style={{ ...inter, color: '#3a4f66' }}>{daysCountdown(a.days)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HVAC;


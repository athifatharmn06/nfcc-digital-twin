// ============================================================================
// Division 3 — Perimeter Defense v2
// ============================================================================
import React, { useState, useEffect } from 'react';

type BreachLevel = 0 | 1 | 2 | 3;
const BREACH_COLOR: Record<BreachLevel, string> = { 0: '#10b981', 1: '#f59e0b', 2: '#f97316', 3: '#f43f5e' };
const BREACH_LABEL: Record<BreachLevel, string> = { 0: 'CLEAR', 1: 'LEVEL 1', 2: 'LEVEL 2', 3: 'CRITICAL' };
const BREACH_DESC:  Record<BreachLevel, string> = { 0: 'No activity', 1: 'Unusual motion', 2: 'Confirmed contact', 3: 'Imminent breach' };

interface DroneStatus { id: string; sector: string; battery: number; status: 'PATROLLING' | 'RETURNING' | 'CHARGING' | 'ALERT'; }
interface SensorStatus { id: string; type: 'VIB' | 'FOC'; zone: string; status: 'NORMAL' | 'ALERT' | 'OFFLINE'; }

const DRONE_COLOR: Record<DroneStatus['status'], string> = { PATROLLING: '#10b981', RETURNING: '#f59e0b', CHARGING: '#3b82f6', ALERT: '#f43f5e' };
const SENSOR_BADGE: Record<SensorStatus['status'], string> = { NORMAL: 'badge badge-ok', ALERT: 'badge badge-critical', OFFLINE: 'badge badge-offline' };

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

function battColor(b: number): string { return b > 50 ? '#10b981' : b > 20 ? '#f59e0b' : '#f43f5e'; }

// Multiple radar sweep trails for phosphor effect
const TRAIL_COUNT = 5;

export function PerimeterDefense(): React.JSX.Element {
  const [radarAngle, setRadarAngle] = useState(0);
  const [breach, setBreach] = useState<Record<string, BreachLevel>>({ North: 0, East: 1, South: 0, West: 0 });
  const [drones] = useState<DroneStatus[]>([
    { id: 'UAV-01', sector: 'North', battery: 87, status: 'PATROLLING' },
    { id: 'UAV-02', sector: 'East',  battery: 45, status: 'PATROLLING' },
    { id: 'UAV-03', sector: 'South', battery: 12, status: 'RETURNING'  },
    { id: 'UAV-04', sector: 'West',  battery: 95, status: 'PATROLLING' },
  ]);
  const [sensors] = useState<SensorStatus[]>([
    { id: 'VIB-001', type: 'VIB', zone: 'N-A',  status: 'NORMAL'  },
    { id: 'VIB-002', type: 'VIB', zone: 'N-B',  status: 'NORMAL'  },
    { id: 'VIB-003', type: 'VIB', zone: 'E-A',  status: 'ALERT'   },
    { id: 'VIB-004', type: 'VIB', zone: 'E-B',  status: 'NORMAL'  },
    { id: 'FOC-001', type: 'FOC', zone: 'N-A',  status: 'NORMAL'  },
    { id: 'FOC-002', type: 'FOC', zone: 'S-A',  status: 'NORMAL'  },
    { id: 'FOC-003', type: 'FOC', zone: 'E-A',  status: 'ALERT'   },
    { id: 'FOC-004', type: 'FOC', zone: 'W-A',  status: 'OFFLINE' },
  ]);

  useEffect(() => {
    const t = setInterval(() => setRadarAngle((a) => (a + 3) % 360), 50);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setBreach((p) => {
        const keys = Object.keys(p);
        const k = keys[Math.floor(Math.random() * keys.length)];
        return { ...p, [k]: Math.floor(Math.random() * 4) as BreachLevel };
      });
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Perimeter integrity: count clear zones
  const perimeterPct = Math.round((Object.values(breach).filter((v) => v === 0).length / 4) * 100);
  const perimColor = perimeterPct === 100 ? '#10b981' : perimeterPct >= 75 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #FF8C00' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 03</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Perimeter Defense</h2>
          </div>
          <span className="badge badge-info shrink-0">DIV-03</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* Radar + Perimeter Integrity */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card flex flex-col items-center">
            <div className="section-title-bar w-full">Radar Sweep</div>
            <div className="relative" style={{ width: '148px', height: '148px' }}>
              {[1,2,3,4].map((r) => (
                <div key={r} className="absolute rounded-full" style={{ width:`${r*25}%`,height:`${r*25}%`,top:`${50-r*12.5}%`,left:`${50-r*12.5}%`,border:'1px solid rgba(6,182,212,0.15)' }} />
              ))}
              <div className="absolute top-0 left-1/2 w-px h-full" style={{ background: 'rgba(6,182,212,0.10)' }} />
              <div className="absolute top-1/2 left-0 h-px w-full" style={{ background: 'rgba(6,182,212,0.10)' }} />
              {/* Phosphor afterglow trails */}
              {Array.from({ length: TRAIL_COUNT }).map((_, ti) => (
                <div key={ti} className="absolute top-1/2 left-1/2 h-0.5 origin-left"
                  style={{
                    width: '50%', transformOrigin: '0 50%',
                    transform: `rotate(${(radarAngle - ti * 12 + 360) % 360}deg)`,
                    background: `linear-gradient(90deg, rgba(6,182,212,${(0.8 - ti * 0.15).toFixed(2)}), transparent)`,
                  }} />
              ))}
              <div className="absolute" style={{ top:'50%',left:'50%',width:'8px',height:'8px',marginTop:'-4px',marginLeft:'-4px',borderRadius:'50%',background:'#06b6d4',boxShadow:'0 0 8px rgba(6,182,212,0.9)' }} />
              {breach['East'] > 0 && (
                <div className="absolute animate-pulse" style={{ top:'50%',right:'12px',width:'7px',height:'7px',marginTop:'-3.5px',borderRadius:'50%',background:'#f43f5e',boxShadow:'0 0 6px rgba(244,63,94,0.9)' }} />
              )}
            </div>
          </div>

          <div className="glass-card">
            <div className="section-title-bar">Drone Patrol</div>
            <div className="space-y-2">
              {drones.map((d) => (
                <div key={d.id} className="flex flex-col gap-0.5 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold" style={{ ...mono, color: '#94a3b8' }}>{d.id}</span>
                    <span className="text-[11px]" style={{ ...inter, color: DRONE_COLOR[d.status] }}>{d.status}</span>
                  </div>
                  {/* Battery bar with fill */}
                  <div className="flex items-center gap-1.5">
                    <div style={{ flex:1,height:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'2px',overflow:'hidden',minWidth:0 }}>
                      <div style={{ width:`${d.battery}%`,height:'100%',background:battColor(d.battery),borderRadius:'2px',transition:'width 0.8s' }} />
                    </div>
                    <span className="text-[10px] shrink-0" style={{ ...mono, color: battColor(d.battery), width:'24px' }}>{d.battery}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Perimeter Integrity Meter */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title-bar flex-1 !mb-0">Perimeter Integrity</div>
            <span className="text-[15px] font-bold" style={{ ...mono, color: perimColor }}>{perimeterPct}%</span>
          </div>
          <div className="progress-track" style={{ height: '6px' }}>
            <div style={{ width:`${perimeterPct}%`,height:'100%',background:`linear-gradient(90deg, ${perimColor}, ${perimColor}aa)`,borderRadius:'3px',transition:'width 1s' }} />
          </div>
        </div>

        {/* Zone Breach */}
        <div className="glass-card">
          <div className="section-title-bar">Zone Breach Indicators</div>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(breach).map(([zone, lv]) => (
              <div key={zone} className="py-2 px-2 rounded text-center"
                style={{ background: 'rgba(10,20,40,0.6)', border: `1px solid ${BREACH_COLOR[lv as BreachLevel]}44` }}>
                <p className="text-[12px] font-semibold" style={{ ...inter, color: '#dde6f0' }}>{zone}</p>
                <p className="text-[11px] font-bold mt-0.5" style={{ ...mono, color: BREACH_COLOR[lv as BreachLevel] }}>{BREACH_LABEL[lv as BreachLevel]}</p>
                <p className="text-[9px] mt-0.5" style={{ ...inter, color: '#475569' }}>{BREACH_DESC[lv as BreachLevel]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="glass-card">
          <div className="section-title-bar">Vibration & Fiber Optic Fence</div>
          <table>
            <colgroup><col style={{ width:'56px' }} /><col style={{ width:'36px' }} /><col style={{ width:'40px' }} /><col /></colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['ID','Type','Zone','Status'].map((h) => (
                  <th key={h} className="py-1 text-left text-[11px] uppercase" style={{ ...inter, color: '#3a4f66' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensors.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="py-1 text-[12px] font-semibold" style={{ ...mono, color: '#94a3b8' }}>{s.id}</td>
                  <td className="py-1 text-[12px]" style={{ ...mono, color: '#475569' }}>{s.type}</td>
                  <td className="py-1 text-[12px]" style={{ ...inter, color: '#94a3b8' }}>{s.zone}</td>
                  <td className="py-1"><span className={SENSOR_BADGE[s.status]}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PerimeterDefense;


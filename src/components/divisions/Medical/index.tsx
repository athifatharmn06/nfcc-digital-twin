// ============================================================================
// Division 8 — Medical v2
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useNFCCStore } from '../../../core/store/useNFCCStore';

interface Station { id: string; name: string; loc: string; distance: string; sup: 'FULL' | 'PARTIAL' | 'EMPTY'; aed: boolean; }
interface IsoRoom  { id: string; name: string; status: 'AVAILABLE' | 'OCCUPIED' | 'CONTAMINATED'; patient?: string; neg: boolean; pressure: number; }
interface EMEvent  { id: string; type: 'CARDIAC' | 'TRAUMA' | 'CHEMICAL' | 'GENERAL'; zone: string; ts: number; resp: boolean; }

const SUP_COLOR: Record<Station['sup'], string>    = { FULL: '#10b981', PARTIAL: '#f59e0b', EMPTY: '#f43f5e' };
const ISO_BORDER: Record<IsoRoom['status'], string> = { AVAILABLE: 'rgba(16,185,129,0.22)', OCCUPIED: 'rgba(245,158,11,0.22)', CONTAMINATED: 'rgba(244,63,94,0.22)' };
const ISO_TEXT: Record<IsoRoom['status'], string>   = { AVAILABLE: '#10b981', OCCUPIED: '#f59e0b', CONTAMINATED: '#f43f5e' };

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m ago` : m > 0 ? `${m}m ${s % 60}s ago` : `${s}s ago`;
}

export function Medical(): React.JSX.Element {
  const { addNotification } = useNFCCStore();
  const [elapsed, setElapsed] = useState(0);
  const lastEmergencyTs = Date.now() - 180000;

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - lastEmergencyTs), 1000);
    return () => clearInterval(t);
  }, [lastEmergencyTs]);

  const [stations] = useState<Station[]>([
    { id: 'fa1', name: 'Station Alpha',   loc: 'F1 Main Hall',   distance: '25m',  sup: 'FULL',    aed: true  },
    { id: 'fa2', name: 'Station Bravo',   loc: 'F2 East Wing',   distance: '60m',  sup: 'FULL',    aed: true  },
    { id: 'fa3', name: 'Station Charlie', loc: 'F2 West Wing',   distance: '80m',  sup: 'PARTIAL', aed: false },
    { id: 'fa4', name: 'Station Delta',   loc: 'B1 Server Room', distance: '120m', sup: 'FULL',    aed: true  },
    { id: 'fa5', name: 'Station Echo',    loc: 'F3 Operations',  distance: '95m',  sup: 'EMPTY',   aed: false },
  ]);

  const [rooms] = useState<IsoRoom[]>([
    { id: 'i1', name: 'ISO Room 1', status: 'AVAILABLE',    neg: true,  pressure: -15 },
    { id: 'i2', name: 'ISO Room 2', status: 'OCCUPIED',     patient: 'Patient #042', neg: true,  pressure: -18 },
    { id: 'i3', name: 'ISO Room 3', status: 'CONTAMINATED', neg: true,  pressure: -20 },
    { id: 'i4', name: 'ISO Room 4', status: 'AVAILABLE',    neg: false, pressure: 0   },
  ]);

  const [events] = useState<EMEvent[]>([
    { id: 'em1', type: 'TRAUMA', zone: 'Zone B — Level 1', ts: Date.now() - 180000, resp: true },
  ]);

  const handleMedic = (): void => {
    addNotification({ id: `n-${Date.now()}`, type: 'CRITICAL', title: 'MEDIC NEEDED', message: 'Medical assistance requested. Nearest medic team dispatched.', division: 8, timestamp: Date.now() });
  };

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #00FF7F' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 08</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Medical Services</h2>
          </div>
          <span className="badge badge-info shrink-0">DIV-08</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* Response time counter + Emergency Request */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card flex flex-col gap-2">
            <div className="section-title-bar">Emergency Request</div>
            <button onClick={handleMedic} className="w-full py-4 text-[15px] font-semibold transition-all active:scale-97"
              style={{ ...inter, background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.38)', borderRadius: '3px', color: '#f43f5e', cursor: 'pointer' }}>
              🚑 MEDIC NEEDED
            </button>
            <p className="text-[11px]" style={{ ...inter, color: '#3a4f66' }}>Dispatches nearest team</p>
          </div>

          <div className="glass-card">
            <div className="section-title-bar">Response Timer</div>
            <div className="flex flex-col items-center justify-center h-full pb-2">
              <div className="text-[12px] mb-1" style={{ ...inter, color: '#475569' }}>Since last emergency:</div>
              <div className="text-[16px] font-bold tabular-nums" style={{ ...mono, color: '#f59e0b' }}>{formatElapsed(elapsed)}</div>
              {events.map((e) => (
                <div key={e.id} className="mt-2 p-1.5 rounded w-full" style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.22)' }}>
                  <p className="text-[12px] font-semibold" style={{ ...inter, color: '#f43f5e' }}>{e.type} — {e.zone}</p>
                  {e.resp && <span className="badge badge-ok animate-pulse text-[10px]">RESPONDING</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* First Aid Stations — simplified layout, no table to avoid truncation */}
        <div className="glass-card">
          <div className="section-title-bar">First Aid Stations</div>
          <div className="space-y-1.5">
            {stations.map((s) => (
              <div key={s.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Station name + location stacked */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="text-[12px] font-semibold" style={{ ...inter, color: '#94a3b8' }}>{s.name}</p>
                  <p className="text-[10px]" style={{ ...inter, color: '#475569' }}>{s.loc}</p>
                </div>
                {/* Distance */}
                <span className="text-[11px] shrink-0" style={{ ...mono, color: '#475569' }}>{s.distance}</span>
                {/* AED badge */}
                {s.aed
                  ? <span className="badge badge-ok shrink-0">AED</span>
                  : <span className="text-[10px] shrink-0" style={{ color: '#3a4f66', width: '24px', textAlign: 'center' }}>—</span>
                }
                {/* Supplies */}
                <span className="text-[11px] font-bold shrink-0" style={{ ...mono, color: SUP_COLOR[s.sup], minWidth: '44px', textAlign: 'right' }}>{s.sup}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Isolation Rooms */}
        <div className="glass-card">
          <div className="section-title-bar">Isolation Rooms</div>
          <div className="grid grid-cols-2 gap-2">
            {rooms.map((r) => (
              <div key={r.id} className="p-2.5 rounded" style={{ background: 'rgba(10,20,40,0.6)', border: `1px solid ${ISO_BORDER[r.status]}` }}>
                <p className="text-[13px] font-semibold" style={{ ...inter, color: '#dde6f0' }}>{r.name}</p>
                <p className="text-[12px] font-medium mt-0.5" style={{ ...inter, color: ISO_TEXT[r.status] }}>{r.status}</p>
                {r.patient && <p className="text-[11px] mt-0.5 truncate" style={{ ...mono, color: '#64748b' }}>{r.patient}</p>}
                {/* Negative pressure animated indicator */}
                {r.neg ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="relative w-3 h-3 flex-shrink-0">
                      <div className="neg-pressure-anim absolute inset-0" />
                      <div className="absolute inset-1 rounded-full" style={{ background: '#06b6d4', opacity: 0.7 }} />
                    </div>
                    <span className="text-[10px]" style={{ ...mono, color: '#06b6d4' }}>{r.pressure} Pa</span>
                  </div>
                ) : (
                  <p className="text-[10px] mt-1" style={{ ...inter, color: '#3a4f66' }}>= Neutral pressure</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Medical;


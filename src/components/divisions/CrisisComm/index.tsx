// ============================================================================
// Division 11 — Crisis Comm v2
// ============================================================================
import React, { useState, useCallback, useEffect } from 'react';
import { useNFCCStore } from '../../../core/store/useNFCCStore';
import { alarmManager } from '../../../utils/audio';
import type { EmergencyState } from '../../../core/types';

interface SentMsg { id: string; text: string; ts: string; status: 'DELIVERED' | 'SENDING' | 'FAILED'; }
interface AreaCtrl { id: string; name: string; muted: boolean; hasAudio: boolean; }

const TEMPLATES: Record<EmergencyState, string> = {
  NORMAL:     'Tidak ada kedaruratan aktif. Sistem beroperasi normal.',
  LOCKDOWN:   'PERHATIAN: Lockdown aktif. Tetap di posisi masing-masing.',
  EVACUATION: 'EVAKUASI SEGERA! Menuju jalur evakuasi terdekat. Jangan gunakan lift.',
};

const MAX_CHARS = 280;

const AREAS: AreaCtrl[] = [
  { id: 'a-lobby',    name: 'Lobby & Entrance', muted: false, hasAudio: true  },
  { id: 'a-wing-a',  name: 'Wing A',            muted: false, hasAudio: true  },
  { id: 'a-wing-b',  name: 'Wing B',            muted: false, hasAudio: true  },
  { id: 'a-perim',   name: 'Perimeter',         muted: false, hasAudio: false },
  { id: 'a-command', name: 'Command Zone',      muted: false, hasAudio: true  },
];

// PA zone map areas with coordinates
const PA_ZONES = [
  { id: 'lobby',   label: 'Lobby',    x: 10,  y: 60,  w: 50, h: 30, active: true  },
  { id: 'wing-a',  label: 'Wing A',   x: 70,  y: 10,  w: 80, h: 40, active: true  },
  { id: 'wing-b',  label: 'Wing B',   x: 70,  y: 58,  w: 80, h: 40, active: true  },
  { id: 'command', label: 'Command',  x: 160, y: 30,  w: 90, h: 38, active: true  },
  { id: 'perim',   label: 'Perimeter',x: 5,   y: 5,   w: 50, h: 40, active: false },
];

function fmtTime(): string { return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function CrisisComm(): React.JSX.Element {
  const { emergencyMode } = useNFCCStore();
  const [draft, setDraft] = useState(TEMPLATES[emergencyMode]);
  const [sent,  setSent]  = useState<SentMsg[]>([]);
  const [areas, setAreas] = useState<AreaCtrl[]>(AREAS);
  const [siren, setSiren] = useState(false);

  useEffect(() => {
    const isTemplate = Object.values(TEMPLATES).includes(draft);
    if (isTemplate && draft !== TEMPLATES[emergencyMode]) setDraft(TEMPLATES[emergencyMode]);
  }, [emergencyMode, draft]);

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    const msg: SentMsg = { id: `m-${Date.now()}`, text: draft.trim(), ts: fmtTime(), status: 'SENDING' };
    setSent((p) => [msg, ...p]);
    setDraft(TEMPLATES[emergencyMode]);
    // Simulate delivery
    setTimeout(() => {
      setSent((p) => p.map((m) => m.id === msg.id ? { ...m, status: 'DELIVERED' } : m));
    }, 1200);
  }, [draft, emergencyMode]);

  const handleSiren = useCallback(() => {
    if (siren) { alarmManager.stopAlarm(); setSiren(false); }
    else        { alarmManager.playAlarm('evacuation'); setSiren(true); }
  }, [siren]);

  const toggleArea = useCallback((id: string) => {
    setAreas((p) => p.map((a) => a.id === id ? { ...a, muted: !a.muted } : a));
  }, []);

  const modeColor = emergencyMode === 'NORMAL' ? '#10b981' : emergencyMode === 'LOCKDOWN' ? '#f59e0b' : '#f43f5e';
  const charsLeft = MAX_CHARS - draft.length;
  const STATUS_BADGE: Record<SentMsg['status'], string> = { DELIVERED: 'badge badge-ok', SENDING: 'badge badge-info', FAILED: 'badge badge-critical' };
  const STATUS_ICON:  Record<SentMsg['status'], string> = { DELIVERED: '✓✓', SENDING: '...', FAILED: '✗' };

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #9370DB' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 11</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Crisis Communications</h2>
          </div>
          <span className="text-[13px] font-bold shrink-0" style={{ ...inter, color: modeColor }}>{emergencyMode}</span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* Broadcast Message */}
        <div className="glass-card">
          <div className="section-title-bar">Broadcast Message</div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))} rows={3}
            placeholder="Type broadcast message..." style={{ ...inter, fontSize: '12px' }} />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ ...inter, color: '#3a4f66' }}>Auto-populated from emergency state</span>
              <span className="text-[11px] font-semibold" style={{ ...mono, color: charsLeft < 20 ? '#f43f5e' : '#3a4f66' }}>{charsLeft}/{MAX_CHARS}</span>
            </div>
            <button onClick={handleSend} className="btn-holo !text-[12px]" disabled={!draft.trim()}>
              ▶ Send Broadcast
            </button>
          </div>
        </div>

        {/* Siren + PA Zone Map */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card">
            <div className="section-title-bar">Siren Control</div>
            <button onClick={handleSiren} className="w-full py-3 text-[14px] font-semibold transition-all active:scale-98"
              style={{ ...inter, background: siren ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.06)', border: `1px solid ${siren ? 'rgba(244,63,94,0.55)' : 'rgba(244,63,94,0.28)'}`, borderRadius: '3px', color: '#f43f5e', cursor: 'pointer', boxShadow: siren ? '0 0 16px rgba(244,63,94,0.25)' : 'none' }}>
              📢 {siren ? 'STOP SIREN' : 'ACTIVATE SIREN'}
            </button>
            <p className="text-[11px] mt-1.5" style={{ ...inter, color: '#3a4f66' }}>{siren ? '● Evacuation alarm active' : 'Activate public address siren'}</p>
          </div>

          {/* PA zone map SVG */}
          <div className="glass-card">
            <div className="section-title-bar">PA Zone Map</div>
            <svg viewBox="0 0 260 100" style={{ width: '100%', height: '68px' }}>
              {PA_ZONES.map((z) => (
                <g key={z.id}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="3"
                    fill={z.active ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)'}
                    stroke={z.active ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.06)'} strokeWidth="0.8" />
                  <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle"
                    style={{ fontSize: '6.5px', fill: z.active ? '#06b6d4' : '#3a4f66', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {z.label}
                  </text>
                  {z.active && (
                    <circle cx={z.x + z.w - 5} cy={z.y + 5} r="2.5" fill="#10b981" opacity="0.8" />
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* PA Area Mute Controls */}
        <div className="glass-card">
          <div className="section-title-bar">PA System — Area Controls</div>
          <div className="space-y-2">
            {areas.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px]" style={{ ...inter, color: '#94a3b8' }}>{a.name}</span>
                  {a.hasAudio && <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', color: '#06b6d4', ...inter }}>AUDIO</span>}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-semibold" style={{ ...inter, color: a.muted ? '#f43f5e' : '#10b981' }}>{a.muted ? 'MUTED' : 'ACTIVE'}</span>
                  <button onClick={() => toggleArea(a.id)} className="toggle-track"
                    style={{ borderColor: a.muted ? 'rgba(244,63,94,0.45)' : 'rgba(16,185,129,0.38)', background: a.muted ? 'rgba(244,63,94,0.10)' : 'rgba(16,185,129,0.08)' }}
                    aria-label={`${a.muted ? 'Unmute' : 'Mute'} ${a.name}`}>
                    <span className="toggle-thumb" style={{ left: a.muted ? '22px' : '3px', background: a.muted ? '#f43f5e' : '#10b981', boxShadow: `0 0 5px ${a.muted ? 'rgba(244,63,94,0.6)' : 'rgba(16,185,129,0.6)'}` }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sent Messages Log */}
        <div className="glass-card">
          <div className="section-title-bar">Sent Messages</div>
          {sent.length === 0 ? (
            <p className="text-[12px]" style={{ ...inter, color: '#3a4f66' }}>No messages sent yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {sent.map((m) => (
                <div key={m.id} className="py-1.5 px-2 rounded"
                  style={{ borderLeft: '2px solid rgba(6,182,212,0.28)', background: 'rgba(6,182,212,0.04)' }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px]" style={{ ...mono, color: '#06b6d4' }}>{m.ts}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ ...mono, color: m.status === 'DELIVERED' ? '#10b981' : '#f59e0b' }}>{STATUS_ICON[m.status]}</span>
                      <span className={STATUS_BADGE[m.status]}>{m.status}</span>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ ...inter, color: '#94a3b8' }}>{m.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CrisisComm;


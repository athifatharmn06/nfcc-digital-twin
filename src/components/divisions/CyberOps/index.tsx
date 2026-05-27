// ============================================================================
// Division 10 — Cyber Operations v2
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';

type LogLevel = 'INFO' | 'WARN' | 'ALERT';
interface LogEntry    { id: string; ts: string; lvl: LogLevel; msg: string; }
interface AccessAlert { id: string; ts: string; src: string; target: string; method: string; }

const LOG_POOL: { lvl: LogLevel; msg: string }[] = [
  { lvl: 'INFO',  msg: 'Firewall rule update applied — 24 rules active'     },
  { lvl: 'INFO',  msg: 'TLS handshake completed: nfcc-internal.local'       },
  { lvl: 'INFO',  msg: 'DNS: 2,847 queries/min — nominal'                   },
  { lvl: 'WARN',  msg: 'Port scan detected from 10.0.5.88 — 1024 ports/2s' },
  { lvl: 'WARN',  msg: 'Failed auth: admin@10.0.3.42 (4/5 attempts)'       },
  { lvl: 'WARN',  msg: 'Unusual outbound spike: +340% above baseline'       },
  { lvl: 'ALERT', msg: 'IDS signature: CVE-2024-0012 probe BLOCKED'         },
  { lvl: 'ALERT', msg: 'Lateral movement pattern detected — SIEM alert'     },
  { lvl: 'INFO',  msg: 'Encrypted backup verified: integrity PASSED'        },
  { lvl: 'WARN',  msg: 'Honeypot triggered: 192.168.99.14'                  },
  { lvl: 'ALERT', msg: 'Brute force: SSH gateway — source IP blocked'       },
  { lvl: 'INFO',  msg: 'Certificate renewal queued: *.nfcc.internal (14d)'  },
];

const ALERTS: AccessAlert[] = [
  { id: 'a1', ts: '14:23:07', src: '192.168.99.14', target: 'SSH Gateway',  method: 'Brute Force'    },
  { id: 'a2', ts: '14:18:42', src: '10.0.5.88',     target: 'Admin Panel',  method: 'SQL Injection'  },
  { id: 'a3', ts: '14:12:15', src: '172.16.0.33',   target: 'API Endpoint', method: 'Path Traversal' },
  { id: 'a4', ts: '14:05:59', src: '10.0.3.42',     target: 'Auth Service', method: 'Cred. Stuffing' },
];

const LVL_COLOR: Record<LogLevel, string> = { INFO: '#10b981', WARN: '#f59e0b', ALERT: '#f43f5e' };

function mkLog(): LogEntry {
  const t = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
  return { id: `l-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, ts: new Date().toTimeString().slice(0,8), lvl: t.lvl, msg: t.msg };
}

// Sparkline threat rate — last 8 ticks
const MAX_SPARKLINE = 8;

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function CyberOps(): React.JSX.Element {
  const [logs, setLogs]           = useState<LogEntry[]>(() => Array.from({ length: 6 }, mkLog));
  const [threats, setThreats]     = useState(147);
  const [flash, setFlash]         = useState(false);
  const [sparkline, setSparkline] = useState<number[]>(Array.from({ length: MAX_SPARKLINE }, () => Math.floor(Math.random() * 8)));
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const entry = mkLog();
      setLogs((p) => { const n = [...p, entry]; return n.length > 50 ? n.slice(-50) : n; });
      if (entry.lvl === 'ALERT') {
        const inc = Math.floor(Math.random() * 3) + 1;
        setThreats((c) => c + inc);
        setSparkline((prev) => [...prev.slice(1), inc]);
        setFlash(true);
        setTimeout(() => setFlash(false), 800);
      }
    }, 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  const handleBlock = useCallback((id: string) => { console.info('Block:', id); }, []);

  const sparkMax = Math.max(...sparkline, 1);

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #00FF00' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 10</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Cyber Operations</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] uppercase" style={{ ...inter, color: '#64748b' }}>Blocked:</span>
            <span className={`text-[17px] font-semibold tabular-nums transition-all duration-200 ${flash ? 'value-flash scale-125' : ''}`}
              style={{ ...mono, color: '#f43f5e' }}>
              {threats}
            </span>
            {/* Sparkline mini chart */}
            <div className="flex items-end gap-0.5 ml-1" style={{ height: '18px' }}>
              {sparkline.map((v, i) => (
                <div key={i} className="w-1.5 rounded-sm transition-all duration-300"
                  style={{ height: `${Math.max(2, (v / sparkMax) * 18)}px`, background: v >= 3 ? '#f43f5e' : v >= 1 ? '#f59e0b' : 'rgba(244,63,94,0.25)' }} />
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

        {/* Terminal */}
        <div className="terminal-bg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(16,185,129,0.10)' }}>
            <span className="text-[11px] uppercase tracking-wider" style={{ ...mono, color: 'rgba(16,185,129,0.50)' }}>NFCC::SIEM Terminal</span>
            <div className="flex items-center gap-1.5">
              <span className="live-dot" style={{ width: '7px', height: '7px' }} />
              <span className="text-[11px]" style={{ ...mono, color: '#10b981' }}>LIVE</span>
            </div>
          </div>
          <div ref={termRef} className="overflow-y-auto p-2.5 space-y-px" style={{ maxHeight: '160px' }}>
            {logs.map((e, ei) => (
              <div key={e.id} className="flex gap-2 text-[12px] leading-relaxed" style={mono}>
                <span className="shrink-0" style={{ color: '#3a4f66', width: '56px' }}>[{e.ts}]</span>
                <span className="shrink-0 font-semibold" style={{ color: LVL_COLOR[e.lvl], width: '40px' }}>[{e.lvl}]</span>
                <span style={{ color: e.lvl === 'ALERT' ? '#fca5a5' : e.lvl === 'WARN' ? '#fde68a' : '#86efac' }}>{e.msg}</span>
                {/* Blinking cursor on last line */}
                {ei === logs.length - 1 && <span className="animate-blink" style={{ color: '#10b981' }}>█</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Access Alerts */}
        <div className="glass-card">
          <div className="section-title-bar">Unauthorized Access Alerts</div>
          <div className="space-y-1.5">
            {ALERTS.map((a) => (
              <div key={a.id} className="p-2 rounded" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.16)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold" style={{ ...inter, color: '#f43f5e' }}>{a.method}</span>
                  <span className="text-[11px]" style={{ ...mono, color: '#475569' }}>{a.ts}</span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px]" style={{ ...mono, color: '#64748b' }}>Src: <span style={{ color: '#f59e0b' }}>{a.src}</span></span>
                  <span className="text-[11px]" style={{ ...mono, color: '#64748b' }}>→ <span style={{ color: '#06b6d4' }}>{a.target}</span></span>
                </div>
                <button onClick={() => handleBlock(a.id)} className="btn-danger w-full !text-[11px] !py-0.5">BLOCK SOURCE</button>
              </div>
            ))}
          </div>
        </div>

        {/* Network Zones — IEC 62443 with animated connections */}
        <div className="glass-card">
          <div className="section-title-bar">IEC 62443 — Network Zones</div>
          <div className="flex flex-col gap-0.5 py-1">
            {[
              { label: 'ZONE 1 — DMZ',          sub: 'MONITORING',        color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
              { label: 'ZONE 2 — INTERNAL LAN',  sub: 'SECURE',            color: '#10b981', border: 'rgba(16,185,129,0.22)' },
              { label: 'ZONE 3 — CRITICAL OT',   sub: 'SECURE · ISOLATED', color: '#06b6d4', border: 'rgba(6,182,212,0.28)' },
            ].map((z, i) => (
              <React.Fragment key={z.label}>
                <div className="py-2 px-3 rounded text-center relative overflow-hidden"
                  style={{ background: 'rgba(10,20,40,0.6)', border: `1px solid ${z.border}` }}>
                  {/* Animated connection line overlay */}
                  <div className="data-bar absolute top-0 left-0 right-0" style={{ height: '1px', opacity: 0.5 }} />
                  <p className="text-[12px] font-semibold" style={{ ...inter, color: z.color }}>{z.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ ...inter, color: '#475569' }}>{z.sub}</p>
                </div>
                {i < 2 && (
                  <div className="flex flex-col items-center py-0.5" style={{ ...mono, color: '#3a4f66', fontSize: '8px' }}>
                    <span>│</span>
                    <span className="px-1.5 rounded" style={{ border: '1px solid rgba(6,182,212,0.16)', color: '#06b6d4', fontSize: '7px' }}>Conduit</span>
                    <span>│</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CyberOps;


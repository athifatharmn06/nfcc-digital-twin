// ============================================================================
// NFCC — HeaderBar v2 — Major upgrade
// ============================================================================
import { type ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useNFCCStore } from '../../core/store/useNFCCStore';
import type { EmergencyState } from '../../core/types';
import { NotificationPanel } from '../ui/NotificationPanel';

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

const EMERGENCY_CONFIG: Record<EmergencyState, { dotColor: string; textColor: string; bgColor: string; borderColor: string; label: string; }> = {
  NORMAL:     { dotColor: '#10b981', textColor: '#10b981', bgColor: 'rgba(16,185,129,0.08)',  borderColor: 'rgba(16,185,129,0.30)',  label: 'NORMAL'     },
  LOCKDOWN:   { dotColor: '#f43f5e', textColor: '#f43f5e', bgColor: 'rgba(244,63,94,0.12)',  borderColor: 'rgba(244,63,94,0.50)',   label: 'LOCKDOWN'   },
  EVACUATION: { dotColor: '#f59e0b', textColor: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.50)',  label: 'EVACUATION' },
};

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

import React from 'react';

export function HeaderBar(): ReactNode {
  const emergencyMode = useNFCCStore((s) => s.emergencyMode);
  const notifications = useNFCCStore((s) => s.notifications);
  const isMuted       = useNFCCStore((s) => s.isMuted);
  const isDemoMode    = useNFCCStore((s) => s.isDemoMode);
  const toggleMute    = useNFCCStore((s) => s.toggleMute);
  const setDemoMode   = useNFCCStore((s) => s.setDemoMode);

  const [now, setNow] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDemo = useCallback(() => setDemoMode(!isDemoMode), [isDemoMode, setDemoMode]);
  const toggleNotifications = useCallback(() => setShowNotifications((v) => !v), []);

  const ec = EMERGENCY_CONFIG[emergencyMode];
  const unread = notifications.length;
  const isAlert = emergencyMode !== 'NORMAL';

  return (
    <div className="flex h-full items-center justify-between px-3 gap-2" style={{ minWidth: 0 }}>

      {/* ── LEFT: Logo + divider + clock ── */}
      <div className="flex items-center gap-2 shrink-0">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
          <path d="M14 2L4 7v8c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V7L14 2Z"
            fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="1.2" />
          <path d="M11 14l2 2 4-4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div style={{ minWidth: 0 }}>
          <div className="nfcc-logo text-sm font-bold tracking-widest leading-tight text-gradient-cyan" style={{ fontSize: '14px' }}>
            NFCC
          </div>
          <div className="text-[10px] text-slate-500 tracking-wider leading-tight" style={inter}>
            Nusantara Fortified Command Complex
          </div>
        </div>
        <div className="h-6 w-px mx-1 shrink-0" style={{ background: 'rgba(6,182,212,0.15)' }} />
        {/* Live system time */}
        <div className="hidden lg:flex flex-col shrink-0">
          <span className="text-[15px] font-semibold tabular-nums" style={{ ...mono, color: '#06b6d4' }}>{formatTime(now)}</span>
          <span className="text-[10px] tabular-nums" style={{ ...mono, color: '#475569' }}>{formatDate(now)}</span>
        </div>
      </div>

      {/* ── CENTER-LEFT: Emergency badge + systems + alarms ── */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {/* Emergency badge with pulse ring on alarm */}
        <div className="relative flex items-center">
          {isAlert && (
            <>
              <span className="absolute inset-0 rounded" style={{ border: `1px solid ${ec.borderColor}`, animation: 'radiatingPulse 1.5s ease-out infinite', pointerEvents: 'none' }} />
              <span className="absolute inset-0 rounded" style={{ border: `1px solid ${ec.borderColor}`, animation: 'radiatingPulse 1.5s ease-out infinite', animationDelay: '0.75s', pointerEvents: 'none' }} />
            </>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded" style={{ background: ec.bgColor, border: `1px solid ${ec.borderColor}`, position: 'relative', zIndex: 1 }}>
            <span className={`dot ${isAlert ? 'animate-pulse' : ''}`} style={{ background: ec.dotColor, boxShadow: `0 0 6px ${ec.dotColor}`, width: '8px', height: '8px' }} />
            <span className="text-[13px] font-bold tracking-widest" style={{ ...inter, color: ec.textColor }}>{ec.label}</span>
          </div>
        </div>

        <div className="h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Systems online */}
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] uppercase tracking-widest" style={{ ...inter, color: '#3a4f66' }}>Systems</span>
          <span className="text-[13px] font-semibold" style={{ ...mono, color: '#10b981' }}>ONLINE 11/11</span>
        </div>

        <div className="h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Active alarms */}
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] uppercase tracking-widest" style={{ ...inter, color: '#3a4f66' }}>Active Alarms</span>
          <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: unread > 0 ? '#f43f5e' : '#10b981' }}>
            {unread > 0 ? `⚠ ${unread}` : '✓ NONE'}
          </span>
        </div>
      </div>

      {/* ── CENTER-RIGHT: Node count + sparkline + uptime ── */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <div className="h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Node count + animated sparkline dots */}
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] uppercase tracking-widest" style={{ ...inter, color: '#3a4f66' }}>Live Nodes</span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: '#06b6d4' }}>5,000</span>
            <div className="flex items-end gap-0.5 ml-1" style={{ height: '10px' }}>
              {[3,5,4,7,5,6,4,8,6,5].map((h, i) => (
                <div key={i} className="w-0.5 rounded-full" style={{ height: `${h}px`, background: 'rgba(6,182,212,0.6)', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Uptime */}
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] uppercase tracking-widest" style={{ ...inter, color: '#3a4f66' }}>Uptime</span>
          <span className="text-[13px] font-semibold" style={{ ...mono, color: '#10b981' }}>99.97%</span>
        </div>
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {/* Demo */}
        <button
          className={`btn-holo !py-1.5 !text-[11px] ${isDemoMode ? '!border-green-500/50 !text-green-400' : ''}`}
          style={{ whiteSpace: 'nowrap', padding: '6px 10px', minWidth: '64px' }}
          onClick={handleDemo}
          aria-label={isDemoMode ? 'Stop Demo' : 'Start Demo'}
          aria-pressed={isDemoMode}
        >
          {isDemoMode ? <>■ STOP</> : <>▶ DEMO</>}
        </button>

        {/* Mute */}
        <button
          className={`btn-holo !px-2 !py-1.5 ${isMuted ? '!border-red-500/40 !text-red-400' : ''}`}
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-pressed={isMuted}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {/* Volume icon — X when muted, speaker when not */}
          {isMuted ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>

        {/* Notifications */}
        <button
          ref={notifButtonRef}
          className={`btn-holo relative !px-2 !py-1.5 ${showNotifications ? '!border-cyan-400/50 !bg-cyan-500/10' : ''}`}
          onClick={toggleNotifications}
          aria-label={`Notifikasi${unread > 0 ? ` (${unread})` : ''}`}
          aria-expanded={showNotifications}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Notification Panel dropdown */}
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </div>
    </div>
  );
}


// ============================================================================
// NFCC — NotificationPanel
// ============================================================================
// Dropdown panel shown when the notification bell is clicked.
// Shows all notifications with: type badge, title, message, division, time.
// Supports dismiss-one and clear-all.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { useNFCCStore } from '../../core/store/useNFCCStore';
import type { Notification } from '../../core/types';

const mono:  React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

const TYPE_CONFIG: Record<Notification['type'], { color: string; bg: string; border: string; icon: string }> = {
  INFO:     { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)',   icon: 'ℹ' },
  WARNING:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.28)',  icon: '⚠' },
  CRITICAL: { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   border: 'rgba(244,63,94,0.30)',   icon: '🔴' },
};
function formatTimestamp(ts: number): string {
  const now  = Date.now();
  const diff = now - ts;
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec  / 60);
  const hr   = Math.floor(min  / 60);

  if (hr  > 0) return `${hr}j ${min % 60}m lalu`;
  if (min > 0) return `${min}m ${sec % 60}d lalu`;
  return `${sec}d lalu`;
}

function formatFullTime(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const DIVISION_NAMES: Record<number, string> = {
  1: 'Komando Utama', 2: 'Keamanan Dalam', 3: 'Pertahanan Perimeter',
  4: 'Ketenagalistrikan', 5: 'HVAC', 6: 'Keselamatan Kebakaran',
  7: 'Plumbing', 8: 'Layanan Medis', 9: 'Logistik',
  10: 'Cyber Ops', 11: 'Komunikasi Krisis',
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps): React.JSX.Element {
  const notifications    = useNFCCStore((s) => s.notifications);
  const dismissNotification = useNFCCStore((s) => s.dismissNotification);
  const panelRef         = useRef<HTMLDivElement>(null);

  // Close on click outside — use a small delay on mount so the
  // triggering click (on the bell button) doesn't immediately close us
  useEffect(() => {
    let mounted = false;
    const timeout = setTimeout(() => { mounted = true; }, 150);

    function handleClick(e: MouseEvent): void {
      if (!mounted) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const clearAll = (): void => {
    [...notifications].forEach((n) => dismissNotification(n.id));
  };

  const sorted = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '62px',
        right: '12px',
        width: '380px',
        maxHeight: '500px',
        zIndex: 500,
        background: 'rgba(4, 8, 20, 0.97)',
        border: '1px solid rgba(6,182,212,0.22)',
        borderRadius: '6px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.08)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...inter, fontSize: '11px', fontWeight: 600, color: '#dde6f0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Notifikasi
          </span>
          {notifications.length > 0 && (
            <span style={{
              ...mono, fontSize: '10px', fontWeight: 600,
              background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
              color: '#f43f5e', borderRadius: '3px', padding: '1px 6px',
            }}>
              {notifications.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                ...inter, fontSize: '10px', color: '#475569', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '3px', padding: '2px 8px',
              }}
            >
              Hapus Semua
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              ...inter, fontSize: '12px', color: '#475569', cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '3px', padding: '1px 7px', lineHeight: 1.4,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔕</div>
            <p style={{ ...inter, fontSize: '13px', color: '#3a4f66' }}>Tidak ada notifikasi</p>
          </div>
        ) : (
          sorted.map((notif) => {
            const tc = TYPE_CONFIG[notif.type];
            return (
              <div
                key={notif.id}
                style={{
                  margin: '0 8px 4px',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  background: tc.bg,
                  border: `1px solid ${tc.border}`,
                  position: 'relative',
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Type badge + division */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px' }}>{tc.icon}</span>
                    <span style={{
                      ...inter, fontSize: '10px', fontWeight: 700,
                      color: tc.color, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                      {notif.type}
                    </span>
                    <span style={{ ...mono, fontSize: '9px', color: '#3a4f66' }}>
                      DIV {String(notif.division).padStart(2, '0')} — {DIVISION_NAMES[notif.division] ?? `Division ${notif.division}`}
                    </span>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => dismissNotification(notif.id)}
                    title="Hapus notifikasi ini"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#3a4f66', fontSize: '13px', lineHeight: 1, padding: '0 2px',
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Title */}
                <p style={{
                  ...inter, fontSize: '13px', fontWeight: 600,
                  color: '#dde6f0', marginBottom: '3px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {notif.title}
                </p>

                {/* Message */}
                <p style={{
                  ...inter, fontSize: '11px', color: '#64748b', lineHeight: 1.5,
                  marginBottom: '6px',
                }}>
                  {notif.message}
                </p>

                {/* Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ ...mono, fontSize: '10px', color: '#3a4f66' }}>
                    {formatTimestamp(notif.timestamp)}
                  </span>
                  <span style={{ ...mono, fontSize: '9px', color: '#2a3a4a' }}>
                    {formatFullTime(notif.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '6px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <p style={{ ...inter, fontSize: '10px', color: '#2a3a4a', textAlign: 'center' }}>
          {notifications.length > 0
            ? `${notifications.length} notifikasi aktif — klik ✕ untuk hapus`
            : 'Semua notifikasi sudah dibaca'}
        </p>
      </div>
    </div>
  );
}

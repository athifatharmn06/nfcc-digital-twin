import { type ReactNode } from 'react';
import { useNFCCStore } from '../../core/store/useNFCCStore';

interface AppLayoutProps { sidebar: ReactNode; header: ReactNode; scene: ReactNode; dashboard: ReactNode; }

export function AppLayout({ sidebar, header, scene, dashboard }: AppLayoutProps): ReactNode {
  const emergencyMode = useNFCCStore((s) => s.emergencyMode);
  const isEmergency   = emergencyMode !== 'NORMAL';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-grid" style={{ backgroundColor: '#060c18' }}>
      <div className="scanlines" aria-hidden="true" />
      {isEmergency && <div className="emergency-overlay" aria-hidden="true" />}

      <div className="grid h-full w-full" style={{ gridTemplateRows: '56px 1fr', gridTemplateColumns: '190px 1fr 420px' }}>

        {/* ── Header ── */}
        <header
          className={`col-span-3 glass-panel relative overflow-hidden ${
            emergencyMode === 'LOCKDOWN'   ? 'header-emergency-lockdown'   :
            emergencyMode === 'EVACUATION' ? 'header-emergency-evacuation' : ''
          }`}
          style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
        >
          {header}
          {/* Animated accent line at bottom of header */}
          <div className="header-accent-line absolute bottom-0 left-0 right-0" />
          {/* Corner accents */}
          <div className="corner-accent corner-accent-tl" />
          <div className="corner-accent corner-accent-tr" />
        </header>

        {/* ── Sidebar ── */}
        <aside
          className="glass-panel overflow-y-auto overflow-x-hidden relative"
          style={{ borderTop: 'none', borderLeft: 'none', borderBottom: 'none', borderRadius: 0, zIndex: 20,
            borderRight: '1px solid rgba(6,182,212,0.12)',
          }}
        >
          {sidebar}
        </aside>

        {/* ── Main scene ── */}
        <main className="relative overflow-hidden" style={{ zIndex: 10 }}>
          {scene}
          {/* System heartbeat indicator */}
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10"
            style={{ pointerEvents: 'none' }}
          >
            <span className="live-dot live-dot-cyan" />
            <span
              className="text-[10px] uppercase tracking-widest heartbeat"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(6,182,212,0.4)' }}
            >
              NFCC SYS LIVE
            </span>
          </div>
          {/* Corner accents for main area */}
          <div className="corner-accent corner-accent-tl" style={{ top: '8px', left: '8px' }} />
          <div className="corner-accent corner-accent-br" style={{ bottom: '8px', right: '8px' }} />
        </main>

        {/* ── Dashboard panel ── */}
        <section
          className="glass-panel overflow-y-auto overflow-x-hidden relative"
          style={{ borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: 0, zIndex: 20, minWidth: 0,
            borderLeft: '1px solid rgba(6,182,212,0.12)',
          }}
        >
          {dashboard}
        </section>
      </div>
    </div>
  );
}


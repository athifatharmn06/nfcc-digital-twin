// ============================================================================
// NFCC — DivisionSidebar v2 — Enhanced with groupings, health bars, sensor counts
// ============================================================================
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNFCCStore } from '../../core/store/useNFCCStore';
import { DIVISIONS } from '../../core/constants/divisions';
import type { DivisionId } from '../../core/types';

const CATEGORY_GROUPS = [
  { label: 'COMMAND',     ids: [1, 2, 3]        },
  { label: 'ENGINEERING', ids: [4, 5, 6, 7]     },
  { label: 'SERVICES',    ids: [8, 9, 10, 11]   },
];

// Fake sensor counts per division
const SENSOR_COUNTS: Record<number, number> = {
  1: 450, 2: 480, 3: 520, 4: 410, 5: 395, 6: 440, 7: 370, 8: 360, 9: 340, 10: 390, 11: 345,
};
// Fake health percentages
const HEALTH: Record<number, number> = {
  1: 98, 2: 94, 3: 87, 4: 99, 5: 95, 6: 91, 7: 88, 8: 97, 9: 93, 10: 96, 11: 99,
};
const healthColor = (h: number): string =>
  h > 90 ? '#10b981' : h > 75 ? '#f59e0b' : '#f43f5e';

export function DivisionSidebar(): ReactNode {
  const activeDivision    = useNFCCStore((s) => s.activeDivision);
  const setActiveDivision = useNFCCStore((s) => s.setActiveDivision);
  const emergencyMode     = useNFCCStore((s) => s.emergencyMode);
  const isEmergency       = emergencyMode !== 'NORMAL';

  const divMap = Object.fromEntries(DIVISIONS.map((d) => [d.id, d]));
  let idx = 0;

  return (
    <nav className="flex flex-col h-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} aria-label="Division navigation">

      {/* Category groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 pt-2 pb-2">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="div-category-label">{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.ids.map((id) => {
                const div = divMap[id];
                if (!div) return null;
                const isActive = activeDivision === div.id;
                const health = HEALTH[div.id] ?? 99;
                const sensors = SENSOR_COUNTS[div.id] ?? 400;
                const currentIdx = idx++;
                return (
                  <motion.button
                    key={div.id}
                    onClick={() => setActiveDivision(div.id as DivisionId)}
                    aria-label={div.name}
                    aria-current={isActive ? 'page' : undefined}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: currentIdx * 0.025, duration: 0.18 }}
                    style={{
                      display: 'flex', flexDirection: 'column', width: '100%',
                      padding: '5px 7px 5px 8px', borderRadius: '3px',
                      border: '1px solid transparent',
                      borderLeft: isActive ? '2px solid #06b6d4' : '2px solid transparent',
                      background: isActive
                        ? 'rgba(6,182,212,0.09)'
                        : 'transparent',
                      cursor: 'pointer', textAlign: 'left', minWidth: 0, overflow: 'hidden',
                      transition: 'all 0.12s',
                      boxShadow: isActive ? '0 0 12px rgba(6,182,212,0.08) inset' : 'none',
                    }}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-1.5 w-full">
                      {/* Number */}
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 600,
                        width: '16px', textAlign: 'center', flexShrink: 0,
                        color: isActive ? '#06b6d4' : '#3a4f66',
                      }}>
                        {String(div.id).padStart(2, '0')}
                      </span>
                      {/* Icon */}
                      <span className="text-[13px] shrink-0" role="img" aria-hidden="true">{div.icon}</span>
                      {/* Name */}
                      <span style={{
                        flex: 1, fontSize: '10px', fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#dde6f0' : '#64748b',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                        textShadow: isActive ? '0 0 8px rgba(6,182,212,0.3)' : 'none',
                      }}>
                        {div.name}
                      </span>
                      {/* Status dot */}
                      <span className={`dot shrink-0 ${isEmergency ? 'dot-red animate-pulse' : isActive ? 'dot-cyan' : 'dot-gray'}`}
                        style={{ width: '5px', height: '5px' }} />
                    </div>
                    {/* Sub row: health bar + sensor count */}
                    <div className="flex items-center gap-1.5 mt-1 pl-5">
                      <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden', minWidth: 0 }}>
                        <div className="div-health-bar" style={{ width: `${health}%`, background: healthColor(health) }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: '#3a4f66', flexShrink: 0 }}>
                        {sensors}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <div className="section-sep mx-1 mt-1" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Active sensor count */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <span className="live-dot live-dot-cyan" style={{ width: '7px', height: '7px' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: '#06b6d4', letterSpacing: '0.08em' }}>
            5,000 ACTIVE
          </span>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-center" style={{ color: '#2a3a4a', fontFamily: 'Inter, system-ui, sans-serif' }}>
          ISO 16484 · IEC 62443 · NFPA 3000
        </p>
      </div>
    </nav>
  );
}


// ============================================================================
// NFCC — NodeLegend
// ============================================================================
// Compact legend overlaid on the 3D scene showing sensor type colors + counts.
// ============================================================================

import React, { useState } from 'react';

const LEGEND_ITEMS = [
  { type: 'TEMPERATURE',     label: 'Temp',       color: '#f97316' },
  { type: 'HUMIDITY',        label: 'Humidity',   color: '#38bdf8' },
  { type: 'CO2',             label: 'CO₂',         color: '#34d399' },
  { type: 'ELECTRICAL_LOAD', label: 'Elec.',      color: '#fde047' },
  { type: 'WATER_LEVEL',     label: 'Water',      color: '#3b82f6' },
  { type: 'PIR_MOTION',      label: 'PIR',        color: '#4ade80' },
  { type: 'SMOKE',           label: 'Smoke',      color: '#f87171' },
  { type: 'VIBRATION',       label: 'Vibration',  color: '#fb923c' },
  { type: 'DOOR_CONTACT',    label: 'Door',       color: '#e879f9' },
];

const STATUS_ITEMS = [
  { label: 'Alarm',      color: '#f43f5e' },
  { label: 'Fault',      color: '#f59e0b' },
  { label: 'Override',   color: '#a78bfa' },
];

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function NodeLegend(): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '10px',
      zIndex: 100,
      width: collapsed ? '36px' : '160px',
      background: 'rgba(4,8,18,0.88)',
      border: '1px solid rgba(6,182,212,0.18)',
      borderRadius: '5px',
      backdropFilter: 'blur(8px)',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 8px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {!collapsed && (
          <span style={{ ...inter, fontSize:'9px', color:'#475569', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            Node Types
          </span>
        )}
        <span style={{ ...mono, fontSize:'10px', color:'#06b6d4', marginLeft: collapsed ? 'auto' : undefined }}>
          {collapsed ? '◈' : '▾'}
        </span>
      </div>

      {!collapsed && (
        <div style={{ padding: '6px 8px 8px' }}>
          {/* Sensor types */}
          {LEGEND_ITEMS.map(({ label, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: color, boxShadow: `0 0 4px ${color}80`,
              }} />
              <span style={{ ...inter, fontSize:'9px', color:'#94a3b8' }}>{label}</span>
            </div>
          ))}

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '6px 0 4px' }} />

          {/* Status overrides */}
          <p style={{ ...inter, fontSize:'8px', color:'#3a4f66', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'3px' }}>
            Status Override
          </p>
          {STATUS_ITEMS.map(({ label, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, background:color }} />
              <span style={{ ...inter, fontSize:'9px', color:'#94a3b8' }}>{label}</span>
            </div>
          ))}

          {/* Drone indicator */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', margin:'5px 0 3px' }} />
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'10px' }}>🚁</span>
            <span style={{ ...inter, fontSize:'9px', color:'#94a3b8' }}>Drone UAV</span>
          </div>
        </div>
      )}
    </div>
  );
}

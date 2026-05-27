// ============================================================================
// NFCC — NodeTooltip
// ============================================================================
// HTML overlay tooltip shown on hover over a sensor node.
// Displays full BIM metadata: type, value, status, vendor, install date,
// criticality, ISO reference.
// ============================================================================

import React from 'react';
import type { SensorNode } from '../core/types/index.ts';

interface NodeTooltipProps {
  node: SensorNode;
  x:    number;
  y:    number;
}

const STATUS_COLOR: Record<string, string> = {
  inAlarm:    '#f43f5e',
  fault:      '#f59e0b',
  overridden: '#a78bfa',
  normal:     '#10b981',
};

const TYPE_COLOR: Record<string, string> = {
  TEMPERATURE:     '#f97316',
  HUMIDITY:        '#38bdf8',
  CO2:             '#34d399',
  PRESSURE:        '#a78bfa',
  ELECTRICAL_LOAD: '#fde047',
  VOLTAGE:         '#fbbf24',
  POWER_FACTOR:    '#d97706',
  WATER_LEVEL:     '#3b82f6',
  FLOW_RATE:       '#06b6d4',
  PH:              '#c084fc',
  PIR_MOTION:      '#4ade80',
  DOOR_CONTACT:    '#e879f9',
  VIBRATION:       '#fb923c',
  SMOKE:           '#f87171',
  HEAT:            '#ef4444',
  SEISMIC:         '#e2e8f0',
};

const TYPE_UNIT: Record<string, string> = {
  TEMPERATURE:     '°C',
  HUMIDITY:        '%',
  CO2:             'ppm',
  PRESSURE:        'Pa',
  ELECTRICAL_LOAD: 'kW',
  VOLTAGE:         'V',
  POWER_FACTOR:    '',
  WATER_LEVEL:     '%',
  FLOW_RATE:       'L/min',
  PH:              'pH',
  PIR_MOTION:      '',
  DOOR_CONTACT:    '',
  VIBRATION:       'mm/s',
  SMOKE:           '%obs',
  HEAT:            '°C',
  SEISMIC:         'gal',
};

const CRIT_COLOR: Record<string, string> = {
  LOW:      '#64748b',
  MEDIUM:   '#38bdf8',
  HIGH:     '#f59e0b',
  CRITICAL: '#f43f5e',
};

function getStatusLabel(sf: SensorNode['statusFlags']): { label: string; color: string } {
  if (sf.inAlarm)    return { label: 'IN ALARM',    color: STATUS_COLOR.inAlarm    };
  if (sf.fault)      return { label: 'FAULT',       color: STATUS_COLOR.fault      };
  if (sf.overridden) return { label: 'OVERRIDDEN',  color: STATUS_COLOR.overridden };
  return                    { label: 'NORMAL',      color: STATUS_COLOR.normal     };
}

export const NodeTooltip = React.memo(function NodeTooltip({ node, x, y }: NodeTooltipProps): React.JSX.Element {
  const status = getStatusLabel(node.statusFlags);
  const typeColor = TYPE_COLOR[node.objectType] ?? '#06b6d4';
  const unit      = TYPE_UNIT[node.objectType]  ?? '';
  const critColor = CRIT_COLOR[node.metadata.criticalityLevel] ?? '#64748b';

  // Clamp tooltip so it doesn't go off screen
  const left = Math.min(x + 12, window.innerWidth  - 280);
  const top  = Math.min(y - 12, window.innerHeight - 240);

  const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
  const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 300,
        width: '260px',
        background: 'rgba(4,8,18,0.97)',
        border: `1px solid ${typeColor}55`,
        borderRadius: '5px',
        boxShadow: `0 4px 24px rgba(0,0,0,0.7), 0 0 12px ${typeColor}22`,
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${typeColor}, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ ...mono, fontSize:'9px', color: typeColor, letterSpacing:'0.12em', textTransform:'uppercase' }}>
            {node.objectType.replace(/_/g, ' ')}
          </span>
          <span style={{
            ...inter, fontSize:'9px', fontWeight:600, padding:'1px 6px', borderRadius:'3px',
            background:`${status.color}18`, border:`1px solid ${status.color}44`, color: status.color,
            letterSpacing:'0.06em', textTransform:'uppercase',
          }}>
            {status.label}
          </span>
        </div>
        <p style={{ ...mono, fontSize:'11px', color:'#dde6f0', fontWeight:600, marginTop:'3px' }}>
          {node.objectName}
        </p>
        <p style={{ ...mono, fontSize:'9px', color:'#475569', marginTop:'1px' }}>
          {node.id}
        </p>
      </div>

      {/* Live value */}
      <div style={{ padding:'8px 12px 6px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'8px' }}>
        <div>
          <p style={{ ...inter, fontSize:'9px', color:'#475569', marginBottom:'2px', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Present Value
          </p>
          <p style={{ ...mono, fontSize:'18px', fontWeight:700, color: typeColor, lineHeight:1 }}>
            {node.presentValue.toFixed(1)}<span style={{ fontSize:'11px', marginLeft:'2px', color:'#64748b' }}>{unit}</span>
          </p>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <p style={{ ...inter, fontSize:'9px', color:'#475569', marginBottom:'2px', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Zone
          </p>
          <p style={{ ...mono, fontSize:'11px', color:'#94a3b8' }}>{node.zone}</p>
        </div>
      </div>

      {/* BIM Metadata */}
      <div style={{ padding:'6px 12px' }}>
        {[
          { label:'Vendor',        value: node.metadata.vendor                    },
          { label:'Installed',     value: node.metadata.installDate               },
          { label:'Maintenance',   value: `Every ${node.metadata.maintenanceInterval}d` },
          { label:'ISO Reference', value: node.metadata.isoReference              },
        ].map(({ label, value }) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ ...inter, fontSize:'9px', color:'#475569' }}>{label}</span>
            <span style={{ ...mono, fontSize:'9px', color:'#94a3b8' }}>{value}</span>
          </div>
        ))}
        {/* Criticality */}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'3px 0 0' }}>
          <span style={{ ...inter, fontSize:'9px', color:'#475569' }}>Criticality</span>
          <span style={{ ...mono, fontSize:'9px', fontWeight:700, color: critColor }}>
            {node.metadata.criticalityLevel}
          </span>
        </div>
      </div>
    </div>
  );
});

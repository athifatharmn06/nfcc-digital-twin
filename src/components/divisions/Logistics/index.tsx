// ============================================================================
// Division 9 — Logistics & Operations v2
// ============================================================================
import React, { useState, useCallback } from 'react';

type InvStatus = 'OK' | 'LOW' | 'CRITICAL';
type WOStatus  = 'pending' | 'in-progress' | 'completed';

interface InvItem    { id: string; name: string; stock: number; min: number; max: number; status: InvStatus; autoRestock: boolean; }
interface CleanEntry { id: string; room: string; time: string; prio: 'normal' | 'high'; }
interface WorkOrder  { id: string; title: string; by: string; status: WOStatus; date: string; }

const INV_DATA: InvItem[] = [
  { id: 'i01', name: 'Tissue Roll (Box)',  stock: 120, min: 50,  max: 200, status: 'OK',       autoRestock: false },
  { id: 'i02', name: 'Hand Soap (Liter)', stock: 45,  min: 30,  max: 100, status: 'OK',       autoRestock: false },
  { id: 'i03', name: 'Light Bulbs (LED)', stock: 12,  min: 20,  max: 80,  status: 'LOW',      autoRestock: true  },
  { id: 'i04', name: 'HVAC Filters',      stock: 3,   min: 10,  max: 40,  status: 'CRITICAL', autoRestock: true  },
  { id: 'i05', name: 'Disinfectant (L)',  stock: 60,  min: 25,  max: 120, status: 'OK',       autoRestock: false },
  { id: 'i06', name: 'Trash Bags (Roll)', stock: 18,  min: 20,  max: 60,  status: 'LOW',      autoRestock: false },
  { id: 'i07', name: 'Floor Cleaner (L)', stock: 8,   min: 15,  max: 50,  status: 'CRITICAL', autoRestock: true  },
  { id: 'i08', name: 'Paper Towels',      stock: 90,  min: 40,  max: 160, status: 'OK',       autoRestock: false },
  { id: 'i09', name: 'Battery AA (Pack)', stock: 25,  min: 10,  max: 60,  status: 'OK',       autoRestock: false },
  { id: 'i10', name: 'Mop Heads',         stock: 5,   min: 8,   max: 30,  status: 'LOW',      autoRestock: false },
];

const CLEAN: CleanEntry[] = [
  { id: 'c1', room: 'Command Center L1',  time: '06:00', prio: 'high'   },
  { id: 'c2', room: 'Lobby & Reception',  time: '05:30', prio: 'normal' },
  { id: 'c3', room: 'Wing A Corridors',   time: '07:00', prio: 'normal' },
  { id: 'c4', room: 'Wing B Corridors',   time: '07:30', prio: 'normal' },
  { id: 'c5', room: 'Medical Bay',        time: '06:30', prio: 'high'   },
  { id: 'c6', room: 'Server Room Perim.', time: '08:00', prio: 'high'   },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'w1', title: 'Replace HVAC filter — Zone B3',    by: 'Tech. Adi',  status: 'in-progress', date: '2025-01-15' },
  { id: 'w2', title: 'Restock soap dispensers — Wing A', by: 'Staff Rina', status: 'pending',     date: '2025-01-15' },
  { id: 'w3', title: 'Fix flickering light — Corr. C2',  by: 'Tech. Budi', status: 'completed',   date: '2025-01-14' },
  { id: 'w4', title: 'Deep clean — Medical Bay',         by: 'Staff Dewi', status: 'pending',     date: '2025-01-15' },
  { id: 'w5', title: 'Fire extinguisher refill',         by: 'Tech. Adi',  status: 'in-progress', date: '2025-01-14' },
];

const INV_BADGE: Record<InvStatus, string> = { OK: 'badge badge-ok', LOW: 'badge badge-warn', CRITICAL: 'badge badge-critical' };
const WO_BADGE:  Record<WOStatus, string>  = { pending: 'badge badge-warn', 'in-progress': 'badge badge-info', completed: 'badge badge-ok' };
const INV_BAR: Record<InvStatus, string>   = { OK: '#06b6d4', LOW: '#f59e0b', CRITICAL: '#f43f5e' };

const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' };
const inter: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif' };

export function Logistics(): React.JSX.Element {
  const [inv,    setInv]    = useState(INV_DATA);
  const [sched]             = useState(CLEAN);
  const [orders]            = useState(WORK_ORDERS);

  const critCount = inv.filter((i) => i.status === 'CRITICAL').length;
  const lowCount  = inv.filter((i) => i.status === 'LOW').length;

  const toggleAutoRestock = useCallback((id: string) => {
    setInv((p) => p.map((item) => item.id === id ? { ...item, autoRestock: !item.autoRestock } : item));
  }, []);

  return (
    <div className="flex flex-col h-full bg-transparent" style={inter}>
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #DDA0DD' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ ...mono, color: '#4a6080' }}>Division 09</p>
            <h2 className="text-[15px] font-semibold mt-0.5 text-gradient-title">Logistics & Ops</h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {critCount > 0 && <span className="badge badge-critical animate-pulse">{critCount} CRIT</span>}
            {lowCount  > 0 && <span className="badge badge-warn">{lowCount} LOW</span>}
          </div>
        </div>
        <p className="text-[10px] mt-0.5" style={{ ...mono, color: '#3a4f66' }}>Last updated: {new Date().toLocaleTimeString('en-GB')}</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {/* Inventory Table */}
        <div className="glass-card">
          <div className="section-title-bar">Inventory Management</div>
          <table>
            <colgroup>
              <col /><col style={{ width: '44px' }} /><col style={{ width: '36px' }} /><col style={{ width: '68px' }} /><col style={{ width: '28px' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Item','Stok','Min','Status','AR'].map((h) => (
                  <th key={h} className="py-1 text-left text-[11px] uppercase" style={{ ...inter, color: '#3a4f66' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  className={item.status === 'CRITICAL' ? 'animate-pulse' : ''}>
                  <td className="py-1">
                    <span className="text-[12px] block" style={{ ...inter, color: '#94a3b8' }}>{item.name}</span>
                    {/* Stock bar */}
                    <div className="stock-bar-track">
                      <div style={{ width: `${Math.min(100, (item.stock / item.max) * 100)}%`, height: '100%', background: INV_BAR[item.status], borderRadius: '2px', transition: 'width 0.6s' }} />
                    </div>
                  </td>
                  <td className="py-1 text-[12px] font-semibold text-right" style={{ ...mono, color: item.stock < item.min ? '#f43f5e' : '#06b6d4' }}>{item.stock}</td>
                  <td className="py-1 text-[11px] text-right" style={{ ...mono, color: '#475569' }}>{item.min}</td>
                  <td className="py-1"><span className={INV_BADGE[item.status]}>{item.status}</span></td>
                  <td className="py-1 text-center">
                    {(item.status === 'CRITICAL' || item.status === 'LOW') && (
                      <button onClick={() => toggleAutoRestock(item.id)}
                        className="text-[10px] font-bold" style={{ ...mono, color: item.autoRestock ? '#10b981' : '#3a4f66', cursor: 'pointer', background: 'none', border: 'none' }}>
                        {item.autoRestock ? '●' : '○'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] mt-1.5" style={{ ...inter, color: '#3a4f66' }}>AR = Auto-Restock toggle (CRITICAL/LOW items only)</p>
        </div>

        {/* Cleaning + Work Orders */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card">
            <div className="section-title-bar">Cleaning Schedule</div>
            <div className="space-y-1.5">
              {sched.map((e) => (
                <div key={e.id} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className={`dot shrink-0 ${e.prio === 'high' ? 'dot-red' : 'dot-gray'}`} />
                  <span className="flex-1 text-[12px] truncate" style={{ ...inter, color: '#94a3b8', minWidth: 0 }}>{e.room}</span>
                  <span className="text-[12px] font-semibold shrink-0" style={{ ...mono, color: '#06b6d4' }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card">
            <div className="section-title-bar">Work Orders</div>
            <div className="space-y-1.5">
              {orders.map((o) => (
                <div key={o.id} className="p-1.5 rounded" style={{ background: 'rgba(10,20,40,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <p className="text-[11px] leading-tight flex-1 truncate" style={{ ...inter, color: '#94a3b8', minWidth: 0 }}>{o.title}</p>
                    <span className={`${WO_BADGE[o.status]} shrink-0`}>{o.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px]" style={{ ...mono, color: '#475569' }}>{o.by}</span>
                    <span className="text-[10px]" style={{ ...mono, color: '#3a4f66' }}>{o.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logistics;


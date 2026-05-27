// ============================================================================
// NFCC — NexusDemoOverlay  (Cinematic narrative demo)
// ============================================================================
// Shows a full-screen cinematic overlay that narrates each division as the
// demo progresses. The DemoController signals phase changes via a zustand
// flag. Each "scene" has a title, division name, and explanation text.
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useNFCCStore } from '../../core/store/useNFCCStore';

// ── Scene definitions ─────────────────────────────────────────────────────────
export interface DemoScene {
  phase:       'intro' | 'division' | 'emergency' | 'compliance' | 'outro';
  divisionId?: number;
  title:       string;
  subtitle:    string;
  description: string;
  detail:      string;
  accentColor: string;
}

export const DEMO_SCENES: DemoScene[] = [
  {
    phase: 'intro', title: 'NUSANTARA FORTIFIED', subtitle: 'COMMAND COMPLEX',
    description: 'Digital Twin & Integrated Emergency Management System',
    detail: '5.000+ sensor node aktif • 11 divisi operasional • Kepatuhan ISO/IEC/NFPA',
    accentColor: '#06b6d4',
  },
  {
    phase: 'division', divisionId: 1, title: 'DIVISI 01', subtitle: 'Komando Utama',
    description: 'Pusat kendali tertinggi kompleks. Monitor ancaman real-time, protokol VVIP, dan koordinasi seluruh divisi.',
    detail: 'Indikator ancaman • Matriks risiko ISO 31000 • Override control lintas divisi',
    accentColor: '#FFD700',
  },
  {
    phase: 'division', divisionId: 2, title: 'DIVISI 02', subtitle: 'Keamanan Dalam',
    description: 'AI-powered deteksi anomali berbasis algoritma K-Means clustering dari data sensor PIR.',
    detail: 'Heatmap pergerakan • Log intrusi real-time • Notifikasi massal ke semua divisi',
    accentColor: '#FF4444',
  },
  {
    phase: 'division', divisionId: 3, title: 'DIVISI 03', subtitle: 'Pertahanan Perimeter',
    description: 'Monitoring batas luar kompleks dengan radar sweep, drone UAV patrol, dan sensor fiber optik.',
    detail: '4 UAV patroli aktif • Sensor vibrasi perimeter • Deteksi pelanggaran 3-level',
    accentColor: '#FF8C00',
  },
  {
    phase: 'division', divisionId: 4, title: 'DIVISI 04', subtitle: 'Ketenagalistrikan',
    description: 'Sistem distribusi daya PLN 220V/50Hz. Load flow dinamis, UPS, genset, dan ATS otomatis.',
    detail: 'PLN 220V/50Hz • Faktor daya industri • Load shedding otomatis saat darurat',
    accentColor: '#FFFF00',
  },
  {
    phase: 'division', divisionId: 5, title: 'DIVISI 05', subtitle: 'Mekanikal & HVAC',
    description: 'Kontrol iklim tropis. PID controller real-time dengan prediksi kegagalan peralatan berbasis AI.',
    detail: 'Setpoint tropik 22-24°C • Kelembaban 55-65% • Efisiensi energi ISO 52120',
    accentColor: '#00BFFF',
  },
  {
    phase: 'emergency',
    title: 'SIMULASI DARURAT', subtitle: 'Protokol Evakuasi Aktif',
    description: 'Skenario kebakaran dipicu. Jalur evakuasi A* dihitung, alarm aktif, semua divisi dinotifikasi.',
    detail: 'Transisi NORMAL → EVAKUASI • Algoritma A* pathfinding • Koordinasi lintas divisi',
    accentColor: '#f43f5e',
  },
  {
    phase: 'division', divisionId: 6, title: 'DIVISI 06', subtitle: 'Keselamatan Kebakaran',
    description: 'Detector asap dan sprinkler di setiap lantai. Jalur evakuasi diperbarui real-time saat kondisi berubah.',
    detail: 'NFPA 72 & 101 • Visualisasi rambatan api • Rute evakuasi ter-update',
    accentColor: '#FF6347',
  },
  {
    phase: 'division', divisionId: 7, title: 'DIVISI 07', subtitle: 'Plumbing & Sanitasi',
    description: 'Monitor distribusi air bersih, deteksi kebocoran mass balance, dan kualitas air sesuai Permenkes RI.',
    detail: 'Permenkes No.492/2010 • pH, Turbiditas, TDS • Deteksi kebocoran otomatis',
    accentColor: '#1E90FF',
  },
  {
    phase: 'division', divisionId: 8, title: 'DIVISI 08', subtitle: 'Layanan Medis',
    description: 'Peta lokasi P3K dan defibrillator. Ruang isolasi dengan tekanan negatif. Timer respons darurat.',
    detail: 'ISO 45001 K3 • 5 pos P3K berAED • Ruang isolasi bertekanan negatif',
    accentColor: '#00FF7F',
  },
  {
    phase: 'division', divisionId: 9, title: 'DIVISI 09', subtitle: 'Logistik & Operasional',
    description: 'Manajemen inventori cerdas dengan prediksi restok dan jadwal kebersihan berbasis occupancy.',
    detail: 'ISO 41001 Facility Management • Jadwal prediktif • Work order otomatis',
    accentColor: '#DDA0DD',
  },
  {
    phase: 'division', divisionId: 10, title: 'DIVISI 10', subtitle: 'Operasi Siber',
    description: 'SIEM terminal real-time. Segmentasi jaringan IEC 62443. Deteksi dan pemblokiran ancaman siber.',
    detail: 'IEC 62443-3-3 • Zone & Conduit model • Threat counter 147+ blocked',
    accentColor: '#00FF00',
  },
  {
    phase: 'division', divisionId: 11, title: 'DIVISI 11', subtitle: 'Komunikasi Krisis',
    description: 'Draft otomatis pengumuman berdasarkan status darurat. Kontrol sirine PA system per zona.',
    detail: 'ISO 22329 • Auto-draft berdasarkan kondisi • Kontrol zona pengeras suara',
    accentColor: '#9370DB',
  },
  {
    phase: 'compliance', title: 'KEPATUHAN STANDAR', subtitle: 'Compliance Matrix',
    description: 'Sistem ini memenuhi standar internasional ISO 16484, IEC 62443, ISO 27001, NFPA 3000, ISO 19650, ISO 52120.',
    detail: 'Self-assessed compliance • Live status per klausul • Traceability ke fitur implementasi',
    accentColor: '#06b6d4',
  },
  {
    phase: 'outro', title: 'NFCC DIGITAL TWIN', subtitle: 'Siap Dioperasikan',
    description: 'Platform simulasi terpadu untuk latihan, perencanaan kedaruratan, dan demonstrasi kemampuan teknis.',
    detail: 'Zero backend • 5.000 sensor node • 11 divisi • Web Workers • IndexedDB historian',
    accentColor: '#06b6d4',
  },
];

// ── Global scene index shared with DemoController ────────────────────────────
let _sceneCallback: ((idx: number) => void) | null = null;

export function setDemoSceneIndex(idx: number): void {
  _sceneCallback?.(idx);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function NexusDemoOverlay(): React.ReactNode {
  const isDemoMode  = useNFCCStore((s) => s.isDemoMode);
  const setDemoMode = useNFCCStore((s) => s.setDemoMode);

  const [sceneIdx, setSceneIdx] = useState(0);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);
  const tlRef       = useRef<gsap.core.Timeline | null>(null);

  // Subscribe to scene changes from DemoController
  useEffect(() => {
    _sceneCallback = setSceneIdx;
    return () => { _sceneCallback = null; };
  }, []);

  // Animate scene transitions
  useEffect(() => {
    if (!isDemoMode) return;
    const el = contentRef.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
  }, [sceneIdx, isDemoMode]);

  // Initial overlay fade-in
  useEffect(() => {
    if (!isDemoMode) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    tlRef.current = gsap.timeline();
    return () => { tlRef.current?.kill(); };
  }, [isDemoMode]);

  const handleSkip = useCallback(() => {
    tlRef.current?.kill();
    setDemoMode(false);
  }, [setDemoMode]);

  if (!isDemoMode) return null;

  const scene = DEMO_SCENES[sceneIdx] ?? DEMO_SCENES[0]!;
  const progress = ((sceneIdx + 1) / DEMO_SCENES.length) * 100;
  const isEmergency = scene.phase === 'emergency';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: isEmergency
          ? 'rgba(20,4,8,0.92)'
          : 'rgba(2,8,20,0.88)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.006) 3px,rgba(255,255,255,0.006) 4px)',
        }}
        aria-hidden="true"
      />

      {/* Top accent line */}
      <div
        className="shrink-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${scene.accentColor}, transparent)` }}
      />

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-5 right-5 z-10 px-4 py-1.5 text-sm rounded"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.1em',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#64748b',
          cursor: 'pointer',
        }}
      >
        LEWATI ▶▶
      </button>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: scene.accentColor }}
        />
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div ref={contentRef} className="text-center max-w-2xl">

          {/* Scene label */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(90deg, transparent, ${scene.accentColor}55)` }} />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: scene.accentColor,
              }}
            >
              {scene.phase === 'intro'       ? 'INISIALISASI SISTEM' :
               scene.phase === 'division'    ? `DIVISI ${String(scene.divisionId ?? '').padStart(2,'0')}` :
               scene.phase === 'emergency'   ? '⚠ SKENARIO DARURAT' :
               scene.phase === 'compliance'  ? 'MATRIKS KEPATUHAN' :
                                               'DEMO SELESAI'}
            </span>
            <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(90deg, ${scene.accentColor}55, transparent)` }} />
          </div>

          {/* Title */}
          <h1
            className="mb-1 font-bold tracking-widest uppercase"
            style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: 'clamp(20px, 3.5vw, 36px)',
              color: scene.accentColor,
              textShadow: `0 0 24px ${scene.accentColor}66`,
              letterSpacing: '0.18em',
            }}
          >
            {scene.title}
          </h1>

          <h2
            className="mb-5 font-semibold tracking-[0.15em] uppercase"
            style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: 'clamp(14px, 2vw, 22px)',
              color: '#dde6f0',
            }}
          >
            {scene.subtitle}
          </h2>

          {/* Description */}
          <p
            className="mb-3 leading-relaxed"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 'clamp(13px, 1.4vw, 16px)',
              color: '#94a3b8',
              maxWidth: '600px',
              margin: '0 auto 12px',
            }}
          >
            {scene.description}
          </p>

          {/* Detail tags */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {scene.detail.split('•').map((tag, i) => (
              tag.trim() && (
                <span
                  key={i}
                  className="px-3 py-1 rounded"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    background: `${scene.accentColor}10`,
                    border: `1px solid ${scene.accentColor}30`,
                    color: `${scene.accentColor}cc`,
                    letterSpacing: '0.04em',
                  }}
                >
                  {tag.trim()}
                </span>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: scene dots + counter */}
      <div className="shrink-0 flex flex-col items-center pb-6 gap-3">
        {/* Dot progress indicator */}
        <div className="flex gap-1.5">
          {DEMO_SCENES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === sceneIdx ? '18px' : '6px',
                height: '6px',
                background: i === sceneIdx ? scene.accentColor : i < sceneIdx ? `${scene.accentColor}44` : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>

        {/* Scene counter text */}
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            color: '#3a4f66',
            letterSpacing: '0.1em',
          }}
        >
          {String(sceneIdx + 1).padStart(2, '0')} / {String(DEMO_SCENES.length).padStart(2, '0')} — NFCC DIGITAL TWIN v2.0
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="shrink-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${scene.accentColor}44, transparent)` }}
      />
    </div>
  );
}

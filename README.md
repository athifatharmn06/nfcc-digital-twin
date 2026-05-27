# 🛡️ NFCC Digital Twin
### *Nusantara Fortified Command Complex — Digital Twin, Automation & Integrated Emergency Management System*

> **Live Demo:** [nfcc-digital-twin.netlify.app](https://nfcc-digital-twin.netlify.app) *(coming soon)*

---

## Overview

A fully client-side **Digital Twin Command Center** simulating a national critical infrastructure complex with **5,000+ real-time sensor nodes** across **11 operational divisions**. Built as a zero-backend web application — everything runs in the browser.

![NFCC Dashboard Preview](src/assets/hero.png)

---

## Key Features

### 🏗️ 3D Holographic Visualization
- **X-ray building** — EdgesGeometry with semi-transparent glass walls, visible floor partitions
- **5,000 sensor nodes** color-coded by sensor type with architectural placement (door contacts on walls, PIR on ceiling corners, smoke detectors on ceiling spans)
- **Hover tooltip** — click any node to see full BIM metadata (vendor, install date, ISO reference, criticality)
- **4 UAV drones** with Lissajous flight paths, independent orientations
- Bloom post-processing for neon glow effect

### 📊 11 Division Dashboards
| # | Division | Key Feature |
|---|---------|-------------|
| 01 | Komando Utama | Threat gauge, Presidential Protocol, Risk Matrix 5×5 |
| 02 | Keamanan Dalam | K-Means AI heatmap, real-time intrusion log |
| 03 | Pertahanan Perimeter | Phosphor radar, drone patrol status, zone breach |
| 04 | Ketenagalistrikan | PLN 220V/50Hz live load flow chart, UPS status |
| 05 | HVAC | PID controller tuning, tropical climate zones |
| 06 | Keselamatan Kebakaran | Fire spread monitor, A* evacuation routes |
| 07 | Plumbing & Sanitasi | Tank level animation, Permenkes 492 water quality |
| 08 | Layanan Medis | Response timer, isolation room pressure monitor |
| 09 | Logistik & Operasional | Inventory management, auto-restock, work orders |
| 10 | Operasi Siber | SIEM terminal, IEC 62443 network zones |
| 11 | Komunikasi Krisis | Auto-draft broadcast, PA zone map, siren control |

### 🚨 Emergency Management
- **State machine**: NORMAL ↔ LOCKDOWN, NORMAL ↔ EVACUATION, LOCKDOWN → EVACUATION
- Door lockdown, alarm audio, red border overlay
- A* pathfinding evacuation routes
- Coordinate across all 11 divisions simultaneously

### 🎬 Cinematic Demo Mode
- 14-scene automated walkthrough with narration
- Camera auto-focuses on each division's zone
- Progress indicator with scene dots
- Press **▶ DEMO** to start

### 🔔 Notification System
- Click bell icon for notification history panel
- Type badges (INFO/WARNING/CRITICAL), division name, timestamp
- Dismiss individual or clear all

---

## Architecture

```
Browser
├── Main Thread
│   ├── React UI (Zustand state)
│   ├── Three.js / React Three Fiber (3D scene)
│   └── Web Audio API (alarm tones)
├── BrokerWorker     — pub/sub event bus
├── PhysicsWorker    — 500ms simulation tick (Newton cooling, PLN 220V, mass balance)
├── AIWorker         — K-Means clustering + A* pathfinding
└── IndexedDB        — time-series historian (Dexie.js, 24h retention)
```

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| 3D Rendering | Three.js + @react-three/fiber + @react-three/drei |
| Post-processing | @react-three/postprocessing (Bloom) |
| State | Zustand |
| Charts | Recharts |
| Animations | GSAP + Framer Motion |
| Styling | Tailwind CSS |
| Fonts | Orbitron (brand) + JetBrains Mono (data) + Inter (UI) |
| Data Storage | Dexie.js (IndexedDB) |
| Build | Vite |
| Testing | Vitest + fast-check (property-based) |

---

## Standards Compliance

| Standard | Implementation |
|----------|---------------|
| **ISO 16484-5** | BACnet property structure for sensor metadata |
| **ISO 52120-1** | Energy efficiency BAC functions, HVAC scheduling |
| **IEC 62443-3-3** | Network zone & conduit model (CyberOps) |
| **ISO 27001** | Access log, audit trail simulation |
| **NFPA 3000** | ASHER protocol — lockdown, mass notification |
| **ISO 19650** | BIM metadata per sensor node |
| **ISO 31000** | Risk matrix in Command Center |
| **Permenkes 492/2010** | Indonesian water quality parameters |
| **PLN SPLN** | 220V/50Hz electrical specification |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

Open [http://localhost:5173](http://localhost:5173)

### Demo Mode
- Click **▶ DEMO** button in the header, or
- Navigate to `http://localhost:5173?mode=demo`

---

## Project Structure

```
src/
├── three/          # 3D scene components (HologramBuilding, SensorNodes, DronePatrol)
├── core/
│   ├── workers/    # BrokerWorker, PhysicsWorker, AIWorker
│   ├── store/      # Zustand store, emergency machine, IndexedDB historian
│   └── types/      # TypeScript interfaces
├── components/
│   ├── divisions/  # 11 division dashboards
│   ├── layout/     # AppLayout, HeaderBar, DivisionSidebar
│   ├── demo/       # DemoController, NexusDemoOverlay
│   └── ui/         # ComplianceMatrix, NotificationPanel
└── utils/          # Audio (Web Audio API)
```

---

## Author

**Athif Athar** — Electrical Engineering student demonstrating advanced programming capabilities through a mission-critical national infrastructure simulation.

*Built to showcase: systems integration, real-time simulation, 3D visualization, AI/ML algorithms, and international standards compliance.*

---

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r168-black?logo=three.js)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

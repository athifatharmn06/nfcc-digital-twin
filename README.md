# 🛡️ NFCC Digital Twin
### *Nusantara Fortified Command Complex*
#### Digital Twin · Automation · Integrated Emergency Management System

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Three.js-r168-black?style=for-the-badge&logo=three.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/Web_Workers-3_threads-f59e0b?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge"/>
</p>

---

## 📸 Screenshots

### Main Dashboard — 3D Holographic View
![Main Dashboard](docs/screenshots/main-dashboard.png)

---

### Division Dashboards

#### Division 01 — Komando Utama
![Command Center](docs/screenshots/div-01-command.png)

#### Division 02 — Keamanan Dalam
![Internal Security](docs/screenshots/div-02-security.png)

#### Division 03 — Pertahanan Perimeter
![Perimeter Defense](docs/screenshots/div-03-perimeter.png)

#### Division 04 — Ketenagalistrikan
![Electrical Systems](docs/screenshots/div-04-electrical.png)

#### Division 05 — HVAC & Mekanikal
![HVAC Control](docs/screenshots/div-05-hvac.png)

#### Division 06 — Keselamatan Kebakaran
![Fire Safety](docs/screenshots/div-06-fire.png)

#### Division 07 — Plumbing & Sanitasi
![Plumbing](docs/screenshots/div-07-plumbing.png)

#### Division 08 — Layanan Medis
![Medical Services](docs/screenshots/div-08-medical.png)

#### Division 09 — Logistik & Operasional
![Logistics](docs/screenshots/div-09-logistics.png)

#### Division 10 — Operasi Siber
![Cyber Operations](docs/screenshots/div-10-cyber.png)

#### Division 11 — Komunikasi Krisis
![Crisis Communications](docs/screenshots/div-11-crisis.png)

---

## 🎯 Project Overview

**NFCC Digital Twin** is a fully **client-side, zero-backend** web application that simulates a national critical infrastructure command center. The system runs entirely in the browser — no server, no cloud, no external APIs — using Web Workers for parallel computation, WebGL for 3D rendering, and IndexedDB for local data persistence.

The project demonstrates the integration of **building automation systems (BAS)**, **physical security**, **emergency management**, **cybersecurity monitoring**, and **facility management** into a single unified command interface — all compliant with international standards.

> **Key Achievement:** 5,000 sensor nodes simulated at 60fps with zero UI thread blocking, using a multi-worker architecture and GPU-direct data path (Float32Array → InstancedMesh).

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/athifatharmn06/nfcc-digital-twin.git
cd nfcc-digital-twin

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Run all tests (unit + property-based)
npm test

# Type check only
npx tsc --noEmit
```

### Demo Mode
```
http://localhost:5173?mode=demo
```
Or click **▶ DEMO** in the header for a 14-scene cinematic walkthrough.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MAIN THREAD                           │    │
│  │                                                          │    │
│  │  React 18 UI ──── Zustand Store (UI state only)         │    │
│  │       │                                                  │    │
│  │  Three.js / R3F ── InstancedMesh (5000 nodes)           │    │
│  │       │            Float32Array buffers (GPU-direct)     │    │
│  │  Web Audio API ─── Programmatic alarm tones             │    │
│  └──────────────────────────┬────────────────────────────┘    │
│                              │ postMessage                       │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │                   BrokerWorker                            │   │
│  │         Topic-based pub/sub event bus                     │   │
│  │    sensor/* · command/* · alert/* · system/*              │   │
│  └──────┬──────────────────────────────────┬───────────────┘   │
│         │ postMessage                       │ postMessage        │
│  ┌──────▼──────────┐              ┌────────▼──────────┐        │
│  │  PhysicsWorker  │              │    AIWorker        │        │
│  │  500ms tick     │              │  K-Means + A*      │        │
│  │  5000 nodes     │              │  Pathfinding       │        │
│  └─────────────────┘              └───────────────────┘        │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              IndexedDB (Dexie.js)                          │  │
│  │   Time-series historian · 24h retention · 5000 rec/s      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **PhysicsWorker** runs a 500ms tick loop computing all 5,000 sensor values
2. Results posted to **BrokerWorker** via `postMessage`
3. **BrokerWorker** routes by topic to Main Thread and AIWorker
4. Main Thread writes to **Float32Array buffers** (never React state)
5. **useFrame** loop reads buffers → updates InstancedMesh → GPU renders
6. **AIWorker** receives PIR data → K-Means → anomaly alerts back through Broker
7. Emergency transitions propagate through Broker to all workers simultaneously

---

## 🛠️ Full Technology Stack

### Core Framework & Language

| Technology | Version | Usage |
|-----------|---------|-------|
| **TypeScript** | 5.x | Strict mode, zero `any`, explicit return types on all exports |
| **React** | 18 | Functional components, hooks, concurrent features |
| **Vite** | 8 | Build tool, HMR, Web Worker bundling with `?worker` syntax |
| **ESLint** | 9 | `@typescript-eslint/explicit-function-return-type` enforced |

### 3D Rendering Pipeline

| Technology | Version | Usage |
|-----------|---------|-------|
| **Three.js** | r168 | Core 3D engine — geometry, materials, scene graph |
| **@react-three/fiber** | 8 | React renderer for Three.js, `useFrame` render loop |
| **@react-three/drei** | 9 | `OrbitControls`, `EdgesGeometry` helpers |
| **@react-three/postprocessing** | 2 | `EffectComposer`, `Bloom` post-processing |
| **EdgesGeometry** | — | Clean architectural edges (12 edges only, no diagonal triangles) |
| **InstancedMesh** | — | Single draw call for 5,000 sensor nodes |
| **Float32Array** | — | GPU-direct position/color buffers, bypasses React state |

### State Management & Data

| Technology | Version | Usage |
|-----------|---------|-------|
| **Zustand** | 4 | Lightweight global store — UI state only (no 3D data) |
| **Dexie.js** | 3 | IndexedDB wrapper — time-series historian, 24h retention |
| **Web Workers API** | — | 3 parallel threads: BrokerWorker, PhysicsWorker, AIWorker |
| **Web Audio API** | — | Programmatic alarm tones via OscillatorNode (no audio files) |

### UI & Styling

| Technology | Version | Usage |
|-----------|---------|-------|
| **Tailwind CSS** | 3 | Utility-first styling, dark theme, custom design tokens |
| **Framer Motion** | 11 | Sidebar animations, division transitions |
| **GSAP** | 3 | Cinematic demo timeline, scene transitions |
| **Orbitron** | — | Brand/logo font (Google Fonts) |
| **JetBrains Mono** | — | Data values, timestamps, codes |
| **Inter** | — | All UI text, labels, descriptions |

### Charts & Visualization

| Technology | Version | Usage |
|-----------|---------|-------|
| **Recharts** | 2 | LineChart for load flow (Electrical), temperature response (HVAC) |
| **SVG (inline)** | — | Pipe flow diagram (Plumbing), PA zone map (Crisis Comm), floor plan (Fire) |
| **CSS animations** | — | Radar sweep, tank wave surface, live dot pulse, shimmer bars |

### Testing

| Technology | Version | Usage |
|-----------|---------|-------|
| **Vitest** | 2 | Unit test runner, jsdom environment |
| **fast-check** | 3 | Property-based testing — 13 correctness properties |
| **@testing-library/react** | 14 | Component rendering tests |

---

## 💡 Skills & Concepts Demonstrated

### 1. Advanced TypeScript
- **Strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`
- **Zero `any`** — all data structures explicitly typed
- **Discriminated unions** — `EmergencyState`, `SensorType`, `ThreatLevel`
- **Generic constraints** — typed Zustand store, typed worker messages
- **Mapped types** — `Record<ThreatLevel, Config>`, `Record<DivisionId, JSX.Element>`
- **Type guards** — worker message routing with `switch (msg.type)`
- **Const assertions** — `as const` for timing configs, division IDs

### 2. React Architecture
- **Separation of concerns** — Zustand for UI state, Float32Array for 3D data, never mixed
- **Custom hooks** — `useDivisionData`, `useEmergencyEffects`, `useDivisionData`
- **Ref patterns** — stable refs for GSAP callbacks to avoid re-render cycles
- **Memoization** — `useMemo` for Three.js geometries, `useCallback` for event handlers
- **Context** — `WorkerProvider` context for worker access across component tree
- **Concurrent features** — React 18 automatic batching

### 3. 3D Graphics & WebGL
- **InstancedMesh** — single draw call for 5,000 objects (GPU instancing)
- **EdgesGeometry** — architectural wireframe without diagonal triangle artifacts
- **Float32Array buffers** — direct GPU data path, bypasses React reconciler entirely
- **useFrame render loop** — reads buffers every frame, updates InstancedMesh attributes
- **Bloom post-processing** — luminance threshold tuning for selective glow
- **Lissajous curves** — parametric flight paths for drone patrol (`x=cos(fx·t)·rx, z=sin(fz·t)·rz`)
- **Camera transitions** — smooth lerp with cubic ease-in-out, zone-specific positions
- **Raycasting** — click detection on InstancedMesh instances

### 4. Concurrent Programming (Web Workers)
- **Multi-threaded architecture** — 3 parallel workers, main thread never blocked
- **Pub/sub message routing** — BrokerWorker with topic wildcards (`sensor/*`)
- **Worker lifecycle** — restart logic with exponential backoff on crash
- **Shared computation** — PhysicsWorker computes, BrokerWorker routes, AIWorker analyzes
- **Message protocol** — typed `BrokerMessage` interface with topic, timestamp, payload, source

### 5. Physics Simulation
- **Newton's Law of Cooling** — `dT = -k(T - T_ambient) + heatGain - cooling`
- **Sinusoidal electrical load** — `baseLoad + amplitude·sin(2π·f·t) + noise`
- **Water tank mass balance** — `level + (inflow - outflow)·dt / area`
- **Seismic random walk** — configurable spike probability and amplitude
- **Indonesian specs** — PLN 220V/50Hz, tropical ambient 30°C, Permenkes 492 water quality

### 6. AI & Algorithms
- **K-Means clustering** — custom implementation, detects anomalous PIR movement patterns
- **A\* pathfinding** — grid-based evacuation route computation with obstacle avoidance
- **Property verification** — nearest-centroid assignment, path connectivity, obstacle avoidance
- **Seeded pseudo-random** — deterministic sensor placement using LCG (`sin(seed·127.1)·43758.5`)

### 7. Finite State Machine
- **Emergency state machine** — NORMAL ↔ LOCKDOWN, NORMAL ↔ EVACUATION, LOCKDOWN → EVACUATION
- **Transition validation** — invalid transitions silently rejected
- **Side effects** — door lockdown, alarm audio, overlay, sensor override, route computation
- **Restoration** — pre-lockdown sensor states saved and restored on NORMAL transition

### 8. Data Persistence
- **IndexedDB via Dexie.js** — time-series records with compound indexes `[nodeId+timestamp]`
- **Batch writes** — 500 records per flush, 2-second interval
- **Automatic purge** — records older than 24 hours deleted every 5 minutes
- **Query patterns** — by nodeId, by zone, by time range

### 9. Property-Based Testing
- **13 correctness properties** verified with fast-check:
  1. Broker message routing correctness
  2. Broker message format invariant
  3. Temperature simulation follows Newton's Law
  4. Electrical load simulation bounds
  5. Water tank mass conservation
  6. K-Means nearest centroid assignment
  7. A\* pathfinding validity (connectivity, obstacle avoidance)
  8. Emergency state machine transition validity
  9. Emergency lockdown round-trip restoration
  10. Sensor status-to-color mapping consistency
  11. IndexedDB historian round-trip
  12. IndexedDB historian purge correctness
  13. Zustand store division selection

### 10. UI/UX Engineering
- **Design system** — CSS custom properties, component classes, consistent spacing (4px grid)
- **Typography hierarchy** — Orbitron (brand) → JetBrains Mono (data) → Inter (UI)
- **Overflow protection** — `min-width: 0`, `text-overflow: ellipsis`, `table-layout: fixed`
- **Responsive layout** — CSS Grid `190px 1fr 420px`, works 1024px–2560px
- **Accessibility** — `aria-label`, `aria-current`, `aria-pressed`, `role` attributes
- **Animation** — GSAP timeline for demo, CSS keyframes for live indicators, Framer Motion for sidebar

### 11. Software Engineering Practices
- **Zero backend** — fully static, deployable to Netlify/Vercel/GitHub Pages
- **Architectural constraints** — Zustand never holds 3D data, workers never touch DOM
- **Error boundaries** — worker crash detection, restart with notification
- **Graceful degradation** — WebGL unavailable → 2D mode, worker crash → last known values
- **Code organization** — feature-based directory structure, barrel exports

---

## 📊 11 Division Dashboards — Detailed

### Division 01 — Komando Utama
- **Threat Level Gauge** — 4-segment visual bar (GREEN/YELLOW/RED/BLACK) with glow
- **Presidential Protocol** — safety cover animation, requires two-step activation
- **Override Control** — assume control of any division's actuators
- **System Status Overview** — all 11 divisions as colored status grid
- **Risk Matrix 5×5** — ISO 31000 likelihood × impact heatmap
- **KPI tiles** — total nodes, active alarms, divisions online, uptime

### Division 02 — Keamanan Dalam
- **AI Heatmap Overlay** — K-Means clustering visualization, animated cell opacity
- **Anomaly Detection** — confidence score, PIR hit count, zone identification
- **Camera Feed Monitor** — 4 CCTV placeholder feeds with zone labels
- **Real-Time Intrusion Log** — scrolling table with severity color coding
- **Mass Notification** — broadcast alert to all 11 divisions via BrokerWorker

### Division 03 — Pertahanan Perimeter
- **Phosphor Radar** — 5-trail afterglow sweep effect, alert blips
- **Drone Patrol Status** — UAV-01 to UAV-04 with battery bars, sector, status
- **Perimeter Integrity Meter** — percentage of clear zones
- **Zone Breach Indicators** — 4 zones (N/E/S/W) with 4-level severity
- **Vibration & Fiber Optic Fence** — sensor table with NORMAL/ALERT/OFFLINE

### Division 04 — Ketenagalistrikan
- **Dynamic Load Flow Chart** — real-time Recharts LineChart, MAX CAPACITY reference line
- **Power Flow Diagram** — MAIN GRID → ATS → UPS → CRITICAL LOADS
- **UPS Battery Status** — 4 units with progress bars and runtime estimate
- **Generator / ATS Control** — START/STOP, activation toggle
- **Voltage Display** — PLN 220V/50Hz, L1/L2/L3 with alarm threshold ±10%
- **Load Shedding** — 4 circuit buttons with estimated kW saved

### Division 05 — HVAC & Mekanikal
- **PID Controller** — Kp/Ki/Kd sliders, response quality indicator (OPTIMAL/ACCEPTABLE/OSCILLATING)
- **Energy Efficiency Score** — A/B/C rating based on PID parameters
- **Climate Zones Table** — 4 zones with temp, humidity, CO₂, trend arrows
- **Temperature Response Chart** — PID behavior over time (Recharts)
- **Predictive Maintenance** — 3 alerts with urgency countdown

### Division 06 — Keselamatan Kebakaran
- **Smoke & Sprinkler Grid** — 8 detectors with emoji status icons
- **Fire Spread Monitor** — gradient progress bar + SVG floor plan indicator
- **Evacuation Route Status** — 4 routes with load bars and estimated time
- **Alarm Controls** — trigger simulation, activate/deactivate alarm

### Division 07 — Plumbing & Sanitasi
- **Water Tank Levels** — 4 animated vertical fill bars with wave surface effect
- **Pipe Flow Diagram** — SVG with directional arrows and branch labels
- **Flow Rate Sensors** — 4 sensors with deviation detection
- **Water Quality** — pH, Turbiditas, Klorin, TDS per Permenkes No.492/2010

### Division 08 — Layanan Medis
- **Emergency Request** — MEDIC NEEDED button with dispatch notification
- **Response Timer** — elapsed time since last emergency, live counter
- **First Aid Stations** — 5 stations with name, location, distance, AED badge, supplies
- **Isolation Rooms** — 4 rooms with status, patient info, negative pressure indicator

### Division 09 — Logistik & Operasional
- **Inventory Management** — 10 items with stock bars, auto-restock toggle
- **Predictive Cleaning Schedule** — 6 rooms with priority indicators
- **Work Orders** — 5 orders with status badges (pending/in-progress/completed)

### Division 10 — Operasi Siber
- **SIEM Terminal** — auto-scrolling green-on-black terminal with blinking cursor
- **Threat Counter** — live count with sparkline mini-chart
- **Unauthorized Access Alerts** — 4 alerts with BLOCK SOURCE button
- **IEC 62443 Network Zones** — Zone 1 (DMZ) → Zone 2 (Internal) → Zone 3 (Critical OT)

### Division 11 — Komunikasi Krisis
- **Broadcast Message** — auto-populated from emergency state, 280 char limit
- **Siren Control** — activate/stop evacuation siren via Web Audio API
- **PA Zone Map** — SVG building map showing active audio zones
- **Area Mute Controls** — per-zone toggle with delivery status

---

## 📋 Standards Compliance

| Standard | Scope | Implementation in NFCC |
|----------|-------|----------------------|
| **ISO 16484-5** | Building Automation & Control Systems | BACnet property structure for all 5,000 sensor nodes (ObjectName, PresentValue, StatusFlags) |
| **ISO 52120-1** | Energy Performance of Buildings | HVAC demand control, PID optimization, energy efficiency scoring |
| **IEC 62443-3-3** | Industrial Cybersecurity | Network zone & conduit model, defense-in-depth visualization |
| **ISO 27001** | Information Security Management | Access log, audit trail, anomaly detection, threat monitoring |
| **NFPA 3000** | Active Shooter/Hazard Response | ASHER protocol — lockdown, mass notification, evacuation coordination |
| **NFPA 72** | National Fire Alarm Code | Smoke detector placement, sprinkler status, alarm activation |
| **NFPA 101** | Life Safety Code | Evacuation route capacity, occupancy load, exit status |
| **ISO 19650** | BIM Information Management | Metadata per sensor: vendor, install date, maintenance interval, criticality |
| **ISO 31000** | Risk Management | Risk matrix 5×5 (likelihood × impact) in Command Center |
| **ISO 22301** | Business Continuity | Emergency restore, worker restart logic, graceful degradation |
| **ISO 45001** | Occupational Health & Safety | Medical emergency response, first aid station mapping |
| **ISO 41001** | Facility Management | Predictive cleaning, inventory management, work orders |
| **Permenkes No.492/2010** | Indonesian Drinking Water | pH 6.5–8.5, Turbiditas <5 NTU, Klorin 0.2–1.0 mg/L |
| **SNI 01-3553-2006** | Indonesian Water Standard | TDS <500 ppm, quality parameter monitoring |
| **PLN SPLN D3.002** | Indonesian Electrical Standard | 220V/50Hz, ±10% voltage tolerance, power factor monitoring |

---

## 📁 Project Structure

```
nfcc-digital-twin/
├── src/
│   ├── three/                        # 3D scene components
│   │   ├── HologramBuilding.tsx      # X-ray building (EdgesGeometry, room partitions)
│   │   ├── SensorNodes.tsx           # InstancedMesh 5000 nodes, Float32Array buffers
│   │   ├── DronePatrol.tsx           # 4 UAV drones with Lissajous flight paths
│   │   ├── NodeTooltip.tsx           # BIM metadata hover popup (HTML overlay)
│   │   ├── NodeLegend.tsx            # Sensor type color legend (collapsible)
│   │   ├── NFCCScene.tsx             # Canvas + Bloom post-processing
│   │   ├── CameraController.tsx      # OrbitControls + programmatic zone transitions
│   │   └── index.ts                  # Barrel exports
│   │
│   ├── core/
│   │   ├── workers/
│   │   │   ├── broker.worker.ts      # Pub/sub event bus, wildcard topic matching
│   │   │   ├── physics.worker.ts     # Simulation engine (Newton, PLN 220V, mass balance)
│   │   │   ├── ai.worker.ts          # K-Means clustering + A* pathfinding
│   │   │   ├── physics-models.ts     # Pure math functions (testable)
│   │   │   ├── ai-kmeans.ts          # K-Means implementation
│   │   │   ├── ai-pathfinding.ts     # A* implementation
│   │   │   └── WorkerProvider.tsx    # React context, worker lifecycle management
│   │   ├── store/
│   │   │   ├── useNFCCStore.ts       # Zustand store (UI state only)
│   │   │   ├── emergencyMachine.ts   # FSM: NORMAL/LOCKDOWN/EVACUATION
│   │   │   └── historian.ts          # IndexedDB time-series (Dexie.js)
│   │   ├── hooks/
│   │   │   ├── useDivisionData.ts    # Per-division data subscription
│   │   │   └── useEmergencyEffects.ts # Emergency side effects
│   │   ├── constants/
│   │   │   ├── divisions.ts          # DivisionConfig array (11 divisions)
│   │   │   └── iso-standards.ts      # Compliance matrix data
│   │   └── types/
│   │       └── index.ts              # All TypeScript interfaces
│   │
│   ├── components/
│   │   ├── divisions/                # 11 division dashboards
│   │   │   ├── CommandCenter/
│   │   │   ├── InternalSecurity/
│   │   │   ├── PerimeterDefense/
│   │   │   ├── Electrical/
│   │   │   ├── HVAC/
│   │   │   ├── FireSafety/
│   │   │   ├── Plumbing/
│   │   │   ├── Medical/
│   │   │   ├── Logistics/
│   │   │   ├── CyberOps/
│   │   │   └── CrisisComm/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx         # CSS Grid: 190px | 1fr | 420px
│   │   │   ├── HeaderBar.tsx         # Logo, status, clock, controls
│   │   │   └── DivisionSidebar.tsx   # 11 division nav with health bars
│   │   ├── demo/
│   │   │   ├── DemoController.tsx    # GSAP timeline, 14-scene orchestration
│   │   │   └── NexusDemoOverlay.tsx  # Cinematic overlay with narration
│   │   └── ui/
│   │       ├── ComplianceMatrix.tsx  # ISO/IEC/NFPA compliance table
│   │       └── NotificationPanel.tsx # Notification history dropdown
│   │
│   ├── utils/
│   │   └── audio.ts                  # Web Audio API: OscillatorNode alarm tones
│   │
│   ├── test/
│   │   ├── arbitraries.ts            # fast-check custom arbitraries
│   │   └── setup.ts                  # Vitest global setup
│   │
│   ├── App.tsx                       # Root component, stable refs for demo
│   ├── index.css                     # Design system (CSS custom properties)
│   └── main.tsx                      # Entry point
│
├── docs/
│   └── screenshots/                  # 12 screenshots (all divisions + main)
│
├── tailwind.config.ts                # Custom colors, fonts, animations
├── vitest.config.ts                  # jsdom environment, coverage config
├── vite.config.ts                    # Worker bundling, path aliases
└── tsconfig.app.json                 # strict: true, noUncheckedIndexedAccess: true
```

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:coverage # With coverage report
```

### Property-Based Tests (fast-check)
13 correctness properties verified with minimum 100 iterations each:

| Property | What it verifies |
|----------|-----------------|
| Broker routing correctness | Messages delivered to exactly matching subscribers |
| Broker format invariant | All messages have topic, timestamp, payload, source |
| Newton's Law of Cooling | `dT = -k(T-T_amb) + heat - cooling` within float tolerance |
| Electrical load bounds | Output within `[base-amp-noise, base+amp+noise]` |
| Water tank mass conservation | `level + (in-out)·dt/area` within float tolerance |
| K-Means nearest centroid | Every point assigned to geometrically nearest centroid |
| A\* path validity | Connected, obstacle-free, start-to-end |
| Emergency FSM transitions | Only valid paths allowed, invalid silently rejected |
| Lockdown round-trip | Sensor states fully restored after LOCKDOWN→NORMAL |
| Color mapping consistency | IN_ALARM→red, NORMAL→type color |
| IndexedDB round-trip | Written records retrievable by nodeId + time range |
| IndexedDB purge | Only records within 24h remain after purge |
| Division selection | `setActiveDivision(id)` → store reflects correct id |

---

## 👨‍💻 Author

**Athif Fadheel**  
Electrical Engineering Student

This project was built to demonstrate professional-grade software engineering capabilities applied to the domain of electrical engineering and building automation systems. It showcases the ability to:

- Design and implement **complex multi-threaded architectures** in the browser
- Apply **international engineering standards** (ISO, IEC, NFPA) in software
- Build **real-time simulation engines** with physically accurate models
- Create **professional-grade UI/UX** for mission-critical applications
- Write **formally verified code** using property-based testing
- Integrate **AI/ML algorithms** (K-Means, A\*) without external libraries

---

*NFCC Digital Twin — Zero backend. All computation in the browser. Built for portfolio demonstration.*

# AeroBalance PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, mobile-first bilingual PWA that demonstrates personal ear profiling, pressure prediction, bilateral adaptation, target pressure curves, BLE input, and deterministic hardware-free exhibition flow.

**Architecture:** Next.js App Router renders a client-side exhibition experience over a small Zustand session store. BLE and deterministic simulation both emit the same validated `PressureSample` type; pure TypeScript engines derive the profile, forecast, bilateral strategy, target curves, and result. Native IndexedDB stores pressure history, localStorage stores compact settings, Serwist supplies the offline application shell, and browser print supplies PDF export.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Recharts, Zustand, native IndexedDB, Web Bluetooth API, Serwist, Vitest, Testing Library, Playwright

---

## File Map

```text
package.json                            Scripts and dependencies
next.config.mjs                         Next.js and Serwist integration
postcss.config.mjs                      Tailwind PostCSS plugin
tsconfig.json                           Strict TypeScript and worker types
vitest.config.ts                        Unit/component test environment
playwright.config.ts                    Mobile/desktop end-to-end projects
src/app/
  device/page.tsx                       BLE connection and mock entry
  flight/page.tsx                       Four-stage Flight Simulator
  prediction/page.tsx                   Forecast and animated timeline
  profile/page.tsx                      Profile form and Digital Ear Twin
  report/print/page.tsx                 Print/PDF report
  results/page.tsx                      Comfort, risk, recommendations, exports
  strategy/page.tsx                     Parallel bilateral decision paths
  target-curve/page.tsx                 Three-curve adaptation output
  globals.css                           Design tokens, motion, print rules
  layout.tsx                            Metadata and application shell
  manifest.ts                           Installable PWA metadata
  page.tsx                              Flight Experience Center
  sw.ts                                 Serwist worker
src/components/
  charts/EarRadarChart.tsx              Supporting bilateral radar chart
  charts/PressureChart.tsx              Environmental history chart
  charts/PredictionChart.tsx            History/forecast/target overlay
  charts/TargetCurveChart.tsx           Environmental/left/right output
  device/DeviceStatus.tsx               Connection state presentation
  flight/FlightPhaseControl.tsx         Takeoff/cruise/descent/landing controls
  home/PressureSphere.tsx               Hero visual and live state
  layout/AppHeader.tsx                  Wordmark, locale, connection state
  layout/AppShell.tsx                   Page chrome, progress, navigation
  layout/BottomNavigation.tsx           Mobile route navigation
  layout/DemoProgress.tsx               Profile-to-result progress
  prediction/PredictionTimeline.tsx     Now/+5/+10/+15 animation
  profile/DigitalEarTwin.tsx            Primary bilateral profile visual
  profile/ProfileForm.tsx               Compact sliders and selectors
  strategy/DecisionPath.tsx             Per-ear decision path
  strategy/StrategyCard.tsx             Per-ear output summary
  ui/ActionButton.tsx                   Primary/secondary actions
  ui/MetricCard.tsx                     Product-grade metric surface
  ui/Notice.tsx                         Recoverable error and empty states
  ui/RiskBadge.tsx                      Text-plus-color risk status
  ui/ScoreRing.tsx                      Comfort and profile scores
src/config/bluetooth.ts                 BLE constants
src/i18n/messages.ts                    Typed Chinese/English dictionary
src/lib/bluetooth.ts                    Parser and Web Bluetooth client
src/lib/profile.ts                      Ear Profile Engine
src/lib/prediction.ts                   Pressure Prediction Engine
src/lib/report.ts                       JSON and print report model
src/lib/result.ts                       Comfort and overall risk result
src/lib/seed.ts                         Profiles and deterministic flight data
src/lib/storage.ts                      Native IndexedDB operations
src/lib/strategy.ts                     Bilateral Adaptation Engine
src/lib/target-curve.ts                 Target Curve Engine
src/store/useAppStore.ts                Active session and actions
src/types/bluetooth.d.ts                Minimal browser BLE declarations
src/types/domain.ts                     Shared domain contracts
src/test/setup.ts                       Testing Library setup
src/**/*.test.ts(x)                     Unit and component tests
e2e/demo-flow.spec.ts                   Three-minute guided demo
e2e/mobile-layout.spec.ts               Mobile navigation and overflow checks
public/icons/*                          PWA icon assets
```

---

### Task 1: Bootstrap the Runtime and Test Harness

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize packages**

Run:

```bash
npm init -y
npm install next react react-dom recharts zustand @serwist/next serwist
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test fake-indexeddb sharp
```

Expected: `package-lock.json` is created and `npm ls --depth=0` exits with code 0.

- [ ] **Step 2: Define scripts and strict compiler configuration**

Set `package.json` scripts to:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "check": "npm run lint && npm run test && npm run build"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext", "webworker"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "types": ["@serwist/next/typings"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "public/sw.js"]
}
```

Create `next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

Create `postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 3: Configure Vitest and write the first failing render test**

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverStub;
```

Create `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

it("identifies the aviation pressure experience immediately", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", {
      name: /面向环境压力梯度变化的耳膜动态调控与保护系统/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/kPa/i)).toBeInTheDocument();
  expect(screen.getByText(/下降|descent/i)).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the test and verify RED**

Run:

```bash
npm test -- src/app/page.test.tsx
```

Expected: FAIL because `src/app/page.tsx` and the required experience content do not exist.

- [ ] **Step 5: Create the smallest renderable Next.js shell**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroBalance",
  description: "Dynamic Tympanic Pressure Regulation and Protection System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <p>AeroBalance Flight Experience</p>
      <h1>面向环境压力梯度变化的耳膜动态调控与保护系统</h1>
      <p>Dynamic Tympanic Pressure Regulation and Protection System</p>
      <strong>78.0 kPa</strong>
      <span>下降 Descent</span>
    </main>
  );
}
```

Create `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  --ink-950: #06111f;
  --ink-900: #0b1c31;
  --sky-500: #38a7ff;
  --cyan-400: #41e2e8;
  --indigo-400: #818cf8;
  --cloud-50: #f6fafd;
  --slate-500: #66788a;
  --success-400: #45d19a;
  --warning-400: #f3b64a;
  --danger-400: #ff6b6b;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--ink-950);
}

body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at 50% 0%, rgb(36 104 155 / 28%), transparent 38rem),
    var(--ink-950);
  color: var(--cloud-50);
  font-family: Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
}

button,
a,
input,
select {
  font: inherit;
}
```

Create the initial `next.config.mjs`:

```js
export default {
  reactStrictMode: true,
};
```

Create the initial `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3000" },
});
```

- [ ] **Step 6: Verify GREEN and production compilation**

Run:

```bash
npm test -- src/app/page.test.tsx
npm run lint
npm run build
```

Expected: the render test passes, TypeScript exits with code 0, and Next.js creates `.next`.

- [ ] **Step 7: Add generated files to `.gitignore` and commit**

Append:

```gitignore
node_modules/
.next/
out/
coverage/
playwright-report/
test-results/
public/sw.js
public/sw.js.map
.DS_Store
```

Run:

```bash
git add package.json package-lock.json next.config.mjs postcss.config.mjs tsconfig.json next-env.d.ts vitest.config.ts playwright.config.ts src .gitignore
git commit -m "chore: bootstrap AeroBalance web app"
```

Expected: clean commit containing the runnable baseline.

---

### Task 2: Define Domain Contracts and Deterministic Seed Data

**Files:**
- Create: `src/types/domain.ts`
- Create: `src/lib/seed.ts`
- Create: `src/lib/seed.test.ts`

- [ ] **Step 1: Write failing seed-data tests**

Create `src/lib/seed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "./seed";

describe("seed profiles", () => {
  it("contains three distinct bilateral demonstration profiles", () => {
    expect(seedProfiles.map((profile) => profile.id)).toEqual([
      "user-a",
      "user-b",
      "user-c",
    ]);
    expect(seedProfiles[0].input.leftSensitivity).toBeGreaterThan(
      seedProfiles[0].input.rightSensitivity,
    );
    expect(seedProfiles[2].input.rightSensitivity).toBeGreaterThan(
      seedProfiles[2].input.leftSensitivity,
    );
  });
});

describe("flight seed", () => {
  it("generates deterministic complete flight stages", () => {
    const first = createFlightSeed("session-1");
    const second = createFlightSeed("session-1");

    expect(first).toEqual(second);
    expect(new Set(first.map((sample) => sample.phase))).toEqual(
      new Set(["takeoff", "cruise", "descent", "landing"]),
    );
    expect(first[0].pressure).toBeCloseTo(101.3, 1);
    expect(first.at(-1)?.pressure).toBeCloseTo(101.3, 1);
  });

  it("models takeoff downward and descent upward", () => {
    const samples = createFlightSeed("session-2");
    const takeoff = samples.filter((sample) => sample.phase === "takeoff");
    const descent = samples.filter((sample) => sample.phase === "descent");

    expect(takeoff.at(-1)!.pressure).toBeLessThan(takeoff[0].pressure);
    expect(descent.at(-1)!.pressure).toBeGreaterThan(descent[0].pressure);
    expect(samples.every((sample) => sample.source === "mock")).toBe(true);
  });
});
```

- [ ] **Step 2: Run seed tests and verify RED**

Run:

```bash
npm test -- src/lib/seed.test.ts
```

Expected: FAIL because `domain.ts` and `seed.ts` do not exist.

- [ ] **Step 3: Define shared types**

Create `src/types/domain.ts`:

```ts
export type Locale = "zh-CN" | "en";
export type FlightPhase =
  | "takeoff"
  | "cruise"
  | "descent"
  | "landing"
  | "demo";
export type RiskLevel = "low" | "medium" | "high";
export type DataSource = "bluetooth" | "mock";
export type Congestion = "none" | "mild" | "noticeable";
export type FlightFrequency = "rare" | "occasional" | "frequent";

export interface PressureSample {
  id: string;
  sessionId: string;
  pressure: number;
  temperature?: number;
  battery?: number;
  phase: FlightPhase;
  timestamp: number;
  source: DataSource;
}

export interface EarProfileInput {
  age: number;
  congestion: Congestion;
  previousDiscomfort: number;
  equalizationAbility: number;
  leftSensitivity: number;
  rightSensitivity: number;
  flightFrequency: FlightFrequency;
}

export interface EarProfileResult {
  leftRisk: number;
  rightRisk: number;
  toleranceScore: number;
  adaptationSpeed: number;
  leftRadar: number[];
  rightRadar: number[];
}

export interface PredictionPoint {
  timestamp: number;
  pressure: number;
  kind: "history" | "forecast";
  minuteOffset: number;
}

export interface PredictionResult {
  points: PredictionPoint[];
  pressure5: number;
  pressure10: number;
  pressure15: number;
  slope: number;
  trend: "rising" | "stable" | "falling";
  confidence: number;
  stressIndex: number;
}

export interface EarStrategy {
  side: "left" | "right";
  riskScore: number;
  stressIndex: number;
  combinedBurden: number;
  level: 1 | 2 | 3 | 4 | 5;
  smoothingFactor: number;
  recommendationKey: string;
}

export interface BilateralStrategy {
  left: EarStrategy;
  right: EarStrategy;
  independent: boolean;
}

export interface TargetCurvePoint {
  timestamp: number;
  environmental: number;
  leftTarget: number;
  rightTarget: number;
  phase: FlightPhase;
}

export interface AnalysisResult {
  comfortScore: number;
  riskLevel: RiskLevel;
  leftBurden: number;
  rightBurden: number;
  recommendationKeys: string[];
}

export interface SeedProfile {
  id: "user-a" | "user-b" | "user-c";
  nameKey: string;
  input: EarProfileInput;
}
```

- [ ] **Step 4: Implement deterministic profiles and flight formulas**

Create `src/lib/seed.ts`:

```ts
import type {
  FlightPhase,
  PressureSample,
  SeedProfile,
} from "@/types/domain";

export const seedProfiles: SeedProfile[] = [
  {
    id: "user-a",
    nameKey: "profile.seedA",
    input: {
      age: 34,
      congestion: "mild",
      previousDiscomfort: 8,
      equalizationAbility: 3,
      leftSensitivity: 5,
      rightSensitivity: 2,
      flightFrequency: "occasional",
    },
  },
  {
    id: "user-b",
    nameKey: "profile.seedB",
    input: {
      age: 29,
      congestion: "none",
      previousDiscomfort: 2,
      equalizationAbility: 5,
      leftSensitivity: 2,
      rightSensitivity: 2,
      flightFrequency: "frequent",
    },
  },
  {
    id: "user-c",
    nameKey: "profile.seedC",
    input: {
      age: 47,
      congestion: "noticeable",
      previousDiscomfort: 7,
      equalizationAbility: 2,
      leftSensitivity: 3,
      rightSensitivity: 5,
      flightFrequency: "rare",
    },
  },
];

const stage = (
  sessionId: string,
  phase: Exclude<FlightPhase, "demo">,
  startAt: number,
  durationMinutes: number,
  from: number,
  to: number,
  batteryStart: number,
): PressureSample[] => {
  const count = durationMinutes * 2 + 1;

  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const eased =
      phase === "cruise"
        ? 0
        : progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const cruiseWave = phase === "cruise" ? Math.sin(index * 0.58) * 0.18 : 0;
    const settlingWave =
      phase === "landing" ? Math.sin(index * 0.9) * (1 - progress) * 0.08 : 0;
    const pressure =
      phase === "cruise"
        ? from + cruiseWave
        : from + (to - from) * eased + settlingWave;

    return {
      id: `${sessionId}-${phase}-${index}`,
      sessionId,
      pressure: Number(pressure.toFixed(3)),
      temperature: Number((24.8 + progress * 0.8).toFixed(1)),
      battery: Math.max(0, batteryStart - Math.floor(index / 40)),
      phase,
      timestamp: startAt + index * 30_000,
      source: "mock",
    };
  });
};

export function createFlightSeed(
  sessionId: string,
  startAt = 1_710_000_000_000,
): PressureSample[] {
  const takeoff = stage(
    sessionId,
    "takeoff",
    startAt,
    22,
    101.3,
    78,
    87,
  );
  const cruiseStart = takeoff.at(-1)!.timestamp + 30_000;
  const cruise = stage(
    sessionId,
    "cruise",
    cruiseStart,
    36,
    78,
    78,
    86,
  );
  const descentStart = cruise.at(-1)!.timestamp + 30_000;
  const descent = stage(
    sessionId,
    "descent",
    descentStart,
    20,
    78,
    98.5,
    85,
  );
  const landingStart = descent.at(-1)!.timestamp + 30_000;
  const landing = stage(
    sessionId,
    "landing",
    landingStart,
    8,
    98.5,
    101.3,
    84,
  );

  return [...takeoff, ...cruise, ...descent, ...landing];
}
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- src/lib/seed.test.ts
npm run lint
```

Expected: all seed tests pass and strict TypeScript reports no errors.

- [ ] **Step 6: Commit domain contracts and seed data**

Run:

```bash
git add src/types/domain.ts src/lib/seed.ts src/lib/seed.test.ts
git commit -m "feat: add deterministic flight seed data"
```

---

### Task 3: Implement the Ear Profile Engine

**Files:**
- Create: `src/lib/profile.ts`
- Create: `src/lib/profile.test.ts`

- [ ] **Step 1: Write failing profile-engine tests**

Create `src/lib/profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { seedProfiles } from "./seed";
import { calculateEarProfile } from "./profile";

describe("calculateEarProfile", () => {
  it("produces bilateral asymmetry for User A", () => {
    const result = calculateEarProfile(seedProfiles[0].input);
    expect(result.leftRisk).toBeGreaterThan(result.rightRisk);
    expect(result.leftRisk).toBeGreaterThanOrEqual(60);
    expect(result.leftRadar).toHaveLength(5);
    expect(result.rightRadar).toHaveLength(5);
  });

  it("gives the frequent adapted profile higher tolerance than User C", () => {
    const userB = calculateEarProfile(seedProfiles[1].input);
    const userC = calculateEarProfile(seedProfiles[2].input);
    expect(userB.toleranceScore).toBeGreaterThan(userC.toleranceScore);
    expect(userB.adaptationSpeed).toBeGreaterThan(userC.adaptationSpeed);
  });

  it("clamps invalid numeric inputs into the documented ranges", () => {
    const result = calculateEarProfile({
      ...seedProfiles[0].input,
      age: 400,
      previousDiscomfort: 80,
      leftSensitivity: 20,
      equalizationAbility: -2,
    });
    expect(result.leftRisk).toBeGreaterThanOrEqual(0);
    expect(result.leftRisk).toBeLessThanOrEqual(100);
    expect(result.toleranceScore).toBeGreaterThanOrEqual(0);
    expect(result.toleranceScore).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run profile tests and verify RED**

Run:

```bash
npm test -- src/lib/profile.test.ts
```

Expected: FAIL because `calculateEarProfile` does not exist.

- [ ] **Step 3: Implement the pure profile engine**

Create `src/lib/profile.ts`:

```ts
import type { EarProfileInput, EarProfileResult } from "@/types/domain";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Number(value.toFixed(1));

export function calculateEarProfile(
  raw: EarProfileInput,
): EarProfileResult {
  const age = clamp(raw.age, 1, 100);
  const discomfort = clamp(raw.previousDiscomfort, 0, 10);
  const equalization = clamp(raw.equalizationAbility, 1, 5);
  const leftSensitivity = clamp(raw.leftSensitivity, 1, 5);
  const rightSensitivity = clamp(raw.rightSensitivity, 1, 5);

  const equalizationBurden = ((5 - equalization) / 4) * 100;
  const discomfortBurden = (discomfort / 10) * 100;
  const congestionBurden = {
    none: 0,
    mild: 45,
    noticeable: 85,
  }[raw.congestion];
  const ageBurden = age < 12 ? 20 : age > 60 ? 15 : 0;
  const sensitivityBurden = (value: number) => ((value - 1) / 4) * 100;

  const riskFor = (sensitivity: number) =>
    clamp(
      sensitivityBurden(sensitivity) * 0.35 +
        equalizationBurden * 0.25 +
        discomfortBurden * 0.2 +
        congestionBurden * 0.12 +
        ageBurden * 0.08,
    );

  const leftRisk = riskFor(leftSensitivity);
  const rightRisk = riskFor(rightSensitivity);
  const toleranceScore = clamp(
    100 -
      ((leftRisk + rightRisk) / 2) * 0.55 -
      equalizationBurden * 0.3 -
      discomfortBurden * 0.15,
  );
  const frequencyBenefit = {
    rare: 15,
    occasional: 55,
    frequent: 90,
  }[raw.flightFrequency];
  const equalizationNormalized = ((equalization - 1) / 4) * 100;
  const adaptationSpeed = clamp(
    equalizationNormalized * 0.5 +
      frequencyBenefit * 0.3 +
      (100 - discomfortBurden) * 0.2,
  );
  const radarFor = (sensitivity: number) => [
    sensitivityBurden(sensitivity),
    equalizationBurden,
    discomfortBurden,
    congestionBurden,
    100 - adaptationSpeed,
  ];

  return {
    leftRisk: round(leftRisk),
    rightRisk: round(rightRisk),
    toleranceScore: round(toleranceScore),
    adaptationSpeed: round(adaptationSpeed),
    leftRadar: radarFor(leftSensitivity).map(round),
    rightRadar: radarFor(rightSensitivity).map(round),
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/profile.test.ts
npm run lint
```

Expected: three profile tests pass.

- [ ] **Step 5: Commit the Ear Profile Engine**

Run:

```bash
git add src/lib/profile.ts src/lib/profile.test.ts
git commit -m "feat: add ear profile engine"
```

---

### Task 4: Implement Pressure Prediction

**Files:**
- Create: `src/lib/prediction.ts`
- Create: `src/lib/prediction.test.ts`

- [ ] **Step 1: Write failing forecast tests**

Create `src/lib/prediction.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { PressureSample } from "@/types/domain";
import { predictPressure } from "./prediction";

const samples = (pressures: number[]): PressureSample[] =>
  pressures.map((pressure, index) => ({
    id: String(index),
    sessionId: "test",
    pressure,
    phase: "descent",
    timestamp: 1_710_000_000_000 + index * 60_000,
    source: "mock",
  }));

describe("predictPressure", () => {
  it("predicts a rising 15-minute pressure trend", () => {
    const result = predictPressure(samples([80, 81, 82, 83, 84]));
    expect(result.trend).toBe("rising");
    expect(result.pressure5).toBeCloseTo(89, 1);
    expect(result.pressure15).toBeCloseTo(99, 1);
    expect(result.points.filter((point) => point.kind === "forecast")).toHaveLength(
      15,
    );
  });

  it("identifies a stable pressure window", () => {
    const result = predictPressure(samples([78, 78.01, 77.99, 78]));
    expect(result.trend).toBe("stable");
    expect(result.stressIndex).toBeLessThan(10);
  });

  it("rejects insufficient history", () => {
    expect(() => predictPressure(samples([80, 81]))).toThrow(
      "At least three pressure samples are required",
    );
  });
});
```

- [ ] **Step 2: Run prediction tests and verify RED**

Run:

```bash
npm test -- src/lib/prediction.test.ts
```

Expected: FAIL because `predictPressure` does not exist.

- [ ] **Step 3: Implement sliding-window linear prediction**

Create `src/lib/prediction.ts`:

```ts
import type {
  PredictionPoint,
  PredictionResult,
  PressureSample,
} from "@/types/domain";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Number(value.toFixed(2));

export function predictPressure(
  input: PressureSample[],
): PredictionResult {
  const sorted = [...input]
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(
      (sample, index, values) =>
        index === 0 || sample.timestamp !== values[index - 1].timestamp,
    )
    .slice(-20);

  if (sorted.length < 3) {
    throw new Error("At least three pressure samples are required");
  }

  const origin = sorted[0].timestamp;
  const points = sorted.map((sample) => ({
    x: (sample.timestamp - origin) / 60_000,
    y: sample.pressure,
  }));
  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const numerator = points.reduce(
    (sum, point) => sum + (point.x - xMean) * (point.y - yMean),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + Math.pow(point.x - xMean, 2),
    0,
  );
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  const predicted = (minute: number) => intercept + slope * minute;
  const residual = points.reduce(
    (sum, point) => sum + Math.pow(point.y - predicted(point.x), 2),
    0,
  );
  const total = points.reduce(
    (sum, point) => sum + Math.pow(point.y - yMean, 2),
    0,
  );
  const rSquared = total === 0 ? 1 : 1 - residual / total;
  const last = sorted.at(-1)!;
  const lastMinute = points.at(-1)!.x;

  const history: PredictionPoint[] = sorted.map((sample) => ({
    timestamp: sample.timestamp,
    pressure: sample.pressure,
    kind: "history",
    minuteOffset: (sample.timestamp - last.timestamp) / 60_000,
  }));
  const forecast: PredictionPoint[] = Array.from({ length: 15 }, (_, index) => {
    const minuteOffset = index + 1;
    return {
      timestamp: last.timestamp + minuteOffset * 60_000,
      pressure: round(clamp(predicted(lastMinute + minuteOffset), 72, 103)),
      kind: "forecast",
      minuteOffset,
    };
  });

  const pressureAt = (offset: 5 | 10 | 15) =>
    forecast[offset - 1].pressure;
  const variance =
    sorted.reduce(
      (sum, sample) => sum + Math.pow(sample.pressure - yMean, 2),
      0,
    ) / sorted.length;
  const standardDeviation = Math.sqrt(variance);
  const rateStress = clamp((Math.abs(slope) / 1.2) * 100, 0, 100);
  const forecastStress = clamp(
    (Math.abs(pressureAt(15) - last.pressure) / 12) * 100,
    0,
    100,
  );
  const volatilityStress = clamp(
    (standardDeviation / 1.5) * 100,
    0,
    100,
  );
  const sampleConfidence = Math.min(sorted.length / 12, 1);
  const fitConfidence = clamp(rSquared, 0, 1);

  return {
    points: [...history, ...forecast],
    pressure5: pressureAt(5),
    pressure10: pressureAt(10),
    pressure15: pressureAt(15),
    slope: round(slope),
    trend: slope > 0.05 ? "rising" : slope < -0.05 ? "falling" : "stable",
    confidence: round((sampleConfidence * 0.4 + fitConfidence * 0.6) * 100),
    stressIndex: round(
      rateStress * 0.55 + forecastStress * 0.3 + volatilityStress * 0.15,
    ),
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/prediction.test.ts
npm run lint
```

Expected: rising, stable, and insufficient-history tests pass.

- [ ] **Step 5: Commit prediction**

Run:

```bash
git add src/lib/prediction.ts src/lib/prediction.test.ts
git commit -m "feat: add pressure prediction engine"
```

---

### Task 5: Implement Bilateral Strategy, Target Curves, and Results

**Files:**
- Create: `src/lib/strategy.ts`
- Create: `src/lib/strategy.test.ts`
- Create: `src/lib/target-curve.ts`
- Create: `src/lib/target-curve.test.ts`
- Create: `src/lib/result.ts`
- Create: `src/lib/result.test.ts`

- [ ] **Step 1: Write failing bilateral-strategy tests**

Create `src/lib/strategy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createBilateralStrategy } from "./strategy";

describe("createBilateralStrategy", () => {
  it("creates independent higher smoothing for the higher-risk ear", () => {
    const strategy = createBilateralStrategy(
      { leftRisk: 82, rightRisk: 35 },
      70,
      "descent",
      "rising",
    );
    expect(strategy.independent).toBe(true);
    expect(strategy.left.level).toBeGreaterThan(strategy.right.level);
    expect(strategy.left.smoothingFactor).toBeGreaterThan(
      strategy.right.smoothingFactor,
    );
  });

  it("keeps every strategy within level and smoothing bounds", () => {
    const strategy = createBilateralStrategy(
      { leftRisk: 100, rightRisk: 0 },
      100,
      "landing",
      "rising",
    );
    expect(strategy.left.level).toBe(5);
    expect(strategy.left.smoothingFactor).toBeLessThanOrEqual(0.74);
    expect(strategy.right.smoothingFactor).toBeGreaterThanOrEqual(0.14);
  });
});
```

- [ ] **Step 2: Write failing target-curve and result tests**

Create `src/lib/target-curve.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { PressureSample } from "@/types/domain";
import { createTargetCurves, meanCurveGap } from "./target-curve";

const history: PressureSample[] = [78, 82, 88, 96].map((pressure, index) => ({
  id: String(index),
  sessionId: "target",
  pressure,
  phase: "descent",
  timestamp: index * 60_000,
  source: "mock",
}));

it("makes the higher-smoothing ear respond more gradually", () => {
  const curves = createTargetCurves(history, 0.7, 0.2);
  const final = curves.at(-1)!;
  expect(final.leftTarget).toBeLessThan(final.rightTarget);
  expect(final.rightTarget).toBeLessThan(final.environmental);
  expect(curves[0].leftTarget).toBe(history[0].pressure);
  expect(meanCurveGap(curves, "leftTarget")).toBeGreaterThan(
    meanCurveGap(curves, "rightTarget"),
  );
});
```

Create `src/lib/result.test.ts`:

```ts
import { expect, it } from "vitest";
import { composeAnalysisResult } from "./result";

it("bases comfort and risk on the worse ear", () => {
  const result = composeAnalysisResult(80, 35, 70, true, "descent");
  expect(result.riskLevel).toBe("high");
  expect(result.comfortScore).toBeLessThan(40);
  expect(result.recommendationKeys).toContain("recommendation.independent");
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npm test -- src/lib/strategy.test.ts src/lib/target-curve.test.ts src/lib/result.test.ts
```

Expected: FAIL because all three engines are missing.

- [ ] **Step 4: Implement bilateral strategy**

Create `src/lib/strategy.ts`:

```ts
import type {
  BilateralStrategy,
  EarStrategy,
  FlightPhase,
  PredictionResult,
} from "@/types/domain";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const levelFor = (burden: number): 1 | 2 | 3 | 4 | 5 =>
  burden < 20 ? 1 : burden < 40 ? 2 : burden < 60 ? 3 : burden < 80 ? 4 : 5;

export function createBilateralStrategy(
  risk: { leftRisk: number; rightRisk: number },
  stressIndex: number,
  phase: FlightPhase,
  trend: PredictionResult["trend"],
): BilateralStrategy {
  const create = (side: "left" | "right", riskScore: number): EarStrategy => {
    const combinedBurden = riskScore * 0.6 + stressIndex * 0.4;
    const level = levelFor(combinedBurden);
    const smoothingFactor = clamp(
      0.14 + (level - 1) * 0.13 + (riskScore / 100) * 0.08,
      0.14,
      0.74,
    );
    const recommendationKey =
      phase === "descent" || phase === "landing"
        ? trend === "rising"
          ? "recommendation.gradualDescent"
          : "recommendation.monitor"
        : level >= 4
          ? "recommendation.highSmoothing"
          : "recommendation.steady";

    return {
      side,
      riskScore: Number(riskScore.toFixed(1)),
      stressIndex: Number(stressIndex.toFixed(1)),
      combinedBurden: Number(combinedBurden.toFixed(1)),
      level,
      smoothingFactor: Number(smoothingFactor.toFixed(3)),
      recommendationKey,
    };
  };

  const left = create("left", risk.leftRisk);
  const right = create("right", risk.rightRisk);

  return {
    left,
    right,
    independent:
      Math.abs(risk.leftRisk - risk.rightRisk) >= 15 ||
      left.level !== right.level,
  };
}
```

- [ ] **Step 5: Implement target curves**

Create `src/lib/target-curve.ts`:

```ts
import type { PressureSample, TargetCurvePoint } from "@/types/domain";

export function createTargetCurves(
  samples: PressureSample[],
  leftSmoothing: number,
  rightSmoothing: number,
): TargetCurvePoint[] {
  if (samples.length === 0) return [];

  let left = samples[0].pressure;
  let right = samples[0].pressure;

  return samples.map((sample, index) => {
    if (index > 0) {
      left += (sample.pressure - left) * (1 - leftSmoothing);
      right += (sample.pressure - right) * (1 - rightSmoothing);
    }
    return {
      timestamp: sample.timestamp,
      environmental: sample.pressure,
      leftTarget: Number(left.toFixed(3)),
      rightTarget: Number(right.toFixed(3)),
      phase: sample.phase,
    };
  });
}

export function maxCurveRate(
  points: TargetCurvePoint[],
  side: "leftTarget" | "rightTarget",
): number {
  return points.slice(1).reduce((maximum, point, index) => {
    const previous = points[index];
    const minutes = (point.timestamp - previous.timestamp) / 60_000;
    const rate =
      minutes <= 0 ? 0 : Math.abs(point[side] - previous[side]) / minutes;
    return Math.max(maximum, rate);
  }, 0);
}

export function meanCurveGap(
  points: TargetCurvePoint[],
  side: "leftTarget" | "rightTarget",
): number {
  if (!points.length) return 0;
  return (
    points.reduce(
      (sum, point) => sum + Math.abs(point.environmental - point[side]),
      0,
    ) / points.length
  );
}
```

- [ ] **Step 6: Implement result composition**

Create `src/lib/result.ts`:

```ts
import type {
  AnalysisResult,
  FlightPhase,
  RiskLevel,
} from "@/types/domain";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function composeAnalysisResult(
  leftRisk: number,
  rightRisk: number,
  pressureStress: number,
  independent: boolean,
  phase: FlightPhase,
): AnalysisResult {
  const leftBurden = leftRisk * 0.6 + pressureStress * 0.4;
  const rightBurden = rightRisk * 0.6 + pressureStress * 0.4;
  const asymmetryPenalty = Math.min(
    Math.abs(leftBurden - rightBurden) * 0.15,
    10,
  );
  const comfortScore = clamp(
    100 - Math.max(leftBurden, rightBurden) * 0.85 - asymmetryPenalty,
  );
  const worst = Math.max(leftBurden, rightBurden);
  const riskLevel: RiskLevel =
    worst < 35 ? "low" : worst < 65 ? "medium" : "high";
  const recommendationKeys = [
    phase === "descent" || phase === "landing"
      ? "recommendation.watchRate"
      : "recommendation.monitor",
    worst >= 65
      ? "recommendation.highSmoothing"
      : "recommendation.steady",
  ];

  if (independent) {
    recommendationKeys.push("recommendation.independent");
  }

  return {
    comfortScore: Number(comfortScore.toFixed(0)),
    riskLevel,
    leftBurden: Number(leftBurden.toFixed(1)),
    rightBurden: Number(rightBurden.toFixed(1)),
    recommendationKeys,
  };
}
```

- [ ] **Step 7: Verify GREEN and all domain regressions**

Run:

```bash
npm test -- src/lib
npm run lint
```

Expected: seed, profile, prediction, strategy, target-curve, and result tests all pass.

- [ ] **Step 8: Commit the analysis pipeline**

Run:

```bash
git add src/lib/strategy.ts src/lib/strategy.test.ts src/lib/target-curve.ts src/lib/target-curve.test.ts src/lib/result.ts src/lib/result.test.ts
git commit -m "feat: add bilateral adaptation pipeline"
```

---

### Task 6: Add Native Persistence and the Active Session Store

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`
- Create: `src/store/useAppStore.ts`
- Create: `src/store/useAppStore.test.ts`

- [ ] **Step 1: Write failing IndexedDB tests**

Create `src/lib/storage.test.ts`:

```ts
import { beforeEach, expect, it } from "vitest";
import type { PressureSample } from "@/types/domain";
import {
  clearPressureDatabase,
  loadSessionSamples,
  listPressureSessions,
  pruneOldSessions,
  savePressureSample,
  savePressureSession,
} from "./storage";

const sample: PressureSample = {
  id: "sample-1",
  sessionId: "session-1",
  pressure: 82.6,
  temperature: 25.3,
  battery: 87,
  phase: "descent",
  timestamp: 1_710_000_000_000,
  source: "mock",
};

beforeEach(async () => {
  await clearPressureDatabase();
});

it("stores and retrieves pressure samples by session", async () => {
  await savePressureSession({
    id: "session-1",
    startedAt: sample.timestamp,
    source: "mock",
    seedId: "user-a",
  });
  await savePressureSample(sample);
  await savePressureSample({ ...sample, id: "sample-2", timestamp: sample.timestamp + 1 });

  const loaded = await loadSessionSamples("session-1");
  expect(loaded.map((item) => item.id)).toEqual(["sample-1", "sample-2"]);
});

it("retains only the newest 20 sessions", async () => {
  for (let index = 0; index < 22; index += 1) {
    await savePressureSession({
      id: `session-${index}`,
      startedAt: index,
      source: "mock",
    });
  }
  await pruneOldSessions(20);
  const sessions = await listPressureSessions();
  expect(sessions).toHaveLength(20);
  expect(sessions.some((session) => session.id === "session-0")).toBe(false);
  expect(sessions.some((session) => session.id === "session-21")).toBe(true);
});
```

- [ ] **Step 2: Write failing store derivation tests**

Create `src/store/useAppStore.test.ts`:

```ts
import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "./useAppStore";

beforeEach(() => {
  localStorage.clear();
  useAppStore.getState().resetSession();
});

it("loads a demo profile and derives the complete analysis chain", () => {
  const store = useAppStore.getState();
  store.loadSeedProfile(seedProfiles[0]);
  store.replacePressureHistory(
    createFlightSeed("store-test").filter((sample) => sample.phase === "descent"),
  );

  const state = useAppStore.getState();
  expect(state.profileResult?.leftRisk).toBeGreaterThan(
    state.profileResult?.rightRisk ?? 100,
  );
  expect(state.prediction).not.toBeNull();
  expect(state.strategy?.independent).toBe(true);
  expect(state.targetCurves.length).toBeGreaterThan(0);
  expect(state.analysis).not.toBeNull();
});

it("caps the active pressure history at 360 samples", () => {
  const store = useAppStore.getState();
  const source = createFlightSeed("large");
  store.replacePressureHistory([...source, ...source, ...source]);
  expect(useAppStore.getState().pressureHistory.length).toBeLessThanOrEqual(360);
});
```

- [ ] **Step 3: Run persistence tests and verify RED**

Run:

```bash
npm test -- src/lib/storage.test.ts src/store/useAppStore.test.ts
```

Expected: FAIL because storage operations and the Zustand store do not exist.

- [ ] **Step 4: Implement native IndexedDB storage**

Create `src/lib/storage.ts`:

```ts
import type { DataSource, PressureSample } from "@/types/domain";

const DATABASE = "aerobalance";
const VERSION = 1;

export interface PressureSessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  source: DataSource;
  profileId?: string;
  deviceName?: string;
  seedId?: "user-a" | "user-b" | "user-c";
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("sessions")) {
        const sessions = database.createObjectStore("sessions", {
          keyPath: "id",
        });
        sessions.createIndex("startedAt", "startedAt");
        sessions.createIndex("source", "source");
      }
      if (!database.objectStoreNames.contains("pressureSamples")) {
        const samples = database.createObjectStore("pressureSamples", {
          keyPath: "id",
        });
        samples.createIndex("sessionId", "sessionId");
        samples.createIndex("timestamp", "timestamp");
        samples.createIndex("sessionTimestamp", ["sessionId", "timestamp"], {
          unique: true,
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const complete = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

export async function savePressureSession(record: PressureSessionRecord) {
  const database = await openDatabase();
  const transaction = database.transaction("sessions", "readwrite");
  transaction.objectStore("sessions").put(record);
  await complete(transaction);
  database.close();
}

export async function savePressureSample(sample: PressureSample) {
  const database = await openDatabase();
  const transaction = database.transaction("pressureSamples", "readwrite");
  transaction.objectStore("pressureSamples").put(sample);
  await complete(transaction);
  database.close();
  await trimSessionSamples(sample.sessionId, 2_000);
}

async function trimSessionSamples(sessionId: string, maximum: number) {
  const database = await openDatabase();
  const transaction = database.transaction("pressureSamples", "readwrite");
  const store = transaction.objectStore("pressureSamples");
  const index = store.index("sessionTimestamp");
  const request = index.getAllKeys(
    IDBKeyRange.bound(
      [sessionId, 0],
      [sessionId, Number.MAX_SAFE_INTEGER],
    ),
  );
  request.onsuccess = () => {
    const excess = request.result.slice(0, Math.max(0, request.result.length - maximum));
    excess.forEach((key) => store.delete(key));
  };
  await complete(transaction);
  database.close();
}

export async function loadSessionSamples(
  sessionId: string,
): Promise<PressureSample[]> {
  const database = await openDatabase();
  const transaction = database.transaction("pressureSamples", "readonly");
  const index = transaction.objectStore("pressureSamples").index("sessionId");
  const request = index.getAll(sessionId);
  const samples = await new Promise<PressureSample[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return samples.sort((a, b) => a.timestamp - b.timestamp);
}

export async function listPressureSessions(): Promise<PressureSessionRecord[]> {
  const database = await openDatabase();
  const transaction = database.transaction("sessions", "readonly");
  const request = transaction.objectStore("sessions").getAll();
  const records = await new Promise<PressureSessionRecord[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return records.sort((a, b) => b.startedAt - a.startedAt);
}

export async function pruneOldSessions(maximum = 20) {
  const stale = (await listPressureSessions()).slice(maximum);
  if (!stale.length) return;
  const database = await openDatabase();
  const transaction = database.transaction(
    ["sessions", "pressureSamples"],
    "readwrite",
  );
  const sessions = transaction.objectStore("sessions");
  const samples = transaction.objectStore("pressureSamples");
  const sessionIndex = samples.index("sessionId");
  stale.forEach((session) => {
    sessions.delete(session.id);
    const request = sessionIndex.getAllKeys(session.id);
    request.onsuccess = () => request.result.forEach((key) => samples.delete(key));
  });
  await complete(transaction);
  database.close();
}

export async function clearPressureDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
```

- [ ] **Step 5: Implement the Zustand store and one derivation action**

Create `src/store/useAppStore.ts`:

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateEarProfile } from "@/lib/profile";
import { predictPressure } from "@/lib/prediction";
import { composeAnalysisResult } from "@/lib/result";
import {
  pruneOldSessions,
  savePressureSample,
  savePressureSession,
} from "@/lib/storage";
import { createBilateralStrategy } from "@/lib/strategy";
import { createTargetCurves } from "@/lib/target-curve";
import type {
  AnalysisResult,
  BilateralStrategy,
  EarProfileInput,
  EarProfileResult,
  FlightPhase,
  Locale,
  PredictionResult,
  PressureSample,
  SeedProfile,
  TargetCurvePoint,
} from "@/types/domain";

interface AppState {
  locale: Locale;
  profileInput: EarProfileInput | null;
  profileResult: EarProfileResult | null;
  selectedSeedId: SeedProfile["id"] | null;
  phase: FlightPhase;
  source: "bluetooth" | "mock" | null;
  isPlaying: boolean;
  playbackSpeed: 1 | 4;
  activeSessionId: string | null;
  pressureHistory: PressureSample[];
  prediction: PredictionResult | null;
  strategy: BilateralStrategy | null;
  targetCurves: TargetCurvePoint[];
  analysis: AnalysisResult | null;
  setLocale(locale: Locale): void;
  setPhase(phase: FlightPhase): void;
  setPlayback(isPlaying: boolean): void;
  setPlaybackSpeed(speed: 1 | 4): void;
  loadSeedProfile(profile: SeedProfile): void;
  setProfile(input: EarProfileInput): void;
  appendPressureSample(sample: PressureSample): void;
  replacePressureHistory(samples: PressureSample[]): void;
  resetSession(): void;
}

const derived = (
  profileInput: EarProfileInput | null,
  pressureHistory: PressureSample[],
) => {
  if (!profileInput) {
    return {
      profileResult: null,
      prediction: null,
      strategy: null,
      targetCurves: [],
      analysis: null,
    };
  }
  const profileResult = calculateEarProfile(profileInput);
  if (pressureHistory.length < 3) {
    return {
      profileResult,
      prediction: null,
      strategy: null,
      targetCurves: [],
      analysis: null,
    };
  }
  const prediction = predictPressure(pressureHistory);
  const phase = pressureHistory.at(-1)?.phase ?? "demo";
  const strategy = createBilateralStrategy(
    profileResult,
    prediction.stressIndex,
    phase,
    prediction.trend,
  );
  const forecastSamples: PressureSample[] = prediction.points
    .filter((point) => point.kind === "forecast")
    .map((point) => ({
      id: `forecast-${point.timestamp}`,
      sessionId: pressureHistory.at(-1)!.sessionId,
      pressure: point.pressure,
      phase,
      timestamp: point.timestamp,
      source: pressureHistory.at(-1)!.source,
    }));
  const targetCurves = createTargetCurves(
    [...pressureHistory, ...forecastSamples],
    strategy.left.smoothingFactor,
    strategy.right.smoothingFactor,
  );
  const analysis = composeAnalysisResult(
    profileResult.leftRisk,
    profileResult.rightRisk,
    prediction.stressIndex,
    strategy.independent,
    phase,
  );
  return { profileResult, prediction, strategy, targetCurves, analysis };
};

const initial = {
  locale: "zh-CN" as Locale,
  profileInput: null,
  profileResult: null,
  selectedSeedId: null,
  phase: "descent" as FlightPhase,
  source: null,
  isPlaying: false,
  playbackSpeed: 1 as 1 | 4,
  activeSessionId: null,
  pressureHistory: [],
  prediction: null,
  strategy: null,
  targetCurves: [],
  analysis: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setLocale: (locale) => set({ locale }),
      setPhase: (phase) => set({ phase }),
      setPlayback: (isPlaying) => set({ isPlaying }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      loadSeedProfile: (profile) =>
        set((state) => ({
          profileInput: profile.input,
          selectedSeedId: profile.id,
          ...derived(profile.input, state.pressureHistory),
        })),
      setProfile: (profileInput) =>
        set((state) => ({
          profileInput,
          selectedSeedId: null,
          ...derived(profileInput, state.pressureHistory),
        })),
      appendPressureSample: (sample) =>
        set((state) => {
          if (
            state.pressureHistory.some(
              (item) =>
                item.sessionId === sample.sessionId &&
                item.timestamp === sample.timestamp,
            )
          ) {
            return state;
          }
          const pressureHistory = [...state.pressureHistory, sample].slice(-360);
          void savePressureSample(sample).catch(() => undefined);
          return {
            pressureHistory,
            activeSessionId: sample.sessionId,
            source: sample.source,
            phase: sample.phase,
            ...derived(state.profileInput, pressureHistory),
          };
        }),
      replacePressureHistory: (samples) =>
        set((state) => {
          const pressureHistory = [...samples]
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-360);
          const last = pressureHistory.at(-1);
          if (last) {
            void savePressureSession({
              id: last.sessionId,
              startedAt: pressureHistory[0].timestamp,
              source: last.source,
            })
              .then(() =>
                Promise.all(
                  pressureHistory.map((sample) =>
                    savePressureSample(sample).catch(() => undefined),
                  ),
                ),
              )
              .then(() => pruneOldSessions(20))
              .catch(() => undefined);
          }
          return {
            pressureHistory,
            activeSessionId: last?.sessionId ?? null,
            source: pressureHistory.at(-1)?.source ?? null,
            phase: pressureHistory.at(-1)?.phase ?? state.phase,
            ...derived(state.profileInput, pressureHistory),
          };
        }),
      resetSession: () =>
        set((state) => ({
          ...initial,
          locale: state.locale,
        })),
    }),
    {
      name: "aerobalance:settings:v1",
      partialize: (state) => ({
        locale: state.locale,
        profileInput: state.profileInput,
        selectedSeedId: state.selectedSeedId,
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
);
```

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm test -- src/lib/storage.test.ts src/store/useAppStore.test.ts
npm run lint
```

Expected: persistence and complete store derivation tests pass.

- [ ] **Step 7: Commit persistence and session state**

Run:

```bash
git add src/lib/storage.ts src/lib/storage.test.ts src/store/useAppStore.ts src/store/useAppStore.test.ts
git commit -m "feat: add local session persistence"
```

---

### Task 7: Implement BLE Parsing and ESP32-C3 Connection

**Files:**
- Create: `src/config/bluetooth.ts`
- Create: `src/types/bluetooth.d.ts`
- Create: `src/lib/bluetooth.ts`
- Create: `src/lib/bluetooth.test.ts`

- [ ] **Step 1: Write failing BLE protocol tests**

Create `src/lib/bluetooth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseBluetoothPayload } from "./bluetooth";

describe("parseBluetoothPayload", () => {
  it("normalizes a valid notify payload", () => {
    const result = parseBluetoothPayload(
      JSON.stringify({
        pressure: 82.6,
        temperature: 25.3,
        battery: 87,
        phase: "descent",
        timestamp: 1_710_000_000_000,
      }),
      "session-1",
    );
    expect(result).toMatchObject({
      pressure: 82.6,
      temperature: 25.3,
      battery: 87,
      phase: "descent",
      source: "bluetooth",
    });
  });

  it.each([
    "{}",
    "{\"pressure\":\"82.6\",\"phase\":\"descent\",\"timestamp\":1}",
    "{\"pressure\":900,\"phase\":\"descent\",\"timestamp\":1}",
    "{\"pressure\":82,\"phase\":\"unknown\",\"timestamp\":1}",
    "not-json",
  ])("rejects malformed payload %s", (payload) => {
    expect(() => parseBluetoothPayload(payload, "session-1")).toThrow(
      "INVALID_BLE_PAYLOAD",
    );
  });
});
```

- [ ] **Step 2: Run BLE tests and verify RED**

Run:

```bash
npm test -- src/lib/bluetooth.test.ts
```

Expected: FAIL because the parser is missing.

- [ ] **Step 3: Add BLE constants and minimal browser declarations**

Create `src/config/bluetooth.ts`:

```ts
export const DEVICE_NAME_PREFIX = "AeroBalance";
export const SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
export const CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
```

Create `src/types/bluetooth.d.ts`:

```ts
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface Bluetooth {
  requestDevice(options: {
    filters: Array<{ namePrefix: string }>;
    optionalServices: string[];
  }): Promise<BluetoothDevice>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
```

- [ ] **Step 4: Implement parsing and the connection client**

Create `src/lib/bluetooth.ts`:

```ts
import {
  CHARACTERISTIC_UUID,
  DEVICE_NAME_PREFIX,
  SERVICE_UUID,
} from "@/config/bluetooth";
import type { FlightPhase, PressureSample } from "@/types/domain";

const phases = new Set<FlightPhase>([
  "takeoff",
  "cruise",
  "descent",
  "landing",
  "demo",
]);

export function parseBluetoothPayload(
  payload: string,
  sessionId: string,
): PressureSample {
  try {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== "object") throw new Error();
    const record = value as Record<string, unknown>;
    if (
      typeof record.pressure !== "number" ||
      !Number.isFinite(record.pressure) ||
      record.pressure < 50 ||
      record.pressure > 120 ||
      typeof record.phase !== "string" ||
      !phases.has(record.phase as FlightPhase) ||
      typeof record.timestamp !== "number" ||
      !Number.isInteger(record.timestamp) ||
      record.timestamp <= 0
    ) {
      throw new Error();
    }
    if (
      record.temperature !== undefined &&
      (typeof record.temperature !== "number" ||
        record.temperature < -20 ||
        record.temperature > 80)
    ) {
      throw new Error();
    }
    if (
      record.battery !== undefined &&
      (typeof record.battery !== "number" ||
        record.battery < 0 ||
        record.battery > 100)
    ) {
      throw new Error();
    }
    return {
      id: `${sessionId}-${record.timestamp}`,
      sessionId,
      pressure: record.pressure,
      temperature: record.temperature as number | undefined,
      battery: record.battery as number | undefined,
      phase: record.phase as FlightPhase,
      timestamp: record.timestamp,
      source: "bluetooth",
    };
  } catch {
    throw new Error("INVALID_BLE_PAYLOAD");
  }
}

export interface BluetoothConnection {
  deviceName: string;
  disconnect(): Promise<void>;
}

export async function connectBluetooth(
  sessionId: string,
  onSample: (sample: PressureSample) => void,
  onInvalidData: () => void,
  onDisconnected: () => void,
): Promise<BluetoothConnection> {
  if (!window.isSecureContext || !navigator.bluetooth) {
    throw new Error("WEB_BLUETOOTH_UNSUPPORTED");
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: DEVICE_NAME_PREFIX }],
    optionalServices: [SERVICE_UUID],
  });
  if (!device.gatt) throw new Error("GATT_UNAVAILABLE");
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
  const decoder = new TextDecoder();
  const onValue = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    try {
      onSample(
        parseBluetoothPayload(
          decoder.decode(target.value),
          sessionId,
        ),
      );
    } catch {
      onInvalidData();
    }
  };
  const onDisconnect = () => onDisconnected();

  characteristic.addEventListener("characteristicvaluechanged", onValue);
  device.addEventListener("gattserverdisconnected", onDisconnect);
  await characteristic.startNotifications();

  return {
    deviceName: device.name ?? DEVICE_NAME_PREFIX,
    async disconnect() {
      characteristic.removeEventListener("characteristicvaluechanged", onValue);
      device.removeEventListener("gattserverdisconnected", onDisconnect);
      await characteristic.stopNotifications().catch(() => undefined);
      if (server.connected) server.disconnect();
    },
  };
}
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- src/lib/bluetooth.test.ts
npm run lint
```

Expected: valid and invalid payload tests pass.

- [ ] **Step 6: Commit BLE protocol support**

Run:

```bash
git add src/config/bluetooth.ts src/types/bluetooth.d.ts src/lib/bluetooth.ts src/lib/bluetooth.test.ts
git commit -m "feat: add ESP32-C3 bluetooth protocol"
```

---

### Task 8: Build Typed Internationalization and the Product Shell

**Files:**
- Create: `src/i18n/messages.ts`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/AppHeader.tsx`
- Create: `src/components/layout/BottomNavigation.tsx`
- Create: `src/components/layout/DemoProgress.tsx`
- Create: `src/components/ui/ActionButton.tsx`
- Create: `src/components/ui/MetricCard.tsx`
- Create: `src/components/ui/Notice.tsx`
- Create: `src/components/ui/RiskBadge.tsx`
- Create: `src/components/ui/ScoreRing.tsx`
- Create: `src/components/layout/AppShell.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write a failing locale-shell test**

Create `src/components/layout/AppShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import { AppShell } from "./AppShell";

beforeEach(() => useAppStore.getState().setLocale("zh-CN"));

it("switches all shell labels to English", async () => {
  render(
    <AppShell>
      <p>content</p>
    </AppShell>,
  );
  await userEvent.click(screen.getByRole("button", { name: "EN" }));
  expect(screen.getByRole("navigation")).toHaveTextContent("Home");
  expect(document.documentElement.lang).toBe("en");
});
```

- [ ] **Step 2: Run the shell test and verify RED**

Run:

```bash
npm test -- src/components/layout/AppShell.test.tsx
```

Expected: FAIL because the bilingual shell does not exist.

- [ ] **Step 3: Add a typed translation dictionary**

Create `src/i18n/messages.ts`:

```ts
import type { Locale } from "@/types/domain";

const zh = {
  "nav.home": "首页",
  "nav.flight": "飞行",
  "nav.strategy": "策略",
  "nav.results": "结果",
  "nav.device": "设备",
  "nav.profile": "画像",
  "nav.prediction": "预测",
  "nav.curve": "目标曲线",
  "action.startDemo": "开始演示",
  "action.connect": "连接设备",
  "action.continue": "继续",
  "action.mock": "使用模拟数据",
  "action.exportPdf": "导出 PDF 报告",
  "action.exportJson": "导出 JSON",
  "action.restart": "重新开始",
  "metric.comfort": "舒适度评分",
  "metric.risk": "风险等级",
  "metric.phase": "当前飞行阶段",
  "metric.pressure": "当前环境压力",
  "phase.takeoff": "起飞",
  "phase.cruise": "巡航",
  "phase.descent": "下降",
  "phase.landing": "降落",
  "phase.demo": "演示",
  "risk.low": "低",
  "risk.medium": "中",
  "risk.high": "高",
  "home.eyebrow": "航空耳压体验中心",
  "home.title": "面向环境压力梯度变化的耳膜动态调控与保护系统",
  "home.subtitle": "从个体画像到双耳独立适应，让压力变化提前可见。",
  "profile.title": "个体耳压画像",
  "profile.twin": "数字耳压孪生",
  "flight.title": "航空压力模拟",
  "prediction.title": "压力趋势预测",
  "strategy.title": "双耳独立决策",
  "curve.title": "目标压力适应曲线",
  "results.title": "适应结果",
  "disclaimer": "本系统用于压力适应演示，不构成医疗诊断或医疗建议。",
  "recommendation.independent": "启用左右耳独立适应策略。",
  "recommendation.watchRate": "关注当前压力变化率，并保持渐进适应。",
  "recommendation.highSmoothing": "采用更平滑的目标压力变化。",
  "recommendation.steady": "当前可保持稳定适应节奏。",
  "recommendation.monitor": "持续观察环境压力趋势。",
  "recommendation.gradualDescent": "下降阶段采用渐进压力适应。",
} as const;

const en: Record<keyof typeof zh, string> = {
  "nav.home": "Home",
  "nav.flight": "Flight",
  "nav.strategy": "Strategy",
  "nav.results": "Results",
  "nav.device": "Device",
  "nav.profile": "Profile",
  "nav.prediction": "Prediction",
  "nav.curve": "Target Curve",
  "action.startDemo": "Start Demo",
  "action.connect": "Connect Device",
  "action.continue": "Continue",
  "action.mock": "Use Mock Data",
  "action.exportPdf": "Export PDF Report",
  "action.exportJson": "Export JSON",
  "action.restart": "Restart",
  "metric.comfort": "Comfort Score",
  "metric.risk": "Risk Level",
  "metric.phase": "Flight Phase",
  "metric.pressure": "Environmental Pressure",
  "phase.takeoff": "Takeoff",
  "phase.cruise": "Cruise",
  "phase.descent": "Descent",
  "phase.landing": "Landing",
  "phase.demo": "Demo",
  "risk.low": "Low",
  "risk.medium": "Medium",
  "risk.high": "High",
  "home.eyebrow": "Flight Ear-Pressure Experience Center",
  "home.title": "Dynamic Tympanic Pressure Regulation and Protection System",
  "home.subtitle": "Make pressure change visible before it arrives, from personal profile to bilateral adaptation.",
  "profile.title": "Personal Ear Profile",
  "profile.twin": "Digital Ear Twin",
  "flight.title": "Flight Pressure Simulator",
  "prediction.title": "Pressure Prediction",
  "strategy.title": "Bilateral Adaptation",
  "curve.title": "Target Pressure Curves",
  "results.title": "Adaptation Results",
  "disclaimer": "This pressure-adaptation demonstration is not medical diagnosis or medical advice.",
  "recommendation.independent": "Enable independent adaptation for each ear.",
  "recommendation.watchRate": "Monitor the current pressure-change rate and adapt gradually.",
  "recommendation.highSmoothing": "Use a smoother target-pressure response.",
  "recommendation.steady": "Maintain the current stable adaptation pace.",
  "recommendation.monitor": "Continue monitoring the environmental pressure trend.",
  "recommendation.gradualDescent": "Use gradual pressure adaptation during descent.",
};

export type MessageKey = keyof typeof zh;
export const messages = { "zh-CN": zh, en } satisfies Record<
  Locale,
  Record<MessageKey, string>
>;
export const translate = (locale: Locale, key: MessageKey) =>
  messages[locale][key];
```

- [ ] **Step 4: Implement shell components**

Create `src/components/layout/AppShell.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { loadSessionSamples } from "@/lib/storage";
import { useAppStore } from "@/store/useAppStore";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((state) => state.locale);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const pressureCount = useAppStore((state) => state.pressureHistory.length);
  const profileInput = useAppStore((state) => state.profileInput);
  const profileResult = useAppStore((state) => state.profileResult);
  const setProfile = useAppStore((state) => state.setProfile);
  const replacePressureHistory = useAppStore(
    (state) => state.replacePressureHistory,
  );
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    if (!activeSessionId || pressureCount > 0) return;
    void loadSessionSamples(activeSessionId).then((samples) => {
      if (samples.length) replacePressureHistory(samples);
    });
  }, [activeSessionId, pressureCount, replacePressureHistory]);
  useEffect(() => {
    if (profileInput && !profileResult) setProfile(profileInput);
  }, [profileInput, profileResult, setProfile]);

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <AppHeader />
      {children}
      <BottomNavigation />
    </div>
  );
}
```

Create `src/components/layout/AppHeader.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";

export function AppHeader() {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#06111f]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5">
        <Link href="/" className="font-semibold tracking-[-0.03em]">
          AeroBalance
        </Link>
        <div className="flex rounded-full border border-white/12 bg-white/6 p-1">
          {(["zh-CN", "en"] as const).map((value) => (
            <button
              key={value}
              className={`min-h-9 min-w-11 rounded-full px-3 text-xs ${locale === value ? "bg-white text-[#06111f]" : "text-white/65"}`}
              onClick={() => setLocale(value)}
              aria-label={value === "en" ? "EN" : "中文"}
            >
              {value === "en" ? "EN" : "中"}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
```

Create `src/components/layout/BottomNavigation.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

const links = [
  ["/", "nav.home"],
  ["/flight", "nav.flight"],
  ["/strategy", "nav.strategy"],
  ["/results", "nav.results"],
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const locale = useAppStore((state) => state.locale);
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-[22px] border border-white/12 bg-[#0b1c31]/92 p-1.5 shadow-2xl backdrop-blur-xl md:hidden"
    >
      {links.map(([href, key]) => (
        <Link
          href={href}
          key={href}
          className={`flex min-h-12 items-center justify-center rounded-2xl text-xs ${pathname === href ? "bg-white/12 text-white" : "text-white/55"}`}
        >
          {translate(locale, key)}
        </Link>
      ))}
    </nav>
  );
}
```

Create `src/components/ui/ActionButton.tsx`:

```tsx
import Link from "next/link";

export function ActionButton({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-13 items-center justify-center rounded-full px-6 font-medium transition active:scale-[0.98] ${
        secondary
          ? "border border-white/14 bg-white/6 text-white"
          : "bg-white text-[#06111f] shadow-[0_16px_50px_rgb(56_167_255_/_0.2)]"
      }`}
    >
      {children}
    </Link>
  );
}
```

Create `src/components/ui/MetricCard.tsx`:

```tsx
export function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
      <p className="text-xs tracking-[0.08em] text-white/48 uppercase">{label}</p>
      <p className="mt-3 text-3xl font-medium tracking-[-0.05em]">
        {value} <span className="text-sm text-white/48">{unit}</span>
      </p>
    </article>
  );
}
```

Create `src/components/ui/Notice.tsx`, `RiskBadge.tsx`, and `ScoreRing.tsx`:

```tsx
// Notice.tsx
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-white/72">
      {children}
    </div>
  );
}

// RiskBadge.tsx
import type { RiskLevel } from "@/types/domain";
export function RiskBadge({ level, label }: { level: RiskLevel; label: string }) {
  const tone = { low: "text-[#45d19a]", medium: "text-[#f3b64a]", high: "text-[#ff6b6b]" }[level];
  return <span className={`rounded-full bg-white/7 px-3 py-1 text-sm font-medium ${tone}`}>{label}</span>;
}

// ScoreRing.tsx
export function ScoreRing({ score, label }: { score: number; label: string }) {
  return (
    <div
      className="grid aspect-square place-items-center rounded-full p-3"
      style={{ background: `conic-gradient(#41e2e8 ${score * 3.6}deg, rgb(255 255 255 / 0.08) 0)` }}
      aria-label={`${label}: ${score}`}
    >
      <div className="grid size-full place-items-center rounded-full bg-[#0b1c31] text-center">
        <div><strong className="text-4xl">{score}</strong><p className="text-xs text-white/50">{label}</p></div>
      </div>
    </div>
  );
}
```

Create `src/components/layout/DemoProgress.tsx`:

```tsx
const steps = ["Profile", "Flight", "Predict", "Strategy", "Curve", "Result"];

export function DemoProgress({ active }: { active: number }) {
  return (
    <ol className="flex gap-1" aria-label="Demo progress">
      {steps.map((step, index) => (
        <li key={step} className="flex-1">
          <span className="sr-only">{step}</span>
          <div className={`h-1 rounded-full ${index <= active ? "bg-[#41e2e8]" : "bg-white/10"}`} />
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 5: Install the shell in the root layout**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroBalance",
  description: "Dynamic Tympanic Pressure Regulation and Protection System",
};
export const viewport: Viewport = {
  themeColor: "#06111f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm test -- src/components/layout/AppShell.test.tsx
npm run lint
```

Expected: locale switch updates navigation and document language.

- [ ] **Step 7: Commit the bilingual product shell**

Run:

```bash
git add src/i18n src/components/layout src/components/ui src/app/layout.tsx src/app/globals.css
git commit -m "feat: add bilingual exhibition shell"
```

---

### Task 9: Build the Flight Experience Center and Pressure Sphere

**Files:**
- Create: `src/components/home/PressureSphere.tsx`
- Create: `src/components/home/PressureSphere.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the baseline test with hero behavior tests**

Update `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import HomePage from "./page";

beforeEach(() => useAppStore.getState().resetSession());

it("renders a Flight Experience Center rather than an admin dashboard", () => {
  render(<HomePage />);
  expect(screen.getByText("航空耳压体验中心")).toBeInTheDocument();
  expect(screen.getByTestId("pressure-sphere")).toHaveTextContent("kPa");
  expect(screen.getByTestId("pressure-sphere")).toHaveTextContent("下降");
  expect(screen.getByRole("link", { name: "开始演示" })).toHaveAttribute(
    "href",
    "/profile",
  );
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("shows comfort, risk, phase, and pressure in the hero", () => {
  render(<HomePage />);
  expect(screen.getByText("舒适度评分")).toBeInTheDocument();
  expect(screen.getByText("风险等级")).toBeInTheDocument();
  expect(screen.getByText("当前飞行阶段")).toBeInTheDocument();
  expect(screen.getByText("当前环境压力")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run hero tests and verify RED**

Run:

```bash
npm test -- src/app/page.test.tsx
```

Expected: FAIL because the current page has no Pressure Sphere or premium hero metrics.

- [ ] **Step 3: Implement the Pressure Sphere**

Create `src/components/home/PressureSphere.tsx`:

```tsx
import type { FlightPhase, RiskLevel } from "@/types/domain";

export function PressureSphere({
  pressure,
  comfort,
  riskLabel,
  riskLevel,
  phaseLabel,
  phase,
}: {
  pressure: number;
  comfort: number;
  riskLabel: string;
  riskLevel: RiskLevel;
  phaseLabel: string;
  phase: FlightPhase;
}) {
  return (
    <div
      data-testid="pressure-sphere"
      className="pressure-sphere relative mx-auto grid aspect-square w-full max-w-[520px] place-items-center"
      aria-label={`${pressure.toFixed(1)} kPa, ${phaseLabel}, ${riskLabel}, ${comfort}`}
    >
      <div className="absolute inset-[8%] rounded-full border border-sky-300/20" />
      <div className="absolute inset-[18%] rounded-full border border-cyan-300/20" />
      <div className="pressure-pulse absolute inset-[28%] rounded-full bg-sky-400/14 blur-2xl" />
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="200" cy="200" r="178" fill="none" stroke="rgb(255 255 255 / .08)" />
        <path d="M55 244 C130 92 278 76 347 190" fill="none" stroke="#38a7ff" strokeWidth="2" strokeDasharray="5 9" />
        <path d="M324 169 l20 18 -26 4 8-8z" fill="#82ccff" />
      </svg>
      <div className="relative z-10 text-center">
        <p className="text-xs tracking-[0.18em] text-white/45 uppercase">
          Environmental Pressure
        </p>
        <strong className="mt-2 block text-6xl font-medium tracking-[-0.07em] sm:text-7xl">
          {pressure.toFixed(1)}
        </strong>
        <span className="text-sm text-sky-200/65">kPa</span>
      </div>
      <div className="absolute top-[13%] left-[6%] rounded-full border border-white/10 bg-[#0b1c31]/80 px-4 py-2 backdrop-blur">
        <span className="text-xs text-white/45">Comfort</span>
        <strong className="ml-2">{comfort}</strong>
      </div>
      <div className="absolute top-[17%] right-[2%] rounded-full border border-white/10 bg-[#0b1c31]/80 px-4 py-2 backdrop-blur">
        <span className="text-xs text-white/45">Risk</span>
        <strong className={`ml-2 ${riskLevel === "high" ? "text-[#ff6b6b]" : riskLevel === "medium" ? "text-[#f3b64a]" : "text-[#45d19a]"}`}>
          {riskLabel}
        </strong>
      </div>
      <div className="absolute right-[8%] bottom-[11%] rounded-full border border-white/10 bg-[#0b1c31]/80 px-4 py-2 backdrop-blur">
        <span className="text-xs text-white/45">Flight</span>
        <strong className="ml-2">{phaseLabel}</strong>
        <span className="sr-only">{phase}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement the complete home experience**

Update `src/app/page.tsx`:

```tsx
"use client";

import { PressureSphere } from "@/components/home/PressureSphere";
import { ActionButton } from "@/components/ui/ActionButton";
import { MetricCard } from "@/components/ui/MetricCard";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

export default function HomePage() {
  const locale = useAppStore((state) => state.locale);
  const analysis = useAppStore((state) => state.analysis);
  const phase = useAppStore((state) => state.phase);
  const latest = useAppStore((state) => state.pressureHistory.at(-1));
  const comfort = analysis?.comfortScore ?? 74;
  const risk = analysis?.riskLevel ?? "medium";
  const pressure = latest?.pressure ?? 78;
  const phaseKey = `phase.${phase === "demo" ? "descent" : phase}` as const;

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1180px] items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div className="relative z-10">
          <p className="text-sm font-medium tracking-[0.16em] text-sky-300 uppercase">
            {translate(locale, "home.eyebrow")}
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.65rem] leading-[1.02] font-medium tracking-[-0.06em] sm:text-6xl">
            {translate(locale, "home.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/58 sm:text-lg">
            {translate(locale, "home.subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionButton href="/profile">
              {translate(locale, "action.startDemo")}
            </ActionButton>
            <ActionButton href="/device" secondary>
              {translate(locale, "action.connect")}
            </ActionButton>
          </div>
        </div>
        <PressureSphere
          pressure={pressure}
          comfort={comfort}
          riskLevel={risk}
          riskLabel={translate(locale, `risk.${risk}`)}
          phase={phase}
          phaseLabel={translate(locale, phaseKey)}
        />
      </section>
      <section className="mx-auto max-w-[1180px] px-5 pb-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={translate(locale, "metric.comfort")} value={comfort} unit="/ 100" />
          <MetricCard label={translate(locale, "metric.risk")} value={translate(locale, `risk.${risk}`)} />
          <MetricCard label={translate(locale, "metric.phase")} value={translate(locale, phaseKey)} />
          <MetricCard label={translate(locale, "metric.pressure")} value={pressure.toFixed(1)} unit="kPa" />
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Ear Profile", "Map bilateral sensitivity before pressure changes."],
            ["02", "Pressure Prediction", "Forecast environmental pressure 5, 10, and 15 minutes ahead."],
            ["03", "Bilateral Adaptation", "Generate independent target curves for the left and right ear."],
          ].map(([index, title, copy]) => (
            <article key={title} className="rounded-[28px] border border-white/9 bg-white/[0.045] p-7">
              <span className="text-xs text-sky-300">{index}</span>
              <h2 className="mt-8 text-xl">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">{copy}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/9 bg-white/[0.035] px-5 py-4 text-sm text-white/58">
          {(locale === "zh-CN"
            ? ["个体画像", "压力预测", "双耳决策", "目标曲线"]
            : ["Ear Profile", "Pressure Prediction", "Bilateral Decision", "Target Curve"]
          ).map((label, index) => (
            <span key={label} className="flex items-center gap-3">
              {index > 0 && <span className="text-sky-300">→</span>}
              {label}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Add restrained sphere motion**

Append to `src/app/globals.css`:

```css
.pressure-sphere {
  background:
    radial-gradient(circle, rgb(56 167 255 / 18%) 0 12%, transparent 42%),
    radial-gradient(circle at 50% 50%, rgb(65 226 232 / 8%), transparent 60%);
}

.pressure-pulse {
  animation: pressure-pulse 1.8s ease-in-out infinite;
}

@keyframes pressure-pulse {
  0%, 100% { transform: scale(.92); opacity: .5; }
  50% { transform: scale(1.08); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 6: Verify GREEN and mobile rendering**

Run:

```bash
npm test -- src/app/page.test.tsx
npm run lint
npm run build
```

Expected: hero tests pass and production build succeeds.

- [ ] **Step 7: Commit the Flight Experience Center**

Run:

```bash
git add src/app/page.tsx src/app/page.test.tsx src/app/globals.css src/components/home
git commit -m "feat: build flight experience center"
```

---

### Task 10: Build Digital Ear Twin and Flight Simulator

**Files:**
- Create: `src/components/profile/DigitalEarTwin.tsx`
- Create: `src/components/profile/ProfileForm.tsx`
- Create: `src/components/charts/EarRadarChart.tsx`
- Create: `src/app/profile/page.tsx`
- Create: `src/app/profile/page.test.tsx`
- Create: `src/components/flight/FlightPhaseControl.tsx`
- Create: `src/components/charts/PressureChart.tsx`
- Create: `src/app/flight/page.tsx`
- Create: `src/app/flight/page.test.tsx`

- [ ] **Step 1: Write failing Digital Ear Twin tests**

Create `src/app/profile/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import ProfilePage from "./page";

beforeEach(() => useAppStore.getState().resetSession());

it("loads User A and makes left-right difference visible in the Digital Ear Twin", async () => {
  render(<ProfilePage />);
  await userEvent.click(screen.getByRole("button", { name: /用户 A|User A/ }));
  expect(screen.getByTestId("digital-ear-twin")).toBeInTheDocument();
  const left = Number(screen.getByTestId("left-ear-risk").textContent);
  const right = Number(screen.getByTestId("right-ear-risk").textContent);
  expect(left).toBeGreaterThan(right);
  expect(screen.getByText(/数字耳压孪生|Digital Ear Twin/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Write failing Flight Simulator tests**

Create `src/app/flight/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import FlightPage from "./page";

beforeEach(() => useAppStore.getState().resetSession());

it("switches among all four flight phases with deterministic data", async () => {
  render(<FlightPage />);
  for (const label of ["起飞", "巡航", "下降", "降落"]) {
    await userEvent.click(screen.getByRole("button", { name: label }));
    expect(screen.getByRole("button", { name: label })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  expect(useAppStore.getState().pressureHistory.length).toBeGreaterThan(3);
  expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重新播放阶段" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "4x" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run page tests and verify RED**

Run:

```bash
npm test -- src/app/profile/page.test.tsx src/app/flight/page.test.tsx
```

Expected: FAIL because neither page exists.

- [ ] **Step 4: Implement the Digital Ear Twin and profile controls**

Create `src/components/profile/DigitalEarTwin.tsx`:

```tsx
export function DigitalEarTwin({
  leftRisk,
  rightRisk,
}: {
  leftRisk: number;
  rightRisk: number;
}) {
  const field = (risk: number, color: string) => ({
    width: `${86 + risk * 0.55}px`,
    height: `${86 + risk * 0.55}px`,
    boxShadow: `0 0 ${20 + risk * 0.55}px ${color}`,
    opacity: 0.35 + risk / 220,
  });
  return (
    <section
      data-testid="digital-ear-twin"
      className="relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgb(56_167_255_/_0.14),transparent_60%)]"
    >
      <div className="absolute inset-x-[28%] top-[15%] bottom-[8%] rounded-[46%_46%_38%_38%] border border-white/18 bg-white/[0.025]" />
      <div className="absolute top-[39%] left-[4%] grid place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/8" style={field(leftRisk, "rgb(65 226 232 / .22)")}>
        <div className="text-center"><span className="text-xs text-white/45">LEFT</span><strong data-testid="left-ear-risk" className="block text-3xl">{leftRisk}</strong></div>
      </div>
      <div className="absolute top-[39%] right-[4%] grid place-items-center rounded-full border border-indigo-300/30 bg-indigo-300/8" style={field(rightRisk, "rgb(129 140 248 / .22)")}>
        <div className="text-center"><span className="text-xs text-white/45">RIGHT</span><strong data-testid="right-ear-risk" className="block text-3xl">{rightRisk}</strong></div>
      </div>
      <svg viewBox="0 0 400 500" className="absolute inset-0 size-full opacity-55" aria-hidden="true">
        <path d="M98 255 C145 220 160 300 205 255 S270 220 305 255" fill="none" stroke="#82ccff" strokeWidth="2" strokeDasharray="4 8" />
      </svg>
    </section>
  );
}
```

Create `src/components/profile/ProfileForm.tsx`:

```tsx
import type { EarProfileInput, Locale } from "@/types/domain";

export function ProfileForm({
  value,
  onChange,
  locale,
}: {
  value: EarProfileInput;
  onChange(value: EarProfileInput): void;
  locale: Locale;
}) {
  const slider = (
    key: "previousDiscomfort" | "equalizationAbility" | "leftSensitivity" | "rightSensitivity",
    label: string,
    min: number,
    max: number,
  ) => (
    <label className="block rounded-2xl bg-white/5 p-4">
      <span className="flex justify-between text-sm"><span>{label}</span><strong>{value[key]}</strong></span>
      <input className="mt-3 w-full accent-sky-400" type="range" min={min} max={max} value={value[key]} onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })} />
    </label>
  );
  return (
    <div className="grid gap-3">
      <label className="rounded-2xl bg-white/5 p-4">
        <span className="text-sm">{locale === "zh-CN" ? "年龄" : "Age"}</span>
        <input className="mt-3 w-full rounded-xl bg-white/8 p-3" type="number" min="6" max="90" value={value.age} onChange={(event) => onChange({ ...value, age: Number(event.target.value) })} />
      </label>
      <label className="rounded-2xl bg-white/5 p-4">
        <span className="text-sm">{locale === "zh-CN" ? "鼻炎或鼻塞" : "Rhinitis / Congestion"}</span>
        <select className="mt-3 w-full rounded-xl bg-[#0b1c31] p-3" value={value.congestion} onChange={(event) => onChange({ ...value, congestion: event.target.value as EarProfileInput["congestion"] })}>
          <option value="none">{locale === "zh-CN" ? "无" : "None"}</option>
          <option value="mild">{locale === "zh-CN" ? "轻度" : "Mild"}</option>
          <option value="noticeable">{locale === "zh-CN" ? "明显" : "Noticeable"}</option>
        </select>
      </label>
      {slider("leftSensitivity", locale === "zh-CN" ? "左耳敏感度" : "Left Sensitivity", 1, 5)}
      {slider("rightSensitivity", locale === "zh-CN" ? "右耳敏感度" : "Right Sensitivity", 1, 5)}
      {slider("equalizationAbility", locale === "zh-CN" ? "均压能力" : "Equalization Ability", 1, 5)}
      {slider("previousDiscomfort", locale === "zh-CN" ? "既往耳部不适" : "Previous Discomfort", 0, 10)}
      <label className="rounded-2xl bg-white/5 p-4">
        <span className="text-sm">{locale === "zh-CN" ? "飞行频率" : "Flight Frequency"}</span>
        <select className="mt-3 w-full rounded-xl bg-[#0b1c31] p-3" value={value.flightFrequency} onChange={(event) => onChange({ ...value, flightFrequency: event.target.value as EarProfileInput["flightFrequency"] })}>
          <option value="rare">{locale === "zh-CN" ? "很少" : "Rare"}</option>
          <option value="occasional">{locale === "zh-CN" ? "偶尔" : "Occasional"}</option>
          <option value="frequent">{locale === "zh-CN" ? "经常" : "Frequent"}</option>
        </select>
      </label>
    </div>
  );
}
```

Create `src/components/charts/EarRadarChart.tsx`:

```tsx
"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export function EarRadarChart({
  left,
  right,
}: {
  left: number[];
  right: number[];
}) {
  const labels = ["Sensitivity", "Equalization", "History", "Congestion", "Adaptation"];
  const data = labels.map((label, index) => ({ label, left: left[index], right: right[index] }));
  return (
    <div className="h-64" aria-label="Bilateral profile radar">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgb(255 255 255 / .12)" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "rgb(255 255 255 / .5)", fontSize: 10 }} />
          <Radar dataKey="left" stroke="#41e2e8" fill="#41e2e8" fillOpacity={0.18} />
          <Radar dataKey="right" stroke="#818cf8" fill="#818cf8" fillOpacity={0.16} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Implement the profile page**

Create `src/app/profile/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { EarRadarChart } from "@/components/charts/EarRadarChart";
import { DemoProgress } from "@/components/layout/DemoProgress";
import { DigitalEarTwin } from "@/components/profile/DigitalEarTwin";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { translate } from "@/i18n/messages";
import { seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";

export default function ProfilePage() {
  const locale = useAppStore((state) => state.locale);
  const storedInput = useAppStore((state) => state.profileInput);
  const result = useAppStore((state) => state.profileResult);
  const setProfile = useAppStore((state) => state.setProfile);
  const loadSeedProfile = useAppStore((state) => state.loadSeedProfile);
  const [input, setInput] = useState(storedInput ?? seedProfiles[0].input);
  const selectSeed = (index: number) => {
    setInput(seedProfiles[index].input);
    loadSeedProfile(seedProfiles[index]);
  };
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8">
      <DemoProgress active={0} />
      <p className="mt-8 text-sm text-sky-300">{translate(locale, "profile.twin")}</p>
      <h1 className="mt-2 text-4xl tracking-[-0.05em]">{translate(locale, "profile.title")}</h1>
      <div className="mt-8 flex gap-2 overflow-x-auto">
        {seedProfiles.map((profile, index) => (
          <button key={profile.id} onClick={() => selectSeed(index)} className="min-h-11 shrink-0 rounded-full border border-white/12 px-5">
            {locale === "zh-CN" ? `用户 ${String.fromCharCode(65 + index)}` : `User ${String.fromCharCode(65 + index)}`}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <DigitalEarTwin leftRisk={result?.leftRisk ?? 0} rightRisk={result?.rightRisk ?? 0} />
          {result && <EarRadarChart left={result.leftRadar} right={result.rightRadar} />}
        </div>
        <div>
          <ProfileForm value={input} onChange={setInput} locale={locale} />
          <button onClick={() => setProfile(input)} className="mt-4 min-h-13 w-full rounded-full bg-white font-medium text-[#06111f]">
            {locale === "zh-CN" ? "生成耳压画像" : "Generate Ear Profile"}
          </button>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4"><span className="text-xs text-white/45">LEFT RISK</span><strong className="mt-2 block text-3xl">{result?.leftRisk ?? "--"}</strong></div>
            <div className="rounded-2xl bg-white/5 p-4"><span className="text-xs text-white/45">RIGHT RISK</span><strong className="mt-2 block text-3xl">{result?.rightRisk ?? "--"}</strong></div>
            <div className="rounded-2xl bg-white/5 p-4"><span className="text-xs text-white/45">{locale === "zh-CN" ? "耐受能力" : "TOLERANCE"}</span><strong className="mt-2 block text-3xl">{result?.toleranceScore ?? "--"}</strong></div>
            <div className="rounded-2xl bg-white/5 p-4"><span className="text-xs text-white/45">{locale === "zh-CN" ? "适应速度" : "ADAPTATION SPEED"}</span><strong className="mt-2 block text-3xl">{result?.adaptationSpeed ?? "--"}</strong></div>
          </div>
          <div className="mt-6"><ActionButton href="/flight">{translate(locale, "action.continue")}</ActionButton></div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Implement phase controls and pressure chart**

Create `src/components/flight/FlightPhaseControl.tsx`:

```tsx
import type { FlightPhase, Locale } from "@/types/domain";
import { translate } from "@/i18n/messages";

const phases = ["takeoff", "cruise", "descent", "landing"] as const;

export function FlightPhaseControl({
  active,
  locale,
  onChange,
}: {
  active: FlightPhase;
  locale: Locale;
  onChange(phase: (typeof phases)[number]): void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
      {phases.map((phase) => (
        <button
          key={phase}
          aria-pressed={active === phase}
          onClick={() => onChange(phase)}
          className={`min-h-12 rounded-xl text-sm ${active === phase ? "bg-white text-[#06111f]" : "text-white/55"}`}
        >
          {translate(locale, `phase.${phase}`)}
        </button>
      ))}
    </div>
  );
}
```

Create `src/components/charts/PressureChart.tsx`:

```tsx
"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PressureSample } from "@/types/domain";

export function PressureChart({ data }: { data: PressureSample[] }) {
  return (
    <div className="h-[340px]" aria-label="Environmental pressure history">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs><linearGradient id="pressureFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38a7ff" stopOpacity=".32" /><stop offset="1" stopColor="#38a7ff" stopOpacity="0" /></linearGradient></defs>
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} width={38} tick={{ fill: "rgb(255 255 255 / .42)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0b1c31", border: "1px solid rgb(255 255 255 / .1)", borderRadius: 16 }} formatter={(value) => [`${Number(value).toFixed(1)} kPa`, "Pressure"]} />
          <Area type="monotone" dataKey="pressure" stroke="#38a7ff" strokeWidth={3} fill="url(#pressureFill)" isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 7: Implement the Flight Simulator page**

Create `src/app/flight/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { PressureChart } from "@/components/charts/PressureChart";
import { FlightPhaseControl } from "@/components/flight/FlightPhaseControl";
import { DemoProgress } from "@/components/layout/DemoProgress";
import { ActionButton } from "@/components/ui/ActionButton";
import { MetricCard } from "@/components/ui/MetricCard";
import { translate } from "@/i18n/messages";
import { createFlightSeed } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import type { FlightPhase } from "@/types/domain";

export default function FlightPage() {
  const locale = useAppStore((state) => state.locale);
  const phase = useAppStore((state) => state.phase);
  const history = useAppStore((state) => state.pressureHistory);
  const prediction = useAppStore((state) => state.prediction);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const playbackSpeed = useAppStore((state) => state.playbackSpeed);
  const setPhase = useAppStore((state) => state.setPhase);
  const setPlayback = useAppStore((state) => state.setPlayback);
  const setPlaybackSpeed = useAppStore((state) => state.setPlaybackSpeed);
  const append = useAppStore((state) => state.appendPressureSample);
  const replace = useAppStore((state) => state.replacePressureHistory);
  const allSamples = useMemo(() => createFlightSeed("demo-flight"), []);
  const [segment, setSegment] = useState(() =>
    allSamples.filter((sample) => sample.phase === "descent"),
  );
  const [cursor, setCursor] = useState(4);
  const changePhase = (next: Exclude<FlightPhase, "demo">) => {
    const samples = allSamples.filter((sample) => sample.phase === next);
    setSegment(samples);
    setCursor(4);
    setPhase(next);
    replace(samples.slice(0, 4));
    setPlayback(true);
  };
  const restart = () => {
    setCursor(4);
    replace(segment.slice(0, 4));
    setPlayback(true);
  };
  useEffect(() => {
    if (!isPlaying || cursor >= segment.length) return;
    const timer = window.setTimeout(() => {
      append(segment[cursor]);
      setCursor((value) => value + 1);
    }, 700 / playbackSpeed);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [append, cursor, isPlaying, playbackSpeed, segment]);
  useEffect(() => {
    if (!history.length) replace(segment.slice(0, 4));
  }, [history.length, replace, segment]);
  const active = history.length ? history : segment.slice(0, 4);
  const current = active.at(-1)!;
  const minutes = active.length > 1 ? (current.timestamp - active.at(-2)!.timestamp) / 60_000 : 1;
  const rate = active.length > 1 ? (current.pressure - active.at(-2)!.pressure) / minutes : 0;
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8">
      <DemoProgress active={1} />
      <h1 className="mt-8 text-4xl tracking-[-0.05em]">{translate(locale, "flight.title")}</h1>
      <div className="mt-7"><FlightPhaseControl active={phase} locale={locale} onChange={changePhase} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setPlayback(!isPlaying)} className="min-h-11 rounded-full border border-white/12 px-5">
          {isPlaying ? (locale === "zh-CN" ? "暂停" : "Pause") : (locale === "zh-CN" ? "播放" : "Play")}
        </button>
        <button onClick={restart} className="min-h-11 rounded-full border border-white/12 px-5">
          {locale === "zh-CN" ? "重新播放阶段" : "Restart Phase"}
        </button>
        {([1, 4] as const).map((speed) => (
          <button key={speed} aria-pressed={playbackSpeed === speed} onClick={() => setPlaybackSpeed(speed)} className="min-h-11 min-w-14 rounded-full border border-white/12 px-4">
            {speed}x
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={translate(locale, "metric.pressure")} value={current.pressure.toFixed(1)} unit="kPa" />
        <MetricCard label="dP/dt" value={rate.toFixed(2)} unit="kPa/min" />
        <MetricCard label={translate(locale, "metric.phase")} value={translate(locale, `phase.${current.phase}`)} />
        <MetricCard label={locale === "zh-CN" ? "预测置信度" : "Prediction Confidence"} value={prediction?.confidence.toFixed(0) ?? "--"} unit="%" />
      </div>
      <p className="mt-3 text-xs text-white/45">
        {current.source === "mock" ? (locale === "zh-CN" ? "数据源：模拟" : "Source: Demo") : (locale === "zh-CN" ? "数据源：蓝牙" : "Source: Bluetooth")}
        {" · "}{current.battery ?? "--"}%{" · "}{current.temperature ?? "--"} °C
      </p>
      <section className="mt-5 rounded-[28px] border border-white/9 bg-white/[0.04] p-3 sm:p-6">
        <PressureChart data={active} />
      </section>
      <div className="mt-7 flex justify-end"><ActionButton href="/prediction">{translate(locale, "action.continue")}</ActionButton></div>
    </main>
  );
}
```

- [ ] **Step 8: Verify GREEN**

Run:

```bash
npm test -- src/app/profile/page.test.tsx src/app/flight/page.test.tsx
npm run lint
npm run build
```

Expected: User A produces visible asymmetry, all phase controls work, and build succeeds.

- [ ] **Step 9: Commit profile and simulator**

Run:

```bash
git add src/app/profile src/app/flight src/components/profile src/components/flight src/components/charts
git commit -m "feat: add ear twin and flight simulator"
```

---

### Task 11: Build Animated Prediction and Bilateral Decision Paths

**Files:**
- Create: `src/components/charts/PredictionChart.tsx`
- Create: `src/components/prediction/PredictionTimeline.tsx`
- Create: `src/app/prediction/page.tsx`
- Create: `src/app/prediction/page.test.tsx`
- Create: `src/components/strategy/DecisionPath.tsx`
- Create: `src/components/strategy/StrategyCard.tsx`
- Create: `src/app/strategy/page.tsx`
- Create: `src/app/strategy/page.test.tsx`

- [ ] **Step 1: Write failing prediction timeline tests**

Create `src/app/prediction/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import PredictionPage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore
    .getState()
    .replacePressureHistory(
      createFlightSeed("prediction").filter(
        (sample) => sample.phase === "descent",
      ),
    );
});

it("shows environmental and target pressure on a future timeline", () => {
  render(<PredictionPage />);
  expect(screen.getByText("Environmental Pressure")).toBeInTheDocument();
  expect(screen.getByText("Target Pressure Curve")).toBeInTheDocument();
  for (const checkpoint of ["Now", "+5 min", "+10 min", "+15 min"]) {
    expect(screen.getByText(checkpoint)).toBeInTheDocument();
  }
});
```

- [ ] **Step 2: Write failing bilateral decision tests**

Create `src/app/strategy/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import StrategyPage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("guards the strategy without an ear profile", () => {
  render(<StrategyPage />);
  expect(screen.getByRole("link", { name: /创建画像|Create Profile/ })).toHaveAttribute(
    "href",
    "/profile",
  );
});

it("shows parallel left and right decision paths", () => {
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore
    .getState()
    .replacePressureHistory(
      createFlightSeed("strategy").filter((sample) => sample.phase === "descent"),
    );
  render(<StrategyPage />);
  expect(screen.getByText(/Left Ear Strategy/)).toBeInTheDocument();
  expect(screen.getByText(/Right Ear Strategy/)).toBeInTheDocument();
  expect(screen.getAllByText("Ear Risk")).toHaveLength(2);
  expect(screen.getAllByText("Target Curve")).toHaveLength(2);
  expect(screen.getByText(/左右耳适应差异|Bilateral adaptation difference/)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run prediction and strategy tests and verify RED**

Run:

```bash
npm test -- src/app/prediction/page.test.tsx src/app/strategy/page.test.tsx
```

Expected: FAIL because both experience pages are missing.

- [ ] **Step 4: Implement the animated timeline**

Create `src/components/prediction/PredictionTimeline.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

const checkpoints = [
  { label: "Now", minute: 0 },
  { label: "+5 min", minute: 5 },
  { label: "+10 min", minute: 10 },
  { label: "+15 min", minute: 15 },
];

export function PredictionTimeline({
  values,
}: {
  values: Record<number, number>;
}) {
  const [minute, setMinute] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMinute(15);
      return;
    }
    setMinute(0);
    const started = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min((performance.now() - started) / 3200, 1);
      setMinute(progress * 15);
      if (progress === 1) window.clearInterval(timer);
    }, 60);
    return () => window.clearInterval(timer);
  }, [values]);

  return (
    <div className="relative pt-8" aria-label="Prediction timeline">
      <div className="absolute top-[37px] right-0 left-0 h-px bg-white/12" />
      <div
        className="absolute top-[34px] size-2 rounded-full bg-cyan-300 shadow-[0_0_18px_#41e2e8]"
        style={{ left: `calc(${(minute / 15) * 100}% - 4px)` }}
      />
      <div className="grid grid-cols-4">
        {checkpoints.map((point) => (
          <div key={point.minute} className="text-center">
            <span className={`mx-auto block size-2 rounded-full ${minute >= point.minute ? "bg-cyan-300" : "bg-white/20"}`} />
            <strong className="mt-3 block text-xs">{point.label}</strong>
            <span className="mt-1 block text-xs text-white/45">
              {values[point.minute]?.toFixed(1)} kPa
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement the history/forecast/target overlay**

Create `src/components/charts/PredictionChart.tsx`:

```tsx
"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PredictionChartPoint {
  timestamp: number;
  minuteOffset: number;
  history?: number;
  forecast?: number;
  target?: number;
}

export function PredictionChart({ data }: { data: PredictionChartPoint[] }) {
  return (
    <div className="h-[360px]" aria-label="Environmental and target pressure forecast">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="minuteOffset" tickFormatter={(value) => (value <= 0 ? `${value}m` : `+${value}m`)} tick={{ fill: "rgb(255 255 255 / .4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} width={40} tick={{ fill: "rgb(255 255 255 / .4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0b1c31", border: "1px solid rgb(255 255 255 / .1)", borderRadius: 16 }} />
          <ReferenceLine x={0} stroke="rgb(255 255 255 / .28)" label={{ value: "NOW", fill: "rgb(255 255 255 / .45)", fontSize: 10 }} />
          <Line type="monotone" dataKey="history" stroke="#38a7ff" strokeWidth={3} dot={false} connectNulls />
          <Line type="monotone" dataKey="forecast" stroke="#38a7ff" strokeWidth={3} strokeDasharray="6 8" dot={false} connectNulls />
          <Line type="monotone" dataKey="target" stroke="#41e2e8" strokeWidth={3} dot={false} connectNulls animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 6: Implement the Prediction page**

Create `src/app/prediction/page.tsx`:

```tsx
"use client";

import { PredictionChart } from "@/components/charts/PredictionChart";
import { DemoProgress } from "@/components/layout/DemoProgress";
import { PredictionTimeline } from "@/components/prediction/PredictionTimeline";
import { ActionButton } from "@/components/ui/ActionButton";
import { MetricCard } from "@/components/ui/MetricCard";
import { Notice } from "@/components/ui/Notice";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

export default function PredictionPage() {
  const locale = useAppStore((state) => state.locale);
  const prediction = useAppStore((state) => state.prediction);
  const curves = useAppStore((state) => state.targetCurves);
  if (!prediction) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Notice>{locale === "zh-CN" ? "至少需要三条压力数据，请先启动模拟数据。" : "At least three pressure samples are required. Start demo data first."}</Notice>
        <div className="mt-6"><ActionButton href="/flight">{translate(locale, "nav.flight")}</ActionButton></div>
      </main>
    );
  }
  const curveByTime = new Map(curves.map((point) => [point.timestamp, point]));
  const chartData = prediction.points.map((point) => ({
    timestamp: point.timestamp,
    minuteOffset: point.minuteOffset,
    history: point.kind === "history" ? point.pressure : undefined,
    forecast: point.kind === "forecast" ? point.pressure : undefined,
    target: curveByTime.get(point.timestamp)?.leftTarget,
  }));
  const current = prediction.points.filter((point) => point.kind === "history").at(-1)!.pressure;
  const values = { 0: current, 5: prediction.pressure5, 10: prediction.pressure10, 15: prediction.pressure15 };
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8">
      <DemoProgress active={2} />
      <h1 className="mt-8 text-4xl tracking-[-0.05em]">{translate(locale, "prediction.title")}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="+5 min" value={prediction.pressure5.toFixed(1)} unit="kPa" />
        <MetricCard label="+10 min" value={prediction.pressure10.toFixed(1)} unit="kPa" />
        <MetricCard label="+15 min" value={prediction.pressure15.toFixed(1)} unit="kPa" />
        <MetricCard label="Confidence" value={prediction.confidence.toFixed(0)} unit="%" />
        <MetricCard label="Pressure Stress" value={prediction.stressIndex.toFixed(0)} unit="/ 100" />
        <MetricCard label={locale === "zh-CN" ? "风险趋势" : "Risk Trend"} value={prediction.trend === "rising" ? (locale === "zh-CN" ? "上升" : "Rising") : prediction.trend === "falling" ? (locale === "zh-CN" ? "下降" : "Falling") : (locale === "zh-CN" ? "稳定" : "Stable")} />
      </div>
      <section className="mt-5 rounded-[28px] border border-white/9 bg-white/[0.04] p-4 sm:p-7">
        <div className="flex flex-wrap gap-5 text-xs text-white/55">
          <span><i className="mr-2 inline-block h-0.5 w-7 bg-sky-400" />Environmental Pressure</span>
          <span><i className="mr-2 inline-block h-0.5 w-7 bg-cyan-300" />Target Pressure Curve</span>
        </div>
        <PredictionChart data={chartData} />
        <PredictionTimeline values={values} />
      </section>
      <div className="mt-7 flex justify-end"><ActionButton href="/strategy">{translate(locale, "action.continue")}</ActionButton></div>
    </main>
  );
}
```

- [ ] **Step 7: Implement one ear's decision path**

Create `src/components/strategy/DecisionPath.tsx`:

```tsx
import type { EarStrategy, TargetCurvePoint } from "@/types/domain";

export function DecisionPath({
  strategy,
  curve,
}: {
  strategy: EarStrategy;
  curve: TargetCurvePoint[];
}) {
  const targetKey = strategy.side === "left" ? "leftTarget" : "rightTarget";
  const preview = curve.slice(-18);
  const min = Math.min(...preview.map((point) => point[targetKey]));
  const max = Math.max(...preview.map((point) => point[targetKey]));
  const points = preview
    .map((point, index) => {
      const x = preview.length <= 1 ? 0 : (index / (preview.length - 1)) * 120;
      const y = max === min ? 20 : 40 - ((point[targetKey] - min) / (max - min)) * 36;
      return `${x},${y}`;
    })
    .join(" ");
  const nodes = [
    ["Ear Risk", strategy.riskScore],
    ["Pressure Stress", strategy.stressIndex],
    ["Adaptation Level", `L${strategy.level}`],
  ];
  return (
    <div className="mt-6 grid gap-3">
      {nodes.map(([label, value], index) => (
        <div key={label} className="relative flex items-center justify-between rounded-2xl border border-white/9 bg-white/5 p-4">
          <span className="text-sm text-white/55">{label}</span><strong>{value}</strong>
          {index < nodes.length - 1 && <span className="absolute -bottom-4 left-1/2 h-4 w-px bg-white/16" />}
        </div>
      ))}
      <div className="rounded-2xl border border-white/9 bg-white/5 p-4">
        <div className="flex justify-between"><span className="text-sm text-white/55">Target Curve</span><strong>{strategy.smoothingFactor.toFixed(2)}</strong></div>
        <svg viewBox="0 0 120 44" className="mt-3 h-12 w-full" aria-label="Target Curve">
          <polyline points={points} fill="none" stroke={strategy.side === "left" ? "#41e2e8" : "#818cf8"} strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
}
```

Create `src/components/strategy/StrategyCard.tsx`:

```tsx
import { DecisionPath } from "./DecisionPath";
import type { EarStrategy, TargetCurvePoint } from "@/types/domain";

export function StrategyCard({
  title,
  strategy,
  curve,
  recommendation,
}: {
  title: string;
  strategy: EarStrategy;
  curve: TargetCurvePoint[];
  recommendation: string;
}) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6">
      <p className="text-xs text-white/42">{strategy.side.toUpperCase()}</p>
      <h2 className="mt-2 text-2xl">{title}</h2>
      <DecisionPath strategy={strategy} curve={curve} />
      <p className="mt-5 text-sm leading-6 text-white/58">{recommendation}</p>
    </article>
  );
}
```

- [ ] **Step 8: Implement the Strategy page**

Create `src/app/strategy/page.tsx`:

```tsx
"use client";

import { DemoProgress } from "@/components/layout/DemoProgress";
import { StrategyCard } from "@/components/strategy/StrategyCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { Notice } from "@/components/ui/Notice";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

export default function StrategyPage() {
  const locale = useAppStore((state) => state.locale);
  const profile = useAppStore((state) => state.profileResult);
  const strategy = useAppStore((state) => state.strategy);
  const curves = useAppStore((state) => state.targetCurves);
  if (!profile || !strategy) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Notice>{locale === "zh-CN" ? "请先创建个体耳压画像并加载压力数据。" : "Create an ear profile and load pressure data first."}</Notice>
        <div className="mt-6"><ActionButton href="/profile">{locale === "zh-CN" ? "创建画像" : "Create Profile"}</ActionButton></div>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8">
      <DemoProgress active={3} />
      <h1 className="mt-8 text-4xl tracking-[-0.05em]">{translate(locale, "strategy.title")}</h1>
      {strategy.independent && (
        <div className="mt-5"><Notice>{locale === "zh-CN" ? "检测到左右耳适应差异，建议启用双耳独立策略。" : "Bilateral adaptation difference detected. Independent ear strategies are recommended."}</Notice></div>
      )}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <StrategyCard title={locale === "zh-CN" ? "左耳策略 Left Ear Strategy" : "Left Ear Strategy"} strategy={strategy.left} curve={curves} recommendation={translate(locale, strategy.left.recommendationKey as Parameters<typeof translate>[1])} />
        <StrategyCard title={locale === "zh-CN" ? "右耳策略 Right Ear Strategy" : "Right Ear Strategy"} strategy={strategy.right} curve={curves} recommendation={translate(locale, strategy.right.recommendationKey as Parameters<typeof translate>[1])} />
      </div>
      <div className="mt-7 flex justify-end"><ActionButton href="/target-curve">{translate(locale, "action.continue")}</ActionButton></div>
    </main>
  );
}
```

- [ ] **Step 9: Verify GREEN**

Run:

```bash
npm test -- src/app/prediction/page.test.tsx src/app/strategy/page.test.tsx
npm run lint
npm run build
```

Expected: timeline labels, chart legends, guards, independent strategy notice, and parallel decision paths pass.

- [ ] **Step 10: Commit prediction and bilateral decisions**

Run:

```bash
git add src/app/prediction src/app/strategy src/components/prediction src/components/strategy src/components/charts/PredictionChart.tsx
git commit -m "feat: visualize prediction and bilateral decisions"
```

---

### Task 12: Build Target Curves and Device Connection

**Files:**
- Create: `src/components/charts/TargetCurveChart.tsx`
- Create: `src/app/target-curve/page.tsx`
- Create: `src/app/target-curve/page.test.tsx`
- Create: `src/components/device/DeviceStatus.tsx`
- Create: `src/app/device/page.tsx`
- Create: `src/app/device/page.test.tsx`

- [ ] **Step 1: Write failing target-curve tests**

Create `src/app/target-curve/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import TargetCurvePage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore
    .getState()
    .replacePressureHistory(
      createFlightSeed("curves").filter((sample) => sample.phase === "descent"),
    );
});

it("shows environmental, left target, and right target curves", () => {
  render(<TargetCurvePage />);
  expect(screen.getByText("Environmental Pressure")).toBeInTheDocument();
  expect(screen.getByText("Left Target Curve")).toBeInTheDocument();
  expect(screen.getByText("Right Target Curve")).toBeInTheDocument();
});
```

- [ ] **Step 2: Write failing unsupported-browser tests**

Create `src/app/device/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import DevicePage from "./page";

beforeEach(() => {
  Object.defineProperty(navigator, "bluetooth", {
    configurable: true,
    value: undefined,
  });
});

it("explains browser support and always offers mock mode", () => {
  render(<DevicePage />);
  expect(
    screen.getByText(/当前浏览器不支持 Web Bluetooth/),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "使用模拟数据" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npm test -- src/app/target-curve/page.test.tsx src/app/device/page.test.tsx
```

Expected: FAIL because both routes are missing.

- [ ] **Step 4: Implement the three-line target chart**

Create `src/components/charts/TargetCurveChart.tsx`:

```tsx
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TargetCurvePoint } from "@/types/domain";

export function TargetCurveChart({ data }: { data: TargetCurvePoint[] }) {
  return (
    <div className="h-[380px]" aria-label="Environmental and bilateral target pressure curves">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} width={40} tick={{ fill: "rgb(255 255 255 / .42)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0b1c31", border: "1px solid rgb(255 255 255 / .1)", borderRadius: 16 }} />
          <Line type="monotone" dataKey="environmental" stroke="#38a7ff" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="leftTarget" stroke="#41e2e8" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="rightTarget" stroke="#818cf8" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Create `src/app/target-curve/page.tsx`:

```tsx
"use client";

import { TargetCurveChart } from "@/components/charts/TargetCurveChart";
import { DemoProgress } from "@/components/layout/DemoProgress";
import { ActionButton } from "@/components/ui/ActionButton";
import { Notice } from "@/components/ui/Notice";
import { translate } from "@/i18n/messages";
import { maxCurveRate, meanCurveGap } from "@/lib/target-curve";
import { useAppStore } from "@/store/useAppStore";

export default function TargetCurvePage() {
  const locale = useAppStore((state) => state.locale);
  const curves = useAppStore((state) => state.targetCurves);
  if (!curves.length) {
    return <main className="mx-auto max-w-3xl px-5 py-12"><Notice>{locale === "zh-CN" ? "请先完成压力预测与双耳策略。" : "Complete prediction and bilateral strategy first."}</Notice></main>;
  }
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8">
      <DemoProgress active={4} />
      <h1 className="mt-8 text-4xl tracking-[-0.05em]">{translate(locale, "curve.title")}</h1>
      <div className="mt-6 flex flex-wrap gap-5 text-xs text-white/55">
        <span className="text-sky-300">Environmental Pressure</span>
        <span className="text-cyan-300">Left Target Curve</span>
        <span className="text-indigo-300">Right Target Curve</span>
      </div>
      <section className="mt-4 rounded-[28px] border border-white/9 bg-white/[0.04] p-4 sm:p-7">
        <TargetCurveChart data={curves} />
      </section>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white/5 p-5">Left max rate <strong className="float-right">{maxCurveRate(curves, "leftTarget").toFixed(2)} kPa/min</strong></div>
        <div className="rounded-2xl bg-white/5 p-5">Right max rate <strong className="float-right">{maxCurveRate(curves, "rightTarget").toFixed(2)} kPa/min</strong></div>
        <div className="rounded-2xl bg-white/5 p-5">Left mean lag <strong className="float-right">{meanCurveGap(curves, "leftTarget").toFixed(2)} kPa</strong></div>
        <div className="rounded-2xl bg-white/5 p-5">Right mean lag <strong className="float-right">{meanCurveGap(curves, "rightTarget").toFixed(2)} kPa</strong></div>
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-6 text-white/55">
        {locale === "zh-CN" ? "目标压力曲线表示系统希望耳道侧压力如何更平滑地变化，从而降低演示模型中的突变压力冲击。" : "The target curve represents a smoother proposed ear-side pressure response, reducing abrupt pressure-change impact in the demonstration model."}
      </p>
      <div className="mt-7 flex justify-end"><ActionButton href="/results">{translate(locale, "action.continue")}</ActionButton></div>
    </main>
  );
}
```

- [ ] **Step 5: Implement device status and connection page**

Create `src/components/device/DeviceStatus.tsx`:

```tsx
export type DeviceState =
  | "unsupported"
  | "disconnected"
  | "scanning"
  | "connected"
  | "failed";

export function DeviceStatus({
  state,
  deviceName,
}: {
  state: DeviceState;
  deviceName?: string;
}) {
  const labels: Record<DeviceState, string> = {
    unsupported: "Unsupported",
    disconnected: "Not connected",
    scanning: "Scanning",
    connected: "Connected",
    failed: "Connection failed",
  };
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className={`size-2 rounded-full ${state === "connected" ? "bg-[#45d19a]" : state === "failed" ? "bg-[#ff6b6b]" : "bg-white/30"}`} />
      <div><strong>{labels[state]}</strong>{deviceName && <p className="text-sm text-white/45">{deviceName}</p>}</div>
    </div>
  );
}
```

Create `src/app/device/page.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { DeviceStatus, type DeviceState } from "@/components/device/DeviceStatus";
import { Notice } from "@/components/ui/Notice";
import { CHARACTERISTIC_UUID, SERVICE_UUID } from "@/config/bluetooth";
import { connectBluetooth, type BluetoothConnection } from "@/lib/bluetooth";
import { createFlightSeed } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";

export default function DevicePage() {
  const locale = useAppStore((state) => state.locale);
  const append = useAppStore((state) => state.appendPressureSample);
  const replace = useAppStore((state) => state.replacePressureHistory);
  const latest = useAppStore((state) => state.pressureHistory.at(-1));
  const [state, setState] = useState<DeviceState>("disconnected");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const connection = useRef<BluetoothConnection | null>(null);
  useEffect(() => {
    if (!window.isSecureContext || !navigator.bluetooth) setState("unsupported");
    return () => void connection.current?.disconnect();
  }, []);
  const scan = async () => {
    setState("scanning");
    setMessage("");
    try {
      connection.current = await connectBluetooth(
        `ble-${Date.now()}`,
        append,
        () => setMessage(locale === "zh-CN" ? "数据格式异常，已忽略本次数据。" : "Invalid data format. This sample was ignored."),
        () => setState("disconnected"),
      );
      setName(connection.current.deviceName);
      setState("connected");
    } catch (error) {
      setState(error instanceof Error && error.name === "NotFoundError" ? "disconnected" : "failed");
      setMessage(locale === "zh-CN" ? "蓝牙连接未完成，可重试或使用模拟数据。" : "Bluetooth connection was not completed. Retry or use mock data.");
    }
  };
  const mock = () => {
    replace(createFlightSeed(`mock-${Date.now()}`).filter((sample) => sample.phase === "descent"));
    setState("connected");
    setName("AeroBalance Demo");
  };
  const disconnect = async () => {
    await connection.current?.disconnect();
    connection.current = null;
    setState("disconnected");
    setName("");
  };
  const unsupported = locale === "zh-CN"
    ? "当前浏览器不支持 Web Bluetooth，请使用 Chrome / Edge 或 Android Chrome，或启用模拟模式。"
    : "This browser does not support Web Bluetooth. Use Chrome, Edge, Android Chrome, or enable mock mode.";
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-4xl tracking-[-0.05em]">{locale === "zh-CN" ? "设备连接" : "Device Connection"}</h1>
      <div className="mt-7"><DeviceStatus state={state} deviceName={name} /></div>
      {state === "unsupported" && <div className="mt-4"><Notice>{unsupported}</Notice></div>}
      {message && <div className="mt-4"><Notice>{message}</Notice></div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={scan} disabled={state === "unsupported" || state === "scanning"} className="min-h-13 rounded-full bg-white font-medium text-[#06111f]">
          {locale === "zh-CN" ? "扫描 ESP32-C3" : "Scan ESP32-C3"}
        </button>
        <button onClick={mock} className="min-h-13 rounded-full border border-white/12 bg-white/5">
          {locale === "zh-CN" ? "使用模拟数据" : "Use Mock Data"}
        </button>
        {state === "connected" && (
          <button onClick={disconnect} className="min-h-13 rounded-full border border-white/12 bg-transparent sm:col-span-2">
            {locale === "zh-CN" ? "断开连接" : "Disconnect"}
          </button>
        )}
      </div>
      <dl className="mt-8 grid gap-3 text-sm text-white/55">
        <div><dt>Service UUID</dt><dd className="break-all text-white/80">{SERVICE_UUID}</dd></div>
        <div><dt>Characteristic UUID</dt><dd className="break-all text-white/80">{CHARACTERISTIC_UUID}</dd></div>
        <div><dt>{locale === "zh-CN" ? "最后接收时间" : "Last received"}</dt><dd className="text-white/80">{latest ? new Date(latest.timestamp).toLocaleTimeString(locale) : "--"}</dd></div>
        <div><dt>Battery / Temperature</dt><dd className="text-white/80">{latest?.battery ?? "--"}% · {latest?.temperature ?? "--"} °C</dd></div>
      </dl>
    </main>
  );
}
```

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm test -- src/app/target-curve/page.test.tsx src/app/device/page.test.tsx
npm run lint
npm run build
```

Expected: three curve labels and unsupported-browser recovery pass.

- [ ] **Step 7: Commit target curves and device flow**

Run:

```bash
git add src/app/target-curve src/app/device src/components/device src/components/charts/TargetCurveChart.tsx
git commit -m "feat: add target curves and device connection"
```

---

### Task 13: Add Results, JSON Export, and Print-to-PDF Report

**Files:**
- Create: `src/lib/report.ts`
- Create: `src/lib/report.test.ts`
- Create: `src/app/results/page.tsx`
- Create: `src/app/results/page.test.tsx`
- Create: `src/app/report/print/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing report serialization tests**

Create `src/lib/report.test.ts`:

```ts
import { expect, it } from "vitest";
import { buildReport, serializeReport } from "./report";

it("serializes a versioned report with bilateral strategy and no diagnosis field", () => {
  const report = buildReport({
    locale: "en",
    generatedAt: 1_710_000_000_000,
    profile: { leftRisk: 75, rightRisk: 40, toleranceScore: 45, adaptationSpeed: 52, leftRadar: [], rightRadar: [] },
    strategy: {
      independent: true,
      left: { side: "left", riskScore: 75, stressIndex: 60, combinedBurden: 69, level: 4, smoothingFactor: 0.59, recommendationKey: "recommendation.highSmoothing" },
      right: { side: "right", riskScore: 40, stressIndex: 60, combinedBurden: 48, level: 3, smoothingFactor: 0.43, recommendationKey: "recommendation.steady" },
    },
    analysis: { comfortScore: 35, riskLevel: "high", leftBurden: 69, rightBurden: 48, recommendationKeys: ["recommendation.independent"] },
    pressure: { source: "mock", sampleCount: 42, phase: "descent", currentPressure: 91.2 },
  });
  const text = serializeReport(report);
  expect(text).toContain('"schemaVersion": 1');
  expect(text).toContain('"independent": true');
  expect(text.toLowerCase()).not.toContain("diagnosis");
});
```

- [ ] **Step 2: Write failing Results page tests**

Create `src/app/results/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import ResultsPage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore
    .getState()
    .replacePressureHistory(
      createFlightSeed("results").filter((sample) => sample.phase === "descent"),
    );
  URL.createObjectURL = vi.fn(() => "blob:report");
  URL.revokeObjectURL = vi.fn();
});

it("shows comfort, risk, bilateral conclusions, and both exports", () => {
  render(<ResultsPage />);
  expect(screen.getByText("舒适度评分")).toBeInTheDocument();
  expect(screen.getByText("风险等级")).toBeInTheDocument();
  expect(screen.getByText("Left Ear")).toBeInTheDocument();
  expect(screen.getByText("Right Ear")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "导出 PDF 报告" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "导出 JSON" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run report tests and verify RED**

Run:

```bash
npm test -- src/lib/report.test.ts src/app/results/page.test.tsx
```

Expected: FAIL because report and result UI files do not exist.

- [ ] **Step 4: Implement the report model and JSON download**

Create `src/lib/report.ts`:

```ts
import type {
  AnalysisResult,
  BilateralStrategy,
  EarProfileResult,
  FlightPhase,
  Locale,
} from "@/types/domain";

interface ReportInput {
  locale: Locale;
  generatedAt: number;
  profile: EarProfileResult;
  strategy: BilateralStrategy;
  analysis: AnalysisResult;
  pressure: {
    source: "mock" | "bluetooth";
    sampleCount: number;
    phase: FlightPhase;
    currentPressure: number;
  };
}

export const buildReport = (input: ReportInput) => ({
  schemaVersion: 1 as const,
  system: "Dynamic Tympanic Pressure Regulation and Protection System",
  ...input,
});

export const serializeReport = (report: ReturnType<typeof buildReport>) =>
  JSON.stringify(report, null, 2);

export function downloadJsonReport(report: ReturnType<typeof buildReport>) {
  const blob = new Blob([serializeReport(report)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aerobalance-report-${report.generatedAt}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

const PRINT_REPORT_KEY = "aerobalance:print-report:v1";

export function openPrintReport(report: ReturnType<typeof buildReport>) {
  localStorage.setItem(PRINT_REPORT_KEY, serializeReport(report));
  window.open("/report/print", "_blank", "noopener,noreferrer");
}

export function loadPrintReport(): ReturnType<typeof buildReport> | null {
  const value = localStorage.getItem(PRINT_REPORT_KEY);
  return value ? (JSON.parse(value) as ReturnType<typeof buildReport>) : null;
}
```

- [ ] **Step 5: Implement Results**

Create `src/app/results/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { DemoProgress } from "@/components/layout/DemoProgress";
import { Notice } from "@/components/ui/Notice";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { translate } from "@/i18n/messages";
import { buildReport, downloadJsonReport, openPrintReport } from "@/lib/report";
import { useAppStore } from "@/store/useAppStore";

export default function ResultsPage() {
  const router = useRouter();
  const state = useAppStore();
  if (!state.profileResult || !state.strategy || !state.analysis || !state.pressureHistory.length) {
    return <main className="mx-auto max-w-3xl px-5 py-12"><Notice>{state.locale === "zh-CN" ? "请先完成演示流程。" : "Complete the demonstration flow first."}</Notice></main>;
  }
  const latest = state.pressureHistory.at(-1)!;
  const report = buildReport({
    locale: state.locale,
    generatedAt: Date.now(),
    profile: state.profileResult,
    strategy: state.strategy,
    analysis: state.analysis,
    pressure: { source: latest.source, sampleCount: state.pressureHistory.length, phase: latest.phase, currentPressure: latest.pressure },
  });
  return (
    <main className="mx-auto max-w-[980px] px-5 py-8">
      <DemoProgress active={5} />
      <h1 className="mt-8 text-4xl tracking-[-0.05em]">{translate(state.locale, "results.title")}</h1>
      <section className="mt-7 grid gap-6 rounded-[32px] border border-white/10 bg-white/[0.045] p-6 sm:grid-cols-[220px_1fr] sm:p-9">
        <ScoreRing score={state.analysis.comfortScore} label={translate(state.locale, "metric.comfort")} />
        <div>
          <p className="text-sm text-white/45">{translate(state.locale, "metric.risk")}</p>
          <div className="mt-2"><RiskBadge level={state.analysis.riskLevel} label={translate(state.locale, `risk.${state.analysis.riskLevel}`)} /></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              ["Left Ear", state.strategy.left],
              ["Right Ear", state.strategy.right],
            ].map(([label, strategy]) => {
              const ear = strategy as typeof state.strategy.left;
              return <article key={label as string} className="rounded-2xl bg-white/5 p-4"><strong>{label as string}</strong><p className="mt-2 text-sm text-white/55">Level {ear.level} · Smoothing {ear.smoothingFactor.toFixed(2)}</p></article>;
            })}
          </div>
          <ul className="mt-6 grid gap-2 text-sm text-white/65">
            {state.analysis.recommendationKeys.map((key) => <li key={key}>• {translate(state.locale, key as Parameters<typeof translate>[1])}</li>)}
          </ul>
        </div>
      </section>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button onClick={() => openPrintReport(report)} className="min-h-13 rounded-full bg-white font-medium text-[#06111f]">{translate(state.locale, "action.exportPdf")}</button>
        <button onClick={() => downloadJsonReport(report)} className="min-h-13 rounded-full border border-white/12 bg-white/5">{translate(state.locale, "action.exportJson")}</button>
        <button onClick={() => { state.resetSession(); router.push("/"); }} className="min-h-13 rounded-full border border-white/12 bg-transparent">{translate(state.locale, "action.restart")}</button>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Implement the print report**

Create `src/app/report/print/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { translate } from "@/i18n/messages";
import { loadPrintReport } from "@/lib/report";

export default function PrintReportPage() {
  const [report, setReport] = useState<ReturnType<typeof loadPrintReport>>(null);
  useEffect(() => {
    const loaded = loadPrintReport();
    setReport(loaded);
    const timer = loaded
      ? window.setTimeout(() => window.print(), 400)
      : undefined;
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);
  if (!report) {
    return <main className="print-report"><h1>AeroBalance</h1><p>No completed analysis is available.</p></main>;
  }
  const isChinese = report.locale === "zh-CN";
  return (
    <main className="print-report">
      <p>AeroBalance</p>
      <h1>Dynamic Tympanic Pressure Regulation and Protection System</h1>
      <p>{new Date(report.generatedAt).toLocaleString(report.locale)}</p>
      <section className="print-score"><strong>{report.analysis.comfortScore}</strong><span>{translate(report.locale, "metric.comfort")}</span></section>
      <h2>{translate(report.locale, "metric.risk")}: {translate(report.locale, `risk.${report.analysis.riskLevel}`)}</h2>
      <table>
        <thead><tr><th>{isChinese ? "耳侧" : "Ear"}</th><th>{isChinese ? "风险" : "Risk"}</th><th>{isChinese ? "适应等级" : "Level"}</th><th>{isChinese ? "平滑系数" : "Smoothing"}</th></tr></thead>
        <tbody>
          <tr><td>{isChinese ? "左耳" : "Left"}</td><td>{report.profile.leftRisk}</td><td>{report.strategy.left.level}</td><td>{report.strategy.left.smoothingFactor}</td></tr>
          <tr><td>{isChinese ? "右耳" : "Right"}</td><td>{report.profile.rightRisk}</td><td>{report.strategy.right.level}</td><td>{report.strategy.right.smoothingFactor}</td></tr>
        </tbody>
      </table>
      <h2>{isChinese ? "适应建议" : "Adaptation Recommendations"}</h2>
      <ul>{report.analysis.recommendationKeys.map((key) => <li key={key}>{translate(report.locale, key as Parameters<typeof translate>[1])}</li>)}</ul>
      <footer>{translate(report.locale, "disclaimer")}</footer>
    </main>
  );
}
```

Append print styles to `src/app/globals.css`:

```css
.print-report {
  margin: 0 auto;
  max-width: 760px;
  padding: 48px;
  background: white;
  color: #06111f;
}
.print-report table {
  width: 100%;
  border-collapse: collapse;
}
.print-report th,
.print-report td {
  border-bottom: 1px solid #dce6ed;
  padding: 12px 8px;
  text-align: left;
}
.print-score strong {
  display: block;
  font-size: 72px;
}
@media print {
  header, nav { display: none !important; }
  html, body { background: white !important; color: #06111f !important; }
  .print-report { max-width: none; padding: 0; }
}
```

- [ ] **Step 7: Verify GREEN**

Run:

```bash
npm test -- src/lib/report.test.ts src/app/results/page.test.tsx
npm run lint
npm run build
```

Expected: versioned JSON, result metrics, bilateral conclusions, and both export controls pass.

- [ ] **Step 8: Commit reports and exports**

Run:

```bash
git add src/lib/report.ts src/lib/report.test.ts src/app/results src/app/report src/app/globals.css
git commit -m "feat: add results and report exports"
```

---

### Task 14: Make the Application Installable and Offline-Capable

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/app/sw.ts`
- Create: `src/app/~offline/page.tsx`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-512.png`
- Modify: `next.config.mjs`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add manifest metadata test**

Create `src/app/manifest.test.ts`:

```ts
import { expect, it } from "vitest";
import manifest from "./manifest";

it("defines an installable standalone AeroBalance application", () => {
  const value = manifest();
  expect(value.display).toBe("standalone");
  expect(value.start_url).toBe("/");
  expect(value.theme_color).toBe("#06111f");
  expect(value.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512" }),
    ]),
  );
});
```

- [ ] **Step 2: Run manifest test and verify RED**

Run:

```bash
npm test -- src/app/manifest.test.ts
```

Expected: FAIL because the manifest is missing.

- [ ] **Step 3: Add the manifest**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dynamic Tympanic Pressure Regulation and Protection System",
    short_name: "AeroBalance",
    description: "Bilateral aviation ear-pressure adaptation demonstration",
    start_url: "/",
    display: "standalone",
    background_color: "#06111f",
    theme_color: "#06111f",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- [ ] **Step 4: Configure Serwist and offline fallback**

Create `next.config.mjs`:

```js
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  reactStrictMode: true,
});
```

Create `src/app/sw.ts`:

```ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
```

Create `src/app/~offline/page.tsx`:

```tsx
export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-xl place-items-center px-5 text-center">
      <div>
        <p className="text-sm text-sky-300">AeroBalance Offline</p>
        <h1 className="mt-3 text-4xl">演示资源暂不可用</h1>
        <p className="mt-4 text-white/55">首次打开需要网络连接。完成首次加载后，应用外壳可离线使用。</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Generate deterministic app icons**

Create a temporary SVG source at `/tmp/aerobalance-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#06111f"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#38a7ff" stroke-width="18"/>
  <circle cx="256" cy="256" r="92" fill="none" stroke="#41e2e8" stroke-width="14" opacity=".9"/>
  <path d="M118 300 C190 124 355 128 405 250" fill="none" stroke="#f6fafd" stroke-width="14" stroke-linecap="round"/>
  <path d="M381 225 l35 29 -46 7z" fill="#f6fafd"/>
</svg>
```

Run:

```bash
mkdir -p public/icons
node -e 'const sharp=require("sharp"); Promise.all([sharp("/tmp/aerobalance-icon.svg").resize(192,192).png().toFile("public/icons/icon-192.png"),sharp("/tmp/aerobalance-icon.svg").resize(512,512).png().toFile("public/icons/icon-512.png"),sharp("/tmp/aerobalance-icon.svg").resize(512,512).extend({top:48,bottom:48,left:48,right:48,background:"#06111f"}).resize(512,512).png().toFile("public/icons/icon-maskable-512.png")]).catch((error)=>{console.error(error);process.exit(1)})'
```

Expected: three valid PNG files exist under `public/icons`.

- [ ] **Step 6: Verify manifest and service worker production output**

Run:

```bash
npm test -- src/app/manifest.test.ts
npm run build
test -f public/sw.js
```

Expected: manifest test passes, production build succeeds, and `public/sw.js` exists.

- [ ] **Step 7: Commit PWA support**

Run:

```bash
git add next.config.mjs src/app/manifest.ts src/app/manifest.test.ts src/app/sw.ts src/app/~offline public/icons
git commit -m "feat: make AeroBalance installable offline"
```

---

### Task 15: Verify the Complete Three-Minute Exhibition Flow

**Files:**
- Create: `e2e/demo-flow.spec.ts`
- Create: `e2e/mobile-layout.spec.ts`
- Create: `docs/validation/exhibition-checklist.md`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Configure mobile and desktop Playwright projects**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

- [ ] **Step 2: Write the guided-flow E2E test**

Create `e2e/demo-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("User A completes the full mock exhibition flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("pressure-sphere")).toContainText("kPa");
  await expect(page.getByText("航空耳压体验中心")).toBeVisible();

  await page.getByRole("link", { name: "开始演示" }).click();
  await page.getByRole("button", { name: "用户 A" }).click();
  await expect(page.getByTestId("left-ear-risk")).not.toHaveText("0");
  await page.getByRole("link", { name: "继续" }).click();

  await page.getByRole("button", { name: "下降" }).click();
  await expect(page.getByText("dP/dt")).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(page.getByText("+15 min")).toBeVisible();
  await expect(page.getByText("Target Pressure Curve")).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(page.getByText("Left Ear Strategy")).toBeVisible();
  await expect(page.getByText("Right Ear Strategy")).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(page.getByText("Left Target Curve")).toBeVisible();
  await expect(page.getByText("Right Target Curve")).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(page.getByText("舒适度评分")).toBeVisible();
  await expect(page.getByRole("button", { name: "导出 JSON" })).toBeVisible();
  await expect(page.getByRole("button", { name: "导出 PDF 报告" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^aerobalance-report-.*\.json$/);
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "导出 PDF 报告" }).click();
  const report = await popupPromise;
  await expect(report.getByText(/Comfort Score|舒适度评分/)).toBeVisible();
  await expect(report.getByText(/Risk Level|风险等级/)).toBeVisible();
});

test("language selection survives navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.getByText("Flight Ear-Pressure Experience Center")).toBeVisible();
  await page.getByRole("link", { name: "Start Demo" }).click();
  await expect(page.getByRole("heading", { name: "Personal Ear Profile" })).toBeVisible();
});
```

- [ ] **Step 3: Write mobile-layout and route-smoke tests**

Create `e2e/mobile-layout.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/device",
  "/profile",
  "/flight",
  "/prediction",
  "/strategy",
  "/target-curve",
  "/results",
];

for (const route of routes) {
  test(`${route} has no horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}

test("mobile primary navigation remains reachable", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByText("飞行")).toBeVisible();
});
```

- [ ] **Step 4: Run E2E tests and verify failures before final fixes**

Run:

```bash
npx playwright install chromium
npm run test:e2e
```

Expected: any selector, hydration, route guard, or mobile overflow issue appears as a failing Playwright assertion. Fix each failure in its owning page or component without weakening the assertion.

- [ ] **Step 5: Create the timed exhibition validation checklist**

Create `docs/validation/exhibition-checklist.md`:

```markdown
# AeroBalance Exhibition Validation

## GOAL

Confirm that a first-time judge understands the product value chain within 90 seconds and can complete the mock demonstration within three minutes.

## CONTEXT

Run the production build in Chrome or Edge at a mobile-width viewport. Begin on `/` with no prior explanation.

## CONSTRAINTS

- Do not use ESP32-C3 hardware for this validation.
- Do not explain the interface before starting the timer.
- Record the observer's exact answer at each checkpoint.

## DONE WHEN

- 0:03: Observer says this is an aviation ear-pressure system.
- 0:30: Observer says the left and right ears have different personal profiles.
- 1:00: Observer says the app predicts future environmental pressure and compares it with a smoother target.
- 1:30: Observer says the left and right ears receive independent decisions and target curves.
- 3:00: Results are visible with Comfort Score, Risk Level, Adaptation Recommendation, PDF export, and JSON export.
- No page shows medical diagnosis language.
- No horizontal overflow appears at 390 x 844.
```

- [ ] **Step 6: Run the complete automated verification**

Run:

```bash
npm run check
npm run test:e2e
git diff --check
```

Expected:

- TypeScript exits with code 0.
- Every Vitest test passes.
- Next.js production build succeeds.
- Both Playwright projects pass.
- Git reports no whitespace errors.

- [ ] **Step 7: Run production PWA and browser verification**

Run:

```bash
npm run build
npm run start
```

In Chrome DevTools:

1. Verify the manifest name, icons, standalone display, and theme color.
2. Verify the service worker controls the page.
3. Reload once online, switch DevTools to Offline, and reload the home/profile/flight routes.
4. Open `/device` and confirm the HTTPS/Chromium support message is accurate.
5. Complete the checklist in `docs/validation/exhibition-checklist.md`.

Expected: application shell remains available offline after first load; mock flow remains functional; BLE availability is accurately reported.

- [ ] **Step 8: Commit final verification**

Run:

```bash
git add e2e playwright.config.ts docs/validation
git commit -m "test: verify exhibition demo flow"
```

---

## Final Requirement Audit

Before declaring implementation complete, inspect current files and runtime evidence against this table:

| Requirement | Evidence |
| --- | --- |
| Premium Flight Experience Center | Home component tests, mobile/desktop browser inspection |
| Pressure Sphere with four live values | `PressureSphere` test and rendered hero |
| High-quality hardware-free data | Seed unit tests and complete Playwright mock flow |
| Four-stage simulator | Flight component test and phase direction checks |
| Digital Ear Twin as primary profile visual | Profile component test and visual inspection |
| 5/10/15-minute prediction | Prediction unit tests and timeline route |
| Environmental versus target animation | Prediction chart/timeline test and reduced-motion check |
| Independent left/right decision paths | Strategy component test and User A flow |
| Three target curves | Target curve component test |
| Web Bluetooth ESP32-C3 support | Parser tests and manual HTTPS hardware check when device is available |
| Recoverable failure states | Device, strategy guard, and insufficient-history tests |
| Chinese/English on every route | Shell test and Playwright navigation test |
| PDF and JSON reports | Result tests, downloaded JSON inspection, browser print preview |
| PWA install/offline shell | Manifest test, service worker build output, offline browser reload |
| Mobile-first layout | Pixel 7 Playwright project and 390 x 844 timed walkthrough |
| No diagnosis language | `rg -ni "diagnos|诊断|治疗|治愈" src` reviewed for disclaimer-only occurrences |
| 3/30/60/90-second comprehension | Completed observer checklist with recorded answers |

Do not treat a passing unit test as evidence for visual polish, BLE hardware behavior, installability, or timed comprehension. Those items require the matching browser or observer validation.

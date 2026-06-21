# AeroBalance

> 面向环境压力梯度变化的耳膜动态调控与保护系统。

Production: https://aero-balance.vercel.app/

Last updated: 2026-06-21

## Overview

AeroBalance is a bilingual Next.js PWA demo for flight ear-pressure adaptation.
It walks a user through personal ear profiling, simulated cabin-pressure changes,
near-term pressure prediction, bilateral adaptation strategy, target-curve
generation, and a final health-style report.

## What The Demo Shows

- Chinese / English language switching across the full journey.
- Flight-stage simulation for takeoff, cruise, descent, and landing.
- Current environmental pressure, rate of change, and trend visualization.
- Left/right ear profile inputs and personalized risk calculation.
- Pressure prediction and bilateral strategy generation.
- Target pressure curves that smooth abrupt cabin-pressure changes.
- Offline-ready PWA behavior and printable report flow.

## User Journey

1. Open the home page and choose a language.
2. Start the demo from the flight experience center.
3. Complete or adjust the ear-profile inputs.
4. Run the flight pressure simulation.
5. Review prediction, strategy, target curves, and final results.
6. Export or print the analysis report.

## Local Development

```bash
npm install
npm run dev
```

The local app runs at `http://localhost:5174` when started with the current
development setup.

## Validation

```bash
npm run check
npx playwright test
```

Recent validation covered TypeScript, unit tests, production build, and the
desktop / mobile Playwright journey.

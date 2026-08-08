import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import {
  clearPressureDatabase,
  savePressureSample,
  savePressureSession,
} from "@/lib/storage";
import { useAppStore } from "./useAppStore";

beforeEach(async () => {
  localStorage.clear();
  await clearPressureDatabase();
  useAppStore.getState().resetSession();
});

it("derives the complete analysis chain from User A and descent data", () => {
  const store = useAppStore.getState();
  store.loadSeedProfile(seedProfiles[0]);
  store.replacePressureHistory(
    createFlightSeed("store-test").filter(
      (sample) => sample.phase === "descent",
    ),
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

it("caps active pressure history at 360 samples", () => {
  const source = createFlightSeed("large");
  useAppStore
    .getState()
    .replacePressureHistory([...source, ...source, ...source]);

  expect(useAppStore.getState().pressureHistory.length).toBeLessThanOrEqual(
    360,
  );
});

it("starts a live session without mixing in demo pressure history", () => {
  const store = useAppStore.getState();
  store.loadSeedProfile(seedProfiles[0]);
  store.replacePressureHistory(createFlightSeed("demo-session").slice(0, 6));

  store.beginLiveSession("ble-session");

  const state = useAppStore.getState();
  expect(state.activeSessionId).toBe("ble-session");
  expect(state.source).toBe("bluetooth");
  expect(state.pressureHistory).toEqual([]);
  expect(state.profileInput).toEqual(seedProfiles[0].input);
  expect(state.prediction).toBeNull();
});

it("persists the live source so a route reload cannot boot the demo", () => {
  useAppStore.getState().beginLiveSession("ble-session");

  const persisted = JSON.parse(
    localStorage.getItem("aerobalance:settings:v1") ?? "{}",
  );
  expect(persisted.state).toMatchObject({
    activeSessionId: "ble-session",
    source: "bluetooth",
    phase: "landing",
  });
});

it("predicts from live BMP390 samples without requiring an ear profile", () => {
  const store = useAppStore.getState();
  store.beginLiveSession("ble-session");

  [101.3, 100.9, 100.5].forEach((pressure, index) => {
    store.appendPressureSample({
      id: `ble-session-${index}`,
      sessionId: "ble-session",
      pressure,
      pressurePa: pressure * 1_000,
      temperature: 25,
      altitude: index * 35,
      phase: "demo",
      devicePhase: "sensor",
      sensorSource: "bmp390",
      i2cAddress: "0x76",
      sequence: index,
      sampleCount: 5,
      deviceTimestamp: index * 60_000 + 1,
      timestamp: 1_800_000_000_000 + index * 60_000,
      source: "bluetooth",
    });
  });

  const state = useAppStore.getState();
  expect(state.pressureHistory).toHaveLength(3);
  expect(state.pressureHistory.at(-1)?.phase).toBe("takeoff");
  expect(state.phase).toBe("takeoff");
  expect(state.prediction?.trend).toBe("falling");
  expect(state.profileResult).toBeNull();
  expect(state.strategy).toBeNull();
});

it("restores the active analysis from IndexedDB after a page reload", async () => {
  const samples = createFlightSeed("restore-test")
    .filter((sample) => sample.phase === "descent")
    .slice(0, 6);

  await savePressureSession({
    id: "restore-test",
    startedAt: samples[0].timestamp,
    source: "mock",
  });
  await Promise.all(samples.map((sample) => savePressureSample(sample)));

  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore.setState({
    activeSessionId: "restore-test",
    pressureHistory: [],
    prediction: null,
    strategy: null,
    targetCurves: [],
    analysis: null,
  });

  await useAppStore.getState().restoreSession();

  const state = useAppStore.getState();
  expect(state.pressureHistory).toHaveLength(6);
  expect(state.analysis).not.toBeNull();
  expect(state.source).toBe("mock");
  expect(state.phase).toBe("descent");
});

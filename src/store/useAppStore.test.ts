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

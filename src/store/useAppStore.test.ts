import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "./useAppStore";

beforeEach(() => {
  localStorage.clear();
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

import { beforeEach, expect, it } from "vitest";
import {
  clearPressureDatabase,
  loadSessionSamples,
  savePressureSample,
  savePressureSession,
} from "./storage";

const sample = {
  id: "sample-1",
  sessionId: "session-1",
  pressure: 82.6,
  temperature: 25.3,
  battery: 87,
  phase: "descent" as const,
  timestamp: 1_710_000_000_000,
  source: "mock" as const,
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
  await savePressureSample({
    ...sample,
    id: "sample-2",
    timestamp: sample.timestamp + 1,
  });

  const loaded = await loadSessionSamples("session-1");
  expect(loaded.map((item) => item.id)).toEqual(["sample-1", "sample-2"]);
});

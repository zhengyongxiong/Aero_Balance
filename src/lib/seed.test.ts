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

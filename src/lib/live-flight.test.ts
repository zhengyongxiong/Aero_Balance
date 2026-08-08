import { describe, expect, it } from "vitest";
import { inferLiveFlightPhase } from "./live-flight";
import type { PressureSample } from "@/types/domain";

const samples = (pressures: number[]): PressureSample[] =>
  pressures.map((pressure, index) => ({
    id: `live-${index}`,
    sessionId: "live",
    pressure,
    phase: "demo",
    timestamp: 1_800_000_000_000 + index * 60_000,
    source: "bluetooth",
  }));

describe("inferLiveFlightPhase", () => {
  it("identifies takeoff when cabin pressure falls", () => {
    expect(
      inferLiveFlightPhase(samples([101.3, 100.9, 100.5]), 101.3, "landing"),
    ).toBe("takeoff");
  });

  it("identifies descent when cabin pressure rises", () => {
    expect(
      inferLiveFlightPhase(samples([82.0, 82.4, 82.8]), 101.3, "cruise"),
    ).toBe("descent");
  });

  it("identifies cruise when pressure is stable well below the baseline", () => {
    expect(
      inferLiveFlightPhase(samples([82.0, 82.02, 82.01]), 101.3, "takeoff"),
    ).toBe("cruise");
  });

  it("identifies cruise when the device connects after the aircraft is airborne", () => {
    expect(
      inferLiveFlightPhase(samples([82.0, 82.02, 82.01]), 82.0, "landing"),
    ).toBe("cruise");
  });

  it("identifies landing when pressure is stable near the baseline", () => {
    expect(
      inferLiveFlightPhase(samples([101.15, 101.18, 101.17]), 101.3, "descent"),
    ).toBe("landing");
  });
});

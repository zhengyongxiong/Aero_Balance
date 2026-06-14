import { describe, expect, it } from "vitest";
import { predictPressure } from "./prediction";

const samples = (pressures: number[]) =>
  pressures.map((pressure, index) => ({
    id: String(index),
    sessionId: "test",
    pressure,
    phase: "descent" as const,
    timestamp: 1_710_000_000_000 + index * 60_000,
    source: "mock" as const,
  }));

describe("predictPressure", () => {
  it("predicts a rising 15-minute pressure trend", () => {
    const result = predictPressure(samples([80, 81, 82, 83, 84]));

    expect(result.trend).toBe("rising");
    expect(result.pressure5).toBeCloseTo(89, 1);
    expect(result.pressure15).toBeCloseTo(99, 1);
    expect(
      result.points.filter((point) => point.kind === "forecast"),
    ).toHaveLength(15);
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

import { describe, expect, it } from "vitest";
import { createBilateralStrategy } from "./strategy";

describe("createBilateralStrategy", () => {
  it("creates independent stronger smoothing for the higher-risk ear", () => {
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

  it("keeps level and smoothing within bounds", () => {
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

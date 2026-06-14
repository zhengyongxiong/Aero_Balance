import { expect, it } from "vitest";
import { createTargetCurves, meanCurveGap } from "./target-curve";

const history = [78, 82, 88, 96].map((pressure, index) => ({
  id: String(index),
  sessionId: "target",
  pressure,
  phase: "descent" as const,
  timestamp: index * 60_000,
  source: "mock" as const,
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

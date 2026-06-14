import { expect, it } from "vitest";
import { composeAnalysisResult } from "./result";

it("bases comfort and risk on the worse ear", () => {
  const result = composeAnalysisResult(80, 35, 70, true, "descent");

  expect(result.riskLevel).toBe("high");
  expect(result.comfortScore).toBeLessThan(40);
  expect(result.recommendationKeys).toContain("recommendation.independent");
});

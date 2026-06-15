import { beforeEach, describe, expect, it } from "vitest";
import { calculateEarProfile } from "./profile";
import { createFlightSeed, seedProfiles } from "./seed";
import { predictPressure } from "./prediction";
import { createBilateralStrategy } from "./strategy";
import { composeAnalysisResult } from "./result";
import {
  buildReport,
  loadPrintReport,
  savePrintReport,
} from "./report";

beforeEach(() => {
  localStorage.clear();
});

describe("print report", () => {
  it("builds a versioned report from the current analysis", () => {
    const samples = createFlightSeed("report-test").filter(
      (sample) => sample.phase === "descent",
    );
    const profile = calculateEarProfile(seedProfiles[0].input);
    const prediction = predictPressure(samples);
    const strategy = createBilateralStrategy(
      profile,
      prediction.stressIndex,
      "descent",
      prediction.trend,
    );
    const analysis = composeAnalysisResult(
      profile.leftRisk,
      profile.rightRisk,
      prediction.stressIndex,
      strategy.independent,
      "descent",
    );

    const report = buildReport({
      locale: "zh-CN",
      generatedAt: 1_710_000_000_000,
      profile,
      strategy,
      analysis,
      samples,
    });

    expect(report).toMatchObject({
      version: 1,
      locale: "zh-CN",
      pressure: {
        source: "mock",
        phase: "descent",
        sampleCount: samples.length,
      },
    });
  });

  it("round-trips the report through temporary local storage", () => {
    const samples = createFlightSeed("report-storage").filter(
      (sample) => sample.phase === "descent",
    );
    const profile = calculateEarProfile(seedProfiles[0].input);
    const prediction = predictPressure(samples);
    const strategy = createBilateralStrategy(
      profile,
      prediction.stressIndex,
      "descent",
      prediction.trend,
    );
    const analysis = composeAnalysisResult(
      profile.leftRisk,
      profile.rightRisk,
      prediction.stressIndex,
      strategy.independent,
      "descent",
    );
    const report = buildReport({
      locale: "en",
      generatedAt: 1_710_000_000_000,
      profile,
      strategy,
      analysis,
      samples,
    });

    savePrintReport(report);

    expect(loadPrintReport()).toEqual(report);
    expect(localStorage.getItem("aerobalance:print-report:v1")).toBeNull();
  });
});

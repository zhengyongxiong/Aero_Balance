import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { calculateEarProfile } from "@/lib/profile";
import { predictPressure } from "@/lib/prediction";
import { composeAnalysisResult } from "@/lib/result";
import {
  buildReport,
  savePrintReport,
} from "@/lib/report";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { createBilateralStrategy } from "@/lib/strategy";
import PrintReportPage from "./page";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("print", vi.fn());
});

it("renders the stored analysis as a printable report", async () => {
  const samples = createFlightSeed("print-page").filter(
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
  savePrintReport(
    buildReport({
      locale: "en",
      generatedAt: 1_710_000_000_000,
      profile,
      strategy,
      analysis,
      samples,
    }),
  );

  render(<PrintReportPage />);

  expect(
    await screen.findByRole("heading", {
      name: "AeroBalance Analysis Report",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Comfort Score")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Risk Level: High" }),
  ).toBeInTheDocument();
});

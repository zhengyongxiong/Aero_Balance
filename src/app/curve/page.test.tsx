import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import CurvePage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  const flight = createFlightSeed("curve-test");
  const descentEnd = flight.findLastIndex(
    (sample) => sample.phase === "descent",
  );
  useAppStore.getState().replacePressureHistory(
    flight.slice(0, descentEnd + 1),
  );
});

it("shows distinct average lag values for the two target curves", () => {
  render(<CurvePage />);

  const curves = useAppStore.getState().targetCurves;
  const averageLag = (side: "leftTarget" | "rightTarget") =>
    curves.reduce(
      (sum, point) => sum + Math.abs(point.environmental - point[side]),
      0,
    ) / curves.length;
  const leftLag = averageLag("leftTarget");
  const rightLag = averageLag("rightTarget");
  const leftCard = screen.getByText("左耳").parentElement;
  const rightCard = screen.getByText("右耳").parentElement;

  expect(leftLag).not.toBeCloseTo(rightLag, 1);
  expect(
    within(leftCard!).getByText(`平均滞后 ${leftLag.toFixed(1)} kPa`),
  ).toBeInTheDocument();
  expect(
    within(rightCard!).getByText(`平均滞后 ${rightLag.toFixed(1)} kPa`),
  ).toBeInTheDocument();
});

import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import PredictionPage from "./page";
import { createFlightSeed, seedProfiles } from "@/lib/seed";

beforeEach(() => {
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  const flight = createFlightSeed("prediction-test");
  const descentEnd = flight.findLastIndex(
    (sample) => sample.phase === "descent",
  );
  useAppStore.getState().replacePressureHistory(
    flight.slice(0, descentEnd + 1),
  );
});

it("shows current pressure and prediction boxes", () => {
  render(<PredictionPage />);

  const state = useAppStore.getState();
  expect(state.prediction).not.toBeNull();

  // Recharts may render text multiple times - use getAllByText
  expect(screen.getAllByText(/当前压力/).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/30 sec/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/60 sec/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/90 sec/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/Stress Index/i).length).toBeGreaterThanOrEqual(1);
});

it("interpolates the 30-second forecast from the current pressure", () => {
  render(<PredictionPage />);

  const state = useAppStore.getState();
  const currentPressure = state.pressureHistory.at(-1)!.pressure;
  const oneMinutePressure = state.prediction!.points.find(
    (point) => point.kind === "forecast" && point.minuteOffset === 1,
  )!.pressure;
  const expected = ((currentPressure + oneMinutePressure) / 2).toFixed(1);
  const card = screen.getByText("30 sec").parentElement;

  expect(card).not.toBeNull();
  expect(within(card!).getByText(expected)).toBeInTheDocument();
});

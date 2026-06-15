import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import FlightPage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("initializes the simulator with descent samples", async () => {
  render(<FlightPage />);

  await waitFor(() => {
    const state = useAppStore.getState();
    expect(state.phase).toBe("descent");
    expect(state.pressureHistory.length).toBeGreaterThan(0);
    expect(
      state.pressureHistory.every((sample) => sample.phase === "descent"),
    ).toBe(true);
  });
});

it("switches repeatedly between flight phases without losing stage data", async () => {
  const user = userEvent.setup();
  render(<FlightPage />);

  await waitFor(() =>
    expect(useAppStore.getState().pressureHistory.length).toBeGreaterThan(0),
  );

  await user.click(screen.getByRole("button", { name: "起飞" }));
  await waitFor(() => {
    const state = useAppStore.getState();
    expect(state.phase).toBe("takeoff");
    expect(
      state.pressureHistory.every((sample) => sample.phase === "takeoff"),
    ).toBe(true);
  });

  await user.click(screen.getByRole("button", { name: "下降" }));
  await waitFor(() => {
    const state = useAppStore.getState();
    expect(state.phase).toBe("descent");
    expect(
      state.pressureHistory.every((sample) => sample.phase === "descent"),
    ).toBe(true);
  });
});

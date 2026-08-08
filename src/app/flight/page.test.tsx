import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import FlightPage from "./page";

const appendBluetoothSample = () =>
  useAppStore.getState().appendPressureSample({
    id: "ble-flight-396000",
    sessionId: "ble-flight",
    pressure: 78.33,
    temperature: 24.9,
    battery: 94,
    phase: "cruise",
    deviceTimestamp: 396000,
    timestamp: 1_800_000_000_000,
    source: "bluetooth",
  });

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

it("controls simulator playback, speed, and restart from the flight page", async () => {
  render(<FlightPage />);

  await waitFor(() =>
    expect(useAppStore.getState().pressureHistory.length).toBeGreaterThan(0),
  );

  expect(screen.getByText("dP/dt")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "暂停模拟" }));
  expect(useAppStore.getState().isPlaying).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "4x" }));
  expect(useAppStore.getState().playbackSpeed).toBe(4);

  fireEvent.click(screen.getByRole("button", { name: "重新播放当前阶段" }));
  expect(useAppStore.getState().isPlaying).toBe(true);
  expect(useAppStore.getState().pressureHistory).toHaveLength(3);
});

it("shows the complete latest BLE sample on the flight page", () => {
  appendBluetoothSample();

  render(<FlightPage />);

  const panel = screen.getByRole("region", { name: "BLE 原始数据" });
  expect(within(panel).getByText("气压")).toBeInTheDocument();
  expect(within(panel).getByText("78.33 kPa")).toBeInTheDocument();
  expect(within(panel).getByText("温度")).toBeInTheDocument();
  expect(within(panel).getByText("24.9 °C")).toBeInTheDocument();
  expect(within(panel).getByText("电量")).toBeInTheDocument();
  expect(within(panel).getByText("94%")).toBeInTheDocument();
  expect(within(panel).getByText("设备阶段")).toBeInTheDocument();
  expect(within(panel).getByText("cruise")).toBeInTheDocument();
  expect(within(panel).getByText("设备运行时间")).toBeInTheDocument();
  expect(within(panel).getByText("396000 ms")).toBeInTheDocument();
});

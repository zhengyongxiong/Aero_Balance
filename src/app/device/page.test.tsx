import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import DevicePage from "./page";

const rawPayload =
  '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"source":"bmp390","addr":"0x76","seq":42,"n":5,"timestamp":299008,"v":[0,0],"f":0}';

const appendBluetoothSample = () =>
  useAppStore.getState().appendPressureSample({
    id: "ble-device-299008",
    sessionId: "ble-device",
    pressure: 100.43,
    pressurePa: 100430,
    temperature: 41.2,
    altitude: 75.1,
    phase: "demo",
    devicePhase: "sensor",
    sensorSource: "bmp390",
    i2cAddress: "0x76",
    sequence: 42,
    sampleCount: 5,
    valveLeftOpen: false,
    valveRightOpen: false,
    firmwareFaultCode: 0,
    deviceTimestamp: 299008,
    timestamp: 1_800_000_000_000,
    source: "bluetooth",
    rawPayload,
  });

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("offers a hardware-free path that prepares the descent demo", async () => {
  const user = userEvent.setup();
  render(<DevicePage />);

  expect(
    screen.getByRole("heading", { name: "设备连接" }),
  ).toBeInTheDocument();

  const mockLink = screen.getByRole("link", { name: "使用模拟数据" });
  expect(mockLink).toHaveAttribute("href", "/flight");
  mockLink.addEventListener("click", (event) => event.preventDefault());

  await user.click(mockLink);

  const state = useAppStore.getState();
  expect(state.selectedSeedId).toBe("user-a");
  expect(state.pressureHistory.length).toBeGreaterThan(0);
  expect(
    state.pressureHistory.every((sample) => sample.phase === "descent"),
  ).toBe(true);
});

it("shows the latest BLE sample fields on the device page", () => {
  appendBluetoothSample();
  useAppStore.getState().setDevice("connected", "AeroBalance-XIAO", null);

  render(<DevicePage />);

  expect(screen.getByText("AeroBalance-XIAO")).toBeInTheDocument();
  const panel = screen.getByRole("region", { name: "BLE 原始数据" });
  expect(within(panel).getByText("100.43 kPa")).toBeInTheDocument();
  expect(within(panel).getByText("100430 Pa")).toBeInTheDocument();
  expect(within(panel).getByText("41.2 °C")).toBeInTheDocument();
  expect(within(panel).getByText("75.1 m")).toBeInTheDocument();
  expect(within(panel).getByText("sensor")).toBeInTheDocument();
  expect(within(panel).getByText("bmp390")).toBeInTheDocument();
  expect(within(panel).getByText("0x76")).toBeInTheDocument();
  expect(within(panel).getByText("#42")).toBeInTheDocument();
  expect(within(panel).getByText("5 次")).toBeInTheDocument();
  expect(within(panel).getAllByText("关闭")).toHaveLength(2);
  expect(within(panel).getByText("0")).toBeInTheDocument();
  expect(within(panel).getByText("299008 ms")).toBeInTheDocument();
  expect(within(panel).getByText("App 接收时间")).toBeInTheDocument();
  expect(within(panel).getByText(rawPayload)).toBeInTheDocument();
});

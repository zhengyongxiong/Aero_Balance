import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHARACTERISTIC_UUID,
  CONTROL_CHARACTERISTIC_UUID,
} from "@/config/bluetooth";
import { connectBluetooth, parseBluetoothPayload } from "./bluetooth";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "bluetooth", {
    configurable: true,
    value: undefined,
  });
});

describe("parseBluetoothPayload", () => {
  it("preserves a complete BMP390 sensor payload", () => {
    const payload =
      '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"phase":"sensor","source":"bmp390","addr":"0x76","seq":42,"n":5,"timestamp":299008}';

    expect(
      parseBluetoothPayload(payload, "session-1", 1_800_000_000_000),
    ).toMatchObject({
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
      deviceTimestamp: 299008,
      timestamp: 1_800_000_000_000,
      source: "bluetooth",
      rawPayload: payload,
    });
  });

  it("normalizes a valid notify payload", () => {
    const result = parseBluetoothPayload(
      JSON.stringify({
        pressure: 82.6,
        temperature: 25.3,
        battery: 87,
        phase: "descent",
        timestamp: 1_710_000_000_000,
      }),
      "session-1",
      1_800_000_001_000,
    );

    expect(result).toMatchObject({
      pressure: 82.6,
      temperature: 25.3,
      battery: 87,
      phase: "descent",
      deviceTimestamp: 1_710_000_000_000,
      timestamp: 1_800_000_001_000,
      source: "bluetooth",
    });
  });

  it("accepts valve state from the compact BMP390 payload", () => {
    const payload =
      '{"pressure":99.38,"pressurePa":99383,"temperature":39.5,"altitude":163.0,"source":"bmp390","addr":"0x76","seq":158,"n":5,"timestamp":2131000,"v":[1,0],"f":0}';

    expect(parseBluetoothPayload(payload, "session-1")).toMatchObject({
      phase: "demo",
      devicePhase: "sensor",
      valveLeftOpen: true,
      valveRightOpen: false,
      firmwareFaultCode: 0,
    });
  });

  it.each([
    "{}",
    '{"pressure":"82.6","phase":"descent","timestamp":1}',
    '{"pressure":900,"phase":"descent","timestamp":1}',
    '{"pressure":82,"phase":"unknown","timestamp":1}',
    '{"pressure":100.43,"temperature":41.2,"altitude":75.1,"phase":"sensor","source":"bmp390","addr":"0x76","seq":1,"n":5,"timestamp":1}',
    '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"phase":"sensor","source":"bmp390","addr":"0x75","seq":1,"n":5,"timestamp":1}',
    '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"phase":"sensor","source":"bmp390","addr":"0x76","seq":1,"n":0,"timestamp":1}',
    '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"source":"bmp390","addr":"0x76","seq":1,"n":5,"timestamp":1,"v":[1,1,0],"f":0}',
    '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"source":"bmp390","addr":"0x76","seq":1,"n":5,"timestamp":1,"v":[1,0],"f":256}',
    "not-json",
  ])("rejects malformed payload %s", (payload) => {
    expect(() => parseBluetoothPayload(payload, "session-1")).toThrow(
      "INVALID_BLE_PAYLOAD",
    );
  });
});

describe("connectBluetooth", () => {
  it("reconnects the same device and restores notifications", async () => {
    vi.useFakeTimers();

    const createCharacteristic = (writeValueWithResponse = vi.fn()) => {
      let characteristic: BluetoothRemoteGATTCharacteristic;
      characteristic = Object.assign(new EventTarget(), {
        startNotifications: vi.fn(async () => characteristic),
        stopNotifications: vi.fn(async () => characteristic),
        writeValueWithResponse,
      }) as BluetoothRemoteGATTCharacteristic;
      return characteristic;
    };
    const telemetryCharacteristic = createCharacteristic();
    const controlWrite = vi.fn(async (_value: BufferSource) => undefined);
    const controlCharacteristic = createCharacteristic(controlWrite);
    const getCharacteristic = vi.fn(async (uuid: string) =>
      uuid === CHARACTERISTIC_UUID
        ? telemetryCharacteristic
        : controlCharacteristic,
    );

    const server = {
      connected: false,
      connect: vi.fn(async function () {
        server.connected = true;
        return server;
      }),
      disconnect: vi.fn(() => {
        server.connected = false;
      }),
      getPrimaryService: vi.fn(async () => ({ getCharacteristic })),
    } as BluetoothRemoteGATTServer;
    const device = Object.assign(new EventTarget(), {
      id: "xiao",
      name: "AeroBalance-XIAO",
      gatt: server,
    }) as BluetoothDevice;

    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "bluetooth", {
      configurable: true,
      value: {
        requestDevice: vi.fn(async () => device),
      },
    });

    const onDisconnected = vi.fn();
    const onReconnecting = vi.fn();
    const onReconnected = vi.fn();
    const connection = await connectBluetooth(
      "session-1",
      vi.fn(),
      vi.fn(),
      onDisconnected,
      onReconnecting,
      onReconnected,
    );

    await connection.pulseValve("left", 250);
    await connection.stopValves();
    expect(controlWrite).toHaveBeenCalledTimes(2);
    expect([...(controlWrite.mock.calls[0][0] as Uint8Array)]).toEqual([
      1, 1, 0, 250, 0, 1,
    ]);
    expect([...(controlWrite.mock.calls[1][0] as Uint8Array)]).toEqual([
      1, 2, 255, 0, 0, 2,
    ]);

    server.connected = false;
    device.dispatchEvent(new Event("gattserverdisconnected"));
    expect(onReconnecting).toHaveBeenCalledWith(1, 5);

    await vi.advanceTimersByTimeAsync(500);

    expect(server.connect).toHaveBeenCalledTimes(2);
    expect(telemetryCharacteristic.startNotifications).toHaveBeenCalledTimes(
      2,
    );
    expect(controlCharacteristic.startNotifications).toHaveBeenCalledTimes(2);
    expect(onReconnected).toHaveBeenCalledTimes(1);
    expect(onDisconnected).not.toHaveBeenCalled();

    await connection.disconnect();
  });
});

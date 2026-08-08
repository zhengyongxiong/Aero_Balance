import {
  CHARACTERISTIC_UUID,
  CONTROL_CHARACTERISTIC_UUID,
  DEVICE_NAME_PREFIX,
  SERVICE_UUID,
} from "@/config/bluetooth";
import type { FlightPhase, PressureSample } from "@/types/domain";
import {
  encodeStopAllCommand,
  encodeValvePulseCommand,
  parseValveAck,
  type ValveAck,
  type ValveId,
} from "./valve-protocol";

const phases = new Set<FlightPhase>([
  "takeoff",
  "cruise",
  "descent",
  "landing",
  "demo",
]);

const RECONNECT_DELAYS_MS = [500, 1_000, 2_000, 4_000, 8_000] as const;

export function parseBluetoothPayload(
  payload: string,
  sessionId: string,
  receivedAt = Date.now(),
): PressureSample {
  try {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== "object") throw new Error();
    const record = value as Record<string, unknown>;
    const isSensorPayload =
      record.phase === "sensor" || record.source === "bmp390";

    if (
      typeof record.pressure !== "number" ||
      !Number.isFinite(record.pressure) ||
      record.pressure < 50 ||
      record.pressure > 120 ||
      (!isSensorPayload &&
        (typeof record.phase !== "string" ||
          !phases.has(record.phase as FlightPhase))) ||
      typeof record.timestamp !== "number" ||
      !Number.isInteger(record.timestamp) ||
      record.timestamp <= 0
    ) {
      throw new Error();
    }
    if (
      record.temperature !== undefined &&
      (typeof record.temperature !== "number" ||
        !Number.isFinite(record.temperature) ||
        record.temperature < -40 ||
        record.temperature > 85)
    ) {
      throw new Error();
    }
    if (
      record.battery !== undefined &&
      (typeof record.battery !== "number" ||
        record.battery < 0 ||
        record.battery > 100)
    ) {
      throw new Error();
    }
    if (
      isSensorPayload &&
      (typeof record.pressurePa !== "number" ||
        !Number.isFinite(record.pressurePa) ||
        record.pressurePa < 50_000 ||
        record.pressurePa > 120_000 ||
        typeof record.altitude !== "number" ||
        !Number.isFinite(record.altitude) ||
        record.altitude < -1_000 ||
        record.altitude > 20_000 ||
        record.source !== "bmp390" ||
        (record.addr !== "0x76" && record.addr !== "0x77") ||
        !Number.isInteger(record.seq) ||
        (record.seq as number) < 0 ||
        !Number.isInteger(record.n) ||
        (record.n as number) < 1 ||
        (record.n as number) > 5)
    ) {
      throw new Error();
    }
    if (
      record.v !== undefined &&
      (!Array.isArray(record.v) ||
        record.v.length !== 2 ||
        record.v.some((state) => state !== 0 && state !== 1))
    ) {
      throw new Error();
    }
    if (
      record.f !== undefined &&
      (!Number.isInteger(record.f) ||
        (record.f as number) < 0 ||
        (record.f as number) > 0xff)
    ) {
      throw new Error();
    }

    const valveState = record.v as [0 | 1, 0 | 1] | undefined;

    return {
      id: `${sessionId}-${record.seq ?? record.timestamp}-${receivedAt}`,
      sessionId,
      pressure: record.pressure,
      ...(isSensorPayload
        ? {
            pressurePa: record.pressurePa as number,
            altitude: record.altitude as number,
            devicePhase: "sensor" as const,
            sensorSource: "bmp390" as const,
            i2cAddress: record.addr as "0x76" | "0x77",
            sequence: record.seq as number,
            sampleCount: record.n as number,
            ...(valveState
              ? {
                  valveLeftOpen: valveState[0] === 1,
                  valveRightOpen: valveState[1] === 1,
                }
              : {}),
            ...(record.f !== undefined
              ? { firmwareFaultCode: record.f as number }
              : {}),
          }
        : {}),
      temperature: record.temperature as number | undefined,
      battery: record.battery as number | undefined,
      phase: isSensorPayload ? "demo" : (record.phase as FlightPhase),
      deviceTimestamp: record.timestamp,
      timestamp: receivedAt,
      source: "bluetooth",
      rawPayload: payload,
    };
  } catch {
    throw new Error("INVALID_BLE_PAYLOAD");
  }
}

export interface BluetoothConnection {
  deviceName: string;
  setValveAckHandler(handler: (ack: ValveAck) => void): void;
  pulseValve(valve: ValveId, durationMs: number): Promise<void>;
  stopValves(): Promise<void>;
  disconnect(): Promise<void>;
}

export async function connectBluetooth(
  sessionId: string,
  onSample: (sample: PressureSample) => void,
  onInvalidData: () => void,
  onDisconnected: () => void,
  onReconnecting: (attempt: number, maxAttempts: number) => void = () =>
    undefined,
  onReconnected: () => void = () => undefined,
  onValveAck: (ack: ValveAck) => void = () => undefined,
): Promise<BluetoothConnection> {
  if (!window.isSecureContext || !navigator.bluetooth) {
    throw new Error("WEB_BLUETOOTH_UNSUPPORTED");
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: DEVICE_NAME_PREFIX }],
    optionalServices: [SERVICE_UUID],
  });
  if (!device.gatt) throw new Error("GATT_UNAVAILABLE");

  const decoder = new TextDecoder();
  let telemetryCharacteristic: BluetoothRemoteGATTCharacteristic | null =
    null;
  let controlCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  let closed = false;
  let reconnecting = false;
  let nextCommandId = 1;
  let valveAckHandler = onValveAck;

  const handleValue = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    try {
      onSample(
        parseBluetoothPayload(decoder.decode(target.value), sessionId),
      );
    } catch {
      onInvalidData();
    }
  };

  const handleControlValue = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    try {
      valveAckHandler(parseValveAck(target.value));
    } catch {
      onInvalidData();
    }
  };

  const removeCharacteristicListeners = () => {
    telemetryCharacteristic?.removeEventListener(
      "characteristicvaluechanged",
      handleValue,
    );
    controlCharacteristic?.removeEventListener(
      "characteristicvaluechanged",
      handleControlValue,
    );
  };

  const subscribe = async () => {
    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const [nextTelemetryCharacteristic, nextControlCharacteristic] =
      await Promise.all([
        service.getCharacteristic(CHARACTERISTIC_UUID),
        service.getCharacteristic(CONTROL_CHARACTERISTIC_UUID),
      ]);
    nextTelemetryCharacteristic.addEventListener(
      "characteristicvaluechanged",
      handleValue,
    );
    nextControlCharacteristic.addEventListener(
      "characteristicvaluechanged",
      handleControlValue,
    );
    try {
      await nextTelemetryCharacteristic.startNotifications();
      await nextControlCharacteristic.startNotifications();
    } catch (error) {
      nextTelemetryCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        handleValue,
      );
      nextControlCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        handleControlValue,
      );
      await nextTelemetryCharacteristic
        .stopNotifications()
        .catch(() => undefined);
      throw error;
    }
    telemetryCharacteristic = nextTelemetryCharacteristic;
    controlCharacteristic = nextControlCharacteristic;
  };

  const reconnect = async () => {
    if (closed || reconnecting) return;
    reconnecting = true;
    removeCharacteristicListeners();
    telemetryCharacteristic = null;
    controlCharacteristic = null;

    for (const [index, delay] of RECONNECT_DELAYS_MS.entries()) {
      if (closed) return;
      onReconnecting(index + 1, RECONNECT_DELAYS_MS.length);
      await new Promise((resolve) => window.setTimeout(resolve, delay));
      if (closed) return;

      try {
        await subscribe();
        if (!device.gatt?.connected) throw new Error("GATT_DISCONNECTED");
        reconnecting = false;
        onReconnected();
        return;
      } catch {
        // The firmware restarts advertising after a disconnect; retry with backoff.
      }
    }

    reconnecting = false;
    if (!closed) onDisconnected();
  };
  const handleDisconnect = () => {
    void reconnect();
  };

  device.addEventListener("gattserverdisconnected", handleDisconnect);
  try {
    await subscribe();
  } catch (error) {
    closed = true;
    device.removeEventListener("gattserverdisconnected", handleDisconnect);
    throw error;
  }

  return {
    deviceName: device.name ?? DEVICE_NAME_PREFIX,
    setValveAckHandler(handler) {
      valveAckHandler = handler;
    },
    async pulseValve(valve, durationMs) {
      if (closed || !device.gatt?.connected || !controlCharacteristic) {
        throw new Error("BLE_NOT_CONNECTED");
      }
      const commandId = nextCommandId;
      nextCommandId = nextCommandId === 0xff ? 1 : nextCommandId + 1;
      await controlCharacteristic.writeValueWithResponse(
        encodeValvePulseCommand(valve, durationMs, commandId),
      );
    },
    async stopValves() {
      if (closed || !device.gatt?.connected || !controlCharacteristic) {
        throw new Error("BLE_NOT_CONNECTED");
      }
      const commandId = nextCommandId;
      nextCommandId = nextCommandId === 0xff ? 1 : nextCommandId + 1;
      await controlCharacteristic.writeValueWithResponse(
        encodeStopAllCommand(commandId),
      );
    },
    async disconnect() {
      closed = true;
      removeCharacteristicListeners();
      device.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect,
      );
      await Promise.all([
        telemetryCharacteristic?.stopNotifications().catch(() => undefined),
        controlCharacteristic?.stopNotifications().catch(() => undefined),
      ]);
      telemetryCharacteristic = null;
      controlCharacteristic = null;
      if (device.gatt?.connected) device.gatt.disconnect();
    },
  };
}

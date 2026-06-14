import {
  CHARACTERISTIC_UUID,
  DEVICE_NAME_PREFIX,
  SERVICE_UUID,
} from "@/config/bluetooth";
import type { FlightPhase, PressureSample } from "@/types/domain";

const phases = new Set<FlightPhase>([
  "takeoff",
  "cruise",
  "descent",
  "landing",
  "demo",
]);

export function parseBluetoothPayload(
  payload: string,
  sessionId: string,
): PressureSample {
  try {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== "object") throw new Error();
    const record = value as Record<string, unknown>;

    if (
      typeof record.pressure !== "number" ||
      !Number.isFinite(record.pressure) ||
      record.pressure < 50 ||
      record.pressure > 120 ||
      typeof record.phase !== "string" ||
      !phases.has(record.phase as FlightPhase) ||
      typeof record.timestamp !== "number" ||
      !Number.isInteger(record.timestamp) ||
      record.timestamp <= 0
    ) {
      throw new Error();
    }
    if (
      record.temperature !== undefined &&
      (typeof record.temperature !== "number" ||
        record.temperature < -20 ||
        record.temperature > 80)
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

    return {
      id: `${sessionId}-${record.timestamp}`,
      sessionId,
      pressure: record.pressure,
      temperature: record.temperature as number | undefined,
      battery: record.battery as number | undefined,
      phase: record.phase as FlightPhase,
      timestamp: record.timestamp,
      source: "bluetooth",
    };
  } catch {
    throw new Error("INVALID_BLE_PAYLOAD");
  }
}

export interface BluetoothConnection {
  deviceName: string;
  disconnect(): Promise<void>;
}

export async function connectBluetooth(
  sessionId: string,
  onSample: (sample: PressureSample) => void,
  onInvalidData: () => void,
  onDisconnected: () => void,
): Promise<BluetoothConnection> {
  if (!window.isSecureContext || !navigator.bluetooth) {
    throw new Error("WEB_BLUETOOTH_UNSUPPORTED");
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: DEVICE_NAME_PREFIX }],
    optionalServices: [SERVICE_UUID],
  });
  if (!device.gatt) throw new Error("GATT_UNAVAILABLE");

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
  const decoder = new TextDecoder();
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
  const handleDisconnect = () => onDisconnected();

  characteristic.addEventListener(
    "characteristicvaluechanged",
    handleValue,
  );
  device.addEventListener("gattserverdisconnected", handleDisconnect);
  await characteristic.startNotifications();

  return {
    deviceName: device.name ?? DEVICE_NAME_PREFIX,
    async disconnect() {
      characteristic.removeEventListener(
        "characteristicvaluechanged",
        handleValue,
      );
      device.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect,
      );
      await characteristic.stopNotifications().catch(() => undefined);
      if (server.connected) server.disconnect();
    },
  };
}

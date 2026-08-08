export type ValveId = "left" | "right";
export type ValveCommandResult =
  | "ok"
  | "invalid"
  | "busy"
  | "sensor-fault";

export interface ValveAck {
  commandId: number;
  result: ValveCommandResult;
  leftOpen: boolean;
  rightOpen: boolean;
  faultCode: number;
}

const PROTOCOL_VERSION = 1;
const PULSE_OPCODE = 1;
const STOP_ALL_OPCODE = 2;
const ALL_VALVES = 0xff;
const MIN_PULSE_MS = 50;
const MAX_PULSE_MS = 500;
const ACK_RESULTS: readonly ValveCommandResult[] = [
  "ok",
  "invalid",
  "busy",
  "sensor-fault",
];

function normalizeCommandId(commandId: number): number {
  if (!Number.isInteger(commandId) || commandId < 0 || commandId > 0xff) {
    throw new Error("INVALID_VALVE_COMMAND_ID");
  }
  return commandId;
}

export function encodeValvePulseCommand(
  valve: ValveId,
  durationMs: number,
  commandId: number,
): Uint8Array<ArrayBuffer> {
  if (
    !Number.isInteger(durationMs) ||
    durationMs < MIN_PULSE_MS ||
    durationMs > MAX_PULSE_MS
  ) {
    throw new Error("INVALID_VALVE_DURATION");
  }

  return Uint8Array.of(
    PROTOCOL_VERSION,
    PULSE_OPCODE,
    valve === "left" ? 0 : 1,
    durationMs & 0xff,
    (durationMs >> 8) & 0xff,
    normalizeCommandId(commandId),
  );
}

export function encodeStopAllCommand(
  commandId: number,
): Uint8Array<ArrayBuffer> {
  return Uint8Array.of(
    PROTOCOL_VERSION,
    STOP_ALL_OPCODE,
    ALL_VALVES,
    0,
    0,
    normalizeCommandId(commandId),
  );
}

export function parseValveAck(value: DataView): ValveAck {
  if (value.byteLength !== 6 || value.getUint8(0) !== PROTOCOL_VERSION) {
    throw new Error("INVALID_VALVE_ACK");
  }

  const result = ACK_RESULTS[value.getUint8(2)];
  const leftOpen = value.getUint8(3);
  const rightOpen = value.getUint8(4);
  if (!result || leftOpen > 1 || rightOpen > 1) {
    throw new Error("INVALID_VALVE_ACK");
  }

  return {
    commandId: value.getUint8(1),
    result,
    leftOpen: leftOpen === 1,
    rightOpen: rightOpen === 1,
    faultCode: value.getUint8(5),
  };
}

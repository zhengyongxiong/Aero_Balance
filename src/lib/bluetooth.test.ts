import { describe, expect, it } from "vitest";
import { parseBluetoothPayload } from "./bluetooth";

describe("parseBluetoothPayload", () => {
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
    );

    expect(result).toMatchObject({
      pressure: 82.6,
      temperature: 25.3,
      battery: 87,
      phase: "descent",
      source: "bluetooth",
    });
  });

  it.each([
    "{}",
    '{"pressure":"82.6","phase":"descent","timestamp":1}',
    '{"pressure":900,"phase":"descent","timestamp":1}',
    '{"pressure":82,"phase":"unknown","timestamp":1}',
    "not-json",
  ])("rejects malformed payload %s", (payload) => {
    expect(() => parseBluetoothPayload(payload, "session-1")).toThrow(
      "INVALID_BLE_PAYLOAD",
    );
  });
});

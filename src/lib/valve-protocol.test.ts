import { describe, expect, it } from "vitest";
import {
  encodeStopAllCommand,
  encodeValvePulseCommand,
  parseValveAck,
} from "./valve-protocol";

describe("valve protocol", () => {
  it("encodes left and right pulse commands", () => {
    expect([...encodeValvePulseCommand("left", 250, 7)]).toEqual([
      1, 1, 0, 250, 0, 7,
    ]);
    expect([...encodeValvePulseCommand("right", 500, 8)]).toEqual([
      1, 1, 1, 244, 1, 8,
    ]);
  });

  it("encodes the stop-all command", () => {
    expect([...encodeStopAllCommand(9)]).toEqual([1, 2, 255, 0, 0, 9]);
  });

  it("parses a valve acknowledgement", () => {
    expect(
      parseValveAck(
        new DataView(Uint8Array.from([1, 7, 0, 1, 0, 0]).buffer),
      ),
    ).toEqual({
      commandId: 7,
      result: "ok",
      leftOpen: true,
      rightOpen: false,
      faultCode: 0,
    });
  });

  it("rejects invalid commands and acknowledgements", () => {
    expect(() => encodeValvePulseCommand("left", 501, 1)).toThrow(
      "INVALID_VALVE_DURATION",
    );
    expect(() => parseValveAck(new DataView(new ArrayBuffer(5)))).toThrow(
      "INVALID_VALVE_ACK",
    );
  });
});

# AeroBalance Dual Solenoid Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fail-closed D1/D2 solenoid pulse control to the XIAO ESP32S3 firmware and expose reliable bilateral valve commands and status in the AeroBalance device page.

**Architecture:** Keep telemetry on the existing FFE1 notify characteristic and add FFE2 for fixed-width binary control commands and acknowledgements. The firmware owns all safety decisions and applies commands from a fixed FreeRTOS queue in `loop()`; the App only requests 250 ms pulses and renders acknowledged and telemetered state.

**Tech Stack:** Arduino ESP32 core 3.3.11, Adafruit BMP3XX, ESP32 BLE, FreeRTOS queue, Next.js 16, React 19, TypeScript, Vitest, Web Bluetooth.

## Global Constraints

- Left valve is XIAO `D1` / ESP32-S3 `GPIO2`; right valve is `D2` / `GPIO3`.
- Both valve driver inputs are active high and must power up low.
- Solenoids must use a MOSFET/driver board and flyback diode; GPIO must never drive a coil directly.
- Pulse duration is valid only from 50 through 500 ms; the App sends 250 ms.
- Never allow both valves to be open simultaneously.
- Boot, BLE disconnect, three consecutive BMP390 failures, timeout, or reset must leave both valves closed.
- Sensor sampling remains 5 Hz, telemetry remains 1 Hz, and no control path may call `delay()`.
- FFE1 remains telemetry; FFE2 is Read, Write, and Notify for six-byte control packets.

---

### Task 1: Shared App Valve Protocol Codec

**Files:**
- Create: `src/lib/valve-protocol.ts`
- Create: `src/lib/valve-protocol.test.ts`
- Modify: `src/config/bluetooth.ts`

**Interfaces:**
- Produces: `ValveId`, `ValveAck`, `ValveCommandResult`, `encodeValvePulseCommand(valve, durationMs, commandId)`, `encodeStopAllCommand(commandId)`, `parseValveAck(value)`.
- Produces: `CONTROL_CHARACTERISTIC_UUID` with value `0000ffe2-0000-1000-8000-00805f9b34fb`.

- [ ] **Step 1: Write codec tests**

```ts
expect([...encodeValvePulseCommand("left", 250, 7)]).toEqual([1, 1, 0, 250, 0, 7]);
expect([...encodeValvePulseCommand("right", 500, 8)]).toEqual([1, 1, 1, 244, 1, 8]);
expect([...encodeStopAllCommand(9)]).toEqual([1, 2, 255, 0, 0, 9]);
expect(parseValveAck(new DataView(Uint8Array.from([1, 7, 0, 1, 0, 0]).buffer))).toEqual({
  commandId: 7,
  result: "ok",
  leftOpen: true,
  rightOpen: false,
  faultCode: 0,
});
expect(() => encodeValvePulseCommand("left", 501, 1)).toThrow("INVALID_VALVE_DURATION");
expect(() => parseValveAck(new DataView(new ArrayBuffer(5)))).toThrow("INVALID_VALVE_ACK");
```

- [ ] **Step 2: Run the codec test and verify it fails**

Run: `./node_modules/.bin/vitest run src/lib/valve-protocol.test.ts`

Expected: FAIL because `valve-protocol.ts` does not exist. If the known Vitest worker timeout occurs before tests load, also run the repository's TypeScript transpile verifier and record the worker limitation.

- [ ] **Step 3: Implement the fixed six-byte codec**

```ts
export type ValveId = "left" | "right";
export type ValveCommandResult = "ok" | "invalid" | "busy" | "sensor-fault";
export interface ValveAck {
  commandId: number;
  result: ValveCommandResult;
  leftOpen: boolean;
  rightOpen: boolean;
  faultCode: number;
}

const VERSION = 1;
const RESULT = ["ok", "invalid", "busy", "sensor-fault"] as const;

export function encodeValvePulseCommand(
  valve: ValveId,
  durationMs: number,
  commandId: number,
): Uint8Array {
  if (!Number.isInteger(durationMs) || durationMs < 50 || durationMs > 500) {
    throw new Error("INVALID_VALVE_DURATION");
  }
  return Uint8Array.of(
    VERSION,
    1,
    valve === "left" ? 0 : 1,
    durationMs & 0xff,
    (durationMs >> 8) & 0xff,
    commandId & 0xff,
  );
}
```

Implement `encodeStopAllCommand` as `[1, 2, 255, 0, 0, id]`. `parseValveAck` must require exactly six bytes, version 1, result 0-3, and valve bytes 0 or 1.

- [ ] **Step 4: Run codec validation**

Run: `./node_modules/.bin/vitest run src/lib/valve-protocol.test.ts`

Expected: PASS, or only the already-documented Vitest worker startup timeout.

- [ ] **Step 5: Commit the codec**

```bash
git add src/config/bluetooth.ts src/lib/valve-protocol.ts src/lib/valve-protocol.test.ts
git commit -m "feat: add BLE valve command codec"
```

---

### Task 2: Fail-Closed Firmware Valve Controller

**Files:**
- Modify: `/Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino`

**Interfaces:**
- Consumes: six-byte command format from Task 1.
- Produces: FFE2 acknowledgements and FFE1 telemetry fields `v:[left,right]` and `f`.

- [ ] **Step 1: Add constants, state, and queue types**

```cpp
static const char *CONTROL_CHARACTERISTIC_UUID =
  "0000ffe2-0000-1000-8000-00805f9b34fb";
static const uint8_t LEFT_VALVE_PIN = D1;
static const uint8_t RIGHT_VALVE_PIN = D2;
static const uint16_t MIN_VALVE_PULSE_MS = 50;
static const uint16_t MAX_VALVE_PULSE_MS = 500;

struct ValveCommandPacket {
  uint8_t length;
  uint8_t bytes[6];
};

BLECharacteristic *controlCharacteristic = nullptr;
QueueHandle_t valveCommandQueue = nullptr;
bool leftValveOpen = false;
bool rightValveOpen = false;
uint32_t valveCloseAt = 0;
uint8_t firmwareFaultCode = 0;
```

Create the queue with `xQueueCreate(4, sizeof(ValveCommandPacket))`. The BLE callback only copies at most six bytes into the queue; it must not parse JSON, allocate `String`, wait, or directly start a pulse.

- [ ] **Step 2: Implement fail-closed output functions**

```cpp
void closeAllValves() {
  digitalWrite(LEFT_VALVE_PIN, LOW);
  digitalWrite(RIGHT_VALVE_PIN, LOW);
  leftValveOpen = false;
  rightValveOpen = false;
  valveCloseAt = 0;
}

bool startValvePulse(uint8_t valve, uint16_t durationMs, uint32_t now) {
  if (leftValveOpen || rightValveOpen || !bmpReady) return false;
  if (durationMs < MIN_VALVE_PULSE_MS || durationMs > MAX_VALVE_PULSE_MS) return false;
  leftValveOpen = valve == 0;
  rightValveOpen = valve == 1;
  digitalWrite(LEFT_VALVE_PIN, leftValveOpen ? HIGH : LOW);
  digitalWrite(RIGHT_VALVE_PIN, rightValveOpen ? HIGH : LOW);
  valveCloseAt = now + durationMs;
  return true;
}
```

In `setup()`, call `pinMode` for D1/D2 and `closeAllValves()` before `Wire.begin()` or BLE initialization. In `loop()`, close the active valve when `static_cast<int32_t>(now - valveCloseAt) >= 0`.

- [ ] **Step 3: Implement command validation and acknowledgements**

Process queued commands in `loop()`:

```cpp
// [version, opcode, valve, durationLo, durationHi, commandId]
```

Reject any packet not exactly six bytes, version not 1, invalid opcode, invalid valve, invalid duration, busy valve, or unavailable BMP390. `STOP_ALL` must always close both valves and return OK. Acknowledgement bytes are `[1, commandId, result, leftOpen, rightOpen, firmwareFaultCode]`.

- [ ] **Step 4: Wire all safety paths**

Call `closeAllValves()` from:

- `ServerCallbacks::onDisconnect` before scheduling advertising restart.
- `recordSensorFailure` when the third consecutive failure marks BMP390 unavailable.
- `setup()` before all peripheral initialization.

Clear pending commands with `xQueueReset(valveCommandQueue)` on BLE disconnect. Enable the ESP32 Arduino loop watchdog with `enableLoopWDT()` and let Arduino CLI compilation verify core compatibility.

- [ ] **Step 5: Extend telemetry without exceeding ATT payload**

Change JSON to:

```cpp
{"pressure":%.2f,"pressurePa":%.0f,"temperature":%.1f,"altitude":%.1f,"source":"bmp390","addr":"0x%02x","seq":%lu,"n":%u,"timestamp":%lu,"v":[%u,%u],"f":%u}
```

Keep the existing `MAX_NOTIFY_PAYLOAD` rejection. Add a verification using maximum-width numeric values and require formatted length `<= 182`.

- [ ] **Step 6: Compile firmware**

Run:

```bash
"/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli" compile --fqbn esp32:esp32:XIAO_ESP32S3 /Users/zhengyongxiong/Documents/Arduino/air_esp32
```

Expected: exit 0, no missing BLE or watchdog APIs, payload buffer compiles without truncation warnings.

- [ ] **Step 7: Do not flash yet; verify outputs without coils first**

Prepare the compiled firmware for upload only after App integration. The first physical test must disconnect the solenoid coils and use a meter or LED on D1/D2 to verify active-high timing.

---

### Task 3: Web Bluetooth Control Transport and Telemetry Compatibility

**Files:**
- Modify: `src/types/bluetooth.d.ts`
- Modify: `src/types/domain.ts`
- Modify: `src/lib/bluetooth.ts`
- Modify: `src/lib/bluetooth.test.ts`

**Interfaces:**
- Consumes: Task 1 codec and FFE2 UUID.
- Produces: `BluetoothConnection.pulseValve(valve, durationMs)` and `BluetoothConnection.stopValves()`; `connectBluetooth` emits `ValveAck` through a new callback.
- Produces: `PressureSample.valveLeftOpen`, `valveRightOpen`, and `firmwareFaultCode`.

- [ ] **Step 1: Write parser and transport tests**

Add a v2 telemetry fixture without `phase`:

```ts
const payload = '{"pressure":99.38,"pressurePa":99383,"temperature":39.5,"altitude":163.0,"source":"bmp390","addr":"0x76","seq":158,"n":5,"timestamp":2131000,"v":[1,0],"f":0}';
expect(parseBluetoothPayload(payload, "session")).toMatchObject({
  phase: "demo",
  valveLeftOpen: true,
  valveRightOpen: false,
  firmwareFaultCode: 0,
});
```

Extend the existing fake GATT test to return both FFE1 and FFE2 characteristics. Assert that a left pulse writes `[1,1,0,250,0,id]`, stop writes `[1,2,255,0,0,id]`, and reconnection calls `startNotifications()` on both characteristics again.

- [ ] **Step 2: Extend Web Bluetooth declarations**

```ts
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  writeValueWithResponse(value: BufferSource): Promise<void>;
}
```

- [ ] **Step 3: Extend telemetry parsing compatibly**

Treat a packet as BMP390 telemetry when either `phase === "sensor"` or `source === "bmp390"`. Keep accepting old packets. When `v` exists, require an array of exactly two values, each 0 or 1. Require `f` to be an integer from 0 through 255 when present.

- [ ] **Step 4: Subscribe to FFE2 and expose commands**

During every initial connection and automatic reconnect:

1. Resolve FFE1 and FFE2.
2. Attach value listeners to both.
3. Start notifications on both.
4. Store both current characteristics.

`pulseValve` and `stopValves` increment a local uint8 command ID and call `controlCharacteristic.writeValueWithResponse(...)`. Manual disconnect removes both listeners and stops both notification streams.

- [ ] **Step 5: Run focused verification**

Run:

```bash
node /private/tmp/verify-aerobalance-reconnect.cjs
node /private/tmp/verify-aerobalance-ble.cjs
./node_modules/.bin/vitest run src/lib/valve-protocol.test.ts src/lib/bluetooth.test.ts
```

Expected: reconnect and parser scripts pass; Vitest passes or reports only the known worker startup timeout before loading tests.

- [ ] **Step 6: Commit transport integration**

```bash
git add src/config/bluetooth.ts src/types/bluetooth.d.ts src/types/domain.ts src/lib/valve-protocol.ts src/lib/valve-protocol.test.ts src/lib/bluetooth.ts src/lib/bluetooth.test.ts
git commit -m "feat: integrate BLE solenoid control"
```

---

### Task 4: Device Page Valve Controls

**Files:**
- Create: `src/components/device/ValveControlPanel.tsx`
- Create: `src/components/device/ValveControlPanel.test.tsx`
- Modify: `src/components/device/BleSampleDetails.tsx`
- Modify: `src/app/device/page.tsx`
- Modify: `src/app/device/page.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: Task 3 `BluetoothConnection` methods, `ValveAck`, and telemetry valve fields.
- Produces: accessible left pulse, right pulse, and stop-all controls with bilingual status.

- [ ] **Step 1: Write component tests**

Render the panel with `connected=true`, telemetry `[false,false]`, and spies. Verify:

```ts
await user.click(screen.getByRole("button", { name: "左阀脉冲 250 ms" }));
expect(onPulse).toHaveBeenCalledWith("left", 250);
await user.click(screen.getByRole("button", { name: "全部关闭" }));
expect(onStop).toHaveBeenCalledOnce();
```

Also verify pulse buttons are disabled while disconnected, reconnecting, or awaiting an acknowledgement; stop remains available whenever a GATT connection exists.

- [ ] **Step 2: Implement `ValveControlPanel`**

Props:

```ts
interface ValveControlPanelProps {
  locale: Locale;
  connected: boolean;
  pending: boolean;
  leftOpen: boolean;
  rightOpen: boolean;
  lastAck: ValveAck | null;
  onPulse(valve: ValveId, durationMs: number): Promise<void>;
  onStop(): Promise<void>;
}
```

Use standard buttons and existing card/action styles. Show each valve as `关闭/开启` or `Closed/Open`, plus the latest command result. Do not claim physiological protection or automatic control.

- [ ] **Step 3: Connect the page to the live BLE object**

Keep `connection` in the existing ref. Add local `pendingCommand` and `lastValveAck` state. Pass the FFE2 acknowledgement callback into `connectBluetooth`. Command handlers await the connection method, clear pending on write error, and rely on telemetry plus acknowledgements for visible state.

- [ ] **Step 4: Extend raw sample details**

Add rows for left valve, right valve, and firmware fault whenever the telemetry packet contains these fields. Keep the exact raw JSON visible.

- [ ] **Step 5: Add responsive styles**

Use a two-column valve grid above 360 px and a one-column grid below 360 px. Buttons must retain at least 44 px touch height and never cause horizontal overflow.

- [ ] **Step 6: Verify the live page**

Run the existing Next server on port 5174 and check:

- `/device` returns HTTP 200.
- Chinese and English labels do not mix.
- No browser console errors.
- Controls are disabled before connection and enabled after FFE1/FFE2 subscriptions.
- Acknowledgement and telemetry valve state render independently.

- [ ] **Step 7: Commit the UI**

```bash
git add src/components/device src/app/device/page.tsx src/app/device/page.test.tsx src/app/globals.css
git commit -m "feat: add bilateral valve controls"
```

---

### Task 5: Compile, Upload, and Hardware-Safe End-to-End Test

**Files:**
- Verify: `/Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino`
- Verify: App files from Tasks 1-4

**Interfaces:**
- Consumes: complete firmware and App control path.
- Produces: verified meter/LED pulse timing, then optional driver-board test.

- [ ] **Step 1: Run all non-hardware checks**

Run firmware compile, `git diff --check`, payload-length verification, App transpile verification, and focused Vitest tests. Do not claim test success when Vitest fails before test loading.

- [ ] **Step 2: Upload firmware with coils disconnected**

Upload using Arduino CLI to the detected `/dev/cu.usbmodem*` port. Verify the upload hash and reopen the 115200 baud serial monitor.

- [ ] **Step 3: Verify boot safety**

Measure D1 and D2: both must remain LOW through reset, BMP390 initialization, BLE advertising, and App connection.

- [ ] **Step 4: Verify pulse timing and interlock**

Send left and right 250 ms commands from the App. Confirm only the selected pin goes HIGH, returns LOW near 250 ms, and a second pulse while active returns BUSY. Confirm STOP_ALL immediately drives both pins LOW.

- [ ] **Step 5: Verify failure safety**

While a pulse is active, disconnect BLE and confirm immediate LOW. Temporarily disconnect BMP390 long enough for three failed reads and confirm both pins stay LOW and pulse requests return SENSOR_FAULT.

- [ ] **Step 6: Connect the actual valve driver board**

Only after Steps 3-5 pass, connect the MOSFET/driver inputs and shared ground. Power valve coils from their rated external supply with flyback protection. Repeat left, right, stop, BLE disconnect, and sensor-fault tests.

- [ ] **Step 7: Final browser handoff**

Leave `http://127.0.0.1:5174/device` open with the server running and report actual firmware compile, upload, GPIO timing, BLE command, and data results.

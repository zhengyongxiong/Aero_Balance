# BMP390 BLE Telemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stream stable, averaged BMP390 telemetry from the XIAO ESP32S3 once per second and show every transmitted field plus the exact BLE JSON in AeroBalance.

**Architecture:** The firmware samples BMP390 at 5 Hz into a fixed accumulator and emits at most one bounded JSON notification per second. The App validates the compact wire protocol, normalizes the non-flight `sensor` phase to the existing `demo` domain phase, preserves the decoded payload verbatim, and renders complete sensor metadata on the device page.

**Tech Stack:** Arduino ESP32 BLE, Adafruit BMP3XX, I2C, Next.js 16, React 19, TypeScript, Zustand, Vitest, Testing Library, Web Bluetooth.

## Global Constraints

- Keep device name `AeroBalance-XIAO`, service UUID `0000ffe0-0000-1000-8000-00805f9b34fb`, and characteristic UUID `0000ffe1-0000-1000-8000-00805f9b34fb`.
- Sample every 200 ms and notify no more than once every 1,000 ms.
- Use real BMP390 readings only; do not retain seed-data code in the production sketch.
- Do not block the main loop during sensor recovery or BLE advertising restart.
- Keep each valid JSON notification at or below 182 bytes for MTU 185.
- Use fixed buffers for firmware JSON formatting; do not construct telemetry with Arduino `String`.
- Preserve the exact decoded BLE JSON in the App.
- Treat altitude as an estimate using `1013.25 hPa`, not a directly measured value.
- Do not add dependencies.

---

### Task 1: Preserve and validate the complete BMP390 BLE packet

**Files:**
- Modify: `src/types/domain.ts:13-22`
- Modify: `src/lib/bluetooth.test.ts:4-37`
- Modify: `src/lib/bluetooth.ts:8-68`

**Interfaces:**
- Consumes: firmware JSON keys `pressure`, `pressurePa`, `temperature`, `altitude`, `phase`, `source`, `addr`, `seq`, `n`, and `timestamp`.
- Produces: `parseBluetoothPayload(payload: string, sessionId: string): PressureSample` with normalized `phase: "demo"`, transport metadata, and exact `rawPayload`.

- [ ] **Step 1: Write the failing parser test**

Replace the valid-payload test input with a real BMP390 packet and assert every mapped field:

```ts
it("preserves a complete BMP390 sensor payload", () => {
  const payload =
    '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"phase":"sensor","source":"bmp390","addr":"0x76","seq":42,"n":5,"timestamp":299008}';

  expect(parseBluetoothPayload(payload, "session-1")).toMatchObject({
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
    timestamp: 299008,
    source: "bluetooth",
    rawPayload: payload,
  });
});
```

Add malformed sensor packets to the rejection table: missing `pressurePa`, invalid `addr`, `n: 0`, non-integer `seq`, and altitude outside `-1000..20000` metres.

- [ ] **Step 2: Run the focused parser test and verify RED**

Run: `npx vitest run src/lib/bluetooth.test.ts --reporter=verbose`

Expected: FAIL because `phase: "sensor"` is rejected and telemetry metadata is absent.

- [ ] **Step 3: Extend the sample type**

Add these optional properties to `PressureSample` so existing mock samples and stored sessions remain compatible:

```ts
pressurePa?: number;
altitude?: number;
devicePhase?: "sensor";
sensorSource?: "bmp390";
i2cAddress?: "0x76" | "0x77";
sequence?: number;
sampleCount?: number;
rawPayload?: string;
```

- [ ] **Step 4: Implement sensor-packet validation and mapping**

In `parseBluetoothPayload`, keep the existing flight-phase path for old packets. For `phase === "sensor"`, require:

```ts
const isSensorPayload = record.phase === "sensor";
const validSensorPayload =
  typeof record.pressurePa === "number" &&
  Number.isFinite(record.pressurePa) &&
  record.pressurePa >= 50_000 &&
  record.pressurePa <= 120_000 &&
  typeof record.altitude === "number" &&
  Number.isFinite(record.altitude) &&
  record.altitude >= -1_000 &&
  record.altitude <= 20_000 &&
  record.source === "bmp390" &&
  (record.addr === "0x76" || record.addr === "0x77") &&
  Number.isInteger(record.seq) &&
  (record.seq as number) >= 0 &&
  Number.isInteger(record.n) &&
  (record.n as number) >= 1 &&
  (record.n as number) <= 5;
```

Map the transport fields to the optional `PressureSample` properties, set `phase` to `"demo"` for sensor packets, and set `rawPayload: payload`. Expand temperature validation to the BMP390 operating range `-40..85` degrees Celsius.

- [ ] **Step 5: Run the focused parser test and verify GREEN**

Run: `npx vitest run src/lib/bluetooth.test.ts --reporter=verbose`

Expected: all parser tests PASS with no unhandled errors.

- [ ] **Step 6: Commit the parser contract**

```bash
git add src/types/domain.ts src/lib/bluetooth.ts src/lib/bluetooth.test.ts
git commit -m "feat: preserve BMP390 BLE telemetry"
```

---

### Task 2: Render the complete device sample and exact raw JSON

**Files:**
- Modify: `src/app/device/page.test.tsx:7-58`
- Modify: `src/components/device/BleSampleDetails.tsx:10-116`
- Verify integration: `src/app/device/page.tsx:22-143`

**Interfaces:**
- Consumes: optional BMP390 fields added to `PressureSample` in Task 1.
- Produces: `BleSampleDetails` cards and an exact raw-payload code block under the device connection state.

- [ ] **Step 1: Write the failing device-page test**

Declare the exact wire payload next to `appendBluetoothSample`, parse the same values into the test sample, and then assert:

```ts
const rawPayload =
  '{"pressure":100.43,"pressurePa":100430,"temperature":41.2,"altitude":75.1,"phase":"sensor","source":"bmp390","addr":"0x76","seq":42,"n":5,"timestamp":299008}';

expect(within(panel).getByText("100.43 kPa")).toBeInTheDocument();
expect(within(panel).getByText("100430 Pa")).toBeInTheDocument();
expect(within(panel).getByText("41.2 °C")).toBeInTheDocument();
expect(within(panel).getByText("75.1 m")).toBeInTheDocument();
expect(within(panel).getByText("sensor")).toBeInTheDocument();
expect(within(panel).getByText("bmp390")).toBeInTheDocument();
expect(within(panel).getByText("0x76")).toBeInTheDocument();
expect(within(panel).getByText("#42")).toBeInTheDocument();
expect(within(panel).getByText("5 samples")).toBeInTheDocument();
expect(within(panel).getByText(rawPayload)).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused device-page test and verify RED**

Run: `npx vitest run src/app/device/page.test.tsx --reporter=verbose`

Expected: FAIL because pressure Pa, altitude, sensor metadata, and exact raw JSON are not rendered.

- [ ] **Step 3: Render optional telemetry fields**

Update Chinese and English labels for pressure Pa, estimated altitude, device phase, sensor source, I2C address, sequence, aggregation samples, and raw payload. Render a field only when its value exists, except pressure, temperature, phase, source, and timestamp which retain their current fallback behavior.

Replace the reconstructed `payload` object with:

```tsx
<code className="mt-1 block break-all text-[11px] leading-relaxed text-slate-300">
  {sample.rawPayload ?? JSON.stringify({
    pressure: sample.pressure,
    temperature: sample.temperature,
    battery: sample.battery,
    phase: sample.phase,
    timestamp: sample.timestamp,
  })}
</code>
```

Display `sample.devicePhase ?? sample.phase` and `sample.sensorSource ?? (sample.source === "bluetooth" ? "BLE" : "Demo")` so the raw device semantics are visible without changing flight-domain calculations.

- [ ] **Step 4: Run the focused device-page test and verify GREEN**

Run: `npx vitest run src/app/device/page.test.tsx --reporter=verbose`

Expected: all device-page tests PASS.

- [ ] **Step 5: Run parser and device tests together**

Run: `npx vitest run src/lib/bluetooth.test.ts src/app/device/page.test.tsx --reporter=verbose`

Expected: both test files PASS and the existing hardware-free demo test remains green.

- [ ] **Step 6: Commit the device telemetry panel**

```bash
git add src/components/device/BleSampleDetails.tsx src/app/device/page.tsx src/app/device/page.test.tsx
git commit -m "feat: show complete BLE sensor data"
```

---

### Task 3: Replace the sketch with non-blocking real BMP390 telemetry

**Files:**
- Modify: `/Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino:1-277`

**Interfaces:**
- Consumes: Adafruit BMP3XX readings in pascals and degrees Celsius from I2C address `0x77` or `0x76`.
- Produces: the exact JSON contract consumed by Task 1 over FFE1 notifications.

- [ ] **Step 1: Record firmware structural checks before editing**

Run:

```bash
rg -n "SAMPLE_INTERVAL_MS|delay\(|String |performReading|notify\(" /Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino
```

Expected: current sketch reports a 1,000 ms direct-read interval, a blocking reconnect delay, and dynamic `String` JSON construction.

- [ ] **Step 2: Define independent schedules and recovery state**

Replace seed-mode constants and state with:

```cpp
static const uint32_t SENSOR_INTERVAL_MS = 200;
static const uint32_t NOTIFY_INTERVAL_MS = 1000;
static const uint32_t SENSOR_RETRY_INTERVAL_MS = 5000;
static const uint32_t ADVERTISING_RESTART_DELAY_MS = 300;
static const uint8_t MAX_CONSECUTIVE_READ_FAILURES = 3;
static const uint16_t BLE_MTU = 185;
static const size_t MAX_NOTIFY_PAYLOAD = BLE_MTU - 3;
static const float SEA_LEVEL_HPA = 1013.25f;

struct SensorAccumulator {
  double pressurePaTotal;
  double temperatureCTotal;
  uint8_t count;
};
```

Track sensor, notify, retry, and advertising timestamps separately with `uint32_t`. Use `volatile bool` for connection flags written by BLE callbacks.

- [ ] **Step 3: Implement recoverable BMP390 initialization and sampling**

Initialize `Wire` once in `setup()` with 400 kHz clock and a 50 ms timeout. `beginBmp390()` tries `0x77` then `0x76`, configures pressure oversampling 8x, temperature oversampling 2x, IIR coefficient 3, and ODR 25 Hz, then clears failure state.

`sampleBmp390()` calls `performReading()` only at the 200 ms deadline. Accept only finite pressure `50,000..120,000 Pa` and temperature `-40..85 C`; add valid readings to the accumulator. Three consecutive failures set `bmpReady = false`, clear the accumulator, and allow `retryBmp390()` to attempt initialization every five seconds without restarting BLE.

- [ ] **Step 4: Format one bounded payload per second**

Use a `char payload[MAX_NOTIFY_PAYLOAD + 1]` and this wire shape:

```cpp
const int length = snprintf(
  payload,
  sizeof(payload),
  "{\"pressure\":%.2f,\"pressurePa\":%.0f,\"temperature\":%.1f,\"altitude\":%.1f,\"phase\":\"sensor\",\"source\":\"bmp390\",\"addr\":\"0x%02x\",\"seq\":%lu,\"n\":%u,\"timestamp\":%lu}",
  pressurePa / 1000.0,
  pressurePa,
  temperatureC,
  altitudeM,
  bmpI2cAddress,
  static_cast<unsigned long>(nextSequence),
  accumulator.count,
  static_cast<unsigned long>(now)
);
```

Reject `length <= 0`, `length > MAX_NOTIFY_PAYLOAD`, or `length >= sizeof(payload)`. Notify only when connected and at least one valid sample exists. Reset the accumulator at every one-second deadline so a later connection never receives stale multi-second averages.

- [ ] **Step 5: Remove blocking reconnect and seed code**

In `onDisconnect`, record a pending advertising restart. In `loop`, restart advertising after 300 ms using elapsed-time comparison instead of `delay(300)`. Remove `USE_REAL_BMP390`, seed phase/pressure functions, `PressurePayload`, dynamic `String`, and all battery seed fields.

- [ ] **Step 6: Run firmware static checks**

Run:

```bash
rg -n "SENSOR_INTERVAL_MS = 200|NOTIFY_INTERVAL_MS = 1000|SENSOR_RETRY_INTERVAL_MS = 5000|MAX_NOTIFY_PAYLOAD|snprintf|Wire.setTimeOut" /Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino
rg -n "delay\(|String |USE_REAL_BMP390|seedPressure|seedPhase" /Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino
```

Expected: the first command finds every required mechanism; the second command exits with no matches.

Run a brace/directive balance check with `awk`, and run a worst-case payload length check with Node. Expected: brace balance 0, preprocessor balance 0, and payload length at most 182 bytes.

- [ ] **Step 7: Compile with the installed Arduino toolchain**

Run: `command -v arduino-cli || command -v arduino-builder`

If `arduino-cli` exists, compile for the installed XIAO ESP32S3 board FQBN with the local Adafruit BMP3XX library. If neither command exists, record the missing CLI as an explicit limitation and compile in the user's Arduino IDE before flashing; do not claim firmware compilation from static checks alone.

---

### Task 4: Verify the complete App and physical BLE flow

**Files:**
- Verify: `src/lib/bluetooth.ts`
- Verify: `src/components/device/BleSampleDetails.tsx`
- Verify: `src/app/device/page.tsx`
- Verify: `/Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: evidence that App checks pass and a clearly separated physical-device validation status.

- [ ] **Step 1: Run App static and focused checks**

Run:

```bash
npm run lint
npx vitest run src/lib/bluetooth.test.ts src/app/device/page.test.tsx src/app/flight/page.test.tsx --reporter=verbose
npm run build
git diff --check
```

Expected: every command exits 0. If Vitest hits the previously observed worker-start timeout, capture the exact failure and continue with TypeScript/build validation without reporting tests as passed.

- [ ] **Step 2: Start the App on the requested local URL**

Run: `PORT=5174 npm run dev`

Target flow: `http://127.0.0.1:5174/device` -> click `连接 AeroBalance` -> select `AeroBalance-XIAO` -> complete telemetry cards and exact raw JSON update once per second.

- [ ] **Step 3: Validate the rendered page with the in-app Browser**

Use the Browser plugin skill and persistent Browser tab. Verify page URL/title, non-blank DOM, no framework overlay, no relevant console errors, mobile-width rendering, and the enabled connection button. Capture a screenshot before physical connection.

- [ ] **Step 4: Perform user-assisted physical BLE validation**

After the user clicks the chooser and selects the device, observe at least five consecutive updates. Confirm that sequence increments by one, timestamp increments by about 1,000 ms, `n` is between 1 and 5, raw JSON remains complete, and the serial monitor prints no more than one `BLE notify` line per second.

- [ ] **Step 5: Report exact completion status**

Report separately:

- automated App checks;
- firmware static checks and whether real Arduino compilation occurred;
- browser rendering checks;
- physical BLE checks and any untested item.

Do not claim physical sensor success unless the user-assisted connection produced five consecutive complete packets.

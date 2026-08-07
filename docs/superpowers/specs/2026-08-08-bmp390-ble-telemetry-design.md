# BMP390 BLE Telemetry Design

## Goal

Provide stable, continuous BMP390 telemetry from a Seeed Studio XIAO ESP32S3 to the AeroBalance mobile web app. The firmware must avoid blocking and excessive BLE traffic, while the app must preserve and display the actual payload received from the device.

## Scope

- Update `/Users/zhengyongxiong/Documents/Arduino/air_esp32/air_esp32.ino` for real BMP390 operation only.
- Update the AeroBalance BLE parser, sample type, tests, and device telemetry panel.
- Preserve the existing FFE0 service and FFE1 characteristic UUIDs and the `AeroBalance-XIAO` device name.
- Do not add flight-phase inference, battery measurement, cloud synchronization, or a new binary protocol.

## Firmware Design

The firmware uses two independent `millis()` schedules:

- Sensor sampling: every 200 ms (5 Hz).
- BLE notification: every 1,000 ms (1 Hz), only while a client is connected.

Each valid sensor read contributes to an accumulator. At the BLE deadline, the firmware averages all valid pressure and temperature readings collected during that window, calculates altitude from the averaged pressure and the configured sea-level pressure, emits at most one notification, and resets the accumulator. No notification is emitted when the window contains no valid sample.

The main loop must not contain long blocking delays. I2C uses a finite timeout. Three consecutive read failures mark the sensor unavailable. An unavailable sensor is reinitialized every five seconds, trying addresses `0x77` and `0x76`; BLE advertising and connection handling continue during recovery.

The payload is formatted into a fixed-size character buffer with `snprintf` to avoid repeated heap allocation. Before notifying, the firmware verifies that formatting succeeded and that the payload fits the buffer. The negotiated BLE MTU remains 185 bytes, so the valid telemetry JSON must remain within the 182-byte notification payload budget.

## BLE Payload

The JSON notification contains:

```json
{
  "pressure": 100.43,
  "pressurePa": 100430,
  "temperature": 41.2,
  "altitude": 75.1,
  "phase": "sensor",
  "source": "bmp390",
  "addr": "0x76",
  "seq": 42,
  "n": 5,
  "timestamp": 123456
}
```

`pressure` is retained in kPa for backward compatibility. `pressurePa` exposes the averaged sensor pressure in pascals. `altitude` is an estimate based on `1013.25 hPa`, not an independently measured altitude. `timestamp` is device uptime in milliseconds and naturally wraps after about 49.7 days. `seq` increments once per emitted notification. The compact wire keys `addr`, `seq`, and `n` mean I2C address, notification sequence, and aggregation sample count; they keep the worst-case formatted JSON within the notification budget. The app maps them to full user-facing labels.

If the complete payload cannot fit the notification budget, the firmware logs the error and skips that notification instead of sending truncated JSON.

## App Design

The BLE parser validates and retains all telemetry fields plus the exact decoded JSON string. The transport value `phase: "sensor"` is accepted and normalized to the existing domain phase `demo`, because the pressure sensor cannot determine a real flight phase. The original `sensor` value remains visible in the raw payload and device metadata.

`PressureSample` gains optional BLE telemetry fields for pressure in pascals, altitude, device phase, sensor source, I2C address, sequence, sample count, and raw payload. Existing mock data and stored sessions remain compatible because all new fields are optional.

The device page displays the latest complete sample:

- pressure in kPa and Pa;
- temperature;
- estimated altitude;
- device phase and sensor source;
- I2C address;
- sequence and aggregation sample count;
- device uptime timestamp;
- exact raw JSON received from BLE.

The flight page may continue to consume the normalized pressure, temperature, timestamp, and `demo` phase without understanding sensor metadata.

## Error Handling

- Invalid JSON, missing required fields, out-of-range sensor values, or inconsistent field types are rejected as `INVALID_BLE_PAYLOAD`.
- A rejected packet does not replace the last valid sample.
- Browser disconnect behavior remains explicit: the UI reports disconnection and the firmware restarts advertising. Automatic browser reconnection is outside this change because Web Bluetooth reconnect behavior varies by browser and can hide permission failures.
- Sensor recovery does not restart the ESP32 or BLE stack.

## Validation

1. Add parser tests that initially fail for a complete BMP390 payload and for `phase: "sensor"`.
2. Add component/page tests that initially fail unless all telemetry fields and the exact raw payload are rendered.
3. Implement the smallest app changes that pass those tests.
4. Run TypeScript checking, focused tests, and the production build.
5. Perform static firmware checks for balanced braces/directives, payload-size bounds, non-blocking scheduling, and lack of dynamic JSON `String` construction.
6. Compile the sketch with the available Arduino toolchain. If no CLI toolchain is installed, report that limitation and rely on the user's Arduino IDE compilation before flashing.
7. Open the device page in the in-app Chromium browser, connect the physical XIAO ESP32S3 with the user, and verify that values update once per second and the raw JSON contains every transmitted field.

## Done When

- The BMP390 is sampled five times per second without blocking the main loop.
- BLE sends no more than one complete telemetry notification per second.
- Sensor read failures recover without rebooting or stopping BLE advertising.
- The App accepts `phase: "sensor"` and preserves the exact device payload.
- The mobile device page visibly updates all BMP390 telemetry fields and raw JSON.
- Automated app checks pass, and the remaining physical-device validation status is reported accurately.

"use client";

import type { Locale, PressureSample } from "@/types/domain";

interface BleSampleDetailsProps {
  sample: PressureSample;
  locale: Locale;
}

const copy = {
  "zh-CN": {
    title: "BLE 原始数据",
    subtitle: "最近一条设备通知样本，按固件数据包字段展示。",
    pressure: "气压",
    pressurePa: "原始气压",
    temperature: "温度",
    altitude: "估算海拔",
    battery: "电量",
    phase: "设备阶段",
    timestamp: "设备运行时间",
    source: "传感器来源",
    i2cAddress: "I²C 地址",
    sequence: "通知序号",
    sampleCount: "聚合采样",
    leftValve: "左阀状态",
    rightValve: "右阀状态",
    firmwareFault: "固件故障码",
    receivedAt: "App 接收时间",
    open: "开启",
    closed: "关闭",
    payload: "设备原始 JSON",
  },
  en: {
    title: "Raw BLE Data",
    subtitle: "Latest device notify sample, shown by firmware payload field.",
    pressure: "Pressure",
    pressurePa: "Raw pressure",
    temperature: "Temperature",
    altitude: "Estimated altitude",
    battery: "Battery",
    phase: "Device phase",
    timestamp: "Device uptime",
    source: "Sensor source",
    i2cAddress: "I²C address",
    sequence: "Notify sequence",
    sampleCount: "Aggregated samples",
    leftValve: "Left valve",
    rightValve: "Right valve",
    firmwareFault: "Firmware fault code",
    receivedAt: "Received by app",
    open: "Open",
    closed: "Closed",
    payload: "Raw device JSON",
  },
} as const;

export function BleSampleDetails({ sample, locale }: BleSampleDetailsProps) {
  const labels = copy[locale];

  return (
    <section className="card" role="region" aria-label={labels.title}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="value-label">{labels.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {labels.subtitle}
          </p>
        </div>
        <span className="self-start rounded-full border border-cyan-300/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
          BLE
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <BleField
          label={labels.pressure}
          value={`${sample.pressure.toFixed(2)} kPa`}
        />
        {sample.pressurePa !== undefined && (
          <BleField
            label={labels.pressurePa}
            value={`${sample.pressurePa.toFixed(0)} Pa`}
          />
        )}
        <BleField
          label={labels.temperature}
          value={
            sample.temperature === undefined
              ? "--"
              : `${sample.temperature.toFixed(1)} °C`
          }
        />
        {sample.altitude !== undefined && (
          <BleField
            label={labels.altitude}
            value={`${sample.altitude.toFixed(1)} m`}
          />
        )}
        {sample.battery !== undefined && (
          <BleField
            label={labels.battery}
            value={`${sample.battery.toFixed(0)}%`}
          />
        )}
        <BleField
          label={labels.phase}
          value={sample.devicePhase ?? sample.phase}
        />
        <BleField
          label={labels.source}
          value={
            sample.sensorSource ??
            (sample.source === "bluetooth" ? "BLE" : "Demo")
          }
        />
        {sample.i2cAddress !== undefined && (
          <BleField label={labels.i2cAddress} value={sample.i2cAddress} />
        )}
        {sample.sequence !== undefined && (
          <BleField label={labels.sequence} value={`#${sample.sequence}`} />
        )}
        {sample.sampleCount !== undefined && (
          <BleField
            label={labels.sampleCount}
            value={
              locale === "zh-CN"
                ? `${sample.sampleCount} 次`
                : `${sample.sampleCount} samples`
            }
          />
        )}
        {sample.valveLeftOpen !== undefined && (
          <BleField
            label={labels.leftValve}
            value={sample.valveLeftOpen ? labels.open : labels.closed}
          />
        )}
        {sample.valveRightOpen !== undefined && (
          <BleField
            label={labels.rightValve}
            value={sample.valveRightOpen ? labels.open : labels.closed}
          />
        )}
        {sample.firmwareFaultCode !== undefined && (
          <BleField
            label={labels.firmwareFault}
            value={`${sample.firmwareFaultCode}`}
          />
        )}
        <BleField
          label={labels.timestamp}
          value={`${sample.deviceTimestamp ?? sample.timestamp} ms`}
        />
        <BleField
          label={labels.receivedAt}
          value={
            sample.timestamp >= 1_000_000_000_000
              ? new Date(sample.timestamp).toLocaleTimeString(locale)
              : "--"
          }
        />
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {labels.payload}
        </p>
        <code className="mt-1 block break-all text-[11px] leading-relaxed text-slate-300">
          {sample.rawPayload ??
            JSON.stringify({
              pressure: sample.pressure,
              temperature: sample.temperature,
              battery: sample.battery,
              phase: sample.phase,
              timestamp: sample.timestamp,
            })}
        </code>
      </div>
    </section>
  );
}

function BleField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

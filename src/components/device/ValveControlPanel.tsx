"use client";

import type { Locale } from "@/types/domain";
import type { ValveAck, ValveId } from "@/lib/valve-protocol";

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

const copy = {
  "zh-CN": {
    title: "双阀手动控制",
    subtitle: "每次只允许一个阀门开启 250 ms；固件负责超时关闭和互锁。",
    left: "左阀",
    right: "右阀",
    open: "开启",
    closed: "关闭",
    pulse: "脉冲 250 ms",
    stop: "全部关闭",
    waiting: "等待固件确认",
    noAck: "尚无控制命令",
    result: {
      ok: "命令已确认",
      invalid: "命令无效",
      busy: "另一阀门正在工作",
      "sensor-fault": "传感器故障，阀门已锁定",
    },
  },
  en: {
    title: "Manual Dual-Valve Control",
    subtitle:
      "Only one valve may open for 250 ms. Firmware enforces timeout and interlock.",
    left: "Left valve",
    right: "Right valve",
    open: "Open",
    closed: "Closed",
    pulse: "pulse 250 ms",
    stop: "Close both valves",
    waiting: "Waiting for firmware acknowledgement",
    noAck: "No control command yet",
    result: {
      ok: "Command acknowledged",
      invalid: "Invalid command",
      busy: "The other valve is active",
      "sensor-fault": "Sensor fault; valves are locked",
    },
  },
} as const;

export function ValveControlPanel({
  locale,
  connected,
  pending,
  leftOpen,
  rightOpen,
  lastAck,
  onPulse,
  onStop,
}: ValveControlPanelProps) {
  const labels = copy[locale];
  const result = pending
    ? labels.waiting
    : lastAck
      ? labels.result[lastAck.result]
      : labels.noAck;

  return (
    <section className="card valve-control" aria-labelledby="valve-control-title">
      <div className="valve-control__header">
        <div>
          <p id="valve-control-title" className="value-label">
            {labels.title}
          </p>
          <p>{labels.subtitle}</p>
        </div>
        <span className="valve-control__result" aria-live="polite">
          {result}
        </span>
      </div>

      <div className="valve-control__grid">
        <ValveCard
          name={labels.left}
          open={leftOpen}
          openLabel={labels.open}
          closedLabel={labels.closed}
          actionLabel={`${labels.left}${locale === "zh-CN" ? "" : " "}${labels.pulse}`}
          disabled={!connected || pending}
          onClick={() => void onPulse("left", 250)}
        />
        <ValveCard
          name={labels.right}
          open={rightOpen}
          openLabel={labels.open}
          closedLabel={labels.closed}
          actionLabel={`${labels.right}${locale === "zh-CN" ? "" : " "}${labels.pulse}`}
          disabled={!connected || pending}
          onClick={() => void onPulse("right", 250)}
        />
      </div>

      <button
        type="button"
        className="valve-control__stop"
        disabled={!connected}
        onClick={() => void onStop()}
      >
        {labels.stop}
      </button>
    </section>
  );
}

function ValveCard({
  name,
  open,
  openLabel,
  closedLabel,
  actionLabel,
  disabled,
  onClick,
}: {
  name: string;
  open: boolean;
  openLabel: string;
  closedLabel: string;
  actionLabel: string;
  disabled: boolean;
  onClick(): void;
}) {
  return (
    <div className={`valve-card${open ? " is-open" : ""}`}>
      <div className="valve-card__status">
        <strong>{name}</strong>
        <span>{open ? openLabel : closedLabel}</span>
      </div>
      <button type="button" disabled={disabled} onClick={onClick}>
        {actionLabel}
      </button>
    </div>
  );
}

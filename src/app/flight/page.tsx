"use client";

import { useEffect, useState } from "react";
import {
  AirplaneTakeoff,
  AirplaneInFlight,
  AirplaneLanding,
  AirplaneTilt,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { translate } from "@/i18n/messages";
import { PressureSphere } from "@/components/home/PressureSphere";
import { ActionButton } from "@/components/ui/ActionButton";
import { seedProfiles, createFlightSeed } from "@/lib/seed";
import type { FlightPhase } from "@/types/domain";

const phaseMeta: Record<
  FlightPhase,
  { labelKey: string; icon: typeof AirplaneTakeoff; descZh: string; descEn: string; color: string }
> = {
  takeoff: {
    labelKey: "phase.takeoff",
    icon: AirplaneTakeoff,
    descZh: "爬升阶段，环境压力快速下降，耳膜开始向外膨胀",
    descEn: "Climbing. Cabin pressure drops rapidly — eardrums expand outward.",
    color: "#f97316",
  },
  cruise: {
    labelKey: "phase.cruise",
    icon: AirplaneInFlight,
    descZh: "巡航阶段，压力维持在约 78 kPa，仅有微小波动",
    descEn: "Cruising. Pressure steady near 78 kPa with minor fluctuations.",
    color: "#38bdf8",
  },
  descent: {
    labelKey: "phase.descent",
    icon: AirplaneLanding,
    descZh: "下降阶段，压力快速回升，耳膜受压最明显的关键阶段",
    descEn: "Descending. Pressure rises quickly — the most critical phase for ear comfort.",
    color: "#ef4444",
  },
  landing: {
    labelKey: "phase.landing",
    icon: AirplaneTilt,
    descZh: "降落阶段，压力恢复至地面水平，耳膜逐步复位",
    descEn: "Landing. Pressure returning to ground level — ears gradually normalize.",
    color: "#22c55e",
  },
  demo: {
    labelKey: "phase.demo",
    icon: AirplaneInFlight,
    descZh: "演示模式",
    descEn: "Demo mode",
    color: "#64748b",
  },
};

const PHASES: Exclude<FlightPhase, "demo">[] = [
  "takeoff",
  "cruise",
  "descent",
  "landing",
];

const createPhaseSamples = (phase: Exclude<FlightPhase, "demo">) =>
  createFlightSeed("demo-flight").filter((sample) => sample.phase === phase);

export default function FlightPage() {
  const locale = useAppStore((s) => s.locale);
  const phase = useAppStore((s) => s.phase);
  const analysis = useAppStore((s) => s.analysis);
  const pressureHistory = useAppStore((s) => s.pressureHistory);
  const prediction = useAppStore((s) => s.prediction);
  const loadSeedProfile = useAppStore((s) => s.loadSeedProfile);
  const replacePressureHistory = useAppStore((s) => s.replacePressureHistory);
  const setPhase = useAppStore((s) => s.setPhase);
  const [selected, setSelected] = useState<Exclude<FlightPhase, "demo">>(phase === "demo" ? "descent" : (phase as Exclude<FlightPhase, "demo">));

  // Load on mount
  useEffect(() => {
    const state = useAppStore.getState();
    if (!state.profileInput) {
      loadSeedProfile(seedProfiles[0]);
    }
    if (state.source !== "bluetooth") {
      const initialPhase =
        state.phase === "demo"
          ? "descent"
          : (state.phase as Exclude<FlightPhase, "demo">);
      setSelected(initialPhase);
      replacePressureHistory(createPhaseSamples(initialPhase));
    }
  }, [loadSeedProfile, replacePressureHistory]);

  const latest = pressureHistory.at(-1);
  const currentPressure = latest?.pressure ?? 78;
  const comfortScore = analysis?.comfortScore ?? 70;
  const riskLevel = analysis?.riskLevel ?? "medium";
  const meta = phaseMeta[selected];
  const isRising = prediction?.trend === "rising";
  const isFalling = prediction?.trend === "falling";
  const desc = locale === "zh-CN" ? meta.descZh : meta.descEn;

  // Chart data from pressure history, filtered by phase
  const chartData = pressureHistory
    .filter((s) => s.phase === selected || s.phase === "demo")
    .slice(-60)
    .map((s) => ({
      time: new Date(s.timestamp).toLocaleTimeString(locale, {
        minute: "2-digit",
        second: "2-digit",
      }),
      pressure: Number(s.pressure.toFixed(1)),
    }));

  const handlePhaseChange = (p: Exclude<FlightPhase, "demo">) => {
    setSelected(p);
    replacePressureHistory(createPhaseSamples(p));
    setPhase(p);
  };

  return (
    <div className="page-container">
      <p className="page-subtitle">{translate(locale, "flight.title")}</p>
      <h1 className="page-title">{translate(locale, "nav.flight")}</h1>

      <div className="simulator">
        {/* Phase selector */}
        <nav className="simulator__nav">
          {PHASES.map((p) => {
            const Icon = phaseMeta[p].icon;
            const active = selected === p;
            return (
              <button
                key={p}
                onClick={() => handlePhaseChange(p)}
                className={`phase-btn flex items-center gap-1.5 ${
                  active ? "phase-btn--active" : ""
                }`}
              >
                <Icon size={16} weight={active ? "fill" : "regular"} />
                {translate(locale, phaseMeta[p].labelKey as any)}
              </button>
            );
          })}
        </nav>

        {/* Phase badge */}
        <div
          className="simulator__phase-badge"
          style={{
            background: `${meta.color}15`,
            border: `1px solid ${meta.color}30`,
            color: meta.color,
          }}
        >
          {(() => { const Icon = phaseMeta[selected].icon; return <Icon size={20} weight="fill" />; })()}
          {translate(locale, meta.labelKey as any)}
          {isRising && <CaretUp size={16} weight="bold" />}
          {isFalling && <CaretDown size={16} weight="bold" />}
        </div>

        {/* Phase description */}
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>

        {/* Pressure Sphere */}
        <PressureSphere
          pressure={currentPressure}
          comfort={comfortScore}
          risk={riskLevel}
          phase={selected}
          locale={locale}
        />

        {/* Pressure chart */}
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            压力趋势
          </p>
          <div className="simulator__chart">
            <ResponsiveContainer
              width="100%"
              height={180}
              minWidth={0}
              initialDimension={{ width: 320, height: 180 }}
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(38,125,178,0.22)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#123b5d",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: "#38bdf8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="value-label">压力</p>
            <p className="value-medium text-sky-300">
              {currentPressure.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-600">kPa</p>
          </div>
          <div className="card text-center">
            <p className="value-label">舒适度</p>
            <p
              className={`value-medium ${
                comfortScore >= 70
                  ? "text-green-400"
                  : comfortScore >= 40
                    ? "text-orange-400"
                    : "text-red-400"
              }`}
            >
              {comfortScore}
            </p>
            <p className="text-[10px] text-slate-600">/100</p>
          </div>
          <div className="card text-center">
            <p className="value-label">风险</p>
            <span className={`risk-badge risk-badge--${riskLevel} mt-1`}>
              {translate(locale, `risk.${riskLevel}` as any)}
            </span>
          </div>
        </div>

        <div className="page-action">
          <ActionButton href="/prediction">
            {translate(locale, "action.continue")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

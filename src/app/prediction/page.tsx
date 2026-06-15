"use client";

import Link from "next/link";
import {
  ArrowLeft,
  TrendUp,
  TrendDown,
  Minus,
  Brain,
  ChartLineUp,
  ShieldCheck,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { translate } from "@/i18n/messages";
import { ActionButton } from "@/components/ui/ActionButton";
import type { PredictionPoint } from "@/types/domain";

const trendLabel = (trend: string, locale: string) => {
  if (trend === "rising") {
    return locale === "zh-CN" ? "压力上升" : "Pressure rising";
  }
  if (trend === "falling") {
    return locale === "zh-CN" ? "压力下降" : "Pressure falling";
  }
  return locale === "zh-CN" ? "压力稳定" : "Pressure stable";
};

const confidenceLabel = (confidence: number, locale: string) => {
  if (confidence >= 80) {
    return locale === "zh-CN" ? "高置信" : "High confidence";
  }
  if (confidence >= 60) {
    return locale === "zh-CN" ? "中置信" : "Medium confidence";
  }
  return locale === "zh-CN" ? "低置信" : "Low confidence";
};

const pointAtSeconds = (points: PredictionPoint[], seconds: number) => {
  const targetMinute = seconds / 60;
  const timeline = points
    .filter(
      (point) => point.kind === "forecast" || point.minuteOffset === 0,
    )
    .sort((a, b) => a.minuteOffset - b.minuteOffset);
  const exact = timeline.find((point) => point.minuteOffset === targetMinute);
  if (exact) return exact.pressure;

  const before = [...timeline]
    .reverse()
    .find((point) => point.minuteOffset < targetMinute);
  const after = timeline.find((point) => point.minuteOffset > targetMinute);
  if (!before) return after?.pressure ?? 0;
  if (!after) return before.pressure;

  const span = after.minuteOffset - before.minuteOffset || 1;
  const ratio = (targetMinute - before.minuteOffset) / span;
  return before.pressure + (after.pressure - before.pressure) * ratio;
};

const PredictionCard = ({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: number;
  delta: number;
  tone: "sky" | "purple" | "cyan";
}) => {
  const toneClass = {
    sky: "text-sky-300",
    purple: "text-purple-300",
    cyan: "text-cyan-300",
  }[tone];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <p className="value-label">{label}</p>
      <p className={`value-medium ${toneClass}`}>{value.toFixed(1)}</p>
      <p className="text-[10px] text-slate-500">
        kPa · {delta >= 0 ? "+" : ""}
        {delta.toFixed(1)}
      </p>
    </div>
  );
};

export default function PredictionPage() {
  const locale = useAppStore((s) => s.locale);
  const prediction = useAppStore((s) => s.prediction);
  const pressureHistory = useAppStore((s) => s.pressureHistory);
  const analysis = useAppStore((s) => s.analysis);

  if (!prediction) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
          <ChartLineUp size={48} weight="thin" />
          <p className="text-sm">
            {locale === "zh-CN" ? "暂无预测数据，请先启动飞行模拟" : "No prediction data. Start the flight simulator first."}
          </p>
          <Link href="/flight" className="text-xs text-sky-400 underline">
            {locale === "zh-CN" ? "前往飞行模拟器" : "Open Flight Simulator"}
          </Link>
        </div>
      </div>
    );
  }

  const latest = pressureHistory.at(-1);
  const currentPressure = latest?.pressure ?? 78;
  const stressIndex = prediction.stressIndex;
  const trend = prediction.trend;
  const p30 = pointAtSeconds(prediction.points, 30);
  const p60 = pointAtSeconds(prediction.points, 60);
  const p90 = pointAtSeconds(prediction.points, 90);

  const chartData = prediction.points
    .slice(-24)
    .map((p) => ({
      time: p.kind === "history"
        ? locale === "zh-CN"
          ? `${Math.round(p.minuteOffset)} 分钟`
          : `${Math.round(p.minuteOffset)}m`
        : locale === "zh-CN"
          ? `+${p.minuteOffset} 分钟`
          : `+${p.minuteOffset}m`,
      pressure: Number(p.pressure.toFixed(1)),
      kind: p.kind,
    }));

  const trendIcon =
    trend === "rising" ? (
      <TrendUp size={20} weight="fill" className="text-red-400" />
    ) : trend === "falling" ? (
      <TrendDown size={20} weight="fill" className="text-green-400" />
    ) : (
      <Minus size={20} weight="bold" className="text-sky-400" />
    );

  return (
    <div className="page-container">
      <Link
        href="/flight"
        className="inline-flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-300"
      >
        <ArrowLeft size={14} />
        {translate(locale, "nav.flight")}
      </Link>

      <p className="page-subtitle">{translate(locale, "prediction.title")}</p>
      <h1 className="page-title">
        {translate(locale, "prediction.heading")}
      </h1>

      <section className="card mb-4 border-sky-400/20">
        <div className="flex items-start gap-3">
          <Brain size={22} className="text-sky-400 mt-0.5" weight="duotone" />
          <div>
            <p className="value-label">
              {translate(locale, "prediction.predictiveProtection")}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {locale === "zh-CN"
                ? "系统不是等耳压不适发生后才反应，而是提前 30/60/90 秒预测压力负荷，并把它送入双耳策略。"
                : "The system forecasts pressure load 30/60/90 seconds ahead before discomfort happens, then feeds it into bilateral strategy."}
            </p>
          </div>
        </div>
      </section>

      <div className="card card-highlight text-center mb-4">
        <p className="value-label">
          {translate(locale, "prediction.currentPressure")}
        </p>
        <p className="value-large text-sky-300">
          {currentPressure.toFixed(1)}
          <span className="text-base font-normal text-slate-500 ml-1">kPa</span>
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {trendIcon}
          <span
            className={`text-xs font-semibold ${
              trend === "rising"
                ? "text-red-400"
                : trend === "falling"
                  ? "text-green-400"
                  : "text-sky-400"
            }`}
          >
            {trendLabel(trend, locale)}
          </span>
        </div>
      </div>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLineUp size={18} className="text-sky-400" />
          <div>
            <p className="value-label">
              {translate(locale, "prediction.shortForecast")}
            </p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN"
                ? "用于判断即将出现的耳膜压力负荷。"
                : "Used to estimate the near-term eardrum pressure load."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <PredictionCard label={locale === "zh-CN" ? "30 秒" : "30 sec"} value={p30} delta={p30 - currentPressure} tone="sky" />
          <PredictionCard label={locale === "zh-CN" ? "60 秒" : "60 sec"} value={p60} delta={p60 - currentPressure} tone="purple" />
          <PredictionCard label={locale === "zh-CN" ? "90 秒" : "90 sec"} value={p90} delta={p90 - currentPressure} tone="cyan" />
        </div>
      </section>

      <section className="card mb-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-sky-400" />
            <p className="value-label">
              {translate(locale, "prediction.confidence")}
            </p>
          </div>
          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] text-sky-300">
            {prediction.confidence.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              prediction.confidence >= 80
                ? "bg-green-400"
                : prediction.confidence >= 60
                  ? "bg-sky-400"
                  : "bg-orange-400"
            }`}
            style={{ width: `${Math.min(prediction.confidence, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {confidenceLabel(prediction.confidence, locale)}
        </p>
      </section>

      <div className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          {translate(locale, "prediction.curve")}
        </p>
        <div className="h-48">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 320, height: 192 }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
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
              <ReferenceLine
                y={101.325}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4 4"
                label={{
                  value: locale === "zh-CN" ? "地面" : "Ground",
                  fontSize: 10,
                  fill: "#64748b",
                }}
              />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke={prediction.points.at(-1)?.kind === "forecast" ? "#a78bfa" : "#38bdf8"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          {translate(locale, "prediction.stressIndex")}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stressIndex > 60
                  ? "bg-red-500"
                  : stressIndex > 30
                    ? "bg-orange-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(stressIndex, 100)}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold">{stressIndex.toFixed(0)}</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          {locale === "zh-CN"
            ? "压力变化率越高，后续目标曲线会越平滑，避免耳膜被动承受突变。"
            : "Higher pressure-change stress makes the target curve smoother, avoiding abrupt passive loading."}
        </p>
      </section>

      {analysis && (
        <section className="card mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-sky-400" />
            <p className="text-sm text-slate-300">
              {locale === "zh-CN"
                ? "预测结果已转化为后续策略：根据压力趋势和耳压画像决定左右耳适应等级。"
                : "Prediction output is now converted into strategy: pressure trend plus ear profile determines bilateral adaptation levels."}
            </p>
          </div>
        </section>
      )}

      <div className="page-action">
        <ActionButton href="/strategy">
          {translate(locale, "action.continue")}
        </ActionButton>
      </div>
    </div>
  );
}

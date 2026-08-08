"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ChartLineUp } from "@phosphor-icons/react/ChartLineUp";
import { Target } from "@phosphor-icons/react/Target";
import { Waveform } from "@phosphor-icons/react/Waveform";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { translate } from "@/i18n/messages";
import { ActionButton } from "@/components/ui/ActionButton";

const smoothingText = (value: number, locale: string) => {
  if (value > 0.6) {
    return locale === "zh-CN" ? "高平滑保护" : "High smoothing";
  }
  if (value > 0.3) {
    return locale === "zh-CN" ? "中等平滑" : "Balanced smoothing";
  }
  return locale === "zh-CN" ? "快速响应" : "Fast response";
};

export default function CurvePage() {
  const locale = useAppStore((s) => s.locale);
  const targetCurves = useAppStore((s) => s.targetCurves);
  const strategy = useAppStore((s) => s.strategy);
  const source = useAppStore((s) => s.source);

  if (!targetCurves || targetCurves.length === 0) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
          <Target size={48} weight="thin" />
          <p className="text-center text-sm">
            {source === "bluetooth"
              ? locale === "zh-CN"
                ? "实时气压已接入。完成个人画像后即可生成双耳目标曲线。"
                : "Live pressure is available. Complete the ear profile to generate target curves."
              : locale === "zh-CN"
                ? "暂无曲线数据，请先启动飞行模拟"
                : "No curve data. Start the flight simulator first."}
          </p>
          <Link href={source === "bluetooth" ? "/profile" : "/flight"} className="text-xs text-sky-400 underline">
            {source === "bluetooth"
              ? locale === "zh-CN" ? "选择个人画像" : "Select Ear Profile"
              : locale === "zh-CN" ? "前往飞行模拟器" : "Open Flight Simulator"}
          </Link>
        </div>
      </div>
    );
  }

  const labels = {
    env: translate(locale, "curve.environmentalPressure"),
    left:
      locale === "zh-CN"
        ? `${translate(locale, "common.leftEar")}目标`
        : "Left Target",
    right:
      locale === "zh-CN"
        ? `${translate(locale, "common.rightEar")}目标`
        : "Right Target",
  };
  const origin = targetCurves[0].timestamp;
  const chartData = targetCurves.slice(-50).map((p, index) => ({
    index,
    time:
      locale === "zh-CN"
        ? `${((p.timestamp - origin) / 1000).toFixed(0)}秒`
        : `${((p.timestamp - origin) / 1000).toFixed(0)}s`,
    env: Number(p.environmental.toFixed(1)),
    left: Number(p.leftTarget.toFixed(1)),
    right: Number(p.rightTarget.toFixed(1)),
  }));

  const smoothingLeft = strategy?.left.smoothingFactor ?? 0.5;
  const smoothingRight = strategy?.right.smoothingFactor ?? 0.5;
  const environmentalValues = targetCurves.map((point) => point.environmental);
  const environmentalRange =
    Math.max(...environmentalValues) - Math.min(...environmentalValues);
  const averageLag = (side: "leftTarget" | "rightTarget") =>
    targetCurves.reduce(
      (sum, point) => sum + Math.abs(point.environmental - point[side]),
      0,
    ) / targetCurves.length;
  const leftAverageLag = averageLag("leftTarget");
  const rightAverageLag = averageLag("rightTarget");

  return (
    <div className="page-container">
      <Link
        href="/strategy"
        className="inline-flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-300"
      >
        <ArrowLeft size={14} />
        {translate(locale, "nav.strategy")}
      </Link>

      <p className="page-subtitle">{translate(locale, "curve.title")}</p>
      <h1 className="page-title">{translate(locale, "curve.heading")}</h1>

      <section className="card mb-4 border-sky-400/20">
        <div className="flex items-start gap-3">
          <ChartLineUp size={22} className="text-sky-400 mt-0.5" weight="duotone" />
          <div>
            <p className="value-label">
              {translate(locale, "curve.patentVisualization")}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {locale === "zh-CN"
                ? "环境压力变化很快；目标压力曲线把突变平滑成左右耳各自可承受的适应路径。这是 AeroBalance 与普通耳塞最大的差异。"
                : "Environmental pressure changes quickly. The target curve smooths abrupt changes into separate left/right adaptation paths. This is AeroBalance's key difference from ordinary earplugs."}
            </p>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-sky-400" />
          <div>
            <p className="value-label">{translate(locale, "curve.engine")}</p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN"
                ? "策略输出中的左右平滑因子，分别生成两条目标压力曲线。"
                : "The smoothing factors from bilateral strategy generate separate left and right target curves."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <span>{translate(locale, "curve.environmentalPressure")}</span>
          <span>→</span>
          <span>{translate(locale, "curve.leftRightSmoothing")}</span>
          <span>→</span>
          <span>{translate(locale, "curve.targetCurve")}</span>
          <span>→</span>
          <span>{translate(locale, "curve.healthReport")}</span>
        </div>
      </section>

      <div className="curve-legend mb-3">
        <div className="curve-legend__item">
          <div className="curve-legend__dot" style={{ background: "rgba(255,255,255,0.5)" }} />
          <span>{labels.env}</span>
        </div>
        <div className="curve-legend__item">
          <div className="curve-legend__dot" style={{ background: "#38bdf8" }} />
          <span>{labels.left}</span>
        </div>
        <div className="curve-legend__item">
          <div className="curve-legend__dot" style={{ background: "#a78bfa" }} />
          <span>{labels.right}</span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="h-64">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 320, height: 256 }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
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
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />
              <Line
                type="monotone"
                dataKey="env"
                name={labels.env}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="left"
                name={labels.left}
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 3, fill: "#38bdf8" }}
              />
              <Line
                type="monotone"
                dataKey="right"
                name={labels.right}
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 3, fill: "#a78bfa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Waveform size={18} className="text-sky-400" />
          <div>
            <p className="value-label">
              {translate(locale, "curve.smoothingDifference")}
            </p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN" ? "两条目标曲线不是同一条线，而是由左右耳风险分别决定。" : "The two target curves are not identical; they are shaped by each ear's risk."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-sky-400/10 bg-slate-950/30 p-3">
            <p className="value-label">{translate(locale, "common.leftEar")}</p>
            <p className="value-medium text-sky-300">{smoothingLeft.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-1">{smoothingText(smoothingLeft, locale)}</p>
            <p className="text-[11px] text-slate-500 mt-3">
              {translate(locale, "curve.averageLag")} {leftAverageLag.toFixed(1)} kPa
            </p>
          </div>
          <div className="rounded-lg border border-purple-400/10 bg-slate-950/30 p-3">
            <p className="value-label">{translate(locale, "common.rightEar")}</p>
            <p className="value-medium text-purple-300">{smoothingRight.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-1">{smoothingText(smoothingRight, locale)}</p>
            <p className="text-[11px] text-slate-500 mt-3">
              {translate(locale, "curve.averageLag")} {rightAverageLag.toFixed(1)} kPa
            </p>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          {translate(locale, "curve.environmentalVsTarget")}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-950/30 p-2">
            <p className="value-label">
              {translate(locale, "curve.environmentalRange")}
            </p>
            <p className="text-sm font-mono text-slate-200">{environmentalRange.toFixed(1)}</p>
          </div>
          <div className="rounded-lg bg-slate-950/30 p-2">
            <p className="value-label">
              {translate(locale, "curve.leftAverageLag")}
            </p>
            <p className="text-sm font-mono text-sky-300">{leftAverageLag.toFixed(1)}</p>
          </div>
          <div className="rounded-lg bg-slate-950/30 p-2">
            <p className="value-label">
              {translate(locale, "curve.rightAverageLag")}
            </p>
            <p className="text-sm font-mono text-purple-300">{rightAverageLag.toFixed(1)}</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 mt-3">
          {locale === "zh-CN"
            ? "虚线代表外部舱压变化，实线代表系统为耳膜生成的平滑目标路径。"
            : "The dashed line is external cabin pressure; solid lines are smoothed target paths generated for the eardrum."}
        </p>
      </section>

      <div className="page-action">
        <ActionButton href="/results">
          {translate(locale, "action.continue")}
        </ActionButton>
      </div>
    </div>
  );
}

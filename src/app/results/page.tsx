"use client";

import Link from "next/link";
import { ArrowCounterClockwise } from "@phosphor-icons/react/ArrowCounterClockwise";
import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowsLeftRight } from "@phosphor-icons/react/ArrowsLeftRight";
import { ChartLineUp } from "@phosphor-icons/react/ChartLineUp";
import { Download } from "@phosphor-icons/react/Download";
import { Ear } from "@phosphor-icons/react/Ear";
import { Gauge } from "@phosphor-icons/react/Gauge";
import { HeartStraight } from "@phosphor-icons/react/HeartStraight";
import { Lightbulb } from "@phosphor-icons/react/Lightbulb";
import { Printer } from "@phosphor-icons/react/Printer";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { useAppStore } from "@/store/useAppStore";
import { translate, translateRecommendation } from "@/i18n/messages";
import { buildReport, savePrintReport } from "@/lib/report";
import type { RecommendationKey } from "@/types/domain";

const riskText = (level: string, locale: string) => {
  const map: Record<string, string> = {
    low: locale === "zh-CN" ? "低风险" : "Low risk",
    medium: locale === "zh-CN" ? "中风险" : "Medium risk",
    high: locale === "zh-CN" ? "高风险" : "High risk",
  };
  return map[level] ?? level;
};

const metricLabel = (locale: string) => ({
  comfort: locale === "zh-CN" ? "舒适度" : "Comfort",
  risk: locale === "zh-CN" ? "风险等级" : "Risk level",
  efficiency: locale === "zh-CN" ? "保护效率" : "Protection efficiency",
  stability: locale === "zh-CN" ? "压力稳定" : "Pressure stability",
  events: locale === "zh-CN" ? "风险事件" : "Risk events",
  success: locale === "zh-CN" ? "适应成功率" : "Adaptation success",
});

const riskEvents = (samples: { pressure: number; phase: string }[]) => {
  let count = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const delta = Math.abs(samples[index].pressure - samples[index - 1].pressure);
    if (samples[index].phase === "descent" && delta > 0.08) count += 1;
  }
  return count;
};

const pressureStability = (samples: { pressure: number }[]) => {
  if (samples.length < 2) return 100;
  const mean = samples.reduce((sum, sample) => sum + sample.pressure, 0) / samples.length;
  const variance =
    samples.reduce((sum, sample) => sum + Math.pow(sample.pressure - mean, 2), 0) /
    samples.length;
  const standardDeviation = Math.sqrt(variance);
  return Math.max(0, Math.min(100, Math.round(100 - standardDeviation * 8)));
};

export default function ResultsPage() {
  const locale = useAppStore((s) => s.locale);
  const analysis = useAppStore((s) => s.analysis);
  const strategy = useAppStore((s) => s.strategy);
  const profileResult = useAppStore((s) => s.profileResult);
  const pressureHistory = useAppStore((s) => s.pressureHistory);
  const phase = useAppStore((s) => s.phase);
  const source = useAppStore((s) => s.source);
  const resetSession = useAppStore((s) => s.resetSession);

  if (!analysis) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
          <HeartStraight size={48} weight="thin" />
          <p className="text-center text-sm">
            {source === "bluetooth"
              ? locale === "zh-CN"
                ? "实时传感器数据已接入。完成个人画像后才会生成正式分析结果。"
                : "Live sensor data is available. Complete the ear profile to generate formal analysis results."
              : locale === "zh-CN"
                ? "暂无结果数据，请先启动飞行模拟"
                : "No result data. Start the flight simulator first."}
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

  const labels = metricLabel(locale);
  const events = riskEvents(pressureHistory);
  const stability = pressureStability(pressureHistory);
  const smoothing = strategy
    ? Math.round(((strategy.left.smoothingFactor + strategy.right.smoothingFactor) / 2) * 100)
    : 0;
  const protectionEfficiency = Math.min(
    99,
    Math.round(analysis.comfortScore * 0.65 + stability * 0.25 + smoothing * 0.1),
  );
  const successRate = Math.min(
    99,
    Math.round(
      analysis.comfortScore * 0.5 +
        stability * 0.3 +
        (strategy?.independent ? 15 : 5),
    ),
  );

  const exportJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      reportType: "Flight Health Report",
      analysis: {
        comfortScore: analysis.comfortScore,
        riskLevel: analysis.riskLevel,
        protectionEfficiency,
        pressureStability: stability,
        riskEvents: events,
        adaptationSuccessRate: successRate,
        leftBurden: analysis.leftBurden,
        rightBurden: analysis.rightBurden,
        recommendations: analysis.recommendationKeys,
      },
      strategy: strategy
        ? {
            independent: strategy.independent,
            left: {
              level: strategy.left.level,
              smoothingFactor: strategy.left.smoothingFactor,
              recommendationKey: strategy.left.recommendationKey,
            },
            right: {
              level: strategy.right.level,
              smoothingFactor: strategy.right.smoothingFactor,
              recommendationKey: strategy.right.recommendationKey,
            },
          }
        : null,
      profile: profileResult
        ? {
            leftRisk: profileResult.leftRisk,
            rightRisk: profileResult.rightRisk,
            toleranceScore: profileResult.toleranceScore,
            adaptationSpeed: profileResult.adaptationSpeed,
          }
        : null,
      sampleCount: pressureHistory.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aerobalance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!profileResult || !strategy || pressureHistory.length === 0) return;

    savePrintReport(
      buildReport({
        locale,
        generatedAt: Date.now(),
        profile: profileResult,
        strategy,
        analysis,
        samples: pressureHistory,
      }),
    );
    window.open("/report/print", "_blank", "noopener,noreferrer");
  };

  const riskColor =
    analysis.riskLevel === "high"
      ? "text-red-400"
      : analysis.riskLevel === "medium"
        ? "text-orange-400"
        : "text-green-400";

  const riskBg =
    analysis.riskLevel === "high"
      ? "bg-red-500/10 border-red-500/20"
      : analysis.riskLevel === "medium"
        ? "bg-orange-500/10 border-orange-500/20"
        : "bg-green-500/10 border-green-500/20";

  return (
    <div className="page-container">
      <Link
        href="/curve"
        className="inline-flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-300"
      >
        <ArrowLeft size={14} />
        {translate(locale, "nav.curve")}
      </Link>

      <p className="page-subtitle">
        {translate(locale, "results.reportSubtitle")}
      </p>
      <h1 className="page-title">
        {translate(locale, "results.reportTitle")}
      </h1>

      <section className="card mb-4 border-sky-400/20">
        <div className="flex items-start gap-3">
          <ChartLineUp size={22} className="text-sky-400 mt-0.5" weight="duotone" />
          <div>
            <p className="value-label">
              {translate(locale, "results.finalOutput")}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {locale === "zh-CN"
                ? "这份报告是个人耳压画像、压力预测、双耳策略和目标曲线共同生成的最终结果。"
                : "This report is the final output of personal ear profiling, pressure prediction, bilateral strategy, and target-curve generation."}
            </p>
          </div>
        </div>
      </section>

      <div className="results-header">
        <h1 className={riskColor}>{analysis.comfortScore}</h1>
        <p>{labels.comfort} / 100</p>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 border ${riskBg} ${riskColor}`}
        >
          <ShieldCheck size={14} weight="fill" />
          {riskText(analysis.riskLevel, locale)}
        </div>
      </div>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLineUp size={18} className="text-sky-400" />
          <div>
            <p className="value-label">
              {translate(locale, "results.reportMetrics")}
            </p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN" ? "用于判断本次飞行阶段保护效果。" : "Used to evaluate protection effectiveness for this flight phase."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ReportMetric label={labels.efficiency} value={`${protectionEfficiency}%`} tone="sky" />
          <ReportMetric label={labels.stability} value={`${stability}%`} tone="green" />
          <ReportMetric label={labels.events} value={String(events)} tone="orange" />
          <ReportMetric label={labels.success} value={`${successRate}%`} tone="purple" />
        </div>
      </section>

      <div className="results-grid mb-4">
        <div className="result-stat">
          <span className="result-stat__label flex items-center gap-1.5">
            <Ear size={16} className="text-sky-400" />
            {translate(locale, "results.leftBurden")}
          </span>
          <span className="result-stat__value text-sky-300">
            {analysis.leftBurden.toFixed(1)}
          </span>
        </div>
        <div className="result-stat">
          <span className="result-stat__label flex items-center gap-1.5">
            <Ear size={16} className="text-purple-400" />
            {translate(locale, "results.rightBurden")}
          </span>
          <span className="result-stat__value text-purple-300">
            {analysis.rightBurden.toFixed(1)}
          </span>
        </div>
        <div className="result-stat">
          <span className="result-stat__label flex items-center gap-1.5">
            <ArrowsLeftRight size={16} className="text-sky-400" />
            {translate(locale, "results.independent")}
          </span>
          <span className="result-stat__value">
            {strategy?.independent
              ? translate(locale, "common.enabled")
              : translate(locale, "common.disabled")}
          </span>
        </div>
        <div className="result-stat">
          <span className="result-stat__label flex items-center gap-1.5">
            <Gauge size={16} className="text-cyan-400" />
            {translate(locale, "metric.phase")}
          </span>
          <span className="result-stat__value">
            {translate(locale, `phase.${phase}` as any)}
          </span>
        </div>
      </div>

      <div className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Lightbulb size={14} className="text-yellow-400" weight="fill" />
          {translate(locale, "strategy.protectionAdvice")}
        </p>
        <div className="flex flex-col gap-2">
          {analysis.recommendationKeys.map((key: RecommendationKey) => (
            <div
              key={key}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/40"
            >
              <ShieldCheck
                size={16}
                className="text-sky-400 mt-0.5 shrink-0"
                weight="duotone"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                {translateRecommendation(locale, key)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          {translate(locale, "results.patentStory")}
        </p>
        <ol className="space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="text-sky-300">1.</span>
            {locale === "zh-CN" ? "个人耳压画像解释左右耳为什么不同。" : "Personal ear profile explains why the ears differ."}
          </li>
          <li className="flex gap-2">
            <span className="text-sky-300">2.</span>
            {locale === "zh-CN" ? "压力预测提前判断未来 30/60/90 秒负荷。" : "Pressure prediction estimates the next 30/60/90 seconds."}
          </li>
          <li className="flex gap-2">
            <span className="text-sky-300">3.</span>
            {locale === "zh-CN" ? "双耳策略生成不同适应等级和平滑因子。" : "Bilateral strategy creates different levels and smoothing factors."}
          </li>
          <li className="flex gap-2">
            <span className="text-sky-300">4.</span>
            {locale === "zh-CN" ? "目标曲线把快速环境变化转化为舒适适应路径。" : "Target curves turn rapid environmental changes into comfortable adaptation paths."}
          </li>
        </ol>
      </section>

      <div className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          {translate(locale, "results.exportReport")}
        </p>
        <div className="results-export">
          <button
            onClick={handlePrint}
            className="action-button flex-1"
          >
            <Printer size={20} weight="fill" />
            <span>{translate(locale, "action.exportPdf")}</span>
          </button>
          <button
            onClick={exportJson}
            className="action-button action-button--secondary flex-1"
          >
            <Download size={20} />
            <span>
              {locale === "zh-CN" ? "导出 JSON" : "Export JSON"}
            </span>
          </button>
          <Link
            href="/"
            onClick={resetSession}
            className="action-button action-button--secondary flex-1"
          >
            <ArrowCounterClockwise size={20} />
            <span>{translate(locale, "action.restart")}</span>
          </Link>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-3">
          {locale === "zh-CN"
            ? "数据仅存储在本地，不会上传至任何服务器"
            : "Data is stored locally and never uploaded"}
        </p>
      </div>
    </div>
  );
}

const ReportMetric = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sky" | "green" | "orange" | "purple";
}) => {
  const toneClass = {
    sky: "text-sky-300",
    green: "text-green-300",
    orange: "text-orange-300",
    purple: "text-purple-300",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3">
      <p className="value-label">{label}</p>
      <p className={`value-medium ${toneClass}`}>{value}</p>
    </div>
  );
};

"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  Ear,
  ShieldWarning,
  Waveform,
  Target,
  ArrowsLeftRight,
  CheckCircle,
  Brain,
  ChartLineUp,
} from "@phosphor-icons/react";
import { useAppStore } from "@/store/useAppStore";
import { translate, translateRecommendation } from "@/i18n/messages";
import { ActionButton } from "@/components/ui/ActionButton";
import type { EarStrategy, Locale, RecommendationKey } from "@/types/domain";

const levelLabel = (level: number, locale: string) => {
  const labels: Record<string, string[]> = {
    "zh-CN": ["被动", "轻度", "主动", "增强", "高增强"],
    en: ["Passive", "Mild", "Active", "Boosted", "High Boost"],
  };
  return (labels[locale] ?? labels["en"])[level - 1] ?? "Unknown";
};

const recIcons: Record<string, typeof CheckCircle> = {
  "recommendation.independent": ArrowsLeftRight,
  "recommendation.watchRate": Waveform,
  "recommendation.highSmoothing": Target,
  "recommendation.steady": CheckCircle,
  "recommendation.monitor": ShieldWarning,
  "recommendation.gradualDescent": Waveform,
};

const PipelineCard = ({
  side,
  strategy,
  locale,
}: {
  side: "left" | "right";
  strategy: EarStrategy;
  locale: Locale;
}) => {
  const isLeft = side === "left";
  const tone = isLeft ? "sky" : "purple";
  const border = isLeft ? "border-sky-400/20" : "border-purple-400/20";
  const text = isLeft ? "text-sky-300" : "text-purple-300";

  return (
    <div className={`rounded-xl border ${border} bg-slate-950/25 p-3`}>
      <div className="flex items-center justify-between mb-3">
        <p className="flex items-center gap-1 text-xs font-semibold">
          <Ear size={16} className={text} />
          {translate(
            locale,
            isLeft ? "strategy.leftEarProfile" : "strategy.rightEarProfile",
          )}
        </p>
        <span className={`rounded-full px-2 py-1 text-[10px] ${isLeft ? "bg-sky-400/10 text-sky-300" : "bg-purple-400/10 text-purple-300"}`}>
          {translate(locale, "strategy.risk")} {strategy.riskScore.toFixed(0)}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <PipelineStep label={`1. ${translate(locale, "strategy.earProfile")}`} value={translate(locale, "strategy.riskSensitivity")} tone={tone} />
        <div className="flex justify-center text-slate-600"><ArrowDown size={14} /></div>
        <PipelineStep label={`2. ${translate(locale, "strategy.stressAnalysis")}`} value={`${strategy.stressIndex.toFixed(0)} / 100`} tone={tone} />
        <div className="flex justify-center text-slate-600"><ArrowDown size={14} /></div>
        <PipelineStep
          label={`3. ${translate(locale, "strategy.adaptationLevel")}`}
          value={
            locale === "zh-CN"
              ? `等级 ${strategy.level} · ${levelLabel(strategy.level, locale)}`
              : `Lv.${strategy.level} · ${levelLabel(strategy.level, locale)}`
          }
          tone={tone}
        />
        <div className="flex justify-center text-slate-600"><ArrowDown size={14} /></div>
        <PipelineStep label={`4. ${translate(locale, "strategy.smoothingFactor")}`} value={strategy.smoothingFactor.toFixed(2)} tone={tone} />
        <div className="flex justify-center text-slate-600"><ArrowDown size={14} /></div>
        <PipelineStep label={`5. ${translate(locale, "strategy.targetCurve")}`} value={translate(locale, "strategy.personalizedTarget")} tone={tone} />
      </div>
    </div>
  );
};

const PipelineStep = ({ label, value, tone }: { label: string; value: string | number; tone: "sky" | "purple" }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2 py-1.5">
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className={`font-mono text-xs font-semibold ${tone === "sky" ? "text-sky-300" : "text-purple-300"}`}>{value}</span>
  </div>
);

export default function StrategyPage() {
  const locale = useAppStore((s) => s.locale);
  const strategy = useAppStore((s) => s.strategy);
  const analysis = useAppStore((s) => s.analysis);
  const profileResult = useAppStore((s) => s.profileResult);

  if (!strategy) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
          <ArrowsLeftRight size={48} weight="thin" />
          <p className="text-sm">
            {locale === "zh-CN" ? "暂无策略数据，请先启动飞行模拟" : "No strategy data. Start the flight simulator first."}
          </p>
          <Link href="/flight" className="text-xs text-sky-400 underline">
            {locale === "zh-CN" ? "前往飞行模拟器" : "Open Flight Simulator"}
          </Link>
        </div>
      </div>
    );
  }

  const gap = Math.abs(strategy.left.riskScore - strategy.right.riskScore);

  return (
    <div className="page-container">
      <Link
        href="/prediction"
        className="inline-flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-300"
      >
        <ArrowLeft size={14} />
        {translate(locale, "nav.prediction")}
      </Link>

      <p className="page-subtitle">{translate(locale, "strategy.title")}</p>
      <h1 className="page-title">{translate(locale, "strategy.heading")}</h1>

      <section className="card mb-4 border-sky-400/20">
        <div className="flex items-start gap-3">
          <ArrowsLeftRight size={22} className="text-sky-400 mt-0.5" weight="duotone" />
          <div>
            <p className="value-label">
              {translate(locale, "strategy.whyIndependent")}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {locale === "zh-CN"
                ? `左耳风险 ${strategy.left.riskScore.toFixed(0)}，右耳风险 ${strategy.right.riskScore.toFixed(0)}，差异 ${gap.toFixed(0)}。AeroBalance 不是给两只耳朵同一个策略，而是分别计算适应等级和平滑因子。`
                : `Left risk ${strategy.left.riskScore.toFixed(0)}, right risk ${strategy.right.riskScore.toFixed(0)}, gap ${gap.toFixed(0)}. AeroBalance does not use one strategy for both ears; it computes separate adaptation levels and smoothing factors.`}
            </p>
          </div>
        </div>
      </section>

      {strategy.independent && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 mb-4">
          <ArrowsLeftRight size={18} className="text-sky-400" weight="duotone" />
          <span className="text-xs font-semibold text-sky-300">
            {locale === "zh-CN"
              ? "已启用双耳独立适应策略"
              : "Independent bilateral adaptation enabled"}
          </span>
        </div>
      )}

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={18} className="text-sky-400" />
          <div>
            <p className="value-label">
              {translate(locale, "strategy.decisionPipeline")}
            </p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN"
                ? "画像输出 → 压力负荷 → 适应等级 → 平滑因子 → 目标曲线。"
                : "Profile output → pressure load → adaptation level → smoothing factor → target curve."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <PipelineCard side="left" strategy={strategy.left} locale={locale} />
          <PipelineCard side="right" strategy={strategy.right} locale={locale} />
        </div>
      </section>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLineUp size={18} className="text-sky-400" />
          <div>
            <p className="value-label">
              {translate(locale, "strategy.generatedStrategy")}
            </p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN" ? "策略会直接驱动目标压力曲线。" : "The generated strategy directly drives the target-pressure curve."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-sky-400/10 bg-slate-950/30 p-3">
            <p className="value-label">{translate(locale, "common.leftEar")}</p>
            <p className="text-sm text-slate-300 mb-2">
              {levelLabel(strategy.left.level, locale)}
            </p>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between"><span>{translate(locale, "strategy.risk")}</span><span className="text-sky-300">{strategy.left.riskScore.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>{translate(locale, "strategy.stress")}</span><span className="text-sky-300">{strategy.left.stressIndex.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>{translate(locale, "strategy.smoothing")}</span><span className="text-sky-300">{strategy.left.smoothingFactor.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="rounded-lg border border-purple-400/10 bg-slate-950/30 p-3">
            <p className="value-label">{translate(locale, "common.rightEar")}</p>
            <p className="text-sm text-slate-300 mb-2">
              {levelLabel(strategy.right.level, locale)}
            </p>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between"><span>{translate(locale, "strategy.risk")}</span><span className="text-purple-300">{strategy.right.riskScore.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>{translate(locale, "strategy.stress")}</span><span className="text-purple-300">{strategy.right.stressIndex.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>{translate(locale, "strategy.smoothing")}</span><span className="text-purple-300">{strategy.right.smoothingFactor.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="card mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-yellow-400" weight="fill" />
          {translate(locale, "strategy.protectionAdvice")}
        </p>
        <div className="flex flex-col gap-2">
          {analysis?.recommendationKeys.map((key: RecommendationKey) => {
            const Icon = recIcons[key] ?? CheckCircle;
            return (
              <div
                key={key}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/40"
              >
                <Icon
                  size={16}
                  className="text-sky-400 mt-0.5 shrink-0"
                  weight="duotone"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  {translateRecommendation(locale, key)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {profileResult && (
        <section className="card mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            {translate(locale, "strategy.patentDistinction")}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {locale === "zh-CN"
              ? "普通耳塞只能固定衰减外界压力；AeroBalance 根据左右耳画像、预测压力负荷和目标曲线，主动形成不同的适应路径。"
              : "Ordinary earplugs provide fixed passive attenuation. AeroBalance uses left/right profiles, predicted pressure load, and target curves to create separate active adaptation paths."}
          </p>
        </section>
      )}

      <div className="page-action">
        <ActionButton href="/curve" icon={Target}>
          {translate(locale, "action.continue")}
        </ActionButton>
      </div>
    </div>
  );
}

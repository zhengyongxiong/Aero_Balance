"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Ear,
  ShieldCheck,
  Speedometer,
  ChartBar,
  Waveform,
  ArrowsLeftRight,
  ChartLineUp,
} from "@phosphor-icons/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { translate } from "@/i18n/messages";
import { DigitalEar } from "@/components/profile/DigitalEar";
import { ActionButton } from "@/components/ui/ActionButton";
import { seedProfiles } from "@/lib/seed";
import type { EarProfileInput, RiskLevel } from "@/types/domain";

const riskLevelFromScore = (score: number): RiskLevel =>
  score >= 65 ? "high" : score >= 35 ? "medium" : "low";

const riskText = (r: RiskLevel, locale: string) => {
  const map: Record<RiskLevel, string> = {
    low: locale === "zh-CN" ? "低风险" : "Low risk",
    medium: locale === "zh-CN" ? "中风险" : "Medium risk",
    high: locale === "zh-CN" ? "高风险" : "High risk",
  };
  return map[r];
};

const congestionText = (value: EarProfileInput["congestion"], locale: string) => {
  const map = {
    none: locale === "zh-CN" ? "无鼻炎" : "None",
    mild: locale === "zh-CN" ? "轻度鼻炎" : "Mild rhinitis",
    noticeable: locale === "zh-CN" ? "明显鼻炎" : "Noticeable rhinitis",
  };
  return map[value];
};

const frequencyText = (value: EarProfileInput["flightFrequency"], locale: string) => {
  const map = {
    rare: locale === "zh-CN" ? "偶尔飞行" : "Rare",
    occasional: locale === "zh-CN" ? "定期飞行" : "Occasional",
    frequent: locale === "zh-CN" ? "高频飞行" : "Frequent",
  };
  return map[value];
};

const abilityText = (value: number, locale: string) => {
  if (locale === "zh-CN") {
    if (value <= 2) return "偏弱";
    if (value === 3) return "中等";
    return "较强";
  }
  if (value <= 2) return "Limited";
  if (value === 3) return "Moderate";
  return "Strong";
};

const sensitivityText = (value: number, locale: string) => {
  if (locale === "zh-CN") {
    if (value <= 2) return "低敏";
    if (value === 3) return "中等";
    return "高敏";
  }
  if (value <= 2) return "Low";
  if (value === 3) return "Moderate";
  return "High";
};

const radarDimensions = [
  "敏感度\nSensitivity",
  "耐受度\nTolerance",
  "平衡能力\nEqualization",
  "适应速度\nAdaptation",
  "压力稳定\nStability",
];

const buildRadarData = (profile: NonNullable<ReturnType<typeof useAppStore.getState>["profileResult"]>) => {
  const equalizationBurden = 100 - ((profile.leftRadar[1] ?? 0) + (profile.rightRadar[1] ?? 0)) / 2;
  const stability = 100 - ((profile.leftRadar[4] ?? 0) + (profile.rightRadar[4] ?? 0)) / 2;
  return radarDimensions.map((dimension, index) => ({
    dimension,
    left: index === 1 ? profile.toleranceScore : profile.leftRadar[index] ?? 0,
    right:
      index === 1
        ? profile.toleranceScore
        : index === 2
          ? equalizationBurden
          : index === 3
            ? profile.adaptationSpeed
            : index === 4
              ? stability
              : profile.rightRadar[index] ?? 0,
  }));
};

const ProfileInputRow = ({
  label,
  value,
  tone = "sky",
}: {
  label: string;
  value: string | number;
  tone?: "sky" | "purple" | "cyan" | "orange";
}) => {
  const toneClass = {
    sky: "text-sky-300",
    purple: "text-purple-300",
    cyan: "text-cyan-300",
    orange: "text-orange-300",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 py-2 last:border-b-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
};

export default function ProfilePage() {
  const locale = useAppStore((s) => s.locale);
  const profileInput = useAppStore((s) => s.profileInput);
  const profileResult = useAppStore((s) => s.profileResult);
  const analysis = useAppStore((s) => s.analysis);
  const selectedSeedId = useAppStore((s) => s.selectedSeedId);
  const loadSeedProfile = useAppStore((s) => s.loadSeedProfile);

  const selectedProfile = seedProfiles.find((profile) => profile.id === selectedSeedId);
  const input = profileInput ?? selectedProfile?.input;
  const leftRisk = profileResult?.leftRisk ?? 0;
  const rightRisk = profileResult?.rightRisk ?? 0;
  const riskGap = Math.abs(leftRisk - rightRisk);
  const tolerance = profileResult?.toleranceScore ?? 0;
  const adaptationSpeed = profileResult?.adaptationSpeed ?? 0;
  const stability =
    input && profileResult
      ? Math.round(
          100 -
            ((profileResult.leftRadar[4] ?? 0) +
              (profileResult.rightRadar[4] ?? 0) +
              (profileResult.leftRadar[3] ?? 0) +
              (profileResult.rightRadar[3] ?? 0)) /
              4,
        )
      : 0;

  if (!profileResult || !input) {
    return (
      <div className="page-container">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-300"
        >
          <ArrowLeft size={14} />
          {translate(locale, "nav.home")}
        </Link>

        <p className="page-subtitle">{translate(locale, "profile.twin")}</p>
        <h1 className="page-title">Personal Ear Profile / 个体耳压画像</h1>

        <section className="profile-picker" aria-label="Ear profile">
          {seedProfiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              aria-label={translate(locale, profile.nameKey)}
              aria-pressed={selectedSeedId === profile.id}
              className={`profile-picker__option${
                selectedSeedId === profile.id ? " is-selected" : ""
              }`}
              onClick={() => loadSeedProfile(profile)}
            >
              <Ear size={22} weight="duotone" />
              <strong>{translate(locale, profile.nameKey)}</strong>
              <small>
                L{profile.input.leftSensitivity} / R{profile.input.rightSensitivity}
              </small>
            </button>
          ))}
        </section>

        <div className="card profile-empty">
          <Brain size={36} weight="duotone" className="text-sky-400" />
          <p>
            {locale === "zh-CN"
              ? "选择一个用户画像，生成左右耳独立风险评估与适应策略输入。"
              : "Choose a profile to generate independent left/right ear risk and adaptation inputs."}
          </p>
        </div>
      </div>
    );
  }

  const radarData = buildRadarData(profileResult);

  return (
    <div className="page-container">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-300"
      >
        <ArrowLeft size={14} />
        {translate(locale, "nav.home")}
      </Link>

      <p className="page-subtitle">{translate(locale, "profile.twin")}</p>
      <h1 className="page-title">Personal Ear Profile / 个体耳压画像</h1>

      <div className="card mb-4 border-sky-400/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="value-label">Patent core / 专利核心</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {locale === "zh-CN"
                ? "不是普通耳塞的固定隔音，而是先用个人耳压画像判断左右耳风险，再决定不同目标压力曲线。"
                : "Not fixed passive insulation: AeroBalance first profiles each ear, then creates different target-pressure curves."}
            </p>
          </div>
          <ArrowsLeftRight size={24} className="text-sky-400 shrink-0" weight="duotone" />
        </div>
      </div>

      <section className="profile-picker" aria-label="Ear profile">
        {seedProfiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            aria-label={translate(locale, profile.nameKey)}
            aria-pressed={selectedSeedId === profile.id}
            className={`profile-picker__option${
              selectedSeedId === profile.id ? " is-selected" : ""
            }`}
            onClick={() => loadSeedProfile(profile)}
          >
            <Ear size={22} weight="duotone" />
            <strong>{translate(locale, profile.nameKey)}</strong>
            <small>
              L{profile.input.leftSensitivity} / R{profile.input.rightSensitivity}
            </small>
          </button>
        ))}
      </section>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLineUp size={18} className="text-sky-400" />
          <div>
            <p className="value-label">Ear Profile Inputs / 耳压画像输入</p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN"
                ? "这些特征进入 Ear Profile Engine，生成左右耳不同的风险评分。"
                : "These traits feed the Ear Profile Engine to generate separate left/right risk scores."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <ProfileInputRow label="Age / 年龄" value={input.age} />
          <ProfileInputRow label="Equalization / 平衡能力" value={`${input.equalizationAbility}/5 · ${abilityText(input.equalizationAbility, locale)}`} tone="cyan" />
          <ProfileInputRow label="Previous Pain / 既往耳痛" value={`${input.previousDiscomfort}/10`} tone="orange" />
          <ProfileInputRow label="Rhinitis / 鼻炎" value={congestionText(input.congestion, locale)} />
          <ProfileInputRow label="Flight Frequency / 飞行频率" value={frequencyText(input.flightFrequency, locale)} />
          <ProfileInputRow label="Ear Sensitivity / 耳敏感度" value={`L${input.leftSensitivity}/5 · R${input.rightSensitivity}/5 · ${sensitivityText(Math.max(input.leftSensitivity, input.rightSensitivity), locale)}`} tone="purple" />
        </div>
      </section>

      <section className="card mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-sky-400" />
            <div>
              <p className="value-label">Ear Profile Engine / 耳压画像引擎</p>
              <p className="text-[11px] text-slate-500">
                {locale === "zh-CN"
                  ? "敏感度、鼻炎、既往耳痛、平衡能力共同影响风险。"
                  : "Sensitivity, rhinitis, prior pain, and equalization ability drive risk."}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] text-sky-300">
            generated
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <span>User Characteristics</span>
          <span>↓</span>
          <span>Ear Profile Engine</span>
          <span>↓</span>
          <span>Left / Right Risk</span>
          <span>↓</span>
          <span>Adaptation Decision</span>
        </div>
      </section>

      <div className="ear-twin mb-4">
        <div className="ear-twin__pair">
          <div className="ear-card ear-card--left">
            <p className="ear-card__label ear-card__label--left">左耳 Left</p>
            <div className="ear-card__canvas">
              <DigitalEar side="left" risk={riskLevelFromScore(leftRisk)} />
            </div>
            <span className={`risk-badge risk-badge--${riskLevelFromScore(leftRisk)}`}>
              <ShieldCheck size={14} weight="fill" />
              {riskText(riskLevelFromScore(leftRisk), locale)}
            </span>
            <div className="ear-card__stats">
              <div className="ear-card__stat">
                <span>Risk Score / 风险</span>
                <span>{leftRisk.toFixed(0)}</span>
              </div>
              <div className="ear-card__stat">
                <span>Sensitivity / 敏感度</span>
                <span>{input.leftSensitivity}/5</span>
              </div>
              <div className="ear-card__stat">
                <span>Tolerance / 耐受</span>
                <span>{tolerance.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="ear-card ear-card--right">
            <p className="ear-card__label ear-card__label--right">右耳 Right</p>
            <div className="ear-card__canvas">
              <DigitalEar side="right" risk={riskLevelFromScore(rightRisk)} />
            </div>
            <span className={`risk-badge risk-badge--${riskLevelFromScore(rightRisk)}`}>
              <ShieldCheck size={14} weight="fill" />
              {riskText(riskLevelFromScore(rightRisk), locale)}
            </span>
            <div className="ear-card__stats">
              <div className="ear-card__stat">
                <span>Risk Score / 风险</span>
                <span>{rightRisk.toFixed(0)}</span>
              </div>
              <div className="ear-card__stat">
                <span>Sensitivity / 敏感度</span>
                <span>{input.rightSensitivity}/5</span>
              </div>
              <div className="ear-card__stat">
                <span>Tolerance / 耐受</span>
                <span>{tolerance.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-sky-400" />
          <div>
            <p className="value-label">Generated Outputs / 画像输出</p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN"
                ? "输出直接决定后续预测、策略和曲线。"
                : "These outputs drive prediction, bilateral strategy, and target curves."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-950/35 p-3 border border-sky-400/10">
            <p className="value-label">Left Risk / 左耳风险</p>
            <p className="value-medium text-sky-300">{leftRisk.toFixed(0)}</p>
          </div>
          <div className="rounded-lg bg-slate-950/35 p-3 border border-purple-400/10">
            <p className="value-label">Right Risk / 右耳风险</p>
            <p className="value-medium text-purple-300">{rightRisk.toFixed(0)}</p>
          </div>
          <div className="rounded-lg bg-slate-950/35 p-3 border border-cyan-400/10">
            <p className="value-label">Tolerance / 耐受分</p>
            <p className="value-medium text-cyan-300">{tolerance.toFixed(0)}</p>
          </div>
          <div className="rounded-lg bg-slate-950/35 p-3 border border-orange-400/10">
            <p className="value-label">Adaptation / 适应速度</p>
            <p className="value-medium text-orange-300">{adaptationSpeed.toFixed(0)}</p>
          </div>
          <div className="rounded-lg bg-slate-950/35 p-3 border border-green-400/10 col-span-2">
            <p className="value-label">Pressure Stability / 压力稳定</p>
            <p className="value-medium text-green-300">{stability.toFixed(0)}</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 mt-3">
          {locale === "zh-CN"
            ? `左右耳风险差 ${riskGap.toFixed(0)}：这是双耳独立适应策略被触发的关键证据。`
            : `Left/right risk gap ${riskGap.toFixed(0)}: this is the evidence that bilateral adaptation should be independent.`}
        </p>
      </section>

      <section className="card mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ChartBar size={18} className="text-sky-400" />
          <div>
            <p className="value-label">Radar Evidence / 雷达证据</p>
            <p className="text-[11px] text-slate-500">
              {locale === "zh-CN" ? "左耳与右耳的五维画像对比。" : "Five-dimensional evidence for left and right ears."}
            </p>
          </div>
        </div>
        <div className="h-56 -ml-4">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 320, height: 224 }}
          >
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(148,163,184,0.18)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Left / 左耳" dataKey="left" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.22} />
              <Radar name="Right / 右耳" dataKey="right" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.18} />
              <Legend wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card mb-4">
        <div className="flex items-center gap-2">
          <Waveform size={18} className="text-sky-400" />
          <div>
            <p className="value-label">Decision Output / 决策输出</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {analysis?.riskLevel === "high"
                ? locale === "zh-CN"
                  ? "高风险差异明显，系统将为左右耳生成不同目标曲线。"
                  : "High-risk asymmetry detected: separate target curves are required."
                : analysis?.riskLevel === "medium"
                  ? locale === "zh-CN"
                    ? "存在中风险，系统采用渐进平滑保护。"
                    : "Medium risk detected: gradual smoothing protection is recommended."
                  : locale === "zh-CN"
                    ? "双耳状态稳定，保持低强度主动适应。"
                    : "Both ears are stable; low-intensity active adaptation is sufficient."}
            </p>
          </div>
        </div>
      </section>

      <div className="page-action">
        <ActionButton href="/flight" icon={Speedometer}>
          {translate(locale, "action.continue")}
        </ActionButton>
      </div>
    </div>
  );
}

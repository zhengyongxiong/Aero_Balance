"use client";

import type { RiskLevel } from "@/types/domain";

const riskColors: Record<RiskLevel, { primary: string; glow: string; bg: string }> = {
  low: { primary: "#22c55e", glow: "rgba(34,197,94,0.3)", bg: "rgba(34,197,94,0.08)" },
  medium: { primary: "#f97316", glow: "rgba(249,115,22,0.3)", bg: "rgba(249,115,22,0.08)" },
  high: { primary: "#ef4444", glow: "rgba(239,68,68,0.3)", bg: "rgba(239,68,68,0.08)" },
};

interface Props {
  side: "left" | "right";
  risk: RiskLevel;
}

export function DigitalEar({ side, risk }: Props) {
  const colors = riskColors[risk];
  const isLeft = side === "left";

  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: isLeft ? "scaleX(1)" : "scaleX(-1)" }}
    >
      {/* Glow */}
      <circle cx="50" cy="55" r="38" fill={colors.glow} opacity="0.4" />

      {/* Outer ear (auricle) */}
      <path
        d={
          isLeft
            ? "M55 10 C45 8, 30 12, 22 22 C14 32, 12 45, 15 55 C18 65, 25 72, 35 75 C28 70, 22 62, 20 52 C18 42, 22 30, 30 22 C38 16, 48 14, 55 15 Z"
            : "M55 10 C65 8, 80 12, 88 22 C96 32, 98 45, 95 55 C92 65, 85 72, 75 75 C82 70, 88 62, 90 52 C92 42, 88 30, 80 22 C72 16, 62 14, 55 15 Z"
        }
        fill={colors.bg}
        stroke={colors.primary}
        strokeWidth="1.5"
        opacity="0.7"
      />

      {/* Inner ear (concha) */}
      <path
        d={
          isLeft
            ? "M50 25 C42 28, 36 35, 34 44 C32 53, 35 60, 40 64 C38 58, 36 50, 38 42 C40 34, 44 30, 50 28 Z"
            : "M60 25 C68 28, 74 35, 76 44 C78 53, 75 60, 70 64 C72 58, 74 50, 72 42 C70 34, 66 30, 60 28 Z"
        }
        fill={colors.bg}
        stroke={colors.primary}
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Ear canal */}
      <path
        d={
          isLeft
            ? "M45 68 C42 72, 40 78, 42 84 C44 88, 48 90, 48 90"
            : "M65 68 C68 72, 70 78, 68 84 C66 88, 62 90, 62 90"
        }
        stroke={colors.primary}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eardrum indicator */}
      <circle cx={isLeft ? 40 : 70} cy={82} r="3" fill={colors.primary} opacity="0.6" />

      {/* Pulse/beat animation ring */}
      <circle
        cx="50" cy="55" r="32"
        stroke={colors.primary}
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

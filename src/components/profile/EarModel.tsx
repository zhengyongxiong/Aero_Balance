"use client";

import type { RiskLevel } from "@/types/domain";

/**
 * A reusable SVG ear outline. Fill color reflects the given risk level.
 */
const riskColors: Record<RiskLevel, string> = {
  low: "#22c55e",
  medium: "#f97316",
  high: "#ef4444",
};

const riskOpacities: Record<RiskLevel, string> = {
  low: "rgba(34,197,94,0.2)",
  medium: "rgba(249,115,22,0.2)",
  high: "rgba(239,68,68,0.2)",
};

export function EarModel({
  risk = "medium",
  side = "left",
}: {
  risk?: RiskLevel;
  side?: "left" | "right";
}) {
  const fill = riskColors[risk];
  const bg = riskOpacities[risk];

  // Mirror for right ear
  const transform = side === "right" ? "scale(-1, 1)" : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${side} ear silhouette`}
    >
      <g transform={transform}>
        {/* Outer ear (pinna) */}
        <path
          d="M50 15 C35 15 22 25 20 38 C18 50 24 60 30 66 C36 72 38 78 36 84 C34 88 30 90 26 88"
          stroke={fill}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill={bg}
        />
        {/* Inner ear curve */}
        <path
          d="M45 20 C38 22 32 30 32 38 C32 45 36 50 42 53 C48 56 50 60 48 66"
          stroke={fill}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Ear canal */}
        <path
          d="M46 66 C44 72 44 78 48 82"
          stroke={fill}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        {/* Helix fold */}
        <path
          d="M52 18 C60 20 64 30 64 40 C64 48 60 52 54 54"
          stroke={fill}
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}

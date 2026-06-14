import type {
  AnalysisResult,
  FlightPhase,
  RecommendationKey,
  RiskLevel,
} from "@/types/domain";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function composeAnalysisResult(
  leftRisk: number,
  rightRisk: number,
  pressureStress: number,
  independent: boolean,
  phase: FlightPhase,
): AnalysisResult {
  const leftBurden = leftRisk * 0.6 + pressureStress * 0.4;
  const rightBurden = rightRisk * 0.6 + pressureStress * 0.4;
  const asymmetryPenalty = Math.min(
    Math.abs(leftBurden - rightBurden) * 0.15,
    10,
  );
  const comfortScore = clamp(
    100 - Math.max(leftBurden, rightBurden) * 0.85 - asymmetryPenalty,
  );
  const worst = Math.max(leftBurden, rightBurden);
  const riskLevel: RiskLevel =
    worst < 35 ? "low" : worst < 65 ? "medium" : "high";
  const recommendationKeys: RecommendationKey[] = [
    phase === "descent" || phase === "landing"
      ? "recommendation.watchRate"
      : "recommendation.monitor",
    worst >= 65
      ? "recommendation.highSmoothing"
      : "recommendation.steady",
  ];

  if (independent) {
    recommendationKeys.push("recommendation.independent");
  }

  return {
    comfortScore: Number(comfortScore.toFixed(0)),
    riskLevel,
    leftBurden: Number(leftBurden.toFixed(1)),
    rightBurden: Number(rightBurden.toFixed(1)),
    recommendationKeys,
  };
}

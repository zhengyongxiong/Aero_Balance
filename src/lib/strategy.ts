import type {
  BilateralStrategy,
  EarStrategy,
  FlightPhase,
  PredictionResult,
  RecommendationKey,
} from "@/types/domain";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const levelFor = (burden: number): 1 | 2 | 3 | 4 | 5 =>
  burden < 20 ? 1 : burden < 40 ? 2 : burden < 60 ? 3 : burden < 80 ? 4 : 5;

export function createBilateralStrategy(
  risk: { leftRisk: number; rightRisk: number },
  stressIndex: number,
  phase: FlightPhase,
  trend: PredictionResult["trend"],
): BilateralStrategy {
  const create = (side: "left" | "right", riskScore: number): EarStrategy => {
    const combinedBurden = riskScore * 0.6 + stressIndex * 0.4;
    const level = levelFor(combinedBurden);
    const smoothingFactor = clamp(
      0.14 + (level - 1) * 0.13 + (riskScore / 100) * 0.08,
      0.14,
      0.74,
    );
    let recommendationKey: RecommendationKey;
    if (phase === "descent" || phase === "landing") {
      recommendationKey =
        trend === "rising"
          ? "recommendation.gradualDescent"
          : "recommendation.monitor";
    } else {
      recommendationKey =
        level >= 4
          ? "recommendation.highSmoothing"
          : "recommendation.steady";
    }

    return {
      side,
      riskScore: Number(riskScore.toFixed(1)),
      stressIndex: Number(stressIndex.toFixed(1)),
      combinedBurden: Number(combinedBurden.toFixed(1)),
      level,
      smoothingFactor: Number(smoothingFactor.toFixed(3)),
      recommendationKey,
    };
  };
  const left = create("left", risk.leftRisk);
  const right = create("right", risk.rightRisk);

  return {
    left,
    right,
    independent:
      Math.abs(risk.leftRisk - risk.rightRisk) >= 15 ||
      left.level !== right.level,
  };
}

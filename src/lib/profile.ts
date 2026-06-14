import type { EarProfileInput, EarProfileResult } from "@/types/domain";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Number(value.toFixed(1));

export function calculateEarProfile(
  raw: EarProfileInput,
): EarProfileResult {
  const age = clamp(raw.age, 1, 100);
  const discomfort = clamp(raw.previousDiscomfort, 0, 10);
  const equalization = clamp(raw.equalizationAbility, 1, 5);
  const leftSensitivity = clamp(raw.leftSensitivity, 1, 5);
  const rightSensitivity = clamp(raw.rightSensitivity, 1, 5);
  const equalizationBurden = ((5 - equalization) / 4) * 100;
  const discomfortBurden = (discomfort / 10) * 100;
  const congestionBurden = {
    none: 0,
    mild: 45,
    noticeable: 85,
  }[raw.congestion];
  const ageBurden = age < 12 ? 20 : age > 60 ? 15 : 0;
  const sensitivityBurden = (value: number) => ((value - 1) / 4) * 100;
  const riskFor = (sensitivity: number) =>
    clamp(
      sensitivityBurden(sensitivity) * 0.35 +
        equalizationBurden * 0.25 +
        discomfortBurden * 0.2 +
        congestionBurden * 0.12 +
        ageBurden * 0.08,
    );
  const leftRisk = riskFor(leftSensitivity);
  const rightRisk = riskFor(rightSensitivity);
  const toleranceScore = clamp(
    100 -
      ((leftRisk + rightRisk) / 2) * 0.55 -
      equalizationBurden * 0.3 -
      discomfortBurden * 0.15,
  );
  const frequencyBenefit = {
    rare: 15,
    occasional: 55,
    frequent: 90,
  }[raw.flightFrequency];
  const equalizationNormalized = ((equalization - 1) / 4) * 100;
  const adaptationSpeed = clamp(
    equalizationNormalized * 0.5 +
      frequencyBenefit * 0.3 +
      (100 - discomfortBurden) * 0.2,
  );
  const radarFor = (sensitivity: number) => [
    sensitivityBurden(sensitivity),
    equalizationBurden,
    discomfortBurden,
    congestionBurden,
    100 - adaptationSpeed,
  ];

  return {
    leftRisk: round(leftRisk),
    rightRisk: round(rightRisk),
    toleranceScore: round(toleranceScore),
    adaptationSpeed: round(adaptationSpeed),
    leftRadar: radarFor(leftSensitivity).map(round),
    rightRadar: radarFor(rightSensitivity).map(round),
  };
}

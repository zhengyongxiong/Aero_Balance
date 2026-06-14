import type { PressureSample, TargetCurvePoint } from "@/types/domain";

export function createTargetCurves(
  samples: PressureSample[],
  leftSmoothing: number,
  rightSmoothing: number,
): TargetCurvePoint[] {
  if (samples.length === 0) return [];

  let left = samples[0].pressure;
  let right = samples[0].pressure;

  return samples.map((sample, index) => {
    if (index > 0) {
      left += (sample.pressure - left) * (1 - leftSmoothing);
      right += (sample.pressure - right) * (1 - rightSmoothing);
    }

    return {
      timestamp: sample.timestamp,
      environmental: sample.pressure,
      leftTarget: Number(left.toFixed(3)),
      rightTarget: Number(right.toFixed(3)),
      phase: sample.phase,
    };
  });
}

export function maxCurveRate(
  points: TargetCurvePoint[],
  side: "leftTarget" | "rightTarget",
): number {
  return points.slice(1).reduce((maximum, point, index) => {
    const previous = points[index];
    const minutes = (point.timestamp - previous.timestamp) / 60_000;
    const rate =
      minutes <= 0 ? 0 : Math.abs(point[side] - previous[side]) / minutes;
    return Math.max(maximum, rate);
  }, 0);
}

export function meanCurveGap(
  points: TargetCurvePoint[],
  side: "leftTarget" | "rightTarget",
): number {
  if (!points.length) return 0;

  return (
    points.reduce(
      (sum, point) => sum + Math.abs(point.environmental - point[side]),
      0,
    ) / points.length
  );
}

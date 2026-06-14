import type {
  PredictionPoint,
  PredictionResult,
  PressureSample,
} from "@/types/domain";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Number(value.toFixed(2));

export function predictPressure(
  input: PressureSample[],
): PredictionResult {
  const sorted = [...input]
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(
      (sample, index, values) =>
        index === 0 || sample.timestamp !== values[index - 1].timestamp,
    )
    .slice(-20);

  if (sorted.length < 3) {
    throw new Error("At least three pressure samples are required");
  }

  const origin = sorted[0].timestamp;
  const points = sorted.map((sample) => ({
    x: (sample.timestamp - origin) / 60_000,
    y: sample.pressure,
  }));
  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const numerator = points.reduce(
    (sum, point) => sum + (point.x - xMean) * (point.y - yMean),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + Math.pow(point.x - xMean, 2),
    0,
  );
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  const predicted = (minute: number) => intercept + slope * minute;
  const residual = points.reduce(
    (sum, point) => sum + Math.pow(point.y - predicted(point.x), 2),
    0,
  );
  const total = points.reduce(
    (sum, point) => sum + Math.pow(point.y - yMean, 2),
    0,
  );
  const rSquared = total === 0 ? 1 : 1 - residual / total;
  const last = sorted.at(-1)!;
  const lastMinute = points.at(-1)!.x;
  const history: PredictionPoint[] = sorted.map((sample) => ({
    timestamp: sample.timestamp,
    pressure: sample.pressure,
    kind: "history",
    minuteOffset: (sample.timestamp - last.timestamp) / 60_000,
  }));
  const forecast: PredictionPoint[] = Array.from(
    { length: 15 },
    (_, index) => {
      const minuteOffset = index + 1;
      return {
        timestamp: last.timestamp + minuteOffset * 60_000,
        pressure: round(
          clamp(predicted(lastMinute + minuteOffset), 72, 103),
        ),
        kind: "forecast",
        minuteOffset,
      };
    },
  );
  const pressureAt = (offset: 5 | 10 | 15) =>
    forecast[offset - 1].pressure;
  const variance =
    sorted.reduce(
      (sum, sample) => sum + Math.pow(sample.pressure - yMean, 2),
      0,
    ) / sorted.length;
  const standardDeviation = Math.sqrt(variance);
  const rateStress = clamp((Math.abs(slope) / 1.2) * 100, 0, 100);
  const forecastStress = clamp(
    (Math.abs(pressureAt(15) - last.pressure) / 12) * 100,
    0,
    100,
  );
  const volatilityStress = clamp(
    (standardDeviation / 1.5) * 100,
    0,
    100,
  );
  const sampleConfidence = Math.min(sorted.length / 12, 1);
  const fitConfidence = clamp(rSquared, 0, 1);

  return {
    points: [...history, ...forecast],
    pressure5: pressureAt(5),
    pressure10: pressureAt(10),
    pressure15: pressureAt(15),
    slope: round(slope),
    trend: slope > 0.05 ? "rising" : slope < -0.05 ? "falling" : "stable",
    confidence: round((sampleConfidence * 0.4 + fitConfidence * 0.6) * 100),
    stressIndex: round(
      rateStress * 0.55 +
        forecastStress * 0.3 +
        volatilityStress * 0.15,
    ),
  };
}

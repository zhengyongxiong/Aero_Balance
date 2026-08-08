import type { FlightPhase, PressureSample } from "@/types/domain";

const TREND_THRESHOLD_KPA_PER_MINUTE = 0.12;
const GROUND_PRESSURE_TOLERANCE_KPA = 0.8;
const CRUISE_PRESSURE_DROP_KPA = 2;
const MIN_DIRECTIONAL_CHANGE_KPA = 0.05;
const GROUND_ALTITUDE_MAX_METERS = 1_000;
const CRUISE_ALTITUDE_MIN_METERS = 1_500;

export function inferLiveFlightPhase(
  samples: PressureSample[],
  baselinePressure: number,
  previousPhase: FlightPhase,
): FlightPhase {
  const recent = samples.slice(-12);
  if (recent.length < 3) {
    return previousPhase === "demo" ? "landing" : previousPhase;
  }

  const origin = recent[0].timestamp;
  const points = recent.map((sample) => ({
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
  const latestPressure = recent.at(-1)!.pressure;
  const latestAltitude = recent.at(-1)!.altitude;
  const distanceFromBaseline = baselinePressure - latestPressure;
  const netChange = latestPressure - recent[0].pressure;
  const nearGround =
    latestAltitude !== undefined
      ? latestAltitude <= GROUND_ALTITUDE_MAX_METERS
      : latestPressure >= 95 &&
        Math.abs(distanceFromBaseline) <= GROUND_PRESSURE_TOLERANCE_KPA;
  const atCruisePressure =
    latestAltitude !== undefined
      ? latestAltitude >= CRUISE_ALTITUDE_MIN_METERS
      : latestPressure < 95 || distanceFromBaseline >= CRUISE_PRESSURE_DROP_KPA;

  if (
    netChange <= -MIN_DIRECTIONAL_CHANGE_KPA &&
    slope <= -TREND_THRESHOLD_KPA_PER_MINUTE
  ) {
    return "takeoff";
  }
  if (
    netChange >= MIN_DIRECTIONAL_CHANGE_KPA &&
    slope >= TREND_THRESHOLD_KPA_PER_MINUTE
  ) {
    return nearGround ? "landing" : "descent";
  }
  if (nearGround) return "landing";
  if (atCruisePressure) return "cruise";

  return previousPhase === "demo" ? "landing" : previousPhase;
}

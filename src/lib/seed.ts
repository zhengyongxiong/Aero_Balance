import type {
  FlightPhase,
  PressureSample,
  SeedProfile,
} from "@/types/domain";

export const seedProfiles: SeedProfile[] = [
  {
    id: "user-a",
    nameKey: "profile.seedA",
    input: {
      age: 34,
      congestion: "mild",
      previousDiscomfort: 8,
      equalizationAbility: 3,
      leftSensitivity: 5,
      rightSensitivity: 2,
      flightFrequency: "occasional",
    },
  },
  {
    id: "user-b",
    nameKey: "profile.seedB",
    input: {
      age: 29,
      congestion: "none",
      previousDiscomfort: 2,
      equalizationAbility: 5,
      leftSensitivity: 2,
      rightSensitivity: 2,
      flightFrequency: "frequent",
    },
  },
  {
    id: "user-c",
    nameKey: "profile.seedC",
    input: {
      age: 47,
      congestion: "noticeable",
      previousDiscomfort: 7,
      equalizationAbility: 2,
      leftSensitivity: 3,
      rightSensitivity: 5,
      flightFrequency: "rare",
    },
  },
];

const createStage = (
  sessionId: string,
  phase: Exclude<FlightPhase, "demo">,
  startAt: number,
  durationMinutes: number,
  from: number,
  to: number,
  batteryStart: number,
): PressureSample[] => {
  const count = durationMinutes * 2 + 1;

  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const eased =
      phase === "cruise"
        ? 0
        : progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const cruiseWave =
      phase === "cruise" ? Math.sin(index * 0.58) * 0.18 : 0;
    const settlingWave =
      phase === "landing"
        ? Math.sin(index * 0.9) * (1 - progress) * 0.08
        : 0;
    const pressure =
      phase === "cruise"
        ? from + cruiseWave
        : from + (to - from) * eased + settlingWave;

    return {
      id: `${sessionId}-${phase}-${index}`,
      sessionId,
      pressure: Number(pressure.toFixed(3)),
      temperature: Number((24.8 + progress * 0.8).toFixed(1)),
      battery: Math.max(0, batteryStart - Math.floor(index / 40)),
      phase,
      timestamp: startAt + index * 30_000,
      source: "mock",
    };
  });
};

export function createFlightSeed(
  sessionId: string,
  startAt = 1_710_000_000_000,
): PressureSample[] {
  const takeoff = createStage(
    sessionId,
    "takeoff",
    startAt,
    22,
    101.3,
    78,
    87,
  );
  const cruise = createStage(
    sessionId,
    "cruise",
    takeoff.at(-1)!.timestamp + 30_000,
    36,
    78,
    78,
    86,
  );
  const descent = createStage(
    sessionId,
    "descent",
    cruise.at(-1)!.timestamp + 30_000,
    20,
    78,
    98.5,
    85,
  );
  const landing = createStage(
    sessionId,
    "landing",
    descent.at(-1)!.timestamp + 30_000,
    8,
    98.5,
    101.3,
    84,
  );

  return [...takeoff, ...cruise, ...descent, ...landing];
}

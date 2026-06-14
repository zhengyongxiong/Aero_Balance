"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateEarProfile } from "@/lib/profile";
import { predictPressure } from "@/lib/prediction";
import { composeAnalysisResult } from "@/lib/result";
import { savePressureSample, savePressureSession } from "@/lib/storage";
import { createBilateralStrategy } from "@/lib/strategy";
import { createTargetCurves } from "@/lib/target-curve";
import type {
  AnalysisResult,
  BilateralStrategy,
  EarProfileInput,
  EarProfileResult,
  FlightPhase,
  Locale,
  PredictionResult,
  PressureSample,
  SeedProfile,
  TargetCurvePoint,
} from "@/types/domain";

export type DeviceConnectionState =
  | "unsupported"
  | "disconnected"
  | "scanning"
  | "connected"
  | "failed";

interface AppState {
  locale: Locale;
  profileInput: EarProfileInput | null;
  profileResult: EarProfileResult | null;
  selectedSeedId: SeedProfile["id"] | null;
  phase: FlightPhase;
  source: "bluetooth" | "mock" | null;
  deviceState: DeviceConnectionState;
  deviceName: string | null;
  notice: string | null;
  isPlaying: boolean;
  playbackSpeed: 1 | 4;
  activeSessionId: string | null;
  pressureHistory: PressureSample[];
  prediction: PredictionResult | null;
  strategy: BilateralStrategy | null;
  targetCurves: TargetCurvePoint[];
  analysis: AnalysisResult | null;
  setLocale(locale: Locale): void;
  setPhase(phase: FlightPhase): void;
  setPlayback(isPlaying: boolean): void;
  setPlaybackSpeed(speed: 1 | 4): void;
  setDevice(
    state: DeviceConnectionState,
    name?: string | null,
    notice?: string | null,
  ): void;
  loadSeedProfile(profile: SeedProfile): void;
  setProfile(input: EarProfileInput): void;
  appendPressureSample(sample: PressureSample): void;
  replacePressureHistory(samples: PressureSample[]): void;
  resetSession(): void;
}

const derive = (
  profileInput: EarProfileInput | null,
  pressureHistory: PressureSample[],
) => {
  if (!profileInput) {
    return {
      profileResult: null,
      prediction: null,
      strategy: null,
      targetCurves: [],
      analysis: null,
    };
  }

  const profileResult = calculateEarProfile(profileInput);
  if (pressureHistory.length < 3) {
    return {
      profileResult,
      prediction: null,
      strategy: null,
      targetCurves: [],
      analysis: null,
    };
  }

  const prediction = predictPressure(pressureHistory);
  const phase = pressureHistory.at(-1)?.phase ?? "demo";
  const strategy = createBilateralStrategy(
    profileResult,
    prediction.stressIndex,
    phase,
    prediction.trend,
  );
  const latest = pressureHistory.at(-1)!;
  const forecastSamples: PressureSample[] = prediction.points
    .filter((point) => point.kind === "forecast")
    .map((point) => ({
      id: `forecast-${point.timestamp}`,
      sessionId: latest.sessionId,
      pressure: point.pressure,
      phase,
      timestamp: point.timestamp,
      source: latest.source,
    }));
  const targetCurves = createTargetCurves(
    [...pressureHistory, ...forecastSamples],
    strategy.left.smoothingFactor,
    strategy.right.smoothingFactor,
  );
  const analysis = composeAnalysisResult(
    profileResult.leftRisk,
    profileResult.rightRisk,
    prediction.stressIndex,
    strategy.independent,
    phase,
  );

  return { profileResult, prediction, strategy, targetCurves, analysis };
};

const initial = {
  locale: "zh-CN" as Locale,
  profileInput: null,
  profileResult: null,
  selectedSeedId: null,
  phase: "descent" as FlightPhase,
  source: null,
  deviceState: "disconnected" as DeviceConnectionState,
  deviceName: null,
  notice: null,
  isPlaying: false,
  playbackSpeed: 1 as 1 | 4,
  activeSessionId: null,
  pressureHistory: [],
  prediction: null,
  strategy: null,
  targetCurves: [],
  analysis: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setLocale: (locale) => set({ locale }),
      setPhase: (phase) => set({ phase }),
      setPlayback: (isPlaying) => set({ isPlaying }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setDevice: (deviceState, deviceName = null, notice = null) =>
        set({ deviceState, deviceName, notice }),
      loadSeedProfile: (profile) =>
        set((state) => ({
          profileInput: profile.input,
          selectedSeedId: profile.id,
          ...derive(profile.input, state.pressureHistory),
        })),
      setProfile: (profileInput) =>
        set((state) => ({
          profileInput,
          selectedSeedId: null,
          ...derive(profileInput, state.pressureHistory),
        })),
      appendPressureSample: (sample) =>
        set((state) => {
          if (
            state.pressureHistory.some(
              (item) =>
                item.sessionId === sample.sessionId &&
                item.timestamp === sample.timestamp,
            )
          ) {
            return state;
          }
          const pressureHistory = [
            ...state.pressureHistory,
            sample,
          ].slice(-360);
          void savePressureSample(sample).catch(() => undefined);

          return {
            pressureHistory,
            activeSessionId: sample.sessionId,
            source: sample.source,
            phase: sample.phase,
            ...derive(state.profileInput, pressureHistory),
          };
        }),
      replacePressureHistory: (samples) =>
        set((state) => {
          const pressureHistory = [...samples]
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-360);
          const latest = pressureHistory.at(-1);
          if (latest) {
            void savePressureSession({
              id: latest.sessionId,
              startedAt: pressureHistory[0].timestamp,
              source: latest.source,
            })
              .then(() =>
                Promise.all(
                  pressureHistory.map((sample) =>
                    savePressureSample(sample).catch(() => undefined),
                  ),
                ),
              )
              .catch(() => undefined);
          }

          return {
            pressureHistory,
            activeSessionId: latest?.sessionId ?? null,
            source: latest?.source ?? null,
            phase: latest?.phase ?? state.phase,
            ...derive(state.profileInput, pressureHistory),
          };
        }),
      resetSession: () =>
        set((state) => ({
          ...initial,
          locale: state.locale,
        })),
    }),
    {
      name: "aerobalance:settings:v1",
      partialize: (state) => ({
        locale: state.locale,
        profileInput: state.profileInput,
        selectedSeedId: state.selectedSeedId,
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
);

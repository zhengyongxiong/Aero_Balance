"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateEarProfile } from "@/lib/profile";
import { inferLiveFlightPhase } from "@/lib/live-flight";
import { predictPressure } from "@/lib/prediction";
import { composeAnalysisResult } from "@/lib/result";
import {
  loadSessionSamples,
  savePressureSample,
  savePressureSession,
} from "@/lib/storage";
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
  | "reconnecting"
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
  liveBaselinePressure: number | null;
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
  beginLiveSession(sessionId: string): void;
  appendPressureSample(sample: PressureSample): void;
  replacePressureHistory(samples: PressureSample[]): void;
  restoreSession(): Promise<void>;
  resetSession(): void;
}

const derive = (
  profileInput: EarProfileInput | null,
  pressureHistory: PressureSample[],
) => {
  const latest = pressureHistory.at(-1);
  const activeSamples = latest
    ? pressureHistory.filter((sample) => sample.sessionId === latest.sessionId)
    : [];
  const profileResult = profileInput ? calculateEarProfile(profileInput) : null;
  if (activeSamples.length < 3) {
    return {
      profileResult,
      prediction: null,
      strategy: null,
      targetCurves: [],
      analysis: null,
    };
  }

  const prediction = predictPressure(activeSamples);
  if (!profileResult) {
    return {
      profileResult: null,
      prediction,
      strategy: null,
      targetCurves: [],
      analysis: null,
    };
  }

  const phase = activeSamples.at(-1)?.phase ?? "demo";
  const strategy = createBilateralStrategy(
    profileResult,
    prediction.stressIndex,
    phase,
    prediction.trend,
  );
  const latestSample = activeSamples.at(-1)!;
  const forecastSamples: PressureSample[] = prediction.points
    .filter((point) => point.kind === "forecast")
    .map((point) => ({
      id: `forecast-${point.timestamp}`,
      sessionId: latestSample.sessionId,
      pressure: point.pressure,
      phase,
      timestamp: point.timestamp,
      source: latestSample.source,
    }));
  const targetCurves = createTargetCurves(
    [...activeSamples, ...forecastSamples],
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
  liveBaselinePressure: null,
  pressureHistory: [],
  prediction: null,
  strategy: null,
  targetCurves: [],
  analysis: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      beginLiveSession: (sessionId) => {
        const startedAt = Date.now();
        void savePressureSession({
          id: sessionId,
          startedAt,
          source: "bluetooth",
        }).catch(() => undefined);
        set({
          activeSessionId: sessionId,
          source: "bluetooth",
          phase: "landing",
          isPlaying: false,
          pressureHistory: [],
          liveBaselinePressure: null,
          prediction: null,
          strategy: null,
          targetCurves: [],
          analysis: null,
        });
      },
      appendPressureSample: (sample) =>
        set((state) => {
          const isNewSession = state.activeSessionId !== sample.sessionId;
          const currentHistory = isNewSession ? [] : state.pressureHistory;
          if (
            currentHistory.some(
              (item) =>
                item.id === sample.id ||
                (sample.sequence !== undefined &&
                  item.sequence === sample.sequence &&
                  item.deviceTimestamp === sample.deviceTimestamp),
            )
          ) {
            return state;
          }
          const liveBaselinePressure =
            sample.source === "bluetooth"
              ? isNewSession || state.liveBaselinePressure === null
                ? sample.pressure
                : state.liveBaselinePressure
              : null;
          const phase =
            sample.source === "bluetooth" && sample.devicePhase === "sensor"
              ? inferLiveFlightPhase(
                  [...currentHistory, sample],
                  liveBaselinePressure ?? sample.pressure,
                  isNewSession ? "landing" : state.phase,
                )
              : sample.phase;
          const normalizedSample = { ...sample, phase };
          const pressureHistory = [
            ...currentHistory,
            normalizedSample,
          ].slice(-360);
          void savePressureSample(normalizedSample).catch(() => undefined);

          return {
            pressureHistory,
            activeSessionId: sample.sessionId,
            source: sample.source,
            phase,
            liveBaselinePressure,
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
            liveBaselinePressure:
              latest?.source === "bluetooth"
                ? pressureHistory[0]?.pressure ?? null
                : null,
            ...derive(state.profileInput, pressureHistory),
          };
        }),
      restoreSession: async () => {
        const state = get();
        if (
          !state.activeSessionId ||
          state.pressureHistory.length > 0
        ) {
          return;
        }

        try {
          const samples = await loadSessionSamples(state.activeSessionId);
          if (samples.length === 0) return;

          set((current) => {
            const pressureHistory = samples.slice(-360);
            const latest = pressureHistory.at(-1)!;
            return {
              pressureHistory,
              source: latest.source,
              phase: latest.phase,
              liveBaselinePressure:
                latest.source === "bluetooth"
                  ? pressureHistory[0]?.pressure ?? null
                  : null,
              ...derive(current.profileInput, pressureHistory),
            };
          });
        } catch {
          set({
            notice:
              "Unable to restore the previous local pressure session.",
          });
        }
      },
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
        source: state.source,
        phase: state.phase,
      }),
    },
  ),
);

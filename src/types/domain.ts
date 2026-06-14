export type Locale = "zh-CN" | "en";
export type FlightPhase =
  | "takeoff"
  | "cruise"
  | "descent"
  | "landing"
  | "demo";
export type RiskLevel = "low" | "medium" | "high";
export type DataSource = "bluetooth" | "mock";
export type Congestion = "none" | "mild" | "noticeable";
export type FlightFrequency = "rare" | "occasional" | "frequent";

export interface PressureSample {
  id: string;
  sessionId: string;
  pressure: number;
  temperature?: number;
  battery?: number;
  phase: FlightPhase;
  timestamp: number;
  source: DataSource;
}

export interface EarProfileInput {
  age: number;
  congestion: Congestion;
  previousDiscomfort: number;
  equalizationAbility: number;
  leftSensitivity: number;
  rightSensitivity: number;
  flightFrequency: FlightFrequency;
}

export interface EarProfileResult {
  leftRisk: number;
  rightRisk: number;
  toleranceScore: number;
  adaptationSpeed: number;
  leftRadar: number[];
  rightRadar: number[];
}

export interface PredictionPoint {
  timestamp: number;
  pressure: number;
  kind: "history" | "forecast";
  minuteOffset: number;
}

export interface PredictionResult {
  points: PredictionPoint[];
  pressure5: number;
  pressure10: number;
  pressure15: number;
  slope: number;
  trend: "rising" | "stable" | "falling";
  confidence: number;
  stressIndex: number;
}

export interface EarStrategy {
  side: "left" | "right";
  riskScore: number;
  stressIndex: number;
  combinedBurden: number;
  level: 1 | 2 | 3 | 4 | 5;
  smoothingFactor: number;
  recommendationKey: RecommendationKey;
}

export interface BilateralStrategy {
  left: EarStrategy;
  right: EarStrategy;
  independent: boolean;
}

export interface TargetCurvePoint {
  timestamp: number;
  environmental: number;
  leftTarget: number;
  rightTarget: number;
  phase: FlightPhase;
}

export type RecommendationKey =
  | "recommendation.independent"
  | "recommendation.watchRate"
  | "recommendation.highSmoothing"
  | "recommendation.steady"
  | "recommendation.monitor"
  | "recommendation.gradualDescent";

export interface AnalysisResult {
  comfortScore: number;
  riskLevel: RiskLevel;
  leftBurden: number;
  rightBurden: number;
  recommendationKeys: RecommendationKey[];
}

export interface SeedProfile {
  id: "user-a" | "user-b" | "user-c";
  nameKey: "profile.seedA" | "profile.seedB" | "profile.seedC";
  input: EarProfileInput;
}

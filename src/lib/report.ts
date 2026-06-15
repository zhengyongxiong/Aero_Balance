import type {
  AnalysisResult,
  BilateralStrategy,
  EarProfileResult,
  Locale,
  PressureSample,
} from "@/types/domain";

export const PRINT_REPORT_KEY = "aerobalance:print-report:v1";

export interface AeroBalanceReport {
  version: 1;
  locale: Locale;
  generatedAt: number;
  profile: EarProfileResult;
  strategy: BilateralStrategy;
  analysis: AnalysisResult;
  pressure: {
    source: PressureSample["source"];
    phase: PressureSample["phase"];
    sampleCount: number;
    currentPressure: number;
  };
}

export function buildReport({
  locale,
  generatedAt,
  profile,
  strategy,
  analysis,
  samples,
}: {
  locale: Locale;
  generatedAt: number;
  profile: EarProfileResult;
  strategy: BilateralStrategy;
  analysis: AnalysisResult;
  samples: PressureSample[];
}): AeroBalanceReport {
  const latest = samples.at(-1);
  if (!latest) {
    throw new Error("REPORT_REQUIRES_PRESSURE_SAMPLES");
  }

  return {
    version: 1,
    locale,
    generatedAt,
    profile,
    strategy,
    analysis,
    pressure: {
      source: latest.source,
      phase: latest.phase,
      sampleCount: samples.length,
      currentPressure: latest.pressure,
    },
  };
}

export function savePrintReport(report: AeroBalanceReport): void {
  localStorage.setItem(PRINT_REPORT_KEY, JSON.stringify(report));
}

export function loadPrintReport(): AeroBalanceReport | null {
  const value = localStorage.getItem(PRINT_REPORT_KEY);
  localStorage.removeItem(PRINT_REPORT_KEY);
  if (!value) return null;

  try {
    const report = JSON.parse(value) as AeroBalanceReport;
    return report.version === 1 ? report : null;
  } catch {
    return null;
  }
}

import Image from "next/image";
import {
  AirplaneTilt,
  Gauge,
  HeartStraight,
  ShieldWarning,
} from "@phosphor-icons/react";
import type { FlightPhase, Locale, RiskLevel } from "@/types/domain";
import { translate } from "@/i18n/messages";

export function PressureSphere({
  pressure,
  comfort,
  risk,
  phase,
  locale,
}: {
  pressure: number;
  comfort: number;
  risk: RiskLevel;
  phase: FlightPhase;
  locale: Locale;
}) {
  const phaseKey = `phase.${phase}` as const;
  const riskKey = `risk.${risk}` as const;
  const metrics = [
    {
      label: translate(locale, "metric.comfort"),
      value: String(comfort),
      icon: HeartStraight,
      tone: "blue",
    },
    {
      label: translate(locale, "metric.risk"),
      value: translate(locale, riskKey),
      icon: ShieldWarning,
      tone: risk === "high" ? "red" : risk === "medium" ? "amber" : "green",
    },
    {
      label: translate(locale, "metric.phase"),
      value: translate(locale, phaseKey),
      icon: AirplaneTilt,
      tone: "blue",
    },
    {
      label: translate(locale, "metric.pressure"),
      value: `${pressure.toFixed(1)} kPa`,
      icon: Gauge,
      tone: "blue",
    },
  ] as const;

  return (
    <section className="instrument-panel" data-testid="pressure-sphere">
      <p className="instrument-panel__label">
        {translate(locale, "home.pressureSphere")}
      </p>
      <div className="pressure-sphere">
        <Image
          src="/assets/pressure-sphere.png"
          alt={translate(locale, "home.pressureSphere")}
          fill
          priority
          sizes="(max-width: 720px) 88vw, 520px"
        />
        <div className="pressure-sphere__value">
          <strong>{pressure.toFixed(1)}</strong>
          <span>kPa</span>
        </div>
      </div>
      <div className="instrument-metrics">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className={`instrument-metric tone-${tone}`}>
            <Icon size={24} weight="duotone" aria-hidden="true" />
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

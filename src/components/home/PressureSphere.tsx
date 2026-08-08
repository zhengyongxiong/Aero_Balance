import Image from "next/image";
import { AirplaneTilt } from "@phosphor-icons/react/AirplaneTilt";
import { Gauge } from "@phosphor-icons/react/Gauge";
import { HeartStraight } from "@phosphor-icons/react/HeartStraight";
import { ShieldWarning } from "@phosphor-icons/react/ShieldWarning";
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
  comfort: number | null;
  risk: RiskLevel | null;
  phase: FlightPhase;
  locale: Locale;
}) {
  const phaseKey = `phase.${phase}` as const;
  const unavailable = locale === "zh-CN" ? "需画像" : "Profile needed";
  const metrics = [
    {
      label: translate(locale, "metric.comfort"),
      value: comfort === null ? "--" : String(comfort),
      icon: HeartStraight,
      tone: "blue",
    },
    {
      label: translate(locale, "metric.risk"),
      value: risk === null ? unavailable : translate(locale, `risk.${risk}`),
      icon: ShieldWarning,
      tone:
        risk === "high"
          ? "red"
          : risk === "medium"
            ? "amber"
            : risk === "low"
              ? "green"
              : "blue",
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

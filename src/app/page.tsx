"use client";

import Image from "next/image";
import {
  AirplaneTilt,
  Bluetooth,
  ChartLineUp,
  Ear,
  Target,
  UserCircle,
} from "@phosphor-icons/react";
import { PressureSphere } from "@/components/home/PressureSphere";
import { ActionButton } from "@/components/ui/ActionButton";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

const stepIcons = [UserCircle, ChartLineUp, Ear, Target] as const;
const stepKeys = [
  ["home.profile", "home.profileShort"],
  ["home.predict", "home.predictShort"],
  ["home.decide", "home.decideShort"],
  ["home.adapt", "home.adaptShort"],
] as const;

export default function HomePage() {
  const locale = useAppStore((state) => state.locale);
  const analysis = useAppStore((state) => state.analysis);
  const phase = useAppStore((state) => state.phase);
  const latest = useAppStore((state) => state.pressureHistory.at(-1));
  const pressure = latest?.pressure ?? 78;
  const comfort = analysis?.comfortScore ?? 74;
  const risk = analysis?.riskLevel ?? "medium";

  return (
    <main className="home-page">
      <section className="flight-hero">
        <Image
          src="/assets/aircraft-cabin-daylight-v2.png"
          alt="日间高空飞机客舱"
          fill
          priority
          sizes="100vw"
          className="flight-hero__background"
        />
        <div className="flight-hero__veil" />
        <div className="flight-hero__content">
          <p className="flight-hero__eyebrow">
            <AirplaneTilt size={17} weight="fill" />
            Flight Experience Center
          </p>
          <h1>{translate(locale, "home.title")}</h1>
          <p>{translate(locale, "home.subtitle")}</p>
          <div className="flight-telemetry" aria-label="Descent pressure path">
            <span>
              36,000 ft <small>89.0 kPa</small>
            </span>
            <span>
              24,000 ft <small>84.5 kPa</small>
            </span>
            <span>
              12,000 ft <small>82.0 kPa</small>
            </span>
            <span className="is-current">
              2,000 ft <small>{pressure.toFixed(1)} kPa</small>
            </span>
          </div>
        </div>
      </section>

      <section className="home-instrument">
        <PressureSphere
          pressure={pressure}
          comfort={comfort}
          risk={risk}
          phase={phase}
          locale={locale}
        />
        <div className="home-actions">
          <ActionButton href="/profile" icon={AirplaneTilt}>
            {translate(locale, "action.startDemo")}
          </ActionButton>
          <ActionButton href="/flight" icon={AirplaneTilt} secondary>
            {locale === "zh-CN" ? "飞行模拟" : "Flight Simulator"}
          </ActionButton>
          <ActionButton href="/device" icon={Bluetooth} secondary>
            {translate(locale, "action.connect")}
          </ActionButton>
        </div>
        <ol className="value-chain">
          {stepKeys.map(([labelKey, shortKey], index) => {
            const Icon = stepIcons[index];
            return (
              <li key={labelKey}>
                <span className="value-chain__number">{index + 1}</span>
                <span className="value-chain__icon">
                  <Icon size={27} weight="duotone" />
                </span>
                <strong>{translate(locale, labelKey)}</strong>
                <small>{translate(locale, shortKey)}</small>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

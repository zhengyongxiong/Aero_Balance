"use client";

import Image from "next/image";
import { AirplaneTilt } from "@phosphor-icons/react/AirplaneTilt";
import { Bluetooth } from "@phosphor-icons/react/Bluetooth";
import { ChartLineUp } from "@phosphor-icons/react/ChartLineUp";
import { Ear } from "@phosphor-icons/react/Ear";
import { Target } from "@phosphor-icons/react/Target";
import { UserCircle } from "@phosphor-icons/react/UserCircle";
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
  const source = useAppStore((state) => state.source);
  const latest = useAppStore((state) => state.pressureHistory.at(-1));
  const isLive = source === "bluetooth";
  const pressure = latest?.pressure ?? (isLive ? 101.3 : 78);
  const comfort = analysis?.comfortScore ?? (isLive ? null : 74);
  const risk = analysis?.riskLevel ?? (isLive ? null : "medium");

  return (
    <main className="home-page">
      <section className="flight-hero">
        <Image
          src="/assets/aircraft-cabin-daylight-v2.png"
          alt={translate(locale, "home.cabinAlt")}
          fill
          priority
          sizes="100vw"
          className="flight-hero__background"
        />
        <div className="flight-hero__veil" />
        <div className="flight-hero__content">
          <p className="flight-hero__eyebrow">
            <AirplaneTilt size={17} weight="fill" />
            {translate(locale, "home.eyebrow")}
          </p>
          <h1>{translate(locale, "home.title")}</h1>
          <p>{translate(locale, "home.subtitle")}</p>
          {isLive ? (
            <div
              className="flight-telemetry"
              aria-label={locale === "zh-CN" ? "实时传感器数据" : "Live sensor data"}
            >
              <span>
                {locale === "zh-CN" ? "气压" : "Pressure"}
                <small>{pressure.toFixed(2)} kPa</small>
              </span>
              <span>
                {locale === "zh-CN" ? "温度" : "Temperature"}
                <small>{latest?.temperature?.toFixed(1) ?? "--"} °C</small>
              </span>
              <span>
                {locale === "zh-CN" ? "估算海拔" : "Altitude"}
                <small>{latest?.altitude?.toFixed(1) ?? "--"} m</small>
              </span>
              <span className="is-current">
                {locale === "zh-CN" ? "实时阶段" : "Live phase"}
                <small>{translate(locale, `phase.${phase}`)}</small>
              </span>
            </div>
          ) : (
            <div className="flight-telemetry" aria-label="Descent pressure path">
              <span>36,000 ft <small>89.0 kPa</small></span>
              <span>24,000 ft <small>84.5 kPa</small></span>
              <span>12,000 ft <small>82.0 kPa</small></span>
              <span className="is-current">2,000 ft <small>{pressure.toFixed(1)} kPa</small></span>
            </div>
          )}
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
            {isLive
              ? locale === "zh-CN"
                ? "选择个人画像"
                : "Select Ear Profile"
              : translate(locale, "action.startDemo")}
          </ActionButton>
          <ActionButton href="/flight" icon={AirplaneTilt} secondary>
            {isLive
              ? locale === "zh-CN"
                ? "查看实时飞行"
                : "View Live Flight"
              : translate(locale, "home.flightSimulator")}
          </ActionButton>
          <ActionButton href="/device" icon={Bluetooth} secondary>
            {isLive
              ? locale === "zh-CN"
                ? "查看设备数据"
                : "View Device Data"
              : translate(locale, "action.connect")}
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

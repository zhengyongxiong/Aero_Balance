"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ear } from "@phosphor-icons/react/Ear";
import { WifiHigh } from "@phosphor-icons/react/WifiHigh";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

const productLinks = [
  { href: "/", key: "nav.home" },
  { href: "/profile", key: "nav.profile" },
  { href: "/flight", key: "nav.flight" },
  { href: "/prediction", key: "nav.prediction" },
  { href: "/strategy", key: "nav.strategy" },
  { href: "/curve", key: "nav.curve" },
  { href: "/results", key: "nav.results" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const source = useAppStore((state) => state.source);
  const deviceState = useAppStore((state) => state.deviceState);
  const isLive = source === "bluetooth";
  const modeLabel = isLive
    ? locale === "zh-CN"
      ? deviceState === "connected"
        ? "正式模式 · 已连接"
        : deviceState === "scanning"
          ? "正式模式 · 连接中"
        : deviceState === "reconnecting"
          ? "正式模式 · 重连中"
          : deviceState === "failed"
            ? "正式模式 · 连接失败"
            : "正式模式 · 已断开"
      : deviceState === "connected"
        ? "Live Mode · Connected"
        : deviceState === "scanning"
          ? "Live Mode · Connecting"
        : deviceState === "reconnecting"
          ? "Live Mode · Reconnecting"
          : deviceState === "failed"
            ? "Live Mode · Failed"
            : "Live Mode · Disconnected"
    : translate(locale, "home.mode");

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link className="brand" href="/">
          <span className="brand__mark">
            <Ear size={26} weight="duotone" />
          </span>
          <span>
            <strong>AeroBalance</strong>
            <small>
              {(!isLive || deviceState === "connected") && (
                <WifiHigh size={12} weight="bold" />
              )}
              {modeLabel}
            </small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Product">
          {productLinks.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {translate(locale, key)}
            </Link>
          ))}
        </nav>
        <div className="language-switch" aria-label="Language">
          <button
            type="button"
            aria-label="中文"
            aria-pressed={locale === "zh-CN"}
            onClick={() => setLocale("zh-CN")}
          >
            中
          </button>
          <span aria-hidden="true" />
          <button
            type="button"
            aria-label="EN"
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}

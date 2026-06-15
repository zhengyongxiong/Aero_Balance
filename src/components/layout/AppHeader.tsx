"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ear, WifiHigh } from "@phosphor-icons/react";
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
  const isConnected = source === "mock" || deviceState === "connected";

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
              {isConnected ? (
                <>
                  <WifiHigh size={12} weight="bold" />
                  {source === "mock"
                    ? translate(locale, "home.mode")
                    : deviceState}
                </>
              ) : (
                translate(locale, "home.mode")
              )}
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

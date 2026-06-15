"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AirplaneTilt,
  ChartLineUp,
  House,
  Target,
} from "@phosphor-icons/react";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

const links = [
  { href: "/", key: "nav.home", icon: House },
  { href: "/flight", key: "nav.flight", icon: AirplaneTilt },
  { href: "/strategy", key: "nav.strategy", icon: ChartLineUp },
  { href: "/results", key: "nav.results", icon: Target },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const locale = useAppStore((state) => state.locale);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {links.map(({ href, key, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            href={href}
            key={href}
            aria-current={active ? "page" : undefined}
            className={`bottom-nav__item${
              active ? " bottom-nav__item--active" : ""
            }`}
          >
            <Icon size={21} weight={active ? "fill" : "regular"} />
            <span>{translate(locale, key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

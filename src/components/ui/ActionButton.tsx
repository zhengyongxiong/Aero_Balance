import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import type { ComponentType } from "react";

type AppIcon = ComponentType<{
  size?: number | string;
  weight?: "fill" | "regular" | "bold" | "duotone";
}>;

export function ActionButton({
  href,
  children,
  icon: Icon,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  icon?: AppIcon;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`action-button${secondary ? " action-button--secondary" : ""}`}
    >
      {Icon ? <Icon size={22} weight="fill" /> : null}
      <span>{children}</span>
      {!secondary ? <ArrowRight size={18} weight="bold" /> : null}
    </Link>
  );
}

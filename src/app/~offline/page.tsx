"use client";

import { CloudSlash } from "@phosphor-icons/react/dist/ssr";
import { translate } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

export default function OfflinePage() {
  const locale = useAppStore((state) => state.locale);

  return (
    <main className="offline-page">
      <CloudSlash size={52} weight="duotone" />
      <p>{translate(locale, "offline.badge")}</p>
      <h1>{translate(locale, "offline.title")}</h1>
      <span>{translate(locale, "offline.body")}</span>
    </main>
  );
}

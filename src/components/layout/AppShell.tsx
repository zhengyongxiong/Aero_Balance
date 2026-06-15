"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((state) => state.locale);
  const restoreSession = useAppStore((state) => state.restoreSession);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <div className="app-shell">
      <AppHeader />
      {children}
      <BottomNavigation />
    </div>
  );
}

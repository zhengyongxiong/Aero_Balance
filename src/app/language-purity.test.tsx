import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import HomePage from "./page";
import ProfilePage from "./profile/page";
import FlightPage from "./flight/page";
import PredictionPage from "./prediction/page";
import StrategyPage from "./strategy/page";
import CurvePage from "./curve/page";
import ResultsPage from "./results/page";
import DevicePage from "./device/page";
import OfflinePage from "./~offline/page";

const corePages: [string, ReactElement][] = [
  ["home", <HomePage />],
  ["profile", <ProfilePage />],
  ["flight", <FlightPage />],
  ["prediction", <PredictionPage />],
  ["strategy", <StrategyPage />],
  ["curve", <CurvePage />],
  ["results", <ResultsPage />],
  ["device", <DevicePage />],
  ["offline", <OfflinePage />],
];

const textNodeValues = (container: HTMLElement) => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const values: string[] = [];
  let node = walker.nextNode();

  while (node) {
    const value = node.textContent?.trim();
    if (value) values.push(value);
    node = walker.nextNode();
  }

  return values;
};

beforeEach(() => {
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore.getState().replacePressureHistory(
    createFlightSeed("language-purity").filter(
      (sample) => sample.phase === "descent",
    ),
  );
});

it.each(corePages)("keeps the English %s page free of Chinese copy", (_, page) => {
  useAppStore.getState().setLocale("en");
  const { container } = render(page);
  const accessibleCopy = Array.from(
    container.querySelectorAll<HTMLElement>("[aria-label], img[alt]"),
  )
    .flatMap((element) => [
      element.getAttribute("aria-label"),
      element.getAttribute("alt"),
    ])
    .filter(Boolean)
    .join("\n");

  expect(`${container.textContent}\n${accessibleCopy}`).not.toMatch(
    /[\u3400-\u9fff]/,
  );
});

it.each(corePages)(
  "does not render slash-separated bilingual labels on the Chinese %s page",
  (_, page) => {
    useAppStore.getState().setLocale("zh-CN");
    const { container } = render(page);
    const bilingualLabels = textNodeValues(container).filter(
      (value) =>
        /\s\/\s/.test(value) &&
        /[A-Za-z]/.test(value) &&
        /[\u3400-\u9fff]/.test(value),
    );

    expect(bilingualLabels).toEqual([]);
  },
);

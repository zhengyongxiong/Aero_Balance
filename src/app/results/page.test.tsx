import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import ResultsPage from "./page";

beforeEach(() => {
  localStorage.clear();
  useAppStore.getState().resetSession();
  useAppStore.getState().loadSeedProfile(seedProfiles[0]);
  useAppStore.getState().replacePressureHistory(
    createFlightSeed("results-test").filter(
      (sample) => sample.phase === "descent",
    ),
  );
});

it("stores the report before opening the dedicated print route", async () => {
  const user = userEvent.setup();
  const open = vi.spyOn(window, "open").mockImplementation(() => null);

  render(<ResultsPage />);
  await user.click(
    screen.getByRole("button", { name: "导出 PDF 报告" }),
  );

  expect(localStorage.getItem("aerobalance:print-report:v1")).not.toBeNull();
  expect(open).toHaveBeenCalledWith(
    "/report/print",
    "_blank",
    "noopener,noreferrer",
  );
});

it("restarts the demo and returns to the home route", async () => {
  const user = userEvent.setup();

  render(<ResultsPage />);
  const restart = screen.getByRole("link", { name: "重新开始" });

  expect(restart).toHaveAttribute("href", "/");
  await user.click(restart);

  expect(useAppStore.getState().analysis).toBeNull();
  expect(useAppStore.getState().pressureHistory).toHaveLength(0);
});

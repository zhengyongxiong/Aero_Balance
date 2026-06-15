import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import ProfilePage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("offers the three seed profiles when no profile is loaded", () => {
  render(<ProfilePage />);

  expect(screen.getByRole("button", { name: "用户 A" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "用户 B" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "用户 C" })).toBeInTheDocument();
});

it("loads a seed profile and exposes the next flight step", async () => {
  const user = (await import("@testing-library/user-event")).default.setup();

  render(<ProfilePage />);
  await user.click(screen.getByRole("button", { name: "用户 A" }));

  expect(screen.getAllByText(/左耳/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/右耳/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(/风险评分/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/Generated Outputs/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "继续" })).toHaveAttribute(
    "href",
    "/flight",
  );

  const state = useAppStore.getState();
  expect(state.profileResult).not.toBeNull();
  expect(state.selectedSeedId).toBe("user-a");
});

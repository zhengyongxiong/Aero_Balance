import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("switches shell labels and document language to English", async () => {
  render(
    <AppShell>
      <p>content</p>
    </AppShell>,
  );

  await userEvent.click(screen.getByRole("button", { name: "EN" }));

  expect(screen.getByRole("navigation", { name: "Primary" })).toHaveTextContent(
    "Home",
  );
  expect(screen.getByRole("navigation", { name: "Product" })).toHaveTextContent(
    "Profile",
  );
  expect(
    within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
      "link",
      { name: "Home" },
    ),
  ).toHaveClass("bottom-nav__item--active");
  expect(document.documentElement.lang).toBe("en");
});

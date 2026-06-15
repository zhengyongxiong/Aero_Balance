import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import DevicePage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("offers a hardware-free path that prepares the descent demo", async () => {
  const user = userEvent.setup();
  render(<DevicePage />);

  expect(
    screen.getByRole("heading", { name: "设备连接" }),
  ).toBeInTheDocument();

  const mockLink = screen.getByRole("link", { name: "使用模拟数据" });
  expect(mockLink).toHaveAttribute("href", "/flight");
  mockLink.addEventListener("click", (event) => event.preventDefault());

  await user.click(mockLink);

  const state = useAppStore.getState();
  expect(state.selectedSeedId).toBe("user-a");
  expect(state.pressureHistory.length).toBeGreaterThan(0);
  expect(
    state.pressureHistory.every((sample) => sample.phase === "descent"),
  ).toBe(true);
});

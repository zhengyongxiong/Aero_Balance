import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import HomePage from "./page";

beforeEach(() => {
  useAppStore.getState().resetSession();
});

it("renders the Quiet Instrument flight experience", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", {
      name: /面向环境压力梯度变化的耳膜动态调控与保护系统/i,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /高空下降飞行环境/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /压力球 pressure sphere/i }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("pressure-sphere")).toHaveTextContent("78.0");
  expect(screen.getByTestId("pressure-sphere")).toHaveTextContent("kPa");
  expect(screen.getByText("舒适度评分")).toBeInTheDocument();
  expect(screen.getByText("风险等级")).toBeInTheDocument();
  expect(screen.getByText("当前飞行阶段")).toBeInTheDocument();
  expect(screen.getByText("当前环境压力")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /开始演示/i })).toHaveAttribute(
    "href",
    "/profile",
  );
  expect(screen.getByRole("link", { name: /连接设备/i })).toHaveAttribute(
    "href",
    "/device",
  );
});

it("states the full four-step value chain", () => {
  render(<HomePage />);

  expect(screen.getByText("个体画像")).toBeInTheDocument();
  expect(screen.getByText("压力预测")).toBeInTheDocument();
  expect(screen.getByText("双耳决策")).toBeInTheDocument();
  expect(screen.getByText("目标曲线")).toBeInTheDocument();
});

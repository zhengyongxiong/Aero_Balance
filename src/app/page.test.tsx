import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HomePage from "./page";

it("identifies the aviation pressure experience immediately", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", {
      name: /面向环境压力梯度变化的耳膜动态调控与保护系统/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/kPa/i)).toBeInTheDocument();
  expect(screen.getByText(/下降|descent/i)).toBeInTheDocument();
});

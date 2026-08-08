import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ValveControlPanel } from "./ValveControlPanel";

describe("ValveControlPanel", () => {
  it("sends fixed-duration left and stop commands", async () => {
    const user = userEvent.setup();
    const onPulse = vi.fn(async () => undefined);
    const onStop = vi.fn(async () => undefined);

    render(
      <ValveControlPanel
        locale="zh-CN"
        connected
        pending={false}
        leftOpen={false}
        rightOpen={false}
        lastAck={null}
        onPulse={onPulse}
        onStop={onStop}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "左阀脉冲 250 ms" }),
    );
    expect(onPulse).toHaveBeenCalledWith("left", 250);

    await user.click(screen.getByRole("button", { name: "全部关闭" }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("blocks pulses while pending but keeps stop available", () => {
    render(
      <ValveControlPanel
        locale="zh-CN"
        connected
        pending
        leftOpen
        rightOpen={false}
        lastAck={null}
        onPulse={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "左阀脉冲 250 ms" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "全部关闭" })).toBeEnabled();
  });

  it("disables all controls while disconnected", () => {
    render(
      <ValveControlPanel
        locale="en"
        connected={false}
        pending={false}
        leftOpen={false}
        rightOpen={false}
        lastAck={null}
        onPulse={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Left valve pulse 250 ms" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close both valves" })).toBeDisabled();
  });
});

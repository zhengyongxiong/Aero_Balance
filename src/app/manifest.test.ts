import { expect, it } from "vitest";
import manifest from "./manifest";

it("defines an installable standalone AeroBalance app", () => {
  const value = manifest();

  expect(value.display).toBe("standalone");
  expect(value.start_url).toBe("/");
  expect(value.background_color).toBe("#dff3ff");
  expect(value.theme_color).toBe("#2a91d6");
  expect(value.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512" }),
    ]),
  );
});

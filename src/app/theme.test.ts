import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("uses the daylight aviation color system", () => {
  const css = readFileSync("src/app/globals.css", "utf8");

  expect(css).toContain("--surface-page: #dff3ff;");
  expect(css).toContain("--surface-panel: rgba(255, 255, 255, 0.78);");
  expect(css).toContain("--color-aviation-blue: #1677b8;");
  expect(css).toContain("color-scheme: light;");
});

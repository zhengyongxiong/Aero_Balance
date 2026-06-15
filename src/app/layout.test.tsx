import { expect, it } from "vitest";
import RootLayout from "./layout";

it("allows browser extensions to add attributes before hydration", () => {
  const root = RootLayout({ children: <main /> });

  expect(root.props.suppressHydrationWarning).toBe(true);
});

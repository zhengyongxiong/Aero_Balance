import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/device",
  "/profile",
  "/flight",
  "/prediction",
  "/strategy",
  "/curve",
  "/results",
];

for (const route of routes) {
  test(`${route} has no horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);
  });
}

test("mobile header does not cover page content", async ({ page }) => {
  await page.goto("/flight");

  const layout = await page.evaluate(() => {
    const header = document.querySelector(".app-header")!.getBoundingClientRect();
    const inner = document
      .querySelector(".app-header__inner")!
      .getBoundingClientRect();
    const heading = document.querySelector("h1")!.getBoundingClientRect();

    return {
      headerBottom: header.bottom,
      innerBottom: inner.bottom,
      headingTop: heading.top,
    };
  });

  expect(layout.innerBottom).toBeLessThanOrEqual(layout.headerBottom);
  expect(layout.headingTop).toBeGreaterThanOrEqual(layout.headerBottom);
});

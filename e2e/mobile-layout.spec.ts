import { expect, test } from "@playwright/test";

const NARROW_MOBILE_VIEWPORT = { width: 390, height: 844 };

const expectNoHorizontalOverflow = async (
  page: import("@playwright/test").Page,
) => {
  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    rootWidth: document.documentElement.scrollWidth,
    containerWidth:
      document.querySelector(".page-container")?.getBoundingClientRect().width ??
      null,
  }));

  expect(layout.rootWidth).toBeLessThanOrEqual(layout.viewportWidth);
  if (layout.containerWidth !== null && layout.viewportWidth <= 480) {
    expect(layout.containerWidth).toBeGreaterThanOrEqual(
      layout.viewportWidth - 1,
    );
  }
};

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
    await expectNoHorizontalOverflow(page);
  });
}

test("flight fits a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize(NARROW_MOBILE_VIEWPORT);
  await page.goto("/flight");

  await expectNoHorizontalOverflow(page);
});

test("populated results fit a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize(NARROW_MOBILE_VIEWPORT);
  await page.goto("/");
  await page.getByRole("link", { name: "开始演示" }).click();
  await page.getByRole("button", { name: "用户 A" }).click();
  await page.getByRole("link", { name: "继续" }).click();
  await page.getByRole("link", { name: "继续" }).click();
  await page.getByRole("link", { name: "继续" }).click();
  await page.getByRole("link", { name: "继续" }).click();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", { name: "AeroBalance 健康报告" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

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

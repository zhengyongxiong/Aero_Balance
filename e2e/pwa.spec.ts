import { expect, test } from "@playwright/test";

test("service worker controls the app and serves the offline fallback", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();

  const controlled = await page.evaluate(
    () => navigator.serviceWorker.controller !== null,
  );
  expect(controlled).toBe(true);

  await context.setOffline(true);
  await page.goto("/offline-probe");
  await expect(
    page.getByRole("heading", { name: "演示资源暂不可用" }),
  ).toBeVisible();
  await context.setOffline(false);
});

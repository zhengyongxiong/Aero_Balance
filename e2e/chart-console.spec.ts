import { expect, test } from "@playwright/test";

test("responsive charts mount without non-positive dimension warnings", async ({
  page,
}) => {
  const chartWarnings: string[] = [];

  page.on("console", (message) => {
    const text = message.text();
    if (text.includes("width(-1)") || text.includes("height(-1)")) {
      chartWarnings.push(text);
    }
  });

  await page.goto("/profile");
  await page.getByRole("button", { name: "用户 A" }).click();
  await expect(page.getByRole("application")).toBeVisible();

  expect(chartWarnings).toEqual([]);
});

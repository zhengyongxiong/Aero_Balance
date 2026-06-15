import { expect, test } from "@playwright/test";

test("User A completes the full hardware-free exhibition flow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "开始演示" }).click();

  await page.getByRole("button", { name: "用户 A" }).click();
  await expect(page.getByText(/Generated Outputs/i)).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(page.getByRole("heading", { name: "飞行" })).toBeVisible();
  await page.getByRole("button", { name: "下降" }).click();
  await expect(page.getByTestId("pressure-sphere")).toContainText("kPa");
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Pressure Prediction / 压力预测",
    }),
  ).toBeVisible();
  await expect(page.getByText("30 sec")).toBeVisible();
  await expect(page.getByText("60 sec")).toBeVisible();
  await expect(page.getByText("90 sec")).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Bilateral Adaptation / 双耳适应策略",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Target Pressure Curve / 目标压力曲线",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", { name: "AeroBalance Health Report" }),
  ).toBeVisible();
  await expect(page.getByText("舒适度 / 100")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "导出 PDF 报告" }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^aerobalance-report-.*\.json$/,
  );

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "导出 PDF 报告" }).click();
  const report = await popupPromise;
  await expect(
    report.getByRole("heading", { name: "AeroBalance Analysis Report" }),
  ).toBeVisible();
  await expect(report.getByText("舒适度评分")).toBeVisible();
  await expect(report.getByText(/风险等级:/)).toBeVisible();
  await report.close();
});

test("device route falls back to the complete mock simulator", async ({
  page,
}) => {
  await page.goto("/device");
  await expect(
    page.getByRole("heading", { name: "设备连接" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "使用模拟数据" }).click();

  await expect(page).toHaveURL(/\/flight$/);
  await expect(page.getByTestId("pressure-sphere")).toContainText("kPa");
});

test("language selection survives route navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "EN" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Dynamic Tympanic Pressure Regulation and Protection System",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Start Demo" }).click();

  await expect(
    page.getByRole("heading", { name: "Personal Ear Profile" }),
  ).toBeVisible();
});

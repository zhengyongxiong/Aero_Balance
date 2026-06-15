import { expect, test } from "@playwright/test";

const expectEnglishContent = async (page: import("@playwright/test").Page) => {
  const content = await page
    .locator(".app-shell > :not(.app-header):not(.bottom-nav)")
    .allInnerTexts();
  const accessibleCopy = await page
    .locator(
      ".app-shell > :not(.app-header):not(.bottom-nav) [aria-label], .app-shell > :not(.app-header):not(.bottom-nav) img[alt]",
    )
    .evaluateAll((elements) =>
      elements
        .flatMap((element) => [
          element.getAttribute("aria-label"),
          element.getAttribute("alt"),
        ])
        .filter(Boolean)
        .join("\n"),
    );

  expect(`${content.join("\n")}\n${accessibleCopy}`).not.toMatch(
    /[\u3400-\u9fff]/,
  );
};

test("User A completes the full hardware-free exhibition flow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "开始演示" }).click();

  await page.getByRole("button", { name: "用户 A" }).click();
  await expect(page.getByText("画像输出")).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(page.getByRole("heading", { name: "飞行" })).toBeVisible();
  await page.getByRole("button", { name: "下降" }).click();
  await expect(page.getByTestId("pressure-sphere")).toContainText("kPa");
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", {
      name: "压力预测",
    }),
  ).toBeVisible();
  await expect(page.getByText("30 秒", { exact: true })).toBeVisible();
  await expect(page.getByText("60 秒", { exact: true })).toBeVisible();
  await expect(page.getByText("90 秒", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", {
      name: "双耳适应策略",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", {
      name: "目标压力曲线",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "继续" }).click();

  await expect(
    page.getByRole("heading", { name: "AeroBalance 健康报告" }),
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
    report.getByRole("heading", { name: "AeroBalance 分析报告" }),
  ).toBeVisible();
  await expect(report.getByText("舒适度评分")).toBeVisible();
  await expect(report.getByText(/风险等级:/)).toBeVisible();
  await report.close();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "AeroBalance 健康报告" }),
  ).toBeVisible();
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

test("English stays consistent across the full user journey", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "EN" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Dynamic Tympanic Pressure Regulation and Protection System",
    }),
  ).toBeVisible();
  await expectEnglishContent(page);

  await page.getByRole("link", { name: "Start Demo" }).click();

  await expect(
    page.getByRole("heading", { name: "Personal Ear Profile" }),
  ).toBeVisible();
  await expectEnglishContent(page);

  await page.getByRole("button", { name: "User A" }).click();
  await expect(page.getByText("Generated Outputs")).toBeVisible();
  await expectEnglishContent(page);
  await page.getByRole("link", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Flight" })).toBeVisible();
  await expectEnglishContent(page);
  await page.getByRole("button", { name: "Descent" }).click();
  await page.getByRole("button", { name: "Pause simulator" }).click();
  await page.getByRole("link", { name: "Continue" }).press("Enter");

  await expect(
    page.getByRole("heading", { name: "Pressure Prediction" }),
  ).toBeVisible();
  await expectEnglishContent(page);
  await page.getByRole("link", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Bilateral Adaptation Strategy" }),
  ).toBeVisible();
  await expectEnglishContent(page);
  await page.getByRole("link", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Target Pressure Curve" }),
  ).toBeVisible();
  await expectEnglishContent(page);
  await page.getByRole("link", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "AeroBalance Health Report" }),
  ).toBeVisible();
  await expectEnglishContent(page);
});

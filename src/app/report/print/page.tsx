"use client";

import { useEffect, useState } from "react";
import { loadPrintReport, type AeroBalanceReport } from "@/lib/report";
import { translate, translateRecommendation } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";

export default function PrintReportPage() {
  const [report, setReport] = useState<AeroBalanceReport | null>(null);
  const fallbackLocale = useAppStore((state) => state.locale);

  useEffect(() => {
    const loaded = loadPrintReport();
    setReport(loaded);
    const timer = loaded
      ? window.setTimeout(() => window.print(), 400)
      : undefined;

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (!report) {
    return (
      <main className="print-report">
        <h1>{translate(fallbackLocale, "results.printTitle")}</h1>
        <p>{translate(fallbackLocale, "results.noPrintReport")}</p>
      </main>
    );
  }

  const isChinese = report.locale === "zh-CN";

  return (
    <main className="print-report">
      <header>
        <p>AeroBalance</p>
        <h1>{translate(report.locale, "results.printTitle")}</h1>
        <span>
          {new Date(report.generatedAt).toLocaleString(report.locale)}
        </span>
      </header>

      <section className="print-report__score">
        <strong>{report.analysis.comfortScore}</strong>
        <span>{translate(report.locale, "metric.comfort")}</span>
      </section>

      <h2>
        {translate(report.locale, "metric.risk")}:{" "}
        {translate(report.locale, `risk.${report.analysis.riskLevel}`)}
      </h2>

      <table>
        <thead>
          <tr>
            <th>{isChinese ? "耳侧" : "Ear"}</th>
            <th>{isChinese ? "风险" : "Risk"}</th>
            <th>{isChinese ? "适应等级" : "Level"}</th>
            <th>{isChinese ? "平滑系数" : "Smoothing"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{isChinese ? "左耳" : "Left"}</td>
            <td>{report.profile.leftRisk.toFixed(0)}</td>
            <td>{report.strategy.left.level}</td>
            <td>{report.strategy.left.smoothingFactor.toFixed(2)}</td>
          </tr>
          <tr>
            <td>{isChinese ? "右耳" : "Right"}</td>
            <td>{report.profile.rightRisk.toFixed(0)}</td>
            <td>{report.strategy.right.level}</td>
            <td>{report.strategy.right.smoothingFactor.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <section>
        <h2>{isChinese ? "适应建议" : "Adaptation Recommendations"}</h2>
        <ul>
          {report.analysis.recommendationKeys.map((key) => (
            <li key={key}>{translateRecommendation(report.locale, key)}</li>
          ))}
        </ul>
      </section>

      <footer>{translate(report.locale, "disclaimer")}</footer>
    </main>
  );
}

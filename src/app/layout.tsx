import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroBalance",
  description: "Dynamic Tympanic Pressure Regulation and Protection System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

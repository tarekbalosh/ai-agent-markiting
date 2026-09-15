import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "CoreLogic AI Agent - لوحة التحكم",
  description:
    "لوحة الإشراف على الوكيل التسويقي الذكي المستقل لـ CoreLogic Systems",
  keywords: "CoreLogic, AI Agent, Marketing Automation, لوحة تحكم",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}

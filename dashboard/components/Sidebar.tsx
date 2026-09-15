"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    section: "الرئيسية",
    items: [
      { href: "/", label: "لوحة التحكم", icon: "🏠" },
    ],
  },
  {
    section: "الوكيل",
    items: [
      { href: "/logs", label: "سجل النشاط", icon: "📋" },
      { href: "/content", label: "المحتوى المولد", icon: "✍️" },
      { href: "/tasks", label: "المهام", icon: "⚙️" },
    ],
  },
  {
    section: "الإدارة",
    items: [
      { href: "/settings", label: "الإعدادات", icon: "🔧" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">CoreLogic</div>
        <div className="logo-sub">AI Marketing Agent</div>
      </div>

      <nav className="nav-section">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-label">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--color-border)",
          fontSize: "12px",
          color: "var(--color-text-muted)",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <span style={{ color: "var(--color-accent-green)" }}>●</span>{" "}
          الوكيل نشط
        </div>
        <div>CoreLogic Systems © 2026</div>
      </div>
    </aside>
  );
}

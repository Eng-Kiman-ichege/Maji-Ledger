"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "⊞" },
  { href: "/dashboard/properties", label: "Properties", icon: "🏘️" },
  { href: "/dashboard/meters", label: "Meters", icon: "💧" },
  { href: "/dashboard/payments", label: "Transactions", icon: "💳" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: "rgba(15,23,42,0.95)",
        borderRight: "1px solid rgba(148,163,184,0.08)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "20px 20px 24px",
          textDecoration: "none",
          borderBottom: "1px solid rgba(148,163,184,0.08)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          💧
        </div>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "-0.5px",
          }}
        >
          <span className="gradient-text">Maji</span>{" "}
          <span style={{ color: "var(--color-text-primary)" }}>Ledger</span>
        </span>
      </Link>

      {/* Section label */}
      <div
        style={{
          padding: "16px 20px 8px",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--color-text-dim)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Management
      </div>

      {/* Nav links */}
      <nav style={{ padding: "0 12px", flex: 1 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                background: isActive ? "rgba(14,165,233,0.1)" : "transparent",
                border: isActive ? "1px solid rgba(14,165,233,0.15)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(148,163,184,0.08)",
          fontSize: 11,
          color: "var(--color-text-dim)",
        }}
      >
        Maji Ledger · Phase 1
      </div>
    </aside>
  );
}

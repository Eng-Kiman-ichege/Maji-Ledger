"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Gauge,
  Receipt,
  QrCode,
  UserCheck,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const isOwnerSection = pathname.startsWith("/dashboard/owner");

  const adminNavItems = [
    { href: "/dashboard", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/dashboard/properties", label: "Properties Portfolio", icon: Building2 },
    { href: "/dashboard/meters", label: "Smart Water Meters", icon: Gauge },
    { href: "/dashboard/payments", label: "Transactions & Tokens", icon: Receipt },
    { href: "/dashboard/qr-analytics", label: "QR Traceability", icon: QrCode },
  ];

  const ownerNavItems = [
    { href: "/dashboard/owner", label: "My Property Overview", icon: LayoutDashboard },
    { href: "/dashboard/properties", label: "View All Properties", icon: Building2 },
    { href: "/dashboard/meters", label: "My Water Meters", icon: Gauge },
    { href: "/dashboard/payments", label: "Tenant Payments", icon: Receipt },
  ];

  const currentNav = isOwnerSection ? ownerNavItems : adminNavItems;

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        boxShadow: "1px 0 3px 0 rgba(15, 23, 42, 0.03)",
        zIndex: 40,
      }}
    >
      {/* Brand Header */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "22px 20px 20px",
          textDecoration: "none",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#ffffff",
            boxShadow: "0 2px 8px -1px rgba(2, 132, 199, 0.4)",
            flexShrink: 0,
          }}
        >
          💧
        </div>
        <div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.5px",
              display: "block",
              lineHeight: 1.1,
            }}
          >
            <span className="gradient-text">Maji</span>{" "}
            <span style={{ color: "#0f172a" }}>Ledger</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Water Billing Platform
          </span>
        </div>
      </Link>

      {/* Role Switcher Pill */}
      <div style={{ padding: "16px 16px 8px" }}>
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: "4px",
            border: "1px solid #e2e8f0",
            display: "flex",
            gap: 4,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              color: !isOwnerSection ? "#0284c7" : "#64748b",
              background: !isOwnerSection ? "#ffffff" : "transparent",
              boxShadow: !isOwnerSection ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
              border: !isOwnerSection ? "1px solid #e2e8f0" : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </Link>

          <Link
            href="/dashboard/owner"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              color: isOwnerSection ? "#059669" : "#64748b",
              background: isOwnerSection ? "#ffffff" : "transparent",
              boxShadow: isOwnerSection ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
              border: isOwnerSection ? "1px solid #e2e8f0" : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            <UserCheck size={14} />
            <span>Owner</span>
          </Link>
        </div>
      </div>

      {/* Active Role Indicator */}
      <div
        style={{
          padding: "8px 20px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {isOwnerSection ? "Property Owner View" : "Portfolio Administration"}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: isOwnerSection ? "#ecfdf5" : "#f0f9ff",
            color: isOwnerSection ? "#047857" : "#0369a1",
          }}
        >
          {isOwnerSection ? "OWNER" : "ADMIN"}
        </span>
      </div>

      {/* Navigation links */}
      <nav style={{ padding: "0 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {currentNav.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/dashboard/owner"
              ? pathname === "/dashboard/owner"
              : pathname.startsWith(item.href);

          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 12px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#0284c7" : "#334155",
                background: isActive ? "#f0f9ff" : "transparent",
                border: isActive ? "1px solid #bae6fd" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <IconComponent
                size={17}
                color={isActive ? "#0284c7" : "#64748b"}
                style={{ flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#0284c7",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick link to Scan to Pay demo */}
      <div style={{ padding: "16px 14px", borderTop: "1px solid #f1f5f9" }}>
        <Link
          href="/pay/demo-token"
          target="_blank"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            fontSize: 12,
            color: "#334155",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>📱</span>
            <span>Scan-to-Pay Portal</span>
          </div>
          <ExternalLink size={13} color="#94a3b8" />
        </Link>

        {/* User profile avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            padding: "6px 4px 0",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#e0f2fe",
              border: "1px solid #bae6fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#0369a1",
            }}
          >
            {isOwnerSection ? "PO" : "AD"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isOwnerSection ? "Property Owner" : "Maji Administrator"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {isOwnerSection ? "Owner Portal" : "Admin Console"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

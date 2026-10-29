"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Gauge,
  Receipt,
  QrCode,
  Users,
  LogOut,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isOwner, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const adminNavItems = [
    { href: "/dashboard", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/dashboard/properties", label: "Properties Portfolio", icon: Building2 },
    { href: "/dashboard/meters", label: "Smart Water Meters", icon: Gauge },
    { href: "/dashboard/payments", label: "Transactions & Tokens", icon: Receipt },
    { href: "/dashboard/qr-analytics", label: "QR Traceability", icon: QrCode },
    { href: "/dashboard/users", label: "User Management", icon: Users },
  ];

  const ownerNavItems = [
    { href: "/dashboard/owner", label: "My Property Overview", icon: LayoutDashboard },
    { href: "/dashboard/properties", label: "My Properties", icon: Building2 },
    { href: "/dashboard/meters", label: "Water Consumption", icon: Gauge },
    { href: "/dashboard/payments", label: "Revenue & Earnings", icon: Receipt },
  ];

  const currentNav = isOwner ? ownerNavItems : adminNavItems;
  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : isAdmin
    ? "AD"
    : "PO";

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
        href={isOwner ? "/dashboard/owner" : "/dashboard"}
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

      {/* Role Badge Indicator (No switcher button) */}
      <div
        style={{
          padding: "16px 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isOwner ? (
            <UserCheck size={16} color="#059669" />
          ) : (
            <ShieldCheck size={16} color="#0284c7" />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {isOwner ? "Owner Portal" : "Admin Console"}
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: isOwner ? "#ecfdf5" : "#f0f9ff",
            color: isOwner ? "#047857" : "#0369a1",
            border: isOwner ? "1px solid #a7f3d0" : "1px solid #bae6fd",
          }}
        >
          {user?.role ? user.role.toUpperCase() : isAdmin ? "ADMIN" : "OWNER"}
        </span>
      </div>

      {/* Navigation links */}
      <nav
        style={{
          padding: "12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {currentNav.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/dashboard/owner"
              ? pathname === "/dashboard/owner"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

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

      {/* Quick link & User Profile Bar */}
      <div style={{ padding: "16px 14px", borderTop: "1px solid #f1f5f9" }}>
        <Link
          href="/pay/demo-token"
          target="_blank"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 12px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            fontSize: 12,
            color: "#334155",
            fontWeight: 600,
            marginBottom: 14,
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>📱</span>
            <span>Scan-to-Pay Demo</span>
          </div>
          <ExternalLink size={13} color="#94a3b8" />
        </Link>

        {/* User profile & Logout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 6px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: isOwner ? "#d1fae5" : "#e0f2fe",
              border: isOwner ? "1px solid #a7f3d0" : "1px solid #bae6fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: isOwner ? "#047857" : "#0369a1",
              flexShrink: 0,
            }}
          >
            {userInitials}
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
              title={user?.fullName || "User"}
            >
              {user?.fullName || "Maji User"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={user?.email || ""}
            >
              {user?.email || "Signed in"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "#fee2e2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Droplets,
  Wrench,
  FileSpreadsheet,
  Receipt,
  Bell,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/landlord", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/landlord/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/landlord/buildings", label: "Buildings", icon: Building2 },
  { href: "/dashboard/landlord/apartments", label: "Apartments", icon: Building2 },
  { href: "/dashboard/landlord/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/landlord/rent", label: "Rent Collections", icon: CreditCard },
  { href: "/dashboard/landlord/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/landlord/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/dashboard/landlord/statements", label: "Statements", icon: Receipt },
  { href: "/dashboard/landlord/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/landlord/profile", label: "Profile", icon: User },
];

export default function LandlordLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", width: "100%" }}>
      {/* Top Secondary Navigation Header */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard/landlord"
                ? pathname === "/dashboard/landlord"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#0284c7" : "#64748b",
                  background: isActive ? "#f0f9ff" : "transparent",
                  border: isActive ? "1px solid #bae6fd" : "1px solid transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: 24, flex: 1, background: "#f8fafc" }}>
        {children}
      </div>
    </div>
  );
}

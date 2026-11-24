"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Droplets,
  Wrench,
  User,
} from "lucide-react";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/tenant", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tenant/tenancy", label: "Tenancy & Lease", icon: FileText },
    { href: "/dashboard/tenant/rent", label: "Rent & Payments", icon: CreditCard },
    { href: "/dashboard/tenant/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/dashboard/tenant/profile", label: "My Profile", icon: User },
  ];

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Top Banner / Tab Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 16,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#0284c7",
              background: "#e0f2fe",
              padding: "3px 8px",
              borderRadius: 6,
              marginBottom: 6,
            }}
          >
            Tenant Self-Service Portal
          </span>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Resident Hub
          </h1>
        </div>

        {/* Sub-nav Pills */}
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/dashboard/tenant"
                ? pathname === "/dashboard/tenant"
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  background: isActive ? "#0284c7" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  border: isActive ? "1px solid #0284c7" : "1px solid #e2e8f0",
                  boxShadow: isActive
                    ? "0 2px 4px rgba(2, 132, 199, 0.2)"
                    : "0 1px 2px rgba(0, 0, 0, 0.03)",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}

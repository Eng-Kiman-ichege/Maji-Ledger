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
  Home,
  FileText,
  TrendingDown,
  CreditCard,
  BarChart3,
  Droplets,
  Activity,
  RefreshCw,
  Wrench,
  Bell,
  User,
  Sliders,
  AlertTriangle,
  Zap,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { PlatformSuite } from "@/contexts/AuthContext";

export interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ mobileOpen = false, onClose }: DashboardSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isOwner, isTenant, activeSuite, setActiveSuite, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isWaterRoute =
    pathname.startsWith("/dashboard/water") ||
    pathname === "/dashboard/landlord/water" ||
    pathname === "/dashboard/tenant/water";

  const effectiveSuite: PlatformSuite = isWaterRoute ? "water" : activeSuite;
  const isProperty = effectiveSuite === "property";

  const handleSwitchSuite = (targetSuite: PlatformSuite) => {
    setActiveSuite(targetSuite);
    if (targetSuite === "property") {
      router.push(isOwner ? "/dashboard/landlord" : isTenant ? "/dashboard/tenant" : "/dashboard");
    } else {
      router.push(isOwner ? "/dashboard/landlord/water" : isTenant ? "/dashboard/tenant/water" : "/dashboard/water");
    }
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  // ── Colors ──
  const brandPrimary = isProperty ? "#6366f1" : "#0284c7";
  const brandDark = isProperty ? "#4f46e5" : "#0369a1";
  const brandBg = isProperty
    ? "linear-gradient(180deg, #1e1b4b 0%, #2d2a7a 40%, #3730a3 100%)"
    : "linear-gradient(180deg, #082f49 0%, #0c4a6e 40%, #075985 100%)";

  // ── Nav groups ──
  const propertyGeneralItems = [
    { href: "/dashboard", label: "Property Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/properties", label: "Properties Portfolio", icon: Building2 },
    { href: "/dashboard/landlord", label: "Landlord Portal", icon: Home },
    ...(!isOwner ? [{ href: "/dashboard/users", label: "User Management", icon: Users }] : []),
  ];
  const rentLedgerItems = [
    { href: "/dashboard/rent", label: "Rent Dashboard", icon: Home },
    { href: "/dashboard/rent/charges", label: "Invoicing & Charges", icon: FileText },
    { href: "/dashboard/rent/payments", label: "Record Payment", icon: CreditCard },
    { href: "/dashboard/rent/arrears", label: "Arrears Aging", icon: TrendingDown },
    { href: "/dashboard/rent/statements", label: "Rent Statements", icon: BarChart3 },
  ];
  const adminControlItems = [
    { href: "/dashboard/admin", label: "Admin Control Centre", icon: ShieldCheck },
    { href: "/dashboard/admin/settings", label: "System Parameters", icon: Sliders },
    { href: "/dashboard/admin/audit", label: "Audit Trail", icon: Activity },
  ];
  const reconciliationItems = [
    { href: "/dashboard/finance/reconciliation", label: "Financial Reconciliation", icon: RefreshCw },
    { href: "/dashboard/finance/discrepancies", label: "Discrepancy Queue", icon: AlertTriangle },
    { href: "/dashboard/finance/reports", label: "Consolidated NOI Reports", icon: FileText },
  ];
  const analyticsItems = [
    { href: "/dashboard/analytics", label: "Portfolio Analytics", icon: BarChart3 },
  ];
  const landlordPropertyItems = [
    { href: "/dashboard/landlord", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/dashboard/landlord/properties", label: "My Properties", icon: Building2 },
    { href: "/dashboard/landlord/apartments", label: "Apartments & Units", icon: Home },
    { href: "/dashboard/landlord/tenants", label: "Tenants & Leases", icon: Users },
    { href: "/dashboard/landlord/rent", label: "Rent Collections", icon: CreditCard },
    { href: "/dashboard/landlord/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/dashboard/landlord/reports", label: "Financial Reports", icon: BarChart3 },
    { href: "/dashboard/landlord/statements", label: "Rent Statements", icon: FileText },
    { href: "/dashboard/landlord/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/landlord/profile", label: "Account Profile", icon: User },
  ];
  const tenantPropertyItems = [
    { href: "/dashboard/tenant", label: "Resident Hub", icon: LayoutDashboard },
    { href: "/dashboard/tenant/tenancy", label: "Tenancy & Lease", icon: FileText },
    { href: "/dashboard/tenant/rent", label: "Rent & Payments", icon: CreditCard },
    { href: "/dashboard/tenant/maintenance", label: "Maintenance Requests", icon: Wrench },
    { href: "/dashboard/tenant/profile", label: "Resident Profile", icon: User },
  ];
  const waterMainItems = [
    { href: "/dashboard/water", label: "Water Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/water/transactions", label: "Water Transactions", icon: Receipt },
    { href: "/dashboard/water/tokens", label: "Token Generation", icon: Zap },
    { href: "/dashboard/water/qr", label: "QR Scan-to-Pay", icon: QrCode },
    { href: "/dashboard/water/reports", label: "Water Reports", icon: BarChart3 },
  ];
  const waterInfrastructureItems = [
    { href: "/dashboard/water/meters", label: "Meters Registry", icon: Gauge },
    { href: "/dashboard/water/tariffs", label: "Tariff Management", icon: Sliders },
    { href: "/dashboard/water/consumption", label: "Consumption Analytics", icon: Activity },
    { href: "/dashboard/water/reconciliation", label: "M-Pesa Reconciliation", icon: RefreshCw },
  ];
  const landlordWaterItems = [
    { href: "/dashboard/landlord/water", label: "Water Overview", icon: LayoutDashboard },
    { href: "/dashboard/water/meters", label: "My Meters", icon: Gauge },
    { href: "/dashboard/water/transactions", label: "Water Revenue", icon: Receipt },
  ];
  const tenantWaterItems = [
    { href: "/dashboard/tenant/water", label: "Buy Water Tokens", icon: Droplets },
  ];

  const renderNavItem = (item: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onClose?.()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          color: active ? "#fff" : "rgba(255,255,255,0.6)",
          background: active ? "rgba(255,255,255,0.15)" : "transparent",
          borderLeft: active ? `3px solid ${brandPrimary}` : "3px solid transparent",
          transition: "all 0.15s ease",
          marginBottom: 2,
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }
        }}
      >
        <Icon size={16} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {active && <ChevronRight size={12} style={{ opacity: 0.7 }} />}
      </Link>
    );
  };

  const renderNavSection = (title: string, items: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }[]) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase", letterSpacing: "0.12em",
        padding: "0 14px", marginBottom: 6
      }}>
        {title}
      </div>
      {items.map(renderNavItem)}
    </div>
  );

  return (
    <aside
      className={`dashboard-sidebar ${mobileOpen ? "mobile-open" : ""}`}
      style={{
        background: brandBg,
        overflowY: "auto",
        overflowX: "hidden",
        boxShadow: "2px 0 20px rgba(0,0,0,0.25)",
        scrollbarWidth: "none",
      }}
    >
      <style>{`
        aside::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── BRAND HEADER ── */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link
            href="/"
            onClick={() => onClose?.()}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isProperty
                ? "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)"
                : "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
              flexShrink: 0,
            }}>
              {isProperty ? "🏢" : "💧"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isProperty ? (
                  <>Property<span style={{ color: "#a5b4fc" }}>Ledger</span></>
                ) : (
                  <><span style={{ color: "#7dd3fc" }}>Maji</span> Ledger</>
                )}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isProperty ? "Property Management" : "Smart Water Utility"}
              </div>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="sidebar-mobile-close-btn"
              aria-label="Close navigation menu"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: "pointer",
                color: "#fff",
                display: "none", // shown only on mobile by media query
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Suite Switcher */}
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: 4, display: "flex", gap: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => handleSwitchSuite("property")}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, transition: "all 0.2s ease",
              background: isProperty ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
              color: isProperty ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: isProperty ? "0 2px 8px rgba(79,70,229,0.4)" : "none",
            }}
          >
            🏢 Property
          </button>
          <button
            onClick={() => handleSwitchSuite("water")}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, transition: "all 0.2s ease",
              background: !isProperty ? "linear-gradient(135deg, #0369a1, #0284c7)" : "transparent",
              color: !isProperty ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: !isProperty ? "0 2px 8px rgba(2,132,199,0.4)" : "none",
            }}
          >
            💧 Maji
          </button>
        </div>

        {/* Role Badge */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 5,
            background: isAdmin ? "rgba(239,68,68,0.2)" : isOwner ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.1)",
            color: isAdmin ? "#fca5a5" : isOwner ? "#c7d2fe" : "rgba(255,255,255,0.5)",
            border: `1px solid ${isAdmin ? "rgba(239,68,68,0.3)" : isOwner ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)"}`,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {isAdmin ? "ADMIN" : isOwner ? "OWNER" : isTenant ? "TENANT" : "USER"}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.fullName?.split(" ")[0] || "User"}
          </span>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <nav style={{ flex: 1, padding: "16px 8px", overflowY: "auto", display: "flex", flexDirection: "column", scrollbarWidth: "none" }}>
        {isProperty ? (
          isTenant ? (
            renderNavSection("Resident Portal", tenantPropertyItems)
          ) : isOwner ? (
            renderNavSection("Landlord Portal", landlordPropertyItems)
          ) : (
            <>
              {renderNavSection("Portfolio & Leases", propertyGeneralItems)}
              {renderNavSection("Rent Ledger", rentLedgerItems)}
              {!isAdmin ? null : renderNavSection("Administration", adminControlItems)}
              {renderNavSection("Treasury & Reconciliation", reconciliationItems)}
              {renderNavSection("Business Intelligence", analyticsItems)}
            </>
          )
        ) : (
          isTenant ? (
            renderNavSection("Prepaid Water", tenantWaterItems)
          ) : isOwner ? (
            renderNavSection("Water Management", landlordWaterItems)
          ) : (
            <>
              {renderNavSection("Prepaid Water Operations", waterMainItems)}
              {renderNavSection("Infrastructure & Hardware", waterInfrastructureItems)}
            </>
          )
        )}
      </nav>

      {/* ── BOTTOM SECTION ── */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Link
          href="/pay/demo-token"
          target="_blank"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 12px", background: "rgba(255,255,255,0.08)",
            borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
            textDecoration: "none", fontSize: 12,
            color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 10,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>📱</span><span>Resident Scan-to-Pay</span>
          </div>
          <ExternalLink size={12} />
        </Link>

        {/* User Profile */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", background: "rgba(255,255,255,0.08)",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${isProperty ? "#818cf8" : "#38bdf8"}, ${brandPrimary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
            boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user?.fullName || "User"}>
              {user?.fullName || "Platform User"}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user?.email || ""}>
              {user?.email || "Signed in"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", padding: 7, borderRadius: 8, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fca5a5"; e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, activeSuite, setActiveSuite, isOwner, isTenant } = useAuth();

  const isWaterRoute =
    pathname.startsWith("/dashboard/water") ||
    pathname === "/dashboard/landlord/water" ||
    pathname === "/dashboard/tenant/water";

  const effectiveSuite = isWaterRoute ? "water" : activeSuite;
  const isProperty = effectiveSuite === "property";

  // Close drawer whenever user navigates
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock background scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleSuite = () => {
    const nextSuite = isProperty ? "water" : "property";
    setActiveSuite(nextSuite);
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f0f7ff 0%, #f8fafc 280px, #f8fafc 100%)",
        position: "relative",
      }}
    >
      {/* ── MOBILE BACKDROP OVERLAY ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="dashboard-mobile-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 999,
          }}
          aria-label="Close menu overlay"
        />
      )}

      {/* ── SIDEBAR DRAWER ── */}
      <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── MAIN CONTENT AREA ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── MOBILE STICKY TOP NAVBAR (Shown only on screens < 1024px) ── */}
        <header
          className="dashboard-mobile-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 900,
            display: "none", // overridden in CSS for mobile
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: isProperty
              ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
              : "linear-gradient(135deg, #082f49 0%, #0369a1 100%)",
            color: "#fff",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}
        >
          {/* Hamburger + Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "8px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={20} />
            </button>

            <Link
              href={isProperty ? (isOwner ? "/dashboard/landlord" : isTenant ? "/dashboard/tenant" : "/dashboard") : "/dashboard/water"}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, color: "#fff" }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: isProperty ? "linear-gradient(135deg, #818cf8, #6366f1)" : "linear-gradient(135deg, #38bdf8, #0284c7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {isProperty ? "🏢" : "💧"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
                  {isProperty ? "PropertyLedger" : "Maji Ledger"}
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {isProperty ? "Property Suite" : "Water Utility"}
                </span>
              </div>
            </Link>
          </div>

          {/* Suite switcher pill + User initials */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href={isProperty ? "/dashboard/water" : "/dashboard"}
              onClick={() => toggleSuite()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <ArrowLeftRight size={12} />
              <span>{isProperty ? "💧 Water" : "🏢 Property"}</span>
            </Link>

            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${isProperty ? "#818cf8" : "#38bdf8"}, ${isProperty ? "#6366f1" : "#0284c7"})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.4)",
              }}
              title={user?.fullName || "User"}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main
          className="dashboard-main-content"
          style={{
            flex: 1,
            minWidth: 0,
            overflowX: "hidden",
            background: "transparent",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

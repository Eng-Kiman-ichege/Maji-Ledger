import Link from "next/link";
import { FeatureCard } from "@/components/ui/FeatureCard";
import {
  ShieldCheck,
  UserCheck,
  Droplets,
  Building2,
  DollarSign,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* ── Soft Ambient Light Blobs ── */}
      <div
        className="blob"
        style={{
          width: 600,
          height: 600,
          background: "#38bdf8",
          top: "-200px",
          left: "-100px",
          opacity: 0.15,
        }}
      />
      <div
        className="blob"
        style={{
          width: 500,
          height: 500,
          background: "#34d399",
          top: "35%",
          right: "-100px",
          opacity: 0.12,
          animationDelay: "3s",
        }}
      />

      {/* ── Top Navigation Bar ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid #e2e8f0",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              }}
            >
              💧
            </div>
            <div>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: "-0.5px",
                }}
              >
                <span className="gradient-text">Maji</span>{" "}
                <span style={{ color: "#0f172a" }}>Ledger</span>
              </span>
            </div>
          </div>

          {/* Quick Access Links */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              href="/dashboard/owner"
              prefetch={false}
              className="btn-outline"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              <UserCheck size={16} />
              <span>Owner Portal</span>
            </Link>

            <Link
              href="/dashboard"
              prefetch={false}
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: 13 }}
            >
              <ShieldCheck size={16} />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "70px 24px 60px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Release Tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 9999,
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            marginBottom: 24,
            fontSize: 13,
            color: "#0284c7",
            fontWeight: 700,
          }}
        >
          <Sparkles size={14} />
          <span>Next-Gen Smart Water Metering & Automated Revenue Settlement</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(36px, 5.5vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            marginBottom: 20,
            color: "#0f172a",
          }}
        >
          Prepaid Water Billing & Property Ledger{" "}
          <span className="gradient-text">Made Seamless</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#475569",
            maxWidth: 720,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Tenants vend prepaid water tokens instantly via M-Pesa. Administrators manage multi-property
          portfolios with live telemetry. Landlords receive automated net payouts with transparent deductions.
        </p>

        {/* Hero Portals CTA Card Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            maxWidth: 840,
            margin: "0 auto 48px",
            textAlign: "left",
          }}
        >
          {/* Admin Entry */}
          <Link
            href="/dashboard"
            prefetch={false}
            className="glass-card-interactive"
            style={{
              padding: "24px 28px",
              textDecoration: "none",
              borderTop: "3px solid #0284c7",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#f0f9ff",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <ArrowRight size={18} color="#0284c7" />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              Administrator Console
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Monitor system revenue, track platform deductions, add and filter properties, and audit smart meter tokens.
            </p>
          </Link>

          {/* Landlord Entry */}
          <Link
            href="/dashboard/owner"
            prefetch={false}
            className="glass-card-interactive"
            style={{
              padding: "24px 28px",
              textDecoration: "none",
              borderTop: "3px solid #059669",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck size={20} />
              </div>
              <ArrowRight size={18} color="#059669" />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              Property Owner Portal
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Landlord view of water spent per building, tenant vending activity, net payable disbursements, and statement exports.
            </p>
          </Link>
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            fontSize: 13,
            color: "#475569",
            fontWeight: 600,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color="#059669" /> STS Compliant Tokens
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color="#059669" /> Automated Landlord Deductions
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color="#059669" /> Scan-to-Pay QR Codes
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color="#059669" /> 100% Light Mode UI
          </span>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "20px 24px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💧</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Water Telemetry Charts
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Interactive spline and area charts tracking daily cubic meters ($m^3$) dispensed to rental units with peak analysis.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Net Settlement Waterfall
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Automatic deduction of 5% platform fee and SMS gateway token costs, providing landlords transparent monthly net payouts.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Admin Property Management
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Filter by County, search estates, add new properties with building/apartment hierarchies, and drill down on water spent.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

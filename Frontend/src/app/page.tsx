import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Gauge,
  Receipt,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Maji Ledger — Smart Prepaid Water & Multi-Tenant Revenue Settlement",
  description:
    "End-to-end prepaid water billing platform: STS token generation, tenant M-Pesa vending, QR scan-to-pay, and automated property owner net earnings reconciliation.",
};

export const instant = false;

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f0f7ff 0%, #f8fafc 400px, #ffffff 100%)",
      }}
    >
      {/* ── Top Navigation ── */}
      <nav
        style={{
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--gradient-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
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
              href="/pay/demo-token"
              prefetch={false}
              className="btn-outline"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              <Smartphone size={15} />
              <span>Scan-to-Pay Demo</span>
            </Link>

            <Link
              href="/login"
              prefetch={false}
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: 13 }}
            >
              <Lock size={15} />
              <span>Sign In to Portal</span>
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
          <span>Role-Based Authentication & Scoped Landlord Ledgers</span>
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
          portfolios and provision secure accounts. Property owners log in to track their water usage and net earnings.
        </p>

        {/* Main CTA Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginBottom: 48,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/login"
            prefetch={false}
            className="btn-primary"
            style={{
              padding: "14px 28px",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "0 4px 14px 0 rgba(2, 132, 199, 0.35)",
            }}
          >
            <Lock size={18} />
            <span>Sign In to Your Account</span>
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/pay/demo-token"
            prefetch={false}
            className="btn-outline"
            style={{
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: 600,
              background: "#ffffff",
            }}
          >
            <Smartphone size={18} />
            <span>Try Scan-to-Pay Demo</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
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
          {/* Admin Role Card */}
          <div
            className="glass-card"
            style={{
              padding: "24px 28px",
              borderTop: "3px solid #0284c7",
              background: "#ffffff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
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
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Administrator Console
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Create accounts for property owners with generated passwords, assign rental properties, monitor portfolio revenue, and inspect STS token dispatches.
            </p>
          </div>

          {/* Owner Role Card */}
          <div
            className="glass-card"
            style={{
              padding: "24px 28px",
              borderTop: "3px solid #059669",
              background: "#ffffff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
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
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Property Owner View
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Strictly scoped to your assigned buildings. Monitor tenant water consumed in m³, review gross payments, and download monthly disbursement statements.
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 12,
            maxWidth: 780,
            margin: "0 auto",
          }}
        >
          {[
            "Role-Based Access Control",
            "Strict Property Scoping",
            "M-Pesa Express & Paybill",
            "IEC 62055-41 STS Tokens",
            "Automatic 5% Platform Reconciliation",
            "Real-Time Water Telemetry",
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "#ffffff",
                borderRadius: 9999,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                color: "#334155",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <CheckCircle2 size={13} color="#059669" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          background: "#f8fafc",
          padding: "32px 24px",
          textAlign: "center",
          fontSize: 13,
          color: "#64748b",
        }}
      >
        <p style={{ margin: 0 }}>
          Maji Ledger © 2026 — Secure Prepaid Water Billing & Property Ledger. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

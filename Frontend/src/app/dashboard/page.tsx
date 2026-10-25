import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Maji Ledger management dashboard — properties, meters, payments, and tokens.",
};

export default function DashboardPage() {
  const comingSoon = [
    { icon: "🏘️", title: "Properties", desc: "Manage estates, buildings, and apartments." },
    { icon: "💧", title: "Meters", desc: "Register, assign, and track water meters." },
    { icon: "💳", title: "Transactions", desc: "View payment history and token records." },
    { icon: "📦", title: "Token History", desc: "Track STS tokens issued per meter." },
    { icon: "👥", title: "Tenants", desc: "Manage tenants and tenancy assignments." },
    { icon: "📊", title: "Reports", desc: "Portfolio overview and reconciliation reports." },
  ];

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Top bar */}
      <nav
        style={{
          borderBottom: "1px solid rgba(148,163,184,0.08)",
          background: "rgba(15,23,42,0.9)",
          backdropFilter: "blur(16px)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
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
              }}
            >
              💧
            </div>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.5px",
              }}
            >
              <span className="gradient-text">Maji</span>{" "}
              <span style={{ color: "var(--color-text-primary)" }}>Ledger</span>
            </span>
          </Link>
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Dashboard — Phase 1
        </div>
      </nav>

      {/* Hero banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(6,214,160,0.08) 100%)",
          borderBottom: "1px solid rgba(148,163,184,0.08)",
          padding: "48px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="blob"
          style={{ width: 300, height: 300, background: "var(--color-primary)", top: -100, left: "30%" }}
        />
        <div style={{ position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 100,
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.2)",
              fontSize: 12,
              fontWeight: 600,
              color: "#fbbf24",
              marginBottom: 16,
            }}
          >
            🚧 Step 1 Complete — Database design pending approval
          </div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              marginBottom: 12,
            }}
          >
            Management Dashboard
          </h1>
          <p style={{ fontSize: 15, color: "var(--color-text-muted)", maxWidth: 520, margin: "0 auto" }}>
            Full dashboard functionality will be built in Phase 2 after database design is approved.
          </p>
        </div>
      </div>

      {/* Module cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 24,
            color: "var(--color-text-muted)",
            letterSpacing: "0.05em",
            textTransform: "uppercase" as const,
          }}
        >
          Planned Modules
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {comingSoon.map((m) => (
            <div
              key={m.title}
              className="glass-card"
              style={{
                padding: "22px 20px",
                opacity: 0.65,
                position: "relative",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {m.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, margin: 0 }}>
                {m.desc}
              </p>
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 100,
                  background: "rgba(148,163,184,0.1)",
                  color: "var(--color-text-dim)",
                  letterSpacing: "0.08em",
                }}
              >
                COMING SOON
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

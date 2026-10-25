import Link from "next/link";
import { FeatureCard } from "@/components/ui/FeatureCard";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* ── Animated background blobs ── */}
      <div
        className="blob"
        style={{
          width: 600,
          height: 600,
          background: "var(--color-primary)",
          top: "-200px",
          left: "-100px",
          animationDelay: "0s",
        }}
      />
      <div
        className="blob"
        style={{
          width: 400,
          height: 400,
          background: "var(--color-accent)",
          top: "40%",
          right: "-80px",
          animationDelay: "3s",
        }}
      />
      <div
        className="blob"
        style={{
          width: 300,
          height: 300,
          background: "#8b5cf6",
          bottom: "10%",
          left: "20%",
          animationDelay: "5s",
        }}
      />

      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(148,163,184,0.08)",
          background: "rgba(3,7,18,0.8)",
          backdropFilter: "blur(16px)",
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
              }}
            >
              💧
            </div>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: "-0.5px",
              }}
            >
              <span className="gradient-text">Maji</span>{" "}
              <span style={{ color: "var(--color-text-primary)" }}>Ledger</span>
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              href="/dashboard"
              style={{
                color: "var(--color-text-muted)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                transition: "color 0.2s",
              }}
            >
              Dashboard
            </Link>
            <Link href="/dashboard" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "100px 24px 80px",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Badge */}
        <div className="fade-up" style={{ marginBottom: 28, display: "inline-block" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 100,
              border: "1px solid rgba(14,165,233,0.3)",
              background: "rgba(14,165,233,0.08)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-primary)",
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
            Prepaid Water Billing — Reimagined
          </span>
        </div>

        {/* Headline */}
        <h1
          className="fade-up fade-up-1"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(42px, 6vw, 76px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-2px",
            margin: "0 0 24px",
          }}
        >
          Smart Water Billing
          <br />
          <span className="gradient-text">for Modern Properties</span>
        </h1>

        {/* Sub */}
        <p
          className="fade-up fade-up-2"
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--color-text-muted)",
            lineHeight: 1.7,
            maxWidth: 640,
            margin: "0 auto 44px",
          }}
        >
          Tenants buy prepaid water tokens instantly via M-Pesa or QR code scan.
          Property owners get full portfolio visibility — meters, payments, and token history — all in one place.
        </p>

        {/* CTAs */}
        <div className="fade-up fade-up-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="btn-primary">
            Open Dashboard →
          </Link>
          <Link href="/pay/demo" className="btn-outline">
            Try Scan to Pay
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="fade-up fade-up-4"
          style={{
            display: "flex",
            gap: 32,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 72,
            paddingTop: 40,
            borderTop: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          {[
            { value: "< 30s", label: "Token delivery time" },
            { value: "2 channels", label: "QR & Paybill/USSD" },
            { value: "100%", label: "Transaction traceability" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
                className="gradient-text"
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 100px", position: "relative", zIndex: 10 }}>
        <h2
          style={{
            textAlign: "center",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700,
            letterSpacing: "-1px",
            marginBottom: 48,
          }}
        >
          Everything you need,{" "}
          <span className="gradient-text">nothing you don&apos;t</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              icon: "📲",
              title: "Scan to Pay",
              desc: "Each meter has a QR sticker. Customers scan, verify their apartment details, enter an amount, and pay — in under a minute.",
            },
            {
              icon: "📡",
              title: "Paybill & USSD",
              desc: "Customers can also pay via M-Pesa Paybill or Airtel Money. Both channels go through the same backend pipeline.",
            },
            {
              icon: "🏘️",
              title: "Property Management",
              desc: "Manage multiple properties, buildings, apartments, tenants, and meters. Historical assignments are always preserved.",
            },
            {
              icon: "🪙",
              title: "STS Token Generation",
              desc: "Tokens are generated through the STS platform after payment confirmation. Delivered to the customer by SMS.",
            },
            {
              icon: "📊",
              title: "Portfolio Dashboard",
              desc: "Owners see only properties they are authorised for. Admins have configurable portfolio-wide visibility.",
            },
            {
              icon: "🔁",
              title: "Full Reconciliation",
              desc: "Every transaction maps to a meter, apartment, building, and property. Audit trails are immutable.",
            },
          ].map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(148,163,184,0.08)",
          padding: "28px 24px",
          textAlign: "center",
          color: "var(--color-text-dim)",
          fontSize: 13,
          position: "relative",
          zIndex: 10,
        }}
      >
        © 2025 Maji Ledger — Prepaid Water Billing & Property Management Platform.
        &nbsp; Phase 1 of 3 under active development.
      </footer>
    </main>
  );
}

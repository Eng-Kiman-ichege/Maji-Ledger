import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scan to Pay",
  description: "Pay for prepaid water units securely using M-Pesa or Airtel Money.",
};

// This is a dynamic payment page — always rendered at request time, never statically cached.
export const instant = false;

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ScanToPayPage({ params }: PageProps) {
  const { token } = await params;


  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        className="blob"
        style={{
          width: 400,
          height: 400,
          background: "var(--color-primary)",
          top: "-100px",
          left: "-100px",
        }}
      />
      <div
        className="blob"
        style={{
          width: 300,
          height: 300,
          background: "var(--color-accent)",
          bottom: "-50px",
          right: "-50px",
          animationDelay: "4s",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 12px",
            }}
          >
            💧
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "-0.5px",
            }}
          >
            <span className="gradient-text">Maji</span>{" "}
            <span style={{ color: "var(--color-text-primary)" }}>Ledger</span>
          </span>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 28 }}>
          {/* Status badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 100,
              background: "rgba(6,214,160,0.12)",
              border: "1px solid rgba(6,214,160,0.25)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-accent)",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-accent)",
                display: "inline-block",
              }}
            />
            Secure Payment Page
          </div>

          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 6,
              letterSpacing: "-0.5px",
            }}
          >
            Buy Water Tokens
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 24 }}>
            Verify your meter details below before authorising payment.
          </p>

          {/* Placeholder meter info */}
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              borderRadius: 10,
              padding: "16px 18px",
              marginBottom: 24,
              border: "1px solid rgba(148,163,184,0.1)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Meter Details
            </div>
            {[
              { label: "Property", value: "—" },
              { label: "Building / Block", value: "—" },
              { label: "Apartment", value: "—" },
              { label: "Meter", value: "****" },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(148,163,184,0.06)",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Placeholder — not yet functional */}
          <div
            style={{
              background: "rgba(234, 179, 8, 0.08)",
              border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 16 }}>🚧</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 2 }}>Under Construction</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                The Scan to Pay form will be implemented in Phase 2. QR token:{" "}
                <code style={{ fontSize: 11, color: "var(--color-primary)", background: "rgba(14,165,233,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                  {token}
                </code>
              </div>
            </div>
          </div>

          <Link href="/" className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>
            ← Back to Home
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-dim)", marginTop: 16 }}>
          Always verify property details before authorising payment.
        </p>
      </div>
    </main>
  );
}

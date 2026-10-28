import { Suspense } from "react";
import type { Metadata } from "next";
import ScanToPayClient from "./ScanToPayClient";

export const metadata: Metadata = {
  title: "Scan to Pay | Maji Ledger",
  description: "Securely pay for prepaid water units with verified meter and property destination.",
};

export const instant = false;

interface PageProps {
  params: Promise<{ token: string }>;
}

async function TokenLoader({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ScanToPayClient token={token} />;
}

export default function ScanToPayPage({ params }: PageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient lighting */}
      <div
        className="blob"
        style={{
          width: 450,
          height: 450,
          background: "var(--color-primary)",
          top: "-120px",
          left: "-120px",
          opacity: 0.15,
        }}
      />
      <div
        className="blob"
        style={{
          width: 350,
          height: 350,
          background: "var(--color-accent)",
          bottom: "-80px",
          right: "-80px",
          opacity: 0.12,
          animationDelay: "4s",
        }}
      />

      <Suspense
        fallback={
          <div
            className="glass-card"
            style={{
              padding: "40px 24px",
              textAlign: "center",
              width: "100%",
              maxWidth: 440,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid rgba(14,165,233,0.2)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading destination...</p>
          </div>
        }
      >
        <TokenLoader params={params} />
      </Suspense>

      <footer style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--color-text-dim)", zIndex: 10 }}>
        🔒 256-Bit SSL Encrypted &bull; Authoritative STS Token Dispenser &bull; Maji Ledger
      </footer>
    </main>
  );
}

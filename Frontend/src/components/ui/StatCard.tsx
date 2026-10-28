"use client";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow accent */}
      {accent && (
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "var(--color-primary)",
            opacity: 0.07,
            filter: "blur(30px)",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-1px",
          lineHeight: 1,
          color: accent ? "var(--color-primary)" : "var(--color-text-primary)",
        }}
      >
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: 12, color: "var(--color-text-dim)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

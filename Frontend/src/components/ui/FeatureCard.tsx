"use client";

interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
}

export function FeatureCard({ icon, title, desc }: FeatureCard) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "28px 24px",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(14,165,233,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(148,163,184,0.1)";
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          marginBottom: 10,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.65, margin: 0 }}>
        {desc}
      </p>
    </div>
  );
}

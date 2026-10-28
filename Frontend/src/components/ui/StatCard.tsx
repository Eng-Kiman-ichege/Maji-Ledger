"use client";

import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  change?: string;
  trend?: "up" | "down" | "neutral" | string;
  accent?: boolean;
  colorScheme?: "blue" | "emerald" | "amber" | "indigo" | "rose" | "teal";
}

const COLOR_SCHEMES = {
  blue: {
    iconBg: "#f0f9ff",
    iconColor: "#0284c7",
    badgeBg: "#f0f9ff",
    badgeColor: "#0369a1",
    borderGlow: "rgba(2, 132, 199, 0.12)",
  },
  emerald: {
    iconBg: "#ecfdf5",
    iconColor: "#059669",
    badgeBg: "#ecfdf5",
    badgeColor: "#047857",
    borderGlow: "rgba(5, 150, 105, 0.12)",
  },
  amber: {
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    badgeBg: "#fffbeb",
    badgeColor: "#b45309",
    borderGlow: "rgba(217, 119, 6, 0.12)",
  },
  indigo: {
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
    badgeBg: "#eef2ff",
    badgeColor: "#4338ca",
    borderGlow: "rgba(79, 70, 229, 0.12)",
  },
  rose: {
    iconBg: "#fff1f2",
    iconColor: "#e11d48",
    badgeBg: "#fff1f2",
    badgeColor: "#be123c",
    borderGlow: "rgba(225, 29, 72, 0.12)",
  },
  teal: {
    iconBg: "#f0fdfa",
    iconColor: "#0d9488",
    badgeBg: "#f0fdfa",
    badgeColor: "#0f766e",
    borderGlow: "rgba(13, 148, 136, 0.12)",
  },
};

export default function StatCard({
  icon,
  label,
  value,
  sub,
  change,
  trend,
  accent,
  colorScheme = "blue",
}: StatCardProps) {
  const scheme = COLOR_SCHEMES[colorScheme] ?? COLOR_SCHEMES.blue;
  const displayText = change || sub;
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <div
      className="glass-card-interactive"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.05)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        borderTop: accent ? `3px solid ${scheme.iconColor}` : undefined,
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: scheme.iconBg,
                color: scheme.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                border: `1px solid ${scheme.borderGlow}`,
              }}
            >
              {icon}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-text-muted)",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          </div>

          {displayText && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 9999,
                background: isUp ? "#ecfdf5" : isDown ? "#fff1f2" : "#f1f5f9",
                color: isUp ? "#059669" : isDown ? "#e11d48" : "#64748b",
                border: `1px solid ${isUp ? "#a7f3d0" : isDown ? "#fecdd3" : "#e2e8f0"}`,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              {isUp ? "↑ " : isDown ? "↓ " : ""}
              {displayText}
            </span>
          )}
        </div>

        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
            color: "var(--color-text-primary)",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

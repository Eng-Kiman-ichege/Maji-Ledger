"use client";

import { ChannelBreakdownDto } from "@/types/domain";

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface ChannelDonutChartProps {
  channelBreakdown?: ChannelBreakdownDto;
}

export default function ChannelDonutChart({ channelBreakdown }: ChannelDonutChartProps) {
  const cb = channelBreakdown || {
    scanToPayAmount: 0,
    scanToPayCount: 0,
    paybillAmount: 0,
    paybillCount: 0,
    airtelAmount: 0,
    airtelCount: 0,
    ussdAmount: 0,
    ussdCount: 0,
  };

  const channels = [
    {
      name: "M-Pesa Paybill",
      amount: cb.paybillAmount || 0,
      count: cb.paybillCount || 0,
      color: "#16a34a", // green
    },
    {
      name: "Scan-to-Pay QR",
      amount: cb.scanToPayAmount || 0,
      count: cb.scanToPayCount || 0,
      color: "#0284c7", // blue
    },
    {
      name: "Airtel Money",
      amount: cb.airtelAmount || 0,
      count: cb.airtelCount || 0,
      color: "#dc2626", // red
    },
    {
      name: "USSD Mobile",
      amount: cb.ussdAmount || 0,
      count: cb.ussdCount || 0,
      color: "#7c3aed", // purple
    },
  ];

  const totalAmount = channels.reduce((s, c) => s + c.amount, 0) || 1;

  // Donut calculations
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div
      className="glass-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "24px",
        height: "100%",
        boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0f172a",
            margin: 0,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Payment Channels
        </h3>
        <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 0" }}>
          Distribution across mobile payment gateways
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {/* SVG Donut */}
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {channels.map((ch, idx) => {
              const percent = ch.amount / totalAmount;
              if (percent <= 0) return null;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={ch.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Total</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#0f172a",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {formatKes(totalAmount === 1 && channels.every((c) => c.amount === 0) ? 0 : totalAmount)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 10 }}>
          {channels.map((ch, idx) => {
            const pct = totalAmount > 0 && ch.amount > 0 ? ((ch.amount / totalAmount) * 100).toFixed(0) : "0";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: ch.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#334155", fontWeight: 500 }}>{ch.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatKes(ch.amount)}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

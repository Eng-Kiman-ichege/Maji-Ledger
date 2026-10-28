"use client";

import { useState } from "react";

interface DailyDataPoint {
  day: string;
  units: number; // in m³ or units
  amount: number; // in KES
}

interface WaterConsumptionChartProps {
  title?: string;
  subtitle?: string;
  data?: DailyDataPoint[];
  color?: string;
  unitLabel?: string;
}

const DEFAULT_DAYS: DailyDataPoint[] = [
  { day: "Mon", units: 28.4, amount: 4260 },
  { day: "Tue", units: 35.2, amount: 5280 },
  { day: "Wed", units: 42.1, amount: 6315 },
  { day: "Thu", units: 38.6, amount: 5790 },
  { day: "Fri", units: 51.8, amount: 7770 },
  { day: "Sat", units: 64.3, amount: 9645 },
  { day: "Sun", units: 58.0, amount: 8700 },
];

export default function WaterConsumptionChart({
  title = "Water Dispensed & Consumption Trend",
  subtitle = "Daily volume of prepaid water purchased across smart meters",
  data = DEFAULT_DAYS,
  color = "#0284c7",
  unitLabel = "m³",
}: WaterConsumptionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => d.units), 10);
  const chartHeight = 180;
  const chartWidth = 520;
  const padLeft = 40;
  const padBottom = 30;
  const padTop = 20;
  const padRight = 20;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * innerW;
    const y = padTop + innerH - (d.units / maxVal) * innerH;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + innerH} L ${points[0].x} ${padTop + innerH} Z`;

  const totalUnits = data.reduce((s, d) => s + d.units, 0);
  const avgUnits = (totalUnits / (data.length || 1)).toFixed(1);

  return (
    <div className="glass-card" style={{ padding: "24px 24px 20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {subtitle}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              textAlign: "right",
              background: "#f0f9ff",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #bae6fd",
            }}
          >
            <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 600 }}>7-Day Total</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0284c7" }}>
              {totalUnits.toFixed(1)} {unitLabel}
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
              background: "#ecfdf5",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #a7f3d0",
            }}
          >
            <div style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>Daily Avg</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>
              {avgUnits} {unitLabel}/day
            </div>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padTop + innerH * (1 - ratio);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="500"
                >
                  {(maxVal * ratio).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#waterGradient)" />

          {/* Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Interactive Nodes */}
          {points.map((p, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Invisible touch target */}
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

              {/* Visible node */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 6 : 4}
                fill="#ffffff"
                stroke={color}
                strokeWidth={hoveredIdx === idx ? 3 : 2}
                style={{ transition: "all 0.15s ease" }}
              />

              {/* Day label */}
              <text
                x={p.x}
                y={chartHeight - 8}
                textAnchor="middle"
                fill={hoveredIdx === idx ? "var(--color-primary)" : "#64748b"}
                fontSize="11"
                fontWeight={hoveredIdx === idx ? "700" : "500"}
              >
                {p.day}
              </text>
            </g>
          ))}

          {/* Hover Tooltip Overlay */}
          {hoveredIdx !== null && (
            <g transform={`translate(${Math.min(points[hoveredIdx].x, chartWidth - 110)}, ${Math.max(points[hoveredIdx].y - 48, 10)})`}>
              <rect
                x="-10"
                y="-6"
                width="110"
                height="44"
                rx="8"
                fill="#0f172a"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
              />
              <text x="45" y="12" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
                {points[hoveredIdx].day} Consumption
              </text>
              <text x="45" y="28" fill="#38bdf8" fontSize="13" fontWeight="800" textAnchor="middle">
                {points[hoveredIdx].units.toFixed(1)} {unitLabel} (KES {points[hoveredIdx].amount.toLocaleString()})
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

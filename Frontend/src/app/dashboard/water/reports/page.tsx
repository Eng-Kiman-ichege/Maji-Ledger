"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterDashboardDto, PropertyWaterSummaryDto, PropertyDto } from "@/types/domain";
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  Droplets,
  Coins,
  RefreshCw,
  TrendingUp,
  Percent,
} from "lucide-react";

export default function WaterReportsPage() {
  const [data, setData] = useState<WaterDashboardDto | null>(null);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadReport();
    loadProperties();
  }, [propertyFilter]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.append("propertyId", propertyFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await api.get<WaterDashboardDto>(`/api/v1/water/dashboard?${params.toString()}`);
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatKes = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleExportCsv = () => {
    if (!data || !data.propertyBreakdowns.length) return;
    const headers = [
      "Property Name",
      "Meters Count",
      "Water Revenue (KES)",
      "Prepaid Units Sold (m3)",
      "Recorded Consumption (m3)",
      "Variance (m3)",
    ];
    const rows = data.propertyBreakdowns.map((p) => [
      `"${p.propertyName}"`,
      p.meterCount,
      p.revenue.toFixed(2),
      p.unitsSold.toFixed(2),
      p.consumption.toFixed(2),
      (p.unitsSold - p.consumption).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Water_Ledger_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0284c7",
                background: "#f0f9ff",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid #bae6fd",
                textTransform: "uppercase",
              }}
            >
              Water Ledger
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Water Ledger Financial & Consumption Reports
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Independent water revenue reporting, consumption metrics, and property efficiency analytics
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!data || data.propertyBreakdowns.length === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "#0284c7",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            opacity: !data || data.propertyBreakdowns.length === 0 ? 0.5 : 1,
          }}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Date & Property Filter Bar */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 24,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
        </div>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            fontSize: 13,
            background: "#fff",
            minWidth: 200,
          }}
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName || p.name}
            </option>
          ))}
        </select>

        <button
          onClick={loadReport}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            color: "#475569",
          }}
        >
          <RefreshCw size={14} /> Run Report
        </button>
      </div>

      {/* KPI Cards */}
      {data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Water Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
              {formatKes(data.totalRevenue)}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Strictly isolated from rent</div>
          </div>

          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Prepaid Units Sold</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
              {Number(data.totalUnitsSold).toFixed(2)} m³
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Through token issuance</div>
          </div>

          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Recorded Consumption</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
              {Number(data.totalConsumption).toFixed(2)} m³
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Via meter readings</div>
          </div>

          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Active Fleet Utilization</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>
              {data.activeMeters} / {data.totalMeters}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {data.totalMeters > 0 ? ((data.activeMeters / data.totalMeters) * 100).toFixed(0) : 0}% active
            </div>
          </div>
        </div>
      )}

      {/* Property Breakdown Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Water Revenue & Consumption Breakdown by Property
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading report data...</div>
        ) : !data || data.propertyBreakdowns.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <BarChart3 size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No report data for this period</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Adjust the date range or select a different property.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Property Name</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "center" }}>
                    Meters
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Revenue (KES)
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Prepaid Sold (m³)
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Recorded Cons. (m³)
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Avg Rate / m³
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.propertyBreakdowns.map((p) => {
                  const avgRate = p.unitsSold > 0 ? p.revenue / p.unitsSold : 0;
                  return (
                    <tr key={p.propertyId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                        {p.propertyName}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600, color: "#475569" }}>
                        {p.meterCount}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#059669",
                        }}
                      >
                        {formatKes(p.revenue)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#0284c7",
                        }}
                      >
                        {Number(p.unitsSold).toFixed(2)} m³
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {Number(p.consumption).toFixed(2)} m³
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "right",
                          color: "#64748b",
                        }}
                      >
                        {avgRate > 0 ? formatKes(avgRate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

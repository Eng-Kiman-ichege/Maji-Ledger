"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AnalyticsOverviewDto, PropertyComparisonItemDto } from "@/types/domain";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Building2,
  CheckCircle2,
  CreditCard,
  Droplets,
  Wrench,
  Percent,
} from "lucide-react";

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<AnalyticsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(0, 1); // Jan 1st of current year
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (from) params.append("from", new Date(from).toISOString());
      if (to) params.append("to", new Date(to).toISOString());

      const res = await api.get<AnalyticsOverviewDto>(`/api/v1/analytics/overview?${params.toString()}`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;
    const headers = [
      "Property Name",
      "Total Units",
      "Occupied Units",
      "Occupancy Rate %",
      "Expected Rent",
      "Collected Rent",
      "Outstanding Rent",
      "Maintenance Expense",
      "Net Income",
    ];

    const rows = data.propertyComparison.map((p) => [
      `"${p.propertyName}"`,
      p.totalUnits.toString(),
      p.occupiedUnits.toString(),
      p.occupancyRate.toString(),
      p.expectedRent.toString(),
      p.collectedRent.toString(),
      p.outstandingRent.toString(),
      p.maintenanceExpense.toString(),
      (p.collectedRent - p.maintenanceExpense).toString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `portfolio_analytics_matrix_${from}_to_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
            Business Intelligence
          </span>
          <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Portfolio Analytics & Performance
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Comprehensive comparison of occupancy, collection velocity, water utility yield, and net profit per asset.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!data || data.propertyComparison.length === 0}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#059669", color: "#ffffff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Download size={15} /> Export Analytics Matrix
        </button>
      </div>

      {/* Date Filter Bar */}
      <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Period From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Period To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
        </div>
        <button
          onClick={fetchAnalytics}
          style={{ marginTop: 18, padding: "8px 16px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Refresh Analytics
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Computing portfolio metrics...</div>
      ) : !data ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No data found for selected period.</div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {/* Occupancy */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Overall Occupancy</span>
                <Percent size={18} color="#059669" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", marginTop: 4 }}>
                {data.overallOccupancyRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {data.occupiedUnits} / {data.totalUnits} Units Occupied
              </div>
            </div>

            {/* Collection Rate */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Collection Efficiency</span>
                <TrendingUp size={18} color="#0284c7" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
                {data.rentCollectionRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                KES {data.totalRentCollected.toLocaleString()} Collected
              </div>
            </div>

            {/* Rent Arrears */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Rent Arrears</span>
                <TrendingDown size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: data.totalRentOutstanding > 0 ? "#dc2626" : "#059669", marginTop: 4 }}>
                KES {data.totalRentOutstanding.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Uncollected receivables
              </div>
            </div>

            {/* Maintenance Cost */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Maintenance Expense</span>
                <Wrench size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
                KES {data.totalMaintenanceCost.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Across {data.totalProperties} properties
              </div>
            </div>
          </div>

          {/* Property Comparison Matrix */}
          <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Property Performance Matrix</h3>
            </div>

            {data.propertyComparison.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No properties registered in portfolio.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px" }}>Property</th>
                      <th style={{ padding: "12px 16px" }}>Units (Occ / Tot)</th>
                      <th style={{ padding: "12px 16px" }}>Occupancy</th>
                      <th style={{ padding: "12px 16px" }}>Rent Collected</th>
                      <th style={{ padding: "12px 16px" }}>Rent Outstanding</th>
                      <th style={{ padding: "12px 16px" }}>Maintenance</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Net Operating Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.propertyComparison.map((p) => (
                      <tr key={p.propertyId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                          {p.propertyName}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#475569" }}>
                          {p.occupiedUnits} / {p.totalUnits}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: p.occupancyRate >= 80 ? "#dcfce7" : p.occupancyRate >= 50 ? "#fef3c7" : "#fee2e2",
                              color: p.occupancyRate >= 80 ? "#166534" : p.occupancyRate >= 50 ? "#92400e" : "#991b1b",
                            }}
                          >
                            {p.occupancyRate.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#059669", fontWeight: 600 }}>
                          KES {p.collectedRent.toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px", color: p.outstandingRent > 0 ? "#dc2626" : "#64748b" }}>
                          KES {p.outstandingRent.toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#dc2626" }}>
                          KES {p.maintenanceExpense.toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: (p.collectedRent - p.maintenanceExpense) >= 0 ? "#059669" : "#dc2626" }}>
                          KES {(p.collectedRent - p.maintenanceExpense).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

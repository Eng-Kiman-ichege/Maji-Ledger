"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, LandlordStatementDto } from "@/types/domain";
import { TrendingUp, Download, Calendar, DollarSign, ArrowUpRight } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordReportsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [statement, setStatement] = useState<LandlordStatementDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Default date range: Last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [fromDate, setFromDate] = useState(sixMonthsAgo.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(now.toISOString().split("T")[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
      setProperties(props);

      const params = new URLSearchParams({
        from: new Date(fromDate).toISOString(),
        to: new Date(toDate).toISOString(),
      });
      if (selectedPropertyId) params.append("propertyId", selectedPropertyId);

      const stmt = await api.get<LandlordStatementDto>(`/api/v1/landlord-portal/statement?${params.toString()}`);
      setStatement(stmt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPropertyId, fromDate, toDate]);

  const handleExportCsv = () => {
    if (!statement || !statement.monthlyBreakdown) return;
    const headers = ["Period", "Expected Rent (KES)", "Collected Rent (KES)", "Outstanding Rent (KES)", "Maintenance Cost (KES)", "Net Income (KES)"];
    const rows = statement.monthlyBreakdown.map((l) => [
      l.period,
      l.expectedRent,
      l.collectedRent,
      l.outstandingRent,
      l.maintenanceCost,
      l.collectedRent - l.maintenanceCost,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Financial Reports & Analytics</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Portfolio financial performance across Rent Invoicing, Rent Collections, and Property Maintenance.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              background: "#ffffff",
              color: "#0f172a",
              outline: "none",
            }}
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
          <span style={{ color: "#64748b", fontSize: 12 }}>to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          />

          <button
            onClick={handleExportCsv}
            disabled={!statement}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ background: "#ffffff", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total Rent Collected</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {formatKes(statement?.totalCollectedRent || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Expected: {formatKes(statement?.totalExpectedRent || 0)}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Outstanding Rent Arrears</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: (statement?.totalOutstandingRent || 0) > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
            {formatKes(statement?.totalOutstandingRent || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Uncollected rental charges</div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Maintenance Expenses</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>
            {formatKes(statement?.totalMaintenanceCost || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Actual completed repairs</div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Net Operating Income</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: ((statement?.totalCollectedRent || 0) - (statement?.totalMaintenanceCost || 0)) >= 0 ? "#16a34a" : "#dc2626", marginTop: 4 }}>
            {formatKes((statement?.totalCollectedRent || 0) - (statement?.totalMaintenanceCost || 0))}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Rent Collected - Repairs</div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>Monthly Rent Ledger Breakdown</h2>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {statement?.monthlyBreakdown?.length || 0} Billing Cycles
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading financial ledger...</div>
        ) : !statement || statement.monthlyBreakdown.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>No financial data found for this period.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Period</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Expected Rent</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Rent Collected</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Rent Outstanding</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Maintenance Cost</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Net Period Income</th>
              </tr>
            </thead>
            <tbody>
              {statement.monthlyBreakdown.map((line) => (
                <tr key={line.period} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{line.period}</td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>{formatKes(line.expectedRent)}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#16a34a" }}>
                    {formatKes(line.collectedRent)}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: line.outstandingRent > 0 ? "#dc2626" : "#16a34a" }}>
                    {formatKes(line.outstandingRent)}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#ea580c" }}>
                    {formatKes(line.maintenanceCost)}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 800, color: (line.collectedRent - line.maintenanceCost) >= 0 ? "#16a34a" : "#dc2626" }}>
                    {formatKes(line.collectedRent - line.maintenanceCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

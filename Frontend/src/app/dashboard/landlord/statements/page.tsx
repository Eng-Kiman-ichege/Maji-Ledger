"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, LandlordStatementDto } from "@/types/domain";
import { Receipt, Printer, Calendar, Building2, CheckCircle2 } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordStatementsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [statement, setStatement] = useState<LandlordStatementDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Default: Current Year to date
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const [fromDate, setFromDate] = useState(yearStart.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(now.toISOString().split("T")[0]);

  const loadStatement = async () => {
    setLoading(true);
    try {
      const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
      setProperties(props);

      const params = new URLSearchParams({
        from: new Date(fromDate).toISOString(),
        to: new Date(toDate).toISOString(),
      });
      if (selectedPropertyId) params.append("propertyId", selectedPropertyId);

      const res = await api.get<LandlordStatementDto>(`/api/v1/landlord-portal/statement?${params.toString()}`);
      setStatement(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [selectedPropertyId, fromDate, toDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Landlord Financial Statements</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Formal period payout statement detailing gross rent, water revenue, maintenance deductions, and net balance.
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
            <option value="">All Portfolio Properties</option>
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
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Printer size={16} /> Print Statement
          </button>
        </div>
      </div>

      {/* Printable Statement Document Card */}
      <div
        id="printable-statement"
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 36,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Statement Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0f172a", paddingBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>🏢</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>PropertyLedger</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Property &amp; Rent Ledger Remittance Platform
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
              Owner Remittance Statement
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Period: {new Date(fromDate).toLocaleDateString()} – {new Date(toDate).toLocaleDateString()}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Statement Meta info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Property Scope</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
              {statement?.propertyName || "All Assigned Portfolio Properties"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Remittance Status</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> Verified Active Account
            </div>
          </div>
        </div>

        {/* Summary Balance Sheet */}
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 20, border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "#334155", margin: "0 0 14px" }}>
            Financial Summary Recap
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#475569" }}>Gross Rent Collected:</span>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatKes(statement?.totalCollectedRent || 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#475569" }}>Maintenance & Repairs Deductions:</span>
              <span style={{ fontWeight: 700, color: "#dc2626" }}>- {formatKes(statement?.totalMaintenanceCost || 0)}</span>
            </div>
            <div style={{ borderTop: "2px solid #cbd5e1", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 16 }}>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>Net Rental Payout to Landlord:</span>
              <span style={{ fontWeight: 900, color: ((statement?.totalCollectedRent || 0) - (statement?.totalMaintenanceCost || 0)) >= 0 ? "#16a34a" : "#dc2626" }}>
                {formatKes((statement?.totalCollectedRent || 0) - (statement?.totalMaintenanceCost || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Cycles */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "#334155", margin: "0 0 12px" }}>
            Monthly Rent Ledger Activity
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                <th style={{ padding: "8px 12px" }}>Billing Cycle</th>
                <th style={{ padding: "8px 12px" }}>Rent Expected</th>
                <th style={{ padding: "8px 12px" }}>Rent Collected</th>
                <th style={{ padding: "8px 12px" }}>Repairs Expense</th>
                <th style={{ padding: "8px 12px" }}>Net Rent Balance</th>
              </tr>
            </thead>
            <tbody>
              {statement?.monthlyBreakdown?.map((m) => (
                <tr key={m.period} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{m.period}</td>
                  <td style={{ padding: "10px 12px" }}>{formatKes(m.expectedRent)}</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 600 }}>{formatKes(m.collectedRent)}</td>
                  <td style={{ padding: "10px 12px", color: "#ea580c" }}>{formatKes(m.maintenanceCost)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: (m.collectedRent - m.maintenanceCost) >= 0 ? "#16a34a" : "#dc2626" }}>
                    {formatKes(m.collectedRent - m.maintenanceCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

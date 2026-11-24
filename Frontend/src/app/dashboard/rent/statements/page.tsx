"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { TenantStatementDto, TenancySummaryDto } from "@/types/domain";
import {
  BarChart3,
  Search,
  Printer,
  Calendar,
  Building2,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";

export default function TenantStatementsPage() {
  const [activeTenancies, setActiveTenancies] = useState<TenancySummaryDto[]>([]);
  const [selectedTenancyId, setSelectedTenancyId] = useState("");
  const [statement, setStatement] = useState<TenantStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadTenancies();
  }, []);

  useEffect(() => {
    if (selectedTenancyId) {
      loadStatement();
    }
  }, [selectedTenancyId, fromDate, toDate]);

  const loadTenancies = async () => {
    try {
      const res = await api.get<TenancySummaryDto[]>("/api/v1/tenancies/active");
      setActiveTenancies(res);
      if (res.length > 0) {
        setSelectedTenancyId(res[0].id);
      }
    } catch {}
  };

  const loadStatement = async () => {
    if (!selectedTenancyId) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await api.get<TenantStatementDto>(
        `/api/v1/rent/statements/${selectedTenancyId}?${params.toString()}`
      );
      setStatement(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load statement");
      setStatement(null);
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

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Tenant Ledger Statements
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            Comprehensive chronological financial ledger showing rent charges, payments, and running balance.
          </p>
        </div>

        {statement && (
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Printer size={16} />
            Print Statement
          </button>
        )}
      </div>

      {/* Tenancy & Date Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          background: "#ffffff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
            SELECT TENANT / UNIT
          </label>
          <select
            value={selectedTenancyId}
            onChange={(e) => setSelectedTenancyId(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              color: "#0f172a",
              background: "#ffffff",
              fontWeight: 600,
            }}
          >
            {activeTenancies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.primaryTenant.fullName} — Unit {t.unitNumber} ({t.propertyName}) • Rent: {formatKes(t.monthlyRent)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
            FROM DATE
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
            TO DATE
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
            }}
          />
        </div>

        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            style={{
              padding: "8px 12px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              marginTop: 18,
              cursor: "pointer",
            }}
          >
            Clear Dates
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fef2f2", color: "#991b1b", borderRadius: 10, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Statement Header Card */}
      {statement && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                {statement.tenantName}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                Phone: {statement.phoneNumber} • Unit {statement.unitNumber} • {statement.propertyName}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Lease Started: {new Date(statement.startDate).toLocaleDateString()} • Agreed Rent:{" "}
                <strong style={{ color: "#0f172a" }}>{formatKes(statement.monthlyRent)}/mo</strong>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Current Outstanding Balance</div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: statement.totalOutstanding > 0 ? "#dc2626" : "#059669",
                  marginTop: 2,
                }}
              >
                {formatKes(statement.totalOutstanding)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              paddingTop: 18,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>TOTAL BILLED</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                {formatKes(statement.totalCharged)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>TOTAL PAID</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#059669", marginTop: 2 }}>
                {formatKes(statement.totalPaid)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>STATEMENT AS OF</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                {new Date(statement.statementDate).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Lines Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Transaction Type</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Reference</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Description</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Charge (Debit)</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Payment (Credit)</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {statement?.lines?.map((line, idx) => {
                const isCharge = line.type === "Charge";
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {new Date(line.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: isCharge ? "#fef2f2" : "#ecfdf5",
                          color: isCharge ? "#dc2626" : "#059669",
                          border: isCharge ? "1px solid #fecaca" : "1px solid #a7f3d0",
                        }}
                      >
                        {line.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0f172a", fontWeight: 600 }}>
                      {line.reference}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      {line.description || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: line.debit > 0 ? "#dc2626" : "#94a3b8" }}>
                      {line.debit > 0 ? formatKes(line.debit) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: line.credit > 0 ? "#059669" : "#94a3b8", fontWeight: 600 }}>
                      {line.credit > 0 ? formatKes(line.credit) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: line.runningBalance > 0 ? "#dc2626" : "#0f172a",
                      }}
                    >
                      {formatKes(line.runningBalance)}
                    </td>
                  </tr>
                );
              })}
              {(!statement?.lines || statement.lines.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Loading statement ledger..." : "No financial transactions recorded for this lease."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

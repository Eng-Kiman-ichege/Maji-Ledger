"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { RentDashboardDto } from "@/types/domain";
import Link from "next/link";
import {
  Home,
  TrendingUp,
  AlertTriangle,
  Users,
  CreditCard,
  FileText,
  Calendar,
  ArrowRight,
  TrendingDown,
  Building2,
} from "lucide-react";

export default function RentDashboardPage() {
  const [data, setData] = useState<RentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get<RentDashboardDto>("/api/v1/rent/dashboard");
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load rent dashboard");
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
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Rent & Lease Management
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            Monthly rental financial overview, collection performance, and tenant arrears.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/dashboard/rent/charges"
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
              textDecoration: "none",
            }}
          >
            <FileText size={16} />
            Generate Charges
          </Link>
          <Link
            href="/dashboard/rent/payments"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "var(--gradient-brand, #0284c7)",
              borderRadius: 10,
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 8px -1px rgba(2, 132, 199, 0.4)",
            }}
          >
            <CreditCard size={16} />
            Record Payment
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "14px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#991b1b",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          marginBottom: 32,
        }}
      >
        {/* Active Tenancies */}
        <div
          style={{
            background: "#ffffff",
            padding: 22,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Active Tenancies</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            {loading ? "..." : data?.activeTenancies ?? 0}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Monthly rent roll: <strong style={{ color: "#0f172a" }}>{formatKes(data?.totalRentRoll || 0)}</strong>
          </div>
        </div>

        {/* Collected This Month */}
        <div
          style={{
            background: "#ffffff",
            padding: 22,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Collected This Month</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
            {loading ? "..." : formatKes(data?.collectedThisMonth || 0)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Confirmed rent payments received
          </div>
        </div>

        {/* Total Outstanding */}
        <div
          style={{
            background: "#ffffff",
            padding: 22,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Total Outstanding</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingDown size={18} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ea580c" }}>
            {loading ? "..." : formatKes(data?.outstandingBalance || 0)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Total unpaid rent charges across all units
          </div>
        </div>

        {/* Overdue Arrears */}
        <div
          style={{
            background: "#ffffff",
            padding: 22,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Past Due Arrears</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>
            {loading ? "..." : formatKes(data?.overdueBalance || 0)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            <strong style={{ color: "#dc2626" }}>{data?.tenanciesInArrears ?? 0}</strong> delinquent {data?.tenanciesInArrears === 1 ? "tenancy" : "tenancies"}
          </div>
        </div>
      </div>

      {/* Historical Collection Performance */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Recent Monthly Performance
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              Billed rent vs confirmed collections over the past 6 billing cycles
            </p>
          </div>
          <Link
            href="/dashboard/rent/arrears"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#0284c7",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Detailed Aging Report <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Billing Period</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Total Billed</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Collected Amount</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Collection Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {data?.lastSixMonths?.map((row) => {
                const efficiency = row.charged > 0 ? Math.round((row.collected / row.charged) * 100) : 0;
                return (
                  <tr key={row.period} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                      {row.period}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#334155" }}>
                      {formatKes(row.charged)}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#059669", fontWeight: 600 }}>
                      {formatKes(row.collected)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            flex: 1,
                            maxWidth: 120,
                            height: 8,
                            background: "#e2e8f0",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, efficiency)}%`,
                              height: "100%",
                              background: efficiency >= 90 ? "#059669" : efficiency >= 60 ? "#ea580c" : "#dc2626",
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 600, color: "#334155" }}>{efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!data?.lastSixMonths || data.lastSixMonths.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                    No billing history recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <Link
          href="/dashboard/rent/charges"
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 8, background: "#f0f9ff" }}>
              <FileText size={18} color="#0284c7" />
            </div>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Monthly Rent Invoicing</span>
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Generate monthly recurring rent charges for all active leases with automated proration.
          </span>
        </Link>

        <Link
          href="/dashboard/rent/payments"
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 8, background: "#ecfdf5" }}>
              <CreditCard size={18} color="#059669" />
            </div>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Record & Allocate Payment</span>
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Record payments via M-Pesa, Bank, or Cash with oldest-debt-first allocation and credit rollover.
          </span>
        </Link>

        <Link
          href="/dashboard/rent/arrears"
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 8, background: "#fff7ed" }}>
              <TrendingDown size={18} color="#ea580c" />
            </div>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Arrears Aging Analysis</span>
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Track delinquent balances bucketed by 30, 60, 90+ days past due per tenant.
          </span>
        </Link>

        <Link
          href="/dashboard/rent/statements"
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 8, background: "#f5f3ff" }}>
              <Calendar size={18} color="#7c3aed" />
            </div>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Tenant Ledger Statements</span>
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Generate chronological audit statements for tenants showing debits, credits, and running balance.
          </span>
        </Link>
      </div>
    </div>
  );
}

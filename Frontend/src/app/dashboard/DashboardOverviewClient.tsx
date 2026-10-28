"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { AdminDashboardDto, PaymentAttemptDto } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge, ChannelBadge } from "@/components/ui/Badges";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardOverviewClient() {
  const [adminData, setAdminData] = useState<AdminDashboardDto | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentAttemptDto[]>([]);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let fromParam = "";
      let toParam = "";

      if (dateFilter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        fromParam = start.toISOString();
      } else if (dateFilter === "month") {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        fromParam = start.toISOString();
      } else if (dateFilter === "custom") {
        if (customFrom) fromParam = new Date(customFrom).toISOString();
        if (customTo) {
          const toDate = new Date(customTo);
          toDate.setHours(23, 59, 59, 999);
          toParam = toDate.toISOString();
        }
      }

      const queryParams = new URLSearchParams();
      if (fromParam) queryParams.set("from", fromParam);
      if (toParam) queryParams.set("to", toParam);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const [dash, tx] = await Promise.all([
        api.get<AdminDashboardDto>(`/api/v1/dashboard/admin${queryStr}`),
        api.get<PaymentAttemptDto[]>("/api/v1/payments?pageSize=10"),
      ]);

      setAdminData(dash);
      setRecentPayments(tx);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const f = adminData?.financials;
  const cb = adminData?.channelBreakdown;

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Page header & Filter Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              marginBottom: 6,
            }}
          >
            Administrator Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
            Platform portfolio analytics, confirmed collections, token sales, and operational health.
          </p>
        </div>

        {/* Date Filter Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(15,23,42,0.8)",
            padding: "6px 12px",
            borderRadius: 12,
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Period:</span>
          {(["all", "today", "month", "custom"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              style={{
                background: dateFilter === filter ? "var(--color-primary-500, #0284c7)" : "transparent",
                color: dateFilter === filter ? "#fff" : "var(--color-text-muted)",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {filter === "all" ? "All Time" : filter === "today" ? "Today" : filter === "month" ? "This Month" : "Custom"}
            </button>
          ))}

          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{
                  background: "rgba(30,41,59,0.8)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 12,
                }}
              />
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{
                  background: "rgba(30,41,59,0.8)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 12,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          ⚠️ {error} — Ensure backend WebAPI is running on port 5000.
        </div>
      )}

      {/* Key Financial & Portfolio Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Confirmed Revenue"
          value={loading ? "..." : formatKes(f?.grossConfirmedCollections ?? 0)}
          icon="💰"
          change={`${f?.confirmedPaymentCount ?? 0} confirmed payments`}
          trend="up"
        />
        <StatCard
          label="Water Units Sold"
          value={loading ? "..." : `${(f?.totalUnitsPurchased ?? 0).toLocaleString()} m³`}
          icon="💧"
          change="STS prepaid units"
          trend="neutral"
        />
        <StatCard
          label="Active Meters"
          value={loading ? "..." : `${adminData?.activeMeters ?? 0} / ${adminData?.totalMeters ?? 0}`}
          icon="⚡"
          change={`${adminData?.activeQrRegistrations ?? 0} active QR codes`}
          trend="neutral"
        />
        <StatCard
          label="Portfolio Scale"
          value={loading ? "..." : `${adminData?.totalProperties ?? 0} Properties`}
          icon="🏢"
          change={`${adminData?.totalApartments ?? 0} units across ${adminData?.totalBuildings ?? 0} blocks`}
          trend="neutral"
        />
      </div>

      {/* Operational Reliability & Channel Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {/* Payment Channel Breakdown */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Payment Channels</span>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Confirmed Collections</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(30,41,59,0.5)",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📱</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Scan-to-Pay (QR)</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{cb?.scanToPayCount ?? 0} transactions</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>{formatKes(cb?.scanToPayAmount ?? 0)}</div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(30,41,59,0.5)",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>M-Pesa Paybill / STK</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{cb?.paybillCount ?? 0} transactions</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>{formatKes(cb?.paybillAmount ?? 0)}</div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(30,41,59,0.5)",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔴</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Airtel Money</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{cb?.airtelCount ?? 0} transactions</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>{formatKes(cb?.airtelAmount ?? 0)}</div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(30,41,59,0.5)",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📞</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>USSD Direct</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{cb?.ussdCount ?? 0} transactions</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{formatKes(cb?.ussdAmount ?? 0)}</div>
            </div>
          </div>
        </div>

        {/* Operational Health & Exception Tracking */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Operational Health</span>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>Fulfillment & Exceptions</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>STS Tokens Issued</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80", marginTop: 4 }}>{f?.tokenIssuedCount ?? 0}</div>
              <div style={{ fontSize: 11, color: f?.tokenFailedCount ? "#f87171" : "var(--color-text-muted)", marginTop: 2 }}>
                {f?.tokenFailedCount ?? 0} token generation failures
              </div>
            </div>

            <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>SMS Delivery</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>{f?.smsDeliveredCount ?? 0}</div>
              <div style={{ fontSize: 11, color: f?.smsFailedCount ? "#f87171" : "var(--color-text-muted)", marginTop: 2 }}>
                {f?.smsFailedCount ?? 0} SMS dispatch failures
              </div>
            </div>

            <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Pending Attempts</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24", marginTop: 4 }}>{f?.pendingAttemptCount ?? 0}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>Awaiting provider STK push</div>
            </div>

            <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Failed / Expired</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f87171", marginTop: 4 }}>
                {(f?.failedAttemptCount ?? 0) + (f?.expiredAttemptCount ?? 0)}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>Cancelled or timed out</div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Summaries Table */}
      <div className="glass-card" style={{ padding: 24, borderRadius: 16, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
            Property Performance Overview
          </h2>
          <Link
            href="/dashboard/properties"
            style={{ fontSize: 13, color: "var(--color-primary-400, #38bdf8)", textDecoration: "none", fontWeight: 600 }}
          >
            Manage Properties →
          </Link>
        </div>

        {adminData?.propertySummaries && adminData.propertySummaries.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Property</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Location</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Buildings/Units</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Meters & QR</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Collections</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Units Sold</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Txns</th>
                </tr>
              </thead>
              <tbody>
                {adminData.propertySummaries.map((p) => (
                  <tr
                    key={p.propertyId}
                    style={{ borderBottom: "1px solid rgba(148,163,184,0.06)", transition: "background 0.15s ease" }}
                  >
                    <td style={{ padding: "12px", fontWeight: 600 }}>{p.propertyName}</td>
                    <td style={{ padding: "12px", color: "var(--color-text-muted)" }}>
                      {p.town ? `${p.town}, ${p.county ?? ""}` : "—"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {p.buildingCount} blocks · {p.apartmentCount} apts
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: "#38bdf8", fontWeight: 600 }}>{p.meterCount} meters</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: 6 }}>
                        ({p.activeQrCount} QR)
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#4ade80" }}>
                      {formatKes(p.confirmedCollections)}
                    </td>
                    <td style={{ padding: "12px", color: "var(--color-text-muted)" }}>
                      {p.unitsPurchased.toLocaleString()} m³
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: "#4ade80", fontWeight: 600 }}>{p.confirmedPaymentCount}</span>
                      {p.failedCount > 0 && (
                        <span style={{ color: "#f87171", fontSize: 11, marginLeft: 4 }}>({p.failedCount} fail)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-muted)" }}>
            No properties found in this timeframe.
          </div>
        )}
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
            Recent Payment Activity
          </h2>
          <Link
            href="/dashboard/payments"
            style={{ fontSize: 13, color: "var(--color-primary-400, #38bdf8)", textDecoration: "none", fontWeight: 600 }}
          >
            All Transactions →
          </Link>
        </div>

        {recentPayments.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Initiated</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Meter</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Channel</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Phone</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Amount</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Status</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>STS Token</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.slice(0, 8).map((tx) => (
                  <tr
                    key={tx.id}
                    style={{ borderBottom: "1px solid rgba(148,163,184,0.06)", transition: "background 0.15s ease" }}
                  >
                    <td style={{ padding: "12px", color: "var(--color-text-muted)" }}>{formatDate(tx.initiatedAt)}</td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 600 }}>{tx.meterNumber}</td>
                    <td style={{ padding: "12px" }}><ChannelBadge channel={tx.channel} /></td>
                    <td style={{ padding: "12px", color: "var(--color-text-muted)" }}>{tx.customerPhone}</td>
                    <td style={{ padding: "12px", fontWeight: 700 }}>{formatKes(tx.requestedAmount)}</td>
                    <td style={{ padding: "12px" }}><StatusBadge status={tx.status} /></td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: 12 }}>
                      {tx.waterToken ? (
                        <span style={{ color: "#4ade80" }}>{tx.waterToken}</span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-muted)" }}>
            No recent payment transactions.
          </div>
        )}
      </div>
    </div>
  );
}

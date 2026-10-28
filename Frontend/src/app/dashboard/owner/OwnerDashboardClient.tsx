"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { OwnerDashboardDto, OwnerDto } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OwnerDashboardClient() {
  const [owners, setOwners] = useState<OwnerDto[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<OwnerDashboardDto | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load owners on mount
  useEffect(() => {
    async function loadOwners() {
      try {
        const list = await api.get<OwnerDto[]>("/api/v1/owners");
        setOwners(list);
        if (list.length > 0 && !selectedOwnerId) {
          setSelectedOwnerId(list[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load property owners.");
      }
    }
    loadOwners();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load dashboard data for selected owner
  const fetchOwnerDashboard = useCallback(async () => {
    if (!selectedOwnerId) {
      setLoading(false);
      return;
    }
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
          const d = new Date(customTo);
          d.setHours(23, 59, 59, 999);
          toParam = d.toISOString();
        }
      }

      const params = new URLSearchParams();
      if (fromParam) params.set("from", fromParam);
      if (toParam) params.set("to", toParam);
      const queryStr = params.toString() ? `?${params.toString()}` : "";

      const res = await api.get<OwnerDashboardDto>(`/api/v1/dashboard/owner/${selectedOwnerId}${queryStr}`);
      setDashboardData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load owner dashboard.");
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedOwnerId, dateFilter, customFrom, customTo]);

  useEffect(() => {
    fetchOwnerDashboard();
  }, [fetchOwnerDashboard]);

  const f = dashboardData?.financials;
  const cb = dashboardData?.channelBreakdown;

  const handleExportCsv = () => {
    if (!dashboardData?.propertySummaries.length) return;

    const headers = [
      "Property Name",
      "Town",
      "County",
      "Buildings",
      "Apartments",
      "Meters",
      "Active QR Stickers",
      "Confirmed Collections (KES)",
      "Units Purchased (m³)",
      "Confirmed Payments",
      "Pending Attempts",
      "Failed Attempts",
    ];

    const rows = dashboardData.propertySummaries.map((p) => [
      `"${p.propertyName}"`,
      `"${p.town ?? ""}"`,
      `"${p.county ?? ""}"`,
      p.buildingCount,
      p.apartmentCount,
      p.meterCount,
      p.activeQrCount,
      p.confirmedCollections,
      p.unitsPurchased,
      p.confirmedPaymentCount,
      p.pendingCount,
      p.failedCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `owner_statement_${dashboardData.ownerName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId);

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Header & Owner Switcher */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              Property Owner Portal
            </h1>
            <span
              style={{
                background: "rgba(56,189,248,0.15)",
                color: "#38bdf8",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              OWNER-ISOLATED
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
            Strictly scoped financial statements, token fulfillment, and meter activity for authorized properties.
          </p>
        </div>

        {/* Owner Selector & Export */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Active Owner:</span>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              style={{
                background: "rgba(30,41,59,0.8)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName} ({o.phone})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={!dashboardData?.propertySummaries.length}
            style={{
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: dashboardData?.propertySummaries.length ? "pointer" : "not-allowed",
              opacity: dashboardData?.propertySummaries.length ? 1 : 0.6,
            }}
          >
            📥 Export Statement
          </button>
        </div>
      </div>

      {/* Owner Info & Date Filter Strip */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          borderRadius: 14,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            👤
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {selectedOwner?.fullName ?? dashboardData?.ownerName ?? "Select an Owner"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {selectedOwner?.email ?? "No email"} · {selectedOwner?.phone ?? "No phone"} ·{" "}
              <strong style={{ color: "#38bdf8" }}>{dashboardData?.authorizedPropertyCount ?? 0} authorized properties</strong>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Period:</span>
          {(["all", "today", "month", "custom"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              style={{
                background: dateFilter === filter ? "var(--color-primary-500, #0284c7)" : "transparent",
                color: dateFilter === filter ? "#fff" : "var(--color-text-muted)",
                border: "none",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {filter === "all" ? "All" : filter === "today" ? "Today" : filter === "month" ? "This Month" : "Custom"}
            </button>
          ))}

          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
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
          ⚠️ {error}
        </div>
      )}

      {/* Owner KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Confirmed Collections"
          value={loading ? "..." : formatKes(f?.grossConfirmedCollections ?? 0)}
          icon="💰"
          change={`${f?.confirmedPaymentCount ?? 0} confirmed transactions`}
          trend="up"
        />
        <StatCard
          label="Water Units Dispensed"
          value={loading ? "..." : `${(f?.totalUnitsPurchased ?? 0).toLocaleString()} m³`}
          icon="💧"
          change="STS prepaid units"
          trend="neutral"
        />
        <StatCard
          label="Tokens Issued"
          value={loading ? "..." : `${f?.tokenIssuedCount ?? 0}`}
          icon="🎫"
          change={`${f?.tokenFailedCount ?? 0} fulfillment failures`}
          trend={f?.tokenFailedCount ? "down" : "up"}
        />
        <StatCard
          label="SMS Delivery"
          value={loading ? "..." : `${f?.smsDeliveredCount ?? 0}`}
          icon="📱"
          change={`${f?.smsFailedCount ?? 0} dispatch failures`}
          trend="neutral"
        />
      </div>

      {/* Channel Breakdown for Owner */}
      <div
        className="glass-card"
        style={{
          padding: 24,
          borderRadius: 16,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Revenue by Payment Channel
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Scan-to-Pay (QR)</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#38bdf8", marginTop: 4 }}>
              {formatKes(cb?.scanToPayAmount ?? 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              {cb?.scanToPayCount ?? 0} payments
            </div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>M-Pesa Paybill / STK</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", marginTop: 4 }}>
              {formatKes(cb?.paybillAmount ?? 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              {cb?.paybillCount ?? 0} payments
            </div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Airtel Money</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f87171", marginTop: 4 }}>
              {formatKes(cb?.airtelAmount ?? 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              {cb?.airtelCount ?? 0} payments
            </div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>USSD Direct</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>
              {formatKes(cb?.ussdAmount ?? 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              {cb?.ussdCount ?? 0} payments
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Properties Summary */}
      <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
              Authorized Property Portfolio
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
              Data strictly limited to properties owned or managed by {selectedOwner?.fullName ?? "this owner"}.
            </p>
          </div>
          <Link
            href="/dashboard/qr-analytics"
            style={{ fontSize: 13, color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}
          >
            View QR Code Status →
          </Link>
        </div>

        {dashboardData?.propertySummaries && dashboardData.propertySummaries.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Property</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Location</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Buildings & Units</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Meters & QR</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Confirmed Revenue</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Units Sold</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.propertySummaries.map((p) => (
                  <tr
                    key={p.propertyId}
                    style={{ borderBottom: "1px solid rgba(148,163,184,0.06)", transition: "background 0.15s ease" }}
                  >
                    <td style={{ padding: "12px", fontWeight: 600 }}>{p.propertyName}</td>
                    <td style={{ padding: "12px", color: "var(--color-text-muted)" }}>
                      {p.town ? `${p.town}, ${p.county ?? ""}` : "—"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {p.buildingCount} blocks · {p.apartmentCount} apartments
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: "#38bdf8", fontWeight: 600 }}>{p.meterCount} meters</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: 6 }}>
                        ({p.activeQrCount} active QR)
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
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
            {loading ? "Loading owner portfolio..." : "No properties assigned to this owner."}
          </div>
        )}
      </div>
    </div>
  );
}

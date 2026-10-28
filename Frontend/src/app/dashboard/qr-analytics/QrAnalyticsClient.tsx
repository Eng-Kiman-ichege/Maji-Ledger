"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api/client";
import type { QrAnalyticsResultDto, QrTraceabilityDto, PropertyDto } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QrAnalyticsClient() {
  const [analytics, setAnalytics] = useState<QrAnalyticsResultDto | null>(null);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModalQr, setActiveModalQr] = useState<QrTraceabilityDto | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedPropertyId) params.set("propertyId", selectedPropertyId);
      if (selectedStatus) params.set("qrStatus", selectedStatus);
      if (fromDate) params.set("from", new Date(fromDate).toISOString());
      if (toDate) {
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        params.set("to", d.toISOString());
      }

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const [res, props] = await Promise.all([
        api.get<QrAnalyticsResultDto>(`/api/v1/dashboard/analytics/qr${queryStr}`),
        properties.length === 0 ? api.get<PropertyDto[]>("/api/v1/properties") : Promise.resolve(properties),
      ]);

      setAnalytics(res);
      if (properties.length === 0) setProperties(props);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load QR analytics.");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, selectedStatus, fromDate, toDate, properties]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const filteredRegistrations = useMemo(() => {
    if (!analytics) return [];
    if (!searchQuery.trim()) return analytics.registrations;
    const q = searchQuery.toLowerCase();
    return analytics.registrations.filter(
      (r) =>
        r.meterNumber.toLowerCase().includes(q) ||
        r.publicToken.toLowerCase().includes(q) ||
        r.propertyName.toLowerCase().includes(q) ||
        (r.unitNumber && r.unitNumber.toLowerCase().includes(q)) ||
        (r.buildingName && r.buildingName.toLowerCase().includes(q))
    );
  }, [analytics, searchQuery]);

  const handleExportCsv = () => {
    if (!filteredRegistrations.length) return;
    const headers = [
      "Public Token",
      "Meter Number",
      "Masked Meter",
      "Property",
      "Building",
      "Unit",
      "Status",
      "Paybill ShortCode",
      "Registered Date",
      "Payment Attempts",
      "Confirmed Payments",
      "Confirmed Amount (KES)",
      "Units (m³)",
      "Tokens Issued",
      "Token Failures",
      "SMS Delivered",
      "SMS Failures",
    ];

    const rows = filteredRegistrations.map((r) => [
      `"${r.publicToken}"`,
      `"${r.meterNumber}"`,
      `"${r.maskedMeterIdentifier}"`,
      `"${r.propertyName}"`,
      `"${r.buildingName ?? ""}"`,
      `"${r.unitNumber ?? ""}"`,
      `"${r.qrStatus}"`,
      `"${r.businessShortCode}"`,
      `"${formatDate(r.registeredAt)}"`,
      r.totalPaymentAttempts,
      r.confirmedPayments,
      r.totalConfirmedAmount,
      r.totalUnitsPurchased,
      r.tokenIssuedCount,
      r.tokenFailedCount,
      r.smsDeliveredCount,
      r.smsFailedCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maji_qr_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Page Header */}
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
            Scan-to-Pay QR Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
            Physical meter QR deployment traceability, conversion metrics, and fulfillment analytics.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!filteredRegistrations.length}
          style={{
            background: "linear-gradient(135deg, #0284c7, #2563eb)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: filteredRegistrations.length ? "pointer" : "not-allowed",
            opacity: filteredRegistrations.length ? 1 : 0.6,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          📥 Export CSV Report
        </button>
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

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Active QR Codes"
          value={loading ? "..." : `${analytics?.activeRegistrations ?? 0} / ${analytics?.totalRegistrations ?? 0}`}
          icon="🏷️"
          change={`${analytics?.disabledRegistrations ?? 0} disabled, ${analytics?.revokedRegistrations ?? 0} revoked`}
          trend="neutral"
        />
        <StatCard
          label="QR Collections"
          value={loading ? "..." : formatKes(analytics?.totalConfirmedRevenue ?? 0)}
          icon="💰"
          change={`${analytics?.confirmedPayments ?? 0} confirmed payments`}
          trend="up"
        />
        <StatCard
          label="Units Dispensed"
          value={loading ? "..." : `${(analytics?.totalUnitsPurchased ?? 0).toLocaleString()} m³`}
          icon="💧"
          change="STS Token fulfillment"
          trend="neutral"
        />
        <StatCard
          label="QR Conversion Rate"
          value={
            loading || !analytics?.totalPaymentAttempts
              ? "0%"
              : `${Math.round(((analytics.confirmedPayments ?? 0) / analytics.totalPaymentAttempts) * 100)}%`
          }
          icon="🎯"
          change={`${analytics?.totalPaymentAttempts ?? 0} total scan attempts`}
          trend="up"
        />
      </div>

      {/* Filters Bar */}
      <div
        className="glass-card"
        style={{
          padding: 20,
          borderRadius: 14,
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ flex: "1 1 240px" }}>
          <input
            type="text"
            placeholder="Search by meter #, token, property, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 13,
            }}
          />
        </div>

        {/* Property Filter */}
        <div>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            style={{
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 13,
            }}
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 13,
            }}
          >
            <option value="">All QR Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>

        {/* Date Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
            }}
          />
        </div>
      </div>

      {/* Traceability Table */}
      <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
            Registered QR Codes & Traceability
          </h2>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Showing {filteredRegistrations.length} of {analytics?.totalRegistrations ?? 0} registrations
          </span>
        </div>

        {filteredRegistrations.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Public Token</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Meter & Location</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Destination</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Status</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Activity</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Collections</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Fulfillment</th>
                  <th style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((r) => {
                  const statusStr = String(r.qrStatus);
                  const isAct = statusStr === "Active" || statusStr === "1";
                  const isDis = statusStr === "Disabled" || statusStr === "2";

                  return (
                    <tr
                      key={r.qrRegistrationId}
                      style={{ borderBottom: "1px solid rgba(148,163,184,0.06)", transition: "background 0.15s ease" }}
                    >
                      <td style={{ padding: "12px", fontFamily: "monospace", fontSize: 12 }}>
                        <span style={{ color: "#38bdf8", fontWeight: 600 }}>{r.publicToken}</span>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {formatDate(r.registeredAt)}
                        </div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 600 }}>{r.meterNumber}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {r.propertyName} · {r.buildingName ?? ""} {r.unitNumber ? `(#${r.unitNumber})` : ""}
                        </div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 600 }}>{r.businessShortCode}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{r.providerDisplayName}</div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isAct
                              ? "rgba(74,222,128,0.15)"
                              : isDis
                              ? "rgba(251,191,36,0.15)"
                              : "rgba(248,113,113,0.15)",
                            color: isAct ? "#4ade80" : isDis ? "#fbbf24" : "#f87171",
                          }}
                        >
                          {isAct ? "ACTIVE" : isDis ? "DISABLED" : "REVOKED"}
                        </span>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div>
                          <span style={{ color: "#4ade80", fontWeight: 700 }}>{r.confirmedPayments}</span>
                          <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                            {" "}
                            / {r.totalPaymentAttempts} attempts
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {r.totalPaymentAttempts > 0
                            ? `${Math.round((r.confirmedPayments / r.totalPaymentAttempts) * 100)}% conversion`
                            : "No scans"}
                        </div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 700, color: "#4ade80" }}>{formatKes(r.totalConfirmedAmount)}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {r.totalUnitsPurchased.toLocaleString()} m³
                        </div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div style={{ fontSize: 12 }}>
                          STS:{" "}
                          <span style={{ color: "#4ade80", fontWeight: 600 }}>{r.tokenIssuedCount}</span>
                          {r.tokenFailedCount > 0 && (
                            <span style={{ color: "#f87171", marginLeft: 4 }}>({r.tokenFailedCount} fail)</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          SMS: {r.smsDeliveredCount} delivered
                          {r.smsFailedCount > 0 && (
                            <span style={{ color: "#f87171", marginLeft: 4 }}>({r.smsFailedCount} fail)</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => setActiveModalQr(r)}
                          style={{
                            background: "rgba(56,189,248,0.1)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56,189,248,0.3)",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
            {loading ? "Loading QR analytics data..." : "No QR code registrations matched your filters."}
          </div>
        )}
      </div>

      {/* Drill-down Detail Modal */}
      {activeModalQr && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 20,
          }}
          onClick={() => setActiveModalQr(null)}
        >
          <div
            className="glass-card"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 20,
              maxWidth: 580,
              width: "100%",
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>QR Registration Traceability</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                  Token: <code style={{ color: "#38bdf8" }}>{activeModalQr.publicToken}</code>
                </p>
              </div>
              <button
                onClick={() => setActiveModalQr(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Location Hierarchy</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {activeModalQr.propertyName} → {activeModalQr.buildingName ?? "Building"} → Unit {activeModalQr.unitNumber ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                  Meter Number: <strong>{activeModalQr.meterNumber}</strong> ({activeModalQr.maskedMeterIdentifier})
                </div>
              </div>

              <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Payment Configuration</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {activeModalQr.providerDisplayName} (ShortCode: {activeModalQr.businessShortCode})
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                  Status: <strong>{String(activeModalQr.qrStatus)}</strong> · Registered: {formatDate(activeModalQr.registeredAt)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Total Scans / Attempts</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{activeModalQr.totalPaymentAttempts}</div>
                  <div style={{ fontSize: 11, color: "#4ade80" }}>{activeModalQr.confirmedPayments} confirmed</div>
                </div>

                <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Gross Collections</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80", marginTop: 4 }}>
                    {formatKes(activeModalQr.totalConfirmedAmount)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {activeModalQr.totalUnitsPurchased.toLocaleString()} m³ dispensed
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>STS Token Delivery</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#4ade80", marginTop: 4 }}>
                    {activeModalQr.tokenIssuedCount} Issued
                  </div>
                  <div style={{ fontSize: 11, color: activeModalQr.tokenFailedCount ? "#f87171" : "var(--color-text-muted)" }}>
                    {activeModalQr.tokenFailedCount} Failed
                  </div>
                </div>

                <div style={{ background: "rgba(30,41,59,0.5)", padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Customer SMS Notification</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#38bdf8", marginTop: 4 }}>
                    {activeModalQr.smsDeliveredCount} Delivered
                  </div>
                  <div style={{ fontSize: 11, color: activeModalQr.smsFailedCount ? "#f87171" : "var(--color-text-muted)" }}>
                    {activeModalQr.smsFailedCount} Failed
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                onClick={() => setActiveModalQr(null)}
                style={{
                  background: "rgba(148,163,184,0.15)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

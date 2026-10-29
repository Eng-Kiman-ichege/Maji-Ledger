"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api/client";
import type { QrAnalyticsResultDto, QrTraceabilityDto, PropertyDto } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";
import { QrCode, Search, Download, Filter, X, ExternalLink, CheckCircle2, AlertTriangle, Check } from "lucide-react";

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
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch properties once on mount for filter dropdown
  useEffect(() => {
    api
      .get<PropertyDto[]>("/api/v1/properties")
      .then(setProperties)
      .catch(() => {});
  }, []);

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
      const res = await api.get<QrAnalyticsResultDto>(`/api/v1/dashboard/analytics/qr${queryStr}`);
      setAnalytics(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load QR analytics.");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, selectedStatus, fromDate, toDate]);

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
      `"${r.registeredAt}"`,
      r.totalPaymentAttempts,
      r.confirmedPayments,
      r.totalConfirmedAmount.toFixed(2),
      r.totalUnitsPurchased.toFixed(2),
      r.tokenIssuedCount,
      r.tokenFailedCount,
      r.smsDeliveredCount,
      r.smsFailedCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maji_qr_traceability_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/pay/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div style={{ padding: "32px 36px 80px", maxWidth: 1440, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            Scan-to-Pay QR Analytics
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Physical meter QR deployment traceability, conversion metrics, and fulfillment analytics.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!filteredRegistrations.length}
          className="btn-outline"
          style={{ fontSize: 13, padding: "8px 16px" }}
        >
          <Download size={15} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Active QR Tags"
          value={loading ? "..." : `${analytics?.activeRegistrations ?? 0} / ${analytics?.totalRegistrations ?? 0}`}
          icon={<QrCode size={18} />}
          change={`${analytics?.disabledRegistrations ?? 0} disabled`}
          trend="neutral"
          colorScheme="blue"
        />
        <StatCard
          label="QR Collections"
          value={loading ? "..." : formatKes(analytics?.totalConfirmedRevenue ?? 0)}
          icon="💰"
          change={`${analytics?.confirmedPayments ?? 0} payments`}
          trend="up"
          colorScheme="emerald"
        />
        <StatCard
          label="Units Dispensed"
          value={loading ? "..." : `${(analytics?.totalUnitsPurchased ?? 0).toLocaleString()} m³`}
          icon="💧"
          sub="STS Token fulfillment"
          colorScheme="teal"
        />
        <StatCard
          label="QR Conversion Rate"
          value={
            loading || !analytics?.totalPaymentAttempts
              ? "0%"
              : `${Math.round(((analytics.confirmedPayments ?? 0) / analytics.totalPaymentAttempts) * 100)}%`
          }
          icon="🎯"
          change={`${analytics?.totalPaymentAttempts ?? 0} total scans`}
          trend="up"
          colorScheme="indigo"
        />
      </div>

      {/* Filters Bar */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by meter #, token, property, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Property Filter */}
        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="input-base"
          style={{ width: "auto" }}
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="input-base"
          style={{ width: "auto" }}
        >
          <option value="">All QR Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Disabled">Disabled</option>
          <option value="Revoked">Revoked</option>
        </select>
      </div>

      {/* Traceability Table */}
      <div
        className="glass-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Registered QR Codes & Traceability
          </h2>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Showing {filteredRegistrations.length} of {analytics?.totalRegistrations ?? 0} registrations
          </span>
        </div>

        {filteredRegistrations.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Public Token</th>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Meter & Location</th>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Destination</th>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Conversion</th>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Collections</th>
                  <th style={{ padding: "12px 14px", color: "#475569", fontWeight: 700 }}>Action</th>
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
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f8fafc")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12 }}>
                        <span style={{ color: "#0284c7", fontWeight: 700 }}>{r.publicToken}</span>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{formatDate(r.registeredAt)}</div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.meterNumber}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {r.propertyName} {r.buildingName ? `· ${r.buildingName}` : ""}{" "}
                          {r.unitNumber ? `(#${r.unitNumber})` : ""}
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.businessShortCode}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{r.providerDisplayName}</div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isAct ? "#ecfdf5" : isDis ? "#fffbeb" : "#fff1f2",
                            color: isAct ? "#059669" : isDis ? "#d97706" : "#e11d48",
                            border: `1px solid ${isAct ? "#a7f3d0" : isDis ? "#fde68a" : "#fecdd3"}`,
                          }}
                        >
                          {isAct ? "ACTIVE" : isDis ? "DISABLED" : "REVOKED"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div>
                          <span style={{ color: "#059669", fontWeight: 700 }}>{r.confirmedPayments}</span>
                          <span style={{ color: "#64748b", fontSize: 11 }}> / {r.totalPaymentAttempts} scans</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {r.totalPaymentAttempts > 0
                            ? `${Math.round((r.confirmedPayments / r.totalPaymentAttempts) * 100)}% conversion`
                            : "No scans"}
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {formatKes(r.totalConfirmedAmount)}
                        </div>
                        <div style={{ fontSize: 11, color: "#0284c7" }}>
                          {r.totalUnitsPurchased.toLocaleString()} m³
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <button
                          onClick={() => setActiveModalQr(r)}
                          className="btn-outline"
                          style={{ padding: "5px 10px", fontSize: 11 }}
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
          <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
            {loading ? "Loading QR analytics data..." : "No QR code registrations matched your filters."}
          </div>
        )}
      </div>

      {/* Drill-down Detail Modal in Light Mode */}
      {activeModalQr && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.4)",
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
              maxWidth: 580,
              width: "100%",
              padding: "28px",
              boxShadow: "var(--shadow-dropdown)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 14,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  QR Code Traceability Details
                </h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Token: <span style={{ fontFamily: "monospace", color: "#0284c7" }}>{activeModalQr.publicToken}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalQr(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Property & Unit
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 3 }}>
                  {activeModalQr.propertyName}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {activeModalQr.buildingName} {activeModalQr.unitNumber ? `(Unit ${activeModalQr.unitNumber})` : ""}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Smart Meter
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 3 }}>
                  {activeModalQr.meterNumber}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Masked: {activeModalQr.maskedMeterIdentifier}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => handleCopyLink(activeModalQr.publicToken)}
                className="btn-outline"
                style={{ fontSize: 12 }}
              >
                {copiedToken ? <Check size={14} color="#059669" /> : <ExternalLink size={14} />}
                <span>{copiedToken ? "Copied Payment URL!" : "Copy Scan-to-Pay Link"}</span>
              </button>

              <button onClick={() => setActiveModalQr(null)} className="btn-secondary" style={{ fontSize: 12 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

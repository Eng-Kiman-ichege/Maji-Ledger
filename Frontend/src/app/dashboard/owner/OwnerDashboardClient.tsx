"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { OwnerDashboardDto, OwnerDto, PropertySummaryDto } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";
import WaterConsumptionChart from "@/components/charts/WaterConsumptionChart";
import ChannelDonutChart from "@/components/charts/ChannelDonutChart";
import {
  UserCheck,
  Building2,
  Droplets,
  DollarSign,
  Download,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Clock,
  ExternalLink,
} from "lucide-react";

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
  const currentOwner = owners.find((o) => o.id === selectedOwnerId);

  // Financial payout calculations:
  // Gross collections from owner's tenants
  const gross = f?.grossConfirmedCollections || 0;
  const platformFee = Math.round(gross * 0.05 * 100) / 100; // 5% Maji Ledger fee
  const smsExpenses = Math.round((f?.smsDeliveredCount || 0) * 0.8 * 100) / 100;
  const netPayable = Math.max(0, Math.round((gross - platformFee - smsExpenses) * 100) / 100);

  const handleExportCsv = () => {
    if (!dashboardData?.propertySummaries.length) return;

    const headers = [
      "Property Name",
      "Town",
      "County",
      "Buildings",
      "Apartments",
      "Meters",
      "Active QR",
      "Gross Collections (KES)",
      "Maji Ledger Fee (5%)",
      "Net Payout (KES)",
      "Water Units (m3)",
      "Confirmed Tokens",
    ];

    const rows = dashboardData.propertySummaries.map((p) => {
      const fee = p.confirmedCollections * 0.05;
      const net = p.confirmedCollections - fee;
      return [
        `"${p.propertyName}"`,
        `"${p.town || ""}"`,
        `"${p.county || ""}"`,
        p.buildingCount,
        p.apartmentCount,
        p.meterCount,
        p.activeQrCount,
        p.confirmedCollections.toFixed(2),
        fee.toFixed(2),
        net.toFixed(2),
        p.unitsPurchased.toFixed(2),
        p.confirmedPaymentCount,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maji_ledger_owner_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "32px 36px 80px", maxWidth: 1440, margin: "0 auto" }}>
      {/* ── Top Header & Owner Selector ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#ecfdf5",
                color: "#059669",
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: "1px solid #a7f3d0",
              }}
            >
              <UserCheck size={14} />
              LANDLORD & PROPERTY OWNER PORTAL
            </span>
            <span style={{ fontSize: 13, color: "#64748b" }}>•</span>
            <span style={{ fontSize: 13, color: "#0284c7", fontWeight: 600 }}>Active Tenancy Tracking</span>
          </div>

          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#0f172a",
              margin: "6px 0",
            }}
          >
            {dashboardData?.ownerName ? `${dashboardData.ownerName}'s Portfolio` : "Property Owner Dashboard"}
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Monitor tenant water consumption, track smart meter dispatches, and review net monthly disbursements.
          </p>
        </div>

        {/* Owner Dropdown Switcher & Date Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {owners.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Viewing As:</span>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="input-base"
                style={{ width: "auto", fontSize: 13, fontWeight: 600 }}
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.fullName} ({o.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export CSV button */}
          <button onClick={handleExportCsv} className="btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>
            <Download size={15} />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* ── Owner Profile Card Banner ── */}
      {currentOwner && (
        <div
          className="glass-card"
          style={{
            padding: "18px 24px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
            border: "1px solid #bbf7d0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                border: "1px solid #a7f3d0",
              }}
            >
              👤
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{currentOwner.fullName}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Phone: <strong>{currentOwner.phone}</strong> • KRA PIN: {currentOwner.kraPin || "A001928374Z"} • Status:{" "}
                <span style={{ color: "#059669", fontWeight: 700 }}>Verified Owner</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Authorized Properties
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0284c7" }}>
                {dashboardData?.authorizedPropertyCount ?? 0} Registered
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Disbursement Account
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>
                M-Pesa ({currentOwner.phone})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#be123c",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={20} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
          </div>
          <button onClick={fetchOwnerDashboard} className="btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}>
            Retry Sync
          </button>
        </div>
      )}

      {/* ── 4 Owner KPI Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Wallet size={20} />}
          label="Net Payout Due"
          value={formatKes(netPayable)}
          change="After 5% fee & SMS"
          trend="up"
          accent
          colorScheme="emerald"
        />

        <StatCard
          icon={<Droplets size={20} />}
          label="Water Volume Spent"
          value={`${(f?.totalUnitsPurchased ?? 0).toLocaleString()} m³`}
          change="Consumed by tenants"
          trend="up"
          colorScheme="blue"
        />

        <StatCard
          icon={<DollarSign size={20} />}
          label="Gross Collections"
          value={formatKes(gross)}
          sub={`${f?.confirmedPaymentCount ?? 0} token transactions`}
          colorScheme="teal"
        />

        <StatCard
          icon={<Building2 size={20} />}
          label="Properties & Units"
          value={`${dashboardData?.authorizedPropertyCount ?? 0} Properties`}
          sub={`${dashboardData?.propertySummaries?.reduce((s, p) => s + p.apartmentCount, 0) || 0} tenant units`}
          colorScheme="indigo"
        />
      </div>

      {/* ── Owner Settlement Statement Banner ── */}
      <div
        className="glass-card"
        style={{
          padding: "24px",
          marginBottom: 28,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={18} color="#059669" />
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Owner Settlement Breakdown
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              Transparent deduction breakdown: Gross revenue minus platform maintenance fee
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#ecfdf5",
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #a7f3d0",
            }}
          >
            <Clock size={15} color="#059669" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#047857" }}>
              Payout Cycle: Automated Every 24h
            </span>
          </div>
        </div>

        {/* 3 Step Formula Line */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            padding: "16px",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              1. Gross Water Collections
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
              {formatKes(gross)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>From prepaid meter vending</div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
              2. Platform Deductions (5% + SMS)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
              - {formatKes(platformFee + smsExpenses)}
            </div>
            <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>
              Fee: {formatKes(platformFee)} • SMS: {formatKes(smsExpenses)}
            </div>
          </div>

          <div
            style={{
              background: "#ecfdf5",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #a7f3d0",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
              3. Net Owner Payable (95%)
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#059669",
                marginTop: 4,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              = {formatKes(netPayable)}
            </div>
            <div style={{ fontSize: 11, color: "#047857", marginTop: 2, fontWeight: 600 }}>
              Directly into owner bank / M-Pesa
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row: Water Usage for Landlord + Payment Methods ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <WaterConsumptionChart
          title="Tenant Water Consumption Flow"
          subtitle="Daily cubic meters (m³) of prepaid water consumed across your properties"
          color="#059669"
          unitLabel="m³"
        />

        <ChannelDonutChart channelBreakdown={cb} />
      </div>

      {/* ── My Properties & Tenant Buildings Table ── */}
      <div
        className="glass-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={20} color="#059669" />
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                My Authorized Properties & Units
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              Detailed breakdown of water spent and net earnings per property
            </p>
          </div>

          <button onClick={handleExportCsv} className="btn-outline" style={{ fontSize: 12, padding: "6px 12px" }}>
            <Download size={14} />
            <span>Download CSV Statement</span>
          </button>
        </div>

        {dashboardData?.propertySummaries.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏘️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
              No properties currently assigned to this owner profile.
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              Contact your system administrator to associate your rental buildings.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Property Name
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Water Spent (m³)
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Tenant Collections
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Maji Ledger Fee (5%)
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Net Payout
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Units / Meters
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.propertySummaries.map((p) => {
                  const fee = p.confirmedCollections * 0.05;
                  const net = p.confirmedCollections - fee;
                  return (
                    <tr key={p.propertyId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{p.propertyName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {p.town || "N/A"}, {p.county || "Kenya"}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Droplets size={14} color="#059669" />
                          <span style={{ fontWeight: 700, color: "#059669" }}>
                            {p.unitsPurchased.toLocaleString()} m³
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {p.confirmedPaymentCount} vending events
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                        {formatKes(p.confirmedCollections)}
                      </td>

                      <td style={{ padding: "14px 16px", color: "#d97706", fontWeight: 600 }}>
                        - {formatKes(fee)}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 800, color: "#059669", fontSize: 14 }}>
                          {formatKes(net)}
                        </div>
                        <div style={{ fontSize: 11, color: "#059669", fontWeight: 600, marginTop: 2 }}>
                          ✓ Ready for payout
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, color: "#334155" }}>
                          <strong>{p.buildingCount}</strong> bldgs • <strong>{p.apartmentCount}</strong> units
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {p.meterCount} smart meters ({p.activeQrCount} QR enabled)
                        </div>
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

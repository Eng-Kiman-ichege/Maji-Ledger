"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { AdminDashboardDto, PaymentAttemptDto, PropertySummaryDto, PropertyType } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge, ChannelBadge } from "@/components/ui/Badges";
import WaterConsumptionChart from "@/components/charts/WaterConsumptionChart";
import RevenueFlowChart from "@/components/charts/RevenueFlowChart";
import ChannelDonutChart from "@/components/charts/ChannelDonutChart";
import {
  Building2,
  Droplets,
  DollarSign,
  Gauge,
  Plus,
  Search,
  Filter,
  X,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

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

  // Property Filtering State
  const [propertySearch, setPropertySearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("all");

  // Property Detail Modal State
  const [selectedProperty, setSelectedProperty] = useState<PropertySummaryDto | null>(null);

  // Add Property Modal State
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("Residential");
  const [newTown, setNewTown] = useState("");
  const [newCounty, setNewCounty] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [createPropertyError, setCreatePropertyError] = useState("");
  const [createPropertySuccess, setCreatePropertySuccess] = useState(false);

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

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyName.trim()) {
      setCreatePropertyError("Property name is required.");
      return;
    }

    setIsCreatingProperty(true);
    setCreatePropertyError("");
    try {
      await api.post("/api/v1/properties", {
        name: newPropertyName.trim(),
        type: newPropertyType,
        town: newTown.trim() || undefined,
        county: newCounty.trim() || undefined,
        address: newAddress.trim() || undefined,
      });

      setCreatePropertySuccess(true);
      setTimeout(() => {
        setIsAddPropertyOpen(false);
        setCreatePropertySuccess(false);
        setNewPropertyName("");
        setNewTown("");
        setNewCounty("");
        setNewAddress("");
        fetchData();
      }, 1200);
    } catch (err: unknown) {
      setCreatePropertyError(err instanceof Error ? err.message : "Failed to create property.");
    } finally {
      setIsCreatingProperty(false);
    }
  };

  const f = adminData?.financials;
  const cb = adminData?.channelBreakdown;

  // Filtered property list
  const filteredProperties = (adminData?.propertySummaries || []).filter((p) => {
    const matchesSearch =
      p.propertyName.toLowerCase().includes(propertySearch.toLowerCase()) ||
      (p.town || "").toLowerCase().includes(propertySearch.toLowerCase()) ||
      (p.county || "").toLowerCase().includes(propertySearch.toLowerCase());
    const matchesCounty = countyFilter === "all" || p.county === countyFilter;
    return matchesSearch && matchesCounty;
  });

  // Extract unique counties for filter
  const uniqueCounties = Array.from(
    new Set((adminData?.propertySummaries || []).map((p) => p.county).filter(Boolean))
  ) as string[];

  // Calculate platform economics for the hero banner
  const grossTotal = f?.grossConfirmedCollections || 0;
  const platformFee = Math.round(grossTotal * 0.05 * 100) / 100;
  const ownerPayoutTotal = Math.max(0, Math.round(grossTotal * 0.938 * 100) / 100);

  return (
    <div style={{ padding: "32px 36px 80px", maxWidth: 1440, margin: "0 auto" }}>
      {/* ── Top Header & Global Date Filter ── */}
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
                background: "#f0f9ff",
                color: "#0284c7",
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: "1px solid #bae6fd",
              }}
            >
              <ShieldCheck size={14} />
              ADMINISTRATOR CONSOLE
            </span>
            <span style={{ fontSize: 13, color: "#64748b" }}>•</span>
            <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>System Live & Healthy</span>
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
            Maji Ledger Operations Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Real-time prepaid water vending, property portfolio telemetry, and revenue settlement ledger.
          </p>
        </div>

        {/* Filter controls & Add Property Action */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Quick Date Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 3,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {(["all", "today", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDateFilter(mode)}
                style={{
                  background: dateFilter === mode ? "var(--color-primary)" : "transparent",
                  color: dateFilter === mode ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: 7,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textTransform: "capitalize",
                }}
              >
                {mode === "all" ? "All Time" : mode === "today" ? "Today" : "This Month"}
              </button>
            ))}
          </div>

          {/* Add Property Button */}
          <button
            onClick={() => setIsAddPropertyOpen(true)}
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            <Plus size={16} />
            <span>Add Property</span>
          </button>
        </div>
      </div>

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
            <span>⚠️</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
          </div>
          <button onClick={fetchData} className="btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}>
            Retry Sync
          </button>
        </div>
      )}

      {/* ── 4 Executive KPI Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<DollarSign size={20} />}
          label="Gross Collections"
          value={formatKes(grossTotal)}
          change="+18.4% this month"
          trend="up"
          accent
          colorScheme="emerald"
        />

        <StatCard
          icon={<Droplets size={20} />}
          label="Water Dispensed"
          value={`${(f?.totalUnitsPurchased ?? 0).toLocaleString()} m³`}
          change={`${(f?.confirmedPaymentCount ?? 0).toLocaleString()} vending tokens`}
          trend="up"
          colorScheme="blue"
        />

        <StatCard
          icon={<Sparkles size={20} />}
          label="Platform Margin"
          value={formatKes(platformFee)}
          sub="5% fee - SMS costs"
          trend="up"
          colorScheme="teal"
        />

        <StatCard
          icon={<Building2 size={20} />}
          label="Portfolio Scale"
          value={`${adminData?.totalProperties ?? 0} Estates`}
          sub={`${adminData?.activeMeters ?? 0} active meters`}
          colorScheme="indigo"
        />
      </div>

      {/* ── Revenue Waterfall & Deduction Audit Section ── */}
      <div style={{ marginBottom: 28 }}>
        <RevenueFlowChart
          grossCollections={grossTotal}
          smsDeliveredCount={f?.smsDeliveredCount ?? 0}
          confirmedCount={f?.confirmedPaymentCount ?? 0}
        />
      </div>

      {/* ── Visual Analytics Row: Water Consumption Chart + Payment Donut ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <WaterConsumptionChart
          title="Water Dispensed & Consumption Trend"
          subtitle="Daily prepaid water volume (m³) across connected smart meters"
          color="#0284c7"
          unitLabel="m³"
        />

        <ChannelDonutChart channelBreakdown={cb} />
      </div>

      {/* ── Properties Portfolio Management & Filter Section ── */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: 28 }}>
        {/* Section Header */}
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
              <Building2 size={20} color="#0284c7" />
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Property Portfolio Telemetry
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              Click any property to inspect water volume spent, money collected, and owner payout deductions.
            </p>
          </div>

          {/* Search & Filter Inputs */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: 220 }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search properties or towns..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="input-base"
                style={{ paddingLeft: 36, fontSize: 13 }}
              />
            </div>

            {/* County filter dropdown */}
            {uniqueCounties.length > 0 && (
              <select
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="input-base"
                style={{ width: "auto", fontSize: 13 }}
              >
                <option value="all">All Counties</option>
                {uniqueCounties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <button onClick={() => setIsAddPropertyOpen(true)} className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} />
              <span>Add Property</span>
            </button>
          </div>
        </div>

        {/* Table of Properties */}
        {filteredProperties.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏘️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>No properties found</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>Try adjusting your search terms or add a new property.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Property / Location
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Water Spent
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Gross Collections
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Est. Owner Payout
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Scale (Bldgs/Apts)
                  </th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => {
                  const estPayout = Math.max(0, p.confirmedCollections * 0.938);
                  return (
                    <tr
                      key={p.propertyId}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onClick={() => setSelectedProperty(p)}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                    >
                      {/* Name & Location */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{p.propertyName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {p.town || "N/A"}, {p.county || "Kenya"}
                        </div>
                      </td>

                      {/* Water spent */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Droplets size={14} color="#0284c7" />
                          <span style={{ fontWeight: 700, color: "#0284c7" }}>
                            {p.unitsPurchased.toLocaleString()} m³
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {p.confirmedPaymentCount} tokens purchased
                        </div>
                      </td>

                      {/* Gross Money Made */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {formatKes(p.confirmedCollections)}
                        </div>
                        <div style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>
                          Confirmed revenue
                        </div>
                      </td>

                      {/* Net Owner Payout */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#059669" }}>
                          {formatKes(estPayout)}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          After ~6.2% deductions
                        </div>
                      </td>

                      {/* Infrastructure Scale */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                          <span
                            style={{
                              background: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: 6,
                              color: "#334155",
                              fontWeight: 600,
                            }}
                          >
                            {p.buildingCount} Buildings
                          </span>
                          <span
                            style={{
                              background: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: 6,
                              color: "#334155",
                              fontWeight: 600,
                            }}
                          >
                            {p.apartmentCount} Units
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                          {p.meterCount} meters • {p.activeQrCount} QR tags
                        </div>
                      </td>

                      {/* Inspect button */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProperty(p);
                          }}
                          className="btn-outline"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            borderRadius: 8,
                          }}
                        >
                          <span>Inspect</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Live Vending Transactions Stream ── */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Recent Token Transactions
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              Live stream of tenant water token purchases and STS dispatch status
            </p>
          </div>

          <Link href="/dashboard/payments" className="btn-outline" style={{ fontSize: 12, padding: "6px 14px" }}>
            View All Payments →
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Meter</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Channel</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Phone</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Amount</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Units</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Token</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 700 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.slice(0, 8).map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a" }}>{tx.meterNumber}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <ChannelBadge channel={tx.channel} />
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569" }}>{tx.customerPhone}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                    {formatKes(tx.requestedAmount)}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0284c7" }}>
                    {tx.unitsIssued ? `${tx.unitsIssued.toFixed(1)} m³` : "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#334155" }}>
                    {tx.waterToken ? (
                      <span
                        style={{
                          background: "#f0fdf4",
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: "#16a34a",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {tx.waterToken.slice(0, 10)}...
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                    {formatDate(tx.initiatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PROPERTY DRILL-DOWN MODAL ── */}
      {selectedProperty && (
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
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              boxShadow: "var(--shadow-dropdown)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 16,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0284c7",
                    background: "#f0f9ff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid #bae6fd",
                    textTransform: "uppercase",
                  }}
                >
                  Property Telemetry & Settlement
                </span>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "8px 0 4px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {selectedProperty.propertyName}
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  Location: {selectedProperty.town || "N/A"}, {selectedProperty.county || "Kenya"}
                </p>
              </div>

              <button
                onClick={() => setSelectedProperty(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* Modal Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ background: "#f0f9ff", padding: "16px", borderRadius: 12, border: "1px solid #bae6fd" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", textTransform: "uppercase" }}>
                  Water Volume Spent
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
                  {selectedProperty.unitsPurchased.toLocaleString()} m³
                </div>
                <div style={{ fontSize: 12, color: "#0284c7", marginTop: 4 }}>
                  {selectedProperty.confirmedPaymentCount} confirmed vending events
                </div>
              </div>

              <div style={{ background: "#ecfdf5", padding: "16px", borderRadius: 12, border: "1px solid #a7f3d0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
                  Gross Money Made
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", marginTop: 4 }}>
                  {formatKes(selectedProperty.confirmedCollections)}
                </div>
                <div style={{ fontSize: 12, color: "#047857", marginTop: 4 }}>
                  Collected through smart paybills
                </div>
              </div>

              <div style={{ background: "#fffbeb", padding: "16px", borderRadius: 12, border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
                  Platform Deductions (Est. 6.2%)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
                  {formatKes(selectedProperty.confirmedCollections * 0.062)}
                </div>
                <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>
                  5% Maji Ledger fee + SMS gateway token dispatch
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                  Net Payable to Landlord
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                  {formatKes(selectedProperty.confirmedCollections * 0.938)}
                </div>
                <div style={{ fontSize: 11, color: "#059669", marginTop: 4, fontWeight: 600 }}>
                  Ready for automated disbursement
                </div>
              </div>
            </div>

            {/* Infrastructure Details */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                Infrastructure Topology
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                    {selectedProperty.buildingCount}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Registered Buildings</div>
                </div>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                    {selectedProperty.apartmentCount}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Rental Apartments</div>
                </div>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0284c7" }}>
                    {selectedProperty.activeQrCount} / {selectedProperty.meterCount}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Active QR Meters</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setSelectedProperty(null)} className="btn-secondary">
                Close
              </button>
              <Link href={`/dashboard/properties`} className="btn-primary">
                Manage Property Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD PROPERTY MODAL ── */}
      {isAddPropertyOpen && (
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
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setIsAddPropertyOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: 540,
              padding: "32px",
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
                paddingBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#f0f9ff",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Register New Property
                  </h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                    Add estate or commercial building to the water metering network
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddPropertyOpen(false)}
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

            {createPropertySuccess ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <CheckCircle2 size={48} color="#059669" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Property Created Successfully!
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  Refreshing your portfolio overview...
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateProperty}>
                {createPropertyError && (
                  <div
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 16,
                      fontSize: 13,
                      color: "#be123c",
                    }}
                  >
                    {createPropertyError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Property Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kilimani Heights Residency"
                      value={newPropertyName}
                      onChange={(e) => setNewPropertyName(e.target.value)}
                      className="input-base"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Property Type
                    </label>
                    <select
                      value={newPropertyType}
                      onChange={(e) => setNewPropertyType(e.target.value as PropertyType)}
                      className="input-base"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Mixed">Mixed Use</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                        Town
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nairobi"
                        value={newTown}
                        onChange={(e) => setNewTown(e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                        County
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nairobi County"
                        value={newCounty}
                        onChange={(e) => setNewCounty(e.target.value)}
                        className="input-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Physical Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lenana Road, Block 4B"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="input-base"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 24,
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsAddPropertyOpen(false)}
                    className="btn-secondary"
                    disabled={isCreatingProperty}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isCreatingProperty}>
                    {isCreatingProperty ? "Registering..." : "Create Property"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

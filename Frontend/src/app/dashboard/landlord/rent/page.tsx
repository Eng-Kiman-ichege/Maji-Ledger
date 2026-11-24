"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, RentChargeDto } from "@/types/domain";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatKesFull(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Mini Bar Chart for Rent Collections */
function MiniBarChart({ values, color = "#059669" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const w = 150;
  const h = 42;
  const gap = 3;
  const bw = (w - gap * (values.length - 1)) / values.length;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 4));
        const isLast = i === values.length - 1;
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={3}
            fill={isLast ? color : `${color}66`}
          />
        );
      })}
    </svg>
  );
}

export default function LandlordRentPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [charges, setCharges] = useState<RentChargeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        const url = selectedPropertyId
          ? `/api/v1/rent/charges?propertyId=${selectedPropertyId}`
          : "/api/v1/rent/charges";
        const res = await api.get<RentChargeDto[]>(url);
        setCharges(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPropertyId]);

  const filtered = charges.filter((c) => {
    const s = search.toLowerCase();
    const matchesSearch =
      (c.tenantName && c.tenantName.toLowerCase().includes(s)) ||
      (c.unitNumber && c.unitNumber.toLowerCase().includes(s)) ||
      (c.chargeReference && c.chargeReference.toLowerCase().includes(s)) ||
      (c.billingPeriod && c.billingPeriod.toLowerCase().includes(s));

    const matchesStatus = statusFilter === "all" ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = filtered.reduce((acc, c) => acc + (c.amount || 0), 0);
  const totalPaid = filtered.reduce((acc, c) => acc + (c.amountPaid || 0), 0);
  const totalOutstanding = filtered.reduce((acc, c) => acc + (c.outstandingAmount || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
  const overdueCount = filtered.filter((c) => c.status === "Overdue").length;

  const trendVals = [0.65, 0.72, 0.81, 0.88, 0.94, 1.0].map((m) => Math.round(totalPaid * m));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%)",
          borderRadius: 20,
          padding: "32px 36px",
          position: "relative",
          overflow: "hidden",
          color: "#ffffff",
          boxShadow: "0 10px 30px -10px rgba(67, 56, 202, 0.4)",
        }}
      >
        <div style={{ position: "absolute", right: -50, top: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🏢 Property Suite
              </div>
              <div style={{ background: "rgba(99,102,241,0.5)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(255,255,255,0.2)" }}>
                Rent Ledger
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Rent Collections & Receivables
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Real-time rent billing schedules, collection reconciliations, and tenant arrears management.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/dashboard/landlord/statements"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 10,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                backdropFilter: "blur(8px)",
              }}
            >
              <CreditCard size={15} /> Rent Statements
            </Link>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Total Billed", value: formatKes(totalBilled), icon: "📋" },
            { label: "Collected", value: formatKes(totalPaid), icon: "💵" },
            { label: "Outstanding Arrears", value: formatKes(totalOutstanding), icon: "⚠️" },
            { label: "Collection Rate", value: `${collectionRate}%`, icon: "📈" },
            { label: "Overdue Invoices", value: overdueCount, icon: "⏰" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "8px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 120,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        {/* Total Collected with Mini Bar */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Total Collected
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {formatKes(totalPaid)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>of {formatKes(totalBilled)} billed</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 12, padding: "10px 12px", border: "1px solid #a7f3d0" }}>
              <TrendingUp size={22} color="#059669" />
            </div>
          </div>
          <MiniBarChart values={trendVals} color="#059669" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ background: collectionRate >= 80 ? "#ecfdf5" : "#fef3c7", color: collectionRate >= 80 ? "#059669" : "#d97706", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              {collectionRate}% collection efficiency
            </span>
          </div>
        </div>

        {/* Outstanding Arrears */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: `1px solid ${totalOutstanding > 0 ? "#fecaca" : "#e2e8f0"}`, boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: totalOutstanding > 0 ? "#dc2626" : "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Outstanding Arrears
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: totalOutstanding > 0 ? "#dc2626" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {formatKes(totalOutstanding)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {totalOutstanding > 0 ? `${overdueCount} overdue rent invoices` : "Zero outstanding arrears"}
              </div>
            </div>
            <div style={{ background: totalOutstanding > 0 ? "#fff1f2" : "#f0fdf4", borderRadius: 12, padding: "10px 12px", border: `1px solid ${totalOutstanding > 0 ? "#fecaca" : "#bbf7d0"}` }}>
              {totalOutstanding > 0 ? <AlertTriangle size={22} color="#dc2626" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ background: totalOutstanding > 0 ? "#fee2e2" : "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: totalOutstanding > 0 ? "#991b1b" : "#166534", fontWeight: 600 }}>
            {totalOutstanding > 0 ? "Follow up with tenant arrears reminders" : "All tenant accounts are in good standing"}
          </div>
        </div>

        {/* Invoices Status Breakdown */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 16, padding: 22, border: "1px solid #334155", color: "#ffffff", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Invoices Breakdown
          </div>
          {[
            { label: "Fully Paid", count: filtered.filter((c) => c.status === "Paid").length, color: "#86efac" },
            { label: "Partially Paid", count: filtered.filter((c) => c.status === "PartiallyPaid").length, color: "#fde047" },
            { label: "Pending Due", count: filtered.filter((c) => c.status === "Pending").length, color: "#93c5fd" },
            { label: "Overdue", count: overdueCount, color: "#fca5a5" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.label}</span>
              <span style={{ fontWeight: 800, color: item.color }}>{item.count} Invoices</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px -2px rgba(0,0,0,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: 260, flex: 1 }}>
            <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by tenant name, unit number, reference, or billing period..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 36px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                outline: "none",
                background: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={15} color="#6366f1" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                background: "#f8fafc",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">All Properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={15} color="#6366f1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                background: "#f8fafc",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">All Statuses ({charges.length})</option>
              <option value="Paid">Paid Only</option>
              <option value="PartiallyPaid">Partially Paid</option>
              <option value="Pending">Pending Due</option>
              <option value="Overdue">Overdue Only</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> charges
        </div>
      </div>

      {/* ── CHARGES TABLE ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e0e7ff", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#6366f1", fontWeight: 700, margin: 0 }}>Loading rent ledger...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CreditCard size={32} color="#059669" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>No Rent Charges Found</h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>
            No rent invoices match your search query or status filter.
          </p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Period & Ref
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Tenant & Unit
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Due Date
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Billed Amount
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Paid
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Outstanding
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
                  Paid: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
                  Overdue: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
                  PartiallyPaid: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
                  Pending: { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd" },
                };
                const st = statusStyles[c.status] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };

                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{c.billingPeriod}</div>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{c.chargeReference}</div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{c.tenantName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Unit {c.unitNumber} • {c.propertyName}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#475569", fontSize: 12 }}>
                      {new Date(c.dueDate).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                      {formatKesFull(c.amount)}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "#059669" }}>
                      {formatKesFull(c.amountPaid)}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 800, color: c.outstandingAmount > 0 ? "#dc2626" : "#059669" }}>
                      {formatKesFull(c.outstandingAmount)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                        }}
                      >
                        {c.status === "Paid" ? <CheckCircle2 size={11} /> : c.status === "Overdue" ? <AlertTriangle size={11} /> : <Clock size={11} />}
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

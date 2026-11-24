"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalDashboardDto, LandlordPortalPropertyDto } from "@/types/domain";
import {
  Building2, Users, CreditCard, Wrench, AlertCircle, TrendingUp, TrendingDown,
  ArrowUpRight, Bell, Home, BarChart2, CheckCircle, AlertTriangle, ChevronRight,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function formatKesFull(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Minimal SVG bar chart – no external deps */
function MiniBarChart({ values, color = "#6366f1" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const w = 180; const h = 56; const gap = 4;
  const bw = (w - gap * (values.length - 1)) / values.length;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 4));
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={3}
            fill={i === values.length - 1 ? color : `${color}55`}
          />
        );
      })}
    </svg>
  );
}

/** Donut chart */
function DonutChart({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 13, fontWeight: 800, fill: "#0f172a" }}>
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
}

export default function LandlordDashboardPage() {
  const [dashboard, setDashboard] = useState<LandlordPortalDashboardDto | null>(null);
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async (propId?: string) => {
    setLoading(true); setError("");
    try {
      const url = propId && propId !== "all"
        ? `/api/v1/landlord-portal/dashboard?propertyId=${propId}`
        : "/api/v1/landlord-portal/dashboard";
      const [dashRes, propsRes] = await Promise.all([
        api.get<LandlordPortalDashboardDto>(url),
        api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties"),
      ]);
      setDashboard(dashRes); setProperties(propsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (loading && !dashboard) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", animation: "spin 1s linear infinite",
          }}>
            <Building2 size={24} color="white" />
          </div>
          <p style={{ color: "#64748b", fontWeight: 600 }}>Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div style={{ background: "linear-gradient(135deg, #fef2f2, #fff5f5)", border: "1px solid #fecaca", borderRadius: 16, padding: 32, color: "#991b1b", textAlign: "center" }}>
        <AlertCircle size={32} style={{ marginBottom: 12, color: "#ef4444" }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Unable to Load Portal</h3>
        <p style={{ fontSize: 14, color: "#b91c1c" }}>{error}</p>
      </div>
    );
  }

  const pStats = dashboard?.propertyStats;
  const rStats = dashboard?.rentStats;
  const mStats = dashboard?.maintenanceStats;
  const occupancyRate = pStats?.occupancyRate ?? 0;
  const collectionRate = rStats && rStats.monthlyExpectedRent > 0
    ? (rStats.monthlyCollected / rStats.monthlyExpectedRent) * 100 : 0;

  // Simulated sparkline data (shows trend)
  const rentBars = [65, 70, 60, 85, 72, 90, rStats?.monthlyCollected ? Math.min(100, (rStats.monthlyCollected / (rStats.monthlyExpectedRent || 1)) * 100) : 0].map(v => Math.max(5, v));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "4px 0" }}>

      {/* ── Hero Welcome Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 70%, #6366f1 100%)",
        borderRadius: 20,
        padding: "28px 32px",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: 20, right: 160, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🏢 Property Owner Portal
              </div>
              {(dashboard?.unreadNotifications || 0) > 0 && (
                <Link href="/dashboard/landlord/notifications" style={{
                  background: "#f59e0b", color: "#1c1917",
                  borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800,
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Bell size={12} /> {dashboard?.unreadNotifications} New
                </Link>
              )}
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Welcome back, {dashboard?.ownerName || "Landlord"} 👋
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}>
              {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} • Portfolio Executive Overview
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <select
              value={selectedPropertyId}
              onChange={(e) => { setSelectedPropertyId(e.target.value); loadData(e.target.value); }}
              style={{
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.15)", color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(8px)", outline: "none",
              }}
            >
              <option value="" style={{ color: "#0f172a" }}>All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id} style={{ color: "#0f172a" }}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {[
            { label: "Properties", value: pStats?.totalProperties || 0, icon: "🏢" },
            { label: "Total Units", value: pStats?.totalApartments || 0, icon: "🚪" },
            { label: "Occupied", value: pStats?.occupiedApartments || 0, icon: "✅" },
            { label: "Vacant", value: pStats?.vacantApartments || 0, icon: "⭕" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
              borderRadius: 10, padding: "10px 16px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4-Card KPI Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>

        {/* Occupancy Card */}
        <div style={{
          background: "#ffffff", borderRadius: 18, padding: "22px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px -4px rgba(99, 102, 241, 0.12), 0 1px 2px rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em" }}>Occupancy Rate</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {occupancyRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {pStats?.occupiedApartments || 0} / {pStats?.totalApartments || 0} units filled
              </div>
            </div>
            <DonutChart pct={occupancyRate} color="#6366f1" size={72} />
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)", height: "100%", width: `${Math.min(occupancyRate, 100)}%`, borderRadius: 8, transition: "width 0.8s ease" }} />
          </div>
          <Link href="/dashboard/landlord/apartments" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>
            View all units <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Rent Collection Card */}
        <div style={{
          background: "#ffffff", borderRadius: 18, padding: "22px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px -4px rgba(16, 185, 129, 0.12), 0 1px 2px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>Rent Collected</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {formatKes(rStats?.monthlyCollected || 0)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                of {formatKesFull(rStats?.monthlyExpectedRent || 0)} expected
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #059669, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            }}>
              <TrendingUp size={22} color="white" />
            </div>
          </div>
          <MiniBarChart values={rentBars} color="#059669" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>{collectionRate.toFixed(0)}% collection rate</span>
            <Link href="/dashboard/landlord/rent" style={{ fontSize: 12, fontWeight: 600, color: "#059669", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
              Collections <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Arrears Warning Card */}
        <div style={{
          background: (rStats?.totalArrears || 0) > 0
            ? "linear-gradient(135deg, #fff7ed, #fff)"
            : "#ffffff",
          borderRadius: 18, padding: "22px 24px",
          border: `1px solid ${(rStats?.totalArrears || 0) > 0 ? "#fed7aa" : "#e2e8f0"}`,
          boxShadow: "0 4px 24px -4px rgba(249, 115, 22, 0.1), 0 1px 2px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: (rStats?.totalArrears || 0) > 0 ? "#ea580c" : "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {(rStats?.totalArrears || 0) > 0 ? "⚠ Outstanding Arrears" : "Rent Arrears"}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: (rStats?.totalArrears || 0) > 0 ? "#dc2626" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {formatKes(rStats?.totalArrears || 0)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {rStats?.tenantsWithArrears || 0} tenants in arrears
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: (rStats?.totalArrears || 0) > 0
                ? "linear-gradient(135deg, #ef4444, #f97316)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 12px ${(rStats?.totalArrears || 0) > 0 ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.3)"}`,
            }}>
              {(rStats?.totalArrears || 0) > 0 ? <AlertTriangle size={22} color="white" /> : <CheckCircle size={22} color="white" />}
            </div>
          </div>
          <div style={{ background: (rStats?.totalArrears || 0) > 0 ? "#fee2e2" : "#dcfce7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: (rStats?.totalArrears || 0) > 0 ? "#991b1b" : "#166534", fontWeight: 600 }}>
            {(rStats?.totalArrears || 0) > 0 ? "Action required — send reminders" : "✓ All tenants up to date"}
          </div>
          <Link href="/dashboard/landlord/rent" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#ea580c", textDecoration: "none", marginTop: 10 }}>
            Manage collections <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Maintenance Card */}
        <div style={{
          background: "#ffffff", borderRadius: 18, padding: "22px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px -4px rgba(234, 179, 8, 0.1), 0 1px 2px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.07em" }}>Maintenance Status</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {mStats?.openRequests || 0} Open
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {mStats?.criticalRequests || 0} critical priority
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
            }}>
              <Wrench size={22} color="white" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Open", value: mStats?.openRequests || 0, color: "#ea580c" },
              { label: "In Progress", value: mStats?.inProgressRequests || 0, color: "#0284c7" },
              { label: "Done", value: mStats?.completedThisPeriod || 0, color: "#16a34a" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/landlord/maintenance" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#d97706", textDecoration: "none", marginTop: 12 }}>
            View tickets <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Property Portfolio Table + Quick Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>

        {/* Properties Table */}
        <div style={{
          background: "#ffffff", borderRadius: 18, border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Property Portfolio</h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{properties.length} properties under management</p>
            </div>
            <Link href="/dashboard/landlord/properties" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {properties.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
              <Building2 size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontWeight: 600 }}>No properties registered yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Property", "Units", "Occupancy", "Monthly Rent", "Leases", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, idx) => {
                    const occ = p.apartmentCount > 0 ? (p.occupiedUnits / p.apartmentCount) * 100 : 0;
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: `linear-gradient(135deg, ${["#6366f1","#0284c7","#059669","#f59e0b"][idx % 4]}, ${["#8b5cf6","#06b6d4","#10b981","#f97316"][idx % 4]})`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <Building2 size={16} color="white" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.town || p.county || "Kenya"}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{p.apartmentCount}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6, width: 60, overflow: "hidden" }}>
                              <div style={{ background: occ >= 80 ? "#22c55e" : occ >= 50 ? "#f59e0b" : "#ef4444", height: "100%", width: `${occ}%`, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: occ >= 80 ? "#16a34a" : occ >= 50 ? "#d97706" : "#dc2626" }}>{occ.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{formatKes(p.monthlyExpectedRent)}</td>
                        <td style={{ padding: "14px 16px", color: "#16a34a", fontWeight: 600 }}>{p.activeTenancies}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: p.isActive ? "#dcfce7" : "#fee2e2",
                            color: p.isActive ? "#166534" : "#991b1b",
                          }}>{p.isActive ? "Active" : "Inactive"}</span>
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <Link href={`/dashboard/landlord/properties/${p.id}`} style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30, borderRadius: 8,
                            background: "#f1f5f9", color: "#6366f1",
                            textDecoration: "none", transition: "all 0.15s",
                          }}>
                            <ChevronRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#ffffff", borderRadius: 18, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={16} color="#6366f1" /> Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/dashboard/landlord/statements", icon: CreditCard, label: "Download Statement", sub: "Monthly P&L PDF", color: "#6366f1", bg: "#eef2ff" },
                { href: "/dashboard/landlord/reports", icon: TrendingUp, label: "Financial Reports", sub: "Income & expenses", color: "#059669", bg: "#f0fdf4" },
                { href: "/dashboard/landlord/maintenance", icon: Wrench, label: "Log Maintenance", sub: "Create repair ticket", color: "#d97706", bg: "#fffbeb" },
                { href: "/dashboard/landlord/tenants", icon: Users, label: "Manage Tenants", sub: "View all agreements", color: "#0284c7", bg: "#f0f9ff" },
                { href: "/dashboard/landlord/notifications", icon: Bell, label: "Notifications", sub: `${dashboard?.unreadNotifications || 0} unread`, color: "#7c3aed", bg: "#f5f3ff" },
              ].map(({ href, icon: Icon, label, sub, color, bg }) => (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 12,
                  background: bg, border: "none",
                  textDecoration: "none", transition: "transform 0.15s",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{sub}</div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Summary Financial Widget */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            borderRadius: 18, padding: "20px",
            boxShadow: "0 8px 32px -4px rgba(15,23,42,0.3)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
              💰 Financial Snapshot
            </div>
            {[
              { label: "Rent Expected", value: formatKes(rStats?.monthlyExpectedRent || 0), color: "#a5b4fc" },
              { label: "Collected", value: formatKes(rStats?.monthlyCollected || 0), color: "#6ee7b7" },
              { label: "Outstanding", value: formatKes(rStats?.monthlyOutstanding || 0), color: "#fca5a5" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>Net Position</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24" }}>
                {formatKes((rStats?.monthlyCollected || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

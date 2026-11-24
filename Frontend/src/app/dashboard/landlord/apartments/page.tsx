"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, UnitDetailDto } from "@/types/domain";
import {
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  Home,
  User,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Filter,
  DollarSign,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatKesFull(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Donut SVG Chart */
function DonutChart({ pct, color = "#6366f1", size = 76 }: { pct: number; color?: string; size?: number }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LandlordApartmentsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [apartments, setApartments] = useState<UnitDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "occupied" | "vacant">("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        const url = selectedPropertyId
          ? `/api/v1/property-management/units?propertyId=${selectedPropertyId}`
          : "/api/v1/property-management/units";
        const res = await api.get<UnitDetailDto[]>(url);
        setApartments(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPropertyId]);

  const filtered = apartments.filter((apt) => {
    const s = search.toLowerCase();
    const matchesSearch =
      apt.unitNumber.toLowerCase().includes(s) ||
      (apt.buildingName && apt.buildingName.toLowerCase().includes(s)) ||
      (apt.propertyName && apt.propertyName.toLowerCase().includes(s)) ||
      (apt.currentTenantName && apt.currentTenantName.toLowerCase().includes(s));

    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "occupied" ? apt.isOccupied : !apt.isOccupied;

    return matchesSearch && matchesStatus;
  });

  const totalUnits = apartments.length;
  const occupiedUnits = apartments.filter((a) => a.isOccupied).length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const totalRentalRoll = apartments.reduce((acc, a) => acc + (a.monthlyRent || 0), 0);

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
                Apartments & Occupancy
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Units & Occupancy Inventory
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Live occupancy metrics, rental price configuration, and tenant assignments across your properties.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/dashboard/landlord/properties"
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
              <Building2 size={15} /> View Portfolio
            </Link>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Total Units", value: totalUnits, icon: "🏠" },
            { label: "Occupied Units", value: occupiedUnits, icon: "✅" },
            { label: "Vacant Units", value: vacantUnits, icon: "🔑" },
            { label: "Occupancy Rate", value: `${occupancyPct}%`, icon: "📈" },
            { label: "Total Rent Roll", value: formatKes(totalRentalRoll), icon: "💰" },
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
                minWidth: 110,
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
        {/* Occupancy Donut */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Portfolio Occupancy
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {occupancyPct}<span style={{ fontSize: 18, color: "#64748b" }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {occupiedUnits} filled out of {totalUnits} total units
              </div>
            </div>
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <DonutChart pct={occupancyPct} color="#6366f1" size={76} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#4f46e5" }}>
                {occupancyPct}%
              </div>
            </div>
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 8, height: 6, overflow: "hidden", marginTop: 16 }}>
            <div style={{ width: `${occupancyPct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8)", borderRadius: 8 }} />
          </div>
        </div>

        {/* Expected Monthly Revenue */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Total Unit Value
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {formatKes(totalRentalRoll)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Monthly inventory rental value</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 12, padding: "10px 12px", border: "1px solid #a7f3d0" }}>
              <TrendingUp size={22} color="#059669" />
            </div>
          </div>
          <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
            Avg Rent: {totalUnits > 0 ? formatKes(Math.round(totalRentalRoll / totalUnits)) : "KES 0"} per unit / month
          </div>
        </div>

        {/* Vacancy Risk */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: `1px solid ${vacantUnits > 0 ? "#fed7aa" : "#e2e8f0"}`, boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: vacantUnits > 0 ? "#ea580c" : "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Vacant Units
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: vacantUnits > 0 ? "#ea580c" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {vacantUnits} <span style={{ fontSize: 16, color: "#64748b" }}>Units</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {vacantUnits > 0 ? "Ready for new tenant leasing" : "100% Fully leased out!"}
              </div>
            </div>
            <div style={{ background: vacantUnits > 0 ? "#fff7ed" : "#f0fdf4", borderRadius: 12, padding: "10px 12px", border: `1px solid ${vacantUnits > 0 ? "#fed7aa" : "#bbf7d0"}` }}>
              {vacantUnits > 0 ? <AlertCircle size={22} color="#ea580c" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ background: vacantUnits > 0 ? "#fff7ed" : "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: vacantUnits > 0 ? "#9a3412" : "#166534", fontWeight: 600 }}>
            {vacantUnits > 0 ? `Unrealized Rent: ~${formatKes(vacantUnits * (totalUnits > 0 ? Math.round(totalRentalRoll / totalUnits) : 0))}/mo` : "Zero vacancy revenue leakage"}
          </div>
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
              placeholder="Search by unit number, building, property, or tenant..."
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
              onChange={(e) => setStatusFilter(e.target.value as "all" | "occupied" | "vacant")}
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
              <option value="all">All Statuses ({apartments.length})</option>
              <option value="occupied">Occupied Only ({occupiedUnits})</option>
              <option value="vacant">Vacant Only ({vacantUnits})</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> of {totalUnits} units
        </div>
      </div>

      {/* ── APARTMENTS TABLE ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e0e7ff", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#6366f1", fontWeight: 700, margin: 0 }}>Loading apartment units...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Home size={32} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>No Apartments Match Filter</h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>
            Try clearing the search query or changing the occupancy status filter to display your units.
          </p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Unit Details
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Property & Building
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Floor / Type
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Monthly Rent
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Occupancy
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Current Resident
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Lease Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt, idx) => {
                const colors = ["#6366f1", "#0284c7", "#059669", "#7c3aed", "#d97706"];
                const col = colors[idx % colors.length];
                return (
                  <tr
                    key={apt.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: `${col}15`,
                            border: `1.5px solid ${col}35`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: col,
                            flexShrink: 0,
                          }}
                        >
                          {apt.unitNumber}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                            Unit {apt.unitNumber}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {apt.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{apt.propertyName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{apt.buildingName || "Main Block"}</div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, fontSize: 12, color: "#475569", fontWeight: 600 }}>
                        <Layers size={12} color="#64748b" />
                        {apt.floor || "Ground"} • {apt.unitTypeName || "Standard"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                      {formatKesFull(apt.monthlyRent)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {apt.isOccupied ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "#ecfdf5",
                            color: "#059669",
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          <CheckCircle2 size={12} /> Occupied
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "#fff7ed",
                            color: "#ea580c",
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            border: "1px solid #fed7aa",
                          }}
                        >
                          <AlertCircle size={12} /> Vacant
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {apt.currentTenantName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontSize: 11, fontWeight: 800 }}>
                            {apt.currentTenantName[0]}
                          </div>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>{apt.currentTenantName}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {apt.isOccupied ? (
                        <span style={{ color: "#059669", fontWeight: 700, fontSize: 12 }}>
                          Active Lease
                        </span>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: 12, fontStyle: "italic" }}>
                          Available to Lease
                        </span>
                      )}
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto } from "@/types/domain";
import {
  Building2,
  ArrowUpRight,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  TrendingUp,
  Layers,
  Users,
  CreditCard,
  Plus,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatKesFull(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.town && p.town.toLowerCase().includes(search.toLowerCase())) ||
      (p.county && p.county.toLowerCase().includes(search.toLowerCase()))
  );

  const totalProperties = properties.length;
  const totalUnits = properties.reduce((acc, p) => acc + (p.apartmentCount || 0), 0);
  const totalOccupied = properties.reduce((acc, p) => acc + (p.occupiedUnits || 0), 0);
  const totalRentRoll = properties.reduce((acc, p) => acc + (p.monthlyExpectedRent || 0), 0);
  const overallOccupancyPct = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

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
                Portfolio
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              My Properties Portfolio
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Full portfolio visibility across all assigned real estate properties, buildings, and active leases.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/dashboard/landlord/apartments"
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
              <Layers size={15} /> All Units & Apartments
            </Link>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Assigned Properties", value: totalProperties, icon: "🏢" },
            { label: "Total Units", value: totalUnits, icon: "🏠" },
            { label: "Occupied", value: totalOccupied, icon: "✅" },
            { label: "Occupancy Rate", value: `${overallOccupancyPct}%`, icon: "📈" },
            { label: "Monthly Rent Roll", value: formatKes(totalRentRoll), icon: "💰" },
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

      {/* ── SEARCH & STATS BAR ── */}
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
        <div style={{ position: "relative", minWidth: 280, flex: 1 }}>
          <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search properties by name, town, or county..."
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

        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> properties in portfolio
        </div>
      </div>

      {/* ── PROPERTY CARDS GRID ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e0e7ff", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#6366f1", fontWeight: 700, margin: 0 }}>Loading properties...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Building2 size={32} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>No Properties Found</h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>
            No properties match your search term or are assigned to your landlord profile.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 22 }}>
          {filtered.map((p, idx) => {
            const occupancyRate = p.apartmentCount > 0 ? Math.round((p.occupiedUnits / p.apartmentCount) * 100) : 0;
            const colors = [
              { grad: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", iconBg: "#e0e7ff", iconColor: "#4f46e5" },
              { grad: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)", iconBg: "#e0f2fe", iconColor: "#0284c7" },
              { grad: "linear-gradient(135deg, #059669 0%, #10b981 100%)", iconBg: "#ecfdf5", iconColor: "#059669" },
              { grad: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", iconBg: "#f5f3ff", iconColor: "#7c3aed" },
            ];
            const theme = colors[idx % colors.length];

            return (
              <div
                key={p.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div>
                  {/* Top card banner */}
                  <div
                    style={{
                      padding: "20px 22px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: theme.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: theme.iconColor,
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>{p.name}</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b", marginTop: 3 }}>
                          <MapPin size={12} color="#94a3b8" />
                          <span>{[p.address, p.town, p.county].filter(Boolean).join(", ") || "Location unassigned"}</span>
                        </div>
                      </div>
                    </div>

                    {p.isActive ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#059669",
                          background: "#ecfdf5",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        <CheckCircle2 size={11} /> Active
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#dc2626",
                          background: "#fef2f2",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #fecaca",
                        }}
                      >
                        <XCircle size={11} /> Inactive
                      </span>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ padding: "18px 22px" }}>
                    {/* Occupancy bar */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Occupancy Rate</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: occupancyRate >= 80 ? "#059669" : occupancyRate >= 50 ? "#d97706" : "#dc2626" }}>
                          {occupancyRate}% ({p.occupiedUnits}/{p.apartmentCount} units)
                        </span>
                      </div>
                      <div style={{ background: "#f1f5f9", borderRadius: 8, height: 7, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${occupancyRate}%`,
                            height: "100%",
                            background: occupancyRate >= 80 ? "#059669" : occupancyRate >= 50 ? "#d97706" : "#dc2626",
                            borderRadius: 8,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Buildings / Units</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                          {p.buildingCount} Blks · {p.apartmentCount} Units
                        </div>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Monthly Expected</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                          {formatKes(p.monthlyExpectedRent)}
                        </div>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Active Leases</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>
                          {p.activeTenancies} Tenants
                        </div>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Vacant Available</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: p.vacantUnits > 0 ? "#ea580c" : "#059669", marginTop: 2 }}>
                          {p.vacantUnits} Units Free
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div style={{ padding: "14px 22px 20px" }}>
                  <Link
                    href={`/dashboard/landlord/properties/${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "11px 18px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
                    }}
                  >
                    Manage Property Portfolio <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

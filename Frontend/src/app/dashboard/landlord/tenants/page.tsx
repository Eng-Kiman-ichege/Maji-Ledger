"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, TenancySummaryDto } from "@/types/domain";
import {
  Users,
  Search,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  UserCheck,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatKesFull(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordTenantsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [tenancies, setTenancies] = useState<TenancySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        const url = selectedPropertyId
          ? `/api/v1/tenancies?propertyId=${selectedPropertyId}`
          : "/api/v1/tenancies";
        const res = await api.get<TenancySummaryDto[]>(url);
        setTenancies(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPropertyId]);

  const filtered = tenancies.filter((t) => {
    const s = search.toLowerCase();
    const tenantName = t.primaryTenant?.fullName || "";
    const tenantPhone = t.primaryTenant?.phoneNumber || "";
    return (
      tenantName.toLowerCase().includes(s) ||
      tenantPhone.includes(s) ||
      (t.unitNumber && t.unitNumber.toLowerCase().includes(s)) ||
      (t.propertyName && t.propertyName.toLowerCase().includes(s)) ||
      (t.tenancyReference && t.tenancyReference.toLowerCase().includes(s))
    );
  });

  const totalTenancies = tenancies.length;
  const activeTenancies = tenancies.filter((t) => t.status === "Active").length;
  const totalMonthlyLeased = tenancies.reduce((acc, t) => acc + (t.monthlyRent || 0), 0);
  const totalDeposits = tenancies.reduce((acc, t) => acc + (t.securityDeposit || 0), 0);

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
                Tenancy & Leases
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Tenants & Lease Registry
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Resident contact directories, lease agreements, security deposits, and tenancy status tracking.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/dashboard/landlord/rent"
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
              <CreditCard size={15} /> Rent Collections
            </Link>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Total Leases", value: totalTenancies, icon: "👥" },
            { label: "Active Leases", value: activeTenancies, icon: "✅" },
            { label: "Monthly Leased Value", value: formatKes(totalMonthlyLeased), icon: "💰" },
            { label: "Security Deposits Held", value: formatKes(totalDeposits), icon: "🛡️" },
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
          <div style={{ position: "relative", minWidth: 280, flex: 1 }}>
            <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by tenant name, phone, unit number, reference..."
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
        </div>

        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> tenancies
        </div>
      </div>

      {/* ── TENANTS TABLE ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e0e7ff", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#6366f1", fontWeight: 700, margin: 0 }}>Loading tenant records...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users size={32} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>No Tenancies Found</h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>
            No tenants match the current search or property filter.
          </p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Tenant Information
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Unit & Property
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Contact Numbers
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Agreed Rent
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Lease Timeline
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Status
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => {
                const colors = ["#6366f1", "#0284c7", "#059669", "#7c3aed", "#d97706"];
                const col = colors[idx % colors.length];
                const tenantInitial = (t.primaryTenant?.fullName || "T")[0].toUpperCase();

                return (
                  <tr
                    key={t.id}
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
                            borderRadius: "50%",
                            background: `${col}15`,
                            border: `1.5px solid ${col}35`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 14,
                            color: col,
                            flexShrink: 0,
                          }}
                        >
                          {tenantInitial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                            {t.primaryTenant?.fullName || "Tenant"}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                            Ref: {t.tenancyReference || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>Unit {t.unitNumber}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {t.propertyName} • {t.buildingName || "Main Block"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155", fontWeight: 600 }}>
                        <Phone size={13} color="#0284c7" />
                        <span>{t.primaryTenant?.phoneNumber || "—"}</span>
                      </div>
                      {t.primaryTenant?.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          <Mail size={11} color="#94a3b8" />
                          <span>{t.primaryTenant.email}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                        {formatKesFull(t.monthlyRent)}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Dep: {formatKes(t.securityDeposit)}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>
                        {new Date(t.startDate).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {t.expectedEndDate ? `Until ${new Date(t.expectedEndDate).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}` : "Ongoing month-to-month"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: t.status === "Active" ? "#ecfdf5" : "#f8fafc",
                          color: t.status === "Active" ? "#059669" : "#64748b",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          border: t.status === "Active" ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                        }}
                      >
                        <CheckCircle2 size={11} /> {t.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <Link
                        href={`/dashboard/landlord/tenants/${t.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#f0f0ff",
                          color: "#4f46e5",
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: "none",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
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
  );
}

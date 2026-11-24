"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto } from "@/types/domain";
import { Building2, ArrowUpRight, Search, CheckCircle2, XCircle } from "lucide-react";

function formatKes(n: number) {
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
        setProperties(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.town && p.town.toLowerCase().includes(search.toLowerCase())) ||
    (p.county && p.county.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>My Properties Portfolio</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Properties assigned to your landlord account with occupancy and monthly metrics.
          </p>
        </div>

        <div style={{ position: "relative", minWidth: 260 }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search properties or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading properties...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Building2 size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Properties Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No properties match your search criteria or are assigned to your account.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {filtered.map((p) => {
            const occupancyRate = p.apartmentCount > 0 ? Math.round((p.occupiedUnits / p.apartmentCount) * 100) : 0;
            return (
              <div
                key={p.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>{p.name}</h2>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {[p.address, p.town, p.county].filter(Boolean).join(", ") || "Location unassigned"}
                      </div>
                    </div>
                    {p.isActive ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "4px 8px", borderRadius: 6 }}>
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#dc2626", background: "#fef2f2", padding: "4px 8px", borderRadius: 6 }}>
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "16px 0", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Buildings / Units</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                        {p.buildingCount} Blks / {p.apartmentCount} Units
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Occupancy Rate</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
                        {occupancyRate}% ({p.occupiedUnits}/{p.apartmentCount})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Monthly Rent</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {formatKes(p.monthlyExpectedRent)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Active Leases</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                        {p.activeTenancies} Leases ({p.vacantUnits} Vacant)
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/landlord/properties/${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 16px",
                    borderRadius: 8,
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    marginTop: 8,
                  }}
                >
                  Manage Property <ArrowUpRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

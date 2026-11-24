"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, UnitDetailDto } from "@/types/domain";
import { Building2, Search, CheckCircle2, AlertCircle, Droplets, User } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        setApartments(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPropertyId]);

  const filtered = apartments.filter((apt) => {
    const matchesSearch =
      apt.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      (apt.buildingName && apt.buildingName.toLowerCase().includes(search.toLowerCase())) ||
      (apt.propertyName && apt.propertyName.toLowerCase().includes(search.toLowerCase())) ||
      (apt.currentTenantName && apt.currentTenantName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "occupied" ? apt.isOccupied : !apt.isOccupied;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Apartments & Occupancy</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Track occupancy status, rental rates, and assigned meters across all units.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              background: "#ffffff",
              color: "#0f172a",
              outline: "none",
            }}
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "occupied" | "vacant")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              background: "#ffffff",
              color: "#0f172a",
              outline: "none",
            }}
          >
            <option value="all">All Occupancy</option>
            <option value="occupied">Occupied Only</option>
            <option value="vacant">Vacant Only</option>
          </select>

          <div style={{ position: "relative", minWidth: 200 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search units..."
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
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading units...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Building2 size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Units Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No apartment units match your criteria.</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Unit Number</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Property & Building</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Floor / Type</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Monthly Rent</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Current Tenant</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Lease Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                    Unit {apt.unitNumber}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#334155" }}>
                    <div>{apt.propertyName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{apt.buildingName}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    {apt.floor || "Ground"} • {apt.unitTypeName || "Standard"}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>
                    {formatKes(apt.monthlyRent)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {apt.isOccupied ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#16a34a", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        <CheckCircle2 size={12} /> Occupied
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff7ed", color: "#ea580c", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        <AlertCircle size={12} /> Vacant
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#334155" }}>
                    {apt.currentTenantName ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <User size={14} color="#0284c7" />
                        <span style={{ fontWeight: 500 }}>{apt.currentTenantName}</span>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {apt.isOccupied ? (
                      <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 12 }}>Active Agreement</span>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: 12 }}>Available to Lease</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

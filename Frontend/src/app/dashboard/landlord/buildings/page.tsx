"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, BuildingSummaryDto } from "@/types/domain";
import { Building2, Layers, Search, ArrowRight } from "lucide-react";

export default function LandlordBuildingsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [buildings, setBuildings] = useState<(BuildingSummaryDto & { propertyName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        // Fetch buildings for all properties
        const allBuildings: (BuildingSummaryDto & { propertyName?: string })[] = [];
        for (const p of props) {
          try {
            const blds = await api.get<BuildingSummaryDto[]>(`/api/v1/property-management/properties/${p.id}/buildings`);
            blds.forEach((b) => allBuildings.push({ ...b, propertyName: p.name }));
          } catch {
            // ignore empty
          }
        }
        setBuildings(allBuildings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = buildings.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.propertyName && b.propertyName.toLowerCase().includes(search.toLowerCase())) ||
      (b.buildingCode && b.buildingCode.toLowerCase().includes(search.toLowerCase()));
    const matchesProp = selectedPropertyId ? b.propertyId === selectedPropertyId : true;
    return matchesSearch && matchesProp;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Buildings & Blocks</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Overview of all residential and commercial building blocks across your portfolio.
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

          <div style={{ position: "relative", minWidth: 220 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search buildings..."
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
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading buildings...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Layers size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Buildings Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No buildings match your filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((b) => (
            <div
              key={b.id}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>{b.name}</h2>
                    <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 600, marginTop: 2 }}>
                      {b.propertyName}
                    </div>
                  </div>
                  {b.buildingCode && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", padding: "4px 8px", borderRadius: 6, color: "#475569" }}>
                      {b.buildingCode}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Total Floors</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{b.totalFloors || 1} Floors</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Apartment Units</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{b.apartmentCount || 0} Units</div>
                  </div>
                </div>
              </div>

              <Link
                href={`/dashboard/landlord/apartments?buildingId=${b.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f0f9ff",
                  color: "#0284c7",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  marginTop: 16,
                  border: "1px solid #bae6fd",
                }}
              >
                <span>View Apartments</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

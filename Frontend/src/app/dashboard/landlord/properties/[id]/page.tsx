"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDetailDto, BuildingSummaryDto } from "@/types/domain";
import {
  Building2,
  ArrowLeft,
  Users,
  CreditCard,
  Droplets,
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [property, setProperty] = useState<LandlordPortalPropertyDetailDto | null>(null);
  const [buildings, setBuildings] = useState<BuildingSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [propRes, bldRes] = await Promise.all([
          api.get<LandlordPortalPropertyDetailDto>(`/api/v1/landlord-portal/properties/${id}`),
          api.get<BuildingSummaryDto[]>(`/api/v1/property-management/properties/${id}/buildings`).catch(() => []),
        ]);
        setProperty(propRes);
        setBuildings(bldRes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load property details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
        <Clock className="animate-spin" style={{ margin: "0 auto 12px" }} size={24} />
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 24, color: "#991b1b" }}>
        <AlertCircle size={24} style={{ marginBottom: 8 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Error Loading Property</h3>
        <p>{error || "Property not found or access unauthorized."}</p>
        <Link href="/dashboard/landlord/properties" style={{ display: "inline-block", marginTop: 12, color: "#0284c7", fontWeight: 600 }}>
          ← Back to Properties
        </Link>
      </div>
    );
  }

  const occupancyRate = property.apartmentCount > 0 ? Math.round((property.occupiedUnits / property.apartmentCount) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <Link
          href="/dashboard/landlord/properties"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", marginBottom: 12 }}
        >
          <ArrowLeft size={16} /> Back to My Properties
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>{property.name}</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {[property.address, property.town, property.county].filter(Boolean).join(", ") || "No address assigned"}
            </p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#16a34a", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Active Property
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Occupancy</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {occupancyRate}%
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {property.occupiedUnits} occupied / {property.vacantUnits} vacant
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Expected Rent (Monthly)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {formatKes(property.monthlyExpectedRent)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Collected: {formatKes(property.monthlyRentCollected)}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Monthly Rent Collected</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {formatKes(property.monthlyRentCollected)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Collection Rate: {property.monthlyExpectedRent > 0 ? ((property.monthlyRentCollected / property.monthlyExpectedRent) * 100).toFixed(1) : "0.0"}%
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Open Maintenance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: property.openMaintenanceRequests > 0 ? "#ea580c" : "#16a34a", marginTop: 4 }}>
            {property.openMaintenanceRequests}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Active work requests</div>
        </div>
      </div>

      {/* Buildings List in this Property */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Buildings & Blocks</h2>
        {buildings.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>No separate blocks recorded under this property.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {buildings.map((b) => (
              <div key={b.id} style={{ border: "1px solid #f1f5f9", background: "#f8fafc", padding: 14, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Code: {b.buildingCode || "N/A"} • Floors: {b.totalFloors || 1} • Units: {b.apartmentCount || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-Link Shortcuts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Link
          href={`/dashboard/landlord/apartments`}
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: 14, borderRadius: 8, textDecoration: "none", color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Building2 size={18} color="#0284c7" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>View All Apartments</span>
        </Link>
        <Link
          href={`/dashboard/landlord/tenants`}
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: 14, borderRadius: 8, textDecoration: "none", color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Users size={18} color="#16a34a" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>View Property Tenants</span>
        </Link>
        <Link
          href={`/dashboard/landlord/maintenance`}
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: 14, borderRadius: 8, textDecoration: "none", color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Wrench size={18} color="#ea580c" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Maintenance Tickets</span>
        </Link>
      </div>
    </div>
  );
}

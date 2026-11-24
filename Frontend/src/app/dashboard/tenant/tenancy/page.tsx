"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { TenantPortalDashboardDto } from "@/types/domain";
import { FileText, Building2, Calendar, DollarSign, UserCheck, Shield, AlertCircle } from "lucide-react";

export default function TenantTenancyPage() {
  const [data, setData] = useState<TenantPortalDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<TenantPortalDashboardDto>("/api/v1/tenant-portal/dashboard");
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lease information.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading lease details...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 20, borderRadius: 12, color: "#991b1b" }}>
        {error || "No active lease agreement found."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Tenancy Agreement & Lease Details
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Official terms, registered unit, and occupancy terms for your tenancy.
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#e0f2fe", color: "#0284c7", padding: 10, borderRadius: 8 }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                {data.propertyName ?? "Assigned Property"}
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {data.buildingName ? `${data.buildingName} • ` : ""}Unit {data.unitNumber ?? "N/A"}
              </div>
            </div>
          </div>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: data.tenancyStatus === "Active" ? "#dcfce7" : "#f1f5f9",
              color: data.tenancyStatus === "Active" ? "#166534" : "#475569",
            }}
          >
            {data.tenancyStatus ?? "Active"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} /> Tenancy Reference
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
              {data.tenancyReference ?? "TEN-REF-CURRENT"}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <DollarSign size={14} /> Monthly Rent
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
              KES {data.monthlyRent.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} /> Rent Due Day
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
              {data.rentDueDay}th of each month
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} /> Lease Start Date
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
              {data.startDate ? new Date(data.startDate).toLocaleDateString() : "Indefinite Periodic"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Shield size={18} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#0369a1", lineHeight: 1.5 }}>
              <strong>Tenancy Terms & Notice:</strong> Rent is due promptly by the {data.rentDueDay}th of each month. For maintenance requests or notice of departure, please submit a request through the resident portal at least 30 days in advance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

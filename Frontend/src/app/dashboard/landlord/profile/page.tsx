"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, LandlordDetailDto } from "@/types/domain";
import { User, Phone, Mail, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function LandlordProfilePage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [landlordDetail, setLandlordDetail] = useState<LandlordDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        if (user?.ownerId) {
          const detail = await api.get<LandlordDetailDto>(`/api/v1/landlords/${user.ownerId}`).catch(() => null);
          setLandlordDetail(detail);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 840, margin: "0 auto", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Landlord Account Profile</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Manage your landlord credentials, personal information, and assigned portfolio properties.
        </p>
      </div>

      {/* Grid: Account details & assigned properties */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        {/* Profile Card */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#f0f9ff",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {user?.fullName?.slice(0, 2).toUpperCase() || "LD"}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>{user?.fullName || "Landlord User"}</h2>
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={12} /> Verified Landlord
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Login Email</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{user?.email || "—"}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Contact Phone</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0284c7", marginTop: 2 }}>{user?.phoneNumber || "—"}</div>
            </div>

            {landlordDetail?.nationalId && (
              <div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>National ID / Passport</div>
                <div style={{ fontSize: 14, color: "#334155", marginTop: 2 }}>{landlordDetail.nationalId}</div>
              </div>
            )}

            {landlordDetail?.kraPin && (
              <div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>KRA PIN</div>
                <div style={{ fontSize: 14, color: "#334155", marginTop: 2 }}>{landlordDetail.kraPin}</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Account Role</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0284c7", marginTop: 2 }}>
                Property Owner / Landlord (Stage 8 Scoped)
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Properties Card */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Building2 size={20} color="#0284c7" />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>Authorized Portfolio Scope</h2>
          </div>

          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>
            Data and financial visibility is strictly partitioned to your authorized properties below:
          </p>

          {loading ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Loading properties...</div>
          ) : properties.length === 0 ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>No properties currently linked.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {properties.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {[p.town, p.county].filter(Boolean).join(", ") || "Active"}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "4px 8px", borderRadius: 6 }}>
                    {p.apartmentCount} Units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

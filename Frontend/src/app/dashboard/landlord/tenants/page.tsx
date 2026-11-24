"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, TenancySummaryDto } from "@/types/domain";
import { Users, Search, Phone, Mail, Building2, CheckCircle2, ArrowRight } from "lucide-react";

function formatKes(n: number) {
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
        setTenancies(res);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Tenants & Tenancies</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Active and past tenancy agreements across your property portfolio.
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

          <div style={{ position: "relative", minWidth: 240 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search tenant name, phone, unit..."
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
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading tenants...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Users size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Tenancies Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No tenants match your current filter.</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Unit & Property</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Contact Info</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Agreed Rent</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Start Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.primaryTenant?.fullName || "Tenant"}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Ref: {t.tenancyReference || "N/A"}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#334155" }}>
                    <div style={{ fontWeight: 600 }}>Unit {t.unitNumber}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {t.propertyName} • {t.buildingName}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={13} color="#0284c7" />
                      <span>{t.primaryTenant?.phoneNumber || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                    {formatKes(t.monthlyRent)}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    {new Date(t.startDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#16a34a", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> {t.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Link
                      href={`/dashboard/landlord/tenants/${t.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "#f0f9ff",
                        color: "#0284c7",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </Link>
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

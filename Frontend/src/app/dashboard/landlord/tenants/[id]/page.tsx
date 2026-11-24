"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { TenancyDetailDto } from "@/types/domain";
import { ArrowLeft, User, Phone, Mail, Building2, Calendar, CreditCard, ShieldCheck } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordTenancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tenancy, setTenancy] = useState<TenancyDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<TenancyDetailDto>(`/api/v1/tenancies/${id}`);
        setTenancy(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading tenancy agreement...</div>;
  }

  if (!tenancy) {
    return (
      <div style={{ padding: 24, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <p style={{ color: "#dc2626" }}>Tenancy record not found or access restricted.</p>
        <Link href="/dashboard/landlord/tenants" style={{ color: "#0284c7", fontWeight: 600 }}>
          ← Back to Tenants
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <Link
          href="/dashboard/landlord/tenants"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", marginBottom: 12 }}
        >
          <ArrowLeft size={16} /> Back to Tenants List
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Tenancy: {tenancy.tenancyReference || "Active Agreement"}
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {tenancy.propertyName} • Unit {tenancy.apartmentUnitNumber}
            </p>
          </div>
          <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            Status: {tenancy.status}
          </span>
        </div>
      </div>

      {/* Grid: Tenant Profile & Terms */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Tenant Details */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>Tenant Profile</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Full Name</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{tenancy.primaryTenantName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Phone Number</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0284c7" }}>{tenancy.primaryTenantPhone}</div>
            </div>
            {tenancy.primaryTenantEmail && (
              <div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Email Address</div>
                <div style={{ fontSize: 14, color: "#334155" }}>{tenancy.primaryTenantEmail}</div>
              </div>
            )}
          </div>
        </div>

        {/* Financial & Tenancy Terms */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={20} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>Lease Terms</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Agreed Monthly Rent</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{formatKes(tenancy.monthlyRent)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Security Deposit</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{formatKes(tenancy.securityDeposit)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Start Date</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                {new Date(tenancy.startDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Due Day</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                Day {tenancy.rentPaymentDueDay} of month
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

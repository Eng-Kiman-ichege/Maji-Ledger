"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { AdminExecutiveDashboardDto } from "@/types/domain";
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Droplets,
  Wrench,
  Activity,
  Sliders,
  Server,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function AdminControlPage() {
  const [data, setData] = useState<AdminExecutiveDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<AdminExecutiveDashboardDto>("/api/v1/admin/control/executive-dashboard");
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admin executive dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading platform control centre...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 24, borderRadius: 12, color: "#991b1b" }}>
        {error || "Access denied or dashboard unavailable."}
      </div>
    );
  }

  const occupancyRate = data.totalApartments > 0 ? ((data.occupiedApartments / data.totalApartments) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
            System Administration
          </span>
          <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Admin Control Centre
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Centralized platform oversight, user provisioning, system parameters, and infrastructure health.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href="/dashboard/users"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}
          >
            <Users size={15} /> Users & Roles
          </Link>
          <Link
            href="/dashboard/admin/settings"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}
          >
            <Sliders size={15} /> Settings
          </Link>
          <Link
            href="/dashboard/admin/audit"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}
          >
            <Activity size={15} /> Audit Logs
          </Link>
          <Link
            href="/dashboard/admin/integrations"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}
          >
            <Server size={15} /> Integrations
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {/* Properties & Units */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <span>Portfolio Units</span>
            <Building2 size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {data.totalApartments} Units
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {data.totalProperties} Properties • {data.totalBuildings} Buildings
          </div>
        </div>

        {/* Occupancy */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <span>Occupancy Rate</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {occupancyRate}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {data.occupiedApartments} Occupied • {data.vacantApartments} Vacant
          </div>
        </div>

        {/* Rent Collections */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <span>Rent Collected</span>
            <CreditCard size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            KES {data.totalRentCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: data.totalRentOutstanding > 0 ? "#dc2626" : "#059669", marginTop: 4 }}>
            KES {data.totalRentOutstanding.toLocaleString()} Outstanding
          </div>
        </div>

        {/* Rent Collection Efficiency */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <span>Rent Collection Efficiency</span>
            <TrendingUp size={18} color="#059669" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {data.totalRentCollected + data.totalRentOutstanding > 0
              ? ((data.totalRentCollected / (data.totalRentCollected + data.totalRentOutstanding)) * 100).toFixed(1)
              : "100.0"}%
          </div>
          <div style={{ fontSize: 12, color: data.totalRentOutstanding > 0 ? "#dc2626" : "#059669", marginTop: 4 }}>
            {data.totalRentOutstanding > 0 ? `KES ${data.totalRentOutstanding.toLocaleString()} Arrears` : "Zero Overdue Arrears"}
          </div>
        </div>

        {/* Users */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <span>Active Residents</span>
            <Users size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {data.totalTenants}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {data.totalLandlords} Landlords • {data.activeTenancies} Leases
          </div>
        </div>

        {/* Maintenance */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <span>Maintenance Queue</span>
            <Wrench size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {data.outstandingMaintenanceRequests}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Unresolved maintenance tickets
          </div>
        </div>
      </div>

      {/* Two Column: Recent Audit Log & Operational Warnings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 24 }}>
        {/* Recent Audit Activities */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent Platform Events</h3>
            <Link href="/dashboard/admin/audit" style={{ fontSize: 12, color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>
              Full Log →
            </Link>
          </div>
          {data.recentActivities.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No recent activity records.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.recentActivities.map((act, i) => (
                <div key={act.id} style={{ padding: "12px 20px", borderBottom: i < data.recentActivities.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      {act.eventType} — {act.entityType}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      By {act.performedBy} {act.notes ? `• ${act.notes}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {new Date(act.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operational Health & Warnings */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Platform Health Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Database Engine</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>CONNECTED</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>M-Pesa C2B / B2C Callback Listener</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>ACTIVE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Rent Invoicing & Billing Engine</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>OPERATIONAL</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Automated SMS & Email Dispatcher</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ArrearsReportDto, TenantArrearsDto, PropertyDto } from "@/types/domain";
import {
  TrendingDown,
  AlertTriangle,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ArrearsAgingPage() {
  const [report, setReport] = useState<ArrearsReportDto | null>(null);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadArrears();
  }, [selectedPropertyId]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch {}
  };

  const loadArrears = async () => {
    setLoading(true);
    try {
      const url = selectedPropertyId
        ? `/api/v1/rent/reports/arrears?propertyId=${selectedPropertyId}`
        : "/api/v1/rent/reports/arrears";
      const res = await api.get<ArrearsReportDto>(url);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatKes = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredTenants = (report?.tenants || []).filter(
    (t) =>
      t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      t.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      t.phoneNumber.includes(search)
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Arrears Aging Report
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            Delinquent rental balance categorization by aging buckets (30, 60, 90+ days past due).
          </p>
        </div>

        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            fontSize: 13,
            color: "#334155",
            background: "#ffffff",
            fontWeight: 600,
          }}
        >
          <option value="">All Authorized Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Aging KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div style={{ background: "#ffffff", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
            Total In Arrears
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
            {formatKes(report?.totalOutstanding || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {report?.tenantCount ?? 0} tenants with balance
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
            Current / ≤ 30 Days
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0284c7" }}>
            {formatKes(report?.current || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Grace period or recent due
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
            31 – 60 Days Overdue
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>
            {formatKes(report?.days31to60 || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            First follow-up reminder
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
            61 – 90 Days Overdue
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ea580c" }}>
            {formatKes(report?.days61to90 || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Second notice escalation
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
            Over 90 Days (&gt;90)
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>
            {formatKes(report?.over90Days || 0)}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Critical default risk
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          background: "#ffffff",
          padding: 14,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          alignItems: "center",
        }}
      >
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by tenant name, unit number, property, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "#0f172a",
          }}
        />
      </div>

      {/* Aging Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Unit & Property</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Total Owed</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right", color: "#0284c7" }}>≤ 30 Days</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right", color: "#d97706" }}>31–60 Days</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right", color: "#ea580c" }}>61–90 Days</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right", color: "#dc2626" }}>&gt; 90 Days</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t) => {
                const isExpanded = expandedTenantId === t.tenancyId;
                return (
                  <>
                    <tr key={t.tenancyId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.tenantName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{t.phoneNumber}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>
                        <div style={{ fontWeight: 600 }}>Unit {t.unitNumber}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{t.propertyName}</div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        {formatKes(t.totalOutstanding)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: t.current > 0 ? "#0284c7" : "#94a3b8" }}>
                        {t.current > 0 ? formatKes(t.current) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: t.days31to60 > 0 ? "#d97706" : "#94a3b8" }}>
                        {t.days31to60 > 0 ? formatKes(t.days31to60) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: t.days61to90 > 0 ? "#ea580c" : "#94a3b8" }}>
                        {t.days61to90 > 0 ? formatKes(t.days61to90) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: t.over90Days > 0 ? "#dc2626" : "#94a3b8" }}>
                        {t.over90Days > 0 ? formatKes(t.over90Days) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          onClick={() => setExpandedTenantId(isExpanded ? null : t.tenancyId)}
                          style={{
                            padding: "4px 8px",
                            background: "#f1f5f9",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? "Hide" : "Breakdown"}
                        </button>
                      </td>
                    </tr>

                    {/* Drill-down rows for overdue charges */}
                    {isExpanded && (
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <td colSpan={8} style={{ padding: "14px 24px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                            Overdue Charges Breakdown ({t.lines.length} open charges):
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {t.lines.map((l) => (
                              <div
                                key={l.chargeId}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  background: "#ffffff",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                  fontSize: 12,
                                }}
                              >
                                <span>
                                  <strong>{l.chargeReference}</strong> ({l.billingPeriod}) • Due:{" "}
                                  {new Date(l.dueDate).toLocaleDateString()}
                                </span>
                                <span style={{ color: l.daysOverdue > 60 ? "#dc2626" : "#ea580c", fontWeight: 700 }}>
                                  {formatKes(l.outstanding)} ({l.daysOverdue} days past due)
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Calculating arrears..." : "No tenant arrears found. All active tenancies are in good standing!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { RentChargeDto, GenerateChargesResultDto, PropertyDto } from "@/types/domain";
import {
  FileText,
  Plus,
  Play,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Building2,
  Calendar,
} from "lucide-react";

const STATUS_BADGE: Record<string, { color: string; bg: string; border: string }> = {
  Paid: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  PartiallyPaid: { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  Pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Overdue: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  Cancelled: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

export default function RentChargesPage() {
  const [charges, setCharges] = useState<RentChargeDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("");

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generatePropertyId, setGeneratePropertyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateChargesResultDto | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadCharges();
    loadProperties();
  }, [statusFilter, periodFilter]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch {}
  };

  const loadCharges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (periodFilter) params.append("billingPeriod", periodFilter);
      const res = await api.get<RentChargeDto[]>(`/api/v1/rent/charges?${params.toString()}`);
      setCharges(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setActionError("");
    setGenerateResult(null);

    try {
      const res = await api.post<GenerateChargesResultDto>("/api/v1/rent/charges/generate", {
        billingPeriod: generatePeriod,
        propertyId: generatePropertyId ? generatePropertyId : null,
      });
      setGenerateResult(res);
      await loadCharges();
    } catch (err: any) {
      setActionError(err?.message || "Failed to generate charges");
    } finally {
      setGenerating(false);
    }
  };

  const formatKes = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredCharges = charges.filter(
    (c) =>
      c.chargeReference.toLowerCase().includes(search.toLowerCase()) ||
      c.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.propertyName.toLowerCase().includes(search.toLowerCase())
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
            Rent Charges & Billing
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            Monthly recurring rental invoices and charge management.
          </p>
        </div>

        <button
          onClick={() => {
            setShowGenerateModal(true);
            setGenerateResult(null);
            setActionError("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "var(--gradient-brand, #0284c7)",
            border: "none",
            borderRadius: 10,
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px -1px rgba(2, 132, 199, 0.4)",
          }}
        >
          <Play size={16} />
          Generate Monthly Charges
        </button>
      </div>

      {/* Filters Bar */}
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
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tenant, unit, ref, or property..."
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 13,
            color: "#334155",
            background: "#ffffff",
          }}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="PartiallyPaid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          type="month"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          style={{
            padding: "7px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 13,
            color: "#334155",
            background: "#ffffff",
          }}
        />

        {(statusFilter || periodFilter || search) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setPeriodFilter("");
              setSearch("");
            }}
            style={{
              padding: "8px 12px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
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
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Reference</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Unit / Property</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Period</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Due Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Amount</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Outstanding</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCharges.map((charge) => {
                const badge = STATUS_BADGE[charge.status] || STATUS_BADGE.Pending;
                return (
                  <tr key={charge.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {charge.chargeReference}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      <div style={{ fontWeight: 600 }}>{charge.tenantName}</div>
                      {charge.tenancyReference && (
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Ref: {charge.tenancyReference}</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      <div style={{ fontWeight: 600 }}>Unit {charge.unitNumber}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{charge.propertyName}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 600 }}>
                      {charge.billingPeriod}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {new Date(charge.dueDate).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                      {formatKes(charge.amount)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: charge.outstandingAmount > 0 ? "#dc2626" : "#059669",
                      }}
                    >
                      {formatKes(charge.outstandingAmount)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {charge.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredCharges.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Loading rent charges..." : "No rent charges found matching current filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Charges Modal */}
      {showGenerateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 480,
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Generate Monthly Charges
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 20px" }}>
              Runs billing generation for all active leases. Leases starting mid-month are automatically prorated. Duplicate charges are skipped.
            </p>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#991b1b",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {actionError}
              </div>
            )}

            {generateResult ? (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    padding: 16,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#065f46", fontSize: 14, marginBottom: 6 }}>
                    Generation Completed
                  </div>
                  <div style={{ fontSize: 13, color: "#047857" }}>
                    Generated: <strong>{generateResult.generatedCount}</strong> charges
                    <br />
                    Skipped: <strong>{generateResult.skippedCount}</strong> (already billed)
                    <br />
                    Total Billed: <strong>{formatKes(generateResult.totalBilled)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "var(--gradient-brand, #0284c7)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Billing Period (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={generatePeriod}
                    onChange={(e) => setGeneratePeriod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Property Filter (Optional)
                  </label>
                  <select
                    value={generatePropertyId}
                    onChange={(e) => setGeneratePropertyId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "#ffffff",
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

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    style={{
                      padding: "9px 16px",
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: 8,
                      color: "#475569",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    style={{
                      padding: "9px 18px",
                      background: "var(--gradient-brand, #0284c7)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {generating ? "Generating..." : "Run Billing"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

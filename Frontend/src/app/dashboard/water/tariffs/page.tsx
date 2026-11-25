"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterTariffDto, PropertyDto } from "@/types/domain";
import {
  Tag,
  Plus,
  Building2,
  CheckCircle2,
  Layers,
  Calendar,
  AlertCircle,
  X,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export default function WaterTariffsPage() {
  const [tariffs, setTariffs] = useState<WaterTariffDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("");

  // Modals
  const [showFlatModal, setShowFlatModal] = useState(false);
  const [showTieredModal, setShowTieredModal] = useState(false);

  // Flat form
  const [flatForm, setFlatForm] = useState({
    name: "",
    unitRate: 150,
    baseCharge: 50,
    propertyId: "",
  });

  // Tiered form
  const [tieredForm, setTieredForm] = useState({
    name: "",
    baseCharge: 50,
    propertyId: "",
    tiers: [
      { tierOrder: 1, fromUnits: 0, toUnits: 10, ratePerUnit: 120 },
      { tierOrder: 2, fromUnits: 10, toUnits: 30, ratePerUnit: 150 },
      { tierOrder: 3, fromUnits: 30, toUnits: 999999, ratePerUnit: 200 },
    ],
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadTariffs();
    loadProperties();
  }, [propertyFilter]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTariffs = async () => {
    setLoading(true);
    try {
      const url = propertyFilter
        ? `/api/v1/tariffs?propertyId=${propertyFilter}`
        : "/api/v1/tariffs";
      const res = await api.get<WaterTariffDto[]>(url);
      setTariffs(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await api.post("/api/v1/tariffs/flat", {
        name: flatForm.name.trim(),
        unitRate: Number(flatForm.unitRate),
        baseCharge: Number(flatForm.baseCharge || 0),
        propertyId: flatForm.propertyId || null,
      });
      setShowFlatModal(false);
      setFlatForm({ name: "", unitRate: 150, baseCharge: 50, propertyId: "" });
      await loadTariffs();
    } catch (err: any) {
      setActionError(err?.message || "Failed to create flat tariff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTiered = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await api.post("/api/v1/tariffs/tiered", {
        name: tieredForm.name.trim(),
        baseCharge: Number(tieredForm.baseCharge || 0),
        propertyId: tieredForm.propertyId || null,
        tiers: tieredForm.tiers.map((t) => ({
          tierOrder: t.tierOrder,
          fromUnits: Number(t.fromUnits),
          toUnits: t.toUnits ? Number(t.toUnits) : null,
          ratePerUnit: Number(t.ratePerUnit),
        })),
      });
      setShowTieredModal(false);
      setTieredForm({
        name: "",
        baseCharge: 50,
        propertyId: "",
        tiers: [
          { tierOrder: 1, fromUnits: 0, toUnits: 10, ratePerUnit: 120 },
          { tierOrder: 2, fromUnits: 10, toUnits: 30, ratePerUnit: 150 },
          { tierOrder: 3, fromUnits: 30, toUnits: 999999, ratePerUnit: 200 },
        ],
      });
      await loadTariffs();
    } catch (err: any) {
      setActionError(err?.message || "Failed to create tiered tariff");
    } finally {
      setSubmitting(false);
    }
  };

  const formatKes = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0284c7",
                background: "#f0f9ff",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid #bae6fd",
                textTransform: "uppercase",
              }}
            >
              Water Ledger
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Water Tariffs & Billing Schedules
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Configure flat rate and tiered water billing pricing models per property or platform-wide
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setActionError("");
              setShowFlatModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "#0284c7",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Flat Tariff
          </button>
          <button
            onClick={() => {
              setActionError("");
              setShowTieredModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "#0f172a",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Layers size={16} /> Tiered Tariff
          </button>
        </div>
      </div>

      {/* Filter */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 24,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>Filter by Property:</span>
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            minWidth: 220,
          }}
        >
          <option value="">All Scopes (Global + All Properties)</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName || p.name}
            </option>
          ))}
        </select>
        <button
          onClick={loadTariffs}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            color: "#475569",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tariffs List */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading water tariffs...</div>
      ) : tariffs.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: 48,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <Tag size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No active water tariffs found</div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Create a flat or tiered tariff to start pricing water.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: 20,
          }}
        >
          {tariffs.map((t) => {
            const prop = properties.find((p) => p.id === t.propertyId);
            const propName = prop?.propertyName || prop?.name;
            return (
              <div
                key={t.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: t.propertyId ? "#0284c7" : "#059669",
                          background: t.propertyId ? "#f0f9ff" : "#ecfdf5",
                          padding: "2px 8px",
                          borderRadius: 4,
                          display: "inline-block",
                          marginBottom: 6,
                        }}
                      >
                        {t.propertyId ? `Property: ${propName || "Custom"}` : "Global Scope"}
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                        {t.name}
                      </h3>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        color: t.isTiered ? "#7c3aed" : "#0284c7",
                        background: t.isTiered ? "#f5f3ff" : "#f0f9ff",
                        border: `1px solid ${t.isTiered ? "#ddd6fe" : "#bae6fd"}`,
                      }}
                    >
                      {t.isTiered ? "Tiered Tariff" : "Flat Rate"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 16, margin: "16px 0", padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Base Charge</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{formatKes(t.baseCharge)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                        {t.isTiered ? "Pricing Model" : "Rate per Unit"}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0284c7" }}>
                        {t.isTiered ? `${t.tiers.length} Tiers Defined` : `${formatKes(t.unitRate)} / m³`}
                      </div>
                    </div>
                  </div>

                  {/* Tiers Breakdown if Tiered */}
                  {t.isTiered && t.tiers && t.tiers.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                        Consumption Tiers:
                      </div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                              <th style={{ padding: "6px 10px" }}>Tier</th>
                              <th style={{ padding: "6px 10px" }}>Range (m³)</th>
                              <th style={{ padding: "6px 10px", textAlign: "right" }}>Rate / m³</th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.tiers.map((tr) => (
                              <tr key={tr.id || tr.tierOrder} style={{ borderBottom: "1px solid #f8fafc" }}>
                                <td style={{ padding: "6px 10px", fontWeight: 600 }}>Tier {tr.tierOrder}</td>
                                <td style={{ padding: "6px 10px" }}>
                                  {tr.fromUnits} – {tr.toUnits && tr.toUnits < 99999 ? `${tr.toUnits} m³` : "∞"}
                                </td>
                                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#0284c7" }}>
                                  {formatKes(tr.ratePerUnit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                  Effective from {new Date(t.effectiveFrom).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Flat Tariff */}
      {showFlatModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 480,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Create Flat Rate Tariff
              </h2>
              <button
                onClick={() => setShowFlatModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateFlat}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Tariff Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Residential Water"
                  value={flatForm.name}
                  onChange={(e) => setFlatForm({ ...flatForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Rate per m³ (KES) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={flatForm.unitRate}
                    onChange={(e) => setFlatForm({ ...flatForm, unitRate: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Base / Standing Charge (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={flatForm.baseCharge}
                    onChange={(e) => setFlatForm({ ...flatForm, baseCharge: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Property Scope (optional)
                </label>
                <select
                  value={flatForm.propertyId}
                  onChange={(e) => setFlatForm({ ...flatForm, propertyId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="">Global (Default across all properties)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.propertyName || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowFlatModal(false)}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "9px 20px",
                    background: "#0284c7",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Creating..." : "Create Tariff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Tiered Tariff */}
      {showTieredModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 580,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Create Tiered Water Tariff
              </h2>
              <button
                onClick={() => setShowTieredModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateTiered}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Tariff Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Progressive Conservation Tariff"
                  value={tieredForm.name}
                  onChange={(e) => setTieredForm({ ...tieredForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Base Charge (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tieredForm.baseCharge}
                    onChange={(e) => setTieredForm({ ...tieredForm, baseCharge: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Property Scope
                  </label>
                  <select
                    value={tieredForm.propertyId}
                    onChange={(e) => setTieredForm({ ...tieredForm, propertyId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "#fff",
                    }}
                  >
                    <option value="">Global (All properties)</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.propertyName || p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Tiers Definition
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tieredForm.tiers.map((tier, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, width: 50, color: "#64748b" }}>
                        T{tier.tierOrder}
                      </span>
                      <input
                        type="number"
                        placeholder="From m³"
                        value={tier.fromUnits}
                        onChange={(e) => {
                          const newTiers = [...tieredForm.tiers];
                          newTiers[idx].fromUnits = Number(e.target.value);
                          setTieredForm({ ...tieredForm, tiers: newTiers });
                        }}
                        style={{ width: 90, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                      />
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>to</span>
                      <input
                        type="number"
                        placeholder="To m³"
                        value={tier.toUnits}
                        onChange={(e) => {
                          const newTiers = [...tieredForm.tiers];
                          newTiers[idx].toUnits = Number(e.target.value);
                          setTieredForm({ ...tieredForm, tiers: newTiers });
                        }}
                        style={{ width: 90, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="KES / m³"
                        value={tier.ratePerUnit}
                        onChange={(e) => {
                          const newTiers = [...tieredForm.tiers];
                          newTiers[idx].ratePerUnit = Number(e.target.value);
                          setTieredForm({ ...tieredForm, tiers: newTiers });
                        }}
                        style={{ width: 110, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowTieredModal(false)}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "9px 20px",
                    background: "#0f172a",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Creating..." : "Create Tiered Tariff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

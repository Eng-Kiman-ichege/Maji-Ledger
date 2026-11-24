"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterReadingDto, WaterMeterDto, PropertyDto } from "@/types/domain";
import {
  Droplets,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Building2,
  Gauge,
  X,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export default function WaterConsumptionPage() {
  const [readings, setReadings] = useState<WaterReadingDto[]>([]);
  const [meters, setMeters] = useState<WaterMeterDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [meterFilter, setMeterFilter] = useState("");

  // Record modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [currentReadingInput, setCurrentReadingInput] = useState<number | "">("");
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [readingSource, setReadingSource] = useState("Physical");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadReadings();
    loadMetersAndProperties();
  }, [propertyFilter, meterFilter]);

  const loadMetersAndProperties = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        api.get<PropertyDto[]>("/api/v1/properties"),
        api.get<WaterMeterDto[]>("/api/v1/water/meters"),
      ]);
      setProperties(pRes);
      setMeters(mRes);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReadings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.append("propertyId", propertyFilter);
      if (meterFilter) params.append("waterMeterId", meterFilter);
      const res = await api.get<WaterReadingDto[]>(`/api/v1/water/readings?${params.toString()}`);
      setReadings(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedMeter = meters.find((m) => m.id === selectedMeterId);
  const prevReading = selectedMeter?.lastReading || 0;
  const isNegativeConsumption =
    currentReadingInput !== "" && Number(currentReadingInput) < prevReading;

  const handleRecordReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeterId) {
      setActionError("Please select a meter.");
      return;
    }
    if (isNegativeConsumption) {
      setActionError(
        `Current reading (${currentReadingInput} m³) cannot be lower than previous reading (${prevReading} m³). Negative consumption is prohibited.`
      );
      return;
    }

    setSubmitting(true);
    setActionError("");
    try {
      await api.post("/api/v1/water/readings", {
        waterMeterId: selectedMeterId,
        currentReading: Number(currentReadingInput),
        readingDate: new Date(readingDate).toISOString(),
        readingSource: readingSource,
        notes: notes.trim() || null,
      });
      setShowRecordModal(false);
      setSelectedMeterId("");
      setCurrentReadingInput("");
      setNotes("");
      await Promise.all([loadReadings(), loadMetersAndProperties()]);
    } catch (err: any) {
      setActionError(err?.message || "Failed to record reading");
    } finally {
      setSubmitting(false);
    }
  };

  const totalConsumption = readings.reduce((sum, r) => sum + (Number(r.consumption) || 0), 0);

  const filtered = readings.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.meterNumber.toLowerCase().includes(q) ||
      (r.propertyName && r.propertyName.toLowerCase().includes(q)) ||
      (r.unitNumber && r.unitNumber.toLowerCase().includes(q)) ||
      (r.readingSource && r.readingSource.toLowerCase().includes(q))
    );
  });

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
            Meter Readings & Consumption
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Track physical and automatic meter readings with automated delta consumption calculations
          </p>
        </div>

        <button
          onClick={() => {
            setActionError("");
            setShowRecordModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "#0284c7",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(2, 132, 199, 0.2)",
          }}
        >
          <Plus size={16} /> Record Reading
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Recorded Consumption</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
            {totalConsumption.toFixed(2)} m³
          </div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Readings Logs</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {readings.length}
          </div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Monitored Meters</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {meters.length}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search by meter #, property, unit, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            color: "#334155",
          }}
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName || p.name}
            </option>
          ))}
        </select>

        <select
          value={meterFilter}
          onChange={(e) => setMeterFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            color: "#334155",
          }}
        >
          <option value="">All Meters</option>
          {meters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.meterNumber} ({m.propertyName ? `${m.propertyName} Unit ${m.unitNumber}` : "Unassigned"})
            </option>
          ))}
        </select>

        <button
          onClick={loadReadings}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            color: "#475569",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading meter readings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Droplets size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No readings recorded yet</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Click "Record Reading" to log a meter reading and compute consumption.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Reading Date</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Property & Unit</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Previous (m³)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Current (m³)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Consumption (m³)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Source</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {new Date(r.readingDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(r.readingDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#0284c7",
                          fontFamily: "monospace",
                          background: "#f0f9ff",
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: "1px solid #bae6fd",
                        }}
                      >
                        {r.meterNumber}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 500, color: "#334155" }}>{r.propertyName || "—"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {r.unitNumber ? `Unit ${r.unitNumber}` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {Number(r.previousReading).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>
                      {Number(r.currentReading).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: "#059669",
                          background: "#ecfdf5",
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        +{Number(r.consumption).toFixed(2)} m³
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {r.readingSource}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                      {r.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Reading */}
      {showRecordModal && (
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
                Record Meter Reading
              </h2>
              <button
                onClick={() => setShowRecordModal(false)}
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

            <form onSubmit={handleRecordReading}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Select Meter *
                </label>
                <select
                  required
                  value={selectedMeterId}
                  onChange={(e) => setSelectedMeterId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="">-- Choose Meter --</option>
                  {meters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.meterNumber} ({m.propertyName ? `${m.propertyName} Unit ${m.unitNumber}` : "Unassigned"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMeter && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    marginBottom: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#64748b" }}>Previous Reading:</span>
                  <strong style={{ color: "#0f172a" }}>{Number(prevReading).toFixed(2)} m³</strong>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Current Reading (m³) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={`Must be ≥ ${prevReading} m³`}
                  value={currentReadingInput}
                  onChange={(e) =>
                    setCurrentReadingInput(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: isNegativeConsumption ? "1px solid #ef4444" : "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
                {isNegativeConsumption && (
                  <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                    Warning: Current reading is lower than previous reading ({prevReading} m³)!
                  </div>
                )}
                {currentReadingInput !== "" && !isNegativeConsumption && selectedMeter && (
                  <div style={{ color: "#059669", fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                    Computed Consumption: +{(Number(currentReadingInput) - prevReading).toFixed(2)} m³
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Reading Date
                  </label>
                  <input
                    type="date"
                    required
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
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
                    Source
                  </label>
                  <select
                    value={readingSource}
                    onChange={(e) => setReadingSource(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "#fff",
                    }}
                  >
                    <option value="Physical">Physical Meter Reader</option>
                    <option value="Automatic">Automatic IoT Pulse</option>
                    <option value="TenantSelf">Tenant Self-Read</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, dial condition, technician name..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
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
                  disabled={submitting || isNegativeConsumption}
                  style={{
                    padding: "9px 20px",
                    background: "#0284c7",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    opacity: submitting || isNegativeConsumption ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Saving..." : "Record Reading"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

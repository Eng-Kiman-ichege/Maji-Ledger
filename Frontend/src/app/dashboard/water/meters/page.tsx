"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type {
  WaterMeterDto,
  WaterMeterDetailDto,
  PropertyDto,
  MeterStatus,
  MeterType,
  MeterIntegrationType,
} from "@/types/domain";
import {
  Gauge,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRightLeft,
  QrCode,
  Eye,
  Building2,
  Calendar,
  Layers,
  Wrench,
  X,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  Active: { label: "Active", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  Inactive: { label: "Inactive", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  Suspended: { label: "Suspended", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Faulty: { label: "Faulty", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  Disconnected: { label: "Disconnected", color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff" },
  UnderMaintenance: { label: "Maintenance", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
};

export default function WaterMetersPage() {
  const [meters, setMeters] = useState<WaterMeterDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState<WaterMeterDto | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<WaterMeterDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<WaterMeterDetailDto | null>(null);

  // Form states
  const [registerForm, setRegisterForm] = useState({
    meterNumber: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    type: "Prepaid" as MeterType,
    integrationType: "ApiIntegrated" as MeterIntegrationType,
    apartmentId: "",
    notes: "",
  });

  const [transferApartmentId, setTransferApartmentId] = useState("");
  const [newStatus, setNewStatus] = useState<MeterStatus>("Active");
  const [statusReason, setStatusReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadMeters();
    loadProperties();
  }, [statusFilter, propertyFilter]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMeters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (propertyFilter) params.append("propertyId", propertyFilter);
      const res = await api.get<WaterMeterDto[]>(`/api/v1/water/meters?${params.toString()}`);
      setMeters(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError("");
    try {
      await api.post("/api/v1/water/meters", {
        meterNumber: registerForm.meterNumber.trim(),
        serialNumber: registerForm.serialNumber.trim() || null,
        manufacturer: registerForm.manufacturer.trim() || null,
        model: registerForm.model.trim() || null,
        type: registerForm.type,
        integrationType: registerForm.integrationType,
        apartmentId: registerForm.apartmentId || null,
        notes: registerForm.notes.trim() || null,
      });
      setShowRegisterModal(false);
      setRegisterForm({
        meterNumber: "",
        serialNumber: "",
        manufacturer: "",
        model: "",
        type: "Prepaid",
        integrationType: "ApiIntegrated",
        apartmentId: "",
        notes: "",
      });
      await loadMeters();
    } catch (err: any) {
      setActionError(err?.message || "Failed to register meter");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal) return;
    setSubmitting(true);
    setActionError("");
    try {
      await api.post(`/api/v1/water/meters/${showTransferModal.id}/transfer`, {
        targetApartmentId: transferApartmentId || null,
      });
      setShowTransferModal(null);
      setTransferApartmentId("");
      await loadMeters();
    } catch (err: any) {
      setActionError(err?.message || "Failed to transfer meter");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStatusModal) return;
    setSubmitting(true);
    setActionError("");
    try {
      await api.patch(`/api/v1/water/meters/${showStatusModal.id}/status`, {
        status: newStatus,
        reason: statusReason.trim() || null,
      });
      setShowStatusModal(null);
      setStatusReason("");
      await loadMeters();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const res = await api.get<WaterMeterDetailDto>(`/api/v1/water/meters/${id}`);
      setShowDetailModal(res);
    } catch (err: any) {
      alert("Failed to load meter details: " + err.message);
    }
  };

  const filteredMeters = meters.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.meterNumber.toLowerCase().includes(q) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(q)) ||
      (m.propertyName && m.propertyName.toLowerCase().includes(q)) ||
      (m.unitNumber && m.unitNumber.toLowerCase().includes(q)) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
    );
  });

  const totalMeters = meters.length;
  const activeMeters = meters.filter((m) => m.status === "Active").length;
  const prepaidCount = meters.filter((m) => m.type === "Prepaid").length;
  const faultyCount = meters.filter(
    (m) => m.status === "Faulty" || m.status === "UnderMaintenance"
  ).length;

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
            Water Meters Fleet
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Register, assign to apartments, transfer, and monitor water meters across all properties
          </p>
        </div>

        <button
          onClick={() => {
            setActionError("");
            setShowRegisterModal(true);
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
          <Plus size={16} />
          Register Meter
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
        <div
          style={{
            background: "#fff",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#f0f9ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0284c7",
            }}
          >
            <Gauge size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Fleet</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{totalMeters}</div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Active Meters</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{activeMeters}</div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Prepaid Meters</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2563eb" }}>{prepaidCount}</div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
            }}
          >
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Faulty / Maint.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{faultyCount}</div>
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
            placeholder="Search by meter #, serial, property, or unit..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
          <option value="Faulty">Faulty</option>
          <option value="Disconnected">Disconnected</option>
          <option value="UnderMaintenance">Under Maintenance</option>
        </select>

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

        <button
          onClick={loadMeters}
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

      {/* Meters Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading water meters fleet...</div>
        ) : filteredMeters.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Gauge size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No water meters found</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Register a meter or clear search filters.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Serial & Model</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Property & Unit</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Type & Mode</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Last Reading</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMeters.map((m) => {
                  const badge = STATUS_CONFIG[m.status] || STATUS_CONFIG.Active;
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{m.meterNumber}</div>
                        {m.activeQrCodeToken && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              color: "#0284c7",
                              marginTop: 2,
                            }}
                          >
                            <QrCode size={11} /> Scan-to-Pay Active
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "#334155", fontWeight: 500 }}>
                          {m.manufacturer || "Generic"} {m.model || ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>SN: {m.serialNumber || "—"}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {m.propertyName ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{m.propertyName}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {m.buildingName ? `${m.buildingName} - ` : ""}
                              <span style={{ fontWeight: 600, color: "#0284c7" }}>Unit {m.unitNumber}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#334155" }}>{m.type}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{m.integrationType}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            color: badge.color,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {m.lastReading !== undefined && m.lastReading !== null
                            ? `${Number(m.lastReading).toFixed(2)} m³`
                            : "0.00 m³"}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {m.lastReadingDate ? new Date(m.lastReadingDate).toLocaleDateString() : "No reading"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            onClick={() => viewDetails(m.id)}
                            title="View Details"
                            style={{
                              padding: "6px 8px",
                              background: "#f1f5f9",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              color: "#475569",
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setActionError("");
                              setShowTransferModal(m);
                            }}
                            title="Transfer / Assign"
                            style={{
                              padding: "6px 8px",
                              background: "#f0f9ff",
                              border: "1px solid #bae6fd",
                              borderRadius: 6,
                              cursor: "pointer",
                              color: "#0284c7",
                            }}
                          >
                            <ArrowRightLeft size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setActionError("");
                              setNewStatus(m.status);
                              setShowStatusModal(m);
                            }}
                            title="Change Status"
                            style={{
                              padding: "6px 8px",
                              background: "#fefce8",
                              border: "1px solid #fde047",
                              borderRadius: 6,
                              cursor: "pointer",
                              color: "#ca8a04",
                            }}
                          >
                            <Wrench size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Meter */}
      {showRegisterModal && (
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
              maxWidth: 540,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Register Water Meter
              </h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegister} style={{ padding: 24 }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Meter Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WM-10045"
                    value={registerForm.meterNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, meterNumber: e.target.value })}
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
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-889123"
                    value={registerForm.serialNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, serialNumber: e.target.value })}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chint, Inhemeter"
                    value={registerForm.manufacturer}
                    onChange={(e) => setRegisterForm({ ...registerForm, manufacturer: e.target.value })}
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
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DDSY666"
                    value={registerForm.model}
                    onChange={(e) => setRegisterForm({ ...registerForm, model: e.target.value })}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Meter Type
                  </label>
                  <select
                    value={registerForm.type}
                    onChange={(e) => setRegisterForm({ ...registerForm, type: e.target.value as MeterType })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "#fff",
                    }}
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="Postpaid">Postpaid</option>
                    <option value="MonitoringOnly">Monitoring Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Integration Type
                  </label>
                  <select
                    value={registerForm.integrationType}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, integrationType: e.target.value as MeterIntegrationType })
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "#fff",
                    }}
                  >
                    <option value="ApiIntegrated">API Integrated (Auto STS Token)</option>
                    <option value="ManualToken">Manual Token Entry</option>
                    <option value="MonitoringOnly">Monitoring Only</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Notes / Location Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Installation notes, riser location, etc."
                  value={registerForm.notes}
                  onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
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
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Registering..." : "Register Meter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Meter */}
      {showTransferModal && (
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
                Transfer / Assign Meter {showTransferModal.meterNumber}
              </h2>
              <button
                onClick={() => setShowTransferModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 16px" }}>
              Current assignment:{" "}
              <strong>
                {showTransferModal.propertyName
                  ? `${showTransferModal.propertyName} - Unit ${showTransferModal.unitNumber}`
                  : "Unassigned"}
              </strong>
            </p>

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

            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Target Apartment ID (or leave blank to unassign)
                </label>
                <input
                  type="text"
                  placeholder="Enter Apartment GUID or leave empty to unassign"
                  value={transferApartmentId}
                  onChange={(e) => setTransferApartmentId(e.target.value)}
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
                  onClick={() => setShowTransferModal(null)}
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
                  {submitting ? "Saving..." : transferApartmentId ? "Transfer Meter" : "Unassign Meter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Status */}
      {showStatusModal && (
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
              maxWidth: 440,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Update Status: {showStatusModal.meterNumber}
              </h2>
              <button
                onClick={() => setShowStatusModal(null)}
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

            <form onSubmit={handleStatusChange}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  New Meter Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as MeterStatus)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Faulty">Faulty</option>
                  <option value="Disconnected">Disconnected</option>
                  <option value="UnderMaintenance">Under Maintenance</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Reason / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
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
                  onClick={() => setShowStatusModal(null)}
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
                  {submitting ? "Saving..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {showDetailModal && (
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
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Meter {showDetailModal.meterNumber}
                </h2>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {showDetailModal.manufacturer} {showDetailModal.model} (SN: {showDetailModal.serialNumber || "N/A"})
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Status & Type</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {showDetailModal.status} · {showDetailModal.type}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{showDetailModal.integrationType}</div>
              </div>

              <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Assigned Apartment</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {showDetailModal.propertyName || "Unassigned"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {showDetailModal.unitNumber ? `Unit ${showDetailModal.unitNumber}` : "In storage"}
                </div>
              </div>
            </div>

            {/* Assignment History */}
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              Assignment History
            </h3>
            {showDetailModal.assignmentHistory.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>No previous assignments</div>
            ) : (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Unit</th>
                      <th style={{ padding: "8px 12px" }}>Assigned At</th>
                      <th style={{ padding: "8px 12px" }}>Unassigned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDetailModal.assignmentHistory.map((ah) => (
                      <tr key={ah.assignmentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{ah.unitNumber}</td>
                        <td style={{ padding: "8px 12px" }}>{new Date(ah.assignedAt).toLocaleDateString()}</td>
                        <td style={{ padding: "8px 12px" }}>
                          {ah.unassignedAt ? new Date(ah.unassignedAt).toLocaleDateString() : "Current"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent Readings */}
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              Recent Meter Readings
            </h3>
            {showDetailModal.recentReadings.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>No readings recorded yet</div>
            ) : (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Date</th>
                      <th style={{ padding: "8px 12px" }}>Reading (m³)</th>
                      <th style={{ padding: "8px 12px" }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDetailModal.recentReadings.map((r) => (
                      <tr key={r.readingId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 12px" }}>{new Date(r.readAt).toLocaleString()}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 700 }}>
                          {Number(r.readingValue).toFixed(2)} m³
                        </td>
                        <td style={{ padding: "8px 12px" }}>{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

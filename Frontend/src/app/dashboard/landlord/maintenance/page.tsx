"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type {
  LandlordPortalPropertyDto,
  MaintenanceRequestDto,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from "@/types/domain";
import { Wrench, Plus, Search, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordMaintenancePage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<MaintenanceCategory>("Plumbing");
  const [formPriority, setFormPriority] = useState<MaintenancePriority>("Medium");
  const [formEstimatedCost, setFormEstimatedCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
      setProperties(props);

      const url = selectedPropertyId
        ? `/api/v1/maintenance?propertyId=${selectedPropertyId}`
        : "/api/v1/maintenance";
      const res = await api.get<MaintenanceRequestDto[]>(url);
      setRequests(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPropertyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPropertyId || !formTitle || !formDescription) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      await api.post("/api/v1/maintenance", {
        propertyId: formPropertyId,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        priority: formPriority,
        estimatedCost: formEstimatedCost ? parseFloat(formEstimatedCost) : null,
      });
      setShowModal(false);
      setFormTitle("");
      setFormDescription("");
      setFormEstimatedCost("");
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.patch(`/api/v1/maintenance/${id}/acknowledge`, { assignedTo: "Assigned Contractor" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = requests.filter((r) => {
    const s = search.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s) ||
      (r.propertyName && r.propertyName.toLowerCase().includes(s)) ||
      (r.unitNumber && r.unitNumber.toLowerCase().includes(s));
    const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Maintenance & Repairs</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Track plumbing, electrical, and structural repair requests across your properties.
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => {
              if (properties.length > 0) setFormPropertyId(properties[0].id);
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading maintenance requests...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Wrench size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Requests Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No maintenance requests match your current filters.</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Issue Title</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Property / Unit</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Priority</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Estimated Cost</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.description.slice(0, 60)}...</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{r.propertyName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {r.unitNumber ? `Unit ${r.unitNumber}` : "General Building"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#334155" }}>{r.category}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          r.priority === "Critical"
                            ? "#fef2f2"
                            : r.priority === "High"
                            ? "#fff7ed"
                            : "#f8fafc",
                        color:
                          r.priority === "Critical"
                            ? "#dc2626"
                            : r.priority === "High"
                            ? "#ea580c"
                            : "#475569",
                      }}
                    >
                      {r.priority}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          r.status === "Completed"
                            ? "#f0fdf4"
                            : r.status === "InProgress"
                            ? "#f0f9ff"
                            : "#fef3c7",
                        color:
                          r.status === "Completed"
                            ? "#16a34a"
                            : r.status === "InProgress"
                            ? "#0284c7"
                            : "#d97706",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                    {r.estimatedCost ? formatKes(r.estimatedCost) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {r.status === "Submitted" && (
                      <button
                        onClick={() => handleAcknowledge(r.id)}
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          color: "#16a34a",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: New Maintenance Ticket */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>Log Maintenance Request</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Target Property *
                </label>
                <select
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Issue Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main gate sensor faulty"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MaintenanceCategory)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Structural">Structural</option>
                    <option value="Painting">Painting</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as MaintenancePriority)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Estimated Cost (KES)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={formEstimatedCost}
                  onChange={(e) => setFormEstimatedCost(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue in detail..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

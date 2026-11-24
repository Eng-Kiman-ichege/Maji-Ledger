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
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  AlertTriangle,
  Building2,
  Filter,
  DollarSign,
  User,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatKesFull(n: number) {
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
      setRequests(res || []);
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

  const totalRequests = requests.length;
  const openRequests = requests.filter((r) => r.status === "Submitted").length;
  const inProgressRequests = requests.filter((r) => r.status === "InProgress" || r.status === "Acknowledged").length;
  const completedRequests = requests.filter((r) => r.status === "Completed").length;
  const criticalRequests = requests.filter((r) => r.priority === "Critical" && r.status !== "Completed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%)",
          borderRadius: 20,
          padding: "32px 36px",
          position: "relative",
          overflow: "hidden",
          color: "#ffffff",
          boxShadow: "0 10px 30px -10px rgba(67, 56, 202, 0.4)",
        }}
      >
        <div style={{ position: "absolute", right: -50, top: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🏢 Property Suite
              </div>
              <div style={{ background: "rgba(99,102,241,0.5)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(255,255,255,0.2)" }}>
                Maintenance Operations
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Maintenance & Work Orders
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Track plumbing, electrical, structural, and contractor dispatch work orders across your buildings.
            </p>
          </div>

          <button
            onClick={() => {
              if (properties.length > 0 && !formPropertyId) {
                setFormPropertyId(properties[0].id);
              }
              setShowModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "#ffffff",
              color: "#4f46e5",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            <Plus size={16} /> New Work Order
          </button>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Total Requests", value: totalRequests, icon: "🔧" },
            { label: "Open & Reported", value: openRequests, icon: "⏳" },
            { label: "In Progress", value: inProgressRequests, icon: "⚡" },
            { label: "Completed", value: completedRequests, icon: "✅" },
            { label: "Critical Priority", value: criticalRequests, icon: "🚨" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "8px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 120,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI STATUS CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Active Maintenance
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {openRequests + inProgressRequests} <span style={{ fontSize: 16, color: "#64748b" }}>Tickets</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {openRequests} open, {inProgressRequests} currently being serviced
              </div>
            </div>
            <div style={{ background: "#fffbeb", borderRadius: 12, padding: "10px 12px", border: "1px solid #fde68a" }}>
              <Wrench size={22} color="#d97706" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>OPEN</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#d97706" }}>{openRequests}</div>
            </div>
            <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>IN PROGRESS</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0284c7" }}>{inProgressRequests}</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: `1px solid ${criticalRequests > 0 ? "#fecaca" : "#e2e8f0"}`, boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: criticalRequests > 0 ? "#dc2626" : "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Critical Urgent Issues
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: criticalRequests > 0 ? "#dc2626" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {criticalRequests} <span style={{ fontSize: 16, color: "#64748b" }}>Urgent</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {criticalRequests > 0 ? "Requires immediate contractor dispatch" : "Zero high-severity emergencies"}
              </div>
            </div>
            <div style={{ background: criticalRequests > 0 ? "#fef2f2" : "#ecfdf5", borderRadius: 12, padding: "10px 12px", border: `1px solid ${criticalRequests > 0 ? "#fecaca" : "#a7f3d0"}` }}>
              {criticalRequests > 0 ? <AlertTriangle size={22} color="#dc2626" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ background: criticalRequests > 0 ? "#fee2e2" : "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: criticalRequests > 0 ? "#991b1b" : "#166534", fontWeight: 600 }}>
            {criticalRequests > 0 ? "Immediate inspection necessary" : "All building systems operational"}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Resolution Rate
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 100}%
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {completedRequests} tickets successfully resolved
              </div>
            </div>
            <div style={{ background: "#ecfdf5", borderRadius: 12, padding: "10px 12px", border: "1px solid #a7f3d0" }}>
              <CheckCircle2 size={22} color="#059669" />
            </div>
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div
              style={{
                width: `${totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 100}%`,
                height: "100%",
                background: "#059669",
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px -2px rgba(0,0,0,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: 260, flex: 1 }}>
            <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by title, description, property, or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 36px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                outline: "none",
                background: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={15} color="#6366f1" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                background: "#f8fafc",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">All Properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={15} color="#6366f1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                background: "#f8fafc",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">All Statuses ({requests.length})</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> tickets
        </div>
      </div>

      {/* ── MAINTENANCE TICKETS TABLE ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e0e7ff", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#6366f1", fontWeight: 700, margin: 0 }}>Loading maintenance requests...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Wrench size={32} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>No Work Orders Found</h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>
            No repair tickets match the active filters or need attention.
          </p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Issue & Property
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Category
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Priority
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Est. Cost
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Reported Date
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Status
                </th>
                <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const priorityStyles: Record<string, { bg: string; color: string; border: string }> = {
                  Critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
                  High: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
                  Medium: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
                  Low: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                };
                const pr = priorityStyles[r.priority] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };

                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {r.propertyName} {r.unitNumber ? `• Unit ${r.unitNumber}` : ""}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{r.description.slice(0, 60)}...</div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: pr.bg,
                          color: pr.color,
                          border: `1px solid ${pr.border}`,
                        }}
                      >
                        {r.priority === "Critical" && <AlertTriangle size={11} />}
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0f172a" }}>
                      {r.estimatedCost ? formatKes(r.estimatedCost) : "—"}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#64748b", fontSize: 12 }}>
                      {new Date(r.submittedAt || r.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: r.status === "Completed" ? "#ecfdf5" : r.status === "InProgress" ? "#f0f9ff" : "#fffbeb",
                          color: r.status === "Completed" ? "#059669" : r.status === "InProgress" ? "#0284c7" : "#d97706",
                          border: r.status === "Completed" ? "1px solid #a7f3d0" : r.status === "InProgress" ? "1px solid #bae6fd" : "1px solid #fde68a",
                        }}
                      >
                        {r.status === "Completed" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {r.status === "Submitted" ? (
                        <button
                          onClick={() => handleAcknowledge(r.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "#f0fdf4",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Dispatch
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{r.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 520, padding: 28, boxShadow: "0 24px 60px -8px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}>
                  <Wrench size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Create Maintenance Work Order</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Report an issue or schedule building maintenance</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 14, fontSize: 13, border: "1px solid #fecaca" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Target Property *
                </label>
                <select
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
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
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Work Order Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main water booster pump repair"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MaintenanceCategory)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as MaintenancePriority)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Estimated Cost (KES)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 7500"
                  value={formEstimatedCost}
                  onChange={(e) => setFormEstimatedCost(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed breakdown of required parts and labor..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", fontFamily: "inherit" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#ffffff", fontWeight: 700, cursor: "pointer", fontSize: 13, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
                >
                  {submitting ? "Dispatching..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

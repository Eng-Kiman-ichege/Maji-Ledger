"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Wrench, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface MaintenanceItem {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("Plumbing");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get<MaintenanceItem[]>("/api/v1/maintenance");
      setRequests(res || []);
    } catch {
      // In case endpoint returns empty or filtered
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setSubmitting(true);
      await api.post("/api/v1/maintenance", {
        category,
        priority,
        description: description.trim(),
      });
      setShowModal(false);
      setDescription("");
      setMsg("Maintenance request submitted successfully.");
      fetchRequests();
      setTimeout(() => setMsg(""), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            Maintenance & Repairs
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Log repair tickets, track technician resolution status, and report unit issues.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            background: "#0284c7",
            color: "#ffffff",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> New Repair Ticket
        </button>
      </div>

      {msg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Tickets List */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Your Support & Repair Tickets</h3>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading tickets...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <Wrench size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No active maintenance tickets</div>
            <p style={{ fontSize: 13, margin: "4px 0 0" }}>All repairs in your unit are currently up to date.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {requests.map((r, i) => (
              <div
                key={r.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: i < requests.length - 1 ? "1px solid #f1f5f9" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{r.category}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: r.priority === "Urgent" ? "#fee2e2" : "#f1f5f9",
                        color: r.priority === "Urgent" ? "#b91c1c" : "#475569",
                      }}
                    >
                      {r.priority}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 4px", fontSize: 13, color: "#475569" }}>{r.description}</p>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    Logged on {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 12,
                      background: r.status === "Completed" ? "#dcfce7" : r.status === "InProgress" ? "#fef3c7" : "#e0f2fe",
                      color: r.status === "Completed" ? "#166534" : r.status === "InProgress" ? "#92400e" : "#0369a1",
                    }}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
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
              borderRadius: 14,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                Submit New Repair Request
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="Plumbing">Plumbing & Water</option>
                  <option value="Electrical">Electrical & Lighting</option>
                  <option value="Carpentry">Doors & Carpentry</option>
                  <option value="Painting">Painting & Walls</option>
                  <option value="Other">Other / General</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent (e.g. active leak)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Description of Issue
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the issue, location in the unit, and when it started..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
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

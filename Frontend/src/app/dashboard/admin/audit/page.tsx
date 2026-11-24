"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AuditLogSummaryDto } from "@/types/domain";
import { Activity, Search, Filter } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [performedBy, setPerformedBy] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityType) params.append("entityType", entityType);
      if (performedBy) params.append("performedBy", performedBy);

      const res = await api.get<AuditLogSummaryDto[]>(`/api/v1/admin/control/audit-logs?${params.toString()}`);
      setLogs(res || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
          Compliance & Security
        </span>
        <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
          Platform Audit Trail
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Immutable activity tracking for user actions, financial overrides, and system changes.
        </p>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilter} style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
        <input
          type="text"
          placeholder="Filter by entity type (e.g. RentPayment, Meter)..."
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
        />
        <input
          type="text"
          placeholder="Filter by user email or ID..."
          value={performedBy}
          onChange={(e) => setPerformedBy(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
        />
        <button
          type="submit"
          style={{ padding: "8px 16px", background: "#0284c7", color: "#ffffff", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Search size={14} /> Filter
        </button>
      </form>

      {/* Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No audit records found matching criteria.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 18px" }}>Timestamp</th>
                <th style={{ padding: "12px 18px" }}>Event Type</th>
                <th style={{ padding: "12px 18px" }}>Entity</th>
                <th style={{ padding: "12px 18px" }}>Performed By</th>
                <th style={{ padding: "12px 18px" }}>Details / Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 18px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(l.occurredAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: "#0f172a" }}>
                    {l.eventType}
                  </td>
                  <td style={{ padding: "12px 18px", color: "#0284c7", fontWeight: 600 }}>
                    {l.entityType}
                  </td>
                  <td style={{ padding: "12px 18px", color: "#475569" }}>
                    {l.performedBy}
                  </td>
                  <td style={{ padding: "12px 18px", color: "#64748b" }}>
                    {l.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

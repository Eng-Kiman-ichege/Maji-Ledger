"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { IntegrationStatusDto } from "@/types/domain";
import { Server, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatusDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get<IntegrationStatusDto[]>("/api/v1/admin/control/integrations");
      setIntegrations(res || []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
            Infrastructure & Connectors
          </span>
          <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Integration Health & Gateways
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Real-time status of payment gateways (Daraja M-Pesa, Airtel), SMS delivery, and STS token vending engines.
          </p>
        </div>

        <button
          onClick={fetchIntegrations}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}
        >
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", gridColumn: "1 / -1" }}>
            Diagnosing connectors...
          </div>
        ) : integrations.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1" }}>
            No integration providers configured.
          </div>
        ) : (
          integrations.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 22,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.type}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: item.status === "Active" || item.status === "Healthy" ? "#dcfce7" : "#fee2e2",
                    color: item.status === "Active" || item.status === "Healthy" ? "#166534" : "#991b1b",
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div style={{ fontSize: 13, color: "#475569", background: "#f8fafc", padding: "10px 12px", borderRadius: 8 }}>
                {item.details ?? "Operational"}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                <span>Environment: <strong>{item.environment ?? "Production"}</strong></span>
                <span>Checked: {new Date(item.lastChecked).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

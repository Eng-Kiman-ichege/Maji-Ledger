"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterTransactionDto } from "@/types/domain";
import {
  Key,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";

export default function WaterTokensPage() {
  const [tokens, setTokens] = useState<WaterTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, [statusFilter]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Only fetch confirmed transactions where token generation is relevant
      params.append("paymentStatus", "Confirmed");
      if (statusFilter) params.append("tokenStatus", statusFilter);
      const res = await api.get<WaterTransactionDto[]>(
        `/api/v1/water/transactions?${params.toString()}`
      );
      setTokens(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = tokens.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.tokenValue && t.tokenValue.toLowerCase().includes(q)) ||
      t.meterNumber.toLowerCase().includes(q) ||
      t.phoneNumber.toLowerCase().includes(q) ||
      t.transactionReference.toLowerCase().includes(q) ||
      (t.tenantName && t.tenantName.toLowerCase().includes(q))
    );
  });

  const totalGenerated = tokens.filter((t) => t.tokenValue).length;
  const deliveredCount = tokens.filter((t) => t.tokenStatus === "Delivered").length;
  const pendingCount = tokens.filter((t) => t.tokenStatus === "Pending").length;
  const failedCount = tokens.filter((t) => t.tokenStatus === "Failed").length;

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
            STS 20-Digit Tokens & Dispatch Hub
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Monitor prepaid STS token generation, SMS delivery statuses, and manual audit trails
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Tokens Issued</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{totalGenerated}</div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Delivered via SMS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>{deliveredCount}</div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Pending Delivery</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706", marginTop: 4 }}>{pendingCount}</div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Failed Generations</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>{failedCount}</div>
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
            placeholder="Search by token code, meter #, customer phone, or transaction ref..."
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
          <option value="">All Token Statuses</option>
          <option value="Delivered">Delivered</option>
          <option value="Generated">Generated (Not yet delivered)</option>
          <option value="Pending">Pending Generation</option>
          <option value="Failed">Failed</option>
        </select>

        <button
          onClick={loadTokens}
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
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading tokens log...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Key size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No tokens found</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Tokens will appear when prepaid water purchases are fulfilled.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>STS Token Code</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Customer & Phone</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Units Purchased</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Generated At</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      {t.tokenValue ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <code
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f172a",
                              background: "#f1f5f9",
                              padding: "4px 8px",
                              borderRadius: 4,
                              letterSpacing: "0.05em",
                            }}
                          >
                            {t.tokenValue}
                          </code>
                          <button
                            onClick={() => handleCopy(t.tokenValue!, t.id)}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              color: copiedId === t.id ? "#059669" : "#94a3b8",
                            }}
                            title="Copy Token"
                          >
                            {copiedId === t.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                          {t.failureReason || "Generation Failed"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0284c7" }}>{t.meterNumber}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {t.propertyName} - Unit {t.unitNumber}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{t.tenantName || "Tenant"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{t.phoneNumber}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#059669" }}>
                        {Number(t.unitsPurchased).toFixed(2)} m³
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>KES {t.amount}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ color: "#334155" }}>{new Date(t.transactionDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(t.transactionDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            t.tokenStatus === "Delivered"
                              ? "#059669"
                              : t.tokenStatus === "Generated"
                              ? "#0284c7"
                              : t.tokenStatus === "Pending"
                              ? "#d97706"
                              : "#dc2626",
                          background:
                            t.tokenStatus === "Delivered"
                              ? "#ecfdf5"
                              : t.tokenStatus === "Generated"
                              ? "#f0f9ff"
                              : t.tokenStatus === "Pending"
                              ? "#fffbeb"
                              : "#fef2f2",
                          border: `1px solid ${
                            t.tokenStatus === "Delivered"
                              ? "#a7f3d0"
                              : t.tokenStatus === "Generated"
                              ? "#bae6fd"
                              : t.tokenStatus === "Pending"
                              ? "#fde68a"
                              : "#fecaca"
                          }`,
                        }}
                      >
                        {t.tokenStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {t.tokenValue && (
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: `Water Token for Meter ${t.meterNumber}`,
                                text: `Your water token is: ${t.tokenValue} (${t.unitsPurchased} m³).`,
                              });
                            } else {
                              handleCopy(t.tokenValue!, t.id);
                            }
                          }}
                          style={{
                            padding: "6px 10px",
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0284c7",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Send size={12} /> Share
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

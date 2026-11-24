"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type {
  WaterReconciliationSummaryDto,
  ProviderLookupResultDto,
  WaterTransactionDto,
  PropertyDto,
} from "@/types/domain";
import {
  FileCheck2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building2,
  HelpCircle,
} from "lucide-react";

export default function WaterReconciliationPage() {
  const [summary, setSummary] = useState<WaterReconciliationSummaryDto | null>(null);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Provider Lookup Tool
  const [lookupRef, setLookupRef] = useState("");
  const [lookupResult, setLookupResult] = useState<ProviderLookupResultDto | null>(null);
  const [searchingRef, setSearchingRef] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    loadSummary();
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

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.append("propertyId", propertyFilter);
      const res = await api.get<WaterReconciliationSummaryDto>(
        `/api/v1/water/reconciliation?${params.toString()}`
      );
      setSummary(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;
    setSearchingRef(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const res = await api.get<ProviderLookupResultDto>(
        `/api/v1/water/reconciliation/lookup?reference=${encodeURIComponent(lookupRef.trim())}`
      );
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(err?.message || "Failed to search reference");
    } finally {
      setSearchingRef(false);
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
            Water Payment Reconciliation
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Reconcile M-Pesa and Airtel Money collections against meter token issuance and resolve discrepancies
          </p>
        </div>

        <button
          onClick={loadSummary}
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
          <RefreshCw size={14} /> Refresh Summary
        </button>
      </div>

      {/* Provider Reference Lookup Tool */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          padding: 24,
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Search size={18} style={{ color: "#0284c7" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Instant Provider Reference Lookup (M-Pesa / Airtel Money)
          </h2>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Paste an M-Pesa receipt code (e.g. <code>QHK1234567</code>) or Airtel Money ID to locate the exact transaction, meter, and token status.
        </p>

        <form onSubmit={handleLookup} style={{ display: "flex", gap: 10, maxWidth: 640 }}>
          <input
            type="text"
            required
            placeholder="Enter M-Pesa / Airtel receipt code..."
            value={lookupRef}
            onChange={(e) => setLookupRef(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              fontFamily: "monospace",
              textTransform: "uppercase",
            }}
          />
          <button
            type="submit"
            disabled={searchingRef}
            style={{
              padding: "10px 20px",
              background: "#0284c7",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {searchingRef ? "Searching..." : "Lookup Reference"}
          </button>
        </form>

        {lookupError && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            {lookupError}
          </div>
        )}

        {lookupResult && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 10,
              background: lookupResult.found ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${lookupResult.found ? "#bbf7d0" : "#fde68a"}`,
            }}
          >
            {lookupResult.found && lookupResult.transaction ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>
                    Matched Transaction Found: {lookupResult.transaction.transactionReference}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b" }}>Provider Ref: </span>
                    <strong>{lookupResult.providerReference}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Amount: </span>
                    <strong style={{ color: "#16a34a" }}>{formatKes(lookupResult.transaction.amount)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Units: </span>
                    <strong>{Number(lookupResult.transaction.unitsPurchased).toFixed(2)} m³</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Meter: </span>
                    <strong>{lookupResult.transaction.meterNumber}</strong> ({lookupResult.transaction.propertyName} Unit {lookupResult.transaction.unitNumber})
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Phone: </span>
                    <strong>{lookupResult.transaction.phoneNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Token Status: </span>
                    <strong>{lookupResult.transaction.tokenStatus}</strong>
                  </div>
                  {lookupResult.transaction.tokenValue && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#64748b" }}>STS Token: </span>
                      <code style={{ fontWeight: 700, color: "#0284c7" }}>{lookupResult.transaction.tokenValue}</code>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={18} style={{ color: "#d97706" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>
                  {lookupResult.message || `No water transaction found with provider reference "${lookupResult.providerReference}".`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Confirmed Water Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
              {formatKes(summary.totalWaterRevenue)}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{summary.confirmedCount} successful orders</div>
          </div>

          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>M-Pesa Collections</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
              {formatKes(summary.mpesaTotal)}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{summary.mpesaCount} transactions</div>
          </div>

          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Airtel Money Collections</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
              {formatKes(summary.airtelTotal)}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{summary.airtelCount} transactions</div>
          </div>

          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Pending Tokens Backlog</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: summary.pendingTokensCount > 0 ? "#dc2626" : "#059669", marginTop: 4 }}>
              {summary.pendingTokensCount}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Requiring dispatch or token entry</div>
          </div>
        </div>
      )}

      {/* Discrepancies & Unresolved Items */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Pending or Discrepant Water Transactions
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Transactions where payment failed, token generation is pending, or SMS delivery did not complete
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading reconciliation summary...</div>
        ) : !summary || summary.unmatchedOrPendingTransactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <ShieldCheck size={40} style={{ color: "#16a34a", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#166534" }}>All Transactions Fully Reconciled!</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              There are no pending tokens, failed payments, or delivery issues in this scope.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Ref / Date</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Property & Unit</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Phone</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Provider Ref</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Amount</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Payment</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Token</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Reason / Issue</th>
                </tr>
              </thead>
              <tbody>
                {summary.unmatchedOrPendingTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{tx.transactionReference}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(tx.transactionDate).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{tx.propertyName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Unit {tx.unitNumber}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 700 }}>
                      {tx.meterNumber}
                    </td>
                    <td style={{ padding: "14px 16px" }}>{tx.phoneNumber}</td>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace" }}>
                      {tx.externalTransactionReference || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>{formatKes(tx.amount)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: tx.paymentStatus === "Confirmed" ? "#059669" : "#dc2626",
                        }}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: tx.tokenStatus === "Delivered" ? "#059669" : "#d97706",
                        }}
                      >
                        {tx.tokenStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#dc2626" }}>
                      {tx.failureReason || tx.notes || "Token pending generation"}
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

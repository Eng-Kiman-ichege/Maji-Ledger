"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { PaymentAttemptDto } from "@/types/domain";
import { StatusBadge, ChannelBadge } from "@/components/ui/Badges";
import { Receipt, Search, ChevronDown, ChevronUp, DollarSign } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ExpandedRow({ p }: { p: PaymentAttemptDto }) {
  return (
    <tr>
      <td
        colSpan={7}
        style={{
          padding: "0 16px 16px",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            padding: "16px",
            background: "#ffffff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
          }}
        >
          {[
            { label: "Attempt ID", value: p.id.split("-")[0] + "..." },
            { label: "Meter ID", value: p.meterId.split("-")[0] + "..." },
            { label: "Provider Ref", value: p.providerCheckoutId ?? "—" },
            { label: "Completed At", value: p.completedAt ? formatDate(p.completedAt) : "—" },
            { label: "Units Issued", value: p.unitsIssued != null ? `${p.unitsIssued} m³` : "—" },
            {
              label: "STS Token",
              value: p.waterToken ? p.waterToken : "—",
              mono: true,
            },
            ...(p.failureReason ? [{ label: "Failure Reason", value: p.failureReason }] : []),
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: mono ? "#059669" : "#0f172a",
                  fontFamily: mono ? "monospace" : undefined,
                  fontWeight: mono ? 700 : 500,
                  wordBreak: "break-all",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function PaymentsClient() {
  const [payments, setPayments] = useState<PaymentAttemptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<PaymentAttemptDto[]>(`/api/v1/payments?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((data) => mounted && setPayments(data))
      .catch((e) =>
        mounted && setError(e instanceof Error ? e.message : "Failed to load transactions.")
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [page]);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.meterNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerPhone.includes(search) ||
      (p.providerCheckoutId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.waterToken ?? "").includes(search);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalRevenue = payments
    .filter((p) => p.status === "Confirmed")
    .reduce((sum, p) => sum + p.requestedAmount, 0);

  return (
    <div style={{ padding: "32px 36px 80px", maxWidth: 1440, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: "#0f172a",
            marginBottom: 6,
          }}
        >
          Transaction Ledger & STS Tokens
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          Real-time mobile payment gateway settlements and encrypted 20-digit token dispatches.{" "}
          {!loading && payments.length > 0 && (
            <span style={{ color: "#059669", fontWeight: 700, marginLeft: 6 }}>
              Total confirmed revenue: {formatKes(totalRevenue)}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Status filter pills */}
      {!loading && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            ["all", `All (${payments.length})`],
            ["Confirmed", `Confirmed (${statusCounts.Confirmed ?? 0})`],
            ["Initiated", `Initiated (${statusCounts.Initiated ?? 0})`],
            ["Failed", `Failed (${statusCounts.Failed ?? 0})`],
            ["Expired", `Expired (${statusCounts.Expired ?? 0})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${filterStatus === key ? "#0284c7" : "#e2e8f0"}`,
                background: filterStatus === key ? "#f0f9ff" : "#ffffff",
                color: filterStatus === key ? "#0284c7" : "#64748b",
                transition: "all 0.15s",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 440, marginBottom: 20 }}>
        <Search
          size={16}
          color="#94a3b8"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          type="text"
          placeholder="Search by meter number, phone, provider ref, or token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base"
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
          Loading transactions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
          <p style={{ color: "#334155", fontWeight: 700, fontSize: 14, margin: 0 }}>
            {search || filterStatus !== "all"
              ? "No transactions match the current filter."
              : "No payments recorded yet."}
          </p>
        </div>
      ) : (
        <div
          className="glass-card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  {["Meter", "Channel", "Phone", "Amount", "Status", "Initiated At", "Details"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isExp = expandedId === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        style={{
                          borderBottom: isExp ? "none" : "1px solid #f1f5f9",
                          cursor: "pointer",
                          background: isExp ? "#f8fafc" : "transparent",
                        }}
                        onClick={() => setExpandedId(isExp ? null : p.id)}
                        onMouseEnter={(e) => {
                          if (!isExp) (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExp) (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {p.meterNumber}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <ChannelBadge channel={p.channel} />
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {p.customerPhone}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {formatKes(p.requestedAmount)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>
                          {formatDate(p.initiatedAt)}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#0284c7" }}>
                          {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      {isExp && <ExpandedRow p={p} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #f1f5f9",
              fontSize: 12,
              color: "#64748b",
              background: "#f8fafc",
            }}
          >
            Showing {filtered.length} of {payments.length} transaction{payments.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";

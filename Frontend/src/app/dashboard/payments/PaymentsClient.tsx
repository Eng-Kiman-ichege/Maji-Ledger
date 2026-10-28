"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { PaymentAttemptDto, PaymentAttemptStatus } from "@/types/domain";
import { StatusBadge, ChannelBadge } from "@/components/ui/Badges";

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
          background: "rgba(15,23,42,0.5)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            padding: "14px 0",
            borderTop: "1px solid rgba(148,163,184,0.06)",
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
              value: p.waterToken
                ? p.waterToken
                : "—",
              mono: true,
            },
            ...(p.failureReason ? [{ label: "Failure Reason", value: p.failureReason }] : []),
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-text-dim)",
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
                  color: mono ? "var(--color-accent)" : "var(--color-text-primary)",
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
    return () => { mounted = false; };
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
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            marginBottom: 6,
          }}
        >
          Transactions
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
          All payment attempts and STS token records.{" "}
          {!loading && payments.length > 0 && (
            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              Total confirmed revenue: {formatKes(totalRevenue)}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
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
          {(
            [
              ["all", `All (${payments.length})`],
              ["Confirmed", `Confirmed (${statusCounts.Confirmed ?? 0})`],
              ["Initiated", `Initiated (${statusCounts.Initiated ?? 0})`],
              ["Failed", `Failed (${statusCounts.Failed ?? 0})`],
              ["Expired", `Expired (${statusCounts.Expired ?? 0})`],
            ] as [string, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${
                  filterStatus === key
                    ? "rgba(14,165,233,0.4)"
                    : "rgba(148,163,184,0.12)"
                }`,
                background:
                  filterStatus === key
                    ? "rgba(14,165,233,0.12)"
                    : "rgba(30,41,59,0.5)",
                color:
                  filterStatus === key
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by meter number, phone, provider ref, or token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 520,
            padding: "11px 16px",
            borderRadius: 10,
            background: "rgba(30,41,59,0.7)",
            border: "1px solid rgba(148,163,184,0.15)",
            color: "var(--color-text-primary)",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card">
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <div
              style={{
                width: 28,
                height: 28,
                border: "2px solid rgba(14,165,233,0.2)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            Loading transactions...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
            {search || filterStatus !== "all"
              ? "No transactions match the current filters."
              : "No payment records yet."}
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(148,163,184,0.1)",
                    background: "rgba(15,23,42,0.5)",
                  }}
                >
                  {[
                    "",
                    "Meter",
                    "Phone",
                    "Amount",
                    "Channel",
                    "Status",
                    "Initiated",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <>
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid rgba(148,163,184,0.06)",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setExpandedId(expandedId === p.id ? null : p.id)
                      }
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background =
                          "rgba(14,165,233,0.04)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      {/* Expand toggle */}
                      <td style={{ padding: "12px 8px 12px 16px", width: 28 }}>
                        <span
                          style={{
                            display: "inline-block",
                            color: "var(--color-text-dim)",
                            fontSize: 12,
                            transform: expandedId === p.id ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        >
                          ›
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--color-primary)",
                        }}
                      >
                        {p.meterNumber}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>
                        {p.customerPhone}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {formatKes(p.requestedAmount)}
                        {p.unitsIssued != null && (
                          <div style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 600 }}>
                            {p.unitsIssued} m³
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <ChannelBadge channel={p.channel} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--color-text-muted)",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                        }}
                      >
                        {formatDate(p.initiatedAt)}
                      </td>
                    </tr>
                    {expandedId === p.id && <ExpandedRow key={`${p.id}-exp`} p={p} />}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(148,163,184,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--color-text-dim)",
            }}
          >
            <span>
              Showing {filtered.length} of {payments.length} records (page {page})
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid rgba(148,163,184,0.15)",
                  background: "rgba(30,41,59,0.5)",
                  color: page === 1 ? "var(--color-text-dim)" : "var(--color-text-muted)",
                  cursor: page === 1 ? "default" : "pointer",
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={payments.length < PAGE_SIZE}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid rgba(148,163,184,0.15)",
                  background: "rgba(30,41,59,0.5)",
                  color:
                    payments.length < PAGE_SIZE
                      ? "var(--color-text-dim)"
                      : "var(--color-text-muted)",
                  cursor: payments.length < PAGE_SIZE ? "default" : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

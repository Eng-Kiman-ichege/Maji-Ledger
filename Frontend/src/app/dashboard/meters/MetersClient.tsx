"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { MeterDto, MeterStatus } from "@/types/domain";

const STATUS_STYLE: Record<MeterStatus, { color: string; bg: string; border: string }> = {
  Active: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.2)",
  },
  Inactive: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.15)",
  },
  Suspended: {
    color: "#fb923c",
    bg: "rgba(251,146,60,0.1)",
    border: "rgba(251,146,60,0.2)",
  },
  Decommissioned: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.2)",
  },
};

function MeterStatusBadge({ status }: { status: MeterStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Inactive;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

export default function MetersClient() {
  const [meters, setMeters] = useState<MeterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    api
      .get<MeterDto[]>("/api/v1/meters")
      .then((data) => mounted && setMeters(data))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : "Failed to load meters."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = meters.filter((m) => {
    const matchSearch =
      m.meterNumber.toLowerCase().includes(search.toLowerCase()) ||
      (m.currentUnitNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = meters.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});

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
          Water Meters
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
          All registered prepaid water meters across your portfolio.
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
          {[
            { key: "all", label: `All (${meters.length})` },
            { key: "Active", label: `Active (${statusCounts.Active ?? 0})` },
            { key: "Inactive", label: `Inactive (${statusCounts.Inactive ?? 0})` },
            { key: "Suspended", label: `Suspended (${statusCounts.Suspended ?? 0})` },
            { key: "Decommissioned", label: `Decommissioned (${statusCounts.Decommissioned ?? 0})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${
                  filterStatus === f.key
                    ? "rgba(14,165,233,0.4)"
                    : "rgba(148,163,184,0.12)"
                }`,
                background:
                  filterStatus === f.key
                    ? "rgba(14,165,233,0.12)"
                    : "rgba(30,41,59,0.5)",
                color:
                  filterStatus === f.key
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by meter number, serial, or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 480,
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
        <div className="glass-card" style={{ overflow: "hidden" }}>
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
            Loading meters...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💧</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
            {search || filterStatus !== "all"
              ? "No meters match the current filters."
              : "No meters registered yet."}
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
                    "Meter Number",
                    "Serial",
                    "Type",
                    "Status",
                    "Assigned Unit",
                    "QR Code",
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
                {filtered.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom:
                        idx < filtered.length - 1
                          ? "1px solid rgba(148,163,184,0.06)"
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(14,165,233,0.04)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--color-primary)",
                      }}
                    >
                      {m.maskedIdentifier}
                      <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--color-text-dim)", marginTop: 1 }}>
                        {m.meterNumber}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                      {m.serialNumber ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>
                      {m.type}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <MeterStatusBadge status={m.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>
                      {m.currentUnitNumber ?? (
                        <span style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {m.hasActiveQrCode ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            color: "var(--color-accent)",
                            fontWeight: 600,
                          }}
                        >
                          ✓ Active
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-dim)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(148,163,184,0.08)",
              fontSize: 12,
              color: "var(--color-text-dim)",
            }}
          >
            Showing {filtered.length} of {meters.length} meter{meters.length !== 1 ? "s" : ""}
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

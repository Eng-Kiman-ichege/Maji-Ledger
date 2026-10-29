"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { MeterDto, MeterStatus } from "@/types/domain";
import { Gauge, Search, CheckCircle2 } from "lucide-react";

const STATUS_STYLE: Record<MeterStatus, { color: string; bg: string; border: string }> = {
  Active: {
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  Inactive: {
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  },
  Suspended: {
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  Decommissioned: {
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
  },
};

function MeterStatusBadge({ status }: { status: MeterStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Inactive;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
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
  const { isAdmin, isOwner } = useAuth();
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
    return () => {
      mounted = false;
    };
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

  const columns = isAdmin
    ? ["Meter Number", "Serial", "Type", "Status", "Assigned Unit", "QR Code"]
    : ["Meter Number", "Serial", "Type", "Status", "Assigned Unit"];

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
          {isOwner ? "My Water Meters Telemetry" : "Smart Water Meters"}
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          {isOwner
            ? "Status and telemetry for prepaid water meters installed in your properties."
            : "Hardware telemetry, STS prepaid association, and QR scan-to-pay provisioning."}
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
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${filterStatus === f.key ? "#0284c7" : "#e2e8f0"}`,
                background: filterStatus === f.key ? "#f0f9ff" : "#ffffff",
                color: filterStatus === f.key ? "#0284c7" : "#64748b",
                transition: "all 0.15s",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {f.label}
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
          placeholder="Search by meter number, serial, or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base"
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
          Loading meters telemetry...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💧</div>
          <p style={{ color: "#334155", fontWeight: 700, fontSize: 14, margin: 0 }}>
            {search || filterStatus !== "all"
              ? "No meters match the current filters."
              : "No meters registered yet."}
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
                  {columns.map((h) => (
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
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f8fafc")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0284c7",
                      }}
                    >
                      {m.maskedIdentifier}
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", marginTop: 2 }}>
                        {m.meterNumber}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>
                      {m.serialNumber ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 500 }}>
                      {m.type}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <MeterStatusBadge status={m.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      {m.currentUnitNumber ? (
                        <span style={{ fontWeight: 600 }}>Unit {m.currentUnitNumber}</span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "12px 16px" }}>
                        {m.hasActiveQrCode ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 12,
                              color: "#059669",
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2 size={13} />
                            Active
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
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
            Showing {filtered.length} of {meters.length} meter{meters.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

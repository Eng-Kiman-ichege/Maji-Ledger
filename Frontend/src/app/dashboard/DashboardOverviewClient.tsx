"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { PropertyDto, MeterDto, PaymentAttemptDto } from "@/types/domain";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge, ChannelBadge } from "@/components/ui/Badges";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardOverviewClient() {
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [meters, setMeters] = useState<MeterDto[]>([]);
  const [payments, setPayments] = useState<PaymentAttemptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [p, m, tx] = await Promise.all([
          api.get<PropertyDto[]>("/api/v1/properties"),
          api.get<MeterDto[]>("/api/v1/meters"),
          api.get<PaymentAttemptDto[]>("/api/v1/payments?pageSize=10"),
        ]);
        if (!mounted) return;
        setProperties(p);
        setMeters(m);
        setPayments(tx);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Derived stats
  const activeMeters = meters.filter((m) => m.status === "Active").length;
  const confirmedPayments = payments.filter((p) => p.status === "Confirmed");
  const totalRevenue = confirmedPayments.reduce((sum, p) => sum + p.requestedAmount, 0);
  const metersWithQr = meters.filter((m) => m.hasActiveQrCode).length;

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Page header */}
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
          Dashboard Overview
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
          Live portfolio snapshot — properties, meters, and recent transactions.
        </p>
      </div>

      {/* Error banner */}
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
          ⚠️ {error} — Make sure the backend is running on port 5000.
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: "20px 22px",
                height: 100,
                background: "rgba(30,41,59,0.4)",
                animation: "pulse-skeleton 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <StatCard
            icon="🏘️"
            label="Properties"
            value={properties.length}
            sub={`${properties.filter((p) => p.isActive).length} active`}
            accent
          />
          <StatCard
            icon="💧"
            label="Meters"
            value={meters.length}
            sub={`${activeMeters} active · ${metersWithQr} with QR`}
          />
          <StatCard
            icon="📲"
            label="QR Codes"
            value={metersWithQr}
            sub="Meters with active QR sticker"
          />
          <StatCard
            icon="💳"
            label="Revenue (shown)"
            value={totalRevenue > 0 ? formatKes(totalRevenue) : "—"}
            sub={`${confirmedPayments.length} confirmed of last 10`}
          />
        </div>
      )}

      {/* Recent transactions table */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Recent Transactions
          </h2>
          <Link
            href="/dashboard/payments"
            style={{
              fontSize: 13,
              color: "var(--color-primary)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View all →
          </Link>
        </div>

        <div className="glass-card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
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
          ) : payments.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
                No payment records yet. Transactions will appear here after a QR scan or paybill payment.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(148,163,184,0.1)",
                      background: "rgba(15,23,42,0.5)",
                    }}
                  >
                    {["Meter", "Phone", "Amount", "Channel", "Status", "Date"].map((h) => (
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
                  {payments.map((p, idx) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom:
                          idx < payments.length - 1
                            ? "1px solid rgba(148,163,184,0.06)"
                            : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background =
                          "rgba(14,165,233,0.04)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>
                        {p.meterNumber}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>
                        {p.customerPhone}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {formatKes(p.requestedAmount)}
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
                        }}
                      >
                        {formatDate(p.initiatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Properties quick view */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Properties
          </h2>
          <Link
            href="/dashboard/properties"
            style={{
              fontSize: 13,
              color: "var(--color-primary)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Manage →
          </Link>
        </div>

        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ height: 80, opacity: 0.5 }}
              />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: "32px", textAlign: "center" }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏘️</div>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13, margin: 0 }}>
              No properties found. Use the API or admin panel to register your first property.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {properties.slice(0, 6).map((prop) => (
              <Link
                key={prop.id}
                href={`/dashboard/properties/${prop.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="glass-card"
                  style={{
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(14,165,233,0.3)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(148,163,184,0.1)";
                    (e.currentTarget as HTMLElement).style.transform = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {prop.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: prop.isActive
                          ? "rgba(74,222,128,0.1)"
                          : "rgba(148,163,184,0.08)",
                        color: prop.isActive ? "#4ade80" : "var(--color-text-dim)",
                        border: `1px solid ${prop.isActive ? "rgba(74,222,128,0.2)" : "rgba(148,163,184,0.12)"}`,
                      }}
                    >
                      {prop.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {prop.type} · {prop.town ?? prop.county ?? "Kenya"} ·{" "}
                    {prop.buildingCount} building{prop.buildingCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-skeleton {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

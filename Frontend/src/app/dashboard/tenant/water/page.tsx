"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { TenantPortalDashboardDto } from "@/types/domain";
import { Droplets, Copy, Check, QrCode, Zap, ExternalLink } from "lucide-react";

export default function TenantWaterPage() {
  const [data, setData] = useState<TenantPortalDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    api.get<TenantPortalDashboardDto>("/api/v1/tenant-portal/dashboard")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading water meters & tokens...</div>;
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            Prepaid Water & STS Tokens
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Track your prepaid meter, generate STS recharge tokens, and monitor water purchases.
          </p>
        </div>
        <Link
          href="/pay/demo-token"
          target="_blank"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            background: "#0284c7",
            color: "#ffffff",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Zap size={16} /> Purchase Water via Mobile <ExternalLink size={14} />
        </Link>
      </div>

      {/* Meter Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)",
          borderRadius: 14,
          padding: 24,
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#7dd3fc", textTransform: "uppercase" }}>
            Assigned Prepaid Water Meter
          </span>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, letterSpacing: "0.04em" }}>
            {data.waterMeterNumber ?? "No Meter Assigned"}
          </div>
          <div style={{ fontSize: 13, color: "#bae6fd", marginTop: 4 }}>
            Standard STS Compliant Prepaid Meter • Unit {data.unitNumber ?? "N/A"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#93c5fd" }}>Purchased to Date</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
            {data.recentWaterPurchases.reduce((acc, wp) => acc + wp.unitsPurchased, 0).toFixed(2)} m³
          </div>
        </div>
      </div>

      {/* Token History */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            STS 20-Digit Recharge Token History
          </h3>
        </div>

        {data.recentWaterPurchases.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            No water token purchases found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.recentWaterPurchases.map((wp, i) => (
              <div
                key={wp.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: i < data.recentWaterPurchases.length - 1 ? "1px solid #f1f5f9" : "none",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                      {wp.unitsPurchased.toFixed(2)} m³ ({wp.unitsPurchased * 1000} Litres)
                    </span>
                    <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, color: "#64748b" }}>
                      {wp.reference}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {new Date(wp.date).toLocaleString()} • KES {wp.amount.toLocaleString()}
                  </div>
                </div>

                {wp.tokenValue ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        background: "#f0f9ff",
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #bae6fd",
                        fontFamily: "monospace",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "#0369a1",
                      }}
                    >
                      {wp.tokenValue}
                    </div>
                    <button
                      onClick={() => copyToClipboard(wp.tokenValue!)}
                      style={{
                        background: copiedToken === wp.tokenValue ? "#10b981" : "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {copiedToken === wp.tokenValue ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy Token
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Token pending issuance</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

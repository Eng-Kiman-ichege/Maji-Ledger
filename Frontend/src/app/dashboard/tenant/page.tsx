"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { TenantPortalDashboardDto } from "@/types/domain";
import {
  Home,
  CreditCard,
  Droplets,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ChevronRight,
  Receipt,
  Smartphone,
} from "lucide-react";

export default function TenantDashboardPage() {
  const [data, setData] = useState<TenantPortalDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<TenantPortalDashboardDto>("/api/v1/tenant-portal/dashboard");
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tenant dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
        <p style={{ margin: 0, fontWeight: 500 }}>Loading tenant resident dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          padding: 24,
          borderRadius: 12,
          color: "#991b1b",
          maxWidth: 600,
          margin: "40px auto",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <AlertCircle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Unable to Load Resident Hub</h3>
            <p style={{ margin: "4px 0 0", fontSize: 14 }}>
              {error || "No resident profile found for your account. Please contact property management."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isArrears = data.outstandingBalance > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          borderRadius: 16,
          padding: "24px 28px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#bae6fd",
            }}
          >
            Welcome Back
          </span>
          <h2 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800 }}>{data.fullName}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#e0f2fe" }}>
            {data.propertyName ?? "Assigned Property"} — {data.buildingName ? `${data.buildingName}, ` : ""}Unit {data.unitNumber ?? "N/A"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowPayModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "#ffffff",
              color: "#0369a1",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <Smartphone size={16} />
            Pay Rent (M-Pesa)
          </button>
          <Link
            href="/dashboard/tenant/maintenance"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <Wrench size={16} />
            Request Repair
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {/* Outstanding Rent */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: isArrears ? "1px solid #fecaca" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Outstanding Rent</span>
            <CreditCard size={18} color={isArrears ? "#ef4444" : "#10b981"} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: isArrears ? "#dc2626" : "#059669" }}>
            KES {data.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            Monthly: KES {data.monthlyRent.toLocaleString()} (Due {data.rentDueDay}th)
          </div>
        </div>

        {/* Total Rent Paid */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Total Rent Paid</span>
            <CheckCircle2 size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            KES {data.totalRentPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            All-time confirmed payments
          </div>
        </div>

        {/* Tenancy & Unit Details */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Lease &amp; Apartment</span>
            <Home size={18} color="#4f46e5" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            Unit {data.unitNumber ?? "Assigned Unit"}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            {data.propertyName ?? "Portfolio Estate"}
          </div>
        </div>

        {/* Maintenance */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Open Maintenance</span>
            <Wrench size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            {data.openMaintenanceCount}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            Active tickets in progress
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Rent & Tenancy Support */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 24 }}>
        {/* Recent Rent Payments */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 22,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Recent Rent Payments
            </h3>
            <Link
              href="/dashboard/tenant/rent"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
              }}
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {data.recentPayments.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              No rent payments recorded yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.recentPayments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                      {p.reference}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date(p.paidAt).toLocaleDateString()} • {p.method}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#059669" }}>
                      +KES {p.amount.toLocaleString()}
                    </div>
                    {p.receiptNumber && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Rcpt: {p.receiptNumber}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tenancy Terms & Support Summary */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 22,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Tenancy Terms &amp; Guidelines
              </h3>
              <Link
                href="/dashboard/tenant/tenancy"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  textDecoration: "none",
                }}
              >
                View Lease <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Tenancy Reference</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {data.tenancyReference ?? "TEN-ACTIVE"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Monthly Rent Due</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  Every {data.rentDueDay}th of the month
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Open Repairs</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: data.openMaintenanceCount > 0 ? "#f59e0b" : "#059669" }}>
                  {data.openMaintenanceCount} active tickets
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <Link
              href="/dashboard/tenant/maintenance"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 14px",
                background: "#f1f5f9",
                color: "#334155",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Log Repair Request
            </Link>
            <button
              onClick={() => setShowPayModal(true)}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "#4f46e5",
                color: "#ffffff",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Pay Rent
            </button>
          </div>
        </div>
      </div>

      {/* Pay Rent Modal */}
      {showPayModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                Pay Rent via M-Pesa Paybill
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, color: "#166534", marginBottom: 6 }}>
                <strong>Business Number (Paybill):</strong> 400200
              </div>
              <div style={{ fontSize: 13, color: "#166534", marginBottom: 6 }}>
                <strong>Account Number:</strong> {data.tenancyReference ?? data.unitNumber ?? "RENT"}
              </div>
              <div style={{ fontSize: 13, color: "#166534" }}>
                <strong>Current Due:</strong> KES {data.outstandingBalance.toLocaleString()}
              </div>
            </div>

            <ol style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Open Safaricom M-Pesa on your mobile device.</li>
              <li>Select <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong>.</li>
              <li>Enter Business Number <strong>400200</strong>.</li>
              <li>
                Enter Account Number <strong>{data.tenancyReference ?? data.unitNumber ?? "RENT"}</strong>.
              </li>
              <li>Enter your rent amount and your M-Pesa PIN.</li>
              <li>The payment will automatically reconcile with your rent ledger account.</li>
            </ol>

            <button
              onClick={() => setShowPayModal(false)}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "10px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

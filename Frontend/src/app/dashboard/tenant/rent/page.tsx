"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { TenantPortalDashboardDto } from "@/types/domain";
import { CreditCard, Download, Smartphone, CheckCircle, Clock } from "lucide-react";

export default function TenantRentPage() {
  const [data, setData] = useState<TenantPortalDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<TenantPortalDashboardDto>("/api/v1/tenant-portal/dashboard")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading rent ledger...</div>;
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          Rent Account & Payment History
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Complete record of rent charges, payments received, and current financial standing.
        </p>
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Monthly Agreed Rent</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            KES {data.monthlyRent.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Due by the {data.rentDueDay}th monthly</div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Total Payments Recorded</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            KES {data.totalRentPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Confirmed ledger receipts</div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Outstanding Balance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: data.outstandingBalance > 0 ? "#dc2626" : "#059669", marginTop: 4 }}>
            KES {data.outstandingBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {data.outstandingBalance > 0 ? "Arrears due immediately" : "Account in good standing"}
          </div>
        </div>
      </div>

      {/* Paybill Instructions Box */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
          <Smartphone size={18} color="#0284c7" /> How to Pay via M-Pesa Paybill
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>
          All rent payments should be made using the automated Paybill. Your account will update within seconds of payment.
        </p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
          <div><strong>Business Number:</strong> <span style={{ color: "#0284c7", fontWeight: 700 }}>400200</span></div>
          <div><strong>Account Number:</strong> <span style={{ color: "#0284c7", fontWeight: 700 }}>{data.tenancyReference ?? data.unitNumber ?? "RENT"}</span></div>
        </div>
      </div>

      {/* Payment History Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Confirmed Payment History</h3>
        </div>
        {data.recentPayments.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No payment records found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "10px 16px" }}>Payment Ref</th>
                <th style={{ padding: "10px 16px" }}>Receipt #</th>
                <th style={{ padding: "10px 16px" }}>Date</th>
                <th style={{ padding: "10px 16px" }}>Method</th>
                <th style={{ padding: "10px 16px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{p.reference}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.receiptNumber ?? "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.method}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#059669" }}>
                    KES {p.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

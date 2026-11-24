"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, WaterTransactionDto } from "@/types/domain";
import { Droplets, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordWaterPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [transactions, setTransactions] = useState<WaterTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        const url = selectedPropertyId
          ? `/api/v1/water/transactions?propertyId=${selectedPropertyId}`
          : "/api/v1/water/transactions";
        const res = await api.get<WaterTransactionDto[]>(url);
        setTransactions(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPropertyId]);

  const filtered = transactions.filter((tx) => {
    const s = search.toLowerCase();
    return (
      (tx.transactionReference && tx.transactionReference.toLowerCase().includes(s)) ||
      (tx.meterNumber && tx.meterNumber.toLowerCase().includes(s)) ||
      (tx.unitNumber && tx.unitNumber.toLowerCase().includes(s)) ||
      (tx.phoneNumber && tx.phoneNumber.includes(s))
    );
  });

  const totalVendedAmount = filtered.reduce((acc, tx) => acc + tx.amount, 0);
  const totalUnits = filtered.reduce((acc, tx) => acc + tx.unitsPurchased, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Prepaid Water Revenue</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Monitor real-time token vending transactions, meter consumption, and M-Pesa collections.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              background: "#ffffff",
              color: "#0f172a",
              outline: "none",
            }}
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div style={{ position: "relative", minWidth: 220 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search ref, meter, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total Vended Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
            {formatKes(totalVendedAmount)}
          </div>
        </div>
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total Volume Vended</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {totalUnits.toFixed(1)} m³
          </div>
        </div>
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Transactions Count</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {filtered.length} Orders
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Droplets size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Water Transactions Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No water purchases found for the selected filter.</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Date & Ref</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Meter / Unit</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Units Vended</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Amount Paid</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Token Issued</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{tx.transactionReference}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#0284c7" }}>{tx.meterNumber}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {tx.propertyName} • Unit {tx.unitNumber}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                    {tx.unitsPurchased.toFixed(1)} m³
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#16a34a" }}>
                    {formatKes(tx.amount)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {tx.tokenValue ? (
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a", background: "#f1f5f9", padding: "4px 8px", borderRadius: 4 }}>
                        {tx.tokenValue}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: tx.paymentStatus === "Confirmed" ? "#f0fdf4" : "#fef3c7",
                        color: tx.paymentStatus === "Confirmed" ? "#16a34a" : "#d97706",
                      }}
                    >
                      {tx.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { LandlordPortalPropertyDto, RentChargeDto } from "@/types/domain";
import { CreditCard, Search, CheckCircle2, AlertCircle, Clock, DollarSign } from "lucide-react";

function formatKes(n: number) {
  return `KES ${(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LandlordRentPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertyDto[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [charges, setCharges] = useState<RentChargeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const props = await api.get<LandlordPortalPropertyDto[]>("/api/v1/landlord-portal/properties");
        setProperties(props);

        const url = selectedPropertyId
          ? `/api/v1/rent/charges?propertyId=${selectedPropertyId}`
          : "/api/v1/rent/charges";
        const res = await api.get<RentChargeDto[]>(url);
        setCharges(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPropertyId]);

  const filtered = charges.filter((c) => {
    const s = search.toLowerCase();
    const matchesSearch =
      (c.tenantName && c.tenantName.toLowerCase().includes(s)) ||
      (c.unitNumber && c.unitNumber.toLowerCase().includes(s)) ||
      (c.chargeReference && c.chargeReference.toLowerCase().includes(s)) ||
      (c.billingPeriod && c.billingPeriod.toLowerCase().includes(s));

    const matchesStatus = statusFilter === "all" ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = filtered.reduce((acc, c) => acc + c.amount, 0);
  const totalPaid = filtered.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalOutstanding = filtered.reduce((acc, c) => acc + c.outstandingAmount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Rent Collections & Charges</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Monthly rent billing statements, collection records, and outstanding arrears.
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="PartiallyPaid">Partially Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>

          <div style={{ position: "relative", minWidth: 200 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search tenant or unit..."
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
          <div style={{ fontSize: 12, color: "#64748b" }}>Total Billed</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{formatKes(totalBilled)}</div>
        </div>
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total Collected</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>{formatKes(totalPaid)}</div>
        </div>
        <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Outstanding Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalOutstanding > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
            {formatKes(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Charges Table */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading charges...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <CreditCard size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No Rent Charges Found</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>No rent records match your current filter.</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Period / Ref</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tenant & Unit</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Due Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Billed Amount</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Paid</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Outstanding</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{c.billingPeriod}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{c.chargeReference}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{c.tenantName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Unit {c.unitNumber} • {c.propertyName}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    {new Date(c.dueDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                    {formatKes(c.amount)}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#16a34a" }}>
                    {formatKes(c.amountPaid)}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: c.outstandingAmount > 0 ? "#dc2626" : "#16a34a" }}>
                    {formatKes(c.outstandingAmount)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          c.status === "Paid"
                            ? "#f0fdf4"
                            : c.status === "Overdue"
                            ? "#fef2f2"
                            : "#fef3c7",
                        color:
                          c.status === "Paid"
                            ? "#16a34a"
                            : c.status === "Overdue"
                            ? "#dc2626"
                            : "#d97706",
                      }}
                    >
                      {c.status}
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

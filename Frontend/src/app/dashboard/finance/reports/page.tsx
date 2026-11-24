"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ConsolidatedFinancialReportDto } from "@/types/domain";
import { DollarSign, Download, Filter, TrendingUp, TrendingDown, CreditCard, Droplets, Wrench } from "lucide-react";

export default function ConsolidatedReportsPage() {
  const [report, setReport] = useState<ConsolidatedFinancialReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (from) params.append("from", new Date(from).toISOString());
      if (to) params.append("to", new Date(to).toISOString());

      const res = await api.get<ConsolidatedFinancialReportDto>(`/api/v1/finance/reconciliation/consolidated-report?${params.toString()}`);
      setReport(res);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Amount (KES)"],
      ["Total Rent Billed", report.totalRentBilled.toString()],
      ["Total Rent Collected", report.totalRentCollected.toString()],
      ["Total Rent Outstanding", report.totalRentOutstanding.toString()],
      ["Total Maintenance Expense", report.totalMaintenanceExpense.toString()],
      ["Net Rental Operating Income", (report.totalRentCollected - report.totalMaintenanceExpense).toString()],
      ["Confirmed Payments Count", report.totalConfirmedPayments.toString()],
      ["Failed Payments Count", report.totalFailedPayments.toString()],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `property_financial_report_${from}_to_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
            Executive Financials
          </span>
          <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Property Financial Statement
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Total Rent Collections minus Property Maintenance Deductions to compute Net Rental Operating Income (NOI).
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!report}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#059669", color: "#ffffff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Download size={15} /> Export CSV Statement
        </button>
      </div>

      {/* Date Filter Bar */}
      <div style={{ background: "#ffffff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Period From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Period To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
          />
        </div>
        <button
          onClick={fetchReport}
          style={{ marginTop: 18, padding: "8px 16px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Update Report
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Generating consolidated financials...</div>
      ) : !report ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No financial activity during this period.</div>
      ) : (
        <>
          {/* NOI Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              borderRadius: 14,
              padding: "24px 28px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#a7f3d0", textTransform: "uppercase" }}>
                Net Rental Operating Income (NOI)
              </span>
              <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4 }}>
                KES {(report.totalRentCollected - report.totalMaintenanceExpense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 13, color: "#d1fae5", marginTop: 4 }}>
                Formula: Rent Collected - Maintenance Expenses
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#a7f3d0" }}>Transaction Volume</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>
                {report.totalConfirmedPayments} Confirmed • {report.totalFailedPayments} Failed
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Rent Collected</span>
                <CreditCard size={18} color="#059669" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                KES {report.totalRentCollected.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Billed: KES {report.totalRentBilled.toLocaleString()} • Outstanding: KES {report.totalRentOutstanding.toLocaleString()}
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Outstanding Arrears</span>
                <TrendingDown size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
                KES {report.totalRentOutstanding.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Total overdue rental receivables
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                <span>Maintenance Expense</span>
                <Wrench size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
                KES {report.totalMaintenanceExpense.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Direct property repairs & supplier costs
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

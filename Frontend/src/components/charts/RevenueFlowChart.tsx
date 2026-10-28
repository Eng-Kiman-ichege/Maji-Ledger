"use client";

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface RevenueFlowChartProps {
  grossCollections: number;
  smsDeliveredCount?: number;
  confirmedCount?: number;
}

export default function RevenueFlowChart({
  grossCollections,
  smsDeliveredCount = 0,
  confirmedCount = 0,
}: RevenueFlowChartProps) {
  // Financial economics:
  // Gross: 100% of confirmed collections
  // Platform fee: 5% of gross collections
  // SMS delivery expense: KES 0.80 per SMS sent
  // Payment Gateway / Escrow provider processing fee: ~1.2%
  // Owner Net Payout Pool: Remaining balance to property owners
  const gross = Math.max(grossCollections, 0);

  const platformFee = Math.round(gross * 0.05 * 100) / 100; // 5%
  const smsExpenses = Math.round(smsDeliveredCount * 0.8 * 100) / 100;
  const paymentGatewayFee = Math.round(gross * 0.012 * 100) / 100;
  const totalDeductions = Math.round((platformFee + smsExpenses + paymentGatewayFee) * 100) / 100;
  const ownerPayoutPool = Math.max(0, Math.round((gross - totalDeductions) * 100) / 100);
  const majiLedgerNetProfit = Math.max(0, Math.round((platformFee - smsExpenses * 0.5) * 100) / 100);

  const ownerPercent = gross > 0 ? ((ownerPayoutPool / gross) * 100).toFixed(1) : "93.8";
  const platformPercent = gross > 0 ? ((platformFee / gross) * 100).toFixed(1) : "5.0";
  const gatewayPercent = gross > 0 ? ((paymentGatewayFee / gross) * 100).toFixed(1) : "1.2";

  return (
    <div
      className="glass-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "24px",
        position: "relative",
        boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#059669",
              }}
            />
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Revenue Settlement & Platform Deductions
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
            Automated waterfall: Gross collections minus platform deductions and owner disbursements
          </p>
        </div>

        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            padding: "6px 14px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#047857" }}>Platform Margin:</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#059669",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {formatKes(majiLedgerNetProfit)}
          </span>
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            height: 18,
            borderRadius: 9999,
            background: "#f1f5f9",
            overflow: "hidden",
            display: "flex",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Owner Payout */}
          <div
            style={{
              width: `${ownerPercent}%`,
              background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
              transition: "width 0.6s ease",
            }}
            title={`Owner Payouts: ${ownerPercent}%`}
          />
          {/* Maji Ledger Platform Fee */}
          <div
            style={{
              width: `${platformPercent}%`,
              background: "linear-gradient(90deg, #059669 0%, #34d399 100%)",
              transition: "width 0.6s ease",
            }}
            title={`Maji Ledger Platform Fee: ${platformPercent}%`}
          />
          {/* Gateway & SMS */}
          <div
            style={{
              width: `${gatewayPercent}%`,
              background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
              transition: "width 0.6s ease",
            }}
            title={`Gateway & SMS Expenses: ${gatewayPercent}%`}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 12,
            color: "#64748b",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284c7" }} />
            Property Owner Payouts ({ownerPercent}%)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
            Maji Ledger Fee ({platformPercent}%)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
            Gateway & SMS Costs ({gatewayPercent}%)
          </span>
        </div>
      </div>

      {/* Breakdown 4-Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* Gross */}
        <div
          style={{
            padding: "14px 16px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Total Collections
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#0f172a",
              marginTop: 4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {formatKes(gross)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            From {confirmedCount.toLocaleString()} confirmed payments
          </div>
        </div>

        {/* Owner Net Payout */}
        <div
          style={{
            padding: "14px 16px",
            background: "#f0f9ff",
            borderRadius: 10,
            border: "1px solid #bae6fd",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textTransform: "uppercase" }}>
            Owner Payouts (Payable)
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#0284c7",
              marginTop: 4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {formatKes(ownerPayoutPool)}
          </div>
          <div style={{ fontSize: 11, color: "#0284c7", marginTop: 4 }}>
            Net disbursed to landlords
          </div>
        </div>

        {/* Deductions (SMS & Gateway) */}
        <div
          style={{
            padding: "14px 16px",
            background: "#fffbeb",
            borderRadius: 10,
            border: "1px solid #fde68a",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
            Direct Deductions
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#d97706",
              marginTop: 4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {formatKes(smsExpenses + paymentGatewayFee)}
          </div>
          <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>
            SMS ({smsDeliveredCount} sent) + Gateway
          </div>
        </div>

        {/* Maji Ledger Platform Margin */}
        <div
          style={{
            padding: "14px 16px",
            background: "#ecfdf5",
            borderRadius: 10,
            border: "1px solid #a7f3d0",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
            Maji Ledger Net Profit
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#059669",
              marginTop: 4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {formatKes(majiLedgerNetProfit)}
          </div>
          <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>
            Retained system revenue
          </div>
        </div>
      </div>
    </div>
  );
}

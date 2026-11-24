"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterDashboardDto } from "@/types/domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Droplets,
  Building2,
  Gauge,
  TrendingUp,
  CreditCard,
  QrCode,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  RefreshCw,
  CheckCircle2,
  Zap,
  BarChart2,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function formatKesFull(n: number) {
  return `KES ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Minimal SVG bar chart – sky blue theme */
function WaterBarChart({ values, color = "#0284c7" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const w = 180; const h = 52; const gap = 4;
  const bw = (w - gap * (values.length - 1)) / values.length;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id="waterBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 4));
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={3}
            fill={i === values.length - 1 ? color : "url(#waterBarGrad)"}
            opacity={i === values.length - 1 ? 1 : 0.4 + (i / values.length) * 0.5}
          />
        );
      })}
    </svg>
  );
}

/** Donut chart */
function DonutChart({ pct, color, size = 76 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e0f2fe" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
    </svg>
  );
}

export default function WaterDashboardPage() {
  const router = useRouter();
  const { setActiveSuite } = useAuth();
  const [data, setData] = useState<WaterDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get<WaterDashboardDto>("/api/v1/water/dashboard");
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load water dashboard");
    } finally {
      setLoading(false);
    }
  };

  const totalMeters = (data?.activeMeters || 0) + (data?.inactiveMeters || 0);
  const meterHealthPct = totalMeters > 0 ? Math.round(((data?.activeMeters || 0) / totalMeters) * 100) : 0;
  const base = data?.totalRevenue || 0;
  const trendVals = [0.5, 0.65, 0.73, 0.82, 0.91, 1.0].map(m => Math.round(base * m));

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16 }}>
        <div style={{ width:52, height:52, borderRadius:"50%", border:"4px solid #e0f2fe", borderTopColor:"#0284c7", animation:"spin 0.8s linear infinite" }} />
        <p style={{ color:"#0284c7", fontWeight:700, fontSize:15 }}>Loading Maji Ledger…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:12 }}>
        <AlertTriangle size={40} color="#ef4444" />
        <p style={{ color:"#64748b", margin:0 }}>{error}</p>
        <button onClick={loadDashboard} style={{ padding:"10px 20px", background:"#0284c7", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding:"28px 32px", maxWidth:1440, margin:"0 auto" }}>

      {/* ── HERO BANNER – Sky Blue ── */}
      <div style={{
        background:"linear-gradient(135deg, #0c4a6e 0%, #075985 35%, #0284c7 70%, #0ea5e9 100%)",
        borderRadius:20, padding:"32px 36px", marginBottom:28,
        position:"relative", overflow:"hidden", color:"#fff",
      }}>
        <div style={{ position:"absolute", right:-80, top:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:60, bottom:-60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", left:"45%", top:-30, width:140, height:140, borderRadius:"50%", background:"rgba(14,165,233,0.2)", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, position:"relative" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"6px 12px", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                💧 Maji Ledger Suite
              </div>
              <div style={{ background:"rgba(14,165,233,0.5)", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:800, border:"1px solid rgba(255,255,255,0.2)" }}>
                Active Workspace
              </div>
            </div>
            <h1 style={{ fontSize:"clamp(22px, 3vw, 32px)", fontWeight:900, margin:"0 0 6px", letterSpacing:"-0.5px" }}>
              Prepaid Water Ledger & Monitoring
            </h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)", margin:0 }}>
              Real-time revenue, STS token vending, meter telemetry & M-Pesa reconciliation
            </p>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={loadDashboard} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={() => { setActiveSuite("property"); router.push("/dashboard"); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              🏢 Property Suite →
            </button>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display:"flex", gap:16, marginTop:24, flexWrap:"wrap", position:"relative" }}>
          {[
            { label:"Total Revenue", value: formatKes(data?.totalRevenue || 0), icon:"💰" },
            { label:"Units Purchased", value: `${Number(data?.totalUnitsSold || 0).toFixed(0)} m³`, icon:"📦" },
            { label:"Active Meters", value: data?.activeMeters || 0, icon:"⚡" },
            { label:"Failed Transactions", value: data?.failedTransactions || 0, icon:"⚠️" },
            { label:"Pending Tokens", value: data?.pendingTokenGeneration || 0, icon:"🔑" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 16px", display:"flex", flexDirection:"column", gap:2, minWidth:120 }}>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"rgba(255,255,255,0.6)" }}>{s.icon} {s.label}</span>
              <span style={{ fontSize:22, fontWeight:900, lineHeight:1.2 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:20, marginBottom:28 }}>

        {/* Water Revenue */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#0284c7", textTransform:"uppercase", letterSpacing:"0.07em" }}>Total Water Revenue</div>
              <div style={{ fontSize:32, fontWeight:900, color:"#0f172a", lineHeight:1.1, marginTop:4 }}>
                {formatKes(data?.totalRevenue || 0)}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                {Number(data?.totalUnitsSold || 0).toFixed(2)} m³ purchased
              </div>
            </div>
            <div style={{ background:"linear-gradient(135deg, #e0f2fe, #bae6fd)", borderRadius:12, padding:"10px 12px", border:"1px solid #7dd3fc" }}>
              <Droplets size={22} color="#0284c7" />
            </div>
          </div>
          <WaterBarChart values={trendVals} color="#0284c7" />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"#94a3b8" }}>
            <span>6 months ago</span><span>This month</span>
          </div>
          <Link href="/dashboard/water/transactions" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#0284c7", textDecoration:"none", marginTop:10 }}>
            All Transactions <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Meter Health */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", textTransform:"uppercase", letterSpacing:"0.07em" }}>Meter Health</div>
              <div style={{ fontSize:32, fontWeight:900, color:"#0f172a", lineHeight:1.1, marginTop:4 }}>
                {data?.activeMeters || 0}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>active of {totalMeters} total meters</div>
            </div>
            <div style={{ position:"relative", width:76, height:76 }}>
              <DonutChart pct={meterHealthPct} color="#0284c7" size={76} />
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#0284c7" }}>
                {meterHealthPct}%
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { label:"Active", value: data?.activeMeters || 0, color:"#059669", bg:"#f0fdf4" },
              { label:"Inactive", value: data?.inactiveMeters || 0, color:"#64748b", bg:"#f8fafc" },
              { label:"Faulty", value: data?.faultyMeters || 0, color:"#dc2626", bg:"#fff1f2" },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/water/meters" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#0284c7", textDecoration:"none", marginTop:12 }}>
            Meters Registry <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Transaction Status */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, border:`1px solid ${(data?.failedTransactions || 0) > 0 ? "#fecaca" : "#e2e8f0"}`, boxShadow:"0 2px 12px -4px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:(data?.failedTransactions || 0) > 0 ? "#dc2626" : "#059669", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Transaction Health
              </div>
              <div style={{ fontSize:32, fontWeight:900, color:(data?.failedTransactions || 0) > 0 ? "#dc2626" : "#0f172a", lineHeight:1.1, marginTop:4 }}>
                {data?.failedTransactions || 0}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                {(data?.failedTransactions || 0) > 0 ? "failed transactions need attention" : "No failed transactions"}
              </div>
            </div>
            <div style={{ background:(data?.failedTransactions || 0) > 0 ? "linear-gradient(135deg,#fff1f2,#ffe4e6)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius:12, padding:"10px 12px", border:`1px solid ${(data?.failedTransactions || 0) > 0 ? "#fecaca" : "#bbf7d0"}` }}>
              {(data?.failedTransactions || 0) > 0 ? <AlertTriangle size={22} color="#dc2626" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { label:"Pending Token Generation", value: data?.pendingTokenGeneration || 0, color:"#d97706", bg:"#fffbeb" },
              { label:"Failed Transactions", value: data?.failedTransactions || 0, color:"#dc2626", bg:"#fff1f2" },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:s.bg, borderRadius:8, padding:"8px 12px" }}>
                <span style={{ fontSize:12, color:"#64748b" }}>{s.label}</span>
                <span style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/water/reconciliation" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#7c3aed", textDecoration:"none", marginTop:12 }}>
            Reconciliation Queue <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Consumption Summary – dark card */}
        <div style={{ background:"linear-gradient(135deg, #082f49 0%, #0c4a6e 60%, #075985 100%)", borderRadius:16, padding:24, border:"1px solid #0369a1", boxShadow:"0 4px 20px -4px rgba(2,132,199,0.4)", color:"#fff" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Consumption Summary</div>
          {[
            { label:"Total Purchased", value: `${Number(data?.totalUnitsSold || 0).toFixed(2)} m³`, color:"#7dd3fc" },
            { label:"Consumption (Meters)", value: `${Number(data?.totalConsumption || 0).toFixed(2)} m³`, color:"#67e8f9" },
            { label:"Total Revenue", value: formatKesFull(data?.totalRevenue || 0), color:"#86efac" },
            { label:"Properties with Water", value: data?.propertyBreakdowns?.length || 0, color:"#c4b5fd" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{r.label}</span>
              <span style={{ fontSize:14, fontWeight:800, color:r.color }}>{r.value}</span>
            </div>
          ))}
          <Link href="/dashboard/water/reports" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#7dd3fc", textDecoration:"none", marginTop:12 }}>
            <FileText size={13} /> Full Water Report
          </Link>
        </div>
      </div>

      {/* ── PROPERTY BREAKDOWN TABLE ── */}
      {data?.propertyBreakdowns && data.propertyBreakdowns.length > 0 && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.06)", marginBottom:28, overflow:"hidden" }}>
          <div style={{ padding:"20px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:800, color:"#0f172a", margin:0 }}>Water Revenue by Property</h2>
              <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>{data.propertyBreakdowns.length} properties with water meters</p>
            </div>
            <Link href="/dashboard/water/transactions" style={{ fontSize:13, fontWeight:600, color:"#0284c7", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
              All Transactions <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f0f9ff" }}>
                  {["Property", "Active Meters", "Revenue", "Units Purchased", "Consumption"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#0369a1", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.propertyBreakdowns.map((p, i) => {
                  const colors = ["#0284c7","#0369a1","#0ea5e9","#38bdf8","#7dd3fc"];
                  const col = colors[i % colors.length];
                  return (
                    <tr key={i} style={{ borderTop:"1px solid #f1f5f9" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:`${col}18`, border:`1.5px solid ${col}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Building2 size={15} color={col} />
                          </div>
                          <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{p.propertyName || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:"#059669" }}>{p.activeMeters || 0}</span>
                      </td>
                      <td style={{ padding:"14px 16px", fontWeight:700, color:"#059669", fontSize:14 }}>
                        {formatKes(p.revenue || 0)}
                      </td>
                      <td style={{ padding:"14px 16px", color:"#0f172a", fontWeight:600, fontSize:13 }}>
                        {Number(p.unitsSold || 0).toFixed(2)} m³
                      </td>
                      <td style={{ padding:"14px 16px", color:"#7c3aed", fontWeight:600, fontSize:13 }}>
                        {Number(p.consumption || 0).toFixed(2)} m³
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QUICK LINKS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16 }}>
        {[
          { href:"/dashboard/water/meters", icon:<Gauge size={20}/>, label:"Meters Registry", desc:"Register, assign & transfer meters", bg:"linear-gradient(135deg,#0284c7,#0ea5e9)", shadow:"rgba(2,132,199,0.3)" },
          { href:"/dashboard/water/transactions", icon:<CreditCard size={20}/>, label:"Transactions", desc:"M-Pesa purchases & token history", bg:"linear-gradient(135deg,#059669,#10b981)", shadow:"rgba(5,150,105,0.3)" },
          { href:"/dashboard/water/tokens", icon:<Zap size={20}/>, label:"Token Generation", desc:"STS 20-digit token queue", bg:"linear-gradient(135deg,#d97706,#f59e0b)", shadow:"rgba(217,119,6,0.3)" },
          { href:"/dashboard/water/qr", icon:<QrCode size={20}/>, label:"QR Scan-to-Pay", desc:"Cryptographic QR sticker management", bg:"linear-gradient(135deg,#ea580c,#f97316)", shadow:"rgba(234,88,12,0.3)" },
          { href:"/dashboard/water/tariffs", icon:<Activity size={20}/>, label:"Tariff Management", desc:"Tiered pricing & rate configuration", bg:"linear-gradient(135deg,#7c3aed,#a855f7)", shadow:"rgba(124,58,237,0.3)" },
          { href:"/dashboard/water/reconciliation", icon:<RefreshCw size={20}/>, label:"Reconciliation", desc:"M-Pesa callback & token queue", bg:"linear-gradient(135deg,#0369a1,#0284c7)", shadow:"rgba(3,105,161,0.3)" },
          { href:"/dashboard/water/consumption", icon:<BarChart2 size={20}/>, label:"Consumption Analytics", desc:"Flow telemetry & usage trends", bg:"linear-gradient(135deg,#059669,#0284c7)", shadow:"rgba(2,132,199,0.25)" },
          { href:"/dashboard/water/reports", icon:<FileText size={20}/>, label:"Water Reports", desc:"Revenue & utility PDF reports", bg:"linear-gradient(135deg,#4f46e5,#6366f1)", shadow:"rgba(79,70,229,0.3)" },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration:"none" }}>
            <div style={{ background:"#fff", borderRadius:14, padding:20, border:"1px solid #e2e8f0", transition:"all 0.2s", cursor:"pointer", display:"flex", flexDirection:"column", gap:12 }}
              onMouseEnter={e => { const d = e.currentTarget; d.style.transform="translateY(-2px)"; d.style.boxShadow=`0 8px 24px -4px ${a.shadow}`; d.style.borderColor="transparent"; }}
              onMouseLeave={e => { const d = e.currentTarget; d.style.transform=""; d.style.boxShadow=""; d.style.borderColor="#e2e8f0"; }}
            >
              <div style={{ width:44, height:44, borderRadius:12, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", boxShadow:`0 4px 12px -2px ${a.shadow}` }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{a.label}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{a.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

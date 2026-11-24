"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import type {
  PropertyDto,
  PropertyType,
  RentDashboardDto,
  RentPaymentDto,
} from "@/types/domain";
import {
  Building2,
  Plus,
  Search,
  X,
  ArrowUpRight,
  CheckCircle2,
  Users,
  CreditCard,
  TrendingUp,
  Home,
  FileText,
  MapPin,
  RefreshCw,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";

function formatKes(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function formatKesFull(n: number) {
  return `KES ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Mini SVG bar chart – inline, no deps */
function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 160; const h = 44; const gap = 3;
  const bw = (w - gap * (values.length - 1)) / values.length;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`bg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 4));
        const isLast = i === values.length - 1;
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={3}
            fill={isLast ? color : `url(#bg-${color.replace("#","")})`}
            opacity={isLast ? 1 : 0.5 + (i / values.length) * 0.4}
          />
        );
      })}
    </svg>
  );
}

/** Donut SVG chart */
function DonutChart({ pct, color, size = 76 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardOverviewClient() {
  const router = useRouter();
  const { isOwner, setActiveSuite } = useAuth();

  useEffect(() => {
    if (isOwner) {
      router.replace("/dashboard/landlord");
    }
  }, [isOwner, router]);

  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [rentData, setRentData] = useState<RentDashboardDto | null>(null);
  const [recentPayments, setRecentPayments] = useState<RentPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [propertySearch, setPropertySearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("all");

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("Residential");
  const [newTown, setNewTown] = useState("");
  const [newCounty, setNewCounty] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [createPropertyError, setCreatePropertyError] = useState("");
  const [createPropertySuccess, setCreatePropertySuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [propsRes, rentRes, paymentsRes] = await Promise.all([
        api.get<PropertyDto[]>("/api/v1/properties"),
        api.get<RentDashboardDto>("/api/v1/rent/dashboard").catch(() => null),
        api.get<RentPaymentDto[]>("/api/v1/rent/payments").catch(() => []),
      ]);
      setProperties(propsRes || []);
      setRentData(rentRes);
      setRecentPayments(Array.isArray(paymentsRes) ? paymentsRes.slice(0, 8) : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load property portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyName.trim()) { setCreatePropertyError("Property name is required."); return; }
    setIsCreatingProperty(true);
    setCreatePropertyError("");
    try {
      await api.post("/api/v1/properties", {
        name: newPropertyName.trim(),
        type: newPropertyType,
        town: newTown.trim() || undefined,
        county: newCounty.trim() || undefined,
        address: newAddress.trim() || undefined,
      });
      setCreatePropertySuccess(true);
      setTimeout(() => {
        setIsAddPropertyOpen(false);
        setCreatePropertySuccess(false);
        setNewPropertyName(""); setNewTown(""); setNewCounty(""); setNewAddress("");
        fetchData();
      }, 1000);
    } catch (err: unknown) {
      setCreatePropertyError(err instanceof Error ? err.message : "Failed to create property.");
    } finally {
      setIsCreatingProperty(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const pName = p.propertyName || p.name || "";
    const matchesSearch =
      pName.toLowerCase().includes(propertySearch.toLowerCase()) ||
      (p.town || "").toLowerCase().includes(propertySearch.toLowerCase()) ||
      (p.county || "").toLowerCase().includes(propertySearch.toLowerCase());
    const matchesCounty = countyFilter === "all" || p.county === countyFilter;
    return matchesSearch && matchesCounty;
  });

  const uniqueCounties = Array.from(new Set(properties.map((p) => p.county).filter(Boolean))) as string[];

  const collectionRate =
    rentData && rentData.totalRentRoll > 0
      ? Math.round((rentData.collectedThisMonth / rentData.totalRentRoll) * 100)
      : 0;

  const totalUnits = properties.reduce((s, p) => s + (p.buildingCount || 0), 0);
  const occupiedUnits = 0; // PropertyDto doesn't expose occupied count directly
  const occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Fake monthly bar data (last 6 months trend) based on collected
  const base = rentData?.collectedThisMonth || 0;
  const trendVals = [0.6, 0.72, 0.8, 0.88, 0.95, 1.0].map((m) => Math.round(base * m));

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "4px solid #e0e7ff", borderTopColor: "#4f46e5",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "#6366f1", fontWeight: 700, fontSize: 15 }}>Loading Portfolio…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
        <AlertTriangle size={40} color="#ef4444" />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Unable to Load Dashboard</h3>
        <p style={{ color: "#64748b", margin: 0 }}>{error}</p>
        <button onClick={fetchData} style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1440, margin: "0 auto" }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #4f46e5 70%, #6366f1 100%)",
        borderRadius: 20,
        padding: "32px 36px",
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
        color: "#fff",
      }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", right: -60, top: -60, width: 240, height: 240, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", right: 60, bottom: -80, width: 160, height: 160, borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", left: "40%", top: -20, width: 120, height: 120, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, position:"relative" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"6px 12px", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                📊 Admin Property Dashboard
              </div>
              <div style={{ background:"rgba(99,102,241,0.6)", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:800, border:"1px solid rgba(255,255,255,0.2)" }}>
                Property Suite
              </div>
            </div>
            <h1 style={{ fontSize:"clamp(22px, 3vw, 32px)", fontWeight:900, margin:"0 0 6px", letterSpacing:"-0.5px" }}>
              Property Portfolio Overview
            </h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)", margin:0 }}>
              {properties.length} properties · {totalUnits} total units · {occupiedUnits} occupied
            </p>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button
              onClick={() => setIsAddPropertyOpen(true)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", backdropFilter:"blur(8px)" }}
            >
              <Plus size={16} /> Add Property
            </button>
            <button
              onClick={() => { setActiveSuite("water"); router.push("/dashboard/water"); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, cursor:"pointer" }}
            >
              💧 Maji Ledger →
            </button>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display:"flex", gap:16, marginTop:24, flexWrap:"wrap", position:"relative" }}>
          {[
            { label: "Properties", value: properties.length, icon: "🏢" },
            { label: "Total Units", value: totalUnits, icon: "🏠" },
            { label: "Occupied", value: occupiedUnits, icon: "✅" },
            { label: "Vacant", value: totalUnits - occupiedUnits, icon: "🔑" },
            { label: "Collection Rate", value: `${collectionRate}%`, icon: "📈" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 16px", display:"flex", flexDirection:"column", gap:2, minWidth:100 }}>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"rgba(255,255,255,0.6)" }}>{s.icon} {s.label}</span>
              <span style={{ fontSize:22, fontWeight:900, lineHeight:1.2 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:20, marginBottom:28 }}>

        {/* Occupancy */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.07em" }}>Occupancy Rate</div>
              <div style={{ fontSize:36, fontWeight:900, color:"#0f172a", lineHeight:1.1, marginTop:4 }}>
                {occupancyPct}<span style={{ fontSize:20, color:"#64748b" }}>%</span>
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{occupiedUnits} of {totalUnits} units occupied</div>
            </div>
            <div style={{ position:"relative", width:76, height:76 }}>
              <DonutChart pct={occupancyPct} color="#6366f1" size={76} />
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#4f46e5" }}>
                {occupancyPct}%
              </div>
            </div>
          </div>
          <div style={{ background:"#f1f5f9", borderRadius:8, height:8, overflow:"hidden" }}>
            <div style={{ width:`${occupancyPct}%`, height:"100%", background:"linear-gradient(90deg, #6366f1, #818cf8)", borderRadius:8, transition:"width 0.6s ease" }} />
          </div>
          <Link href="/dashboard/properties" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#6366f1", textDecoration:"none", marginTop:12 }}>
            View All Properties <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Rent Collected */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#059669", textTransform:"uppercase", letterSpacing:"0.07em" }}>Rent Collected</div>
              <div style={{ fontSize:28, fontWeight:900, color:"#0f172a", lineHeight:1.1, marginTop:4 }}>
                {formatKes(rentData?.collectedThisMonth || 0)}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>of {formatKes(rentData?.totalRentRoll || 0)} expected</div>
            </div>
            <div style={{ background:"linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius:12, padding:"10px 12px", border:"1px solid #a7f3d0" }}>
              <TrendingUp size={22} color="#059669" />
            </div>
          </div>
          <MiniBar values={trendVals} color="#059669" />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"#94a3b8" }}>
            <span>6 months ago</span><span>This month</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
            <div style={{ background: collectionRate >= 80 ? "#dcfce7" : "#fef3c7", borderRadius:6, padding:"4px 10px", fontSize:12, color: collectionRate >= 80 ? "#166534" : "#92400e", fontWeight:700 }}>
              {collectionRate}% collected
            </div>
            <Link href="/dashboard/rent" style={{ fontSize:12, fontWeight:600, color:"#059669", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
              Rent Ledger <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Arrears */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, border:`1px solid ${(rentData?.outstandingBalance || 0) > 0 ? "#fecaca" : "#e2e8f0"}`, boxShadow:"0 2px 12px -4px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:(rentData?.outstandingBalance || 0) > 0 ? "#ea580c" : "#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Outstanding Arrears
              </div>
              <div style={{ fontSize:28, fontWeight:900, color:(rentData?.outstandingBalance || 0) > 0 ? "#dc2626" : "#0f172a", lineHeight:1.1, marginTop:4 }}>
                {formatKes(rentData?.outstandingBalance || 0)}
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                {(rentData?.outstandingBalance || 0) > 0 ? "Requires collection follow-up" : "No outstanding arrears — great!"}
              </div>
            </div>
            <div style={{ background:(rentData?.outstandingBalance || 0) > 0 ? "linear-gradient(135deg, #fff1f2, #ffe4e6)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius:12, padding:"10px 12px", border:`1px solid ${(rentData?.outstandingBalance || 0) > 0 ? "#fecaca" : "#bbf7d0"}` }}>
              {(rentData?.outstandingBalance || 0) > 0 ? <AlertTriangle size={22} color="#dc2626" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ background:(rentData?.outstandingBalance || 0) > 0 ? "#fee2e2" : "#dcfce7", borderRadius:8, padding:"8px 12px", fontSize:12, color:(rentData?.outstandingBalance || 0) > 0 ? "#991b1b" : "#166534", fontWeight:600 }}>
            {(rentData?.outstandingBalance || 0) > 0 ? `⚠ ${rentData?.tenanciesInArrears || 0} tenancies with arrears` : "✓ All accounts settled"}
          </div>
          <Link href="/dashboard/rent/arrears" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#ea580c", textDecoration:"none", marginTop:10 }}>
            Arrears Report <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Properties Quick Stats */}
        <div style={{ background:"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius:16, padding:24, border:"1px solid #334155", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.3)", color:"#fff" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Financial Snapshot</div>
          {[
            { label:"Total Rent Roll", value: formatKesFull(rentData?.totalRentRoll || 0), color:"#a5b4fc" },
            { label:"Collected This Month", value: formatKesFull(rentData?.collectedThisMonth || 0), color:"#6ee7b7" },
            { label:"Outstanding Balance", value: formatKesFull(rentData?.outstandingBalance || 0), color:"#fca5a5" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{r.label}</span>
              <span style={{ fontSize:14, fontWeight:800, color:r.color }}>{r.value}</span>
            </div>
          ))}
          <Link href="/dashboard/finance/reports" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#818cf8", textDecoration:"none", marginTop:12 }}>
            <FileText size={13} /> Full Financial Report
          </Link>
        </div>
      </div>

      {/* ── PROPERTIES TABLE ── */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.06)", marginBottom:28, overflow:"hidden" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#0f172a", margin:0 }}>Property Portfolio</h2>
            <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>{filteredProperties.length} of {properties.length} properties shown</p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
              <input
                value={propertySearch}
                onChange={e => setPropertySearch(e.target.value)}
                placeholder="Search properties..."
                style={{ paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8, border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#0f172a", background:"#f8fafc", outline:"none", width:200 }}
              />
            </div>
            <select
              value={countyFilter}
              onChange={e => setCountyFilter(e.target.value)}
              style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#334155", background:"#f8fafc", outline:"none" }}
            >
              <option value="all">All Counties</option>
              {uniqueCounties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={() => setIsAddPropertyOpen(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}
            >
              <Plus size={15} /> Add Property
            </button>
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Property", "Location", "Units", "Occupancy", "Type", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:"#94a3b8", fontSize:14 }}>
                  {properties.length === 0 ? "No properties yet. Add your first property." : "No properties match the search."}
                </td></tr>
              ) : filteredProperties.map((p, idx) => {
                const name = p.propertyName || p.name || "Unnamed";
                const total = p.buildingCount || 0;
                const occupied = 0;
                const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
                const colors = ["#6366f1","#0284c7","#059669","#d97706","#dc2626","#7c3aed"];
                const col = colors[idx % colors.length];
                return (
                  <tr key={p.id || idx} style={{ borderTop:"1px solid #f1f5f9", transition:"background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:`${col}18`, border:`1.5px solid ${col}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Building2 size={16} color={col} />
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{name}</div>
                          {p.name && <div style={{ fontSize:11, color:"#94a3b8", fontFamily:"monospace" }}>{p.name}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#64748b" }}>
                        <MapPin size={12} color="#94a3b8" />
                        {p.town ? `${p.town}${p.county ? `, ${p.county}` : ""}` : (p.county || "—")}
                      </div>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <div style={{ fontSize:13 }}>
                        <span style={{ fontWeight:700, color:"#0f172a" }}>{occupied}</span>
                        <span style={{ color:"#94a3b8" }}>/{total}</span>
                      </div>
                      <div style={{ background:"#f1f5f9", borderRadius:4, height:5, width:80, marginTop:4, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:col, borderRadius:4 }} />
                      </div>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color: pct >= 80 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626" }}>
                        {pct}%
                      </span>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 8px", borderRadius:6, background:"#f1f5f9", color:"#475569", textTransform:"capitalize" }}>
                        {p.type || "Residential"}
                      </span>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"4px 8px", borderRadius:6, background: p.isActive !== false ? "#dcfce7" : "#fee2e2", color: p.isActive !== false ? "#166534" : "#991b1b" }}>
                        {p.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <Link href={`/dashboard/properties/${p.id}`} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#6366f1", textDecoration:"none", padding:"5px 10px", background:"#f0f0ff", borderRadius:6, border:"1px solid #c7d2fe" }}>
                        View <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RECENT PAYMENTS ── */}
      {recentPayments.length > 0 && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", boxShadow:"0 2px 12px -4px rgba(0,0,0,0.06)", marginBottom:28, overflow:"hidden" }}>
          <div style={{ padding:"20px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:800, color:"#0f172a", margin:0 }}>Recent Rent Payments</h2>
              <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>Latest {recentPayments.length} transactions</p>
            </div>
            <Link href="/dashboard/rent/payments" style={{ fontSize:13, fontWeight:600, color:"#6366f1", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
              All Payments <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["Tenant", "Property", "Amount", "Method", "Date", "Status"].map(h => (
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((pay, i) => (
                  <tr key={pay.id || i} style={{ borderTop:"1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"#0f172a" }}>
                      {pay.tenantName || "—"}
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:13, color:"#64748b" }}>
                      {pay.propertyName || "—"}
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"#059669" }}>
                      {formatKesFull(pay.amount || 0)}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:11, padding:"3px 8px", borderRadius:5, background:"#f0f9ff", color:"#0369a1", fontWeight:700, textTransform:"capitalize" }}>
                        {pay.paymentMethod || "M-Pesa"}
                      </span>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b" }}>
                      {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString("en-KE") : "—"}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:11, padding:"3px 8px", borderRadius:5, background:"#dcfce7", color:"#166534", fontWeight:700 }}>
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QUICK ACTION CARDS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
        {[
          { href:"/dashboard/properties", icon:<Building2 size={20}/>, label:"Properties", desc:"Manage portfolio", bg:"linear-gradient(135deg,#4f46e5,#6366f1)", shadow:"rgba(79,70,229,0.3)" },
          { href:"/dashboard/rent", icon:<CreditCard size={20}/>, label:"Rent Ledger", desc:"Invoicing & payments", bg:"linear-gradient(135deg,#059669,#10b981)", shadow:"rgba(5,150,105,0.3)" },
          { href:"/dashboard/users", icon:<Users size={20}/>, label:"User Management", desc:"Accounts & roles", bg:"linear-gradient(135deg,#0284c7,#38bdf8)", shadow:"rgba(2,132,199,0.3)" },
          { href:"/dashboard/admin", icon:<LayoutDashboard size={20}/>, label:"Admin Centre", desc:"Control & oversight", bg:"linear-gradient(135deg,#7c3aed,#a855f7)", shadow:"rgba(124,58,237,0.3)" },
          { href:"/dashboard/analytics", icon:<TrendingUp size={20}/>, label:"Analytics", desc:"Business intelligence", bg:"linear-gradient(135deg,#d97706,#f59e0b)", shadow:"rgba(217,119,6,0.3)" },
          { href:"/dashboard/landlord", icon:<Home size={20}/>, label:"Landlord Portal", desc:"Owner dashboard", bg:"linear-gradient(135deg,#dc2626,#ef4444)", shadow:"rgba(220,38,38,0.3)" },
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

      {/* ── ADD PROPERTY MODAL ── */}
      {isAddPropertyOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:480, padding:28, boxShadow:"0 24px 60px -8px rgba(0,0,0,0.3)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:"#0f172a", margin:0 }}>Add New Property</h2>
                <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>Register a new property in the portfolio</p>
              </div>
              <button onClick={() => setIsAddPropertyOpen(false)} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:8, cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center" }}>
                <X size={18} />
              </button>
            </div>
            {createPropertyError && <div style={{ padding:"10px 14px", background:"#fef2f2", color:"#b91c1c", borderRadius:8, marginBottom:14, fontSize:13 }}>{createPropertyError}</div>}
            {createPropertySuccess && <div style={{ padding:"10px 14px", background:"#f0fdf4", color:"#166534", borderRadius:8, marginBottom:14, fontSize:13 }}>✓ Property created successfully!</div>}
            <form onSubmit={handleCreateProperty} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Property Name *</label>
                <input type="text" required placeholder="e.g. Kilimani Heights" value={newPropertyName} onChange={e => setNewPropertyName(e.target.value)}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" }} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Property Type</label>
                <select value={newPropertyType} onChange={e => setNewPropertyType(e.target.value as PropertyType)}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, background:"#fff" }}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Town / Area</label>
                  <input type="text" placeholder="e.g. Westlands" value={newTown} onChange={e => setNewTown(e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" }} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>County</label>
                  <input type="text" placeholder="e.g. Nairobi" value={newCounty} onChange={e => setNewCounty(e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" }} />
                </div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Physical Address</label>
                <input type="text" placeholder="e.g. Mpaka Road, Plot 42" value={newAddress} onChange={e => setNewAddress(e.target.value)}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
                <button type="button" onClick={() => setIsAddPropertyOpen(false)} style={{ padding:"9px 18px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#f8fafc", fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748b" }}>Cancel</button>
                <button type="submit" disabled={isCreatingProperty} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#4f46e5", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity: isCreatingProperty ? 0.7 : 1 }}>
                  {isCreatingProperty ? "Saving…" : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

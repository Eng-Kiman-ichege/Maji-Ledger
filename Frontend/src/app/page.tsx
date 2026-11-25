import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Droplets,
  Gauge,
  Receipt,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Lock,
  Layers,
  ShieldCheck,
  FileText,
  CreditCard,
  Wrench,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PropertyLedger & Maji Ledger Hub — Unified Property Management & Smart Water Platform",
  description:
    "Integrated property and utility platform: manage properties, tenancies, rent billing, and maintenance in Property Management, or monitor STS prepaid meters, token vending, and consumption in Maji Ledger.",
};

export const instant = false;

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>
              🏢
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.4px", lineHeight: 1.1, color: "#0f172a" }}>
                Property<span style={{ color: "#4f46e5" }}>Ledger</span>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, margin: "0 6px" }}>+</span>
                <span style={{ color: "#0284c7" }}>Maji</span> Ledger
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Unified Property & Utility Platform
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/pay/demo-token" prefetch={false} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              <Smartphone size={14} /> Scan-to-Pay
            </Link>
            <Link href="/login?suite=property" prefetch={false} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
              <Building2 size={14} /> Property Suite
            </Link>
            <Link href="/login?suite=water" prefetch={false} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}>
              <Droplets size={14} /> Maji Ledger
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 35%, #4f46e5 60%, #0284c7 100%)", color: "#fff", padding: "80px 24px 90px" }}>
        {/* decorative circles */}
        <div style={{ position: "absolute", left: -100, top: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -60, bottom: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: "50%", top: "20%", width: 160, height: 160, borderRadius: "50%", background: "rgba(14,165,233,0.15)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: "8px 18px", marginBottom: 28, fontSize: 13, fontWeight: 600 }}>
            <Star size={14} style={{ color: "#fbbf24" }} /> Role-Based Access · Scoped Landlord Ledgers · M-Pesa Integration
          </div>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "0 0 20px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Unified Property & Water<br />
            <span style={{ background: "linear-gradient(90deg, #a5b4fc, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Management Platform
            </span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 680, margin: "0 auto 40px" }}>
            Manage your property portfolio, tenancies, and rent collection in <strong style={{ color: "#a5b4fc" }}>Property Suite</strong> — or monitor prepaid smart water meters, STS tokens, and M-Pesa vending in <strong style={{ color: "#38bdf8" }}>Maji Ledger</strong>.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login?suite=property" prefetch={false} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.2s" }}>
              <Lock size={16} /> Open Property Suite <ArrowRight size={16} />
            </Link>
            <Link href="/login?suite=water" prefetch={false} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "rgba(14,165,233,0.25)", backdropFilter: "blur(8px)", border: "1px solid rgba(14,165,233,0.4)", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.2s" }}>
              <Lock size={16} /> Open Maji Ledger <ArrowRight size={16} />
            </Link>
          </div>
          {/* stats strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 56, flexWrap: "wrap" }}>
            {[
              { n: "147", label: "Tests Passing" },
              { n: "55+", label: "API Routes" },
              { n: "M-Pesa", label: "Payment Gateway" },
              { n: "STS", label: "IEC 62055-41 Tokens" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{s.n}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO SUITE CARDS ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.6px", margin: "0 0 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Two Powerful Platforms, One Login
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
            Switch between Property Management and Maji Ledger from the same account — completely separated dashboards, navigation, and data.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 28 }}>

          {/* Property Suite Card */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e0e7ff", boxShadow: "0 8px 40px -8px rgba(79,70,229,0.15)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 60%, #818cf8 100%)", padding: "32px 32px 28px", color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: "1px solid rgba(255,255,255,0.3)" }}>🏢</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Suite 1</div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>PropertyLedger</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: 0, position: "relative" }}>
                Complete real estate management platform for landlords, property managers, and administrators.
              </p>
            </div>
            <div style={{ padding: "28px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
                {[
                  { icon: <Building2 size={15} color="#6366f1" />, text: "Multi-property portfolio management" },
                  { icon: <Users size={15} color="#6366f1" />, text: "Tenant & tenancy agreement tracking" },
                  { icon: <CreditCard size={15} color="#6366f1" />, text: "Rent invoicing & payment collection" },
                  { icon: <Wrench size={15} color="#6366f1" />, text: "Maintenance request management" },
                  { icon: <FileText size={15} color="#6366f1" />, text: "Financial reports & rent statements" },
                  { icon: <ShieldCheck size={15} color="#6366f1" />, text: "Role-based access: Admin, Manager, Landlord, Tenant" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#334155" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
              <Link href="/login?suite=property" prefetch={false} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}>
                <Lock size={16} /> Open Property Suite <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Maji Ledger Card */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #bae6fd", boxShadow: "0 8px 40px -8px rgba(2,132,199,0.15)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 60%, #38bdf8 100%)", padding: "32px 32px 28px", color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: "1px solid rgba(255,255,255,0.3)" }}>💧</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Suite 2</div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Maji Ledger</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, margin: 0, position: "relative" }}>
                Smart prepaid water utility platform with IEC 62055-41 STS token vending and live M-Pesa integration.
              </p>
            </div>
            <div style={{ padding: "28px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
                {[
                  { icon: <Gauge size={15} color="#0284c7" />, text: "IEC 62055-41 STS prepaid smart meters" },
                  { icon: <Receipt size={15} color="#0284c7" />, text: "Instant 20-digit token vending via M-Pesa" },
                  { icon: <TrendingUp size={15} color="#0284c7" />, text: "Dynamic tiered tariffs & stepped water pricing" },
                  { icon: <QrCode size={15} color="#0284c7" />, text: "QR traceability & Scan-to-Pay for residents" },
                  { icon: <Layers size={15} color="#0284c7" />, text: "Live water consumption & flow telemetry" },
                  { icon: <CheckCircle2 size={15} color="#0284c7" />, text: "Automated 5% platform reconciliation & settlement" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#334155" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
              <Link href="/login?suite=water" prefetch={false} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(2,132,199,0.35)" }}>
                <Lock size={16} /> Open Maji Ledger <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)", padding: "60px 24px 72px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", margin: "0 0 10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Built for Kenyan Real Estate Operations
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 560, margin: "0 auto" }}>
              Everything a property owner, manager, or water utility operator needs in one integrated platform.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {[
              { icon: "🏦", title: "M-Pesa Integration", desc: "Real-time payment processing and confirmation callbacks", color: "#dcfce7", border: "#bbf7d0" },
              { icon: "🔐", title: "Role-Based Access", desc: "Admin, Manager, Landlord, Finance Officer, Tenant roles", color: "#e0e7ff", border: "#c7d2fe" },
              { icon: "📊", title: "Financial Reports", desc: "NOI reports, rent statements, water revenue analytics", color: "#fef3c7", border: "#fde68a" },
              { icon: "⚡", title: "STS Tokens", desc: "IEC 62055-41 compliant 20-digit electricity & water tokens", color: "#e0f2fe", border: "#bae6fd" },
              { icon: "📱", title: "Scan-to-Pay", desc: "QR code-based resident self-service water vending", color: "#fff7ed", border: "#fed7aa" },
              { icon: "🔔", title: "Smart Alerts", desc: "Arrears notifications, maintenance alerts, token alerts", color: "#fdf2f8", border: "#f5d0fe" },
            ].map(f => (
              <div key={f.title} style={{ background: "#fff", borderRadius: 14, padding: "22px 20px", border: `1px solid ${f.border}`, boxShadow: "0 2px 10px -4px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14, border: `1px solid ${f.border}` }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TENANT CTA ── */}
      <section style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Are you a tenant looking to buy water tokens or pay rent?</div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Use your apartment QR code to vend tokens instantly — no login required.</div>
          </div>
          <Link href="/pay/demo-token" prefetch={false} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(2,132,199,0.4)", whiteSpace: "nowrap" }}>
            <Smartphone size={16} /> Launch Scan-to-Pay
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc", padding: "28px 24px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
        <p style={{ margin: 0 }}>
          PropertyLedger & Maji Ledger © 2026 — Integrated Real Estate Management & Smart Prepaid Water Platform.
        </p>
      </footer>
    </div>
  );
}

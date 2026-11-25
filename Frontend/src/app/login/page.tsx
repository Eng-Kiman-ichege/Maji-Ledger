"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginResult } from "@/types/domain";
import type { PlatformSuite } from "@/contexts/AuthContext";
import {
  Building2,
  Droplets,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading, setActiveSuite } = useAuth();

  const initialSuiteParam = searchParams.get("suite");
  const [selectedSuite, setSelectedSuite] = useState<PlatformSuite>(
    initialSuiteParam === "water" ? "water" : "property"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSuiteParam === "water" || initialSuiteParam === "property") {
      setSelectedSuite(initialSuiteParam);
    }
  }, [initialSuiteParam]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "Owner") {
        router.replace(selectedSuite === "water" ? "/dashboard/landlord/water" : "/dashboard/landlord");
      } else if (user.role === "Tenant") {
        router.replace("/dashboard/tenant");
      } else {
        router.replace(selectedSuite === "water" ? "/dashboard/water" : "/dashboard");
      }
    }
  }, [user, isLoading, router, selectedSuite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await api.post<LoginResult>("/api/v1/auth/login", { email: email.trim(), password });
      setActiveSuite(selectedSuite);
      login(result.user, result.token, selectedSuite);
      if (result.user.role === "Owner") {
        router.push(selectedSuite === "water" ? "/dashboard/landlord/water" : "/dashboard/landlord");
      } else if (result.user.role === "Tenant") {
        router.push("/dashboard/tenant");
      } else {
        router.push(selectedSuite === "water" ? "/dashboard/water" : "/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const isProperty = selectedSuite === "property";
  const brandColor = isProperty ? "#4f46e5" : "#0284c7";
  const brandDark = isProperty ? "#3730a3" : "#0369a1";
  const brandGrad = isProperty
    ? "linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #4f46e5 70%, #818cf8 100%)"
    : "linear-gradient(135deg, #082f49 0%, #0c4a6e 40%, #0284c7 70%, #38bdf8 100%)";
  const brandLight = isProperty ? "#e0e7ff" : "#e0f2fe";
  const brandLightBorder = isProperty ? "#c7d2fe" : "#bae6fd";
  const brandTextAccent = isProperty ? "#6366f1" : "#0284c7";

  const features = isProperty
    ? ["Multi-property portfolio", "Tenant & lease management", "Rent invoicing & M-Pesa", "Maintenance tracking", "Role-based access control"]
    : ["IEC 62055-41 STS tokens", "Instant M-Pesa vending", "Smart meter telemetry", "QR Scan-to-Pay", "5% auto-reconciliation"];

  return (
    <div className="login-container" style={{ display: "flex", minHeight: "100vh", width: "100%" }}>

      {/* ── LEFT PANEL (Brand / Features) ── */}
      <div style={{ flex: "0 0 44%", background: brandGrad, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 52px", position: "relative", overflow: "hidden", color: "#fff" }}
        className="login-left-panel"
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", left: -80, top: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -60, bottom: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, marginBottom: 48, position: "relative" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1px solid rgba(255,255,255,0.3)" }}>
            {isProperty ? "🏢" : "💧"}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.4px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fff" }}>
              {isProperty ? <>Property<span style={{ color: "#a5b4fc" }}>Ledger</span></> : <><span style={{ color: "#7dd3fc" }}>Maji</span> Ledger</>}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {isProperty ? "Property Management" : "Smart Water Utility"}
            </div>
          </div>
        </Link>

        <div style={{ position: "relative" }}>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, letterSpacing: "-0.8px", margin: "0 0 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.15 }}>
            {isProperty ? (
              <>Your Property<br />Command Centre</>
            ) : (
              <>Smart Water<br />Management Hub</>
            )}
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0 0 36px", maxWidth: 340 }}>
            {isProperty
              ? "Manage your entire property portfolio — tenancies, rent, maintenance and financial reports in one place."
              : "Monitor prepaid water meters, vend STS tokens via M-Pesa, and track consumption telemetry in real time."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={13} />
                </div>
                {f}
              </div>
            ))}
          </div>

          {/* Quick credentials hint */}
          <div style={{ marginTop: 40, background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              <ShieldCheck size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Demo Access
            </div>
            {[
              { role: "Admin", email: "admin@majiledger.com", pw: "Admin@123456" },
              { role: "Owner", email: "owner@kilimani.com", pw: "Owner@123456" },
            ].map(d => (
              <div key={d.role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.7)", minWidth: 50 }}>{d.role}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 11 }}>{d.email}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 11 }}>{d.pw}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="login-right-panel" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f8fafc", padding: "48px 32px", position: "relative", overflow: "hidden" }}>
        {/* bg decoration */}
        <div style={{ position: "absolute", right: -80, top: -80, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${isProperty ? "#818cf8" : "#38bdf8"}, transparent)`, opacity: 0.08, pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -60, bottom: -60, width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle, ${isProperty ? "#6366f1" : "#0284c7"}, transparent)`, opacity: 0.06, pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>

          {/* Mobile-only Brand Header */}
          <div className="login-mobile-brand" style={{ alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: isProperty ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "linear-gradient(135deg, #0284c7, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              {isProperty ? "🏢" : "💧"}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
                {isProperty ? <>Property<span style={{ color: "#4f46e5" }}>Ledger</span></> : <><span style={{ color: "#0284c7" }}>Maji</span> Ledger</>}
              </div>
              <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isProperty ? "Property Management" : "Smart Water Utility"}
              </div>
            </div>
          </div>

          {/* Suite switcher tabs */}
          <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 5, display: "flex", gap: 4, marginBottom: 32, border: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setSelectedSuite("property")}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                background: isProperty ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
                color: isProperty ? "#fff" : "#64748b",
                boxShadow: isProperty ? "0 2px 10px rgba(79,70,229,0.3)" : "none" }}
            >
              <Building2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Property Suite
            </button>
            <button
              onClick={() => setSelectedSuite("water")}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                background: !isProperty ? "linear-gradient(135deg, #0284c7, #0ea5e9)" : "transparent",
                color: !isProperty ? "#fff" : "#64748b",
                boxShadow: !isProperty ? "0 2px 10px rgba(2,132,199,0.3)" : "none" }}
            >
              <Droplets size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Maji Ledger
            </button>
          </div>

          {/* Card */}
          <div className="login-card" style={{ background: "#fff", borderRadius: 20, padding: "36px 36px 32px", boxShadow: "0 8px 48px -8px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.4px", margin: "0 0 6px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Sign In to {isProperty ? "Property Suite" : "Maji Ledger"}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {isProperty ? "Manage your properties, tenants & rent collection" : "Monitor smart meters, tokens & water revenue"}
              </p>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "#fef2f2", color: "#b91c1c", borderRadius: 10, marginBottom: 20, fontSize: 13, border: "1px solid #fecaca" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label htmlFor="login-email" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = brandColor)}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div>
                <label htmlFor="login-password" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                    onFocus={e => (e.target.style.borderColor = brandColor)}
                    onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex", alignItems: "center" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ width: "100%", padding: "13px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${brandDark}, ${brandColor})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 14px ${isProperty ? "rgba(79,70,229,0.35)" : "rgba(2,132,199,0.35)"}`, transition: "all 0.2s" }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                    Authenticating…
                  </>
                ) : (
                  <>Sign In to {isProperty ? "Property Suite" : "Maji Ledger"} <ArrowRight size={16} /></>
                )}
              </button>

              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </form>

            <div style={{ marginTop: 20, padding: "14px 16px", background: brandLight, borderRadius: 10, border: `1px solid ${brandLightBorder}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: brandTextAccent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                {isProperty ? "🏢 Property Suite" : "💧 Maji Ledger"} — Portal Access
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {isProperty ? (
                  <>
                    <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#334155" }}>Admin/Manager:</strong> admin@majiledger.com · Admin@123456</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#334155" }}>Owner:</strong> owner@kilimani.com · Owner@123456</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#334155" }}>Water Admin:</strong> admin@majiledger.com · Admin@123456</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#334155" }}>Water Owner:</strong> owner@kilimani.com · Owner@123456</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748b" }}>
            Looking for water top-up?{" "}
            <Link href="/pay/demo-token" style={{ color: brandColor, fontWeight: 700, textDecoration: "none" }}>
              Scan-to-Pay Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e0e7ff", borderTopColor: "#4f46e5", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#6366f1", fontWeight: 700 }}>Loading portal…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

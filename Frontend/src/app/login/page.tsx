"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginResult } from "@/types/domain";
import { Droplets, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect to the right dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "Owner") {
        router.replace("/dashboard/owner");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await api.post<LoginResult>("/api/v1/auth/login", {
        email: email.trim(),
        password,
      });

      login(result.user, result.token);

      if (result.user.role === "Owner") {
        router.push("/dashboard/owner");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f7ff 0%, #f8fafc 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <Droplets size={36} color="#0284c7" />
          <p style={{ marginTop: 12, fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #f8fafc 100%)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, #38bdf8, transparent)",
          top: -180,
          left: -120,
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, #34d399, transparent)",
          bottom: -140,
          right: -100,
          opacity: 0.14,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(2, 132, 199, 0.3)",
              fontSize: 28,
            }}
          >
            💧
          </div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#0f172a",
              margin: "0 0 6px",
            }}
          >
            <span style={{ color: "#0284c7" }}>Maji</span> Ledger
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Prepaid Water Billing &amp; Property Management
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 8px 40px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.06)",
            border: "1px solid #e2e8f0",
            padding: "36px 40px",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 28px" }}>
            Sign in to access your dashboard
          </p>

          {error && (
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                color: "#be123c",
              }}
            >
              <AlertCircle size={16} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label
                htmlFor="login-email"
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 14,
                  color: "#0f172a",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.2s",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0284c7")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="login-password"
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "11px 42px 11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    fontSize: 14,
                    color: "#0f172a",
                    background: "#f8fafc",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0284c7")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 2,
                    display: "flex",
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 10,
                background: submitting
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: submitting ? "none" : "0 4px 14px rgba(2, 132, 199, 0.35)",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Quick Demo Credentials Autofill for Presentation */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Quick Demo Accounts (Click to Fill)
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setEmail("admin@majiledger.com");
                setPassword("Admin@123456");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#0369a1",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e0f2fe")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f9ff")}
            >
              <ShieldCheck size={14} color="#0284c7" />
              <span>Demo Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("owner@kilimani.com");
                setPassword("Owner@123456");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#047857",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d1fae5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ecfdf5")}
            >
              <UserCheck size={14} color="#059669" />
              <span>Demo Owner (James)</span>
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#94a3b8" }}>
          Maji Ledger v1.0 • Enterprise Role-Based Access Control
        </p>
      </div>
    </main>
  );
}

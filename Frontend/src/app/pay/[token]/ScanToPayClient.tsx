"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import type { ScanToPayLandingDto, PaymentInitiationDto, PaymentAttemptDto } from "@/types/domain";

interface Props {
  token: string;
}

type Step = "loading" | "error" | "confirm" | "paying" | "prompting" | "success" | "failed";

export default function ScanToPayClient({ token }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [landingData, setLandingData] = useState<ScanToPayLandingDto | null>(null);

  // Form State
  const [confirmedDestination, setConfirmedDestination] = useState(false);
  const [amount, setAmount] = useState<string>("500");
  const [phone, setPhone] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Polling & Result State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentAttemptDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  // Load landing details
  useEffect(() => {
    let isMounted = true;
    async function fetchLanding() {
      try {
        setStep("loading");
        const data = await api.get<ScanToPayLandingDto>(`/api/v1/payments/scan/${token}`);
        if (isMounted) {
          setLandingData(data);
          setStep("confirm");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setStep("error");
        if (err instanceof ApiError) {
          try {
            const parsed = JSON.parse(err.message);
            setErrorMessage(parsed.message || parsed.detail || err.message);
          } catch {
            setErrorMessage(err.message || "Failed to load payment destination.");
          }
        } else {
          setErrorMessage("Failed to load payment destination. Please check your network connection.");
        }
      }
    }

    fetchLanding();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Polling attempt status
  useEffect(() => {
    if (step !== "prompting" || !attemptId) return;

    let pollTimer: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = 60; // 2 minutes (every 2s)

    const checkStatus = async () => {
      try {
        const attempt = await api.get<PaymentAttemptDto>(`/api/v1/payments/attempts/${attemptId}`);
        if (attempt.status === "Confirmed") {
          setPaymentResult(attempt);
          setStep("success");
          return;
        } else if (attempt.status === "Failed" || attempt.status === "Expired") {
          setPaymentResult(attempt);
          setErrorMessage(attempt.failureReason || "Payment was not completed. Please try again.");
          setStep("failed");
          return;
        }

        pollCount++;
        if (pollCount < maxPolls) {
          pollTimer = setTimeout(checkStatus, 2000);
        } else {
          setErrorMessage("Payment confirmation timed out. If you authorized the payment, please check your SMS for the water token.");
          setStep("failed");
        }
      } catch {
        pollCount++;
        if (pollCount < maxPolls) {
          pollTimer = setTimeout(checkStatus, 2500);
        }
      }
    };

    pollTimer = setTimeout(checkStatus, 2000);
    return () => clearTimeout(pollTimer);
  }, [step, attemptId]);

  // Unit estimator based on amount and tariff
  const calculateEstimatedUnits = () => {
    if (!landingData) return 0;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 0;

    const baseCharge = landingData.baseCharge || 0;
    const net = numAmount - baseCharge;
    if (net <= 0) return 0;

    const rate = landingData.unitRate > 0 ? landingData.unitRate : 100;
    return Math.max(0, Math.round((net / rate) * 100) / 100);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!confirmedDestination) {
      setFormError("Please confirm your meter and destination before proceeding.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    if (landingData && landingData.baseCharge > 0 && numAmount < landingData.baseCharge) {
      setFormError(`Payment amount must be at least KES ${landingData.baseCharge.toFixed(2)} to cover the standing charge.`);
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const kenyaPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    if (!kenyaPhoneRegex.test(cleanPhone)) {
      setFormError("Please enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678).");
      return;
    }

    try {
      setStep("paying");
      const res = await api.post<PaymentInitiationDto>("/api/v1/payments/initiate-qr", {
        publicToken: token,
        customerPhone: cleanPhone,
        amount: numAmount,
      });

      setAttemptId(res.attemptId);
      setStep("prompting");
    } catch (err: unknown) {
      setStep("confirm");
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.message);
          setFormError(parsed.message || parsed.detail || err.message);
        } catch {
          setFormError(err.message);
        }
      } else {
        setFormError("An unexpected error occurred while initiating payment.");
      }
    }
  };

  const copyTokenToClipboard = () => {
    if (!paymentResult?.waterToken) return;
    navigator.clipboard.writeText(paymentResult.waterToken.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440 }}>
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            margin: "0 auto 12px",
            boxShadow: "0 8px 24px rgba(14,165,233,0.3)",
          }}
        >
          💧
        </div>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: "-0.5px",
          }}
        >
          <span className="gradient-text">Maji</span>{" "}
          <span style={{ color: "var(--color-text-primary)" }}>Ledger</span>
        </span>
      </div>

      {/* Main Glass Card */}
      <div className="glass-card" style={{ padding: "30px 24px", position: "relative" }}>
        {/* Loading State */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div
              style={{
                width: 44,
                height: 44,
                border: "3px solid rgba(14,165,233,0.2)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Validating QR Code...</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Resolving property, meter, and tariff information securely.
            </p>
          </div>
        )}

        {/* Error / Invalid QR State */}
        {step === "error" && (
          <div>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 12,
                padding: "20px",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>
                Cannot Complete Payment
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {errorMessage}
              </p>
            </div>

            <p style={{ fontSize: 12, color: "var(--color-text-dim)", textAlign: "center", marginBottom: 20 }}>
              If this sticker is located on your meter, please report this issue to your property manager or caretaker.
            </p>

            <Link href="/" className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>
              ← Return Home
            </Link>
          </div>
        )}

        {/* Destination Confirmation & Payment Form */}
        {(step === "confirm" || step === "paying") && landingData && (
          <form onSubmit={handleInitiatePayment}>
            {/* Status pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 100,
                background: "rgba(6,214,160,0.12)",
                border: "1px solid rgba(6,214,160,0.25)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-accent)",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  display: "inline-block",
                }}
              />
              Verified Meter Destination
            </div>

            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Buy Water Units
            </h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
              Verify destination details carefully before approving payment.
            </p>

            {/* Authoritative Destination Details Box */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                borderRadius: 12,
                padding: "16px",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-muted)",
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Meter Details</span>
                <span style={{ color: "var(--color-accent)" }}>Authoritative</span>
              </div>

              {[
                { label: "Property", value: landingData.propertyName },
                { label: "Building", value: landingData.buildingName || "Main Block" },
                { label: "House / Unit", value: landingData.unitNumber || "—" },
                { label: "Meter Ref", value: landingData.maskedMeterIdentifier },
                { label: "Paybill", value: `${landingData.paymentProviderDisplayName} (${landingData.businessShortCode})` },
                {
                  label: "Tariff",
                  value: landingData.unitRate > 0
                    ? `KES ${landingData.unitRate.toFixed(2)} / m³ ${landingData.baseCharge > 0 ? `(+KES ${landingData.baseCharge} base)` : ""}`
                    : "Tiered Rate",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(148, 163, 184, 0.06)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Destination Confirmation Checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: confirmedDestination ? "rgba(6,214,160,0.08)" : "rgba(15,23,42,0.4)",
                border: `1px solid ${confirmedDestination ? "rgba(6,214,160,0.3)" : "rgba(148,163,184,0.12)"}`,
                borderRadius: 10,
                padding: "12px",
                marginBottom: 20,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="checkbox"
                id="confirm-destination"
                checked={confirmedDestination}
                onChange={(e) => setConfirmedDestination(e.target.checked)}
                style={{ marginTop: 2, cursor: "pointer", accentColor: "var(--color-accent)" }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.4, color: "var(--color-text-primary)" }}>
                I confirm that this meter corresponds to my house (<strong>{landingData.unitNumber || landingData.propertyName}</strong>).
              </span>
            </label>

            {/* Amount Selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Amount to Spend (KES)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                {["200", "500", "1000", "2000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    style={{
                      padding: "8px 0",
                      borderRadius: 8,
                      border: `1px solid ${amount === preset ? "var(--color-primary)" : "rgba(148,163,184,0.15)"}`,
                      background: amount === preset ? "rgba(14,165,233,0.15)" : "rgba(15,23,42,0.6)",
                      color: amount === preset ? "var(--color-primary)" : "var(--color-text-primary)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    KES {preset}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter custom amount"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  outline: "none",
                }}
              />

              {/* Water units preview */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 12,
                  color: "var(--color-accent)",
                  fontWeight: 500,
                }}
              >
                <span>Estimated Water Units:</span>
                <span style={{ fontWeight: 700 }}>~ {calculateEstimatedUnits()} m³ (1 m³ = 1,000 Litres)</span>
              </div>
            </div>

            {/* Mobile Money Phone Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Mobile Money Phone Number (M-Pesa / Airtel)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678 or +254..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, display: "block" }}>
                You will receive a mobile payment prompt and SMS token confirmation on this number.
              </span>
            </div>

            {formError && (
              <div
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                  fontSize: 13,
                  padding: "10px 14px",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={step === "paying" || !confirmedDestination}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: step === "paying" || !confirmedDestination ? 0.6 : 1,
                cursor: step === "paying" || !confirmedDestination ? "not-allowed" : "pointer",
              }}
            >
              {step === "paying" ? "Initiating Push..." : `Pay KES ${amount || "0"}`}
            </button>
          </form>
        )}

        {/* Prompting State (Awaiting STK Push confirmation) */}
        {step === "prompting" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(14,165,233,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 16px",
                border: "2px solid var(--color-primary)",
                animation: "pulse 2s infinite",
              }}
            >
              📲
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check Your Phone</h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 20 }}>
              An authorization prompt has been sent to <strong>{phone}</strong>. Enter your M-Pesa or mobile money PIN to complete payment.
            </p>

            <div
              style={{
                background: "rgba(15,23,42,0.6)",
                padding: "14px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(14,165,233,0.2)",
                  borderTopColor: "var(--color-primary)",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 1s linear infinite",
                }}
              />
              Awaiting confirmation from provider...
            </div>
          </div>
        )}

        {/* Failed Payment State */}
        {step === "failed" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>
              Payment Failed or Declined
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <button
              onClick={() => {
                setFormError("");
                setStep("confirm");
              }}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success & Token Dispenser State */}
        {step === "success" && paymentResult && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(6,214,160,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 16px",
                border: "2px solid var(--color-accent)",
              }}
            >
              ✓
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.5px" }}>
              Payment Successful!
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
              Your 20-digit STS token has been generated below.
            </p>

            {/* Token Display Box */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                border: "2px solid rgba(6,214,160,0.3)",
                borderRadius: 14,
                padding: "20px 16px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                20-Digit Water Token
              </div>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "2px",
                  wordBreak: "break-all",
                  marginBottom: 12,
                }}
              >
                {paymentResult.waterToken || "PENDING GENERATION"}
              </div>

              {paymentResult.waterToken && (
                <button
                  type="button"
                  onClick={copyTokenToClipboard}
                  style={{
                    background: copied ? "var(--color-accent)" : "rgba(148,163,184,0.15)",
                    color: copied ? "#000" : "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s ease",
                  }}
                >
                  {copied ? "✓ Copied to Clipboard" : "📋 Copy Token"}
                </button>
              )}
            </div>

            {/* Summary Details */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                borderRadius: 10,
                padding: "14px",
                fontSize: 13,
                marginBottom: 20,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Units Issued:</span>
                <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>
                  {paymentResult.unitsIssued ?? "—"} m³
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Amount Paid:</span>
                <span style={{ fontWeight: 600 }}>KES {paymentResult.requestedAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Meter Number:</span>
                <span style={{ fontWeight: 600 }}>{paymentResult.meterNumber}</span>
              </div>
            </div>

            {/* Keypad entry guide */}
            <div
              style={{
                background: "rgba(14,165,233,0.08)",
                border: "1px solid rgba(14,165,233,0.2)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 12,
                color: "var(--color-text-muted)",
                textAlign: "left",
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              <strong style={{ color: "var(--color-primary)", display: "block", marginBottom: 4 }}>
                How to punch this into your meter CIU:
              </strong>
              1. Type the 20 digits above on your keypad.<br />
              2. Press the blue or ↵ (Enter) key.<br />
              3. The screen will display &apos;Accept&apos; and your new balance.
            </div>

            <Link href="/" className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>
              Done
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

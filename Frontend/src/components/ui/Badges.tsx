"use client";

import type { PaymentAttemptStatus, PaymentChannel } from "@/types/domain";

const STATUS_CONFIG: Record<
  PaymentAttemptStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  Confirmed: {
    label: "Confirmed",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.2)",
  },
  Initiated: {
    label: "Initiated",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.2)",
  },
  Failed: {
    label: "Failed",
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.2)",
  },
  Expired: {
    label: "Expired",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.15)",
  },
  Reversed: {
    label: "Reversed",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.1)",
    border: "rgba(251,146,60,0.2)",
  },
};

const CHANNEL_LABELS: Record<PaymentChannel, string> = {
  MpesaPaybill: "M-Pesa",
  AirtelMoneyPaybill: "Airtel",
  ScanToPay: "QR Scan",
  Ussd: "USSD",
};

export function StatusBadge({ status }: { status: PaymentAttemptStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Expired;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        letterSpacing: "0.02em",
      }}
    >
      {cfg.label}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: PaymentChannel }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 600,
        color: "var(--color-text-muted)",
        background: "rgba(148,163,184,0.08)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      {CHANNEL_LABELS[channel] ?? channel}
    </span>
  );
}

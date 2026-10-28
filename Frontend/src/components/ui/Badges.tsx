"use client";

import type { PaymentAttemptStatus, PaymentChannel } from "@/types/domain";

const STATUS_CONFIG: Record<
  PaymentAttemptStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Confirmed: {
    label: "Confirmed",
    color: "#047857",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    dot: "#10b981",
  },
  Initiated: {
    label: "Initiated",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    dot: "#0ea5e9",
  },
  Failed: {
    label: "Failed",
    color: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
    dot: "#f43f5e",
  },
  Expired: {
    label: "Expired",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1",
    dot: "#94a3b8",
  },
  Reversed: {
    label: "Reversed",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    dot: "#f59e0b",
  },
};

const CHANNEL_CONFIG: Record<PaymentChannel, { label: string; color: string; bg: string; border: string }> = {
  MpesaPaybill: {
    label: "M-Pesa Paybill",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  ScanToPay: {
    label: "Scan-to-Pay",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  AirtelMoneyPaybill: {
    label: "Airtel Money",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  Ussd: {
    label: "USSD",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
};

export function StatusBadge({ status }: { status: PaymentAttemptStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Expired;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: cfg.dot,
        }}
      />
      {cfg.label}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: PaymentChannel }) {
  const cfg = CHANNEL_CONFIG[channel] ?? {
    label: channel,
    color: "#475569",
    bg: "#f1f5f9",
    border: "#e2e8f0",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

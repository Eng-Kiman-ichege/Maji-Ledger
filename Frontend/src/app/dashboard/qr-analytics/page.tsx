import type { Metadata } from "next";
import QrAnalyticsClient from "./QrAnalyticsClient";

export const metadata: Metadata = {
  title: "Scan-to-Pay QR Analytics | Maji Ledger",
  description: "Physical meter QR deployment traceability, conversion metrics, and fulfillment analytics.",
};

export const instant = false;

export default function QrAnalyticsPage() {
  return <QrAnalyticsClient />;
}

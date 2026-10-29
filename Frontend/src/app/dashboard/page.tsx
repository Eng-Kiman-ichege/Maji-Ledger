import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardOverviewClient from "./DashboardOverviewClient";

export const metadata: Metadata = {
  title: "Dashboard | Maji Ledger",
  description:
    "Maji Ledger management dashboard — live overview of properties, meters, payments, and tokens.",
};

export const instant = false;

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "#64748b" }}>Loading overview...</div>}>
      <DashboardOverviewClient />
    </Suspense>
  );
}

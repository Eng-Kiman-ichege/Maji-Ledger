import type { Metadata } from "next";
import { Suspense } from "react";
import OwnerDashboardClient from "./OwnerDashboardClient";

export const metadata: Metadata = {
  title: "Property Owner Portal | Maji Ledger",
  description: "Property owner dashboard scoped strictly to authorized properties with statements and QR analytics.",
};

export const instant = false;

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px 36px", color: "#64748b" }}>Loading owner portal...</div>}>
      <OwnerDashboardClient />
    </Suspense>
  );
}

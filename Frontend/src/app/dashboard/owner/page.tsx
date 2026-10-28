import type { Metadata } from "next";
import OwnerDashboardClient from "./OwnerDashboardClient";

export const metadata: Metadata = {
  title: "Property Owner Portal | Maji Ledger",
  description: "Property owner dashboard scoped strictly to authorized properties with statements and QR analytics.",
};

export default function OwnerDashboardPage() {
  return <OwnerDashboardClient />;
}

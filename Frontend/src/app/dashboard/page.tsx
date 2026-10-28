import type { Metadata } from "next";
import DashboardOverviewClient from "./DashboardOverviewClient";

export const metadata: Metadata = {
  title: "Dashboard | Maji Ledger",
  description:
    "Maji Ledger management dashboard — live overview of properties, meters, payments, and tokens.",
};

export default function DashboardPage() {
  return <DashboardOverviewClient />;
}

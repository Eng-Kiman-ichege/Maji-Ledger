import type { Metadata } from "next";
import MetersClient from "./MetersClient";

export const metadata: Metadata = {
  title: "Meters | Maji Ledger",
  description: "View and manage all registered water meters across your portfolio.",
};

export default function MetersPage() {
  return <MetersClient />;
}

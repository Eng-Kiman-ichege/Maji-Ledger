import type { Metadata } from "next";
import PaymentsClient from "./PaymentsClient";

export const metadata: Metadata = {
  title: "Transactions | Maji Ledger",
  description: "View all payment transactions, STS token records, and billing history.",
};

export default function PaymentsPage() {
  return <PaymentsClient />;
}

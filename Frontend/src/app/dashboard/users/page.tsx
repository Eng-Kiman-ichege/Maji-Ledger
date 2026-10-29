import type { Metadata } from "next";
import { Suspense } from "react";
import UsersClient from "./UsersClient";

export const metadata: Metadata = {
  title: "User Management | Maji Ledger",
  description: "Manage system administrators and property owner credentials with property-scoping access.",
};

export const instant = false;

export default function UsersPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px 36px", color: "#64748b" }}>Loading user management...</div>}>
      <UsersClient />
    </Suspense>
  );
}

import type { ReactNode } from "react";
import { Suspense } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>
        <Suspense fallback={<div style={{ padding: 32, color: "#64748b" }}>Loading dashboard...</div>}>
          {children}
        </Suspense>
      </DashboardShell>
    </AuthGuard>
  );
}

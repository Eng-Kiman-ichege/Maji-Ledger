import type { ReactNode } from "react";
import { Suspense } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f0f7ff 0%, #f8fafc 280px, #f8fafc 100%)",
      }}
    >
      <DashboardSidebar />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: "hidden",
          background: "transparent",
        }}
      >
        <Suspense fallback={<div style={{ padding: 32, color: "#64748b" }}>Loading dashboard...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

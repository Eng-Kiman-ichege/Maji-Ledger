import type { ReactNode } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar />
      <main
        style={{
          flex: 1,
          overflowX: "hidden",
          background: "var(--color-surface-base)",
        }}
      >
        {children}
      </main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Droplets } from "lucide-react";

interface Props {
  /** If set, only users with one of these roles can view this content */
  allowedRoles?: string[];
  children: React.ReactNode;
}

export default function AuthGuard({ allowedRoles, children }: Props) {
  const { user, isLoading, activeSuite } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to the role-appropriate dashboard
      if (user.role === "Owner") {
        router.replace(activeSuite === "water" ? "/dashboard/landlord/water" : "/dashboard/landlord");
      } else if (user.role === "Tenant") {
        router.replace(activeSuite === "water" ? "/dashboard/tenant/water" : "/dashboard/tenant");
      } else {
        router.replace(activeSuite === "water" ? "/dashboard/water" : "/dashboard");
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #f0f7ff 0%, #f8fafc 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <Droplets size={36} color="#0284c7" />
          <p style={{ marginTop: 12, fontSize: 14 }}>Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // redirect in progress
  }

  return <>{children}</>;
}

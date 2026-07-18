import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/lib/useProfile";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile();

  if (loading) return null;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;

  return children;
}

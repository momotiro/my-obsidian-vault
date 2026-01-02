"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "staff" | "manager";
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }

    if (!isLoading && user && requireRole === "manager" && user.role !== "manager") {
      router.push("/reports");
    }
  }, [user, isLoading, router, requireRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireRole === "manager" && user.role !== "manager")) {
    return null;
  }

  return <>{children}</>;
}

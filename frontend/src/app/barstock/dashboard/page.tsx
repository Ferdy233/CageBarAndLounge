"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Dashboard } from "@/barstock_pages/Dashboard";

export default function BarstockDashboardPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/barstock/dashboard/inventory");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) return null;
  if (!isAdmin) return null;
  return <Dashboard />;
}

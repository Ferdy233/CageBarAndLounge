"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { EndOfDay } from "@/barstock_pages/EndOfDay";

export default function EndOfDayPage() {
  const router = useRouter();
  const { isSupervisor, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isSupervisor) {
      router.replace("/barstock/dashboard/inventory");
    }
  }, [isSupervisor, isLoading, router]);

  if (isLoading) return null;
  if (!isSupervisor) return null;

  return <EndOfDay />;
}

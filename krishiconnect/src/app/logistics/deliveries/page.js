"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogisticsDeliveriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/logistics/requests?tab=active");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="text-4xl animate-bounce">🚚</div>
        <p className="mt-3 text-slate-600 font-medium">Opening Active Deliveries...</p>
      </div>
    </main>
  );
}

